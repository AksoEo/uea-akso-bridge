<?php
namespace Grav\Plugin\AksoBridge;

use Grav\Plugin\AksoBridge\Form;
use Grav\Plugin\AksoBridge\Utils;

// TODO: use form nonce

// The membership registration page
class Registration extends Form {
    private const STEP = 'p';
    private const STEP_OFFERS = '1';
    private const STEP_SUMMARY = '2';
    private const STEP_ENTRY_CREATE = 'create_entry';
    private const DATAID = 'dataId';
    private const ADDONS = 'aldonebloj';
    private const PAYMENT_SUCCESS_RETURN = 'payment_success_return';

    private const CODEHOLDER_FIELDS = [
        'firstNameLegal', 'lastNameLegal', 'honorific', 'birthdate', 'email',
        'cellphone', 'feeCountry', 'address.country', 'address.countryArea',
        'address.city', 'address.cityArea', 'address.postalCode', 'address.sortingCode',
        'address.streetAddress',
    ];

    private $plugin;

    public function __construct($plugin, $app) {
        parent::__construct($app);
        $this->plugin = $plugin;
        $this->locale = $plugin->locale['registration'];
    }

    // state array: stores the current user input and some derived data
    // keys:
    // - codeholder: codeholder data for new members (form page 1)
    // - offers: selected offers (form page 2)
    private $state;

    private function readSafe($typechk, $obj, $key) {
        $keyParts = explode('.', $key);
        $keyPart = $keyParts[0];
        if (!isset($obj[$keyPart])) return null;
        if (count($keyParts) > 1) {
            if (gettype($obj[$keyPart]) !== 'array') return null;
            return $this->readSafe($typechk, $obj[$keyPart], implode('.', array_slice($keyParts, 1)));
        }
        if (gettype($obj[$keyPart]) !== $typechk) return null;
        return $obj[$keyPart];
    }

    private function loadAllOffers($skipOffers = false) {
        $fields = ['year', 'paymentOrgId', 'currency'];
        if (!$skipOffers) $fields[] = 'offers';
        $res = $this->app->bridge->get('/registration/options', array(
            'limit' => 100,
            'filter' => ['enabled' => true],
            'fields' => $fields,
            'order' => [['year', 'asc']],
        ));
        if ($res['k']) {
            $offerYears = $res['b'];

            $scriptCtx = new FormScriptExecCtx($this->app);
            {
                $codeholder = $this->state['codeholder'];
                $scriptCtx->setFormVar('birthdate', $codeholder['birthdate']);

                $age = null;
                $agePrimo = null;
                {
                    $birthdate = \DateTime::createFromFormat('Y-m-d', $codeholder['birthdate']);
                    if ($birthdate) {
                        $now = new \DateTime();
                        $age = (int) $birthdate->diff($now)->format('y');

                        $beginningOfYear = new \DateTime();
                        $beginningOfYear->setISODate($now->format('Y'), 1, 1);
                        $agePrimo = (int) $birthdate->diff($beginningOfYear)->format('y');
                    }
                }
                $scriptCtx->setFormVar('age', $age);
                $scriptCtx->setFormVar('agePrimo', $agePrimo);
                $scriptCtx->setFormVar('feeCountry', $codeholder['feeCountry']);

                // TODO: fetch these variables
                $scriptCtx->setFormVar('feeCountryGroups', []);
                $scriptCtx->setFormVar('isActiveMember', false);

                $currency = $this->state['currency'];

                foreach ($offerYears as &$offerYear) {
                    if (!isset($offerYear['offers'])) continue;
                    $yearCurrency = $offerYear['currency'];

                    foreach ($offerYear['offers'] as &$offerGroup) {
                        if (gettype($offerGroup['description']) === 'string') {
                            $offerGroup['description'] = $this->app->bridge->renderMarkdown(
                                $offerGroup['description'],
                                ['emphasis', 'strikethrough', 'link'],
                            )['c'];
                        }

                        foreach ($offerGroup['offers'] as &$offer) {
                            if (!isset($offer['price'])) continue;

                            if ($offer['price']) {
                                if (gettype($offer['price']['description']) === 'string') {
                                    $offer['price']['description'] = $this->app->bridge->renderMarkdown(
                                        $offer['price']['description'],
                                        ['emphasis', 'strikethrough'],
                                    )['c'];
                                }

                                $scriptCtx->pushScript($offer['price']['script']);
                                $result = $scriptCtx->eval(array(
                                    't' => 'c',
                                    'f' => 'id',
                                    'a' => [$offer['price']['var']],
                                ));
                                $scriptCtx->popScript();

                                if ($result['s']) {
                                    $convertedValue = $this->convertCurrency(
                                        $yearCurrency,
                                        $currency,
                                        $result['v']
                                    );
                                    $offer['price']['value'] = $convertedValue;
                                    $scriptCtx->pushScript(array(
                                        'currency' => array('t' => 's', 'v' => $currency),
                                        'value' => array('t' => 'n', 'v' => $convertedValue),
                                    ));
                                    $offer['price']['amount'] = $scriptCtx->eval(array(
                                        't' => 'c',
                                        'f' => 'currency_fmt',
                                        'a' => ['currency', 'value'],
                                    ))['v'];
                                    $scriptCtx->popScript();
                                } else {
                                    $offer['price']['value'] = null;
                                    $offer['price']['amount'] = '(Eraro)';
                                }
                            }
                        }
                    }
                }
            }

            return $offerYears;
        }
        return [];
    }
    private function getOfferCategoryIds($offerYears) {
        $ids = new \Ds\Set();
        foreach ($offerYears as $year) {
            foreach ($year['offers'] as $group) {
                foreach ($group['offers'] as $offer) {
                    if ($offer['type'] === 'membership') {
                        $ids->add($offer['id']);
                    }
                }
            }
        }
        return $ids;
    }
    private function getRegisteredOfferCategoryIds($offerYears) {
        $ids = new \Ds\Set();
        foreach ($offerYears as $yearItems) {
            foreach ($yearItems as $offer) {
                if ($offer['type'] === 'membership') $ids->add($offer['id']);
            }
        }
        return $ids;
    }
    private function getOfferAddonIds($offerYears) {
        $orgs = new \Ds\Map();
        foreach ($offerYears as $year) {
            $ids = new \Ds\Set();
            foreach ($year['offers'] as $group) {
                foreach ($group['offers'] as $offer) {
                    if ($offer['type'] === 'addon') {
                        $ids->add($offer['id']);
                    }
                }
            }
            if (!$ids->isEmpty()) {
                $orgId = $year['paymentOrgId'];
                if (!$orgs->hasKey($orgId)) $orgs->put($orgId, new \Ds\Set());
                $orgs->put($orgId, $orgs->get($orgId)->union($ids));
            }
        }
        return $orgs;
    }
    private function getRegisteredOfferAddonIds($offerYears) {
        $orgs = new \Ds\Map();
        foreach ($offerYears as $year => $yearItems) {
            $ids = new \Ds\Set();
            foreach ($yearItems as $offer) {
                if ($offer['type'] === 'addon') $ids->add($offer['id']);
            }
            if (!$ids->isEmpty()) {
                $orgId = $this->offersByYear[$year]['paymentOrgId'];
                if (!$orgs->hasKey($orgId)) $orgs->put($orgId, new \Ds\Set());
                $orgs->put($orgId, $orgs->get($orgId)->union($ids));
            }
        }
        return $orgs;
    }
    private function loadAllCategories($ids) {
        $categories = [];
        for ($i = 0; true; $i += 100) {
            $res = $this->app->bridge->get("/membership_categories", array(
                'fields' => ['id', 'nameAbbrev', 'name', 'description', 'lifetime', 'givesMembership'],
                'filter' => ['id' => ['$in' => $ids->slice(0, 100)->toArray()]],
                'limit' => 100,
                'offset' => $i,
            ), 120);
            if (!$res['k']) {
                // TODO: emit error
                break;
            }
            foreach ($res['b'] as $cat) {
                if (gettype($cat['description']) === 'string') {
                    $cat['description'] = $this->app->bridge->renderMarkdown(
                        $cat['description'],
                        ['emphasis', 'strikethrough', 'link'],
                    )['c'];
                }

                $categories[$cat['id']] = $cat;
                $ids->remove($cat['id']);
            }
            if ($ids->isEmpty()) break;
        }

        return $categories;
    }
    private function loadAllAddons($orgs) {
        $result = [];
        foreach ($orgs->keys()->toArray() as $orgId) {
            $ids = $orgs->get($orgId);
            $addons = [];
            for ($i = 0; true; $i += 100) {
                $res = $this->app->bridge->get("/aksopay/payment_orgs/$orgId/addons", array(
                    'fields' => ['id', 'name', 'description'],
                    'filter' => ['id' => ['$in' => $ids->slice(0, 100)->toArray()]],
                    'limit' => 100,
                    'offset' => $i,
                ), 120);
                if (!$res['k']) {
                    // TODO: emit error
                    break;
                }
                foreach ($res['b'] as $addon) {
                    if (gettype($addon['description']) === 'string') {
                        $addon['description'] = $this->app->bridge->renderMarkdown(
                            $addon['description'],
                            ['emphasis', 'strikethrough', 'link', 'list', 'table'],
                        )['c'];
                    }

                    $addons[$addon['id']] = $addon;
                    $ids->remove($addon['id']);
                }
                if ($ids->isEmpty()) break;
            }
            $result[$orgId] = $addons;
        }
        return $result;
    }
    private function loadPaymentOrgs($orgs) {
        $result = [];
        foreach ($orgs->toArray() as $orgId) {
            $res = $this->app->bridge->get("/aksopay/payment_orgs/$orgId", array(
                'fields' => ['id', 'org', 'name'],
            ));
            if (!$res['k']) {
                // TODO: error?
                break;
            }
            $orgInfo = $res['b'];
            $methods = [];

            for ($i = 0; true; $i += 100) {
                $res = $this->app->bridge->get("/aksopay/payment_orgs/$orgId/methods", array(
                    'fields' => ['id', 'type', 'name', 'description', 'currencies'],
                    'limit' => 100,
                    'offset' => $i,
                ), 120);
                if (!$res['k']) {
                    // TODO: emit error
                    break;
                }
                foreach ($res['b'] as $method) {
                    if (gettype($method['description']) === 'string') {
                        $method['description'] = $this->app->bridge->renderMarkdown(
                            $method['description'],
                            ['emphasis', 'strikethrough', 'link', 'list', 'table'],
                        )['c'];
                    }

                    $methods[$method['id']] = $method;
                }
                if (count($methods) >= $res['h']['x-total-items']) {
                    break;
                }
            }
            $orgInfo['methods'] = $methods;
            $result[$orgId] = $orgInfo;
        }
        return $result;
    }

    public function loadRegistered($dataIds, $addons) {
        $needsLogin = false;
        $currency = '';
        $hasCodeholder = false;
        $codeholder = [];
        $offersByYear = [];
        $yearDataIds = [];
        $yearStatuses = [];

        $scriptCtx = new FormScriptExecCtx($this->app);
        $offersSum = 0;

        foreach ($dataIds as $id) {
            $res = $this->app->bridge->get("/registration/entries/$id", array(
                'fields' => ['year', 'currency', 'codeholderData', 'offers', 'status'],
            ));
            if ($res['k']) {
                // ignore duplicate year
                if (isset($offersByYear[$res['b']['year']])) continue;
                if (!$hasCodeholder) {
                    $hasCodeholder = $res['b']['codeholderData'];
                    if (gettype($res['b']['codeholderData']) === 'integer') {
                        if (!$this->plugin->aksoUser || $this->plugin->aksoUser['id'] != $res['b']['codeholderData']) {
                            $needsLogin = true;
                        } else {
                            $chId = $res['b']['codeholderData'];
                            $chRes = $this->app->bridge->get("/codeholders/$chId", array(
                                'fields' => self::CODEHOLDER_FIELDS,
                            ));
                            if ($chRes['k']) {
                                $codeholder = $chRes['b'];
                                $codeholder['splitCountry'] = true;
                            }
                        }
                    } else {
                        $codeholder = $res['b']['codeholderData'];
                    }
                } else {
                    // ignore incorrect codeholder
                    if ($res['b']['codeholderData'] != $hasCodeholder) continue;
                }

                $currency = $res['b']['currency'];
                $selectedItems = [];
                foreach ($res['b']['offers'] as $offer) {
                    $offersSum += $offer['amount'];
                    $scriptCtx->pushScript(array(
                        'currency' => array('t' => 's', 'v' => $res['b']['currency']),
                        'value' => array('t' => 'n', 'v' => $offer['amount']),
                    ));
                    $offer['amount_rendered'] = $scriptCtx->eval(array(
                        't' => 'c',
                        'f' => 'currency_fmt',
                        'a' => ['currency', 'value'],
                    ))['v'];
                    $scriptCtx->popScript();
                    $selectedItems[] = $offer;
                }

                if (isset($addons[$res['b']['year']])) {
                    foreach ($addons[$res['b']['year']] as $addon) {
                        $offersSum += $addon['amount'];
                        $scriptCtx->pushScript(array(
                            'currency' => array('t' => 's', 'v' => $res['b']['currency']),
                            'value' => array('t' => 'n', 'v' => $addon['amount']),
                        ));
                        $addon['amount_rendered'] = $scriptCtx->eval(array(
                            't' => 'c',
                            'f' => 'currency_fmt',
                            'a' => ['currency', 'value'],
                        ))['v'];
                        $scriptCtx->popScript();
                        $selectedItems[] = $addon;
                    }
                }

                $offersByYear[$res['b']['year']] = $selectedItems;
                $yearDataIds[$res['b']['year']] = $id;
                $yearStatuses[$res['b']['year']] = $res['b']['status'];
            }
        }

        $offersSumRendered;
        {
            $scriptCtx->pushScript(array(
                'currency' => array('t' => 's', 'v' => $currency),
                'value' => array('t' => 'n', 'v' => $offersSum),
            ));
            $offersSumRendered = $scriptCtx->eval(array(
                't' => 'c',
                'f' => 'currency_fmt',
                'a' => ['currency', 'value'],
            ))['v'];
            $scriptCtx->popScript();
        }

        return array(
            'needs_login' => $needsLogin,
            'currency' => $currency,
            'codeholder' => $codeholder,
            'offers' => $offersByYear,
            'year_statuses' => $yearStatuses,
            'dataIds' => $yearDataIds,
            'offers_sum' => $offersSum,
            'offers_sum_rendered' => $offersSumRendered,
        );
    }

    private $offers = null;
    private $offersByYear = null;
    private $paymentOrgs = null;

    public function update() {
        // TODO: split this method up

        $step = 'init';
        $this->state = array('step' => 0);

        $creatingEntry = false;

        $this->state['dataIds'] = [];
        if (isset($_GET[self::DATAID]) && gettype($_GET[self::DATAID]) === 'string') {
            $this->state['dataIds'] = explode('-', $_GET[self::DATAID]);
            $this->state['step'] = 3;
        }
        $this->state['registered'] = count($this->state['dataIds']) > 0;
        $registered = $this->state['registered'];

        $editTarget = $this->plugin->getGrav()['uri']->path();
        if (count($this->state['dataIds'])) {
            $editTarget .= '?' . self::DATAID . '=' . implode('-', $this->state['dataIds']);
        }

        if (isset($_GET[self::PAYMENT_SUCCESS_RETURN])) {
            $_SESSION[self::PAYMENT_SUCCESS_RETURN] = true;
            // redirect to the same page without payment_success_retunr
            $this->plugin->getGrav()->redirectLangSafe($editTarget, 302);
        }
        if (isset($_SESSION[self::PAYMENT_SUCCESS_RETURN])) {
            // this is the payment success page
            $this->state['payment_success'] = true;
            unset($_SESSION[self::PAYMENT_SUCCESS_RETURN]);
        }

        if (isset($_GET[self::STEP]) && gettype($_GET[self::STEP]) === 'string') {
            $step = $_GET[self::STEP];
            if (!$registered) {
                // TODO: validate before allowing step forward
                if ($step === self::STEP_OFFERS) $this->state['step'] = 1;
                if ($step === self::STEP_SUMMARY) $this->state['step'] = 2;
                if ($step === self::STEP_ENTRY_CREATE) {
                    $this->state['step'] = 2;
                    $creatingEntry = true;
                }
            }
        }

        $serializedState = [];
        if (isset($_POST['state_serialized'])) {
            try {
                $decoded = json_decode($_POST['state_serialized'], true);
                if (gettype($decoded) === 'array') $serializedState = $decoded;
            } catch (\Exception $e) {}
        }

        if ($this->state['registered']) {
            $addons = [];
            if (isset($_GET[self::ADDONS]) && gettype($_GET[self::ADDONS]) === 'string') {
                $yearStrings = explode('~', $_GET[self::ADDONS]);
                foreach ($yearStrings as $yearString) {
                    // + turns into spaces
                    $parts = explode(' ', $yearString);
                    if (count($parts) < 2) continue;
                    $year = (int) $parts[0];
                    $yearItems = [];
                    foreach (array_slice($parts, 1) as $addonString) {
                        $addonData = explode('-', $addonString);
                        if (count($addonData) != 2) continue;
                        $addonId = (int) $addonData[0];
                        $addonAmount = (int) $addonData[1];
                        $yearItems[] = array('type' => 'addon' , 'id' => $addonId, 'amount' => $addonAmount);
                    }
                    $addons[$year] = $yearItems;
                }
            }

            $serializedState = $this->loadRegistered($this->state['dataIds'], $addons);
            $this->state['needs_login'] = $serializedState['needs_login'];
            $this->state['dataIds'] = $serializedState['dataIds'];
            $this->state['year_statuses'] = $serializedState['year_statuses'];
        }

        $currencies = $this->getCachedCurrencies();
        $this->state['currency'] = array_keys($currencies)[0]; // default
        if (isset($_POST['currency'])
            && gettype($_POST['currency']) === 'string'
            && isset($currencies[$_POST['currency']])) {
            $this->state['currency'] = $_POST['currency'];
        } else if (isset($serializedState['currency'])
            && gettype($serializedState['currency']) === 'string'
            && isset($currencies[$serializedState['currency']])) {
            $this->state['currency'] = $serializedState['currency'];
        }

        // render a “0,00” placeholder for currency inputs
        {
            // kinda hacky but it works
            $this->state['currency_placeholder'] = '0';
            $mult = $currencies[$this->state['currency']];
            if ($mult > 1) $this->state['currency_placeholder'] .= ',';
            while ($mult > 1) {
                $mult /= 10;
                $this->state['currency_placeholder'] .= '0';
            }
        }

        $currencyMult = $currencies[$this->state['currency']];

        $ch = [];
        if (!$registered && $this->plugin->aksoUser) {
            $codeholderId = $this->plugin->aksoUser['id'];
            $res = $this->app->bridge->get("/codeholders/$codeholderId", array(
                'fields' => self::CODEHOLDER_FIELDS,
            ));
            if ($res['k']) {
                $ch = $res['b'];
                $ch['splitCountry'] = true; // always read address and fee country separately
                $ch['splitName'] = true;
            }
        } else if (!$registered && isset($_POST['codeholder']) && gettype($_POST['codeholder']) === 'array') {
            $ch = $_POST['codeholder'];
        } else {
            $ch = (isset($serializedState['codeholder']) && gettype($serializedState['codeholder']) === 'array')
                ? $serializedState['codeholder']
                : [];
            $ch['splitCountry'] = true;
            $ch['splitName'] = true;
        }

        {
            $this->state['codeholder'] = array(
                'firstName' => $this->readSafe('string', $ch, 'firstName'),
                'lastName' => $this->readSafe('string', $ch, 'lastName'),
                'firstNameLegal' => (isset($ch['splitName']) && $ch['splitName'])
                    ? $this->readSafe('string', $ch, 'firstNameLegal')
                    : $this->readSafe('string', $ch, 'firstName'),
                'lastNameLegal' => isset($ch['splitName']) && $ch['splitName']
                    ? $this->readSafe('string', $ch, 'lastNameLegal')
                    : $this->readSafe('string', $ch, 'lastName'),
                'honorific' => $this->readSafe('string', $ch, 'honorific'),
                'birthdate' => $this->readSafe('string', $ch, 'birthdate'),
                'email' => $this->readSafe('string', $ch, 'email'),
                'cellphone' => $this->readSafe('string', $ch, 'cellphone'),
                'feeCountry' => $this->readSafe('string', $ch, 'feeCountry'),
                'address' => array(
                    'country' => (isset($ch['splitCountry']) && $ch['splitCountry'])
                        ? $this->readSafe('string', $ch, 'address.country')
                        : $this->readSafe('string', $ch, 'feeCountry'),
                    'countryArea' => $this->readSafe('string', $ch, 'address.countryArea'),
                    'city' => $this->readSafe('string', $ch, 'address.city'),
                    'cityArea' => $this->readSafe('string', $ch, 'address.cityArea'),
                    'postalCode' => $this->readSafe('string', $ch, 'address.postalCode'),
                    'sortingCode' => $this->readSafe('string', $ch, 'address.sortingCode'),
                    'streetAddress' => $this->readSafe('string', $ch, 'address.streetAddress'),
                ),
            );

            $addressFmt = '';
            try {
                $addr = $this->state['codeholder']['address'];
                $countryName = '';
                foreach ($this->getCachedCountries() as $entry) {
                    if ($entry['code'] == $addr['country']) {
                        $countryName = $entry['name_eo'];
                        break;
                    }
                }
                $addressFmt = $this->app->bridge->renderAddress(array(
                    'countryCode' => $addr['country'],
                    'countryArea' => $addr['countryArea'],
                    'city' => $addr['city'],
                    'cityArea' => $addr['cityArea'],
                    'streetAddress' => $addr['streetAddress'],
                    'postalCode' => $addr['postalCode'],
                    'sortingCode' => $addr['sortingCode'],
                ), $countryName)['c'];
                $addressFmt = implode(', ', explode("\n", $addressFmt));
            } catch (\Exception $e) {
                // FIXME: this
                $addressFmt = '(Nevalida adreso)';
            }

            $feeCountryName = '';
            foreach ($this->getCachedCountries() as $entry) {
                if ($entry['code'] == $this->state['codeholder']['feeCountry']) {
                    $feeCountryName = $entry['name_eo'];
                    break;
                }
            }
            $this->state['codeholder_derived'] = array(
                'birthdate' => Utils::formatDate($this->state['codeholder']['birthdate']),
                'address' => $addressFmt,
                'fee_country' => $feeCountryName,
            );
        }

        $this->state['offers'] = [];
        if ($registered) {
            $this->state['offers'] = $serializedState['offers'];
            $this->state['offers_sum'] = $serializedState['offers_sum'];
            $this->state['offers_sum_rendered'] = $serializedState['offers_sum_rendered'];
        } else if (isset($_POST['offers']) && gettype($_POST['offers']) === 'array') {
            foreach ($_POST['offers'] as $_year => $yearItems) {
                $year = (int) $_year;
                $this->state['offers'][$year] = [];

                // key format: [year][group][offer][type-id]
                foreach ($yearItems as $groupIndex => $groupItems) {
                    if ($groupIndex === 'membership') {
                        // this is the givesMembership radio selection
                        if (gettype($groupItems) !== 'string') continue;
                        $offerKeyParts = explode('-', $groupItems);
                        if (count($offerKeyParts) != 4) continue;
                        $groupIndex = (int) $offerKeyParts[0];
                        $offerIndex = (int) $offerKeyParts[1];
                        $type = $offerKeyParts[2];
                        $id = (int) $offerKeyParts[3];

                        if ($type !== 'membership' && $type !== 'addon') continue;

                        $amount = null;
                        if (isset($_POST['offer_amount'])) {
                            $k = "$year-$groupIndex-$offerIndex";
                            if (isset($_POST['offer_amount'][$k])) {
                                $amount = (int) (floatval($_POST['offer_amount'][$k]) * $currencyMult);
                            }
                        }

                        $this->state['offers'][$year]["$groupIndex-$offerIndex"] = array(
                            'type' => $type,
                            'id' => $id,
                            'amount' => $amount,
                        );

                        continue;
                    }

                    if (gettype($groupItems) !== 'array') continue;
                    foreach ($groupItems as $offerIndex => $offerData) {
                        if (gettype($offerData) !== 'array') continue;

                        $offerKeys = array_keys($offerData);
                        if (count($offerKeys) != 1) continue;
                        $offerKey = $offerKeys[0];

                        $offerKeyParts = explode('-', $offerKey);
                        if (count($offerKeyParts) != 2) continue;
                        $type = $offerKeyParts[0];
                        $id = (int) $offerKeyParts[1];

                        if ($type !== 'membership' && $type !== 'addon') continue;

                        $amount = null;
                        if (isset($_POST['offer_amount'])) {
                            $k = "$year-$groupIndex-$offerIndex";
                            if (isset($_POST['offer_amount'][$k])) {
                                $amount = (int) (floatval($_POST['offer_amount'][$k]) * $currencyMult);
                            }
                        }

                        $this->state['offers'][$year]["$groupIndex-$offerIndex"] = array(
                            'type' => $type,
                            'id' => $id,
                            'amount' => $amount,
                        );
                    }
                }
            }
        } else if (isset($serializedState['offers']) && gettype($serializedState['offers']) === 'array') {
            foreach ($serializedState['offers'] as $year => $yearItems) {
                if (gettype($yearItems) !== 'array') continue;
                $items = [];
                foreach ($yearItems as $key => $item) {
                    if (gettype($item) !== 'array') continue 2;
                    $keyParts = explode('-', $key);
                    if (count($keyParts) != 2) continue;
                    $group = $keyParts[0];
                    $id = $keyParts[1];
                    if (!isset($item['type']) || gettype($item['type']) !== 'string') continue;
                    if (!isset($item['id']) || gettype($item['id']) !== 'integer') continue;
                    $items["$group-$id"] = array(
                        'type' => $item['type'],
                        'id' => $item['id'],
                        'amount' => isset($item['amount']) ? ((float) $item['amount']) : null,
                    );
                }
                if (!empty($items)) $this->state['offers'][$year] = $items;
            }
        }

        if ($registered) {
            $this->offers = $this->loadAllOffers(true);
            $this->offersByYear = [];
            foreach ($this->offers as $offerYear) {
                $this->offersByYear[$offerYear['year']] = $offerYear;
            }

            $paymentOrgIds = new \Ds\Set();
            foreach ($this->offers as $offerYear) {
                if (!isset($this->state['year_statuses'][$offerYear['year']])) continue;
                $paymentOrgIds->add($offerYear['paymentOrgId']);
            }
            $this->paymentOrgs = $this->loadPaymentOrgs($paymentOrgIds);
            $scriptCtx = new FormScriptExecCtx($this->app);

            // add additional derived data to payment orgs
            foreach ($this->paymentOrgs as &$org) {
                $org['years'] = [];
                $org['statuses'] = [];
                $org['can_pay'] = false;
                $org['offers_sum'] = 0;
                foreach ($this->offers as $offerYear) {
                    if ($offerYear['paymentOrgId'] == $org['id']) {
                        if (!isset($this->state['year_statuses'][$offerYear['year']])) continue;
                        $org['years'][] = $offerYear['year'];
                        $yearStatus = $this->state['year_statuses'][$offerYear['year']];
                        $org['statuses'][$offerYear['year']] = $yearStatus;
                        if ($yearStatus === 'submitted') $org['can_pay'] = true;

                        if (isset($this->state['offers'][$offerYear['year']])) {
                            $offers = $this->state['offers'][$offerYear['year']];
                            foreach ($offers as $offer) {
                                $org['offers_sum'] += $offer['amount'];
                            }
                        }
                    }
                }

                $scriptCtx->pushScript(array(
                    'currency' => array('t' => 's', 'v' => $this->state['currency']),
                    'value' => array('t' => 'n', 'v' => $org['offers_sum']),
                ));
                $org['offers_sum_rendered'] = $scriptCtx->eval(array(
                    't' => 'c',
                    'f' => 'currency_fmt',
                    'a' => ['currency', 'value'],
                ))['v'];
                $scriptCtx->popScript();
            }

            if (isset($_POST['payment_org']) && isset($_POST['payment_method_id']) && isset($_POST['payment_currency'])) {
                // the user clicked on the 'pay' button
                $paymentOrg = (int) $_POST['payment_org'];
                $paymentMethodId = (int) $_POST['payment_method_id'];
                $currency = (string) $_POST['payment_currency'];

                if (!isset($this->paymentOrgs[$paymentOrg])) {
                    // invalid
                    // TODO: handle error?
                    return;
                }
                $org = &$this->paymentOrgs[$paymentOrg];

                // TODO: validate method id and currency maybe?

                $codeholderId = null;
                $customerName = '';
                if ($this->plugin->aksoUser) {
                    $codeholderId = $this->plugin->aksoUser['id'];
                    $customerName = $this->plugin->aksoUserFormattedName;
                } else {
                    $customerName = [
                        $this->state['codeholder']['honorific'],
                        $this->state['codeholder']['firstNameLegal'],
                        $this->state['codeholder']['lastNameLegal'],
                    ];
                    $customerName = implode(' ', array_filter($customerName, function ($v) {
                        return !empty($v);
                    }));
                }

                $purposes = [];
                $addonPurposes = [];
                $categories = $this->loadAllCategories($this->getRegisteredOfferCategoryIds($this->state['offers']));
                foreach ($org['years'] as $year) {
                    $purposeTitle = $this->locale['payment_purpose_title_singular'] . ' ' . $org['years'][0];
                    $purposeDescription = '';

                    if (!isset($this->state['offers'][$year])) continue;
                    if ($this->state['year_statuses'][$year] !== 'submitted') continue;
                    $yearItems = $this->state['offers'][$year];
                    $sum = 0;
                    foreach ($yearItems as $offer) {
                        if ($offer['type'] === 'membership') {
                            if ($purposeDescription) $purposeDescription .= "\n";
                            $purposeDescription .= '- '; // render a list
                            if (isset($categories[$offer['id']])) {
                                $cat = $categories[$offer['id']];
                                $purposeDescription .= $cat['nameAbbrev'] . ' ' . $cat['name'];
                            } else {
                                $purposeDescription .= '(Eraro)';
                            }
                            $sum += $offer['amount'];
                        } else if ($offer['type'] === 'addon') {
                            $addonAmount = $this->convertCurrency($this->state['currency'], $currency, $offer['amount']);
                            $addonPurposes[] = array(
                                'type' => 'addon',
                                'paymentAddonId' => $offer['id'],
                                'amount' => $addonAmount,
                            );
                        } else {
                            $purposeDescription .= '(Eraro)';
                        }
                    }

                    if (!$sum) continue;

                    $convertedAmount = $this->convertCurrency($this->state['currency'], $currency, $sum);

                    $purposes[] = array(
                        'type' => 'trigger',
                        'title' => $purposeTitle,
                        'description' => $purposeDescription,
                        'amount' => $convertedAmount,
                        'triggerAmount' => array(
                            'currency' => $this->state['currency'],
                            'amount' => $sum,
                        ),
                        'triggers' => 'registration_entry',
                        'registrationEntryId' => Utils::base32_decode($this->state['dataIds'][$year]),
                    );
                }

                $res = $this->app->bridge->post('/aksopay/payment_intents', array(
                    'codeholderId' => $codeholderId,
                    'customer' => array(
                        'name' => $customerName,
                        'email' => $this->state['codeholder']['email'],
                    ),
                    'paymentOrgId' => $paymentOrg,
                    'paymentMethodId' => $paymentMethodId,
                    'currency' => $currency,
                    'customerNotes' => null,
                    'purposes' => array_merge($purposes, $addonPurposes),
                ), array(), []);

                if ($res['k']) {
                    $paymentId = $res['h']['x-identifier'];

                    $returnTarget = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") .
                        "://$_SERVER[HTTP_HOST]" . $editTarget;

                    $paymentsHost = $this->plugin->getGrav()['config']->get('plugins.akso-bridge.payments_host');
                    $redirectTarget = $paymentsHost . '/i/' . $paymentId . '?return=' . urlencode($returnTarget);
                    $this->plugin->getGrav()->redirectLangSafe($redirectTarget, 303);
                } else {
                    if ($res['sc'] === 400) $this->state['form_error'] = $this->locale['payment_error_bad_request'];
                    else if ($res['sc'] === 417) $this->state['form_error'] = $this->locale['payment_error_too_high'];
                    else if ($res['sc'] === 500) $this->state['form_error'] = $this->locale['payment_error_server_error'];
                    else $this->state['form_error'] = $this->locale['payment_error_generic'];
                }
            }
        } else if ($this->state['step'] >= 1 && !$registered) {
            $this->offers = $this->loadAllOffers();
            $this->offersByYear = [];
            foreach ($this->offers as $offerYear) {
                $this->offersByYear[$offerYear['year']] = $offerYear;
            }

            $this->state['offers_indexed'] = [];
            $this->state['offers_indexed_amounts'] = [];
            $this->state['offers_sum'] = 0;
            $scriptCtx = new FormScriptExecCtx($this->app);
            foreach ($this->state['offers'] as $year => &$yearItems) {
                $price_sum = 0;
                foreach ($yearItems as $key => &$offer) {
                    $keyParts = explode('-', $key);
                    $group = $keyParts[0];
                    $id = $keyParts[1];
                    $this->state['offers_indexed']["$year-$group-$id"] = true;
                    $this->state['offers_indexed_amounts']["$year-$group-$id"] = ((float) $offer['amount']) / $currencyMult;

                    if ($offer['type'] === 'membership') {
                        $apiOffer = null;
                        if (isset($this->offersByYear[$year]['offers'][$group]['offers'][$id])) {
                            $apiOffer = $this->offersByYear[$year]['offers'][$group]['offers'][$id];
                        }
                        if ($apiOffer) $offer['amount'] = $apiOffer['price']['value'];
                        else $offer['amount'] = 2147483647; // FIXME
                    } else if ($offer['type'] === 'addon') {
                        $scriptCtx->pushScript(array(
                            'currency' => array('t' => 's', 'v' => $this->state['currency']),
                            'value' => array('t' => 'n', 'v' => $offer['amount']),
                        ));
                        $offer['amount_rendered'] = $scriptCtx->eval(array(
                            't' => 'c',
                            'f' => 'currency_fmt',
                            'a' => ['currency', 'value'],
                        ))['v'];
                        $scriptCtx->popScript();
                    }

                    $this->state['offers_sum'] += $offer['amount'];
                }
            }

            {
                $scriptCtx->pushScript(array(
                    'currency' => array('t' => 's', 'v' => $this->state['currency']),
                    'value' => array('t' => 'n', 'v' => $this->state['offers_sum']),
                ));
                $this->state['offers_sum_rendered'] = $scriptCtx->eval(array(
                    't' => 'c',
                    'f' => 'currency_fmt',
                    'a' => ['currency', 'value'],
                ))['v'];
                $scriptCtx->popScript();
            }
        }

        if (!$registered) {
            $err = $this->getCodeholderError();

            if ($err) {
                $this->state['form_error'] = $err;
                $this->state['step'] = 0;
                $creatingEntry = false;
            } else if ($this->state['step'] >= 1) {
                $err = $this->getOfferError();

                if ($err) {
                    $this->state['form_error'] = $err;
                    $this->state['step'] = 1;
                    $creatingEntry = false;
                }
            }
        }

        if ($creatingEntry) {
            $errors = [];
            foreach ($this->state['offers'] as $year => &$yearItems) {
                $options = [];
                $options['year'] = (int) $year;
                $options['currency'] = $this->state['currency'];

                if ($this->plugin->aksoUser) {
                    $options['codeholderData'] = $this->plugin->aksoUser['id'];
                } else {
                    $options['codeholderData'] = $this->state['codeholder'];
                    foreach (array_keys($options['codeholderData']['address']) as $k) {
                        if (empty($options['codeholderData']['address'][$k])) {
                            unset($options['codeholderData']['address'][$k]);
                        }
                    }
                    foreach (array_keys($options['codeholderData']) as $k) {
                        // codeholder fields generally default to null instead of empty-string
                        if (gettype($options['codeholderData'][$k]) === 'string' && empty($options['codeholderData'][$k])) {
                            $options['codeholderData'][$k] = null;
                        }
                    }
                }

                $options['offers'] = [];
                $addons = [];
                foreach ($yearItems as $itemId => $itemData) {
                    $itemIdParts = explode('-', $itemId);
                    $groupIndex = $itemIdParts[0];
                    $offerIndex = $itemIdParts[1];

                    $data = array(
                        'type' => $itemData['type'],
                        'id' => $itemData['id'],
                        'amount' => $itemData['amount'],
                    );


                    if ($itemData['type'] === 'addon') {
                        $addons[] = $data;
                    } else {
                        $options['offers'][] = $data;
                    }
                }

                $res = $this->app->bridge->post('/registration/entries', $options, [], []);
                if ($res['k']) {
                    $this->state['dataIds'][$year] = $res['h']['x-identifier'];
                    $this->state['addons'][$year] = $addons;
                } else if (!$res['k']) {
                    if ($res['sc'] === 400) $errors[$year] = $this->localize('create_entry_bad_request');
                    else $errors[$year] = $this->localize('create_entry_internal_error');
                }
            }

            if (count($errors) > 0) {
                $this->state['form_error'] = '';
                foreach ($errors as $year => $err) {
                    $this->state['form_error'] .= '<div>' .
                        $this->localize('create_entry_year_failed', $year) .
                        htmlspecialchars($err) . '</div>';
                }
            } else if (count($this->state['dataIds']) > 0) {
                $dataIds = implode('-', $this->state['dataIds']);

                $addonsSerialized = '';
                foreach ($this->state['addons'] as $year => $addons) {
                    if ($addonsSerialized) $addonsSerialized .= '~';
                    $addonsSerialized .= $year;
                    foreach ($addons as $addon) {
                        $addonsSerialized .= '+' . $addon['id'] . '-' . $addon['amount'];
                    }
                }

                $route = $this->plugin->getGrav()['uri']->path() . '?' . self::DATAID . '=' . $dataIds .
                    '&' . self::ADDONS . '=' . $addonsSerialized;
                $this->plugin->getGrav()->redirectLangSafe($route, 303);
            }
        }

        $this->state['serialized'] = json_encode(array(
            'currency' => $this->state['currency'],
            'codeholder' => $this->state['codeholder'],
            'offers' => $this->state['offers'],
            'dataIds' => $this->state['dataIds'],
        ));
    }

    // Returns a best-effort error message for the codeholder data.
    private function getCodeholderError() {
        $ch = $this->state['codeholder'];

        if (empty(trim($ch['firstNameLegal']))) {
            return $this->localize('codeholder_error_name_required');
        }
        $birthdate = \DateTime::createFromFormat('Y-m-d', $ch['birthdate']);
        $now = new \DateTime();
        if (!$birthdate) {
            return $this->localize('codeholder_error_birthdate_required');
        }
        if ($birthdate->diff($now)->invert) {
            // this is a future date
            return $this->localize('codeholder_error_invalid_birthdate');
        }
        // HTML will take care of validating email
        // no need to check if countries are in the country set because it's a <select>
        // TODO: validate phone number
        $addr = $ch['address'];
        $addr['countryCode'] = $ch['address']['country'];
        if (!$this->app->bridge->validateAddress($addr)) {
            // TODO: more granular validation?
            return $this->localize('codeholder_error_invalid_address');
        }

        return null;
    }

    private function getOfferError() {
        $categories = $this->loadAllCategories($this->getOfferCategoryIds($this->offers));
        $addons = $this->loadAllAddons($this->getOfferAddonIds($this->offers));

        $membershipCount = 0;
        foreach ($this->state['offers'] as $year => $yearItems) {
            if (!isset($this->offersByYear[$year])) return $this->localize('offers_error_inconsistent');
            $offerYear = $this->offersByYear[$year];

            foreach ($yearItems as $offerKey => $offer) {
                $keyParts = explode('-', $offerKey);
                $groupIndex = $keyParts[0];
                $offerIndex = $keyParts[1];

                if (!isset($offerYear['offers'][$groupIndex])) return $this->localize('offers_error_inconsistent');
                $group = $offerYear['offers'][$groupIndex];
                if (!isset($group['offers'][$offerIndex])) return $this->localize('offers_error_inconsistent');
                $originalOffer = $group['offers'][$offerIndex];
                if ($originalOffer['type'] !== $offer['type']) return $this->localize('offers_error_inconsistent');
                if ($originalOffer['id'] !== $offer['id']) return $this->localize('offers_error_inconsistent');

                $minPrice = 1;
                $offerName = '';
                if ($offer['type'] === 'membership') {
                    if (!$originalOffer['price']) return $this->localize('offers_error_inconsistent');
                    $minPrice = $originalOffer['price']['amount'];
                    $offerName = $categories[$offer['id']]['name'];
                    $membershipCount++;
                } else if ($offer['type'] === 'addon') {
                    $offerName = $addons[$offerYear['paymentOrgId']][$offer['id']]['name'];
                } else {
                    return $this->localize('offers_error_inconsistent');
                }

                if ($offer['amount'] < $minPrice) {
                    return $this->localize('offers_error_min_price', $offerName);
                }
            }
        }

        if ($membershipCount == 0) {
            return $this->localize('offers_error_no_membership');
        }
    }

    public function run() {
        $this->update();

        $path = $this->plugin->getGrav()['uri']->path();
        $targets = [
            'codeholder' => $path,
            'offers' => $path . '?' . self::STEP . '=' . self::STEP_OFFERS,
            'summary' => $path . '?' . self::STEP . '=' . self::STEP_SUMMARY,
            'entry_create' => $path . '?' . self::STEP . '=' . self::STEP_ENTRY_CREATE,
        ];

        $offers = $this->offers;
        $offersIndexed = $this->offersByYear;
        $categories = [];
        $addons = [];
        if ($this->state['registered']) {
            $categories = $this->loadAllCategories($this->getRegisteredOfferCategoryIds($this->state['offers']));
            $addons = $this->loadAllAddons($this->getRegisteredOfferAddonIds($this->state['offers']));
        } else if ($offers) {
            $categories = $this->loadAllCategories($this->getOfferCategoryIds($this->offers));
            $addons = $this->loadAllAddons($this->getOfferAddonIds($this->offers));
        }

        $thisYear = (int) (new \DateTime())->format('Y');

        return array(
            'countries' => $this->getCachedCountries(),
            'currencies' => $this->getCachedCurrencies(),
            'state' => $this->state,
            'offers' => $offers,
            'offers_indexed' => $offersIndexed,
            'categories' => $categories,
            'addons' => $addons,
            'targets' => $targets,
            'thisYear' => $thisYear,
            'payment_orgs' => $this->paymentOrgs,
        );
    }
}

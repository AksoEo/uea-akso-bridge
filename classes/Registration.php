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
    private const STEP_PAYMENT = 'p1';
    private const STEP_PAYMENT_COMMIT = 'p2';
    private const DATAID = 'dataId';

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

    private function loadAllOffers() {
        $res = $this->app->bridge->get('/registration/options', array(
            'limit' => 100,
            'filter' => ['enabled' => true],
            'fields' => ['year', 'paymentOrgId', 'currency', 'offers'],
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
                    $yearCurrency = $offerYear['currency'];

                    foreach ($offerYear['offers'] as &$offerGroup) {
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

    public function loadRegistered($dataIds) {
        $needsLogin = false;
        $currency = '';
        $hasCodeholder = false;
        $codeholder = [];
        $offersByYear = [];
        foreach ($dataIds as $id) {
            $res = $this->app->bridge->get("/registration/entries/$id", array(
                'fields' => ['year', 'currency', 'codeholderData', 'offers'],
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

                $selectedItems = []; // TODO
                $offersByYear[$res['b']['year']] = $selectedItems;
            }
        }

        return array(
            'needs_login' => $needsLogin,
            'currency' => $currency,
            'codeholder' => $codeholder,
            'offers' => $offersByYear,
            'dataIds' => $dataIds,
        );
    }

    private $offers = null;
    private $offersByYear = null;
    private $paymentOrgs = null;

    public function update() {
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

        if (isset($_GET[self::STEP]) && gettype($_GET[self::STEP]) === 'string') {
            $step = $_GET[self::STEP];
            if ($registered) {
                // TODO
            } else {
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
            $serializedState = array_merge($serializedState, $this->loadRegistered($this->state['dataIds']));
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
            }
        } else if (!$registered && isset($_POST['codeholder']) && gettype($_POST['codeholder']) === 'array') {
            $ch = $_POST['codeholder'];
        } else {
            $ch = (isset($serializedState['codeholder']) && gettype($serializedState['codeholder']) === 'array')
                ? $serializedState['codeholder']
                : [];
        }

        {
            $this->state['codeholder'] = array(
                'firstNameLegal' => $this->readSafe('string', $ch, 'firstNameLegal'),
                'lastNameLegal' => $this->readSafe('string', $ch, 'lastNameLegal'),
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

            $this->state['codeholder_derived'] = array(
                'birthdate' => Utils::formatDate($this->state['codeholder']['birthdate']),
                'address' => $addressFmt,
            );
        }

        $this->state['offers'] = [];
        if (!$registered && isset($_POST['offers']) && gettype($_POST['offers']) === 'array') {
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

        $this->state['payments'] = [];
        $paymentMethods = [];
        if (isset($_POST['payment_methods']) && gettype($_POST['payment_methods']) === 'array') {
            $paymentMethods = $_POST['payment_methods'];
        } else if (isset($serializedState['payments']) && gettype($serializedState['payments']) === 'array') {
            $paymentMethods = $serializedState['payments'];
        }
        foreach ($paymentMethods as $_orgId => $data) {
            $orgId = (int) $_orgId;
            if (gettype($data) !== 'array') continue;
            $methodId = (int) $data['method'];
            $currency = $data['currency'];

            $this->state['payments'][$orgId] = array(
                'method' => $methodId,
                'currency' => $currency,
            );
        }

        if ($this->state['step'] >= 1) {
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

            $paymentOrgIds = new \Ds\Set();
            foreach ($this->offers as $offerYear) {
                $paymentOrgIds->add($offerYear['paymentOrgId']);
            }
            $this->paymentOrgs = $this->loadPaymentOrgs($paymentOrgIds);
            foreach ($this->paymentOrgs as &$org) {
                $org['years'] = [];
                foreach ($this->offers as $offerYear) {
                    if ($offerYear['paymentOrgId'] == $org['id']) {
                        $org['years'][] = $offerYear['year'];
                    }
                }
            }
        }

        // TODO: validate this stuff

        if ($creatingEntry) {
            $errors = [];
            foreach ($this->state['offers'] as $year => $yearItems) {
                $options = [];
                $options['year'] = (int) $year;
                $options['currency'] = $this->state['currency'];

                if ($this->plugin->aksoUser) {
                    $options['codeholderData'] = $this->plugin->aksoUser['id'];
                } else {
                    $options['codeholderData'] = $this->state['codeholder'];
                }

                $options['offers'] = [];
                foreach ($yearItems as $itemId => $itemData) {
                    $itemIdParts = explode('-', $itemId);
                    $groupIndex = $itemIdParts[0];
                    $offerIndex = $itemIdParts[1];

                    $options['offers'][] = array(
                        'type' => $itemData['type'],
                        'id' => $itemData['id'],
                        'amount' => $itemData['amount'],
                    );
                }

                $res = $this->app->bridge->post('/registration/entries', $options, [], []);
                if ($res['k']) {
                    $this->state['dataIds'][$year] = $res['h']['x-identifier'];
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
                $route = $this->plugin->getGrav()['uri']->path() . '?' . self::DATAID . '=' . $dataIds .
                    '&' . self::STEP . '=' . self::STEP_PAYMENT;
                $this->plugin->getGrav()->redirectLangSafe($route, 303);
            }
        }

        $this->state['serialized'] = json_encode(array(
            'currency' => $this->state['currency'],
            'codeholder' => $this->state['codeholder'],
            'offers' => $this->state['offers'],
            'dataIds' => $this->state['dataIds'],
            'payments' => $this->state['payments'],
        ));
    }

    public function run() {
        $this->update();

        $path = $this->plugin->getGrav()['uri']->path();
        $targets = [
            'codeholder' => $path,
            'offers' => $path . '?' . self::STEP . '=' . self::STEP_OFFERS,
            'summary' => $path . '?' . self::STEP . '=' . self::STEP_SUMMARY,
            'entry_create' => $path . '?' . self::STEP . '=' . self::STEP_ENTRY_CREATE,
            'payment' => $path . '?' . self::STEP . '=' . self::STEP_PAYMENT,
            'payment_commit' => $path . '?' . self::STEP . '=' . self::STEP_PAYMENT_COMMIT,
        ];

        $offers = $this->offers;
        $offersIndexed = $this->offersByYear;
        $categories = [];
        $addons = [];
        if ($this->state['step'] >= 1) {
            $categories = $this->loadAllCategories($this->getOfferCategoryIds($offers));
            $addons = $this->loadAllAddons($this->getOfferAddonIds($offers));
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

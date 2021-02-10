<?php
namespace Grav\Plugin\AksoBridge;

use Grav\Plugin\AksoBridge\Form;

// The membership registration page
class Registration extends Form {
    private const STEP = 'p';
    private const STEP_OFFERS = '1';
    private const STEP_PAYMENT = '2';

    private $plugin;

    public function __construct($plugin, $app) {
        parent::__construct($app);
        $this->plugin = $plugin;
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
                'fields' => ['id', 'nameAbbrev', 'name', 'description', 'lifetime'],
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

    public function readState() {
        $step = 'init';
        $this->state = array(
            'step' => 0,
        );

        if (isset($_GET[self::STEP]) && gettype($_GET[self::STEP]) === 'string') {
            $step = $_GET[self::STEP];
            // TODO: validate before allowing step forward
            if ($step === self::STEP_OFFERS) $this->state['step'] = 1;
            if ($step === self::STEP_PAYMENT) $this->state['step'] = 2;
        }

        $serializedState = [];
        if (isset($_POST['state_serialized'])) {
            try {
                $decoded = json_decode($_POST['state_serialized'], true);
                if (gettype($decoded) === 'array') $serializedState = $decoded;
            } catch (\Exception $e) {}
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

        $ch = [];
        if (isset($_POST['codeholder']) && gettype($_POST['codeholder']) === 'array') {
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
        }

        $this->state['offers'] = [];
        if (isset($_POST['offers']) && gettype($_POST['offers']) === 'array') {
            foreach ($_POST['offers'] as $_year => $yearItems) {
                $year = (int) $_year;
                $this->state['offers'][$year] = [];

                // key format: [year][group][offer][type-id]
                foreach ($yearItems as $groupIndex => $groupItems) {
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
                        if (isset($_POST['addon_amount'])) {
                            $k = "$year-$groupIndex-$offerIndex";
                            if (isset($_POST['addon_amount'][$k])) {
                                $amount = (float) $_POST['addon_amount'][$k];
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
        } else {
            if (isset($serializedState['offers']) && gettype($serializedState['offers']) === 'array') {
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
        }

        $this->state['offers_indexed'] = [];
        $this->state['offers_indexed_amounts'] = [];
        foreach ($this->state['offers'] as $year => $yearItems) {
            $price_sum = 0;
            foreach ($yearItems as $key => $offer) {
                $keyParts = explode('-', $key);
                $group = $keyParts[0];
                $id = $keyParts[1];
                $this->state['offers_indexed']["$year-$group-$id"] = true;
                $this->state['offers_indexed_amounts']["$year-$group-$id"] = $offer['amount'];

                if ($offer['type'] === 'membership') {
                    // TODO
                    $offer['amount'] = null;
                }
            }
        }

        // TODO: validate this stuff

        $this->state['serialized'] = json_encode(array(
            'currency' => $this->state['currency'],
            'codeholder' => $this->state['codeholder'],
            'offers' => $this->state['offers'],
        ));
    }

    public function run() {
        $this->readState();

        $path = $this->plugin->getGrav()['uri']->path();
        $targets = [
            'codeholder' => $path,
            'offers' => $path . '?' . self::STEP . '=' . self::STEP_OFFERS,
            'payment' => $path . '?' . self::STEP . '=' . self::STEP_PAYMENT,
        ];

        $offers = [];
        $offersIndexed = [];
        $categories = [];
        $addons = [];
        if ($this->state['step'] >= 1) {
            $offers = $this->loadAllOffers();
            foreach ($offers as $offer) {
                $offersIndexed[$offer['year']] = $offer;
            }

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
        );
    }
}

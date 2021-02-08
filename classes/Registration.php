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

    private $state;

    private function readSafe($typechk, $obj, $key) {
        if (!isset($obj[$key])) return null;
        if (gettype($obj[$key]) !== $typechk) return null;
        return $obj[$key];
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

                foreach ($offerYears as &$offerYear) {
                    $currency = $offerYear['currency'];
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
                                    $scriptCtx->pushScript(array(
                                        'currency' => array('t' => 's', 'v' => $currency),
                                        'value' => array('t' => 'n', 'v' => $result['v']),
                                    ));
                                    $offer['price']['amount'] = $scriptCtx->eval(array(
                                        't' => 'c',
                                        'f' => 'currency_fmt',
                                        'a' => ['currency', 'value'],
                                    ))['v'];
                                    $scriptCtx->popScript();
                                } else {
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

        $ch = [];
        if (isset($_POST['codeholder']) && gettype($_POST['codeholder']) === 'array') {
            $ch = $_POST['codeholder'];
        } else {
            $serialized = isset($_POST['codeholder_serialized']) ? $_POST['codeholder_serialized'] : '';
            if (gettype($serialized) === 'string') {
                try {
                    $decoded = json_decode($serialized, true);
                    if (gettype($decoded) === 'array') $ch = $decoded;
                } catch (\Exception $e) {}
            }
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
                        ? $this->readSafe('string', $ch, 'addressCountry')
                        : $this->readSafe('string', $ch, 'feeCountry'),
                    'countryArea' => $this->readSafe('string', $ch, 'addressCountryArea'),
                    'city' => $this->readSafe('string', $ch, 'addressCity'),
                    'cityArea' => $this->readSafe('string', $ch, 'addressCityArea'),
                    'postalCode' => $this->readSafe('string', $ch, 'addressPostalCode'),
                    'sortingCode' => $this->readSafe('string', $ch, 'addressSortingCode'),
                    'streetAddress' => $this->readSafe('string', $ch, 'addressStreetAddress'),
                ),
            );
            $this->state['codeholder_serialized'] = json_encode($this->state['codeholder']);
        }

        $this->state['offers'] = [];
        if (isset($_POST['offers']) && gettype($_POST['offers']) === 'array') {
            foreach ($_POST['offers'] as $_year => $yearItems) {
                $year = (int) $_year;
                $this->state['offers'][$year] = [];

                foreach ($yearItems as $groupId => $groupTypes) {
                    if (gettype($groupTypes) !== 'array') continue;
                    foreach ($groupTypes as $type => $items) {
                        if ($type !== 'membership' && $type !== 'addon') continue;
                        if (gettype($items) !== 'array') continue;
                        foreach ($items as $_id) {
                            $id = (int) $_id;
                            $amount = 0; // TODO: get value

                            $this->state['offers'][$year][] = array(
                                'type' => $type,
                                'id' => $id,
                                'amount' => $amount,
                            );
                        }
                    }
                }
            }
        }
        // TODO: validate this mess
        var_dump($this->state['offers']);
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
        $categories = [];
        $addons = [];
        if ($this->state['step'] >= 1) {
            $offers = $this->loadAllOffers();
            $categories = $this->loadAllCategories($this->getOfferCategoryIds($offers));
            $addons = $this->loadAllAddons($this->getOfferAddonIds($offers));
        }

        $thisYear = (int) (new \DateTime())->format('Y');

        return array(
            'countries' => $this->getCachedCountries(),
            'state' => $this->state,
            'offers' => $offers,
            'categories' => $categories,
            'addons' => $addons,
            'targets' => $targets,
            'thisYear' => $thisYear,
        );
    }
}

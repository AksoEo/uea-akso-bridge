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
            return $res['b'];
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
    private function loadAllCategories($ids) {
        $categories = [];
        for ($i = 0; true; $i += 100) {
            $res = $this->app->bridge->get("/membership_categories", array(
                'fields' => ['id', 'nameAbbrev', 'name', 'description', 'lifetime'],
                'filter' => ['id' => ['$in' => $ids->slice(0, 100)->toArray()]],
                'limit' => 100,
                'offset' => $i,
            ));
            if (!$res['k']) {
                // TODO: emit error
                break;
            }
            foreach ($res['b'] as $cat) {
                $categories[$cat['id']] = $cat;
                $ids->remove($cat['id']);
            }
            if ($ids->isEmpty()) break;
        }
        return $categories;
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
        if ($this->state['step'] == 1) {
            $offers = $this->loadAllOffers();
            $categoryIds = $this->getOfferCategoryIds($offers);
            $categories = $this->loadAllCategories($categoryIds);
        }

        $thisYear = (int) (new \DateTime())->format('Y');

        return array(
            'countries' => $this->getCachedCountries(),
            'state' => $this->state,
            'offers' => $offers,
            'categories' => $categories,
            'targets' => $targets,
            'thisYear' => $thisYear,
        );
    }
}

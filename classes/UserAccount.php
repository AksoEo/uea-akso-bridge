<?php
namespace Grav\Plugin\AksoBridge;

use Grav\Plugin\AksoBridge\Utils;

class UserAccount {
    const QUERY_PROFILE_PICTURE = 'profile_picture';

    private $plugin, $bridge;

    public function __construct($plugin, $bridge) {
        $this->plugin = $plugin;
        $this->bridge = $bridge;

        $this->doc = new \DOMDocument();
    }

    private function renderDetails() {
        $res = $this->bridge->get('codeholders/self', array(
            'fields' => [
                'codeholderType',
                'firstName',
                'lastName',
                'firstNameLegal',
                'lastNameLegal',
                'honorific',
                'fullName',
                'fullNameLocal',
                'nameAbbrev',
                'newCode',
                'oldCode',
                'birthdate',
                'address.country',
                'address.countryArea',
                'address.city',
                'address.cityArea',
                'address.streetAddress',
                'address.postalCode',
                'address.sortingCode',
                'feeCountry',
                'email',
                'officePhoneFormatted',
                'cellphoneFormatted',
                'landlinePhoneFormatted',

                'profilePictureHash',
                'profession',
                'website',
                'biography',
            ],
        ));

        if ($res['k']) {
            $this->plugin->updateFormattedName();
            $details = $res['b'];

            if ($details['profilePictureHash']) {
                $path = $this->plugin->getGrav()['uri']->path() . '?' . self::QUERY_PROFILE_PICTURE
                    . '=1&s=';
                $details['profilePicturePath'] = $path . '128px';
                $details['profilePictureSizes'] = $path . '32px 32w,' . $path . '64px 64w,'
                    . $path . '128px 128w,' . $path . '256px 256w,' . $path . '512px 512w';
            }

            if ($details['codeholderType'] === 'human') {
                $details['fmtName'] = $this->plugin->aksoUserFormattedName;
                if ($details['firstName'] || $details['lastName']) {
                    $details['fmtLegalName'] = $details['firstNameLegal'] . ' ' . $details['lastNameLegal'];
                }

                $details['fmtBirthdate'] = '—';
                if ($details['birthdate']) {
                    $details['fmtBirthdate'] = Utils::formatDate($details['birthdate']);
                }
            } else {
                $details['fmtName'] = $details['fullName'];
                if ($details['nameAbbrev']) {
                    $details['fmtName'] .= ' (' . $details['nameAbbrev'] . ')';
                }
                $details['fmtLocalName'] = $details['fullNameLocal'];
            }

            $phoneNumbers = [];
            if ($details['codeholderType'] === 'human' && $details['cellphoneFormatted']) {
                $phoneNumbers[] = [$this->plugin->locale['account']['phoneNumberCell'], $details['cellphoneFormatted']];
            }
            if ($details['codeholderType'] === 'human' && $details['landlinePhoneFormatted']) {
                $phoneNumbers[] = [$this->plugin->locale['account']['phoneNumberLandline'], $details['landlinePhoneFormatted']];
            }
            if ($details['officePhoneFormatted']) {
                $phoneNumbers[] = [$this->plugin->locale['account']['phoneNumberOffice'], $details['officePhoneFormatted']];
            }
            if (!empty($phoneNumbers)) {
                $phoneNumbersList = $this->doc->createElement('ul');
                $phoneNumbersList->setAttribute('class', 'phone-numbers-list');
                foreach ($phoneNumbers as $entry) {
                    $li = $this->doc->createElement('li');
                    $label = $this->doc->createElement('span');
                    $label->setAttribute('class', 'number-label');
                    $label->textContent = $entry[0] . ': ';
                    $li->appendChild($label);
                    $value = $this->doc->createElement('span');
                    $value->setAttribute('class', 'number-value');
                    $value->textContent = $entry[1];
                    $li->appendChild($value);
                    $phoneNumbersList->appendChild($li);
                }
                $details['phoneNumbersFormatted'] = $this->doc->saveHtml($phoneNumbersList);
            } else $details['phoneNumbersFormatted'] = '—';

            $details['fmtAddress'] = '—';
            if ($details['address']) {
                $addr = $details['address'];
                $fmtAddress = $this->doc->createElement('div');
                $countryName = $this->formatCountry($addr['country']);
                $formatted = $this->bridge->renderAddress(array(
                    'countryCode' => $addr['country'],
                    'countryArea' => $addr['countryArea'],
                    'city' => $addr['city'],
                    'cityArea' => $addr['cityArea'],
                    'streetAddress' => $addr['streetAddress'],
                    'postalCode' => $addr['postalCode'],
                    'sortingCode' => $addr['sortingCode'],
                ), $countryName)['c'];
                foreach (explode("\n", $formatted) as $line) {
                    $ln = $this->doc->createElement('div');
                    $ln->textContent = $line;
                    $fmtAddress->appendChild($ln);
                }
                $details['fmtAddress'] = $this->doc->saveHtml($fmtAddress);
            }

            $details['fmtFeeCountry'] = '—';
            if ($details['feeCountry']) {
                $details['fmtFeeCountry'] = $this->formatCountry($details['feeCountry']);
            }

            return $details;
        }
        return null;
    }

    function renderMoreMembershipItems($offset) {
        $res = $this->bridge->get('/codeholders/self/membership', array(
            'fields' => ['categoryId', 'year', 'name', 'lifetime', 'availableTo'],
            'order' => [['year', 'desc']],
            'offset' => $offset,
            'limit' => 100,
        ));

        if ($res['k']) {
            $totalCount = $res['h']['x-total-items'];
            $hasMore = $totalCount > ($offset + count($res['b']));

            $currentYear = (int) (new \DateTime())->format('Y');
            foreach ($res['b'] as &$item) {
                $item['availableThisYear'] = $item['availableTo'] >= $currentYear;
                $item['availableNextYear'] = $item['availableTo'] >= $currentYear + 1;
                unset($item['availableTo']);
            }

            echo json_encode(array(
                'items' => $res['b'],
                'hasMore' => $hasMore,
            ));
        } else echo '!';
        die();
    }

    private function renderMembership() {
        $res = $this->bridge->get('/codeholders/self/membership', array(
            'fields' => ['categoryId', 'year', 'name', 'lifetime', 'availableTo'],
            'order' => [['year', 'desc']],
            'limit' => 10,
        ));

        if ($res['k']) {
            $categories = [];

            foreach ($res['b'] as $item) {
                $catId = $item['categoryId'];
                if (!isset($categories[$catId])) {
                    $categories[$catId] = $item;
                    $categories[$catId]['years'] = [];
                    $categories[$catId]['canBeRenewed'] = false;
                }
                $categories[$catId]['years'][] = $item['year'];
            }

            $currentYear = (int) (new \DateTime())->format('Y');
            foreach ($categories as &$category) {
                if ($category['lifetime']) continue;
                $newestYear = 0;
                foreach ($category['years'] as $y) if ($y > $newestYear) $newestYear = $y;

                $wouldRenewToYear = $newestYear == $currentYear ? $currentYear + 1 : $currentYear;
                $couldBeRenewed = $category['availableTo'] >= $wouldRenewToYear;

                if ($couldBeRenewed && $newestYear <= $currentYear) {
                    $category['canBeRenewed'] = true;
                }
            }

            $totalCount = $res['h']['x-total-items'];
            $hasMore = $totalCount > count($res['b']);

            return array(
                'categories' => $categories,
                'history' => $res['b'],
                'historyHasMore' => $hasMore,
            );
        }

        return null;
    }

    function formatCountry($code) {
        $res = $this->bridge->get('/countries', array(
            'limit' => 300,
            'fields' => ['code', 'name_eo'],
        ), 600);
        if ($res['k']) {
            foreach ($res['b'] as $item) {
                if ($item['code'] === $code) return $item['name_eo'];
            }
        }
        return null;
    }

    public function runProfilePicture() {
        $res = $this->bridge->get('codeholders/self', array('fields' => ['profilePictureHash']));
        if (!$res['k'] || !$res['b']['profilePictureHash'] || !isset($_GET['s'])) die();
        $hash = bin2hex($res['b']['profilePictureHash']);
        $size = $_GET['s'];
        // TODO: check if this is safe
        $path = "/codeholders/self/profile_picture/$size";
        $res = $this->bridge->getRaw($path, 10, array('noop' => $hash));
        if ($res['k']) {
            header('Content-Type: ' . $res['h']['content-type']);
            try {
                readfile($res['ref']);
            } finally {
                $this->bridge->releaseRaw($path);
            }
            die();
        } else {
            // TODO: error?
            die();
        }
    }

    public function run() {
        if (isset($_GET[self::QUERY_PROFILE_PICTURE])) {
            $this->runProfilePicture();
        }

        if (isset($_GET['membership_more_items_offset']) && gettype($_GET['membership_more_items_offset']) === 'string') {
            $offset = (int) $_GET['membership_more_items_offset'];
            $this->renderMoreMembershipItems($offset);
        }

        $details = $this->renderDetails();
        $membership = $this->renderMembership();

        return array(
            'details' => $details,
            'membership' => $membership,
        );
    }
}

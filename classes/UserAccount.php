<?php
namespace Grav\Plugin\AksoBridge;

use Grav\Plugin\AksoBridge\Utils;

class UserAccount {
    private $plugin, $bridge;

    public function __construct($plugin, $bridge) {
        $this->plugin = $plugin;
        $this->bridge = $bridge;

        $this->doc = new \DOMDocument();
    }

    private function renderDetails() {
        $res = $this->bridge->get('codeholders/self', array(
            'fields' => [
                'firstName',
                'lastName',
                'firstNameLegal',
                'lastNameLegal',
                'honorific',
                'fullName',
                'fullNameLocal',
                'nameAbbrev',
                'newCode',
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
            ],
        ));

        if ($res['k']) {
            // TODO
            $this->plugin->updateFormattedName();
            $details = $res['b'];

            $details['fmtName'] = $this->plugin->aksoUserFormattedName;
            if ($details['firstName'] || $details['lastName']) {
                $details['fmtLegalName'] = $details['firstNameLegal'] . ' ' . $details['lastNameLegal'];
            }

            $details['fmtBirthdate'] = '—';
            if ($details['birthdate']) {
                $details['fmtBirthdate'] = Utils::formatDate($details['birthdate']);
            }

            $phoneNumbers = [];
            if ($details['cellphoneFormatted']) {
                $phoneNumbers[] = [$this->plugin->locale['account']['phoneNumberCell'], $details['cellphoneFormatted']];
            }
            if ($details['landlinePhoneFormatted']) {
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

    function renderMoreItems($offset) {
        $res = $this->bridge->get('/codeholders/self/membership', array(
            'fields' => ['categoryId', 'year', 'name', 'lifetime'],
            'order' => [['year', 'desc']],
            'offset' => $offset,
            'limit' => 100,
        ));

        if ($res['k']) {
            $totalCount = $res['h']['x-total-items'];
            $hasMore = $totalCount > ($offset + count($res['b']));

            echo json_encode(array(
                'items' => $res['b'],
                'hasMore' => $hasMore,
            ));
        } else echo '!';
        die();
    }

    private function renderMembership() {
        $res = $this->bridge->get('/codeholders/self/membership', array(
            'fields' => ['categoryId', 'year', 'name', 'lifetime'],
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
                }
                $categories[$catId]['years'][] = $item['year'];
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

    public function run() {
        if (isset($_GET['fetch_more_items_offset']) && gettype($_GET['fetch_more_items_offset']) === 'string') {
            $offset = (int) $_GET['fetch_more_items_offset'];
            $this->renderMoreItems($offset);
        }

        $details = $this->renderDetails();
        $membership = $this->renderMembership();

        return array(
            'details' => $details,
            'membership' => $membership,
            // TODO
        );
    }
}

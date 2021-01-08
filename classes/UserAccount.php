<?php
namespace Grav\Plugin\AksoBridge;

use \Grav\Common\Utils;

class UserAccount {
    private $plugin, $bridge;

    public function __construct($plugin, $bridge) {
        $this->plugin = $plugin;
        $this->bridge = $bridge;
        // TODO
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
                'officePhone',
                'cellphone',
                'landlinePhone',
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

            return $details;
        }
        return null;
    }

    public function run() {
        $details = $this->renderDetails();

        return array(
            'details' => $details,
            // TODO
        );
    }
}

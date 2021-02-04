<?php
namespace Grav\Plugin\AksoBridge;

use Grav\Plugin\AksoBridge\Form;

// The membership registration page
class Registration extends Form {
    private $plugin;

    public function __construct($plugin, $app) {
        parent::__construct($app);
        $this->plugin = $plugin;
    }

    private $state;

    public function readState() {
        $step = 'init';
        if (isset($_POST['step'])) $step = $_POST['step'];

        $this->state = array(
            'step' => $step,
        );
    }

    public function run() {
        $this->readState();

        return $this->state;
    }
}

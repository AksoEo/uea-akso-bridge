<?php
namespace Grav\Plugin\AksoBridge;

use Grav\Plugin\AksoBridge\Utils;

// Handles the congress participants Markdown component
class CongressParticipants {
    public $first_name_field = null;
    public $last_name_field = null;
    public $show_name_field = null;

    public function __construct($plugin, $app, $congressId, $instanceId) {
        $this->plugin = $plugin;
        $this->app = $app;
        $this->congressId = $congressId;
        $this->instanceId = $instanceId;

        $this->doc = new \DOMDocument();
    }

    private function getParticipants() {
        $participants = [];
        $totalParticipants = 1;
        $fields = [];
        $fields[] = 'data.' . $this->first_name_field;
        $fields[] = 'data.' . $this->show_name_field;
        $congressId = $this->congressId;
        $instanceId = $this->instanceId;

        while (count($participants) < $totalParticipants) {
            $res = $this->app->bridge->get("/congresses/$congressId/instances/$instanceId/participants", array(
                'offset' => count($participants),
                'limit' => 100,
                'fields' => $fields,
                'order' => [['sequenceId', 'asc']],
            ), 120);
            if (!$res['k']) {
                return [];
            }
            $totalParticipants = $res['h']['x-total-items'];
            foreach ($res['b'] as $item) {
                $item['first_name'] = $item['data'][$this->first_name_field];
                $item['show_name'] = $item['data'][$this->show_name_field];
                $participants[] = $item;
            }
        }

        // TODO: fetch last name publicity

        return $participants;
    }

    public function run() {
        $participants = $this->getParticipants();

        return array(
            'auth' => !!$this->plugin->aksoUser,
            'participants' => $participants,
        );
    }
}

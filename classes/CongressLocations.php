<?php
namespace Grav\Plugin\AksoBridge;

class CongressLocations {
    const QUERY_LOC = 'loc';

    private $plugin;
    private $app;
    private $congressId = null;
    private $instanceId = null;
    private $doc;

    public function __construct($plugin, $app, $congressId, $instanceId) {
        $this->plugin = $plugin;
        $this->app = $app;
        $this->congressId = $congressId;
        $this->instanceId = $instanceId;

        $this->doc = new \DOMDocument();

        $this->readQuery();
    }

    private $wantsPartial = false;
    private $locationId = null;

    function readQuery() {
        if (isset($_GET['partial'])) {
            $this->wantsPartial = true;
        }
        if (isset($_GET['loc'])) {
            $this->locationId = (int) $_GET['loc'];
        }
    }

    function renderList() {
        $extLocations = [];
        $intLocations = [];
        $locCount = 0;
        $error = false;
        while (true) {
            $congress = $this->congressId;
            $instance = $this->instanceId;
            $res = $this->app->bridge->get("/congresses/$congress/instances/$instance/locations", array(
                'fields' => ['id', 'type', 'name', 'description', 'll', 'icon', 'externalLoc'],
                'limit' => 100,
            ), 120);
            if ($res['k']) {
                foreach ($res['b'] as $item) {
                    if ($item['type'] === 'external') {
                        $extLocations[] = $item;
                    } else {
                        if (!array_key_exists($item['externalLoc'], $intLocations)) {
                            $intLocations[$item['externalLoc']] = [];
                        }
                        $intLocations[$item['externalLoc']][] = $item;
                    }
                    $locCount++;
                }
                $totalItems = $res['h']['x-total-items'];
                if (count($res['b']) == 0 || $locCount >= $totalItems) {
                    break;
                }
            } else {
                $error = true;
                break;
            }
        }

        $ul = $this->doc->createElement('ul');
        $ul->setAttribute('class', 'locations-list');

        $path = $this->plugin->getGrav()['uri']->path();

        foreach ($extLocations as $location) {
            $li = $this->doc->createElement('li');
            $li->setAttribute('class', 'location-list-item');

            $li->setAttribute('data-id', $location['id']);
            $li->setAttribute('data-ll', implode(',', $location['ll']));

            $name = $this->doc->createElement('a');
            $name->setAttribute('href', $path . '?' . self::QUERY_LOC . '=' . $location['id']);
            $name->setAttribute('class', 'location-name');
            $name->textContent = $location['name'];
            $li->appendChild($name);

            $description = $this->doc->createElement('div');
            $description->setAttribute('class', 'location-description');
            $description->textContent = $location['description']; // TODO: render md
            $li->appendChild($description);

            $ul->appendChild($li);

            if (isset($intLocations[$location['id']]) && count($intLocations[$location['id']]) > 0) {
                $intLoc = $intLocations[$location['id']];

                $outerLi = $li;

                $int = $this->doc->createElement('ul');
                $int->setAttribute('class', 'internal-locations-list');

                foreach ($intLoc as $location) {
                    $li = $this->doc->createElement('li');
                    $li->setAttribute('class', 'internal-location-list-item');
                    $li->setAttribute('data-id', $location['id']);

                    $name = $this->doc->createElement('a');
                    $name->setAttribute('href', $path . '?' . self::QUERY_LOC . '=' . $location['id']);
                    $name->setAttribute('class', 'location-name');
                    $name->textContent = $location['name'];
                    $li->appendChild($name);

                    $description = $this->doc->createElement('div');
                    $description->setAttribute('class', 'location-description');
                    $description->textContent = $location['description']; // TODO: render md
                    $li->appendChild($description);

                    $int->appendChild($li);
                }

                $outerLi->appendChild($int);
            }
        }

        return $ul;
    }

    function renderDetail() {
        $container = $this->doc->createElement('div');
        $container->setAttribute('class', 'congress-location');

        $congress = $this->congressId;
        $instance = $this->instanceId;
        $locationId = $this->locationId;
        $res = $this->app->bridge->get("/congresses/$congress/instances/$instance/locations/$locationId", array(
            'fields' => ['type', 'name', 'description', 'openHours', 'address', 'll', 'rating.rating', 'rating.type', 'rating.max', 'icon', 'externalLoc'],
        ), 60);
        if ($res['k']) {
            $location = $res['b'];

            $header = $this->doc->createElement('div');
            $header->setAttribute('class', 'location-header');
            $container->appendChild($header);

            {
                $backLink = $this->doc->createElement('a');
                $backLink->setAttribute('href', $this->plugin->getGrav()['uri']->path());
                $backLink->textContent = '<';
                $header->appendChild($backLink);

                $name = $this->doc->createElement('h1');
                $name->textContent = $location['name'];
                $header->appendChild($name);
            }

            if ($location['type'] === 'internal') {
                // TODO: inside of
            }

            // TODO: rating

            $description = $this->doc->createElement('div');
            $description->setAttribute('class', 'location-description');
            $description->textContent = $location['description']; // TODO: render md
            $container->appendChild($description);

            // TODO: open hours

            return $container;
        }
        return null;
    }

    private $didRenderLocation = false;
    function render() {
        $root = $this->doc->createElement('div');
        $root->setAttribute('class', 'congress-locations-rendered');

        $renderedLoc = false;
        if ($this->locationId != null) {
            $rendered = $this->renderDetail();
            if ($rendered !== null) {
                $renderedLoc = true;
                $root->appendChild($rendered);
            }
        }
        $this->didRenderLocation = $renderedLoc;

        if (!$renderedLoc) {
            $root->appendChild($this->renderList());
        }

        return $this->doc->saveHtml($root);
    }

    public function run() {
        $rendered = $this->render();

        if ($this->wantsPartial) {
            echo $rendered;
            die();
        }

        return array(
            'contents' => $rendered,
            'did_render_location' => $this->didRenderLocation,
        );
    }
}

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

    function renderInternalList($intLoc) {
        $int = $this->doc->createElement('ul');
        $int->setAttribute('class', 'internal-locations-list');

        foreach ($intLoc as $location) {
            $li = $this->doc->createElement('li');
            $li->setAttribute('class', 'internal-location-list-item');
            $li->setAttribute('data-id', $location['id']);

            $name = $this->doc->createElement('a');
            $name->setAttribute('href', $this->plugin->getGrav()['uri']->path() . '?' . self::QUERY_LOC . '=' . $location['id']);
            $name->setAttribute('class', 'location-name');
            $name->textContent = $location['name'];
            $li->appendChild($name);

            $description = $this->doc->createElement('div');
            $description->setAttribute('class', 'location-description');
            $description->textContent = $location['description']; // TODO: render md
            $li->appendChild($description);

            $int->appendChild($li);
        }

        return $int;
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

            if (isset($intLocations[$location['id']]) && count($intLocations[$location['id']]) > 0) {
                $li->appendChild($this->renderInternalList($intLocations[$location['id']]));
            }

            $ul->appendChild($li);

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
                $backLink->setAttribute('class', 'back-link');
                $backLink->setAttribute('href', $this->plugin->getGrav()['uri']->path());
                $backLink->textContent = '<';
                $header->appendChild($backLink);

                $name = $this->doc->createElement('h1');
                $name->textContent = $location['name'];
                $header->appendChild($name);
            }

            if ($location['type'] === 'internal') {
                $externalLocId = $location['externalLoc'];
                $eres = $this->app->bridge->get("/congresses/$congress/instances/$instance/locations/$externalLocId", array(
                    'fields' => ['name', 'icon'],
                ), 60);
                if ($eres['k']) {
                    $label = $this->doc->createElement('span');
                    $label->textContent = $this->plugin->locale['congress_locations']['located_within'] . ' ';

                    $extLink = $this->doc->createElement('a');
                    $extLink->textContent = $eres['b']['name'];
                    $extLink->setAttribute('href', $this->plugin->getGrav()['uri']->path() . '?' . self::QUERY_LOC . '=' . $externalLocId);

                    $extLoc = $this->doc->createElement('div');
                    $extLoc->setAttribute('class', 'external-loc');
                    $extLoc->appendChild($label);
                    $extLoc->appendChild($extLink);
                    $container->appendChild($extLoc);
                }
            }

            if (isset($location['rating']) && $location['rating'] !== null) {
                $rating = $location['rating'];

                $ratingContainer = $this->doc->createElement('div');
                $ratingContainer->setAttribute('class', 'location-rating');

                // TODO

                $container->appendChild($ratingContainer);
            }

            $description = $this->doc->createElement('div');
            $description->setAttribute('class', 'location-description');
            $description->textContent = $location['description']; // TODO: render md
            $container->appendChild($description);

            if ($location['type'] === 'external') {
                $eres = $this->app->bridge->get("/congresses/$congress/instances/$instance/locations", array(
                    'fields' => ['id', 'name', 'description'],
                    'filter' => array('externalLoc' => $locationId),
                    'limit' => 100,
                ), 60);

                if ($eres['k'] && count($eres['b']) > 0) {
                    $internalListContainer = $this->doc->createElement('div');
                    $internalListContainer->setAttribute('class', 'internal-list-container');

                    $title = $this->doc->createElement('h4');
                    $title->setAttribute('class', 'internal-list-title');
                    $title->textContent = $this->plugin->locale['congress_locations']['internal_locations_title'];
                    $internalListContainer->appendChild($title);

                    $internalListContainer->appendChild($this->renderInternalList($eres['b']));
                    $container->appendChild($internalListContainer);
                }
            }

            if (isset($location['openHours']) && $location['openHours'] !== null) {
                // TODO
            }

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

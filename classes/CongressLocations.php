<?php
namespace Grav\Plugin\AksoBridge;

class CongressLocations {
    const QUERY_LOC = 'loc';
    const ICONS_PATH_PREFIX = '/user/plugins/akso-bridge/assets/location_icons/';
    const ICONS_PATH_SUFFIX = '.svg';

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
        if (isset($_GET[self::QUERY_LOC])) {
            $this->locationId = (int) $_GET[self::QUERY_LOC];
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
            $name->setAttribute('data-loc-id', $location['id']);
            $name->textContent = $location['name'];
            $li->appendChild($name);

            $description = $this->doc->createElement('div');
            $description->setAttribute('class', 'location-description');
            if ($location['description']) {
                $rules = ['emphasis', 'strikethrough', 'link', 'list', 'table'];
                $res = $this->app->bridge->renderMarkdown($location['description'], $rules);
                $this->setInnerHTML($description, $res['c']);
            }
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
            $li->setAttribute('data-icon', $location['icon']);

            $liInner = $this->doc->createElement('div');
            $liInner->setAttribute('class', 'location-inner-container');

            $iconContainer = $this->doc->createElement('div');
            $iconContainer->setAttribute('class', 'location-icon-container');
            $iconImg = $this->doc->createElement('img');
            $iconImg->setAttribute('class', 'location-icon');
            $iconImg->setAttribute('src', self::ICONS_PATH_PREFIX . $location['icon'] . self::ICONS_PATH_SUFFIX);
            $iconContainer->appendChild($iconImg);
            $liInner->appendChild($iconContainer);

            $liDetails = $this->doc->createElement('div');
            $liDetails->setAttribute('class', 'location-inner-details');

            $name = $this->doc->createElement('a');
            $name->setAttribute('href', $path . '?' . self::QUERY_LOC . '=' . $location['id']);
            $name->setAttribute('class', 'location-name');
            $name->setAttribute('data-loc-id', $location['id']);
            $name->textContent = $location['name'];
            $liDetails->appendChild($name);

            $description = $this->doc->createElement('div');
            $description->setAttribute('class', 'location-description');
            if ($location['description']) {
                $rules = ['emphasis', 'strikethrough', 'link', 'list', 'table'];
                $res = $this->app->bridge->renderMarkdown($location['description'], $rules);
                $this->setInnerHTML($description, $res['c']);
            }
            $liDetails->appendChild($description);

            $liInner->appendChild($liDetails);
            $li->appendChild($liInner);

            if (isset($intLocations[$location['id']]) && count($intLocations[$location['id']]) > 0) {
                $li->appendChild($this->renderInternalList($intLocations[$location['id']]));
            }

            $ul->appendChild($li);

        }

        return $ul;
    }

    function setInnerHTML($node, $html) {
        $fragment = $node->ownerDocument->createDocumentFragment();
        $fragment->appendXML($html);
        $node->appendChild($fragment);
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

            $headerImage = null;
            $hres = $this->app->bridge->get("/congresses/$congress/instances/$instance/locations/$locationId/thumbnail/32px", [], 60);
            if ($hres['k']) {
                // $imgPrefix = $this->plugin->apiHost . "/congresses/$congress/instances/$instance/locations/$locationId/thumbnail";
                $imgPrefix = \Grav\Plugin\AksoBridgePlugin::CONGRESS_LOC_THUMBNAIL_PATH . '?' .
                    self::TH_CONGRESS . '=' . $congress . '&' .
                    self::TH_INSTANCE . '=' . $instance . '&' .
                    self::TH_LOCATION . '=' . $locationId . '&' .
                    self::TH_SIZE;

                $headerImage = $this->doc->createElement('div');
                $headerImage->setAttribute('class', 'location-header-image');
                $img = $this->doc->createElement('img');
                $img->setAttribute('src', $imgPrefix . '=512px');
                $img->setAttribute('srcset', "$imgPrefix=128px 128w, $imgPrefix=256px 256w, $imgPrefix=512px 512w, $imgPrefix=1024px 1024w, $imgPrefix=2048px 2048w");

                $headerImage->appendChild($img);
            }

            $header = $this->doc->createElement('div');
            $header->setAttribute('class', 'location-header');
            if ($headerImage !== null) {
                $headerContainer = $this->doc->createElement('div');
                $headerContainer->setAttribute('class', 'location-header-container');
                $headerContainer->appendChild($headerImage);
                $headerContainer->appendChild($header);
                $container->appendChild($headerContainer);
            } else {
                $container->appendChild($header);
            }

            {
                $backLink = $this->doc->createElement('a');
                $backLink->setAttribute('class', 'back-link');
                $backLink->setAttribute('data-loc-id', '');
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
                    'fields' => ['name', 'icon', 'll'],
                ), 60);
                if ($eres['k']) {
                    $container->setAttribute('data-ll', implode(',', $eres['b']['ll']));
                    $container->setAttribute('data-icon', $eres['b']['icon']);

                    $label = $this->doc->createElement('span');
                    $label->textContent = $this->plugin->locale['congress_locations']['located_within'] . ' ';

                    $extLink = $this->doc->createElement('a');
                    $extLink->textContent = $eres['b']['name'];
                    $extLink->setAttribute('data-loc-id', $externalLocId);
                    $extLink->setAttribute('href', $this->plugin->getGrav()['uri']->path() . '?' . self::QUERY_LOC . '=' . $externalLocId);

                    $extLoc = $this->doc->createElement('div');
                    $extLoc->setAttribute('class', 'external-loc');
                    $extLoc->appendChild($label);
                    $extLoc->appendChild($extLink);
                    $container->appendChild($extLoc);
                }
            } else if ($location['type'] === 'external') {
                $container->setAttribute('data-ll', implode(',', $location['ll']));
                $container->setAttribute('data-icon', $location['icon']);
            }

            if (isset($location['rating']) && $location['rating'] !== null && $location['rating']['max'] > 0) {
                $rating = $location['rating'];

                $ratingContainer = $this->doc->createElement('div');
                $ratingContainer->setAttribute('class', 'location-rating');

                $rating = $location['rating']['rating'];
                $max = $location['rating']['max'];
                $type = $location['rating']['type'];

                for ($i = 0; $i < $max; $i++) {
                    $icon = $this->doc->createElement('span');
                    $icon->setAttribute('class', 'rating-icon');
                    if (floor($rating) !== $rating && (int) $rating === $i) {
                        // partial icon
                        $partial = $rating - floor($rating);

                        $icon->setAttribute('class', 'rating-icon is-partial');
                        $base = $this->doc->createElement('img');
                        $base->setAttribute('class', 'rating-icon-base');
                        $base->setAttribute('src', self::ICONS_PATH_PREFIX . 'rating-' . $type . '-empty.svg');
                        $fill = $this->doc->createElement('span');
                        $fill->setAttribute('class', 'rating-icon-fill-container is-' . $type);
                        $fill->setAttribute('data-fill-partial', (int) ($partial * 10));
                        $fillImg = $this->doc->createElement('img');
                        $fillImg->setAttribute('src', self::ICONS_PATH_PREFIX . 'rating-' . $type . '-filled.svg');
                        $fill->appendChild($fillImg);
                        $icon->appendChild($base);
                        $icon->appendChild($fill);
                    } else if ($i <= $rating) {
                        $img = $this->doc->createElement('img');
                        $img->setAttribute('src', self::ICONS_PATH_PREFIX . 'rating-' . $type . '-filled.svg');
                        $icon->appendChild($img);
                    } else {
                        $img = $this->doc->createElement('img');
                        $img->setAttribute('src', self::ICONS_PATH_PREFIX . 'rating-' . $type . '-empty.svg');
                        $icon->appendChild($img);
                    }

                    $ratingContainer->appendChild($icon);
                }

                $val = $this->doc->createElement('span');
                $val->setAttribute('class', 'rating-value is-' . $type);
                $val->textContent = round($rating * 10) / 10;
                $ratingContainer->appendChild($val);

                $container->appendChild($ratingContainer);
            }

            $description = $this->doc->createElement('div');
            $description->setAttribute('class', 'location-description');
            if ($location['description']) {
                $rules = ['emphasis', 'strikethrough', 'link', 'list', 'table'];
                $res = $this->app->bridge->renderMarkdown($location['description'], $rules);
                $this->setInnerHTML($description, $res['c']);
            }
            $container->appendChild($description);

            if (isset($location['openHours']) && $location['openHours'] !== null) {
                // TODO
            }

            if (isset($location['address']) && $location['address'] !== null) {
                $addressContainer = $this->doc->createElement('div');
                $addressContainer->setAttribute('class', 'address-container');
                $label = $this->doc->createElement('label');
                $label->setAttribute('class', 'address-field-label');
                $label->textContent = $this->plugin->locale['congress_locations']['address'];
                $addressContainer->appendChild($label);
                $lines = explode("\n", $location['address']);
                foreach ($lines as $line) {
                    $ln = $this->doc->createElement('div');
                    $ln->setAttribute('class', 'address-line');
                    $ln->textContent = $line;
                    $addressContainer->appendChild($ln);
                }
                $container->appendChild($addressContainer);
            }

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

            return $container;
        }
        return null;
    }

    private $didRenderLocation = false;
    function render() {
        $root = $this->doc->createElement('div');
        $root->setAttribute('class', 'congress-locations-rendered');

        $root->setAttribute('data-base-path', $this->plugin->getGrav()['uri']->path());
        $root->setAttribute('data-query-loc', self::QUERY_LOC);
        $root->setAttribute('data-icons-path-prefix', self::ICONS_PATH_PREFIX);
        $root->setAttribute('data-icons-path-suffix', self::ICONS_PATH_SUFFIX);

        $renderedLoc = false;
        if ($this->locationId != null) {
            $rendered = $this->renderDetail();
            if ($rendered !== null) {
                $renderedLoc = true;
                $root->appendChild($rendered);

                $root->setAttribute('data-is-loc', 'true');
                $root->setAttribute('data-loc-id', $this->locationId);
            }
        }
        $this->didRenderLocation = $renderedLoc;

        if (!$renderedLoc) {
            $root->appendChild($this->renderList());
        }

        return $this->doc->saveHtml($root);
    }

    const TH_CONGRESS = 'c';
    const TH_INSTANCE = 'i';
    const TH_LOCATION = 'l';
    const TH_SIZE = 's';
    public function runThumbnail() {
        $congress = isset($_GET[self::TH_CONGRESS]) ? $_GET[self::TH_CONGRESS] : '?';
        $instance = isset($_GET[self::TH_INSTANCE]) ? $_GET[self::TH_INSTANCE] : '?';
        $location = isset($_GET[self::TH_LOCATION]) ? $_GET[self::TH_LOCATION] : '?';
        $size = isset($_GET[self::TH_SIZE]) ? $_GET[self::TH_SIZE] : '?';
        $path = "/congresses/$congress/instances/$instance/locations/$location/thumbnail/$size";

        $res = $this->app->bridge->getRaw($path, 60);
        if ($res['k']) {
            header('Content-Type: ' . $res['h']['content-type']);
            try {
                readfile($res['ref']);
            } finally {
                $this->app->bridge->releaseRaw($path);
            }
            die();
        } else {
            // TODO: error?
            die();
        }
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

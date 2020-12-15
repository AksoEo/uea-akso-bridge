<?php
namespace Grav\Plugin\AksoBridge;

use Grav\Plugin\AksoBridge\CongressLocations;

class CongressPrograms {
    const QUERY_DATE = 'd';

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

        $this->load();
    }

    public $locationsPath = null;

    private $congress = null;
    private $tz = null;

    function load() {
        $congressId = $this->congressId;
        $instanceId = $this->instanceId;
        $res = $this->app->bridge->get("/congresses/$congressId/instances/$instanceId", array(
            'fields' => ['tz', 'dateFrom', 'dateTo'],
        ), 240);
        if ($res['k']) {
            $this->congress = $res['b'];
            try {
                $this->tz = new \DateTimeZone($res['b']['tz']);
            } catch (Exception $e) {}
        }
    }

    function renderProgramItem($program, $locations) {
        $node = $this->doc->createElement('div');
        $node->setAttribute('class', 'program-item');

        $timeFrom = (new \DateTime('@' . $program['timeFrom'], $this->tz))->format('H:i');
        $timeTo = (new \DateTime('@' . $program['timeTo'], $this->tz))->format('H:i');

        $timeLabel = $this->doc->createElement('div');
        $timeLabel->setAttribute('class', 'item-time-span');
        $timeFromLabel = $this->doc->createElement('span');
        $timeFromLabel->setAttribute('class', 'time-from');
        $timeSpanLabel = $this->doc->createElement('span');
        $timeSpanLabel->setAttribute('class', 'time-span');
        $timeToLabel = $this->doc->createElement('span');
        $timeToLabel->setAttribute('class', 'time-to');
        $timeFromLabel->textContent = $timeFrom;
        $timeSpanLabel->textContent = '–';
        $timeToLabel->textContent = $timeTo;
        $timeLabel->appendChild($timeFromLabel);
        $timeLabel->appendChild($timeSpanLabel);
        $timeLabel->appendChild($timeToLabel);
        $node->appendChild($timeLabel);

        $titleNode = $this->doc->createElement('h3');
        $titleNode->setAttribute('class', 'program-title');
        $titleNode->textContent = $program['title'];
        $node->appendChild($titleNode);

        if ($program['location']) {
            $location = $locations[$program['location']];

            $locationContainer = $this->doc->createElement('div');
            $locationContainer->setAttribute('class', 'location-container');

            $locationPre = $this->doc->createElement('span');
            $locationPre->textContent = $this->plugin->locale['congress_programs']['program_location_pre'] . ' ';
            $locationContainer->appendChild($locationPre);

            if ($location['icon']) {
                $locationIcon = $this->doc->createElement('img');
                $locationIcon->setAttribute('class', 'location-icon');
                $locationIcon->setAttribute('src', CongressLocations::ICONS_PATH_PREFIX . $location['icon'] . CongressLocations::ICONS_PATH_SUFFIX);
                $locationContainer->appendChild($locationIcon);
            }

            $locationName = $this->doc->createElement('a');
            $locationName->setAttribute('class', 'location-name');
            $locationName->textContent = $location['name'];
            $locationContainer->appendChild($locationName);

            if ($this->locationsPath) {
                $locationName->setAttribute('href', $this->locationsPath . '?' . CongressLocations::QUERY_LOC . '=' . $location['id']);
            }

            $node->appendChild($locationContainer);
        }

        $description = $this->doc->createElement('div');
        $rules = ['emphasis', 'strikethrough', 'link', 'list', 'table', 'image'];
        $res = $this->app->bridge->renderMarkdown($program['description'], $rules);
        $this->setInnerHTML($description, $res['c']);
        $node->appendChild($description);

        return $node;
    }

    function setInnerHTML($node, $html) {
        $fragment = $node->ownerDocument->createDocumentFragment();
        $fragment->appendXML($html);
        $node->appendChild($fragment);
    }

    function batchLoadLocations($ids) {
        $locations = [];
        for ($i = 0; true; $i += 100) {
            $congressId = $this->congressId;
            $instanceId = $this->instanceId;
            $res = $this->app->bridge->get("/congresses/$congressId/instances/$instanceId/locations", array(
                'fields' => ['id', 'name', 'icon'],
                'filter' => ['id' => ['$in' => $ids->slice(0, 100)->toArray()]],
                'limit' => 100,
                'offset' => $i,
            ));
            if (!$res['k']) {
                // TODO: emit error
                break;
            }
            foreach ($res['b'] as $loc) {
                $locations[$loc['id']] = $loc;
                $ids->remove($loc['id']);
            }
            if ($ids->isEmpty()) break;
        }
        return $locations;
    }

    /// - $date: like 2020-01-02
    function renderDayAgenda($date, $showNoItems = false) {
        $unixFrom = \DateTime::createFromFormat("Y-m-d", $date, $this->tz);
        $unixFrom->setTime(0, 0, 0);
        $unixTo = \DateTime::createFromFormat("Y-m-d", $date, $this->tz);
        $unixTo->setTime(24, 0, 0);
        $unixFrom = (int) $unixFrom->format('U');
        $unixTo = (int) $unixTo->format('U');

        $programs = [];

        while (true) {
            $congressId = $this->congressId;
            $instanceId = $this->instanceId;
            $res = $this->app->bridge->get("/congresses/$congressId/instances/$instanceId/programs", array(
                'fields' => ['id', 'title', 'description', 'timeFrom', 'timeTo', 'location'],
                'filter' => array(
                    'timeTo' => ['$gte' => $unixFrom],
                    'timeFrom' => ['$lt' => $unixTo],
                ),
                'offset' => count($programs),
                'order' => [['timeFrom', 'asc']],
                'limit' => 100,
            ), 60);
            if (!$res['k']) {
                // TODO: emit error
                break;
            }
            foreach ($res['b'] as $program) {
                $programs[] = $program;
            }
            if (count($programs) >= $res['h']['x-total-items']) break;
        }

        $locationIds = new \Ds\Set();
        foreach ($programs as $program) {
            if ($program['location']) {
                $locationIds->add($program['location']);
            }
        }
        $locations = $this->batchLoadLocations($locationIds);

        $root = $this->doc->createElement('div');
        $root->setAttribute('class', 'program-day-agenda');

        foreach ($programs as $program) {
            $root->appendChild($this->renderProgramItem($program, $locations));
        }

        if ($showNoItems && count($programs) === 0) {
            $noItems = $this->doc->createElement('div');
            $noItems->setAttribute('class', 'no-items');
            $noItems->textContent = $this->plugin->locale['congress_programs']['no_items_on_this_day'];
            $root->appendChild($noItems);
        }

        return $root;
    }

    function renderDaySwitcher($currentDate) {
        $node = $this->doc->createElement('div');
        $node->setAttribute('class', 'program-day-switcher');

        $cursor = \DateTime::createFromFormat('Y-m-d', $this->congress['dateFrom']);
        for ($i = 0; $i < 255; $i++) {
            $date = $cursor->format('Y-m-d');

            $isCurrent = $date == $currentDate;
            $button = $this->doc->createElement('a');
            $button->setAttribute('class', 'program-day link-button' . ($isCurrent ? ' is-primary' : ''));
            $button->textContent = $date;
            $node->appendChild($button);

            $button->setAttribute('href', $this->plugin->getGrav()['uri']->path() . '?' . self::QUERY_DATE . '=' . $date);

            $cursor->setDate($cursor->format('Y'), $cursor->format('m'), $cursor->format('d') + 1);
            if ($cursor->format('Y-m-d') == $this->congress['dateTo']) {
                break;
            }
        }

        return $node;
    }

    function readCurrentDate() {
        $dateFrom = \DateTime::createFromFormat('Y-m-d', $this->congress['dateFrom']);
        $dateTo = \DateTime::createFromFormat('Y-m-d', $this->congress['dateTo']);

        $currentDate = new \DateTime('now', $this->tz);

        if (isset($_GET[self::QUERY_DATE]) && gettype($_GET[self::QUERY_DATE]) === 'string') {
            $qdate = \DateTime::createFromFormat('Y-m-d', $_GET[self::QUERY_DATE]);
            if ($qdate !== false) $currentDate = $qdate;
        }

        if ($dateFrom->diff($currentDate)->invert) {
            // current date is before date from
            $currentDate = $dateFrom;
        } else if ($currentDate->diff($dateTo)->invert) {
            // current date is after date to
            $currentDate = $dateFrom;
        }
        return $currentDate->format('Y-m-d');
    }

    public function run() {
        $currentDate = $this->readCurrentDate();

        $contents = $this->doc->saveHtml($this->renderDaySwitcher($currentDate));
        $contents .= $this->doc->saveHtml($this->renderDayAgenda($currentDate, true));

        return array(
            'contents' => $contents,
        );
    }
}

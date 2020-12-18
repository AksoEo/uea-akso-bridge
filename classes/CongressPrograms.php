<?php
namespace Grav\Plugin\AksoBridge;

use Grav\Plugin\AksoBridge\CongressLocations;
use Grav\Plugin\AksoBridge\Utils;

class CongressPrograms {
    const QUERY_DATE = 'd';
    const QUERY_PROG = 'prog';

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

        $titleContainer = $this->doc->createElement('div');
        $titleContainer->setAttribute('class', 'program-title-container');
        $node->appendChild($titleContainer);

        $linkTarget = $this->plugin->getGrav()['uri']->path() . '?' . self::QUERY_PROG . '=' . $program['id'];

        $titleNode = $this->doc->createElement('h3');
        $titleNode->setAttribute('class', 'program-title');
        $titleLinkNode = $this->doc->createElement('a');
        $titleLinkNode->setAttribute('href', $linkTarget);
        $titleLinkNode->textContent = $program['title'];
        $titleNode->appendChild($titleLinkNode);
        $titleContainer->appendChild($titleNode);

        if ($program['location'] && isset($locations[$program['location']])) {
            $location = $locations[$program['location']];

            $locationContainer = $this->doc->createElement('div');
            $locationContainer->setAttribute('class', 'location-container');

            $locationPre = $this->doc->createElement('span');
            $locationPre->setAttribute('class', 'location-itext');
            $locationPre->textContent = $this->plugin->locale['congress_programs']['program_location_pre'] . ' ';
            $locationContainer->appendChild($locationPre);

            $locationLink = $this->doc->createElement('a');
            $locationLink->setAttribute('class', 'location-link');
            $locationContainer->appendChild($locationLink);

            if ($location['icon']) {
                $locationIcon = $this->doc->createElement('img');
                $locationIcon->setAttribute('class', 'location-icon');
                $locationIcon->setAttribute('src', CongressLocations::ICONS_PATH_PREFIX . $location['icon'] . CongressLocations::ICONS_PATH_SUFFIX);
                $locationLink->appendChild($locationIcon);
            }

            $locationName = $this->doc->createElement('span');
            $locationName->setAttribute('class', 'location-name');
            $locationName->textContent = $location['name'];
            $locationLink->appendChild($locationName);

            if ($this->locationsPath) {
                $locationLink->setAttribute('href', $this->locationsPath . '?' . CongressLocations::QUERY_LOC . '=' . $location['id']);
            }

            $titleContainer->appendChild($locationContainer);
        }

        $description = $this->doc->createElement('div');
        $description->setAttribute('class', 'program-description');
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

    /// - $date: string like 2020-01-02
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

        $dayTitle = $this->doc->createElement('h2');
        $dayTitle->setAttribute('class', 'program-day-title');
        $dayTitle->textContent = Utils::formatDayMonth($date);
        $root->appendChild($dayTitle);

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

    function renderWholeAgenda() {
        $root = $this->doc->createElement('div');
        $root->setAttribute('class', 'whole-program');

        $cursor = \DateTime::createFromFormat('Y-m-d', $this->congress['dateFrom']);
        for ($i = 0; $i < 255; $i++) {
            $date = $cursor->format('Y-m-d');

            $root->appendChild($this->renderDayAgenda($date, true));

            $cursor->setDate($cursor->format('Y'), $cursor->format('m'), $cursor->format('d') + 1);
            if ($cursor->format('Y-m-d') == $this->congress['dateTo']) {
                break;
            }
        }

        return $root;
    }

    function renderDaySwitcher($currentDate) {
        $node = $this->doc->createElement('div');
        $node->setAttribute('class', 'program-day-switcher');

        $button = $this->doc->createElement('a');
        $button->setAttribute('class', 'program-day link-button' . (!$currentDate ? ' is-primary' : ''));
        $button->setAttribute('href', $this->plugin->getGrav()['uri']->path());
        $button->textContent = $this->plugin->locale['congress_programs']['day_switcher_all'];
        $node->appendChild($button);

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

    function renderProgramPage($programId) {
        $congressId = $this->congressId;
        $instanceId = $this->instanceId;
        $res = $this->app->bridge->get("/congresses/$congressId/instances/$instanceId/programs/$programId", array(
            'fields' => ['id', 'timeFrom', 'timeTo', 'title', 'location', 'description', 'owner'],
        ), 60);
        if (!$res['k']) {
            return null;
        }
        $program = $res['b'];

        $timeFrom = new \DateTime('@' . $program['timeFrom'], $this->tz);
        $timeTo = new \DateTime('@' . $program['timeTo'], $this->tz);
        $dateFrom = $timeFrom->format('Y-m-d');
        $timeFrom = $timeFrom->format('H:i');
        $timeTo = $timeTo->format('H:i');

        $root = $this->doc->createElement('div');
        $root->setAttribute('class', 'program-page');

        {
            $time = $this->doc->createElement('div');
            $time->setAttribute('class', 'program-time');
            $root->appendChild($time);

            $timeDate = $this->doc->createElement('span');
            $time->appendChild($timeDate);
            $timeDate->setAttribute('class', 'time-date');
            $timeDate->textContent = Utils::formatDayMonth($dateFrom);

            $timeSpanContainer = $this->doc->createElement('span');
            $timeSpanContainer->setAttribute('class', 'time-span-container');
            $time->appendChild($timeSpanContainer);
            $timeSpanFrom = $this->doc->createElement('span');
            $timeSpanContainer->appendChild($timeSpanFrom);
            $timeSpanFrom->textContent = $timeFrom;

            $timeSpanSpan = $this->doc->createElement('span');
            $timeSpanSpan->setAttribute('class', 'time-span-span');
            $timeSpanContainer->appendChild($timeSpanSpan);
            $timeSpanSpan->textContent = '–';

            $timeSpanTo = $this->doc->createElement('span');
            $timeSpanContainer->appendChild($timeSpanTo);
            $timeSpanTo->textContent = $timeTo;
        }

        {
            $ptitle = $this->doc->createElement('h1');
            $ptitle->setAttribute('class', 'program-title');
            $ptitle->textContent = $program['title'];
            $root->appendChild($ptitle);
        }

        if ($program['location']) {
            $locationIds = new \Ds\Set();
            $locationIds->add($program['location']);
            $locations = $this->batchLoadLocations($locationIds);
            $location = $locations[$program['location']];

            if ($location) {
                $container = $this->doc->createElement('div');
                $container->setAttribute('class', 'location-container');
                $root->appendChild($container);

                $containerText = $this->doc->createElement('span');
                $containerText->setAttribute('class', 'location-itext');
                $containerText->textContent = $this->plugin->locale['congress_programs']['program_location_pre'];
                $container->appendChild($containerText);

                $container->appendChild($this->doc->createTextNode(' '));

                $locationLink = $this->doc->createElement('a');
                $locationLink->setAttribute('class', 'location-link');
                $container->appendChild($locationLink);

                if ($location['icon']) {
                    $locationIcon = $this->doc->createElement('img');
                    $locationIcon->setAttribute('class', 'location-icon');
                    $locationIcon->setAttribute('src', CongressLocations::ICONS_PATH_PREFIX . $location['icon'] . CongressLocations::ICONS_PATH_SUFFIX);
                    $locationLink->appendChild($locationIcon);
                }

                $locationName = $this->doc->createElement('span');
                $locationName->setAttribute('class', 'location-name');
                $locationName->textContent = $location['name'];
                $locationLink->appendChild($locationName);

                if ($this->locationsPath) {
                    $locationLink->setAttribute('href', $this->locationsPath . '?' . CongressLocations::QUERY_LOC . '=' . $location['id']);
                }
            }
        }

        if ($program['owner']) {
            $programOwner = $this->doc->createElement('div');
            $programOwner->setAttribute('class', 'program-owner');
            $root->appendChild($programOwner);

            $programOwnerText = $this->doc->createElement('span');
            $programOwnerText->textContent = $this->plugin->locale['congress_programs']['program_owner_pre'];
            $programOwnerText->setAttribute('class', 'owner-itext');
            $programOwner->appendChild($programOwnerText);

            $programOwner->appendChild($this->doc->createTextNode(' '));

            $programOwnerContent = $this->doc->createElement('span');
            $programOwnerContent->setAttribute('class', 'owner-content');
            $programOwnerContent->textContent = $program['owner'];
            $programOwner->appendChild($programOwnerContent);
        }

        $description = $this->doc->createElement('div');
        $description->setAttribute('class', 'program-description');
        $rules = ['emphasis', 'strikethrough', 'link', 'list', 'table', 'image'];
        $res = $this->app->bridge->renderMarkdown($program['description'], $rules);
        $this->setInnerHTML($description, $res['c']);
        $root->appendChild($description);

        return $root;
    }

    // returns YYYY-MM-DD string or null.
    function readCurrentDate() {
        $dateFrom = \DateTime::createFromFormat('Y-m-d', $this->congress['dateFrom']);
        $dateTo = \DateTime::createFromFormat('Y-m-d', $this->congress['dateTo']);

        $currentDate = null;

        if (isset($_GET[self::QUERY_DATE]) && gettype($_GET[self::QUERY_DATE]) === 'string') {
            $qdate = \DateTime::createFromFormat('Y-m-d', $_GET[self::QUERY_DATE]);
            if ($qdate !== false) $currentDate = $qdate;
        }
        if (!$currentDate) return null;

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
        $contents;

        if (isset($_GET[self::QUERY_PROG]) && gettype($_GET[self::QUERY_PROG]) === 'string') {
            $programId = (int) $_GET[self::QUERY_PROG];

            $contents = $this->doc->saveHtml($this->renderProgramPage($programId));
        }

        if (!$contents) {
            $currentDate = $this->readCurrentDate();

            $contents = $this->doc->saveHtml($this->renderDaySwitcher($currentDate));
            if ($currentDate) {
                $contents .= $this->doc->saveHtml($this->renderDayAgenda($currentDate, true));
            } else {
                $contents .= $this->doc->saveHtml($this->renderWholeAgenda());
            }
        }


        return array(
            'contents' => $contents,
        );
    }
}

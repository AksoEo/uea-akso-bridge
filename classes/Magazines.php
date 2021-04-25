<?php
namespace Grav\Plugin\AksoBridge;

use Grav\Plugin\AksoBridge\Utils;

class Magazines {
    const MAGAZINE = 'revuo';
    const EDITION = 'numero';

    private $plugin, $app;

    public function __construct($plugin, $app) {
        $this->plugin = $plugin;
        $this->app = $app;
    }

    public const TH_MAGAZINE = 'm';
    public const TH_EDITION = 'e';
    public const TH_SIZE = 's';
    public function runThumbnail() {
        $magazine = isset($_GET[self::TH_MAGAZINE]) ? $_GET[self::TH_MAGAZINE] : '?';
        $edition = isset($_GET[self::TH_EDITION]) ? $_GET[self::TH_EDITION] : '?';
        $size = isset($_GET[self::TH_SIZE]) ? $_GET[self::TH_SIZE] : '?';
        $path = "/magazines/$magazine/editions/$edition/thumbnail/$size";

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

    function editionDataAddHasThumbnail($magazine, $edition) {
        $edition['hasThumbnail'] = false;
        try {
            $editionId = $edition['id'];
            $path = "/magazines/$magazine/editions/$editionId/thumbnail/32px";
            $res = $this->app->bridge->getRaw($path, 120);
            if ($res['k']) {
                $edition['hasThumbnail'] = true;
            }
            $this->app->bridge->releaseRaw($path);
        } catch (\Exception $e) {}
        return $edition;
    }

    function getLatestEdition($magazine) {
        $res = $this->app->bridge->get("/magazines/$magazine/editions", array(
            'fields' => ['id', 'idHuman', 'date', 'description'],
            'order' => [['date', 'desc']],
            'offset' => 0,
            'limit' => 1,
        ), 120);

        if ($res['k']) {
            $edition = $res['b'][0];
            $edition = $this->editionDataAddHasThumbnail($magazine, $edition);

            return $edition;
        }
        return null;
    }

    private $cachedMagazines = null;
    function listMagazines() {
        if (!$this->cachedMagazines) {
            $this->cachedMagazines = [];
            // TODO: handle case where there are more than 100 magazines
            $res = $this->app->bridge->get('/magazines', array(
                'fields' => ['id', 'name'],
                'limit' => 100,
            ), 240);
            if ($res['k']) {
                foreach ($res['b'] as $magazine) {
                    $magazine['latest'] = $this->getLatestEdition($magazine['id']);
                    if (!$magazine['latest']) continue;
                    $this->cachedMagazines[$magazine['id']] = $magazine;
                }
            }
            uasort($this->cachedMagazines, function ($a, $b) {
                if ($a === $b) return 0;
                // RFC3339 can be sorted lexicographically
                return strnatcmp($a['latest']['date'], $b['latest']['date']);
            });
        }
        return $this->cachedMagazines;
    }

    function getMagazine($id) {
        $res = $this->app->bridge->get("/magazines/$id", array(
            'fields' => ['id', 'name', 'description'],
        ), 240);
        if ($res['k']) {
            return $res['b'];
        }
        return null;
    }

    function getMagazineEditions($magazine, $offset = 0) {
        $allEditions = [];
        while (true) {
            $res = $this->app->bridge->get("/magazines/$magazine/editions", array(
                'fields' => ['id', 'idHuman', 'date'],
                'order' => [['date', 'desc']],
                'offset' => count($allEditions),
                'limit' => 100,
            ), 240);

            if (!$res['k']) {
                return null;
            }
            foreach ($res['b'] as $edition) {
                $edition = $this->editionDataAddHasThumbnail($magazine, $edition);
                $allEditions[] = $edition;
            }

            if (count($allEditions) >= $res['h']['x-total-items']) break;
        }

        $editionsByYear = [];
        foreach ($allEditions as $edition) {
            preg_match('/^(\d+)/', $edition['date'], $matches);
            $year = (int) $matches[1];
            if (!isset($editionsByYear[$year])) $editionsByYear[$year] = [];
            $editionsByYear[$year][] = $edition;
        }
        return $editionsByYear;
    }

    function getMagazineEdition($magazine, $edition) {
        $res = $this->app->bridge->get("/magazines/$magazine/editions/$edition", array(
            'fields' => ['id', 'idHuman', 'date'],
        ), 240);
        if ($res['k']) {
            $edition = $res['b'];
            $edition = $this->editionDataAddHasThumbnail($magazine, $edition);
            return $edition;
        }
        return null;
    }

    function getEditionTocEntries($magazine, $edition) {
        $allEntries = [];
        while (true) {
            $res = $this->app->bridge->get("/magazines/$magazine/editions/$edition/toc", array(
                'fields' => ['id', 'title', 'page', 'author', 'recitationAuthor', 'highlighted'],
                'order' => [['page', 'asc']],
                'offset' => count($allEntries),
                'limit' => 100,
            ), 240);
            if (!$res['k']) return null;
            foreach ($res['b'] as $entry) {
                $allEntries[] = $entry;
            }
            if (count($allEntries) >= $res['h']['x-total-items']) break;
        }

        return $allEntries;
    }

    public function run() {
        $path = $this->plugin->getGrav()['page']->header()->path_subroute;
        $route = ['type' => 'error'];
        if (!$path) {
            $route = ['type' => 'list'];
        } else if (preg_match('/^(\d+)$/', $path, $matches)) {
            $route = [
                'type' => 'magazine',
                'magazine' => $matches[1],
            ];
        } else if (preg_match('/^(\d+)\/' . self::EDITION . '\/(\d+)$/', $path, $matches)) {
            $route = [
                'type' => 'edition',
                'magazine' => $matches[1],
                'edition' => $matches[2],
            ];
        }

        $pathComponents = array( 
            'base' => $this->plugin->getGrav()['page']->header()->path_base,
            'magazine' => self::MAGAZINE,
            'edition' => self::EDITION,
        );

        if ($route['type'] === 'list') {
            return array(
                'path_components' => $pathComponents,
                'type' => 'list',
                'magazines' => $this->listMagazines(),
            );
        } else if ($route['type'] === 'magazine') {
            $magazine = $this->getMagazine($route['magazine']);
            if (!$magazine) return array('type' => 'error');
            $editions = $this->getMagazineEditions($route['magazine']);

            return array(
                'path_components' => $pathComponents,
                'type' => 'magazine',
                'magazine' => $magazine,
                'editions' => $editions,
            );
        } else if ($route['type'] === 'edition') {
            $magazine = $this->getMagazine($route['magazine']);
            if (!$magazine) return array('type' => 'error');
            $edition = $this->getMagazineEdition($route['magazine'], $route['edition']);
            if (!$edition) return array('type' => 'error');

            return array(
                'type' => 'edition',
                'magazine' => $magazine,
                'edition' => $edition,
                'toc_entries' => $this->getEditionTocEntries($route['magazine'], $route['edition']),
            );
        } else if ($route['type'] === 'error') {
            // TODO
            return array('type' => 'error');
        }
    }
}

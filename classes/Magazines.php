<?php
namespace Grav\Plugin\AksoBridge;

use Grav\Plugin\AksoBridge\Utils;

class Magazines {
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
}

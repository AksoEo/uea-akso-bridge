<?php
namespace Grav\Plugin\AksoBridge;

use \DiDom\Document;
use \DiDom\Element;

// Handles rendering of congress fields in markdown.
class CongressFields {
    private $bridge;
    private $cache = array();

    public function __construct($bridge) {
        $this->bridge = $bridge;
    }

    private function getCongressField($congress, $field) {
        $id = $congress;
        if (!isset($this->cache[$id])) {
            $res = $this->bridge->get('/congresses/' . $congress, array(
                'fields' => ['name', 'abbrev'],
            ), 60);
            if (!$res['k']) {
                return [array(
                    'name' => 'span',
                    'attributes' => array(
                        'class' => 'akso-congress-field-error',
                        // you would think this would be escaped but it isn't!
                        'title' => htmlspecialchars('' . $res['b']),
                    ),
                    'text' => '[Eraro]',
                )];
            }
            $this->cache[$id] = $res['b'];
        }
        $data = $this->cache[$id];

        if ($field === 'nomo') return [array('name' => 'span', 'text' => $data['name'])];
        if ($field === 'mallongigo') return [array('name' => 'span', 'text' => $data['abbrev'])];
        return [array(
            'name' => 'span',
            'attributes' => array(
                'class' => 'akso-congress-field-error',
                // you would think this would be escaped but it isn't!
                'title' => htmlspecialchars('nekonata kampo “' . $field . '”'),
            ),
            'text' => '[Eraro]',
        )];
    }

    private function getInstanceField($congress, $instance, $field) {
        $id = $congress . '/' . $instance;
        if (!isset($this->cache[$id])) {
            $res = $this->bridge->get('/congresses/' . $congress . '/instances/' . $instance, array(
                'fields' => ['name', 'humanId', 'dateFrom', 'dateTo'],
            ), 60);
            if (!$res['k']) {
                return [array(
                    'name' => 'span',
                    'attributes' => array(
                        'class' => 'akso-congress-field-error',
                        // you would think this would be escaped but it isn't!
                        'title' => htmlspecialchars('' . $res['b']),
                    ),
                    'text' => '[Eraro]',
                )];
            }
            $this->cache[$id] = $res['b'];
        }
        $data = $this->cache[$id];

        if ($field === 'nomo') return [array('name' => 'span', 'text' => $data['name'])];
        if ($field === 'homaid') return [array('name' => 'span', 'text' => $data['humanId'])];
        if ($field === 'komenco') return [array('name' => 'span', 'text' => $this->formatDate($data['dateFrom']))];
        if ($field === 'fino') return [array('name' => 'span', 'text' => $this->formatDate($data['dateTo']))];
        if ($field === 'tempokalkulo' || $field === 'tempokalkulo!') {
            $firstEventRes = $this->bridge->get('/congresses/' . $congress . '/instances/' . $instance . '/programs', array(
                'order' => ['timeFrom.asc'],
                'fields' => [
                    'timeFrom',
                ],
                'offset' => 0,
                'limit' => 1,
            ), 60);
            $congressStartTime = null;
            if ($firstEventRes['k'] && sizeof($firstEventRes['b']) > 0) {
                // use the start time of the first event if available
                $firstEvent = $firstEventRes['b'][0];
                $congressStartTime = \DateTime::createFromFormat("U", $firstEvent['timeFrom']);
            } else {
                // otherwise just use noon in local time
                $timeZone = $data['tz'] ? new \DateTimeZone($data['tz']) : new \DateTimeZone('+00:00');
                $dateStr = $data['dateFrom'] . ' 12:00:00';
                $congressStartTime = \DateTime::createFromFormat("Y-m-d H:i:s", $dateStr, $timeZone);
            }

            $isLarge = $field === 'tempokalkulo!';

            return [array(
                'name' => 'span',
                'attributes' => array(
                    'class' => 'congress-countdown live-countdown' . ($isLarge ? ' is-large' : ''),
                    'data-timestamp' => $congressStartTime->getTimestamp(),
                ),
            )];
        }
        return [array(
            'name' => 'span',
            'attributes' => array(
                'class' => 'akso-congress-field-error',
                // you would think this would be escaped but it isn't!
                'title' => htmlspecialchars('nekonata kampo “' . $field . '”'),
            ),
            'text' => '[Eraro]',
        )];
    }

    public function renderField($extent, $field, $congress, $instance) {
        $isInstance = $instance !== null;

        $contents = null;
        if ($isInstance) {
            $contents = $this->getInstanceField($congress, $instance, $field);
        } else {
            $contents = $this->getCongressField($congress, $field);
        }

        return array(
            'extent' => $extent,
            'element' => array(
                'name' => 'span',
                'handler' => 'elements',
                'attributes' => array(
                    'class' => 'akso-congress-field',
                ),
                'text' => $contents,
            ),
        );
    }

    public function handleHTMLCongressStuff($doc) {
        $countdowns = $doc->find('.congress-countdown');
        foreach ($countdowns as $countdown) {
            $ts = $countdown->getAttribute('data-timestamp');
            $tsTime = new \DateTime();
            $tsTime->setTimestamp((int) $ts);
            $now = new \DateTime();
            $deltaInterval = $now->diff($tsTime);

            $contents = new Element('span', $this->formatDuration($deltaInterval));
            $countdown->appendChild($contents);
        }

        $locations = $doc->find('.congress-location');
        foreach ($locations as $location) {
            $contents = new Element('span', $location->getAttribute('data-name'));
            $location->appendChild($contents);
        }

        $dateSpans = $doc->find('.congress-date-span');
        foreach ($dateSpans as $dateSpan) {
            $startDate = \DateTime::createFromFormat('Y-m-d', $dateSpan->getAttribute('data-from'));
            $endDate = \DateTime::createFromFormat('Y-m-d', $dateSpan->getAttribute('data-to'));

            if (!$startDate || !$endDate) continue;

            $startYear = $startDate->format('Y');
            $endYear = $endDate->format('Y');
            $startMonth = $startDate->format('m');
            $endMonth = $endDate->format('m');
            $startDate = $startDate->format('d');
            $endDate = $endDate->format('d');

            $span = '';
            if ($startYear === $endYear) {
                if ($startMonth === $endMonth) {
                    $span = $startDate . '–' . $endDate . ' ' . $this->formatMonth($startMonth) . ' ' . $startYear;
                } else {
                    $span = $startDate . ' ' . $this->formatMonth($startMonth);
                    $span .= '–' . $endDate . ' ' . $this->formatMonth($endMonth);
                    $span .= ' ' . $startYear;
                }
            } else {
                $span = $startDate . ' ' . $this->formatMonth($startMonth) . ' ' . $startYear;
                $span .= '–' . $endDate . ' ' . $this->formatMonth($endMonth) . ' ' . $endYear;
            }

            $contents = new Element('span', $span);
            $dateSpan->appendChild($contents);
        }
    }

    private function formatDate($dateString) {
        $date = \DateTime::createFromFormat('Y-m-d', $dateString);
        $formatted = $date->format('d') . ' ' . $this->formatMonth($date->format('m')) . ' ' . $date->format('Y');
        return $formatted;
    }

    private function formatDuration($interval) {
        $prefix = $interval->invert ? 'antaŭ ' : 'post ';

        $years = $interval->y;
        $months = $interval->m;
        $days = $interval->d;
        $hours = $interval->h;
        $minutes = $interval->i;
        $seconds = $interval->s;

        $out = '';
        $space = "⁠"; // u+2060 word joiner
        $zspace = " "; // figure space

        if ($years > 0) {
            return $prefix . $years . ' jaro' . (($years > 1) ? 'j' : '');
        }
        if ($months > 0) {
            return $prefix . $months . ' monato' . (($months > 1) ? 'j' : '');
        }

        if ($days >= 7) {
            return $prefix . $days . ' tagoj';
        } else if ($days > 0) {
            $out .= $days . $space . 't' . $zspace;
        }
        if ($days > 0 || $hours > 0) $out .= $hours . $space . 'h' . $zspace;
        $out .= $minutes . $space . 'm';
        return $prefix . $out;
    }

    private function formatMonth($number) {
        $months = [
            '???',
            'januaro',
            'februaro',
            'marto',
            'aprilo',
            'majo',
            'junio',
            'julio',
            'aŭgusto',
            'septembro',
            'oktobro',
            'novembro',
            'decembro',
        ];
        return $months[(int) $number];
    }
}

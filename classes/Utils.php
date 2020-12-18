<?php
namespace Grav\Plugin\AksoBridge;

class Utils {
    static function formatDate($dateString) {
        $date = \DateTime::createFromFormat('Y-m-d', $dateString);
        $formatted = $date->format('d') . '-a de ' . Utils::formatMonth($date->format('m')) . ' ' . $date->format('Y');
        return $formatted;
    }

    static function formatDayMonth($dateString) {
        $date = \DateTime::createFromFormat('Y-m-d', $dateString);
        $formatted = $date->format('d') . '-a de ' . Utils::formatMonth($date->format('m'));
        return $formatted;
    }

    static function formatDuration($interval) {
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

    static function formatMonth($number) {
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

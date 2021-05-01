<?php
namespace Grav\Plugin\AksoBridge;

class Utils {
    static function setInnerHTML($node, $html) {
        $fragment = $node->ownerDocument->createDocumentFragment();
        $fragment->appendXML($html);
        $node->appendChild($fragment);
    }

    static function formatDate($dateString) {
        $date = \DateTime::createFromFormat('Y-m-d', $dateString);
        if (!$date) return null;
        $formatted = $date->format('j') . '-a de ' . Utils::formatMonth($date->format('m')) . ' ' . $date->format('Y');
        return $formatted;
    }

    static function formatDayMonth($dateString) {
        $date = \DateTime::createFromFormat('Y-m-d', $dateString);
        if (!$date) return null;
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

    static function base32_decode($input) {
        // src: https://www.php.net/manual/en/function.base-convert.php#102232
        $map = array(
            'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', //  7
            'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', // 15
            'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', // 23
            'Y', 'Z', '2', '3', '4', '5', '6', '7', // 31
            '='  // padding char
        );
        $flippedMap = array(
            'A'=>'0', 'B'=>'1', 'C'=>'2', 'D'=>'3', 'E'=>'4', 'F'=>'5', 'G'=>'6', 'H'=>'7',
            'I'=>'8', 'J'=>'9', 'K'=>'10', 'L'=>'11', 'M'=>'12', 'N'=>'13', 'O'=>'14', 'P'=>'15',
            'Q'=>'16', 'R'=>'17', 'S'=>'18', 'T'=>'19', 'U'=>'20', 'V'=>'21', 'W'=>'22', 'X'=>'23',
            'Y'=>'24', 'Z'=>'25', '2'=>'26', '3'=>'27', '4'=>'28', '5'=>'29', '6'=>'30', '7'=>'31'
        );
        if(empty($input)) return;
        $paddingCharCount = substr_count($input, $map[32]);
        $allowedValues = array(6,4,3,1,0);
        if(!in_array($paddingCharCount, $allowedValues)) return false;
        for($i=0; $i<4; $i++){ 
            if($paddingCharCount == $allowedValues[$i] && 
                substr($input, -($allowedValues[$i])) != str_repeat($map[32], $allowedValues[$i])) return false;
        }
        $input = str_replace('=','', $input);
        $input = str_split($input);
        $binaryString = "";
        for($i=0; $i < count($input); $i = $i+8) {
            $x = "";
            if(!in_array($input[$i], $map)) return false;
            for($j=0; $j < 8; $j++) {
                $x .= str_pad(base_convert(@$flippedMap[@$input[$i + $j]], 10, 2), 5, '0', STR_PAD_LEFT);
            }
            $eightBits = str_split($x, 8);
            for($z = 0; $z < count($eightBits); $z++) {
                $binaryString .= ( ($y = chr(base_convert($eightBits[$z], 2, 10))) || ord($y) == 48 ) ? $y:"";
            }
        }
        return $binaryString;
    }

    static function escapeFileNameLossy($name) {
        return preg_replace('/[^ .,_\-+=!\(\)\[\]"\'„“”‚‘’«»…0-9a-zA-ZĥŝĝĉĵŭĤŜĜĈĴŬ]/', '_', $name);
    }
}

<?php
namespace Grav\Plugin\TNTSearch;

use TeamTNT\TNTSearch\Support\AbstractTokenizer;
use TeamTNT\TNTSearch\Support\TokenizerInterface;
use Grav\Plugin\AksoBridge\Utils;

class AKSOTNTTokenizer extends AbstractTokenizer implements TokenizerInterface {
    static protected $pattern = '/[^\p{L}\p{N}\p{Pc}\p{Pd}@]+/u';

    public function tokenize($text, $stopwords = [])
    {
        $text = mb_strtolower($text);
        $tokens = [];
        $splits = preg_split($this->getPattern(), $text, -1, PREG_SPLIT_NO_EMPTY);
        foreach ($splits as $split) {
            $latinized = Utils::latinizeEsperanto($split, false);
            if ($latinized != $split) {
                $tokens[] = $latinized;
                $tokens[] = Utils::latinizeEsperanto($split, true); // also add h system
            }
            $tokens[] = $split;
        }
        return $tokens;
    }
}


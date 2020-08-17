<?php
namespace Grav\Plugin\AksoBridge;

use \DiDom\Document;
use \DiDom\Element;
use Grav\Common\Plugin;
use Grav\Common\Markdown\Parsedown;
use RocketTheme\Toolbox\Event\Event;
use Grav\Plugin\AksoBridge\CongressFields;

// loaded from AKSO bridge
class MarkdownExt {
    private $plugin; // owner plugin

    function __construct($plugin) {
        $this->plugin = $plugin;
    }

    public function onMarkdownInitialized(Event $event) {
        $grav = $this->plugin->getGrav();

        $this->app = new AppBridge($grav);
        $this->apiHost = $this->app->apiHost;
        $this->app->open();
        $this->bridge = $this->app->bridge;

        $this->congressFields = new CongressFields($this->bridge);

        $markdown = $event['markdown'];

        $markdown->addBlockType('!', 'SectionMarker');
        $markdown->blockSectionMarker = function($line) {
            if (preg_match('/^!###\s+(.*)/', $line['text'], $matches)) {
                $text = trim($matches[1], ' ');
                return array(
                    'element' => array(
                        'name' => 'h3',
                        'attributes' => array(
                            'class' => 'section-marker',
                        ),
                        'text' => $text,
                    ),
                );
            }
        };

        $markdown->addBlockType('[', 'Figure', true, true);
        $markdown->blockFigure = function($line, $block) {
            if (preg_match('/^\[\[figuro(\s+!)?\]\]/', $line['text'], $matches)) {
                $fullWidth = isset($matches[1]);

                return array(
                    'char' => $line['text'][0],
                    'element' => array(
                        'name' => 'figure',
                        'attributes' => array(
                            'class' => ($fullWidth ? 'full-width' : ''),
                        ),
                        // parse markdown inside
                        'handler' => 'blockFigureContents',
                        // line handler needs a string
                        'text' => '',
                    ),
                );
            }
        };
        $markdown->blockFigureContinue = function($line, $block) {
            if (isset($block['complete'])) {
                return;
            }

            // A blank newline has occurred.
            if (isset($block['interrupted'])) {
                return;
            }

            // Check for end of the block.
            if (preg_match('/\[\[\/figuro\]\]/', $line['text'])) {
                $block['complete'] = true;
                return $block;
            }

            $block['element']['text'] .= $line['body'];

            return $block;
        };
        $markdown->blockFigureComplete = function($block) {
            return $block;
        };

        // copy-pasted from Parsedown source (line) and modified
        $markdown->blockFigureContents = \Closure::bind(function($text, $nonNestables = array()) {
            $markup = '';
            $inCaption = false;

            # $excerpt is based on the first occurrence of a marker
            while ($excerpt = strpbrk($text, $this->inlineMarkerList)) {
                $marker = $excerpt[0];
                $markerPosition = strpos($text, $marker);
                $Excerpt = array('text' => $excerpt, 'context' => $text);

                foreach ($this->InlineTypes[$marker] as $inlineType) {
                    # check to see if the current inline type is nestable in the current context
                    if (!empty($nonNestables) and in_array($inlineType, $nonNestables)) {
                        continue;
                    }
                    $Inline = $this->{'inline'.$inlineType}($Excerpt);
                    if (!isset($Inline)) {
                        continue;
                    }

                    # makes sure that the inline belongs to "our" marker
                    if (isset($Inline['position']) and $Inline['position'] > $markerPosition) {
                        continue;
                    }
                    # sets a default inline position
                    if (!isset($Inline['position'])) {
                        $Inline['position'] = $markerPosition;
                    }
                    # cause the new element to 'inherit' our non nestables
                    foreach ($nonNestables as $non_nestable) {
                        $Inline['element']['nonNestables'][] = $non_nestable;
                    }
                    # the text that comes before the inline
                    $unmarkedText = substr($text, 0, $Inline['position']);
                    $unmarkedText = $this->unmarkedText($unmarkedText);

                    if ($unmarkedText != '') {
                        if (!$inCaption) {
                            $markup .= '<figcaption>';
                            $inCaption = true;
                        }

                        # compile the unmarked text
                        $markup .= $unmarkedText;
                    }

                    $element = $Inline['element'];
                    if (isset($element) and isset($element['name']) and $element['name'] === 'img') {
                        if ($inCaption) {
                            $markup .= '</figcaption>';
                            $inCaption = false;
                        }
                    } else if (!$inCaption) {
                        $markup .= '<figcaption>';
                        $inCaption = true;
                    }

                    # compile the inline
                    $markup .= isset($Inline['markup']) ? $Inline['markup'] : $this->element($Inline['element']);
                    # remove the examined text
                    $text = substr($text, $Inline['position'] + $Inline['extent']);
                    continue 2;
                }

                # the marker does not belong to an inline
                $unmarkedText = substr($text, 0, $markerPosition + 1);
                $unmarkedText = $this->unmarkedText($unmarkedText);
                if ($unmarkedText != '') {
                    if (!$inCaption) {
                        $markup .= '<figcaption>';
                        $inCaption = true;
                    }
                    $markup .= $unmarkedText;
                }
                $text = substr($text, $markerPosition + 1);
            }

            $unmarkedText = $this->unmarkedText($text);
            if ($unmarkedText != '') {
                if (!$inCaption) {
                    $markup .= '<figcaption>';
                    $inCaption = true;
                }
                $markup .= $unmarkedText;
            }
            if ($inCaption) {
                $markup .= '</figcaption>';
            }

            return $markup;
        }, $markdown, $markdown);

        /* for Parsedown 1.8 (untested)
        $markdown->blockFigureContents = \Closure::bind(function($text, $nonNestables = array()) {
            $elements = $this->lineElements($text, $nonNestables);
            $markup = '';
            $autoBreak = true;
            $inCaption = false; // if true, we’re inside a <figcaption>
            foreach ($elements as $element) {
                if (empty($element)) {
                    continue;
                }
                $autoBreakNext = (isset($element['autobreak'])
                    ? $element['autobreak'] : isset($element['name'])
                );
                // (autobreak === false) covers both sides of an element
                $autoBreak = !$autoBreak ? $autoBreak : $autoBreakNext;

                $elMarkup = '';

                if (isset($element['name']) and $element['name'] === 'img') {
                    // image tag; put it directly in the figure body
                    if ($inCaption) {
                        $elMarkup .= '</figcaption>';
                        $inCaption = false;
                    }
                } else {
                    // some other thing; put it in the caption
                    if (!$inCaption) {
                        $elMarkup .= '<figcaption>';
                        $inCaption = true;
                    }
                }
                $elMarkup .= $this->element($element);

                $markup .= ($autoBreak ? "\n" : '') . $elMarkup;
                $autoBreak = $autoBreakNext;
            }
            if ($inCaption) {
                $markup .= '</figcaption>';
            }
            return $markup;
        }, $markdown, $markdown);
        */

        // add an infobox type
        $markdown->addBlockType('[', 'InfoBox', true, true);

        $markdown->blockInfoBox = function($line, $block) {
            if (preg_match('/^\[\[informskatolo\]\]/', $line['text'], $matches)) {
                return array(
                    'char' => $line['text'][0],
                    'element' => array(
                        'name' => 'blockquote',
                        'attributes' => array(
                            'class' => 'infobox',
                        ),
                        // parse markdown inside
                        'handler' => 'lines',
                        // lines handler needs an array of lines
                        'text' => array(),
                    ),
                );
            }
        };
        $markdown->blockInfoBoxContinue = function($line, $block) {
            if (isset($block['complete'])) {
                return;
            }

            // A blank newline has occurred.
            if (isset($block['interrupted'])) {
                array_push($block['element']['text'], "\n");
                unset($block['interrupted']);
            }

            // Check for end of the block.
            if (preg_match('/\[\[\/informskatolo\]\]/', $line['text'])) {
                $block['complete'] = true;
                return $block;
            }

            array_push($block['element']['text'], $line['body']);

            return $block;
        };
        $markdown->blockInfoBoxComplete = function($block) {
            return $block;
        };

        $markdown->addBlockType('[', 'Expandable', true, true);
        $markdown->blockExpandable = function($line, $block) {
            if (preg_match('/^\[\[etendeblo\]\]/', $line['text'], $matches)) {
                return array(
                    'char' => $line['text'][0],
                    'element' => array(
                        'name' => 'details',
                        'attributes' => array(
                            'class' => 'unhandled-expandable',
                        ),
                        'handler' => 'lines',
                        'text' => array(),
                    ),
                );
            }
        };
        $markdown->blockExpandableContinue = function($line, $block) {
            if (isset($block['complete'])) {
                return;
            }

            // A blank newline has occurred.
            if (isset($block['interrupted'])) {
                array_push($block['element']['text'], "\n");
                unset($block['interrupted']);
            }

            // Check for end of the block.
            if (preg_match('/\[\[\/etendeblo\]\]/', $line['text'])) {
                $block['complete'] = true;
                return $block;
            }

            array_push($block['element']['text'], $line['body']);

            return $block;
        };
        $markdown->blockExpandableComplete = function($block) {
            return $block;
        };

        $markdown->addBlockType('[', 'Carousel', true, true);
        $markdown->blockCarousel = function($line, $block) {
            if (preg_match('/^\[\[bildkaruselo\]\]/', $line['text'], $matches)) {
                return array(
                    'char' => $line['text'][0],
                    'element' => array(
                        'name' => 'figure',
                        'attributes' => array(
                            'class' => 'full-width carousel',
                        ),
                        'handler' => 'lines',
                        'text' => array(),
                    ),
                );
            }
        };
        $markdown->blockCarouselContinue = function($line, $block) {
            if (isset($block['complete'])) {
                return;
            }

            // A blank newline has occurred.
            if (isset($block['interrupted'])) {
                $block['element']['text'][] = "\n";
                unset($block['interrupted']);
            }

            // Check for end of the block.
            if (preg_match('/\[\[\/bildkaruselo\]\]/', $line['text'])) {
                $block['complete'] = true;
                return $block;
            }

            $block['element']['text'][] = $line['body'];

            return $block;
        };
        $markdown->blockCarouselComplete = function($block) {
            return $block;
        };

        $self = $this;

        $markdown->addBlockType('[', 'IfAksoMember', true, true);
        $markdown->blockIfAksoMember = function($line, $block) {
            if (preg_match('/^\[\[se membro\]\]/', $line['text'], $matches)) {
                return array(
                    'char' => $line['text'][0],
                    'element' => array(
                        'name' => 'div',
                        'attributes' => array(
                            'class' => 'akso-members-only-content',
                        ),
                        'handler' => 'elements',
                        'text' => [
                            array(
                                'name' => 'div',
                                'attributes' => array(
                                    'class' => 'akso-members-only-content-if-clause',
                                ),
                                'handler' => 'lines',
                                'text' => [],
                            ),
                            array(
                                'name' => 'div',
                                'attributes' => array(
                                    'class' => 'akso-members-only-content-else-clause',
                                ),
                                'handler' => 'lines',
                                'text' => [],
                            ),
                        ],
                    ),
                );
            }
        };
        $markdown->blockIfAksoMemberContinue = function($line, $block) {
            if (isset($block['complete'])) {
                return;
            }
            // A blank newline has occurred.
            if (isset($block['interrupted'])) {
                array_push($block['element']['text'], "\n");
                unset($block['interrupted']);
            }
            // Check for end of the block.
            if (preg_match('/\[\[\/se membro\]\]/', $line['text'])) {
                $block['complete'] = true;
                return $block;
            } else if (preg_match('/\[\[alie\]\]/', $line['text'])) {
                $block['in_else_clause'] = true;
                return $block;
            }

            if (isset($block['in_else_clause'])) {
                array_push($block['element']['text'][1]['text'], $line['body']);
            } else {
                array_push($block['element']['text'][0]['text'], $line['body']);
            }
            return $block;
        };
        $markdown->blockIfAksoMemberComplete = function($block) {
            return $block;
        };

        $markdown->addBlockType('[', 'AksoOnlyMembers');
        $markdown->blockAksoOnlyMembers = function($line, $block) use ($self) {
            if (preg_match('/^\[\[nurmembroj\]\]/', $line['text'], $matches)) {
                $error = null;
                $codeholders = [];

                return array(
                    'element' => array(
                        'name' => 'div',
                        'attributes' => array(
                            'class' => 'akso-members-only-box',
                        ),
                        'text' => '',
                    ),
                );
            }
        };


        // A MILDLY CURSED SOLUTION
        // due to grav's markdown handling being rather limited, this will not immediately
        // render the list html after fetching the data. Instead, it will write it as a JSON
        // string for the HTML handler below to *actually* render
        $markdown->addBlockType('[', 'AksoList');
        $markdown->blockAksoList = function($line, $block) use ($self) {
            if (preg_match('/^\[\[listo\s+(\d+)\]\]/', $line['text'], $matches)) {
                $listId = $matches[1];

                $error = null;
                $codeholders = [];

                while (true) {
                    $haveItems = count($codeholders);
                    $res = $self->bridge->get('/lists/public/' . $listId . '/codeholders', array(
                        'fields' => [
                            'id',
                            'name',
                            'email',
                            'emailPublicity',
                            'address',
                            'addressPublicity',
                            'biography',
                            'website',
                            'profilePictureHash',
                            'profilePicturePublicity'
                        ],
                        'offset' => $haveItems,
                        'limit' => 100
                    ));

                    if (!$res['k']) {
                        $error = '[internal error while fetching list: ' . $res['b'] . ']';
                        break;
                    }

                    foreach ($res['b'] as $ch) {
                        // php refuses to encode json if we dont do this
                        $ch['profilePictureHash'] = bin2hex($ch['profilePictureHash']);

                        $codeholders[] = $ch;
                    }

                    $totalItems = $res['h']['x-total-items'];
                    if (count($codeholders) < $totalItems) {
                        if (count($res['b']) == 0) {
                            // avoid an infinite loop
                            $error = '[internal inconsistency while fetching list: server reported ' . $totalItems . ' item(s) but refuses to send any more than ' . $haveItems . ']';
                            break;
                        }
                    } else {
                        // we have all items
                        break;
                    }
                }

                $text = '!' . $error;
                if ($error === null) {
                    $text = json_encode(array(
                        'codeholders' => $codeholders,
                        'id' => $listId
                    ));
                }

                return array(
                    'element' => array(
                        'name' => 'div',
                        'attributes' => array(
                            'class' => 'unhandled-list',
                        ),
                        'text' => $text
                    ),
                );
            }
        };

        $markdown->addBlockType('[', 'AksoNews');
        $markdown->blockAksoNews = function($line, $block) use ($self) {
            if (preg_match('/^\[\[aktuale\]\]/', $line['text'], $matches)) {
                $error = null;
                $codeholders = [];

                return array(
                    'element' => array(
                        'name' => 'div',
                        'attributes' => array(
                            'class' => 'news-sidebar',
                        ),
                        'text' => 'news goes here'
                    ),
                );
            }
        };

        $markdown->addBlockType('[', 'AksoMagazines');
        $markdown->blockAksoMagazines = function($line, $block) use ($self) {
            if (preg_match('/^\[\[revuoj((?:\s+\d+)+)\]\]/', $line['text'], $matches)) {
                $error = null;
                $codeholders = [];

                $ids = preg_split('/\s+/', $matches[1]);

                return array(
                    'element' => array(
                        'name' => 'div',
                        'attributes' => array(
                            'class' => 'unhandled-akso-magazines',
                        ),
                        'text' => 'magazines' . implode(' ', $ids) . ' go here'
                    ),
                );
            }
        };

        $markdown->addBlockType('[', 'AksoCongresses');
        $markdown->blockAksoCongresses = function($line, $block) use ($self) {
            if (preg_match('/^\[\[kongresoj((?:\s+\d+)+)\]\]/', $line['text'], $matches)) {
                $error = null;
                $codeholders = [];

                return array(
                    'element' => array(
                        'name' => 'div',
                        'attributes' => array(
                            'class' => 'akso-congresses',
                        ),
                        'text' => 'congresses ' . $matches[1] . ' go here'
                    ),
                );
            }
        };

        $markdown->addInlineType('[', 'AksoCongressField');
        $markdown->inlineAksoCongressField = function($excerpt) use ($self) {
            if (preg_match('/^\[\[kongreso\s+(\w+)\s+(\d+)(?:\/(\d+))?\]\]/', $excerpt['text'], $matches)) {
                $fieldName = strtolower($matches[1]);
                $congress = intval($matches[2]);
                $instance = isset($matches[3]) ? intval($matches[3]) : null;
                $extent = strlen($matches[0]);

                $rendered = $self->congressFields->renderField($extent, $fieldName, $congress, $instance);
                if ($rendered != null) return $rendered;
            }
        };
    }

    public function onPageContentProcessed(Event $event) {
        $this->app->close();
    }

    public function onOutputGenerated(Event $event) {
        if ($this->plugin->isAdmin()) {
            return;
        }
        $grav = $this->plugin->getGrav();
        $grav->output = $this->performHTMLPostProcessingTasks($grav->output);
    }

    // Separates full-width figures from the rest of the content.
    // also moves the sidebar nav to an appropriate position
    // adapted from https://github.com/trilbymedia/grav-plugin-image-captions/blob/develop/image-captions.php
    protected function performHTMLPostProcessingTasks($content) {
        if (strlen($content) === 0) {
            return '';
        }

        $document = new Document($content);
        $mains = $document->find('main#main-content');
        if (count($mains) === 0) return $content;

        $rootNode = $mains[0];
        $topLevelChildren = $rootNode->children();
        $containers = array();
        $sidebarNews = null;
        foreach ($topLevelChildren as $child) {
            if ($child->isElementNode() and $child->class === 'news-sidebar') {
                $sidebarNews = $child;
            } else if ($child->isElementNode() and $child->tag === 'figure' and strpos($child->class, 'full-width') !== false) {
                // full-width figure!
                $containers[] = array(
                    'kind' => 'figure',
                    'contents' => $child,
                );
            } else {
                if ($child->isTextNode() and trim($child->text()) === '') {
                    continue;
                }

                if (count($containers) === 0 || $containers[count($containers) - 1]['kind'] !== 'container') {
                    $containers[] = array(
                        'kind' => 'container',
                        'contents' => array(),
                    );
                }
                // not a full-width figure
                $containers[count($containers) - 1]['contents'][] = $child;
            }
            $child->remove();
        }

        // first item is a full-width figure; split here

        $newRootNode = new Element('main');
        $newRootNode->class = 'page-container';
        $contentSplitNode = new Element('div');
        $contentSplitNode->class = 'page-split';
        $contentRootNode = new Element('div');
        $contentRootNode->class = 'page-contents';

        $firstIsBigFigure = (count($containers) > 0) && ($containers[0]['kind'] === 'figure');

        if ($firstIsBigFigure) {
            $fig = $containers[0]['contents'];
            $fig->class .= ' is-top-figure';
            array_splice($containers, 0, 1);
            $newRootNode->appendChild($fig);
        }

        // move sidebar nav
        $navSidebar = $document->find('#nav-sidebar');
        if (count($navSidebar) > 0 || $sidebarNews !== null) {
            if ($sidebarNews !== null) {
                $contentSplitNode->appendChild($sidebarNews);
            }
            if (count($navSidebar) > 0) {
                $navSidebar = $navSidebar[0];
                $navSidebar->remove();
                $contentSplitNode->appendChild($navSidebar);
            }
        } else {
            $newRootNode->class .= ' is-not-split';
        }

        $isFirstContainer = true;
        foreach ($containers as $container) {
            if ($container['kind'] === 'figure') {
                $contentRootNode->appendChild($container['contents']);
            } else {
                $containerNode = new Element('div');
                $containerNode->class = 'md-container';
                foreach ($container['contents'] as $contentNode) {
                    $containerNode->appendChild($contentNode);
                }
                if ($isFirstContainer) {
                    $contentSplitNode->appendChild($containerNode);
                } else {
                    $containerContainerNode = new Element('div');
                    $containerContainerNode->class = 'md-split-container';
                    $layoutSpacer = new Element('div');
                    $layoutSpacer->class = 'layout-spacer';
                    $containerContainerNode->appendChild($layoutSpacer);
                    $containerContainerNode->appendChild($containerNode);
                    $contentRootNode->appendChild($containerContainerNode);
                }
            }
            $isFirstContainer = false;
        }

        $newRootNode->appendChild($contentSplitNode);
        $newRootNode->appendChild($contentRootNode);
        $rootNode->replace($newRootNode);

        $this->handleHTMLCarousels($document);
        $this->handleHTMLSectionMarkers($document);
        $this->handleHTMLExpandables($document);
        $this->handleHTMLLists($document);
        $this->handleHTMLNews($document);
        $this->handleHTMLMagazines($document);
        $this->handleHTMLIfMembers($document);
        $this->congressFields->handleHTMLCongressStuff($document);

        return $this->cleanupTags($document->html());
    }

    protected function handleHTMLCarousels($doc) {
        $carousels = $doc->find('figure.carousel');
        $didPassImg = false;
        foreach ($carousels as $carousel) {
            $topLevelChildren = $carousel->children();
            $pages = array();
            $currentCaption = array();
            foreach ($topLevelChildren as $tlChild) {
                $tlChild->remove();

                if ($tlChild->isElementNode() && $tlChild->tag === 'p') {
                    $pChildren = $tlChild->children();
                    $newPChildren = array();
                    foreach ($pChildren as $pChild) {
                        if ($pChild->isElementNode() && $pChild->tag === 'img') {
                            // split here
                            if (count($newPChildren) > 0) {
                                $newP = new Element('p');
                                foreach ($newPChildren as $npc) {
                                    $newP->appendChild($npc);
                                }
                                $currentCaption[] = $newP;
                                $newPChildren = array();
                            }
                            if (count($currentCaption) > 0 && $didPassImg) {
                                $newCaption = &$pages[count($pages) - 1]['caption'];
                                foreach ($currentCaption as $ccc) {
                                    $newCaption->appendChild($ccc);
                                }
                                $currentCaption = array();
                            }

                            $pages[] = array(
                                'img' => $pChild,
                                'caption' => new Element('figcaption')
                            );
                            $didPassImg = true;
                        } else {
                            $newPChildren[] = $pChild;
                        }
                    }

                    // flush rest
                    if (count($newPChildren) > 0) {
                        $newP = new Element('p');
                        foreach ($newPChildren as $npc) {
                            $newP->appendChild($npc);
                        }
                        $currentCaption[] = $newP;
                        $newPChildren[] = array();
                    }
                } else {
                    $currentCaption[] = $tlChild;
                }
            }

            // flush rest
            if (count($currentCaption) > 0 && $didPassImg) {
                $newCaption = &$pages[count($pages) - 1]['caption'];
                foreach ($currentCaption as $ccc) {
                    $newCaption->appendChild($ccc);
                }
                $currentCaption = array();
            }

            foreach ($pages as $ntlChild) {
                $pageContainer = new Element('div');
                $pageContainer->class = 'carousel-page';
                $pageContainer->appendChild($ntlChild['img']);
                $pageContainer->appendChild($ntlChild['caption']);
                $carousel->appendChild($pageContainer);
            }
            if (sizeof($pages) === 1) {
                $carousel->class .= ' is-single-page';
            }
        }
    }

    protected function handleHTMLSectionMarkers($doc) {
        $secMarkers = $doc->find('.section-marker');
        foreach ($secMarkers as $sm) {
            $text = $sm->text();
            $newSM = new Element('h3');
            $newSM->class = 'section-marker';
            $contentSpan = new Element('span', $text);
            $contentSpan->class = 'section-marker-inner';
            $newSM->appendChild($contentSpan);
            $fillSpan = new Element('span');
            $fillSpan->class = 'section-marker-fill';
            $newSM->appendChild($fillSpan);
            $sm->replace($newSM);
        }
    }

    protected function handleHTMLExpandables($doc) {
        $unhandledExpandables = $doc->find('.unhandled-expandable');
        foreach ($unhandledExpandables as $exp) {
            $topLevelChildren = $exp->children();
            $summaryNodes = array();
            $didPassFirstBreak = false;
            $remainingNodes = array();
            foreach ($topLevelChildren as $child) {
                if (!$didPassFirstBreak and $child->isElementNode() and $child->tag === 'hr') {
                    $didPassFirstBreak = true;
                    continue;
                }
                if (!$didPassFirstBreak) {
                    $summaryNodes[] = $child;
                } else {
                    $remainingNodes[] = $child;
                }
            }
            $newExpNode = new Element('details');
            $newExpNode->class = 'expandable';
            $summaryNode = new Element('summary');
            foreach ($summaryNodes as $child) {
                $summaryNode->appendChild($child);
            }
            $newExpNode->appendChild($summaryNode);
            foreach ($remainingNodes as $child) {
                $newExpNode->appendChild($child);
            }
            $exp->replace($newExpNode);
        }
    }

    protected function handleHTMLLists($doc) {
        $isMember = false;
        if ($this->plugin->aksoUser !== null) {
            $isMember = $this->plugin->aksoUser['member'];
        }

        $unhandledLists = $doc->find('.unhandled-list');
        foreach ($unhandledLists as $list) {
            $textContent = $list->text();
            if (strncmp($textContent, '!', 1) === 0) {
                // this is an error; set class and skip
                $list->class = 'codeholder-list is-error';
                continue;
            }

            $newList = new Element('ul');
            $newList->class = 'codeholder-list';

            try {
                $data = json_decode($textContent);
                $listId = $data->id;
                $codeholders = $data->codeholders;

                foreach ($codeholders as $codeholder) {
                    $chNode = new Element('li');
                    $chNode->class = 'codeholder-item';
                    $chNode->setAttribute('data-codeholder-id', $codeholder->id);

                    $left = new Element('div');
                    $left->class = 'item-picture-container';
                    $img = new Element('img');
                    $img->class = 'item-picture';

                    $canSeePP = $isMember || $codeholder->profilePicturePublicity === 'public';

                    if ($canSeePP && $codeholder->profilePictureHash) {
                        // codeholder has a profile picture
                        $picPrefix = $this->apiHost . '/lists/public/' . $listId . '/codeholders/' . $codeholder->id . '/profile_picture/';
                        $img->src = $picPrefix . '128px';
                        $img->srcset = $picPrefix . '128px 1x, ' . $picPrefix . '256px 2x, ' . $picPrefix . '512px 3x';
                    } else {
                        $left->class .= ' is-empty';
                    }

                    $left->appendChild($img);

                    $right = new Element('div');
                    $right->class = 'item-details';

                    $nameContainer = new Element('div', $codeholder->name);
                    $nameContainer->class = 'item-name';
                    $right->appendChild($nameContainer);

                    $canSeeEmail = $isMember || $codeholder->emailPublicity === 'public';

                    if ($canSeeEmail && $codeholder->email) {
                        $emailContainer = new Element('div');
                        $emailContainer->class = 'item-email';
                        $emailLink = new Element('a');
                        $emailLink->class = 'non-interactive-address';
                        $emailLink->href = 'javascript:void(0)';

                        // obfuscated email
                        $parts = preg_split('/(?=[@\.])/', $codeholder->email);
                        for ($i = 0; $i < count($parts); $i++) {
                            $text = $parts[$i];
                            $after = '';
                            $delim = '';
                            if ($i !== 0) {
                                // split off delimiter
                                $delim = substr($text, 0, 1);
                                $mid = ceil(strlen($text) * 2 / 3);
                                $after = substr($text, $mid);
                                $text = substr($text, 1, $mid - 1);
                            } else {
                                $mid = ceil(strlen($text) * 2 / 3);
                                $after = substr($text, $mid);
                                $text = substr($text, 0, $mid);
                            }
                            $emailPart = new Element('span', $text);
                            $emailPart->class = 'epart';
                            $emailPart->setAttribute('data-at-sign', '@');
                            $emailPart->setAttribute('data-after', $after);

                            if ($delim === '@') {
                                $emailPart->setAttribute('data-show-at', 'true');
                            } else if ($delim === '.') {
                                $emailPart->setAttribute('data-show-dot', 'true');
                            }

                            $emailLink->appendChild($emailPart);
                        }

                        $invisible = new Element('span', ' (uzu retumilon kun CSS por vidi retpoŝtadreson)');
                        $invisible->class = 'fpart';
                        $emailLink->appendChild($invisible);

                        $emailContainer->appendChild($emailLink);
                        $right->appendChild($emailContainer);
                    }

                    if ($codeholder->website) {
                        $websiteContainer = new Element('div');
                        $websiteContainer->class = 'item-website';
                        $websiteLink = new Element('a', $codeholder->website);
                        $websiteLink->target = '_blank';
                        $websiteLink->rel = 'nofollow noreferrer';
                        $websiteLink->href = $codeholder->website;
                        $websiteContainer->appendChild($websiteLink);
                        $right->appendChild($websiteContainer);
                    }

                    if ($codeholder->biography) {
                        $bioContainer = new Element('div', $codeholder->biography);
                        $bioContainer->class = 'item-bio';
                        $right->appendChild($bioContainer);
                    }

                    $chNode->appendChild($left);
                    $chNode->appendChild($right);

                    $newList->appendChild($chNode);
                }

                $list->replace($newList);
            } catch (Exception $e) {
                // oh no
                $newList->class .= ' is-error';
                $list->replace($newList);
            }
        }
    }

    protected function handleHTMLNews($doc) {
        $unhandledNews = $doc->find('.news-sidebar');
        foreach ($unhandledNews as $news) {
            $textContent = $news->text();
            if (strncmp($textContent, '!', 1) === 0) {
                // this is an error; set class and skip
                $news->class = 'news-sidebar is-error';
                continue;
            }

            $newNews = new Element('ul');
            $newNews->class = 'news-sidebar';

            try {
                $newNews->setInnerHTML('<li class="news-item">
                        <a href="testo" class="item-title">Cats Exist</a>
                        <div class="item-meta">April 7th, 2020</div>
                        <div class="item-description">
                            After a thorough peer-reviewed study of reality, a team of researchers has determined that cats do, in fact, exist, and are not simply a myth as was previously believed.
                        </div>
                    </li><li class="news-item">
                        <a href="katido" class="item-title">Important Announcement</a>
                        <div class="item-meta">April 1st, 2020</div>
                        <div class="item-description">
                            Zamenhof’s constructed language “Esperanto” is canceled due to COVID-19, sorry everyone.
                        </div>
                    </li><li class="news-item">
                        <a href="pri" class="item-title">UEA retejo ne havas API-on</a>
                        <div class="item-meta">29-a de marto, 2020</div>
                        <div class="item-description">
                            La nova retejo de UEA ne ankoraŭ havas API-on, do ni uzas la novan inventon “vortoj” por skribi ĉi tiujn novaĵojn.
                        </div>
                    </li>');
                $news->replace($newNews);
            } catch (Exception $e) {
                // oh no
                $newNews->class .= ' is-error';
                $news->replace($newNews);
            }
        }
    }

    protected function handleHTMLMagazines($doc) {
        $unhandledMagazines = $doc->find('.unhandled-akso-magazines');
        foreach ($unhandledMagazines as $magazines) {
            $textContent = $magazines->text();
            if (strncmp($textContent, '!', 1) === 0) {
                // this is an error; set class and skip
                $magazines->class = 'akso-magazines is-error';
                continue;
            }

            $newMagazines = new Element('ul');
            $newMagazines->class = 'akso-magazines';

            try {
                $newMagazines->setInnerHTML('<li class="magazine">
                        <div class="magazine-cover-container">
                            <img class="magazine-cover" src="https://uea.org/bildoj/bildoj_r/grandaj/Aprila20Reta.pdf.jpg">
                        </div>
                        <div class="magazine-title">Esperanto</div>
                        <div class="magazine-meta">Aprilo 2020</div>
                    </li><li class="magazine">
                        <div class="magazine-cover-container">
                            <img class="magazine-cover" src="https://uea.org/bildoj/bildoj_r/grandaj/Kontakto1_2020.pdf.jpg">
                        </div>
                        <div class="magazine-title">Kontakto</div>
                        <div class="magazine-meta">Januaro-Februaro 2020</div>
                    </li>');
                $magazines->replace($newMagazines);
            } catch (Exception $e) {
                // oh no
                $newMagazines->class .= ' is-error';
                $magazines->replace($newMagazines);
            }
        }
    }

    protected function handleHTMLIfMembers($doc) {
        $isLoggedIn = false;
        $isMember = false;
        if ($this->plugin->aksoUser !== null) {
            $isLoggedIn = true;
            $isMember = $this->plugin->aksoUser['member'];
        }

        $ifMembers = $doc->find('.akso-members-only-content');
        foreach ($ifMembers as $ifMember) {
            $contents = null;
            if ($isMember) {
                $contents = $ifMember->find('.akso-members-only-content-if-clause')[0];
            } else {
                $contents = $ifMember->find('.akso-members-only-content-else-clause')[0];
            }
            $contents->class = 'akso-members-only-content';
            $ifMember->replace($contents);
        }

        $membersOnlyBoxes = $doc->find('.akso-members-only-box');
        foreach ($membersOnlyBoxes as $membersOnlyBox) {
            if ($isMember) {
                $membersOnlyBox->class .= ' user-is-member';
                continue;
            }

            $membersOnlyBox->appendChild(new Element('div', 'Tiu ĉi enhavo estas nur videbla por membroj.'));

            $loginLink = new Element('a', 'Ensalutu');
            $signUpLink = new Element('a', $isLoggedIn ? 'Al la aliĝilo' : 'al la aliĝilo');

            $loginLink->href = $this->plugin->loginPath;
            $signUpLink->href = 'TODO'; // TODO: this link

            if ($isLoggedIn) {
                $signUpLink->class = 'link-button';
                $membersOnlyBox->appendChild($signUpLink);
            } else {
                $membersOnlyBox->appendChild($loginLink);
                $membersOnlyBox->appendChild(new Element('span', ' se vi jam havas konton ĉe UEA. Alie, iru '));
                $membersOnlyBox->appendChild($signUpLink);
                $membersOnlyBox->appendChild(new Element('span', '.'));
            }
        }
    }

    /**
     * Removes html and body tags at the begining and end of the html source
     *
     * @param $html
     * @return string
     */
    private function cleanupTags($html)
    {
        // remove html/body tags
        $html = preg_replace('#<html><body>#', '', $html);
        $html = preg_replace('#</body></html>#', '', $html);

        // remove whitespace
        $html = trim($html);

        /*// remove p tags
        preg_match_all('#<p>(?:\s*)((<a*.>)?.*)(?:\s*)(<figure((?:.|\n)*?)*(?:\s*)<\/figure>)(?:\s*)(<\/a>)?(?:\s*)<\/p>#m', $html, $matches);

        if (is_array($matches) && !empty($matches)) {
            $num_matches = count($matches[0]);
            for ($i = 0; $i < $num_matches; $i++) {
                $original = $matches[0][$i];
                $new = $matches[1][$i] . $matches[3][$i] . $matches[5][$i];

                $html = str_replace($original, $new, $html);
            }
        }*/

        return $html;
    }
}

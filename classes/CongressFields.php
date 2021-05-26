<?php
namespace Grav\Plugin\AksoBridge;

use \DiDom\Document;
use \DiDom\Element;

// Handles rendering of congress fields in markdown.
class CongressFields {
    private $plugin;
    private $bridge;
    private $cache = array();

    public function __construct($bridge, $plugin) {
        $this->plugin = $plugin;
        $this->bridge = $bridge;
    }

    // Renders an HTML descriptor for the given congress field
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

    // Renders an HTML descriptor for the given congress instance field
    private function getInstanceField($congress, $instance, $field, $args) {
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
        if ($field === 'komenco') return [array('name' => 'span', 'text' => Utils::formatDate($data['dateFrom']))];
        if ($field === 'fino') return [array('name' => 'span', 'text' => Utils::formatDate($data['dateTo']))];
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
                $timeZone = isset($data['tz']) ? new \DateTimeZone($data['tz']) : new \DateTimeZone('+00:00');
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
        } else if ($field === 'aliĝintoj') {
            return $this->renderCongressParticipants($congress, $instance, $data, $args);
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

    // Renders a congress/instance field. (Set instance to null for congress field).
    // Returns an HTML node descriptor.
    public function renderField($extent, $field, $congress, $instance, $args) {
        $isInstance = $instance !== null;

        $contents = null;
        if ($isInstance) {
            $contents = $this->getInstanceField($congress, $instance, $field, $args);
        } else {
            $contents = $this->getCongressField($congress, $field, $args);
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

    // HTML post-processing.
    public function handleHTMLCongressStuff($doc) {
        $countdowns = $doc->find('.congress-countdown');
        foreach ($countdowns as $countdown) {
            $ts = $countdown->getAttribute('data-timestamp');
            $tsTime = new \DateTime();
            $tsTime->setTimestamp((int) $ts);
            $now = new \DateTime();
            $deltaInterval = $now->diff($tsTime);

            $contents = new Element('span', Utils::formatDuration($deltaInterval));
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
                    $span = $startDate . '–' . $endDate . ' ' . Utils::formatMonth($startMonth) . ' ' . $startYear;
                } else {
                    $span = $startDate . ' ' . Utils::formatMonth($startMonth);
                    $span .= '–' . $endDate . ' ' . Utils::formatMonth($endMonth);
                    $span .= ' ' . $startYear;
                }
            } else {
                $span = $startDate . ' ' . Utils::formatMonth($startMonth) . ' ' . $startYear;
                $span .= '–' . $endDate . ' ' . Utils::formatMonth($endMonth) . ' ' . $endYear;
            }

            $contents = new Element('span', $span);
            $dateSpan->appendChild($contents);
        }
    }

    private function renderCongressParticipants($congressId, $instanceId, $instanceInfo, $args) {
        if (count($args) < 2) {
            return [array(
                'name' => 'span',
                'attributes' => array('class' => 'akso-congress-field-error'),
                'text' => '[Eraro]',
            )];
        }
        $show_name_field = $args[0];
        $first_name_field = $args[1];

        $participants = [];
        $totalParticipants = 1;
        $fields = ['codeholderId'];
        $fields[] = 'data.' . $show_name_field;
        $fields[] = 'data.' . $first_name_field;

        while (count($participants) < $totalParticipants) {
            $res = $this->bridge->get("/congresses/$congressId/instances/$instanceId/participants", array(
                'offset' => count($participants),
                'limit' => 100,
                'fields' => $fields,
                'order' => [['sequenceId', 'asc']],
            ), 120);
            if (!$res['k']) {
                var_dump($res, $args);
                break;
            }
            $totalParticipants = $res['h']['x-total-items'];
            foreach ($res['b'] as $item) {
                $item['show_name'] = $item['data'][$show_name_field];
                $item['first_name'] = $item['data'][$first_name_field];
                $participants[] = $item;
            }
        }

        // fetch last name publicity
        $codeholders = [];

        {
            $codeholderIds = [];
            foreach ($participants as $part) {
                if ($part['codeholderId']) {
                    $codeholderIds[] = $part['codeholderId'];
                }
            }
            $off = 0;
            while ($off < count($codeholderIds)) {
                $ids = array_slice($codeholderIds, $off, 100);
                $res = $this->bridge->get("/codeholders", array(
                    'offset' => $off,
                    'limit' => count($ids),
                    'fields' => ['id', 'honorific', 'firstName', 'firstNameLegal', 'lastName', 'lastNameLegal', 'lastNamePublicity'],
                    'filter' => array('id' => array('$in' => $ids)),
                ), 120);
                if (!$res['k']) {
                    break;
                }
                $off += 100;
                foreach ($res['b'] as $item) {
                    $codeholders[$item['id']] = $item;
                }
            }
        }

        $plist = [];
        foreach ($participants as $part) {
            if (!$part['show_name']) {
                continue;
            }

            $codeholder = null;
            if ($part['codeholderId'] && isset($codeholders[$part['codeholderId']])) {
                $codeholder = $codeholders[$part['codeholderId']];
            }

            $name = $part['first_name'];
            if ($codeholder) {
                $name = $codeholder['honorific'];
                if ($name) $name .= ' ';
                $name .= $codeholder['firstName'] ?? $codeholder['firstNameLegal'];
                if ($codeholder['lastNamePublicity'] === 'public' || $codeholder['lastNamePublicity'] === 'members') {
                    // show both 'public' and 'members', because this field is visible to members only!
                    $name .= ' ' . ($codeholder['lastName'] ?? $codeholder['lastNameLegal']);
                }
                $name = trim($name);
            }

            $plist[] = array(
                'name' => 'li',
                'handler' => 'elements',
                'attributes' => array('class' => 'plist-participant'),
                'text' => [
                    array(
                        'name' => 'div',
                        'attributes' => array('class' => 'participant-name'),
                        'text' => $name,
                    )
                ],
            );
        }

        $title = $this->plugin->locale['content']['congress_participants_title'];
        $congressName = $instanceInfo['name'];
        $partCount = $this->plugin->locale['content']['congress_participants_count_0']
            . $totalParticipants . $this->plugin->locale['content']['congress_participants_count_1'];
        $participantsEl = array(
            'name' => 'div',
            'handler' => 'elements',
            'attributes' => array(
                'class' => 'akso-congress-field-participants',
                'role' => 'group',
                'aria-label' => $title,
            ),
            'text' => [array(
                'name' => 'div',
                'attributes' => array('class' => 'participants-header'),
                'handler' => 'elements',
                'text' => [array(
                    'name' => 'div',
                    'attributes' => array(
                        'class' => 'participants-title',
                        'aria-hidden' => true,
                    ),
                    'text' => $title,
                ), array(
                    'name' => 'div',
                    'attributes' => array('class' => 'participants-subtitle'),
                    'handler' => 'elements',
                    'text' => [array(
                        'name' => 'div',
                        'attributes' => array('class' => 'participants-congress-name'),
                        'text' => $congressName,
                    ), array(
                        'name' => 'div',
                        'attributes' => array('class' => 'participants-count'),
                        'text' => $partCount,
                    )],
                )],
            ), array(
                'name' => 'ul',
                'attributes' => array('class' => 'participants-list'),
                'handler' => 'elements',
                'text' => $plist,
            )],
        );

        return [array(
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
                    'handler' => 'elements',
                    'text' => [$participantsEl],
                ),
                array(
                    'name' => 'div',
                    'attributes' => array(
                        'class' => 'akso-members-only-content-else-clause',
                    ),
                    'handler' => 'elements',
                    'text' => [array(
                        'name' => 'div',
                        'attributes' => array(
                            'class' => 'akso-members-only-box',
                        ),
                        'text' => '',
                    )],
                ),
            ],
        )];
    }
}

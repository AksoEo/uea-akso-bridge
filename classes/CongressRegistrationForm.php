<?php
namespace Grav\Plugin\AksoBridge;

class CongressRegistrationForm {
    const DATA_VAR_NAME = 'form_data';

    private $app;
    private $form;
    private $currency;
    private $doc;
    private $parsedown;
    public function __construct($app, $form, $currency) {
        $this->app = $app;
        $this->form = $form;
        $this->currency = $currency;
        $this->doc = new \DOMDocument();
        $this->parsedown = new \Parsedown();
        // $this->parsedown->setSafeMode(true); // this does not work
    }

    public $redirectStatus = null;
    public $redirectTarget = null;

    // User data in API format
    private $data = null;

    // List of errors. Map<field name (string), string>
    private $errors = [];
    // Top-level error
    private $error = null;

    // Sets user data from API data.
    public function setUserData($apiData) {
        $this->data = $apiData;
    }

    /// Reads input field data from POST.
    /// Only validates types.
    function readInputFieldFromPost($item, $data) {
        $ty = $item['type'];
        $out = null;

        if ($ty === 'boolean') $out = (bool) $data;
        else if ($ty === 'number') $out = $data === "" ? null : floatval($data);
        else if ($ty === 'text') $out = $data === "" ? null : strval($data);
        else if ($ty === 'money') $out = $data === "" ? null : intval($data);
        else if ($ty === 'enum') $out = $data === "" ? null : strval($data);
        else if ($ty === 'country') $out = $data === "" ? null : strval($$data);
        else if ($ty === 'date') $out = $data === "" ? null : strval($data);
        else if ($ty === 'time') $out = $data === "" ? null : strval($data);
        else if ($ty === 'datetime') {
            if ($data !== "") {
                $tz = 'UTC';
                if ($item['tz']) $tz = $item['tz'];
                try {
                    $tz = new \DateTimeZone($tz);
                } catch (\Exception $e) {
                    $tz = new \DateTimeZone('UTC');
                }
                $dtFormat = 'Y-m-d\\TH:i:s';
                $date = \DateTime::createFromFormat($dtFormat, strval($data), $tz);
                if ($date !== false) {
                    $out = $date->getTimestamp();
                }
            }
        } else if ($ty === 'boolean_table') {
            $out = [];
            for ($i = 0; $i < $item['rows']; $i++) {
                $row = [];
                for ($j = 0; $j < $item['cols']; $j++) {
                    $cellValue = false;
                    if (isset($data[$j]) && isset($data[$j][$i])) {
                        $cellValue = (bool) $data[$j][$i];
                    }
                    $row[] = $cellValue;
                }
                $out[] = $row;
            }
        }

        return $out;
    }

    function loadPostData($data) {
        $this->data = [];

        foreach ($this->form as $item) {
            if ($item['el'] === 'input') {
                $name = $item['name'];
                $fieldData = null;
                if (isset($data[$name])) {
                    $fieldData = $data[$name];
                }

                $res = $this->readInputFieldFromPost($item, $fieldData);
                $this->data[$name] = $res;
            } else if ($item['el'] === 'script') {
                // TODO: run script
                // if exec fails/takes too long, simply assume valid and defer to server
            }
        }

        // everything ok
        return true;
    }

    // Attempts to submit the form with the given POST data.
    public function trySubmit($post) {
        if (isset($post[self::DATA_VAR_NAME])) {
            $isOk = $this->loadPostData($post[self::DATA_VAR_NAME]);
            // TODO
        } else {
            // no data, pretend nothing was sent (do nothing)
        }
    }

    function renderInputItem($item) {
        $root = $this->doc->createElement('div');
        $root->setAttribute('class', 'form-field form-item form-input-item');
        $root->setAttribute('data-name', $item['name']);
        $root->setAttribute('data-type', $item['type']);

        $data = $this->doc->createElement('div');
        $data->setAttribute('class', 'form-data');

        $ty = $item['type'];
        $name = self::DATA_VAR_NAME . '[' . $item['name'] . ']';
        $inputId = 'form-' . $item['name'];

        $value = null;
        if ($this->data && isset($this->data[$item['name']])) $value = $this->data[$item['name']];

        $label = $this->doc->createElement('label');
        $label->textContent = $item['label'];
        $label->setAttribute('for', $inputId);

        $description = null;
        if ($item['description']) {
            $description = $this->doc->createElement('p');
            $this->setInnerHTML($description, $this->parsedown->text($item['description']));
        }

        // only add 'required' server-side if it's guaranteed to be true
        $required = $item['required'] === true;
        if ($required) {
            $req = $this->doc->createElement('span');
            $req->setAttribute('class', 'label-required');
            $req->textContent = ' *';
            $label->appendChild($req);
        }
        $disabled = $item['disabled'] === true;

        // TODO: run eval with default form var values to get all defaults etc

        if ($ty === 'boolean') {
            $label->setAttribute('class', 'form-label is-boolean-label');
            $input = $this->doc->createElement('input');
            $input->setAttribute('id', $inputId);
            $input->setAttribute('name', $name);
            $input->setAttribute('type', 'checkbox');
            if ($value) $input->setAttribute('checked', '');
            if ($disabled) $input->setAttribute('disabled', '');

            $root->appendChild($input);
            $root->appendChild($label);
            if ($description) $root->appendChild($description);
        } else {
            $labelContainer = $this->doc->createElement('div');
            $labelContainer->setAttribute('class', 'form-label');
            $labelContainer->appendChild($label);
            $root->appendChild($labelContainer);
            if ($description) $root->appendChild($description);
            $root->appendChild($data);
        }

        if ($ty === 'number') {
            $input = $this->doc->createElement('input');
            $input->setAttribute('id', $inputId);
            $input->setAttribute('name', $name);
            if ($item['placeholder'] !== null) $input->setAttribute('placeholder', $item['placeholder']);
            if ($item['min'] !== null) $input->setAttribute('max', $item['min']);
            if ($item['step'] !== null) $input->setAttribute('step', $item['step']);
            if ($item['max'] !== null) $input->setAttribute('max', $item['max']);
            if ($item['variant'] === 'slider') {
                $input->setAttribute('type', 'range');
            } else {
                $input->setAttribute('type', 'number');
            }
            if ($value !== null) $input->setAttribute('value', $value);
            $data->appendChild($input);
        } else if ($ty === 'text') {
            $input = $this->doc->createElement('input');
            $input->setAttribute('id', $inputId);
            $input->setAttribute('name', $name);
            $input->setAttribute('type', $item['variant']);
            if ($item['placeholder'] !== null) $input->setAttribute('placeholder', $item['placeholder']);
            if ($item['pattern'] !== null) $input->setAttribute('pattern', $item['pattern']);
            if ($item['patternError'] !== null) $input->setAttribute('data-pattern-error', $item['patternError']);
            if ($item['minLength'] !== null) $input->setAttribute('minLength', $item['minLength']);
            if ($item['maxLength'] !== null) $input->setAttribute('maxLength', $item['maxLength']);
            if ($value !== null) $input->setAttribute('value', $value);
            // TODO: CH Autofill
            $data->appendChild($input);
        } else if ($ty === 'money') {
            $input = $this->doc->createElement('input');
            $input->setAttribute('id', $inputId);
            $input->setAttribute('name', $name);
            $input->setAttribute('type', 'number');
            $input->setAttribute('data-currency', $item['currency']);
            if ($item['placeholder'] !== null) $input->setAttribute('placeholder', $item['placeholder']);
            if ($item['min'] !== null) $input->setAttribute('max', $item['min']);
            if ($item['step'] !== null) $input->setAttribute('step', $item['step']);
            if ($item['max'] !== null) $input->setAttribute('max', $item['max']);
            if ($value !== null) $input->setAttribute('value', $value);
            $data->appendChild($input);
        } else if ($ty === 'enum') {
            if ($item['variant'] === 'select') {
                $input = $this->doc->createElement('select');
                $input->setAttribute('id', $inputId);
                $input->setAttribute('name', $name);

                if (!$required) {
                    $node = $this->doc->createElement('option');
                    $node->setAttribute('class', 'null-option');
                    $node->setAttribute('value', '');
                    $node->textContent = '—';
                    $input->appendChild($node);
                }

                foreach ($item['options'] as $option) {
                    $node = $this->doc->createElement('option');
                    $node->setAttribute('value', $option['value']);
                    $node->textContent = $option['name'];
                    if ($option['disabled']) {
                        // TODO: handle onlyExisting
                        $node->setAttribute('disabled', '');
                    }
                    if ($value === $option['value']) $node->setAttribute('selected', '');
                    $input->appendChild($node);
                }

                $data->appendChild($input);
            } else {
                $group = $this->doc->createElement('ul');
                $group->setAttribute('class', 'radio-group');
                $group->setAttribute('id', $inputId);

                foreach ($item['options'] as $option) {
                    $li = $this->doc->createElement('li');
                    // TODO: handle onlyExisting
                    if ($option['disabled']) $li->setAttribute('class', 'is-disabled');

                    $radioId = $inputId . '--' . $option['value'];

                    $radio = $this->doc->createElement('input');
                    $radio->setAttribute('type', 'radio');
                    $radio->setAttribute('name', $name);
                    $radio->setAttribute('id', $radioId);
                    if ($value === $option['value']) $radio->setAttribute('checked', '');
                    if ($option['disabled']) $radio->setAttribute('disabled', '');
                    $li->appendChild($radio);

                    $rlabel = $this->doc->createElement('label');
                    $rlabel->setAttribute('for', $radioId);
                    $rlabel->textContent = $option['name'];
                    $li->appendChild($rlabel);

                    $group->appendChild($li);
                }

                $data->appendChild($group);
            }
        } else if ($ty === 'country') {
            // TODO: this one
        } else if ($ty === 'date') {
            $input = $this->doc->createElement('input');
            $input->setAttribute('id', $inputId);
            $input->setAttribute('name', $name);
            $input->setAttribute('type', 'date');
            if ($item['min'] !== null) $input->setAttribute('min', $item['min']);
            if ($item['max'] !== null) $input->setAttribute('max', $item['max']);
            if ($value !== null) $input->setAttribute('value', $value);
            // TODO: CH autofill
            $data->appendChild($input);
        } else if ($ty === 'time') {
            $input = $this->doc->createElement('input');
            $input->setAttribute('id', $inputId);
            $input->setAttribute('name', $name);
            $input->setAttribute('type', 'time');
            if ($item['min'] !== null) $input->setAttribute('min', $item['min']);
            if ($item['max'] !== null) $input->setAttribute('max', $item['max']);
            if ($value !== null) $input->setAttribute('value', $value);
            $data->appendChild($input);
        } else if ($ty === 'datetime') {
            $input = $this->doc->createElement('input');
            $input->setAttribute('id', $inputId);
            $input->setAttribute('name', $name);
            $input->setAttribute('type', 'datetime-local');
            $tz = 'UTC';
            if ($item['tz']) $tz = $item['tz'];
            try {
                $tz = new \DateTimeZone($tz);
            } catch (\Exception $e) {
                $tz = new \DateTimeZone('UTC');
            }

            if ($item['min'] !== null) {
                try {
                    $epoch = $item['min'];
                    $dateTime = new \DateTime("@$epoch");
                    $dateTime->setTimezone($tz);
                    $formatted = $dateTime->format('Y-m-d') . 'T' . $dateTime->format('H:i:s');

                    $input->setAttribute('min', $formatted);
                } catch (\Exception $e) {}
            }
            if ($item['max'] !== null) {
                try {
                    $epoch = $item['max'];
                    $dateTime = new \DateTime("@$epoch");
                    $dateTime->setTimezone($tz);
                    $formatted = $dateTime->format('Y-m-d') . 'T' . $dateTime->format('H:i:s');

                    $input->setAttribute('max', $item['max']);
                } catch (\Exception $e) {}
            }
            if ($value !== null) {
                $dateTime = new \DateTime("@$value");
                $dateTime->setTimezone($tz);
                $formatted = $dateTime->format('Y-m-d') . 'T' . $dateTime->format('H:i:s');
                $input->setAttribute('value', $formatted);
            }
            $data->appendChild($input);
        } else if ($ty === 'boolean_table') {
            $table = $this->doc->createElement('table');
            $table->setAttribute('id', $inputId);

            if ($item['minSelect']) {
                $table->setAttribute('data-min-select', $item['minSelect']);
            }
            if ($item['maxSelect']) {
                $table->setAttribute('data-max-select', $item['maxSelect']);
            }

            if ($item['headerTop'] !== null) {
                $head = $this->doc->createElement('thead');
                $tr = $this->doc->createElement('tr');
                if ($item['headerLeft'] !== null) {
                    $space = $this->doc->createElement('th');
                    $tr->appendChild($space);
                }
                for ($i = 0; $i < $item['cols']; $i++) {
                    $th = $this->doc->createElement('th');
                    $th->textContent = $item['headerTop'][$i];
                    $tr->appendChild($th);
                }
                $head->appendChild($tr);
                $table->appendChild($head);
            }
            $excludedCells = [];
            if ($item['excludeCells'] !== null) {
                foreach ($item['excludeCells'] as $xy) {
                    $excludedCells []= $xy[0] . '-' . $xy[1];
                }
            }

            $tbody = $this->doc->createElement('tbody');
            for ($i = 0; $i < $item['rows']; $i++) {
                $tr = $this->doc->createElement('tr');

                if ($item['headerLeft'] !== null) {
                    $th = $this->doc->createElement('th');
                    $th->textContent = $item['headerLeft'][$i];
                    $tr->appendChild($th);
                }

                for ($j = 0; $j < $item['cols']; $j++) {
                    $td = $this->doc->createElement('td');

                    $isExcluded = in_array($j . '-' . $i, $excludedCells);
                    if (!$isExcluded) {
                        $box = $this->doc->createElement('input');
                        $box->setAttribute('type', 'checkbox');
                        $box->setAttribute('name', $name . '[' . $j . '][' . $i . ']');
                        if ($value !== null && $value[$i][$j]) $box->setAttribute('checked', '');

                        $td->appendChild($box);
                    }

                    $tr->appendChild($td);
                }
                $tbody->appendChild($tr);
            }
            $table->appendChild($tbody);
            $data->appendChild($table);
        }

        return $root;
    }

    function setInnerHTML($node, $html) {
        $fragment = $node->ownerDocument->createDocumentFragment();
        $fragment->appendXML($html);
        $node->appendChild($fragment);
    }

    function renderTextItem($item) {
        $root = $this->doc->createElement('div');
        $root->setAttribute('class', 'form-item form-text-item');
        if (gettype($item['text']) === 'string') {
            // plain text
            $this->setInnerHTML($root, $this->parsedown->text($item['text']));
        } else {
            $root->setAttribute('data-script', base64_encode(json_encode($item['text'])));
        }
        return $root;
    }

    function renderScriptItem($item) {
        $root = $this->doc->createElement('div');
        $root->setAttribute('class', 'form-item form-script-item');
        $root->setAttribute('data-script', base64_encode(json_encode($item['script'])));
        return $root;
    }

    function renderItem($item) {
        if ($item['el'] === 'input') return $this->renderInputItem($item);
        if ($item['el'] === 'text') return $this->renderTextItem($item);
        if ($item['el'] === 'script') return $this->renderScriptItem($item);
    }

    public function render() {
        $root = $this->doc->createElement('div');
        $root->setAttribute('class', 'congress-registration-form-contents');

        foreach ($this->form as $item) {
            $root->appendChild($this->renderItem($item));
        }

        return $this->doc->saveHtml($root);
    }
}

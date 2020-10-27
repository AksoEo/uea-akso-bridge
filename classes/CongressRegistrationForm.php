<?php
namespace Grav\Plugin\AksoBridge;

class CongressRegistrationForm {
    const DATA_VAR_NAME = 'form_data';

    private $app;
    private $plugin;
    private $form;
    private $currency;
    private $doc;
    private $parsedown;
    private $locale;
    private $congressId;
    private $instanceId;
    public function __construct($plugin, $app, $form, $congressId, $instanceId, $currency) {
        $this->app = $app;
        $this->plugin = $plugin;
        $this->form = $form;
        $this->congressId = $congressId;
        $this->instanceId = $instanceId;
        $this->currency = $currency;
        $this->doc = new \DOMDocument();
        $this->parsedown = new \Parsedown();
        $this->locale = $plugin->locale['registration_form'];
        // $this->parsedown->setSafeMode(true); // this does not work
    }

    public $confirmDataId = null;

    // If this is set, then we're editing a registration instead of creating one
    private $dataId = null;
    // User data in API format
    private $data = null;

    // List of errors. Map<field name (string), string>
    private $errors = [];
    // Top-level error
    private $error = null;
    // Top-level message
    private $message = null;

    // Sets user data from API data.
    public function setUserData($dataId, $apiData) {
        $this->dataId = $dataId;
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
                } else {
                    $this->errors[$item['name']] = $this->localize('err_datetime_fmt');
                }
            }
        } else if ($ty === 'boolean_table') {
            $excludedCells = [];
            if ($item['excludeCells'] !== null) {
                foreach ($item['excludeCells'] as $xy) {
                    $excludedCells []= $xy[0] . '-' . $xy[1];
                }
            }

            $out = [];
            for ($i = 0; $i < $item['rows']; $i++) {
                $row = [];
                for ($j = 0; $j < $item['cols']; $j++) {
                    $isExcluded = in_array($j . '-' . $i, $excludedCells);
                    $cellValue = $isExcluded ? null : false;
                    if (!$isExcluded) {
                        if (isset($data[$j]) && isset($data[$j][$i])) {
                            $cellValue = (bool) $data[$j][$i];
                        }
                    }
                    $row[] = $cellValue;
                }
                $out[] = $row;
            }
        }

        return $out;
    }

    function loadPostData($data) {
        $existingData = false;
        if (!$this->data) $this->data = [];
        else $existingData = true;

        foreach ($this->form as $item) {
            if ($item['el'] === 'input') {
                $name = $item['name'];
                $fieldData = null;
                if (isset($data[$name])) {
                    $fieldData = $data[$name];
                }

                $res = $this->readInputFieldFromPost($item, $fieldData);
                $this->data[$name] = $res;
            }
        }
    }

    function localize($key, ...$params) {
        if (count($params)) {
            $out = '';
            $i = 0;
            foreach ($params as $p) {
                $out .= $this->locale[$key . '_' . $i];
                $out .= $p;
                $i++;
            }
            $out .= $this->locale[$key . '_' . $i];
            return $out;
        }
        return $this->locale[$key];
    }

    function getFieldError($scriptCtx, $item, $value) {
        if (isset($this->errors[$item['name']])) {
            // error already exists (possibly from loadPostData)
            return $this->errors[$item['name']];
        }

        $ty = $item['type'];
        $req = $item['required'];

        if (gettype($req) !== 'boolean') {
            // AKSO script
            // TODO: evaluate scripts
            $req = "actual value goes here";
        }

        if ($req && $value === null) {
            // field is required!
            return $this->localize('err_field_is_required');
        }

        if ($value !== null) {
            if ($ty === 'boolean') {
                if ($req && !$value) {
                    // booleans are special: required means they must be true
                    return $this->localize('err_field_is_required');
                }
            } else if ($ty === 'number') {
                if ($item['step'] !== null) {
                    if ($value % $item['step'] !== 0) {
                        return $this->localize('err_number_step', $item['step']);
                    }
                }

                $fulfillsMin = true;
                $fulfillsMax = true;
                if ($item['min'] !== null) {
                    $fulfillsMin = $value >= $item['min'];
                }
                if ($item['max'] !== null) {
                    $fulfillsMax = $value <= $item['max'];
                }

                if ($item['min'] !== null && $item['max'] !== null) {
                    if (!$fulfillsMin || !$fulfillsMax) {
                        return $this->localize('err_number_range', $item['min'], $item['max']);
                    }
                } else if (!$fulfillsMin) {
                    return $this->localize('err_number_min', $item['min']);
                } else if (!$fulfillsMax) {
                    return $this->localize('err_number_max', $item['max']);
                }
            } else if ($ty === 'text') {
                if ($item['pattern'] !== null) {
                    // FIXME: can't match the pattern in PHP because it will break
                    // if (preg_match($item['pattern'], $value) === 0) {
                    // did not match
                    // return $item['patternError'] ? $item['patternError'] : $this->localize('err_text_pattern_generic');
                    // }
                }

                // Javascript uses UTF16
                $fulfillsMin = $item['minLength'] !== null ? mb_strlen($value, 'UTF-16') >= $item['minLength'] : true;
                $fulfillsMax = $item['maxLength'] !== null ? mb_strlen($value, 'UTF-16') >= $item['maxLength'] : true;

                if ($item['minLength'] !== null && $item['maxLength'] !== null) {
                    if (!$fulfillsMin || !$fulfillsMax) {
                        return $this->localize('err_text_len_range', $item['min'], $item['max']);
                    }
                } else if (!$fulfillsMin) {
                    return $this->localize('err_text_len_min', $item['min']);
                } else if (!$fulfillsMax) {
                    return $this->localize('err_text_len_max', $item['max']);
                }
            } else if ($ty === 'money') {
                if ($item['step'] !== null) {
                    if ($value % $item['step'] !== 0) {
                        return $this->localize('err_money_step', $item['step']);
                    }
                }

                $min = $item['min'] === null ? 0 : $item['min'];

                $fulfillsMin = $value >= $min;
                $fulfillsMax = ($item['max'] !== null) ? ($value <= $item['max']) : true;

                if ($item['max'] !== null && (!$fulfillsMin || !$fulfillsMax)) {
                    return $this->localize('err_money_range', $min, $item['max']);
                } else if (!$fulfillsMin) {
                    return $this->localize('err_money_min', $min);
                }
            } else if ($ty === 'enum') {
                $found = false;
                foreach ($item['options'] as $option) {
                    if ($option['value'] === $value) {
                        $found = true;
                        break;
                    }
                }

                if (!$found) return $this->localize('err_enum_not_in_set');
            } else if ($ty === 'country') {
                // TODO: validate value in options
            } else if ($ty === 'date') {
                $dateTime = \DateTime::createFromFormat('Y-m-d', $value);
                if ($dateTime === false) return $this->localize('err_date_fmt');
                // TODO: validate date range
            } else if ($ty === 'time') {
                $dateTime = \DateTime::createFromFormat('H:i', $value);
                if ($dateTime === false) return $this->localize('err_time_fmt');
                // TODO: validate time range
            } else if ($ty === 'datetime') {
                $dateTime = \DateTime::createFromFormat('Y-m-d\TH:i:s', $value);
                if ($dateTime === false) return $this->localize('err_datetime_fmt');
                // TODO: validate datetime range
            } else if ($ty === 'boolean_table') {
                $selected = 0;
                for ($i = 0; $i < $item['rows']; $i++) {
                    for ($j = 0; $j < $item['cols']; $j++) {
                        if ($value[$i][$j]) $selected++;
                    }
                }

                $fulfillsMin = $item['minSelect'] !== null ? $selected >= $item['minSelect'] : true;
                $fulfillsMax = $item['maxSelect'] !== null ? $selected <= $item['maxSelect'] : true;

                if ($item['minSelect'] !== null && $item['maxSelect'] !== null) {
                    if (!$fulfillsMin || !$fulfillsMax) {
                        return $this->localize('err_bool_table_select_range', $item['minSelect'], $item['maxSelect']);
                    }
                } else if (!$fulfillsMin) {
                    return $this->localize('err_bool_table_select_min', $item['minSelect']);
                } else if (!$fulfillsMax) {
                    return $this->localize('err_bool_table_select_max', $item['maxSelect']);
                }
            }
        }

        return null; // everything ok
    }

    // Validates form data.
    // Assumes every field exists in $this->data.
    function validateData() {
        if ($this->data === null) return;
        $ok = true;
        $scriptCtx = [];

        foreach ($this->form as $item) {
            if ($item['el'] === 'input') {
                $value = $this->data[$item['name']];
                $fieldError = $this->getFieldError($scriptCtx, $item, $value);
                if ($fieldError) $ok = false;
                $this->errors[$item['name']] = $fieldError;

                $scriptCtx []= array(
                    'type' => 'input',
                    'value' => $value,
                );
            } else if ($item['el'] === 'script') {
                $scriptCtx []= array(
                    'type' => 'script',
                    'defs' => $item['script'],
                );
            }
        }

        return $ok;
    }

    private $didSubmit = false;
    private $submitResult = null;

    function submit() {
        $args = array('data' => $this->data);
        $this->didSubmit = true;

        if ($this->dataId) {
            // PATCH
            $res = $this->app->bridge->patch('/congresses/' . $this->congressId . '/instances/' . $this->instanceId . '/participants/' . $this->dataId, $args, [], []);
            if ($res['k']) {
                $this->message = $this->localize('msg_patch_success');
            } else if ($res['sc'] === 400) {
                $this->error = $this->localize('err_submit_invalid');
            } else {
                $this->error = $this->localize('err_submit_generic');
            }
        } else {
            // new registration
            $res = $this->app->bridge->post('/congresses/' . $this->congressId . '/instances/' . $this->instanceId . '/participants', $args, [], []);
            if ($res['k']) {
                $this->confirmDataId = $res['h']['x-identifier'];
            } else if ($res['sc'] === 400) {
                $this->error = $this->localize('err_submit_invalid');
            } else if ($res['sc'] === 409) {
                $this->error = $this->localize('err_submit_already_registered');
            } else {
                $this->error = $this->localize('err_submit_generic');
            }
        }
    }

    public function validate($post) {
        if (isset($post[self::DATA_VAR_NAME])) {
            $this->loadPostData($post[self::DATA_VAR_NAME]);
            $isOk = $this->validateData();
            if (!$isOk) {
                $this->error = $this->localize('err_submit_invalid');
            }
            return $isOk;
        } else {
            // no data, pretend nothing was sent (do nothing)
            return false;
        }
    }

    // Attempts to submit the form with the given POST data.
    public function trySubmit($post) {
        if ($this->validate($post)) {
            $this->submit();
        }
    }

    function renderTop() {
        $err = $this->doc->createElement('div');
        $err->setAttribute('class', 'registration-error');

        if ($this->error) {
            $err->textContent = $this->error;
            return $err;
        }

        $msg = $this->doc->createElement('div');
        $msg->setAttribute('class', 'registration-message');

        if ($this->message) {
            $msg->textContent = $this->message;
            return $msg;
        }

        return null;
    }

    function renderInputItem($item) {
        $root = $this->doc->createElement('div');
        $root->setAttribute('class', 'form-field form-item form-input-item');
        $root->setAttribute('data-name', $item['name']);
        $root->setAttribute('data-el', 'input');
        $root->setAttribute('data-type', $item['type']);

        $data = $this->doc->createElement('div');
        $data->setAttribute('class', 'form-data');

        $ty = $item['type'];
        $name = self::DATA_VAR_NAME . '[' . $item['name'] . ']';
        $inputId = 'form-' . $item['name'];

        $value = null;
        if ($this->data && isset($this->data[$item['name']])) $value = $this->data[$item['name']];
        else if ($item['default'] !== null) {
            if (gettype($item['default']) === 'array') {
                $root->setAttribute('data-script-default', base64_encode(json_encode($item['default'])));
                // TODO: eval & set
            } else {
                $value = $item['default'];
            }
        }

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
            $root->setAttribute('data-required', 'true');
            $req = $this->doc->createElement('span');
            $req->setAttribute('class', 'label-required');
            $req->textContent = ' *';
            $label->appendChild($req);
        }
        if (gettype($item['required']) === 'array') {
            $root->setAttribute('data-script-required', base64_encode(json_encode($item['required'])));
        }

        $disabled = $item['disabled'] === true;
        if (gettype($item['disabled']) === 'array') {
            $root->setAttribute('data-script-disabled', base64_encode(json_encode($item['disabled'])));
        }

        if ($this->dataId && !$item['editable']) {
            // we're editing a registration, but this field can't be edited
            $disabled = true;
        }

        // TODO: run eval with default/current form var values to get all defaults etc

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

        if (isset($this->errors[$item['name']])) {
            $fieldError = $this->errors[$item['name']];
            $err = $this->doc->createElement('div');
            $err->setAttribute('class', 'field-error');
            $err->textContent = $fieldError;
            $root->appendChild($err);
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
            if ($disabled) $input->setAttribute('disabled', '');
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
            if ($disabled) $input->setAttribute('disabled', '');
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
            if ($disabled) $input->setAttribute('disabled', '');
            if ($value !== null) $input->setAttribute('value', $value);
            $data->appendChild($input);
        } else if ($ty === 'enum') {
            $root->setAttribute('data-variant', $item['variant']);
            if ($item['variant'] === 'select') {
                $input = $this->doc->createElement('select');
                $input->setAttribute('id', $inputId);
                $input->setAttribute('name', $name);
                if ($disabled) $input->setAttribute('disabled', '');

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
            } else if ($item['variant'] === 'radio') {
                $root->setAttribute('data-radio-name', $name);
                $group = $this->doc->createElement('ul');
                $group->setAttribute('class', 'radio-group');
                $group->setAttribute('id', $inputId);

                foreach ($item['options'] as $option) {
                    $li = $this->doc->createElement('li');
                    // TODO: handle onlyExisting
                    if ($disabled || $option['disabled']) $li->setAttribute('class', 'is-disabled');

                    $radioId = $inputId . '--' . $option['value'];

                    $radio = $this->doc->createElement('input');
                    $radio->setAttribute('type', 'radio');
                    $radio->setAttribute('name', $name);
                    $radio->setAttribute('id', $radioId);
                    $radio->setAttribute('value', $option['value']);
                    if ($value === $option['value']) $radio->setAttribute('checked', '');
                    if ($option['disabled']) {
                        $radio->setAttribute('disabled', '');
                        $radio->setAttribute('data-disabled', 'true');
                    }
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
            if ($disabled) $input->setAttribute('disabled', '');
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
            if ($disabled) $input->setAttribute('disabled', '');
            if ($item['min'] !== null) $input->setAttribute('min', $item['min']);
            if ($item['max'] !== null) $input->setAttribute('max', $item['max']);
            if ($value !== null) $input->setAttribute('value', $value);
            $data->appendChild($input);
        } else if ($ty === 'datetime') {
            $input = $this->doc->createElement('input');
            $input->setAttribute('id', $inputId);
            $input->setAttribute('name', $name);
            $input->setAttribute('type', 'datetime-local');
            if ($disabled) $input->setAttribute('disabled', '');
            $tz = 'UTC';
            if ($item['tz']) $tz = $item['tz'];
            try {
                $tz = new \DateTimeZone($tz);
                $root->setAttribute('data-tz', $tz->getOffset());
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

            $root->setAttribute('data-rows', $item['rows']);
            $root->setAttribute('data-cols', $item['cols']);

            if ($item['minSelect']) {
                $root->setAttribute('data-min-select', $item['minSelect']);
            }
            if ($item['maxSelect']) {
                $root->setAttribute('data-max-select', $item['maxSelect']);
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
                        $box->setAttribute('data-index', $j . '-' . $i);
                        $box->setAttribute('type', 'checkbox');
                        if ($disabled) $box->setAttribute('disabled', '');
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
        $root->setAttribute('data-el', 'text');
        if (gettype($item['text']) === 'string') {
            // plain text
            $this->setInnerHTML($root, $this->parsedown->text($item['text']));
        } else {
            $root->setAttribute('data-script', base64_encode(json_encode($item['text'])));
            // TODO: render
        }
        return $root;
    }

    function renderScriptItem($item) {
        $root = $this->doc->createElement('div');
        $root->setAttribute('class', 'form-item form-script-item');
        $root->setAttribute('data-el', 'script');
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

        $top = $this->renderTop();
        if ($top) $root->appendChild($top);

        foreach ($this->form as $item) {
            $root->appendChild($this->renderItem($item));
        }

        return $this->doc->saveHtml($root);
    }
}

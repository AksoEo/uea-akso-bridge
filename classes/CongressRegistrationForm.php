<?php
namespace Grav\Plugin\AksoBridge;

class CongressRegistrationForm {
    private $form;
    private $currency;
    private $doc;
    public function __construct($form, $currency) {
        $this->form = $form;
        $this->currency = $currency;
        $this->doc = new \DOMDocument();
    }

    function renderInputItem($item) {
        $root = $this->doc->createElement('div');
        $root->setAttribute('class', 'form-item form-input-item');
        $root->setAttribute('data-name', $item['name']);
        $root->setAttribute('data-type', $item['type']);

        $ty = $item['type'];
        $name = $item['name'];
        $inputId = 'form-' . $item['name'];

        $label = $this->doc->createElement('label');
        $label->textContent = $item['label'];
        $label->setAttribute('for', $inputId);

        // TODO: render markdown
        $description = null;
        if ($item['description']) {
            $description = $this->doc->createElement('p');
            $description->textContent = $item['description'];
        }

        // only add 'required' server-side if it's guaranteed to be true
        $required = $item['required'] === true;
        if ($required) {
            $req = $this->doc->createElement('span');
            $req->setAttribute('class', 'label-required');
            $req->textContent = '*';
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
            if ($disabled) $input->setAttribute('disabled', '');

            $root->appendChild($input);
            $root->appendChild($label);
            if ($description) $root->appendChild($description);
        } else {
            $root->appendChild($label);
            if ($description) $root->appendChild($description);
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
            $root->appendChild($input);
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
            // TODO: CH Autofill
            $root->appendChild($input);
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
            $root->appendChild($input);
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
                    $input->appendChild($node);
                }

                $root->appendChild($input);
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
                    if ($option['disabled']) $radio->setAttribute('disabled', '');
                    $li->appendChild($radio);

                    $rlabel = $this->doc->createElement('label');
                    $rlabel->setAttribute('for', $radioId);
                    $rlabel->textContent = $option['name'];
                    $li->appendChild($rlabel);

                    $group->appendChild($li);
                }

                $root->appendChild($group);
            }
        }

        return $root;
    }

    function renderTextItem($item) {
        $root = $this->doc->createElement('div');
        $root->setAttribute('class', 'form-item form-text-item');
        if (gettype($item['text']) === 'string') {
            // plain text
            // TODO: render markdown
            $root->textContent = $item['text'];
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

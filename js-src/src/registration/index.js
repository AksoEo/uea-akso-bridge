import './index.less';
import '../form';
import countryCurrencies from '../../../country_currencies.ini';
import countryFields from './countries.eval.js';

window.addEventListener('DOMContentLoaded', init);

function init() {
    const selectionBoxes = document.querySelectorAll('.selection-box');
    for (let i = 0; i < selectionBoxes.length; i++) {
        const box = selectionBoxes[i];
        const input = document.getElementById(box.getAttribute('for'));
        if (input.type === 'radio') {
            // add ability to un-check a radio button
            box.addEventListener('click', (e) => {
                if (input.checked) {
                    e.preventDefault();
                    input.checked = false;
                }
            });
        }
    }

    initAutoCurrency();
    initAddressFields();
}

function initAutoCurrency() {
    const feeCountrySelector = document.querySelector('#registration-field-fee-country');
    const currencySelector = document.querySelector('#registration-settings-currency');
    if (feeCountrySelector && currencySelector) {
        const availableCurrencies = [];
        const options = currencySelector.querySelectorAll('option');
        for (let i = 0; i < options.length; i++) {
            availableCurrencies.push(options[i].value);
        }

        const updateCurrency = () => {
            const currency = countryCurrencies[feeCountrySelector.value];
            if (currency && availableCurrencies.includes(currency)) {
                currencySelector.value = currency;
            }
        };
        updateCurrency();
        feeCountrySelector.addEventListener('change', updateCurrency);
    }
}

function initAddressFields() {
    const feeCountrySelector = document.querySelector('#registration-field-fee-country');
    if (!feeCountrySelector) return;
    const countrySelector = document.querySelector('#codeholder-address-country');
    const splitCountry = document.querySelector('#registration-split-country');
    const fieldSel = document.querySelectorAll('.settings-field.is-address-field');
    const addressFields = [];
    for (let i = 0; i < fieldSel.length; i++) addressFields.push(fieldSel[i]);

    const update = () => {
        let country;
        if (splitCountry.checked) country = countrySelector.value;
        else country = feeCountrySelector.value;
        console.log(splitCountry.checked, country);
        const requiredFields = countryFields[country.toLowerCase()];
        for (const node of addressFields) {
            const field = node.dataset.addressField;
            const input = node.querySelector('input');

            if (requiredFields && requiredFields.includes(field)) {
                node.classList.remove('is-hidden-address-field');
                input.disabled = false;
                input.required = true;
            } else if (requiredFields) {
                node.classList.add('is-hidden-address-field');
                input.disabled = true;
                input.required = false;
                input.value = '';
            } else {
                // no country selected
                node.classList.remove('is-hidden-address-field');
                input.disabled = true;
                input.required = false;
            }
        }
    };

    splitCountry.addEventListener('change', update);
    feeCountrySelector.addEventListener('change', update);
    countrySelector.addEventListener('change', update);
    update();
}

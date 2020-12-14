import locale from '../../../locale.ini';

const months = ['januaro', 'februaro', 'marto', 'aprilo', 'majo', 'junio', 'julio', 'aŭgusto', 'septembro', 'oktobro', 'novembro', 'decembro'];

function daysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

function createDateInput(value, onUpdate, opts = {}) {
    const editor = document.createElement('div');
    editor.className = 'js-date-editor';

    const year = document.createElement('input');
    year.placeholder = locale.date_picker.year;
    year.type = 'number';
    year.min = 1;
    year.max = 3000;
    editor.appendChild(year);

    const month = document.createElement('select');
    {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = '—';
        month.appendChild(opt);
    }
    for (let i = 0; i < 12; i++) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = months[i];
        month.appendChild(opt);
    }
    editor.appendChild(month);

    const day = document.createElement('select');

    function renderDay(year, month) {
        day.innerHTML = '';
        if (!Number.isFinite(year)) {
            const opt = document.createElement('option');
            opt.value = '';
            opt.textContent = '—';
            day.appendChild(opt);
        } else {
            const days = daysInMonth(year, month);
            for (let i = 1; i < days; i++) {
                const opt = document.createElement('option');
                opt.value = i;
                opt.textContent = i;
                day.appendChild(opt);
            }
        }
    }
    editor.appendChild(day);
    renderDay(null, null);

    function update() {
        const y = +year.value;
        const m = +month.value;
        const d = +day.value;
        if (year.value && Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)) {
            const date = new Date();
            date.setUTCFullYear(y);
            date.setUTCMonth(m);
            date.setUTCDate(d);
            onUpdate(date.toISOString().split('T')[0]);
        } else {
            onUpdate('');
        }
    }

    function setNull() {
        year.value = '';
        month.value = '';
        renderDay(null, null);
        update();
    }
    function setNonNull() {
        if (!year.value) year.value = new Date().getFullYear();
        if (!month.value) month.value = 0;
        renderDay(+year.value, +month.value);
        update();
    }

    opts.setNull = setNull;
    opts.setNonNull = setNonNull;

    year.addEventListener('change', () => {
        if (!year.value) setNull();
        else setNonNull();
    });
    year.addEventListener('focus', () => {
        if (!year.value) {
            year.value = new Date().getFullYear();
            setNonNull();
        }
    });
    year.addEventListener('blur', () => {
        if (!year.value || !Number.isFinite(+year.value)) {
            setNull();
        }
    });
    month.addEventListener('change', () => {
        if (!month.value) setNull();
        else setNonNull();
    });
    day.addEventListener('change', () => {
        update();
    });

    function loadValue(value) {
        if (value) {
            const m = value.match(/(\d{4})-(\d{2})-(\d{2})/);
            if (m) {
                year.value = +m[1];
                month.value = +m[2] - 1;
                renderDay(+year.value, +month.value);
                day.value = +m[3];
                return;
            }
        }
        renderDay(null, null);
        year.value = '';
        month.value = '';
        day.value = '';
    }
    loadValue(value);
    opts.loadValue = loadValue;

    return editor;
}

function createTimeInput(value, onUpdate, opts = {}) {
    const editor = document.createElement('div');
    editor.className = 'js-time-editor';

    const hour = document.createElement('select');

    {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = '—';
        hour.appendChild(opt);
    }

    for (let i = 0; i < 24; i++) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = ('00' + i).substr(-2);
        hour.appendChild(opt);
    }

    const minute = document.createElement('select');

    {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = '—';
        minute.appendChild(opt);
    }

    for (let i = 0; i < 60; i++) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = ('00' + i).substr(-2);
        minute.appendChild(opt);
    }

    editor.appendChild(hour);
    editor.appendChild(document.createTextNode(':'));
    editor.appendChild(minute);

    function setNull() {
        hour.value = minute.value = '';
        onUpdate('');
    }

    function setNonNull() {
        if (!hour.value) hour.value = new Date().getHours();
        if (!minute.value) minute.value = '0';
        const h = ('00' + +hour.value).substr(-2);
        const m = ('00' + +minute.value).substr(-2);
        onUpdate(h + ':' + m);
    }

    opts.setNull = setNull;
    opts.setNonNull = setNonNull;

    hour.addEventListener('change', () => {
        if (hour.value) setNonNull();
        else setNull();
    });
    minute.addEventListener('change', () => {
        if (minute.value) setNonNull();
        else setNull();
    });

    function loadValue(value) {
        if (value) {
            const m = value.match(/(\d{1,2}):(\d{2})/);
            if (m) {
                hour.value = +m[1];
                minute.value = +m[2];
                return;
            }
        }
        hour.value = '';
        minute.value = '';
    }
    loadValue(value);
    opts.loadValue = loadValue;

    return editor;
}

export function initDatePolyfill(input, onUpdate) {
    const editor = createDateInput(input.value, value => {
        input.value = value;
        onUpdate();
    });

    // replace node with editor in the tree
    input.parentNode.insertBefore(editor, input);
    input.parentNode.removeChild(input);
    // PREpend node in the editor so when using querySelector('input') this is the one being
    // returned
    editor.insertBefore(input, editor.firstChild);
    input.className += ' inner-input';
}

export function initTimePolyfill(input, onUpdate) {
    const editor = createTimeInput(input.value, value => {
        input.value = value;
        onUpdate();
    });

    input.parentNode.insertBefore(editor, input);
    input.parentNode.removeChild(input);
    editor.insertBefore(input, editor.firstChild);
    input.className += ' inner-input';
}

export function initDateTimePolyfill(input, onUpdate) {
    let currentDate = '';
    let currentTime = '';

    if (input.value) {
        currentDate = input.value.split('T')[0];
        currentTime = input.value.split('T')[1].substr(0, 5);
    }

    const dateOpts = {};
    const timeOpts = {};
    const date = createDateInput(currentDate, value => {
        input.value = value + 'T' + currentTime;
        if (value) {
            if (!currentTime) {
                currentTime = ('00' + (new Date().getHours())).substr(-2)
                    + ':' + ('00' + (new Date().getMinutes())).substr(-2);
                timeOpts.loadValue(currentTime);
            }
            input.value = value + 'T' + currentTime;
            currentDate = value;
        } else {
            input.value = '';
            currentDate = currentTime = '';
            dateOpts.loadValue('');
            timeOpts.loadValue('');
        }

        onUpdate();
    }, dateOpts);
    const time = createTimeInput(currentTime, value => {
        if (value) {
            if (!currentDate) {
                currentDate = new Date().toISOString().split('T')[0];
                dateOpts.loadValue(currentDate);
            }
            input.value = currentDate + 'T' + value;
            currentTime = value;
        } else {
            input.value = '';
            currentDate = currentTime = '';
            dateOpts.loadValue('');
            timeOpts.loadValue('');
        }

        onUpdate();
    }, timeOpts);

    const editor = document.createElement('div');
    editor.className = 'js-date-time-editor';
    editor.appendChild(date);
    editor.appendChild(time);

    input.parentNode.insertBefore(editor, input);
    input.parentNode.removeChild(input);
    editor.insertBefore(input, editor.firstChild);
    input.className += ' inner-input';
}

let congressInstanceIdPicker;

$(document).ready(() => {
    if (!window.fetch) return; // we use fetch
    for (const node of document.querySelectorAll('.akso-field-congress-instance-id')) {
        congressInstanceIdPicker(node);
    }
});

{
    const knownCongresses = {};

    const LIMIT = 10;
    const fetch2Json = res => res.json();
    const fetchCongresses = (offset) => {
        return fetch(`/admin/akso_bridge?task=list_congresses&offset=${offset}&limit=${LIMIT}`);
    };
    const fetchInstances = (congress, offset) => {
        return fetch(`/admin/akso_bridge?task=list_congress_instances&congress=${congress}&offset=${offset}&limit=${LIMIT}`);
    };
    const fetchCongressInstance = (congress, instance) => {
        return fetch(`/admin/akso_bridge?task=name_congress_instance&congress=${congress}&instance=${instance}`);
    };

    const loadCongresses = (offset) => fetchCongresses(offset).then(fetch2Json).then(res => {
        if (res.error) throw res.error;
        const ids = [];
        for (const item of res.result) {
            ids.push(item.id);
            if (!knownCongresses[item.id]) knownCongresses[item.id] = {};
            Object.assign(knownCongresses[item.id], item);
            if (!knownCongresses[item.id].instances) knownCongresses[item.id].instances = {};
        }
        return ids;
    });

    const loadInstances = (congress, offset) => fetchInstances(congress, offset).then(fetch2Json).then(res => {
        if (res.error) throw res.error;
        if (!knownCongresses[congress]) knownCongresses[congress] = { instances: {} };
        const knownInstances = knownCongresses[congress].instances;
        const ids = [];
        for (const item of res.result) {
            ids.push(item.id);
            if (!knownInstances[item.id]) knownInstances[item.id] = {};
            Object.assign(knownInstances[item.id], item);
        }
        return ids;
    });

    const loadCongressInstance = (congress, instance) => fetchCongressInstance(congress, instance).then(fetch2Json).then(res => {
        if (res.error) throw res.error;
        if (!knownCongresses[congress]) knownCongresses[congress] = { instances: {} };
        const knownInstances = knownCongresses[congress].instances;
        if (!knownInstances[instance]) knownInstances[instance] = {};
        knownCongresses[congress].name = res.result.congress;
        knownInstances[instance].name = res.result.instance;
    });

    const LOADING = 'Ŝarĝas…';
    const PICK_ONE = 'Elekti kongreson';
    const LOAD_MORE = 'Montri pliajn';

    const getCongress = congress => knownCongresses[congress] || null;
    const getInstance = (congress, instance) => {
        if (knownCongresses[congress]) return knownCongresses[congress].instances[instance] || null;
        else return null;
    };

    congressInstanceIdPicker = (node) => {
        const fieldInput = node.querySelector('.akso-field-input');
        fieldInput.style.display = 'none';
        for (const n of node.querySelectorAll('.akso-field-noscript')) n.parentNode.removeChild(n);

        const previewButton = document.createElement('button');
        previewButton.classList.add('button');
        previewButton.textContent = LOADING;
        node.appendChild(previewButton);

        const picker = document.createElement('div');
        picker.className = 'akso-picker-list hidden';
        node.appendChild(picker);

        const pickerHeader = document.createElement('div');
        pickerHeader.className = 'akso-picker-header';
        pickerHeader.textContent = PICK_ONE;
        picker.appendChild(pickerHeader);
        const pickerItems = document.createElement('ul');
        pickerItems.className = 'akso-picker-list-items';
        picker.appendChild(pickerItems);
        const pickerLoadMore = document.createElement('button');
        pickerLoadMore.textContent = LOAD_MORE;
        pickerLoadMore.className = 'akso-picker-list-load-more';
        picker.appendChild(pickerLoadMore);

        let renderState;
        let open = false;
        let previewError = null;
        let loadingPreview = null;

        const loadPreview = (congress, instance) => {
            if (loadingPreview || previewError) return;
            previewError = null;
            loadingPreview = loadCongressInstance(congress, instance).catch(err => {
                previewError = err;
            }).then(() => {
                loadingPreview = null;
                renderState();
            });
        };

        let pickerCongress = null;
        let loadedItems = 0;
        let loadingItems = null;
        let pickerError = null;
        const clearPicker = () => {
            pickerLoadMore.classList.remove('hidden');
            loadedItems = 0;
            pickerItems.innerHTML = '';
        };
        const loadPickerItems = () => {
            if (loadingItems) return;
            pickerError = null;
            pickerLoadMore.textContent = LOADING;
            const hasCongress = pickerCongress !== null;

            pickerHeader.innerHTML = '';
            if (hasCongress) {
                pickerHeader.textContent = getCongress(pickerCongress).name;
            } else {
                pickerHeader.textContent = PICK_ONE;
            }

            const backButton = document.createElement('button');
            const icon = document.createElement('i');
            if (hasCongress) {
                icon.className = 'fa fa-reply';
            } else {
                icon.className = 'fa fa-close';
            }
            backButton.appendChild(icon);
            backButton.addEventListener('click', e => {
                e.preventDefault();
                e.stopPropagation();
                if (hasCongress) {
                    pickerCongress = null;
                    clearPicker();
                    loadPickerItems();
                } else {
                    open = false;
                    renderState();
                }
            });
            pickerHeader.insertBefore(backButton, pickerHeader.firstChild)

            if (hasCongress) {
                loadingItems = loadInstances(pickerCongress, loadedItems);
            } else {
                loadingItems = loadCongresses(loadedItems);
            }
            loadingItems.then(items => {
                if (!items.length) {
                    pickerLoadMore.classList.add('hidden');
                }

                loadedItems += items.length;
                if (!open) return;
                for (const id of items) {
                    const item = hasCongress ? getInstance(pickerCongress, id) : getCongress(id);
                    const itemNode = document.createElement('li');
                    itemNode.className = 'picker-list-item';

                    itemNode.textContent = item.name;
                    if (!hasCongress) {
                        // this is a congress item
                        const badge = document.createElement('span');
                        badge.className = 'akso-org-badge';
                        badge.textContent = item.org.toUpperCase();
                        itemNode.insertBefore(badge, itemNode.firstChild)
                    }

                    itemNode.addEventListener('click', e => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!hasCongress) {
                            pickerCongress = id;
                            clearPicker();
                            loadPickerItems();
                        } else {
                            open = false;
                            fieldInput.value = `${pickerCongress}/${id}`;
                            renderState();
                        }
                    });
                    pickerItems.appendChild(itemNode);
                }
            }).catch(err => {
                pickerError = err;
            }).then(() => {
                pickerLoadMore.textContent = LOAD_MORE;
                loadingItems = null;
                renderState();
            });
        };
        const openedPicker = () => {
            if (!loadedItems && !pickerError) {
                loadPickerItems();
            }
        };

        renderState = () => {
            let value = null;
            if (fieldInput.value) {
                const parts = fieldInput.value.split('/');
                value = [parseInt(parts[0], 10), parseInt(parts[1], 10)];
            }

            let res;
            if (open) {
                previewButton.classList.add('hidden');
                picker.classList.remove('hidden');
                openedPicker();
            } else {
                previewButton.classList.remove('hidden');
                picker.classList.add('hidden');
                clearPicker();
                previewButton.innerHTML = '';

                if (value) {
                    const congress = getCongress(value[0]);
                    const instance = getInstance(value[0], value[1]);

                    if (congress && instance) {
                        previewButton.textContent = `${congress.name} — ${instance.name}`;
                    } else {
                        previewButton.textContent = LOADING;
                        loadPreview(value[0], value[1]);
                    }
                    const spacer = document.createElement('span');
                    spacer.textContent = '\u00a0';
                    previewButton.insertBefore(spacer, previewButton.firstChild);
                    const icon = document.createElement('i');
                    icon.className = 'fa fa-edit';
                    previewButton.insertBefore(icon, previewButton.firstChild);
                } else {
                    previewButton.textContent = PICK_ONE;
                }
            }
        };

        renderState();

        previewButton.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            pickerCongress = null;
            open = true;
            renderState();
        });

        pickerLoadMore.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            loadPickerItems();
            renderState();
        });
    };
}

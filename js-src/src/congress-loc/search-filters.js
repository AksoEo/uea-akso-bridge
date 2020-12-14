import { stdlib } from '@tejo/akso-script';
import { congress_locations as locale } from '../../../locale.ini';
import { initDateTimePolyfill } from '../form/date-editor';

const FILTERS = {
    // openAt
    // - null
    // - 'now' => open now
    // - Date => open at date
    openAt: {
        default: () => null,
        shouldShowBlob: () => true,
        renderBlob: (updateState) => {
            const blob = document.createElement('button');
            blob.className = 'filter-blob filter-open-at';

            let lastActiveState = 'now';
            let currentState;
            blob.addEventListener('click', () => {
                if (currentState === null) {
                    updateState(lastActiveState);
                } else {
                    updateState(null);
                }
            });

            let lastActiveStateLabel = locale.f_open_at_now;

            const renderState = state => {
                currentState = state;
                if (state === null) {
                    blob.classList.remove('is-active');
                } else if (state === 'now') {
                    blob.classList.add('is-active');
                    lastActiveStateLabel = locale.f_open_at_now;
                } else {
                    // state is Date
                    blob.classList.add('is-active');
                    lastActiveStateLabel = locale.f_open_at_time + ' ' + stdlib.ts_fmt.apply(null, [state]);
                }
                if (state) lastActiveState = state;
                blob.textContent = lastActiveStateLabel;
            };

            return {
                node: blob,
                update: renderState,
            };
        },
        renderUI: (updateState) => {
            const node = document.createElement('div');
            node.className = 'filter-item';

            let currentState;

            const stateSwitch = document.createElement('div');
            stateSwitch.className = 'state-switch';
            node.appendChild(stateSwitch);

            const switchNow = document.createElement('button');
            switchNow.className = 'switch-item';
            switchNow.textContent = locale.f_open_at_now;
            stateSwitch.appendChild(switchNow);

            switchNow.addEventListener('click', () => {
                if (currentState === 'now') {
                    updateState(null);
                    return;
                }
                updateState('now');
            });

            const switchTime = document.createElement('button');
            switchNow.className = 'switch-item';
            switchTime.textContent = locale.f_open_at_time;
            stateSwitch.appendChild(switchTime);

            switchTime.addEventListener('click', () => {
                if (currentState instanceof Date) {
                    updateState(null);
                    return;
                }
                updateState(new Date());
            });

            const dateEditor = document.createElement('div');
            dateEditor.className = 'date-editor-container';
            const innerDateEditor = document.createElement('input');
            innerDateEditor.className = 'native-date-editor';
            dateEditor.appendChild(innerDateEditor);
            innerDateEditor.type = 'datetime-local';
            const onDateChange = (localDate) => {
                const lDate = new Date(innerDateEditor.value + 'Z');
                const off = new Date().getTimezoneOffset();
                const date = new Date(+lDate + off * 60000);
                if (Number.isFinite(date.getFullYear())) updateState(date);
            };
            if (innerDateEditor.type !== 'datetime-local') {
                initDateTimePolyfill(innerDateEditor, () => {
                    onDateChange(innerDateEditor.value);
                });
            } else {
                innerDateEditor.addEventListener('input', () => {
                    onDateChange(innerDateEditor.value);
                });
            }

            const update = (state) => {
                currentState = state;

                switchNow.classList.remove('is-selected');
                switchTime.classList.remove('is-selected');
                if (state === 'now') {
                    switchNow.classList.add('is-selected');
                } else if (state instanceof Date) {
                    switchTime.classList.add('is-selected');
                }

                if (state instanceof Date && !dateEditor.parentNode) {
                    node.appendChild(dateEditor);
                } else if (!(state instanceof Date) && dateEditor.parentNode) {
                    node.removeChild(dateEditor);
                }
            };

            return {
                node,
                update,
            };
        },
    },
    // rating
    // - null
    // - (number) 0..1 => “above x%”
    rating: {
        default: () => null,
        shouldShowBlob: (state) => !!state,
        renderBlob: (updateState) => {
            const blob = document.createElement('button');
            blob.className = 'filter-blob filter-rating';

            let lastActiveState = 0.5;
            let currentState;
            blob.addEventListener('click', () => {
                if (currentState === null) {
                    updateState(lastActiveState);
                } else {
                    updateState(null);
                }
            });

            const update = (state) => {
                currentState = state;
                if (state === null) {
                    blob.classList.remove('is-active');
                } else {
                    blob.classList.add('is-active');
                }
            };

            return {
                node: blob,
                update,
            };
        },
        // TODO
        renderUI: () => ({ node: document.createElement('div'), update: () => {} }),
    },
    // TODO: location tags
};

export class SearchFilters {
    constructor(state) {
        this.state = state;
        this.node = document.createElement('div');
        this.node.className = 'congress-location-filters';

        this.didMutate = () => this._didMutate();
        this.onFilter = () => {};

        this.nodes = {
            searchContainer: document.createElement('div'),
            searchInput: document.createElement('input'),
            filterBar: document.createElement('div'),
            filterBarTitle: document.createElement('label'),
            filterBarInner: document.createElement('div'),
            filterButton: document.createElement('button'),
            fullFilters: document.createElement('div'),
        };
        this.nodes.searchContainer.className = 'search-container';
        this.nodes.searchInput.className = 'search-input';
        this.nodes.filterBar.className = 'filter-bar';
        this.nodes.filterBarTitle.textContent = locale.f_title + ': ';
        this.nodes.filterBarTitle.className = 'filter-bar-title';
        this.nodes.filterBarInner.className = 'filter-bar-inner';
        this.nodes.filterButton.className = 'filter-button';
        this.nodes.fullFilters.className = 'full-filters';
        this.nodes.searchInput.placeholder = locale.search_placeholder;
        this.nodes.searchInput.type = 'text';
        this.nodes.searchInput.addEventListener('input', this.didMutate);
        this.nodes.searchContainer.appendChild(this.nodes.searchInput);
        this.node.appendChild(this.nodes.searchContainer);
        this.nodes.filterBar.appendChild(this.nodes.filterBarTitle);
        this.nodes.filterBar.appendChild(this.nodes.filterBarInner);
        this.nodes.filterBar.appendChild(this.nodes.filterButton);
        this.node.appendChild(this.nodes.filterBar);

        this.nodes.filterButton.addEventListener('click', () => {
            this.state.filtersOpen = !this.state.filtersOpen;
            this.didMutate();
        });

        this.render();
    }

    _didMutate() {
        if (this.scheduledRender) return;
        this.scheduledRender = requestAnimationFrame(() => {
            this.scheduledRender = null;
            this.render();
        });
    }

    render() {
        if (!this.state.filters) {
            this.state.filters = {};
            for (const f in FILTERS) this.state.filters[f] = FILTERS[f].default();
        }

        this.state.query = this.nodes.searchInput.value;

        if (!this._filterUI) this._filterUI = {};
        for (const f in this.state.filters) {
            if (!this._filterUI[f]) {
                const ui = {
                    blob: FILTERS[f].renderBlob(newState => {
                        this.state.filters[f] = newState;
                        this.didMutate();
                    }),
                    ui: FILTERS[f].renderUI(newState => {
                        this.state.filters[f] = newState;
                        this.didMutate();
                    }),
                };
                this._filterUI[f] = ui;

                this.nodes.fullFilters.appendChild(ui.ui.node);
            }

            const ui = this._filterUI[f];
            ui.blob.update(this.state.filters[f]);
            ui.ui.update(this.state.filters[f]);

            const showBlob = FILTERS[f].shouldShowBlob(this.state.filters[f]);
            if (showBlob && !ui.blob.node.parentNode) {
                this.nodes.filterBarInner.appendChild(ui.blob.node);
            } else if (!showBlob && ui.blob.node.parentNode) {
                this.nodes.filterBarInner.removeChild(ui.blob.node);
            }
        }

        if (this.state.filtersOpen) {
            if (!this.nodes.fullFilters.parentNode) {
                this.node.appendChild(this.nodes.fullFilters);
                this.nodes.filterBar.classList.add('full-filters-open');
                this.nodes.filterButton.classList.add('is-open');
            }
        } else {
            if (this.nodes.fullFilters.parentNode) {
                this.node.removeChild(this.nodes.fullFilters);
                this.nodes.filterBar.classList.remove('full-filters-open');
                this.nodes.filterButton.classList.remove('is-open');
            }
        }

        this.onFilter(this.state);
    }
}

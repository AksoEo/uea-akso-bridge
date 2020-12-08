import { stdlib } from '@tejo/akso-script';
import { congress_locations as locale } from '../../../locale.ini';

const FILTERS = {
    // openAt
    // - null
    // - 'now' => open now
    // - Date => open at date
    openAt: {
        default: () => null,
        showBlobByDefault: true,
        renderBlob: (updateState) => {
            const blob = document.createElement('div');
            blob.className = 'filter-blob filter-open-at';

            let currentState;
            blob.addEventListener('click', () => {
                if (currentState === null) {
                    updateState('now');
                } else {
                    updateState(null);
                }
            });

            const renderState = state => {
                currentState = state;
                if (state === null) {
                    blob.classList.remove('is-active');
                    blob.textContent = locale.f_open_at_now;
                } else if (state === 'now') {
                    blob.classList.add('is-active');
                    blob.textContent = locale.f_open_at_now;
                } else {
                    // state is Date
                    blob.textContent = locale.f_open_at_time + ' ' + stdlib.datetime_fmt.apply(null, [state]);
                }
            };

            return {
                node: blob,
                update: renderState,
            };
        },
        renderUI: () => {
            return {
                node: document.createElement('div'),
                update: state => void 0,
            };
        },
    },
    // rating
    // - null
    // - (number) 0..1 => “above x%”
    rating: {
        default: () => null,
        // TODO
        renderBlob: () => ({ node: document.createElement('div'), update: () => {} }),
        renderUI: () => ({ node: document.createElement('div'), update: () => {} }),
    },
    // TODO: tags
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
        };
        this.nodes.searchContainer.className = 'search-container';
        this.nodes.searchInput.className = 'search-input';
        this.nodes.filterBar.className = 'filter-bar';
        this.nodes.filterBarTitle.textContent = locale.f_title + ': ';
        this.nodes.filterBarTitle.className = 'filter-bar-title';
        this.nodes.filterBarInner.className = 'filter-bar-inner';
        this.nodes.filterButton.className = 'filter-button';
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
            // TODO
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

                if (FILTERS[f].showBlobByDefault) {
                    this.nodes.filterBarInner.appendChild(ui.blob.node);
                }
            }

            const ui = this._filterUI[f];
            ui.blob.update(this.state.filters[f]);
            ui.ui.update(this.state.filters[f]);
        }

        this.onFilter(this.state);
    }
}

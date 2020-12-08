import { congress_locations as locale } from '../../../locale.ini';

const FILTERS = {
    // openAt
    // - null
    // - 'now' => open now
    // - Date => open at date
    openAt: {
        default: () => null,
        renderBlob: () => {
            return {
                update: state => void 0,
            };
        },
        renderUI: () => {
            return {
                update: state => void 0,
            };
        },
    },
    // rating
    // - null
    // - (number) 0..1 => “above x%”
    rating: {
        default: () => null,
    }
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
            filterBarInner: document.createElement('div'),
            filterButton: document.createElement('button'),
        };
        this.nodes.searchContainer.className = 'search-container';
        this.nodes.searchInput.className = 'search-input';
        this.nodes.filterBar.className = 'filter-bar';
        this.nodes.filterBarInner.className = 'filter-bar-inner';
        this.nodes.filterButton.className = 'filter-button';
        this.nodes.searchInput.placeholder = locale.search_placeholder;
        this.nodes.searchInput.type = 'text';
        this.nodes.searchInput.addEventListener('input', this.didMutate);
        this.nodes.searchContainer.appendChild(this.nodes.searchInput);
        this.node.appendChild(this.nodes.searchContainer);
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

        this.onFilter(this.state);
    }
}

if (!window.requestAnimationFrame) window.requestAnimationFrame = window.webkitRequestAnimationFrame || (r => setTimeout(r, 16));

import L from 'leaflet';
import { setIconsPath, Marker } from './map-marker';
import { SearchFilters } from './search-filters';
import score from 'string-score';
import './index.less';
import 'leaflet/dist/leaflet.css';

const TILE_LAYER_URL = 'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}{r}.png?lang=eo';
const TILE_LAYER_ATTRIB = '&copy <a href="https://osm.org/copyright">OpenStreetMap</a> contributors';

function init() {
    const container = document.querySelector('.congress-location-container');
    const initialRender = document.querySelector('.congress-locations-rendered');
    if (!initialRender) return;

    const mapContainer = document.createElement('div');
    mapContainer.className = 'map-container';
    container.appendChild(mapContainer);
    const mapView = L.map(mapContainer);
    mapView.setView([0, 0], 1);
    L.tileLayer(TILE_LAYER_URL, { attribution: TILE_LAYER_ATTRIB }).addTo(mapView);

    window.mapView = mapView;

    const basePath = initialRender.dataset.basePath;
    const qLoc = initialRender.dataset.queryLoc;
    const iconsPathPrefix = initialRender.dataset.iconsPathPrefix;
    const iconsPathSuffix = initialRender.dataset.iconsPathSuffix;
    setIconsPath(iconsPathPrefix, iconsPathSuffix);

    const fetchPartial = (locationId) => {
        let path = basePath + '?partial=true';
        if (locationId) path += '&' + qLoc + '=' + locationId;
        return fetch(path).then(res => {
            return res.text().then(text => [res, text]);
        }).then(([res, contents]) => {
            if (!res.ok) throw new Error(contents);

            const div = document.createElement('div');
            div.innerHTML = contents;
            const node = div.children[0];
            div.removeChild(node);
            return node;
        });
    };

    let rendered = initialRender;

    const openLoc = (locId, href) => {
        rendered.classList.add('is-loading');
        fetchPartial(locId).then(result => {
            rendered.parentNode.insertBefore(result, rendered);
            rendered.parentNode.removeChild(rendered);
            rendered = result;
            init(result);

            let path = basePath;
            if (locId) path += '?' + qLoc + '=' + locId;
            window.history.pushState({}, '', path);
        }).catch(err => {
            console.error(err);
            // failed to load for some reason; fall back to browser navigation
            const a = document.createElement('a');
            a.href = href;
            a.click();
        });
    };

    const initLinks = node => {
        const anchors = node.querySelectorAll('a');
        for (let i = 0; i < anchors.length; i++) {
            const anchor = anchors[i];
            if (typeof anchor.dataset.locId === 'string') {
                anchor.addEventListener('click', e => {
                    if (e.metaKey || e.ctrlKey || e.altKey) return;
                    e.preventDefault();
                    openLoc(anchor.dataset.locId, anchor.href);
                });
            }
        }
    };

    window.addEventListener('popstate', () => {
        const locId = window.location.search.match(/[?&]loc=(\d+)\b/);
        if (locId) {
            openLoc(locId[1], window.location.href);
        } else {
            openLoc(null, window.location.href);
        }
    });

    let isFirstMapView = true;
    const getMapAnimation = () => {
        if (isFirstMapView) {
            isFirstMapView = false;
            return {};
        }
        return { animate: true, duration: 0.5 };
    };

    let layers = [];
    const addLayer = (layer) => {
        layer.addTo(mapView);
        layers.push(layer);
    };
    const clearLayers = () => {
        for (const layer of layers) layer.remove();
        layers = [];
    };

    const searchFilterState = {};

    const initList = list => {
        initLinks(list);
        clearLayers();

        const searchFilters = new SearchFilters(searchFilterState);
        list.parentNode.insertBefore(searchFilters.node, list);

        let lls = [];
        const domItems = list.querySelectorAll('.location-list-item');
        const items = [];
        for (let i = 0; i < domItems.length; i++) {
            const item = domItems[i];
            if (!item.dataset.ll) continue;
            const ll = item.dataset.ll.split(',').map(x => +x);
            lls.push(ll);

            const internalList = item.querySelector('.internal-locations-list');
            const internalItems = [];
            const domInternalItems = item.querySelectorAll('.internal-location-list-item');
            for (let j = 0; j < domInternalItems.length; j++) {
                const ii = domInternalItems[j];
                internalItems.push({
                    internal: true,
                    node: ii,
                    name: ii.dataset.name,
                });
            }

            item.classList.add('is-interactive');

            const marker = new Marker();
            marker.icon = item.dataset.icon;
            marker.didMutate();

            const lMarker = L.marker(ll, { icon: marker.portalIcon });
            lMarker.on('click', () => {
                item.querySelector('a[data-loc-id]').click();
            });
            lMarker.on('mouseover', () => {
                marker.highlighted = true;
                marker.didMutate();

                item.classList.add('is-highlighted');
                if (item.scrollIntoView) {
                    item.scrollIntoView({
                        behavior: 'smooth',
                        block: 'nearest',
                        inline: 'center',
                    });
                }
            });
            lMarker.on('mouseout', () => {
                marker.highlighted = false;
                marker.didMutate();

                item.classList.remove('is-highlighted');
            });
            addLayer(lMarker);

            items.push({
                node: item,
                ll,
                name: item.dataset.name,
                layer: lMarker,
                internalList,
                internalItems,
            });

            item.addEventListener('mouseover', () => {
                marker.highlighted = true;
                marker.didMutate();
            });
            item.addEventListener('mouseout', () => {
                marker.highlighted = false;
                marker.didMutate();
            });
        }

        mapView.fitBounds(L.latLngBounds(lls).pad(0.3), getMapAnimation());

        searchFilters.onFilter = (state) => {
            let scoreThreshold = 0.3;
            if (state.query.length < 2) scoreThreshold = 0.1;

            const filterItem = item => {
                return true;
            };

            const scoreItem = item => {
                let score = filterItem(item) ? 1 : 0;
                if (state.query) {
                    score *= fuzzyScore(item.name, state.query);
                }
                return score;
            };

            list.innerHTML = '';
            const scoreList = [];
            for (const item of items) {
                let innerScore = 0;
                if (item.internalList) {
                    item.internalList.innerHTML = '';

                    const innerScoreList = [];
                    for (const innerItem of item.internalItems) {
                        const score = scoreItem(innerItem);
                        if (score > scoreThreshold) {
                            innerScore += score;
                            innerScoreList.push({ node: innerItem.node, score, name: innerItem.name });
                        }
                    }

                    if (state.query) {
                        innerScoreList.sort((a, b) => b.score - a.score);
                    } else {
                        innerScoreList.sort((a, b) => a.name.localeCompare(b.name));
                    }
                    for (const x of innerScoreList) item.internalList.appendChild(x.node);
                }

                const score = innerScore + scoreItem(item);
                if (score > scoreThreshold) {
                    scoreList.push({
                        node: item.node,
                        score,
                        name: item.name,
                        layer: item.layer,
                    });
                }
            }
            if (state.query) {
                scoreList.sort((a, b) => b.score - a.score);
            } else {
                scoreList.sort((a, b) => a.name.localeCompare(b.name));
            }

            clearLayers();
            for (const x of scoreList) {
                list.appendChild(x.node);
                addLayer(x.layer);
            }
        };
    };

    const initDetail = node => {
        initLinks(node);

        if (node.dataset.ll) {
            const ll = node.dataset.ll.split(',').map(x => +x);
            if (!layers.length) {
                // first render, probably
                mapView.setView(ll, 12, getMapAnimation());

                const marker = new Marker();
                marker.icon = node.dataset.icon;
                marker.didMutate();
                addLayer(L.marker(ll, { icon: marker.portalIcon }));
            } else {
                if (mapView.getZoom() < 10) {
                    mapView.setView(ll, 10, getMapAnimation());
                } else {
                    mapView.panTo(ll, getMapAnimation());
                }
            }
        }
    };
    const init = rendered => {
        rendered.classList.add('is-interactive');
        if (rendered.children[0].classList.contains('congress-location')) {
            initDetail(rendered.children[0]);
        } else {
            initList(rendered.children[0]);
        }
    };

    init(initialRender);
}

function espNormalize(s) {
    return s.toLowerCase()
        .replace(/ch|cx|ĉ|ĉ/g, 'c')
        .replace(/gh|gx|ĝ|ĝ/g, 'g')
        .replace(/hh|hx|ĥ|ĥ/g, 'h')
        .replace(/jh|jx|ĵ|ĵ/g, 'j')
        .replace(/sh|sx|ŝ|ŝ/g, 's')
        .replace(/uh|ux|ŭ|ŭ/g, 'u');
}

function fuzzyScore(a, b) {
    return score(espNormalize(a), espNormalize(b), 0.5);
}

if (document.readyState === 'complete') init();
else window.addEventListener('DOMContentLoaded', init);

import L from 'leaflet';
import { setIconsPath, Marker } from './map-marker';
import './index.less';
import 'leaflet/dist/leaflet.css';

const TILE_LAYER_URL = 'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}{r}.png?lang=eo';
const TILE_LAYER_ATTRIB = '&copy <a href=&quot;https://osm.org/copyright&quot;>OpenStreetMap</a> contributors';

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

    const initList = node => {
        initLinks(node);
        clearLayers();

        let lls = [];
        const items = node.querySelectorAll('.location-list-item');
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (!item.dataset.ll) continue;
            const ll = item.dataset.ll.split(',').map(x => +x);
            lls.push(ll);

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
            });
            lMarker.on('mouseout', () => {
                marker.highlighted = false;
                marker.didMutate();
            });
            addLayer(lMarker);

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
        if (rendered.children[0].classList.contains('congress-location')) {
            initDetail(rendered.children[0]);
        } else {
            initList(rendered.children[0]);
        }
    };

    init(initialRender);
}

if (document.readyState === 'complete') init();
else window.addEventListener('DOMContentLoaded', init);


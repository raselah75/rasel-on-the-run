/* =====================================================================
   RASEL ON THE RUN — MAP BACKGROUND (shared by the photo map, trip routes
   and the travel map). Uses free OpenStreetMap tiles (no key needed).
   If those tiles fail to load, it switches by itself to the Esri street
   map. In dark mode the map is shown in dark colours by a CSS filter.
   (CARTO maps now ask for an API key, so they are no longer used.)
   ===================================================================== */
(() => {
  'use strict';
  const SOURCES = [
    { url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', opts: { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' } },
    { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', opts: { maxZoom: 19, attribution: 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors' } }
  ];
  window.RNR_TILES = {
    add(L, map) {
      let i = 0, layer = null, errors = 0, loaded = 0;
      const use = n => {
        if (layer) map.removeLayer(layer);
        errors = 0; loaded = 0;
        layer = L.tileLayer(SOURCES[n].url, { ...SOURCES[n].opts, className: 'rnr-map-tiles' });
        if (typeof layer.on !== 'function') { layer.addTo(map); return; }
        layer.on('tileload', () => { loaded += 1; });
        layer.on('tileerror', () => {
          errors += 1;
          // Several tiles failed and none loaded: try the next map source.
          if (errors >= 4 && loaded === 0 && i < SOURCES.length - 1) { i += 1; use(i); }
        });
        layer.addTo(map);
      };
      use(0);
      return { get layer() { return layer; } };
    }
  };
})();

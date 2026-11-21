/* =====================================================================
   RASEL ON THE RUN — MAP BACKGROUND (photo map, trip routes, travel map)
   Light mode: OpenStreetMap (free, no key), with the Esri street map as an
   automatic backup. Dark mode: the Esri dark grey map with its labels —
   a real dark map, so it never looks washed-out or white.
   The map switches by itself when you change light / dark mode.
   (CARTO maps now ask for an API key, so they are no longer used.)
   ===================================================================== */
(() => {
  'use strict';
  const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services';
  const LIGHT = [
    { url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', opts: { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' } },
    { url: `${ESRI}/World_Street_Map/MapServer/tile/{z}/{y}/{x}`, opts: { maxZoom: 19, attribution: 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors' } }
  ];
  const DARK = [
    { url: `${ESRI}/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`, labels: `${ESRI}/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}`, opts: { maxZoom: 16, attribution: 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors' } },
    LIGHT[0]
  ];
  const isDark = () => document.documentElement.classList.contains('rnr-dark');
  const maps = new Set();
  function attach(L, map) {
    const state = { L, map, layers: [], i: 0, dark: isDark() };
    const use = () => {
      state.layers.forEach(l => map.removeLayer(l));
      state.layers = [];
      const list = state.dark ? DARK : LIGHT;
      const src = list[state.i];
      let errors = 0, loaded = 0;
      const base = L.tileLayer(src.url, { ...src.opts, className: state.dark && src.labels ? 'rnr-map-tiles is-dark-map' : 'rnr-map-tiles' });
      state.layers.push(base);
      if (typeof base.on === 'function') {
        base.on('tileload', () => { loaded += 1; });
        base.on('tileerror', () => { errors += 1; if (errors >= 4 && loaded === 0 && state.i < list.length - 1) { state.i += 1; use(); } });
      }
      base.addTo(map);
      if (src.labels) { const lab = L.tileLayer(src.labels, { maxZoom: src.opts.maxZoom, className: 'rnr-map-labels', pane: map.getPane?.('shadowPane') ? 'shadowPane' : undefined }); state.layers.push(lab); lab.addTo(map); }
    };
    use();
    state.refresh = () => { if (state.dark !== isDark()) { state.dark = isDark(); state.i = 0; use(); } };
    maps.add(state);
    return { get layer() { return state.layers[0]; } };
  }
  addEventListener('rnr:theme', () => maps.forEach(s => { if (s.map._container?.isConnected === false) maps.delete(s); else s.refresh(); }));
  new MutationObserver(() => maps.forEach(s => s.refresh())).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  window.RNR_TILES = { add: attach };
})();

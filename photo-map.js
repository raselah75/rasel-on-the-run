/* =====================================================================
   RASEL ON THE RUN — PHOTO MAP (Travels page)
   A pin for every city that has photos (with the number of photos).
   Tap a pin → open that city's gallery. City positions come from Wikipedia
   and are remembered in the browser. Map: Leaflet + OpenStreetMap/CARTO
   (needs internet). Without internet the places are listed instead.
   ===================================================================== */
(() => {
  'use strict';
  const main = document.querySelector('main');
  if (!main || document.getElementById('rnrPhotoMap')) return;
  const COORD_KEY = 'raselOnTheRunPlaceCoordsV1';
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const bn = () => document.documentElement.lang === 'bn';
  const readCoords = () => { try { return JSON.parse(localStorage.getItem(COORD_KEY) || '{}') || {}; } catch { return {}; } };
  const writeCoords = v => { try { localStorage.setItem(COORD_KEY, JSON.stringify(v)); } catch {} };

  const section = document.createElement('section');
  section.id = 'rnrPhotoMap';
  section.className = 'section rnr-map-section';
  section.innerHTML = `
    <div class="section-heading"><div><p class="eyebrow">PHOTO MAP</p><h2>Where my photos were taken</h2><p>Tap a pin to open the photos from that city.</p></div></div>
    <div class="rnr-map-frame"><div class="rnr-map" id="rnrMapCanvas" role="region" aria-label="Map of cities with photos"></div><button type="button" class="rnr-map-unlock">Tap to move the map</button></div>
    <ul class="rnr-map-list" aria-label="Places with photos"></ul>
    <p class="rnr-map-hint">Add photos to a city and a pin appears here. Only you can see this message.</p>`;
  (document.getElementById('rnrGlobe') || document.getElementById('destinations') || main).after(section);

  let map = null, layer = null, places = [];

  function loadLeaflet() {
    if (window.L?.map) return Promise.resolve(window.L);
    return new Promise((resolve, reject) => {
      if (!document.querySelector('link[href*="leaflet@1.9.4"]')) {
        const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.append(css);
      }
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      const t = setTimeout(() => reject(new Error('Map library timed out')), 12000);
      s.onload = () => { clearTimeout(t); window.L?.map ? resolve(window.L) : reject(new Error('Map library missing')); };
      s.onerror = () => { clearTimeout(t); reject(new Error('Map library unavailable')); };
      document.head.append(s);
    });
  }

  async function lookup(list) {
    const cache = readCoords();
    const missing = list.filter(p => !cache[p.key]);
    for (let round = 0; round < 3 && missing.some(p => !cache[p.key]); round += 1) {
      const batch = missing.filter(p => !cache[p.key] && p.titles[round]);
      if (!batch.length) break;
      for (let i = 0; i < batch.length; i += 40) {
        const slice = batch.slice(i, i + 40);
        const params = new URLSearchParams({ action: 'query', format: 'json', prop: 'coordinates', colimit: 'max', redirects: '1', origin: '*', titles: slice.map(p => p.titles[round]).join('|') });
        try {
          const r = await fetch(`https://en.wikipedia.org/w/api.php?${params}`);
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          const d = await r.json();
          const alias = new Map();
          [...(d.query?.normalized || []), ...(d.query?.redirects || [])].forEach(x => alias.set(x.to, x.from));
          const back = t => { const names = [t]; let x = t; for (let k = 0; k < 4 && alias.has(x); k += 1) { x = alias.get(x); names.push(x); } return names; };
          Object.values(d.query?.pages || {}).forEach(pg => {
            const co = pg.coordinates?.[0];
            if (!co) return;
            back(pg.title).forEach(name => slice.filter(p => p.titles[round] === name).forEach(p => { cache[p.key] = [co.lat, co.lon]; }));
          });
        } catch (error) { console.warn('Place positions unavailable:', error.message); round = 9; break; }
      }
    }
    writeCoords(cache);
    return cache;
  }

  function openCity(p) {
    try {
      archiveLevel = 'photos'; selectedCountryId = p.countryId; selectedRegionId = p.regionId; selectedCityId = p.cityId;
      renderCountries();
      window.RNR_PAGES?.show('travels');
      requestAnimationFrame(() => document.getElementById('destinations')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    } catch (error) { console.error(error); }
  }

  async function collect() {
    let photos = [];
    try { photos = window.RNR_GALLERY?.allPhotos ? await window.RNR_GALLERY.allPhotos() : []; } catch {}
    const byCity = new Map();
    photos.filter(p => p.cityId && p.blob).forEach(p => byCity.set(p.cityId, (byCity.get(p.cityId) || 0) + 1));
    const out = [];
    for (const country of travelData) for (const region of country.regions || []) for (const city of region.cities || []) {
      if (!byCity.has(city.id)) continue;
      const titles = country.name === 'Bangladesh' ? [city.name, `${city.name}, Bangladesh`, `${city.name} District`] : [`${city.name}, ${region.name}`, city.name, `${city.name}, ${country.name}`];
      out.push({ key: `${country.name}|${region.name}|${city.name}`, name: city.name, label: `${city.name}, ${country.name}`, count: byCity.get(city.id), countryId: country.id, regionId: region.id, cityId: city.id, titles });
    }
    return out.sort((a, b) => b.count - a.count);
  }

  async function render() {
    places = await collect();
    section.classList.toggle('has-places', places.length > 0);
    const list = section.querySelector('.rnr-map-list');
    list.innerHTML = places.map((p, i) => `<li><button type="button" data-place="${i}"><span>${esc(p.label)}</span><small>${p.count}</small></button></li>`).join('');
    window.RNR_PAGES?.refresh();
    if (!places.length || section.classList.contains('rnr-off')) return;
    let L;
    try { L = await loadLeaflet(); } catch (error) { section.classList.add('is-offline'); console.warn(error.message); return; }
    const coords = await lookup(places);
    const el = section.querySelector('#rnrMapCanvas');
    if (!map) {
      map = L.map(el, { scrollWheelZoom: false, dragging: !matchMedia('(pointer: coarse)').matches, tap: true, worldCopyJump: true, zoomControl: true }).setView([30, 20], 2);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>', subdomains: 'abcd', maxZoom: 19
      }).addTo(map);
      section.querySelector('.rnr-map-unlock').addEventListener('click', () => { map.dragging.enable(); map.scrollWheelZoom.enable(); section.classList.add('is-unlocked'); });
    }
    if (layer) layer.remove();
    layer = L.layerGroup().addTo(map);
    const pts = [];
    places.forEach(p => {
      const c = coords[p.key];
      if (!c) return;
      pts.push(c);
      const icon = L.divIcon({ className: 'rnr-pin', html: `<span>${p.count}</span>`, iconSize: [38, 38], iconAnchor: [19, 38], popupAnchor: [0, -34] });
      const m = L.marker(c, { icon, title: p.label }).addTo(layer);
      const box = document.createElement('div');
      box.className = 'rnr-pin-popup';
      box.innerHTML = `<strong>${esc(p.name)}</strong><span>${p.count} ${bn() ? 'ছবি' : (p.count === 1 ? 'photo' : 'photos')}</span><button type="button">${bn() ? 'ছবি দেখুন' : 'Open photos'}</button>`;
      box.querySelector('button').addEventListener('click', () => openCity(p));
      m.bindPopup(box);
    });
    if (pts.length === 1) map.setView(pts[0], 9);
    else if (pts.length) map.fitBounds(pts, { padding: [40, 40], maxZoom: 9 });
    setTimeout(() => map.invalidateSize(), 120);
    section.classList.add('is-ready');
  }
  section.addEventListener('click', e => { const b = e.target.closest('[data-place]'); if (b) openCity(places[Number(b.dataset.place)]); });

  new MutationObserver(() => { if (!section.classList.contains('rnr-off') && !section.dataset.busy) { section.dataset.busy = '1'; render().finally(() => { delete section.dataset.busy; }); } }).observe(section, { attributes: true, attributeFilter: ['class'] });
  addEventListener('rnr:photos-changed', () => render());
  window.RNR_PHOTOMAP = { render };
  setTimeout(() => render(), 1500);
})();

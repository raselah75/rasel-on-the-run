/* =====================================================================
   RASEL ON THE RUN — GUESTBOOK MAP (About Me page)
   Every approved guestbook note with a "From" place becomes a pin on a
   small world map, coloured like the writer's avatar. Tap a pin to read
   the note. A line above the map counts the countries and cities.
   Places are found by name: first from the built-in country list, then
   from Wikipedia's map positions (no key). Positions are remembered.
   Only approved notes are used (never the ones waiting for approval).
   ===================================================================== */
(() => {
  'use strict';
  const section = document.getElementById('rnrGuestbook');
  const list = section?.querySelector('.rnr-gb-list');
  if (!section || !list) return;
  const KEY = 'raselOnTheRunGuestbookPlacesV1';
  const bn = () => document.documentElement.lang === 'bn';
  const T = (en, b) => (bn() ? b : en);
  const num = n => (bn() ? String(n).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]) : String(n));
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const readCache = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { return {}; } };
  const writeCache = c => { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch {} };
  const norm = s => String(s || '').trim().replace(/\s+/g, ' ').toLowerCase();

  const box = document.createElement('div');
  box.className = 'rnr-gbm';
  box.hidden = true;
  box.innerHTML = `<div class="rnr-gbm-head"><span class="rnr-gbm-globe" aria-hidden="true">🌍</span><p class="rnr-gbm-count"></p></div><div class="rnr-gbm-map" role="region"></div>`;
  (section.querySelector('.rnr-gb-wrap') || list).before(box);
  const mapEl = box.querySelector('.rnr-gbm-map');
  const countEl = box.querySelector('.rnr-gbm-count');

  // Notes currently shown in the guestbook (approved only).
  function notes() {
    return [...list.querySelectorAll('.rnr-gb-card:not(.is-waiting)')].map(card => {
      const who = card.querySelector('.rnr-gb-who');
      const name = who?.querySelector('b')?.textContent.trim() || '';
      const place = (who?.textContent || '').split(' · ').slice(1).join(' · ').trim();
      return { name, place, message: card.querySelector('.rnr-gb-msg')?.textContent.trim() || '', color: card.querySelector('.rnr-gb-avatar')?.style.getPropertyValue('--c') || '#e57a4c' };
    }).filter(n => n.place);
  }

  // "Dhaka, Bangladesh" → country from the last part, city from the first.
  function countryOf(place) {
    const parts = place.split(/[,،|/-]/).map(s => s.trim()).filter(Boolean);
    for (let i = parts.length - 1; i >= 0; i -= 1) { const c = window.RNR_WORLD?.find(parts[i]); if (c) return { country: c, isCountry: parts.length === 1 }; }
    return { country: null, isCountry: false };
  }

  async function locate(places) {
    const cache = readCache();
    const todo = places.filter(p => !(norm(p) in cache));
    // Countries on their own: built-in centre points.
    todo.forEach(p => { const { country, isCountry } = countryOf(p); if (isCountry && country) cache[norm(p)] = [country.lat, country.lng, country.name]; });
    const ask = todo.filter(p => !(norm(p) in cache));
    for (let i = 0; i < ask.length; i += 40) {
      const slice = ask.slice(i, i + 40);
      const title = p => p.split(',')[0].trim();
      const params = new URLSearchParams({ action: 'query', format: 'json', prop: 'coordinates', colimit: 'max', redirects: '1', origin: '*', titles: slice.map(title).join('|') });
      try {
        const r = await fetch(`https://en.wikipedia.org/w/api.php?${params}`);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const d = await r.json();
        const alias = new Map();
        [...(d.query?.normalized || []), ...(d.query?.redirects || [])].forEach(x => alias.set(x.to, x.from));
        const found = new Map();
        Object.values(d.query?.pages || {}).forEach(pg => {
          const co = pg.coordinates?.[0];
          if (!co) return;
          let t = pg.title; found.set(t, co);
          for (let k = 0; k < 4 && alias.has(t); k += 1) { t = alias.get(t); found.set(t, co); }
        });
        slice.forEach(p => {
          const co = found.get(title(p));
          const { country } = countryOf(p);
          if (co) cache[norm(p)] = [co.lat, co.lon, country?.name || ''];
          else if (country) cache[norm(p)] = [country.lat, country.lng, country.name];
          else cache[norm(p)] = null;
        });
      } catch (error) {
        console.warn('Guestbook places unavailable:', error.message);
        slice.forEach(p => { const { country } = countryOf(p); if (country) cache[norm(p)] = [country.lat, country.lng, country.name]; });
        break;
      }
    }
    writeCache(cache);
    return cache;
  }

  function loadLeaflet() {
    if (window.L?.map) return Promise.resolve(window.L);
    return new Promise((resolve, reject) => {
      if (!document.querySelector('link[href*="leaflet@1.9.4"]')) {
        const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.append(css);
      }
      const existing = document.querySelector('script[src*="leaflet@1.9.4"]');
      const s = existing || document.createElement('script');
      const t = setTimeout(() => reject(new Error('Map library timed out')), 12000);
      const done = () => { clearTimeout(t); window.L?.map ? resolve(window.L) : reject(new Error('Map library missing')); };
      s.addEventListener('load', done); s.addEventListener('error', () => { clearTimeout(t); reject(new Error('Map library unavailable')); });
      if (!existing) { s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; document.head.append(s); }
      else if (window.L?.map) done();
    });
  }

  let map = null, layer = null, lastSig = '';
  async function render() {
    const all = notes();
    const sig = all.map(n => `${n.name}|${n.place}`).join('¦') + (bn() ? 'bn' : 'en');
    if (sig === lastSig) return;
    lastSig = sig;
    if (!all.length) { box.hidden = true; return; }
    const cache = await locate([...new Set(all.map(n => n.place))]);
    const pins = all.map(n => ({ ...n, at: cache[norm(n.place)] })).filter(n => n.at);
    if (!pins.length) { box.hidden = true; return; }
    const countries = new Set(pins.map(p => p.at[2]).filter(Boolean));
    const places = new Set(pins.map(p => norm(p.place)));
    const allKnown = pins.every(p => p.at[2]);
    countEl.innerHTML = allKnown
      ? T(`Notes from <b>${num(places.size)}</b> ${places.size === 1 ? 'place' : 'places'} in <b>${num(countries.size)}</b> ${countries.size === 1 ? 'country' : 'countries'} — thank you!`,
        `<b>${num(countries.size)}</b>টি দেশের <b>${num(places.size)}</b>টি জায়গা থেকে শুভেচ্ছা — ধন্যবাদ!`)
      : T(`Notes from <b>${num(places.size)}</b> ${places.size === 1 ? 'place' : 'places'} around the world — thank you!`,
        `পৃথিবীর <b>${num(places.size)}</b>টি জায়গা থেকে শুভেচ্ছা — ধন্যবাদ!`);
    mapEl.setAttribute('aria-label', T('Map of where guestbook notes came from', 'গেস্টবুকের নোট কোথা থেকে এসেছে তার ম্যাপ'));
    box.hidden = false;
    let L;
    try { L = await loadLeaflet(); } catch (error) { mapEl.innerHTML = `<p class="rnr-gbm-off">${esc(T('The map could not load right now.', 'ম্যাপটি এখন লোড হচ্ছে না।'))}</p>`; return; }
    if (!map) {
      map = L.map(mapEl, { scrollWheelZoom: false, worldCopyJump: true, zoomControl: true, attributionControl: true, minZoom: 1 }).setView([25, 10], 1);
      if (window.RNR_TILES?.add) window.RNR_TILES.add(L, map);
      else L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; OpenStreetMap' }).addTo(map);
      layer = L.layerGroup().addTo(map);
    }
    layer.clearLayers();
    // Several notes from the same place share one pin.
    const groups = new Map();
    pins.forEach(p => { const k = norm(p.place); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(p); });
    const bounds = [];
    groups.forEach(g => {
      const [lat, lng] = g[0].at;
      bounds.push([lat, lng]);
      const icon = L.divIcon({ className: 'rnr-gbm-pin', html: `<span style="--c:${esc(g[0].color)}"><i>${g.length > 1 ? num(g.length) : esc(g[0].name.charAt(0).toUpperCase())}</i></span>`, iconSize: [30, 30], iconAnchor: [15, 15] });
      const html = `<div class="rnr-gbm-pop" data-no-translate><p class="rnr-gbm-pop-place">📍 ${esc(g[0].place)}</p>${g.slice(0, 4).map(n => `<p><b>${esc(n.name)}</b>: ${esc(n.message.length > 140 ? `${n.message.slice(0, 140)}…` : n.message)}</p>`).join('')}${g.length > 4 ? `<p class="rnr-gbm-more">+${num(g.length - 4)}</p>` : ''}</div>`;
      L.marker([lat, lng], { icon, title: g[0].place, keyboard: true }).bindPopup(html, { maxWidth: 260 }).addTo(layer);
    });
    setTimeout(() => {
      map.invalidateSize();
      if (bounds.length === 1) map.setView(bounds[0], 4); else map.fitBounds(bounds, { padding: [36, 36], maxZoom: 5 });
    }, 60);
  }

  let timer = 0;
  const schedule = () => { clearTimeout(timer); timer = setTimeout(() => render().catch(console.error), 300); };
  new MutationObserver(schedule).observe(list, { childList: true, subtree: true });
  addEventListener('rnr:language', () => { lastSig = ''; schedule(); });
  // The map needs a size once the About page is opened.
  new MutationObserver(() => { if (map && !section.classList.contains('rnr-off')) setTimeout(() => map.invalidateSize(), 80); }).observe(section, { attributes: true, attributeFilter: ['class'] });
  window.RNR_GUESTBOOK_MAP = { render: () => { lastSig = ''; return render(); } };
  schedule();
})();

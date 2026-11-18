/* =====================================================================
   RASEL ON THE RUN — TRIP ROUTES (Travels page)
   Pick a trip and watch the route draw itself on the map, stop by stop:
   flights curve along the real great-circle path, road / train / boat
   trips go straight from place to place. Without internet the stops are
   shown as a list.
   Admin mode: "+ Add trip route" — one place per line. Places are found
   on Wikipedia when you save (or write "Name | 23.81, 90.41").
   Saved in raselOnTheRunTripRoutesV1 (published).
   ===================================================================== */
(() => {
  'use strict';
  const main = document.querySelector('main');
  if (!main || document.getElementById('rnrTripRoutes')) return;
  const KEY = 'raselOnTheRunTripRoutesV1';
  const read = () => { try { const v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; } };
  const write = v => { try { localStorage.setItem(KEY, JSON.stringify(v)); return true; } catch { alert('Could not save. Browser storage may be full.'); return false; } };
  const isAdmin = () => document.body.classList.contains('admin-mode');
  const bn = () => document.documentElement.lang === 'bn';
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = n => { const s = Math.round(n).toLocaleString('en-US'); return bn() ? s.replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]) : s; };
  const fmt = iso => { if (!iso) return ''; const d = new Date(`${iso}T12:00:00`); return isNaN(d) ? '' : d.toLocaleDateString(bn() ? 'bn-BD' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }); };
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  const MODES = { 'Flight': 'flight', 'Road trip': 'road', 'Train': 'train', 'Boat': 'boat', 'Mixed (flights for long distances)': 'mixed' };
  const modeName = m => Object.keys(MODES).find(k => MODES[k] === m) || 'Flight';
  const ICON = {
    flight: '<svg viewBox="0 0 24 24"><path d="M12 2c.8 0 1.4.7 1.4 1.5V9l7.6 4.6v2l-7.6-2.3v4.9l2.2 1.6V21L12 20l-3.6 1v-1.2l2.2-1.6v-4.9L3 15.6v-2L10.6 9V3.5C10.6 2.7 11.2 2 12 2z" fill="currentColor"/></svg>',
    road: '<svg viewBox="0 0 24 24"><path d="M5 11l1.6-4.4A2 2 0 0 1 8.5 5h7a2 2 0 0 1 1.9 1.6L19 11a2 2 0 0 1 1 1.7V17h-2v2h-2.5v-2h-7v2H6v-2H4v-4.3A2 2 0 0 1 5 11zm2.2-.2h9.6l-1.1-3.3H8.3zM7.5 15a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4zm9 0a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4z" fill="currentColor"/></svg>',
    train: '<svg viewBox="0 0 24 24"><path d="M7 3h10a3 3 0 0 1 3 3v9a3 3 0 0 1-2.2 2.9L19.5 21h-2.3l-1.5-3H8.3l-1.5 3H4.5l1.7-3.1A3 3 0 0 1 4 15V6a3 3 0 0 1 3-3zm-1 4v4h12V7zm2 9.2a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6zm8 0a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6z" fill="currentColor"/></svg>',
    boat: '<svg viewBox="0 0 24 24"><path d="M11 2h2v3h4l1 6 3 1-2.6 6.2c-1.1-.5-2.3-.8-3.4-.2-1.2.6-2.8.6-4 0s-2.8-.6-4 0c-1.1.6-2.3.3-3.4-.2L3 12l3-1 1-6h4zm-2.3 5-.5 3.3L12 9l3.8 1.3L15.3 7zM3 20c1.5.8 3 .8 4.5 0s3-.8 4.5 0 3 .8 4.5 0 3-.8 4.5 0v2c-1.5.8-3 .8-4.5 0s-3-.8-4.5 0-3 .8-4.5 0-3-.8-4.5 0z" fill="currentColor"/></svg>'
  };

  // ---------- Section ----------
  const section = document.createElement('section');
  section.id = 'rnrTripRoutes';
  section.className = 'section rnr-route-section';
  section.innerHTML = `
    <div class="section-heading"><div><p class="eyebrow">ON THE ROAD</p><h2>My trip routes</h2><p>Pick a trip and watch the route draw itself, stop by stop.</p></div>
      <button type="button" class="rnr-owner-pill is-solid" data-route-add>+ Add trip route</button></div>
    <div class="rnr-route-tabs" role="tablist" aria-label="Trips"></div>
    <div class="rnr-route-wrap">
      <div class="rnr-route-frame"><div class="rnr-route-map" aria-label="Map of the trip route" role="region"></div><button type="button" class="rnr-map-unlock">Tap to move the map</button></div>
      <aside class="rnr-route-card">
        <p class="rnr-route-mode"></p><h3 data-no-translate></h3><p class="rnr-route-date"></p>
        <div class="rnr-route-stats"><div><strong data-rs-stops>0</strong><span>Stops</span></div><div><strong data-rs-km>0</strong><span>km</span></div></div>
        <ol class="rnr-route-stops" data-no-translate></ol>
        <p class="rnr-route-note" data-no-translate></p>
        <div class="rnr-route-actions"><button type="button" class="rnr-route-replay" data-route-replay>▶ Replay route</button><button type="button" class="rnr-owner-pill" data-route-edit>Edit</button></div>
      </aside>
    </div>
    <p class="rnr-route-hint">Add a trip with its stops (for example Dhaka → Doha → Toronto) and it will draw itself here. Only you can see this message.</p>`;
  (document.getElementById('rnrPassport') || document.getElementById('rnrGlobe') || main).after(section);

  let trips = [], current = 0, map = null, layer = null, anim = 0, L = null;

  // ---------- Geometry ----------
  const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
  function km(a, b) {
    const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 6371 * 2 * Math.asin(Math.sqrt(h));
  }
  function greatCircle(a, b, n) {
    const p1 = [rad(a.lat), rad(a.lng)], p2 = [rad(b.lat), rad(b.lng)];
    const d = 2 * Math.asin(Math.sqrt(Math.sin((p2[0] - p1[0]) / 2) ** 2 + Math.cos(p1[0]) * Math.cos(p2[0]) * Math.sin((p2[1] - p1[1]) / 2) ** 2));
    if (d < 1e-6) return [[a.lat, a.lng], [b.lat, b.lng]];
    const out = [];
    for (let i = 0; i <= n; i += 1) {
      const f = i / n, A = Math.sin((1 - f) * d) / Math.sin(d), B = Math.sin(f * d) / Math.sin(d);
      const x = A * Math.cos(p1[0]) * Math.cos(p1[1]) + B * Math.cos(p2[0]) * Math.cos(p2[1]);
      const y = A * Math.cos(p1[0]) * Math.sin(p1[1]) + B * Math.cos(p2[0]) * Math.sin(p2[1]);
      const z = A * Math.sin(p1[0]) + B * Math.sin(p2[0]);
      out.push([deg(Math.atan2(z, Math.sqrt(x * x + y * y))), deg(Math.atan2(y, x))]);
    }
    return out;
  }
  // Keep longitudes continuous so lines never jump across the whole map.
  function unwrap(points) {
    for (let i = 1; i < points.length; i += 1) {
      while (points[i][1] - points[i - 1][1] > 180) points[i][1] -= 360;
      while (points[i][1] - points[i - 1][1] < -180) points[i][1] += 360;
    }
    return points;
  }
  function segmentMode(trip, a, b) { return trip.mode === 'mixed' ? (km(a, b) > 700 ? 'flight' : 'road') : trip.mode; }
  function buildPath(trip) {
    const s = trip.stops;
    const segs = [];
    for (let i = 0; i < s.length - 1; i += 1) {
      const mode = segmentMode(trip, s[i], s[i + 1]);
      const dist = km(s[i], s[i + 1]);
      const pts = mode === 'flight' ? greatCircle(s[i], s[i + 1], Math.max(16, Math.min(120, Math.round(dist / 60))))
        : Array.from({ length: 13 }, (_, k) => [s[i].lat + (s[i + 1].lat - s[i].lat) * k / 12, s[i].lng + (s[i + 1].lng - s[i].lng) * k / 12]);
      segs.push({ mode, dist, pts });
    }
    // Make the whole route continuous in longitude.
    const flat = unwrap([[s[0].lat, s[0].lng], ...segs.flatMap(g => g.pts.slice(1))]);
    let k = 1;
    segs.forEach(g => { g.pts = [flat[k - 1], ...flat.slice(k, k + g.pts.length - 1)]; k += g.pts.length - 1; });
    const stopPts = [flat[0]]; segs.forEach(g => stopPts.push(g.pts[g.pts.length - 1]));
    return { segs, stopPts, all: flat };
  }

  // ---------- Map ----------
  function loadLeaflet() {
    if (window.L?.map) return Promise.resolve(window.L);
    return new Promise((resolve, reject) => {
      if (!document.querySelector('link[href*="leaflet@1.9.4"]')) { const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.append(css); }
      const existing = document.querySelector('script[src*="leaflet@1.9.4"]');
      const s = existing || document.createElement('script');
      const t = setTimeout(() => reject(new Error('Map library timed out')), 12000);
      s.addEventListener('load', () => { clearTimeout(t); window.L?.map ? resolve(window.L) : reject(new Error('Map library missing')); });
      s.addEventListener('error', () => { clearTimeout(t); reject(new Error('Map library unavailable')); });
      if (!existing) { s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; document.head.append(s); }
    });
  }
  async function ensureMap() {
    if (map) return true;
    try { L = await loadLeaflet(); } catch (error) { section.classList.add('is-offline'); console.warn(error.message); return false; }
    const el = section.querySelector('.rnr-route-map');
    map = L.map(el, { scrollWheelZoom: false, dragging: !matchMedia('(pointer: coarse)').matches, worldCopyJump: false, zoomControl: true }).setView([35, 20], 2);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>', subdomains: 'abcd', maxZoom: 19
    }).addTo(map);
    section.querySelector('.rnr-map-unlock').addEventListener('click', () => { map.dragging.enable(); map.scrollWheelZoom.enable(); section.classList.add('is-unlocked'); });
    section.classList.add('is-ready');
    return true;
  }

  async function play() {
    cancelAnimationFrame(anim);
    const trip = trips[current];
    if (!trip || !(await ensureMap())) return;
    if (layer) layer.remove();
    layer = L.layerGroup().addTo(map);
    const { segs, stopPts, all } = buildPath(trip);
    map.invalidateSize();
    map.fitBounds(all, { padding: [46, 46], maxZoom: 8, animate: false });
    const ghost = L.polyline(all, { color: '#0f2233', weight: 2, opacity: 0.18, dashArray: '4 8' }).addTo(layer);
    void ghost;
    const line = L.polyline([], { color: '#ee8456', weight: 4, opacity: 0.95, lineCap: 'round' }).addTo(layer);
    const glow = L.polyline([], { color: '#f3b765', weight: 10, opacity: 0.25, lineCap: 'round' }).addTo(layer);
    const stopMarker = (i) => {
      const s = trip.stops[i];
      const icon = L.divIcon({ className: 'rnr-route-stop', html: `<span>${i + 1}</span>`, iconSize: [28, 28], iconAnchor: [14, 14] });
      const m = L.marker(stopPts[i], { icon, title: s.name, keyboard: false }).addTo(layer);
      m.bindTooltip(esc(s.name.split(',')[0]), { direction: 'top', offset: [0, -14], permanent: i === 0 || i === trip.stops.length - 1, className: 'rnr-route-tip' });
      section.querySelectorAll('.rnr-route-stops li')[i]?.classList.add('is-reached');
    };
    section.querySelectorAll('.rnr-route-stops li').forEach(li => li.classList.remove('is-reached'));
    const head = L.marker(stopPts[0], { icon: L.divIcon({ className: 'rnr-route-head', html: `<i>${ICON[segs[0]?.mode] || ICON.flight}</i>`, iconSize: [34, 34], iconAnchor: [17, 17] }), interactive: false, keyboard: false }).addTo(layer);
    stopMarker(0);
    if (reduce() || !segs.length) {
      line.setLatLngs(all); glow.setLatLngs(all);
      trip.stops.forEach((_, i) => i && stopMarker(i));
      head.remove();
      return;
    }
    const drawn = [all[0]];
    const per = Math.max(900, Math.min(2600, 9000 / segs.length));
    let seg = 0, t0 = 0;
    const iconEl = () => head.getElement()?.querySelector('i');
    const step = t => {
      if (!t0) t0 = t;
      const g = segs[seg];
      const f = Math.min(1, (t - t0) / per);
      const ease = f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
      const exact = ease * (g.pts.length - 1);
      const idx = Math.floor(exact), frac = exact - idx;
      const a = g.pts[idx], b = g.pts[Math.min(idx + 1, g.pts.length - 1)];
      const pos = [a[0] + (b[0] - a[0]) * frac, a[1] + (b[1] - a[1]) * frac];
      const pts = drawn.concat(g.pts.slice(1, idx + 1), [pos]);
      line.setLatLngs(pts); glow.setLatLngs(pts);
      head.setLatLng(pos);
      const pa = map.latLngToLayerPoint(a), pb = map.latLngToLayerPoint(b);
      const el = iconEl();
      if (el) {
        el.innerHTML = ICON[g.mode] || ICON.flight;
        const angle = g.mode === 'flight' ? Math.atan2(pb.x - pa.x, -(pb.y - pa.y)) * 180 / Math.PI : 0;
        if (pa.x !== pb.x || pa.y !== pb.y) el.style.transform = g.mode === 'flight' ? `rotate(${angle}deg)` : (pb.x < pa.x ? 'scaleX(-1)' : '');
      }
      if (f >= 1) {
        drawn.push(...g.pts.slice(1));
        stopMarker(seg + 1);
        seg += 1; t0 = 0;
        if (seg >= segs.length) { setTimeout(() => head.remove(), 900); return; }
      }
      anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }

  // ---------- Card + tabs ----------
  function renderCard() {
    const trip = trips[current];
    if (!trip) return;
    const { segs } = buildPath(trip);
    const total = segs.reduce((s, g) => s + g.dist, 0);
    const modeText = { flight: ['By air', 'আকাশপথে'], road: ['Road trip', 'সড়কপথে'], train: ['By train', 'ট্রেনে'], boat: ['By boat', 'নৌপথে'], mixed: ['By air and road', 'আকাশ ও সড়কপথে'] }[trip.mode] || ['', ''];
    const card = section.querySelector('.rnr-route-card');
    card.querySelector('.rnr-route-mode').innerHTML = `<i>${ICON[trip.mode === 'mixed' ? 'flight' : trip.mode] || ICON.flight}</i>${esc(modeText[bn() ? 1 : 0])}`;
    card.querySelector('h3').textContent = trip.title;
    card.querySelector('.rnr-route-date').textContent = fmt(trip.date);
    card.querySelector('[data-rs-stops]').textContent = num(trip.stops.length);
    card.querySelector('[data-rs-km]').textContent = num(total);
    card.querySelector('.rnr-route-stops').innerHTML = trip.stops.map((s, i) => `<li><span>${i + 1}</span>${esc(s.name)}${i < segs.length ? `<small>${num(segs[i].dist)} ${bn() ? 'কিমি' : 'km'}</small>` : ''}</li>`).join('');
    card.querySelector('.rnr-route-note').textContent = trip.note || '';
  }
  function render() {
    trips = read().filter(t => t && Array.isArray(t.stops) && t.stops.length >= 2);
    trips.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    if (current >= trips.length) current = 0;
    section.classList.toggle('has-trips', trips.length > 0);
    section.querySelector('.rnr-route-tabs').innerHTML = trips.length > 1 ? trips.map((t, i) => `<button type="button" role="tab" aria-selected="${i === current}" data-route-tab="${i}" data-no-translate>${esc(t.title)}</button>`).join('') : '';
    renderCard();
    window.RNR_PAGES?.refresh();
    if (trips.length && !section.classList.contains('rnr-off')) inView();
  }

  // Draw when the section comes into view (and again when a trip is chosen).
  let played = -1;
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) inView(true); }, { threshold: 0.35 }) : null;
  if (io) io.observe(section.querySelector('.rnr-route-frame'));
  function inView(visible) {
    if (!trips.length || section.classList.contains('rnr-off')) return;
    ensureMap().then(ok => {
      if (!ok) return;
      map.invalidateSize();
      if (visible && played !== current) { played = current; play(); }
      else if (played !== current && !io) { played = current; play(); }
      else if (!layer) play();
    });
  }
  new MutationObserver(() => { if (!section.classList.contains('rnr-off')) setTimeout(() => { map?.invalidateSize(); inView(false); }, 60); }).observe(section, { attributes: true, attributeFilter: ['class'] });

  // ---------- Finding places ----------
  async function geocode(lines) {
    const out = [], missing = [];
    const titlesFor = line => { const parts = line.split(',').map(x => x.trim()).filter(Boolean); return [...new Set([line, parts[0], parts.slice(0, 2).join(', ')])].filter(Boolean); };
    const want = [];
    lines.forEach((line, i) => {
      const m = line.match(/^(.*?)\s*\|\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
      if (m) out[i] = { name: m[1].trim() || line, lat: Number(m[2]), lng: Number(m[3]) };
      else want.push({ i, line, titles: titlesFor(line) });
    });
    for (let round = 0; round < 3 && want.some(w => !out[w.i]); round += 1) {
      const batch = want.filter(w => !out[w.i] && w.titles[round]);
      if (!batch.length) continue;
      const params = new URLSearchParams({ action: 'query', format: 'json', prop: 'coordinates', colimit: 'max', redirects: '1', origin: '*', titles: batch.map(w => w.titles[round]).join('|') });
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
          back(pg.title).forEach(name => batch.filter(w => w.titles[round] === name && !out[w.i]).forEach(w => { out[w.i] = { name: w.line, lat: co.lat, lng: co.lon }; }));
        });
      } catch (error) { console.warn('Place search failed:', error.message); break; }
    }
    lines.forEach((line, i) => { if (!out[i]) missing.push(line); });
    return { stops: out, missing };
  }

  function edit(trip) {
    const all = read();
    window.RNR_OWNER_FORM?.({ eyebrow: 'TRIP ROUTE', title: trip ? 'Edit trip route' : 'New trip route',
      note: 'One place per line, in order. If a place is not found, write it like this: Cox\'s Bazar | 21.43, 91.98',
      fields: [
        { name: 'title', label: 'Trip name', value: trip?.title || '', placeholder: 'e.g. Moving to Canada', maxlength: 60 },
        { name: 'date', label: 'Date', type: 'date', value: trip?.date || '' },
        { name: 'mode', label: 'How did you travel?', type: 'select', options: Object.keys(MODES), value: modeName(trip?.mode) },
        { name: 'stops', label: 'Stops (one per line)', type: 'textarea', rows: 6, value: (trip?.stops || []).map(s => s.name).join('\n'), placeholder: 'Dhaka, Bangladesh\nDoha, Qatar\nToronto, Canada' },
        { name: 'note', label: 'Short note (optional)', value: trip?.note || '', maxlength: 160 }
      ],
      save: async d => {
        const lines = d.stops.split('\n').map(x => x.trim()).filter(Boolean).slice(0, 30);
        if (!d.title.trim() || lines.length < 2) { alert('Please add a trip name and at least two places.'); return false; }
        const known = new Map((trip?.stops || []).map(s => [s.name, s]));
        const need = lines.filter(l => !known.has(l));
        const btn = document.querySelector('.rnr-owner-modal button[type=submit]');
        if (btn) { btn.disabled = true; btn.textContent = 'Finding places…'; }
        const found = need.length ? await geocode(need) : { stops: [], missing: [] };
        if (btn) { btn.disabled = false; btn.textContent = 'Save'; }
        if (found.missing.length) { alert(`These places were not found:\n\n${found.missing.join('\n')}\n\nCheck the spelling, or add the position like this:\nName | 23.81, 90.41`); return false; }
        const byLine = new Map(need.map((l, i) => [l, found.stops[i]]));
        const stops = lines.map(l => known.get(l) || byLine.get(l)).map(s => ({ name: s.name, lat: +s.lat.toFixed(5), lng: +s.lng.toFixed(5) }));
        const rec = { id: trip?.id || `trip-${Date.now()}`, title: d.title.trim(), date: d.date || '', mode: MODES[d.mode] || 'flight', stops, note: d.note.trim() };
        const i = all.findIndex(t => t.id === rec.id);
        if (i >= 0) all[i] = rec; else all.push(rec);
        if (!write(all)) return false;
        render();
        current = trips.findIndex(t => t.id === rec.id); if (current < 0) current = 0;
        played = -1; render(); play(); played = current;
      },
      extraLabel: trip ? 'Delete' : undefined,
      extra: trip ? () => { if (!confirm(`Delete "${trip.title}"?`)) return false; write(all.filter(t => t.id !== trip.id)); current = 0; played = -1; if (layer) { layer.remove(); layer = null; } render(); } : undefined });
  }

  section.addEventListener('click', e => {
    const tab = e.target.closest('[data-route-tab]');
    if (tab) { current = Number(tab.dataset.routeTab); section.querySelectorAll('[data-route-tab]').forEach(b => b.setAttribute('aria-selected', b === tab)); renderCard(); played = current; play(); return; }
    if (e.target.closest('[data-route-replay]')) { play(); return; }
    if (e.target.closest('[data-route-add]') && isAdmin()) { edit(null); return; }
    if (e.target.closest('[data-route-edit]') && isAdmin()) { edit(trips[current]); }
  });
  addEventListener('rnr:language', () => renderCard());
  window.RNR_ROUTES = { render, play };
  setTimeout(render, 400);
})();

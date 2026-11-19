/* =====================================================================
   RASEL ON THE RUN — "WHERE I'VE BEEN" GLOBE (Travels page)
   - Online: a realistic 3D Earth (globe.gl, loaded from unpkg) with glowing,
     pulsing markers on visited countries and small markers on every other
     country in the archive. Tap/click a marker to open that country.
   - Offline or without WebGL: a lightweight built-in globe drawn on canvas.
   Visited = site-config.js visitedCountries + countries marked as visited
   in Admin mode on this device.
   ===================================================================== */
(() => {
  'use strict';
  const main = document.querySelector('main');
  if (!main || document.getElementById('rnrGlobe')) return;

  const PLACES = {
    'Bangladesh': [23.7, 90.4, 'Asia'], 'Canada': [56.1, -106.3, 'North America'], 'Maldives': [3.2, 73.2, 'Asia'],
    'Nepal': [28.4, 84.1, 'Asia'], 'India': [21.0, 78.0, 'Asia'], 'France': [46.6, 2.4, 'Europe'], 'Spain': [40.4, -3.7, 'Europe'],
    'United States': [39.8, -98.6, 'North America'], 'Türkiye': [39.0, 35.2, 'Asia'], 'Italy': [42.8, 12.5, 'Europe'],
    'Mexico': [23.6, -102.5, 'North America'], 'United Kingdom': [54.0, -2.0, 'Europe'], 'Germany': [51.2, 10.4, 'Europe'],
    'Japan': [36.2, 138.3, 'Asia'], 'Greece': [39.1, 22.0, 'Europe'], 'Thailand': [15.9, 100.9, 'Asia'], 'Austria': [47.5, 14.6, 'Europe'],
    'Saudi Arabia': [23.9, 45.1, 'Asia'], 'Portugal': [39.4, -8.2, 'Europe'], 'Malaysia': [4.2, 102.0, 'Asia'],
    'Netherlands': [52.1, 5.3, 'Europe'], 'Poland': [52.0, 19.1, 'Europe'], 'Vietnam': [14.1, 108.3, 'Asia'],
    'Morocco': [31.8, -7.1, 'Africa'], 'South Korea': [36.5, 127.8, 'Asia'], 'Egypt': [26.8, 30.8, 'Africa'],
    'Hungary': [47.2, 19.5, 'Europe'], 'Singapore': [1.35, 103.8, 'Asia'], 'Albania': [41.2, 20.2, 'Europe'],
    'Tunisia': [34.0, 9.5, 'Africa'], 'Uzbekistan': [41.4, 64.6, 'Asia'], 'South Africa': [-30.6, 22.9, 'Africa'],
    'Sweden': [60.1, 18.6, 'Europe'], 'Bulgaria': [42.7, 25.5, 'Europe'], 'Dominican Republic': [18.7, -70.2, 'North America'],
    'Australia': [-25.3, 133.8, 'Oceania'], 'Iran': [32.4, 53.7, 'Asia'], 'Brazil': [-14.2, -51.9, 'South America'],
    'Colombia': [4.6, -74.3, 'South America'], 'Cambodia': [12.6, 104.9, 'Asia'], 'Argentina': [-38.4, -63.6, 'South America'],
    'Ireland': [53.4, -8.2, 'Europe'], 'Bahrain': [26.07, 50.55, 'Asia'], 'Philippines': [12.9, 121.8, 'Asia'],
    'Chile': [-35.7, -71.5, 'South America'], 'Jordan': [30.6, 36.2, 'Asia'], 'Georgia': [42.3, 43.4, 'Asia'],
    'Qatar': [25.35, 51.18, 'Asia'], 'Andorra': [42.5, 1.5, 'Europe'], 'Sri Lanka': [7.9, 80.8, 'Asia']
  };
  const norm = value => (typeof cleanName === 'function' ? cleanName(value) : String(value).toLowerCase().trim());
  const placeOf = name => { const key = Object.keys(PLACES).find(k => norm(k) === norm(name)); if (key) return PLACES[key]; const w = window.RNR_WORLD?.find(name); return w ? [w.lat, w.lng, w.continent] : null; };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

  const journeys = () => ((window.RNR_SITE || {}).journeys || []).filter(j => j?.from && j?.to && isFinite(j.from.lat) && isFinite(j.to.lat));

  const LISTS_KEY = 'raselOnTheRunGlobeListsV1';
  const readLists = () => { try { const v = JSON.parse(localStorage.getItem(LISTS_KEY) || 'null'); return v && Array.isArray(v.visited) ? v : null; } catch { return null; } };

  // ---------- Section ----------
  const section = document.createElement('section');
  section.id = 'rnrGlobe';
  section.className = 'section rnr-globe-section';
  section.innerHTML = `
    <div class="rnr-globe-card">
      <div class="rnr-globe-copy">
        <p class="eyebrow">MY WORLD</p>
        <h2>Where I've been</h2>
        <p class="rnr-globe-lead">Every glowing light is a country I have visited. Spin the globe and tap a light to open that country.</p>
        <div class="rnr-globe-stats">
          <div><strong id="rnrGlobeVisited">0</strong><span>Countries visited</span></div>
          <div><strong id="rnrGlobeContinents">0</strong><span>Continents</span></div>
          <div><strong id="rnrGlobeWish">0</strong><span>Want to visit</span></div>
        </div>
        <ul class="rnr-globe-list" id="rnrGlobeList" aria-label="Countries visited"></ul>
        <ul class="rnr-globe-list is-wish" id="rnrGlobeWishList" aria-label="Countries I want to visit"></ul>
        <p class="rnr-globe-journeys" id="rnrGlobeJourneys"></p>
        <div class="rnr-globe-legend"><span><i class="is-visited"></i>Visited</span><span><i class="is-wish"></i>Want to visit</span><span><i class="is-journey"></i>My journey</span></div>
        <button type="button" class="rnr-owner-pill is-light" data-globe-lists>Edit visited &amp; wishlist</button>
      </div>
      <div class="rnr-globe-stage" id="rnrGlobeStage" aria-label="Interactive globe of visited countries" role="img"></div>
    </div>`;
  const destinations = document.getElementById('destinations');
  if (destinations) destinations.before(section); else main.append(section);
  const stage = section.querySelector('#rnrGlobeStage');

  // ---------- Data ----------
  function collect() {
    const data = typeof travelData !== 'undefined' && Array.isArray(travelData) ? travelData : [];
    const lists = readLists();
    const configured = new Set(((lists ? lists.visited : (window.RNR_SITE || {}).visitedCountries) || []).map(norm));
    const wish = new Set(((lists && lists.wishlist) || []).map(norm));
    const countries = data.map(country => {
      const place = placeOf(country.name);
      return {
        id: country.id, name: country.name,
        flag: typeof getCountryFlag === 'function' ? getCountryFlag(country.name) : '',
        visited: Boolean(country.visited) || configured.has(norm(country.name)),
        wish: wish.has(norm(country.name)) && !(Boolean(country.visited) || configured.has(norm(country.name))),
        lat: place?.[0], lng: place?.[1], continent: place?.[2] || ''
      };
    });
    // Configured countries that are not in the archive still count and show.
    configured.forEach(key => {
      if (countries.some(c => norm(c.name) === key)) return;
      const name = Object.keys(PLACES).find(k => norm(k) === key) || window.RNR_WORLD?.list.find(w => norm(w.name) === key)?.name;
      if (name) { const p = placeOf(name); countries.push({ id: '', name, flag: window.RNR_WORLD?.flag(name) || '', visited: true, lat: p[0], lng: p[1], continent: p[2] }); }
    });
    return countries;
  }

  function renderStats(countries) {
    const visited = countries.filter(c => c.visited);
    document.getElementById('rnrGlobeVisited').textContent = visited.length;
    document.getElementById('rnrGlobeContinents').textContent = new Set(visited.map(c => c.continent).filter(Boolean)).size;
    const wishes = countries.filter(c => c.wish);
    document.getElementById('rnrGlobeWish').textContent = wishes.length;
    document.getElementById('rnrGlobeWishList').innerHTML = wishes.map(c =>
      `<li><button type="button" data-globe-country="${esc(c.name)}">${c.flag ? `<span aria-hidden="true">${esc(c.flag)}</span>` : ''}${esc(c.name)}</button></li>`).join('');
    const lines = journeys();
    document.getElementById('rnrGlobeJourneys').innerHTML = lines.map(j => `<span>${esc(j.label || `${j.from.name} → ${j.to.name}`)}</span>`).join('');
    document.getElementById('rnrGlobeList').innerHTML = visited.map(c =>
      `<li><button type="button" data-globe-country="${esc(c.name)}">${c.flag ? `<span aria-hidden="true">${esc(c.flag)}</span>` : ''}${esc(c.name)}</button></li>`).join('');
  }

  function openCountry(name) {
    const country = (typeof travelData !== 'undefined' ? travelData : []).find(c => norm(c.name) === norm(name));
    if (!country) return;
    try {
      if (typeof archiveLevel !== 'undefined') {
        archiveLevel = 'regions'; selectedCountryId = country.id; selectedRegionId = null; selectedCityId = null;
        renderCountries();
      }
    } catch (error) { console.error(error); }
    document.getElementById('destinations')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  section.addEventListener('click', event => {
    const button = event.target.closest('[data-globe-country]');
    if (button) openCountry(button.dataset.globeCountry);
    if (event.target.closest('[data-globe-lists]') && document.body.classList.contains('admin-mode')) editLists();
  });
  function editLists() {
    const countries = collect().filter(c => c.id);
    const visited = new Set(countries.filter(c => c.visited).map(c => c.name));
    const wish = new Set(countries.filter(c => c.wish).map(c => c.name));
    window.RNR_OWNER_FORM?.({ eyebrow: 'MY WORLD', title: 'Visited and wishlist', note: 'Tick where you have been, and where you want to go next.',
      fields: [{ name: 'filter', label: 'Find a country', placeholder: 'Type to filter…', after: label => {
        const box = document.createElement('div');
        box.className = 'rnr-lists-grid';
        box.innerHTML = '<div class="rnr-lists-row is-head"><span>Country</span><span>Visited</span><span>Want to visit</span></div>' + countries.map(c => `
          <div class="rnr-lists-row" data-name="${esc(c.name.toLowerCase())}"><span>${esc(c.flag)} ${esc(c.name)}</span>
          <input type="checkbox" data-v="${esc(c.name)}" ${visited.has(c.name) ? 'checked' : ''} aria-label="Visited ${esc(c.name)}">
          <input type="checkbox" data-w="${esc(c.name)}" ${wish.has(c.name) ? 'checked' : ''} aria-label="Want to visit ${esc(c.name)}"></div>`).join('');
        label.after(box);
        label.querySelector('input').addEventListener('input', e => { const q = e.target.value.toLowerCase(); box.querySelectorAll('.rnr-lists-row[data-name]').forEach(r => { r.hidden = q && !r.dataset.name.includes(q); }); });
        box.addEventListener('change', e => { const n = e.target.dataset.v || e.target.dataset.w; if (e.target.checked) box.querySelector(e.target.dataset.v ? `[data-w="${CSS.escape(n)}"]` : `[data-v="${CSS.escape(n)}"]`).checked = false; });
      } }],
      save: () => {
        const box = document.querySelector('.rnr-lists-grid');
        const lists = { visited: [...box.querySelectorAll('[data-v]:checked')].map(i => i.dataset.v), wishlist: [...box.querySelectorAll('[data-w]:checked')].map(i => i.dataset.w) };
        // Countries ticked off here are no longer "visited" from older Admin buttons either.
        (typeof travelData !== 'undefined' ? travelData : []).forEach(c => { if (c.visited && !lists.visited.includes(c.name)) c.visited = false; });
        if (typeof saveData === 'function') saveData();
        try { localStorage.setItem(LISTS_KEY, JSON.stringify(lists)); } catch {}
        refreshData();
      } });
  }

  // ---------- 3D globe (online) ----------
  let globe = null;
  function loadLibrary() {
    return new Promise((resolve, reject) => {
      if (window.Globe) { resolve(window.Globe); return; }
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/globe.gl';
      script.async = true;
      const timer = setTimeout(() => reject(new Error('Globe library timed out')), 12000);
      script.onload = () => { clearTimeout(timer); window.Globe ? resolve(window.Globe) : reject(new Error('Globe missing')); };
      script.onerror = () => { clearTimeout(timer); reject(new Error('Globe library unavailable')); };
      document.head.append(script);
    });
  }
  const webglOK = () => { try { const c = document.createElement('canvas'); return Boolean(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } };

  async function build3D(countries) {
    const Globe = await loadLibrary();
    const points = countries.filter(c => typeof c.lat === 'number');
    stage.innerHTML = '';
    globe = Globe()(stage)
      .backgroundColor('rgba(0,0,0,0)')
      .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
      .showAtmosphere(true).atmosphereColor('#9fd3ff').atmosphereAltitude(0.2)
      .pointsData(points)
      .pointLat('lat').pointLng('lng')
      .pointColor(d => d.visited ? '#f3b765' : d.wish ? '#7cc4ff' : 'rgba(255,255,255,0.75)')
      .pointAltitude(d => d.visited ? 0.06 : d.wish ? 0.035 : 0.012)
      .pointRadius(d => d.visited ? 0.7 : d.wish ? 0.5 : 0.32)
      .pointLabel(d => `<div class="rnr-globe-tip">${esc(d.flag)} <b>${esc(d.name)}</b><br><small>${d.visited ? 'Visited' : d.wish ? 'Want to visit' : 'In my archive'}</small></div>`)
      .onPointClick(d => openCountry(d.name))
      .ringsData(points.filter(p => p.visited))
      .ringLat('lat').ringLng('lng')
      .ringColor(() => t => `rgba(243,183,101,${1 - t})`)
      .ringMaxRadius(4).ringPropagationSpeed(1.6).ringRepeatPeriod(1400)
      .arcsData(journeys())
      .arcStartLat(d => d.from.lat).arcStartLng(d => d.from.lng)
      .arcEndLat(d => d.to.lat).arcEndLng(d => d.to.lng)
      .arcColor(() => ['rgba(243,183,101,0.95)', 'rgba(233,120,90,0.95)'])
      .arcStroke(0.9).arcAltitudeAutoScale(0.45)
      .arcDashLength(0.45).arcDashGap(0.15).arcDashAnimateTime(2600)
      .arcLabel(d => `<div class="rnr-globe-tip"><b>${esc(d.label || `${d.from.name} → ${d.to.name}`)}</b></div>`)
      .labelsData(journeys().flatMap(j => [j.from, j.to]).filter((p, i, a) => a.findIndex(q => q.name === p.name) === i))
      .labelLat('lat').labelLng('lng').labelText('name')
      .labelSize(1.1).labelDotRadius(0.35).labelColor(() => 'rgba(255,255,255,0.95)').labelResolution(2);
    const controls = globe.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.45;
    controls.enableZoom = false;
    const home = points.find(p => p.visited) || { lat: 25, lng: 60 };
    globe.pointOfView({ lat: home.lat, lng: home.lng, altitude: 2.3 }, 0);
    const size = () => { globe.width(stage.clientWidth); globe.height(stage.clientHeight); };
    size();
    new ResizeObserver(size).observe(stage);
    // Pause rotation while the visitor is interacting, resume afterwards.
    let idle = 0;
    stage.addEventListener('pointerdown', () => { controls.autoRotate = false; clearTimeout(idle); });
    stage.addEventListener('pointerup', () => { clearTimeout(idle); idle = setTimeout(() => { controls.autoRotate = true; }, 4000); });
    section.classList.add('is-3d');
  }

  // ---------- Built-in globe (offline fallback) ----------
  let points2D = null;
  function build2D(countries) {
    stage.innerHTML = '<canvas class="rnr-globe-canvas"></canvas>';
    const canvas = stage.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    points2D = countries.filter(c => typeof c.lat === 'number');
    const first = points2D.find(p => p.visited);
    let lon0 = first ? first.lng : 60, lat0 = 20, dragging = null, last = performance.now();
    const rad = Math.PI / 180;
    function project(lat, lng, r, cx, cy) {
      const phi = lat * rad, lam = (lng - lon0) * rad, phi0 = lat0 * rad;
      const cosc = Math.sin(phi0) * Math.sin(phi) + Math.cos(phi0) * Math.cos(phi) * Math.cos(lam);
      return { x: cx + r * Math.cos(phi) * Math.sin(lam), y: cy - r * (Math.cos(phi0) * Math.sin(phi) - Math.sin(phi0) * Math.cos(phi) * Math.cos(lam)), front: cosc > 0 };
    }
    function draw(now) {
      if (section.classList.contains('rnr-off')) { last = now; if (stage.isConnected) requestAnimationFrame(draw); return; }
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const w = stage.clientWidth, h = stage.clientHeight;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      if (!dragging) lon0 -= (now - last) * 0.006;
      last = now;
      const r = Math.min(w, h) * 0.42, cx = w / 2, cy = h / 2;
      const glow = ctx.createRadialGradient(cx, cy, r * 0.9, cx, cy, r * 1.18);
      glow.addColorStop(0, 'rgba(159,211,255,.35)'); glow.addColorStop(1, 'rgba(159,211,255,0)');
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, r * 1.18, 0, Math.PI * 2); ctx.fill();
      const sea = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.1, cx, cy, r);
      sea.addColorStop(0, '#2c7a8c'); sea.addColorStop(1, '#0d2c40');
      ctx.fillStyle = sea; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 1;
      for (let lat = -60; lat <= 60; lat += 30) { ctx.beginPath(); let started = false; for (let lng = -180; lng <= 180; lng += 4) { const p = project(lat, lng, r, cx, cy); if (p.front) { started ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); started = true; } else started = false; } ctx.stroke(); }
      for (let lng = -180; lng < 180; lng += 30) { ctx.beginPath(); let started = false; for (let lat = -90; lat <= 90; lat += 4) { const p = project(lat, lng, r, cx, cy); if (p.front) { started ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); started = true; } else started = false; } ctx.stroke(); }
      const pulse = (now % 1600) / 1600;
      // Journey lines (great-circle), drawn with a moving dash.
      journeys().forEach(j => {
        const a = [j.from.lat * rad, j.from.lng * rad], b = [j.to.lat * rad, j.to.lng * rad];
        const d = 2 * Math.asin(Math.sqrt(Math.sin((b[0] - a[0]) / 2) ** 2 + Math.cos(a[0]) * Math.cos(b[0]) * Math.sin((b[1] - a[1]) / 2) ** 2));
        if (!d) return;
        ctx.save(); ctx.setLineDash([10, 7]); ctx.lineDashOffset = -(now / 40) % 17;
        ctx.strokeStyle = 'rgba(243,183,101,.95)'; ctx.lineWidth = 2.4; ctx.beginPath();
        let started = false;
        for (let k = 0; k <= 64; k += 1) {
          const f = k / 64, A = Math.sin((1 - f) * d) / Math.sin(d), B = Math.sin(f * d) / Math.sin(d);
          const x = A * Math.cos(a[0]) * Math.cos(a[1]) + B * Math.cos(b[0]) * Math.cos(b[1]);
          const y = A * Math.cos(a[0]) * Math.sin(a[1]) + B * Math.cos(b[0]) * Math.sin(b[1]);
          const z = A * Math.sin(a[0]) + B * Math.sin(b[0]);
          const p = project(Math.atan2(z, Math.sqrt(x * x + y * y)) / rad, Math.atan2(y, x) / rad, r * (1 + 0.12 * Math.sin(Math.PI * f)), cx, cy);
          if (p.front) { started ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); started = true; } else started = false;
        }
        ctx.stroke(); ctx.restore();
        [j.from, j.to].forEach(pt => {
          const q = project(pt.lat, pt.lng, r, cx, cy);
          if (!q.front) return;
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(q.x, q.y, 3.2, 0, Math.PI * 2); ctx.fill();
        });
      });
      points2D.forEach(p => {
        const q = project(p.lat, p.lng, r, cx, cy);
        if (!q.front) return;
        if (p.visited) {
          ctx.strokeStyle = `rgba(243,183,101,${1 - pulse})`; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(q.x, q.y, 5 + pulse * 14, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = '#f3b765'; ctx.beginPath(); ctx.arc(q.x, q.y, 5, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.font = '600 12px -apple-system, Segoe UI, Helvetica, Arial, sans-serif'; ctx.fillText(p.name, q.x + 9, q.y + 4);
        } else if (p.wish) {
          ctx.fillStyle = '#7cc4ff'; ctx.beginPath(); ctx.arc(q.x, q.y, 4, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(207,232,255,.95)'; ctx.font = '600 11px -apple-system, Segoe UI, Helvetica, Arial, sans-serif'; ctx.fillText(p.name, q.x + 7, q.y + 4);
        } else {
          ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(q.x, q.y, 2.2, 0, Math.PI * 2); ctx.fill();
        }
      });
      if (stage.isConnected) requestAnimationFrame(draw);
    }
    canvas.addEventListener('pointerdown', e => { dragging = { x: e.clientX, y: e.clientY, lon: lon0, lat: lat0 }; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', e => { if (!dragging) return; lon0 = dragging.lon - (e.clientX - dragging.x) * 0.4; lat0 = Math.max(-60, Math.min(60, dragging.lat + (e.clientY - dragging.y) * 0.3)); });
    const stop = () => { dragging = null; };
    canvas.addEventListener('pointerup', stop); canvas.addEventListener('pointercancel', stop);
    requestAnimationFrame(draw);
    section.classList.add('is-2d');
  }

  // ---------- Start when the Travels page is first shown ----------
  let started = false;
  async function start() {
    if (started || section.classList.contains('rnr-off') || !stage.clientWidth) return;
    started = true;
    const countries = collect();
    renderStats(countries);
    if (navigator.onLine && webglOK()) {
      try { await build3D(countries); return; }
      catch (error) { console.warn('3D globe unavailable, using the built-in globe:', error.message); }
    }
    build2D(countries);
  }
  function refreshData() {
    const countries = collect();
    renderStats(countries);
    const points = countries.filter(c => typeof c.lat === 'number');
    if (globe) globe.pointsData(points).ringsData(points.filter(p => p.visited));
    if (points2D) points2D = points;
    dispatchEvent(new CustomEvent('rnr:globe-changed'));
  }
  window.RNR_GLOBE = { countries: collect, openCountry, refresh: refreshData };
  renderStats(collect());
  new MutationObserver(() => start()).observe(section, { attributes: true, attributeFilter: ['class'] });
  addEventListener('resize', () => start(), { passive: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(start, 50), { once: true }); else setTimeout(start, 50);
  // Keep the numbers in sync when the owner marks a country as visited.
  document.addEventListener('click', event => { if (event.target.closest('[data-jt-visited]')) setTimeout(refreshData, 300); });
})();

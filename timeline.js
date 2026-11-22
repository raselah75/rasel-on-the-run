/* =====================================================================
   RASEL ON THE RUN — TIMELINE + YEAR IN TRAVELS
   Timeline page: one box per year (2028 → 2014). Photos are never shown on
   the page itself — open a year's box to see its photos, videos and stories
   by month, the Year in travels card, the recap and the year card.
   Admin: "＋ Choose photos" inside a year box adds photos to that year
   (pick the month, or "Not sure" → "Sometime in <year>").
   Year in travels: totals for the chosen year and a downloadable card
   (1080×1350 image for Instagram/Facebook/WhatsApp).
   Dates: photo date (camera or set by you), video date, story date.
   ===================================================================== */
(() => {
  'use strict';
  const main = document.querySelector('main');
  if (!main || document.getElementById('rnrTimeline')) return;
  const bn = () => document.documentElement.lang === 'bn';
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = n => (bn() ? String(n).replace(/\d/g, x => '০১২৩৪৫৬৭৮৯'[x]) : String(n));
  const T = (en, b) => (bn() ? b : en);

  const FIRST_YEAR = 2014, LAST_YEAR = 2028;
  const isAdmin = () => document.body.classList.contains('admin-mode');
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const section = document.createElement('section');
  section.id = 'rnrTimeline';
  section.className = 'section rnr-tl-section has-items';
  section.innerHTML = `
    <div class="rnr-tl-years" hidden></div>
    <div class="rnr-tl-boxes" role="list" aria-label="Years"></div>
    <div class="rnr-tl-open" hidden>
      <button type="button" class="rnr-tl-back" data-tl-back>← All years</button>
      <div class="rnr-tl-summary"></div>
      <div class="rnr-tl-add" hidden></div>
      <div class="rnr-tl-months"></div>
    </div>`;
  main.append(section);

  let data = { photos: [], films: [], stories: [] };
  let year = null;      // the year shown inside its open box (null = all boxes)

  const monthKey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  function collect() {
    const items = [];
    data.photos.forEach(p => { const d = window.RNR_GALLERY?.dateOf?.(p)?.date; if (d && !Number.isNaN(d.getTime())) items.push({ type: 'photo', date: d, ref: p }); });
    data.films.forEach(f => { if (f.date) items.push({ type: 'video', date: new Date(`${f.date}T12:00:00`), ref: f }); });
    data.stories.forEach(s => { if (s.date) items.push({ type: 'story', date: new Date(`${s.date}T12:00:00`), ref: s }); });
    return items.sort((a, b) => b.date - a.date);
  }

  async function load() {
    try { data.photos = window.RNR_GALLERY?.allPhotos ? (await window.RNR_GALLERY.allPhotos()).filter(p => p.blob) : []; } catch { data.photos = []; }
    data.films = window.RNR_VIDEOS?.all ? window.RNR_VIDEOS.all() : [];
    data.stories = window.RNR_STORIES?.all ? window.RNR_STORIES.all() : [];
    render();
  }

  function placesOf(items) {
    const cities = new Map(), countries = new Set();
    items.filter(i => i.type === 'photo').forEach(i => {
      const c = travelData.find(x => x.id === i.ref.countryId);
      if (c) countries.add(c.name);
      const r = c?.regions?.find(x => x.id === i.ref.regionId);
      const city = r?.cities?.find(x => x.id === i.ref.cityId);
      if (city) cities.set(city.name, (cities.get(city.name) || 0) + 1);
    });
    return { cities, countries };
  }
  const plural = (n, one, many) => `${num(n)} ${n === 1 ? one : many}`;

  function render() {
    const items = collect();
    const now = new Date().getFullYear();
    const lo = Math.min(FIRST_YEAR, ...items.map(i => i.date.getFullYear()));
    const hi = Math.max(LAST_YEAR, ...items.map(i => i.date.getFullYear()));
    const all = []; for (let y = hi; y >= lo; y -= 1) all.push(y);
    const boxes = section.querySelector('.rnr-tl-boxes');
    const open = section.querySelector('.rnr-tl-open');
    boxes.hidden = year !== null;
    open.hidden = year === null;
    // ---- all years: one box per year, no photos outside the boxes ----
    if (year === null) {
      section.querySelector('.rnr-tl-years').innerHTML = '';
      boxes.innerHTML = all.map(y => {
        const inY = items.filter(i => i.date.getFullYear() === y);
        const c = t => inY.filter(i => i.type === t).length;
        const { countries } = placesOf(inY);
        const parts = [c('photo') && plural(c('photo'), 'photo', 'photos'), c('video') && plural(c('video'), 'video', 'videos'), c('story') && plural(c('story'), 'story', 'stories')].filter(Boolean);
        const tag = y === now ? '<span class="rnr-tl-tag is-now">This year</span>' : y > now ? '<span class="rnr-tl-tag is-future">Coming up</span>' : '';
        const empty = !inY.length;
        return `<div class="rnr-tl-box${empty ? ' is-empty' : ''}${y === now ? ' is-now' : ''}" role="listitem">
          <button type="button" class="rnr-tl-box-open" data-tl-open="${y}" aria-label="${y}: ${parts.length ? parts.join(', ') : 'no memories yet'}">
            ${tag}<span class="rnr-tl-box-year">${num(y)}</span>
            <span class="rnr-tl-box-line">${parts.length ? parts.join(' · ') : (y > now ? 'Adventures ahead' : 'No memories yet')}</span>
            ${countries.size ? `<span class="rnr-tl-box-places">${[...countries].slice(0, 3).map(n => `${esc(window.RNR_WORLD?.flag?.(n) || '')} ${esc(n)}`).join(' · ')}</span>` : ''}
            <span class="rnr-tl-box-go" aria-hidden="true">${empty ? (isAdmin() ? '＋ Add' : '') : 'Open →'}</span>
          </button></div>`;
      }).join('');
      window.RNR_PAGES?.refresh();
      return;
    }
    // ---- one year opened ----
    section.querySelector('.rnr-tl-years').innerHTML = `<button type="button" role="tab" aria-selected="true" data-year="${year}">${year}</button>`;
    const inYear = items.filter(i => i.date.getFullYear() === year);
    const { cities, countries } = placesOf(inYear);
    const count = t => inYear.filter(i => i.type === t).length;
    const top = [...cities.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([n]) => n);
    section.querySelector('.rnr-tl-summary').innerHTML = `
      <div class="rnr-year-card">
        <div><p class="eyebrow">YEAR IN TRAVELS</p><h2>${num(year)}</h2>${top.length ? `<p class="rnr-year-top">Most photographed: ${top.map(esc).join(' · ')}</p>` : ''}</div>
        <div class="rnr-year-stats">
          <div><strong>${num(count('photo'))}</strong><span>Photos</span></div>
          <div><strong>${num(count('video'))}</strong><span>Videos</span></div>
          <div><strong>${num(count('story'))}</strong><span>Stories</span></div>
          <div><strong>${num(cities.size)}</strong><span>Cities</span></div>
          <div><strong>${num(countries.size)}</strong><span>Countries</span></div>
        </div>
        ${inYear.length ? `<button type="button" class="rnr-year-share" data-year-card>Download year card</button><button type="button" class="rnr-owner-pill is-solid" data-photo-book data-year="${year}">📖 Photo book</button>` : ''}
      </div>`;
    const add = section.querySelector('.rnr-tl-add');
    add.hidden = !isAdmin();
    add.innerHTML = isAdmin() ? `<span class="rnr-tl-add-label">Add photos to ${year}</span>
      <label class="rnr-tl-add-month">Month <select data-tl-month><option value="">Not sure</option>${MONTHS.map((m, i) => `<option value="${i + 1}">${m}</option>`).join('')}</select></label>
      <button type="button" class="rnr-tl-add-btn" data-tl-add>＋ Choose photos</button>
      <small>Photos with a camera date from ${year} keep their own month.</small>` : '';
    const host = section.querySelector('.rnr-tl-months');
    host.innerHTML = '';
    if (!inYear.length) {
      host.innerHTML = `<div class="rnr-tl-empty"><p>No memories in ${year} yet.</p>${isAdmin() ? '<p>Use “＋ Choose photos” above to add some.</p>' : ''}</div>`;
      window.RNR_PAGES?.refresh();
      return;
    }
    // Months (photos with only a year go to "Sometime in <year>")
    const months = new Map();
    inYear.forEach(i => { const k = i.type === 'photo' && i.ref.yearOnly ? 'any' : monthKey(i.date); if (!months.has(k)) months.set(k, []); months.get(k).push(i); });
    const keys = [...months.keys()].filter(k => k !== 'any').sort().reverse();
    if (months.has('any')) keys.push('any');
    for (const key of keys) {
      const list = months.get(key);
      const label = key === 'any' ? `Sometime in ${year}` : (() => { const [y, m] = key.split('-').map(Number); return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); })();
      const photos = list.filter(i => i.type === 'photo').map(i => i.ref);
      const films = list.filter(i => i.type === 'video').map(i => i.ref);
      const stories = list.filter(i => i.type === 'story').map(i => i.ref);
      const { cities: mc } = placesOf(list);
      const block = document.createElement('article');
      block.className = 'rnr-tl-month';
      block.innerHTML = `
        <div class="rnr-tl-head"><span class="rnr-tl-dot" aria-hidden="true"></span><div><h3>${esc(label)}</h3>
          <p>${[photos.length ? plural(photos.length, 'photo', 'photos') : '', films.length ? plural(films.length, 'video', 'videos') : '', stories.length ? plural(stories.length, 'story', 'stories') : '', [...mc.keys()].slice(0, 3).map(esc).join(', ')].filter(Boolean).join(' · ')}</p></div></div>
        <div class="rnr-tl-links">${films.map(f => `<button type="button" class="rnr-tl-chip is-video" data-tl-video="${esc(f.id)}">▶ ${esc(f.title || 'Video')}</button>`).join('')}${stories.map(s => `<button type="button" class="rnr-tl-chip is-story" data-story="${esc(s.id)}">✎ ${esc(s.title || 'Story')}</button>`).join('')}</div>
        <div class="rnr-tl-photos"></div>`;
      host.append(block);
      if (photos.length && window.RNR_GALLERY?.renderInto) window.RNR_GALLERY.renderInto(block.querySelector('.rnr-tl-photos'), photos, { general: true }, '', { plain: true, keepOrder: false });
    }
    window.RNR_PAGES?.refresh();
  }

  function openYear(y) {
    year = y;
    render();
    requestAnimationFrame(() => section.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }));
    section.querySelector('[data-tl-back]')?.focus({ preventScroll: true });
  }
  function closeYear() {
    const was = year;
    year = null;
    render();
    requestAnimationFrame(() => section.querySelector(`[data-tl-open="${was}"]`)?.focus({ preventScroll: false }));
  }
  function addToYear() {
    if (!isAdmin() || year === null) return;
    const month = section.querySelector('[data-tl-month]')?.value || '';
    const picker = document.createElement('input');
    picker.type = 'file'; picker.accept = 'image/*'; picker.multiple = true;
    picker.addEventListener('change', async () => {
      const files = [...(picker.files || [])];
      if (!files.length || !window.RNR_GALLERY?.addPhotos) return;
      const n = await window.RNR_GALLERY.addPhotos(files, { general: true, year, month: month ? Number(month) : null });
      if (n) window.dispatchEvent(new CustomEvent('rnr:photos-changed'));
      load();
    });
    picker.click();
  }

  section.addEventListener('click', e => {
    const o = e.target.closest('[data-tl-open]');
    if (o) { openYear(Number(o.dataset.tlOpen)); return; }
    if (e.target.closest('[data-tl-back]')) { closeYear(); return; }
    if (e.target.closest('[data-tl-add]')) { addToYear(); return; }
    if (e.target.closest('[data-year-card]')) yearCard();
    const v = e.target.closest('[data-tl-video]');
    if (v) window.RNR_VIDEOS?.play(v.dataset.tlVideo);
  });
  addEventListener('keydown', e => { if (e.key === 'Escape' && year !== null && !section.classList.contains('rnr-off') && ![...document.querySelectorAll('.rnr-viewer.is-open, [role=dialog][aria-modal=true]')].some(d => !d.hidden && d.getClientRects().length)) closeYear(); });
  // Opening the Timeline page always starts at the year boxes.
  let wasOff = section.classList.contains('rnr-off');
  new MutationObserver(() => { const off = section.classList.contains('rnr-off'); if (off && !wasOff) year = null; wasOff = off; }).observe(section, { attributes: true, attributeFilter: ['class'] });
  let lastAdmin = isAdmin();
  new MutationObserver(() => { if (isAdmin() !== lastAdmin) { lastAdmin = isAdmin(); if (!section.classList.contains('rnr-off')) render(); } }).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  // ---------- downloadable year card ----------
  async function yearCard() {
    const items = collect().filter(i => i.date.getFullYear() === year);
    const { cities, countries } = placesOf(items);
    const c = document.createElement('canvas'); c.width = 1080; c.height = 1350;
    const g = c.getContext('2d');
    const bg = g.createLinearGradient(0, 0, 1080, 1350); bg.addColorStop(0, '#0a1824'); bg.addColorStop(.55, '#17384c'); bg.addColorStop(1, '#1d6b74');
    g.fillStyle = bg; g.fillRect(0, 0, 1080, 1350);
    for (let i = 0; i < 90; i += 1) { g.fillStyle = `rgba(255,255,255,${Math.random() * .6})`; g.beginPath(); g.arc(Math.random() * 1080, Math.random() * 700, Math.random() * 1.8, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.moveTo(0, 1350); g.lineTo(0, 1120); g.lineTo(260, 960); g.lineTo(470, 1110); g.lineTo(700, 930); g.lineTo(1080, 1150); g.lineTo(1080, 1350); g.fill();
    const font = (w, s) => `${w} ${s}px -apple-system, "Segoe UI", "Noto Sans Bengali", Helvetica, Arial, sans-serif`;
    try {
      const svg = typeof window.RNR_LOGO_SVG === 'function' ? window.RNR_LOGO_SVG().replace('class="rnr-logo"', 'xmlns="http://www.w3.org/2000/svg" width="128" height="128"') : '';
      if (svg) { const img = new Image(); img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`; await img.decode(); g.drawImage(img, 90, 90, 128, 128); }
    } catch {}
    g.fillStyle = '#f3b765'; g.font = font(700, 30); g.fillText(T('YEAR IN TRAVELS', 'বছরের ভ্রমণ'), 90, 300);
    g.fillStyle = '#fff'; g.font = font(800, 220); g.fillText(num(year), 80, 500);
    const stats = [[items.filter(i => i.type === 'photo').length, T('Photos', 'ছবি')], [items.filter(i => i.type === 'video').length, T('Videos', 'ভিডিও')], [cities.size, T('Cities', 'শহর')], [countries.size, T('Countries', 'দেশ')]];
    stats.forEach(([n, l], i) => {
      const x = 90 + (i % 2) * 470, y = 600 + Math.floor(i / 2) * 200;
      g.fillStyle = 'rgba(255,255,255,.08)'; roundRect(g, x, y, 430, 170, 28); g.fill();
      g.fillStyle = '#f3b765'; g.font = font(800, 90); g.fillText(num(n), x + 34, y + 105);
      g.fillStyle = 'rgba(255,255,255,.85)'; g.font = font(600, 30); g.fillText(l, x + 36, y + 148);
    });
    const top = [...cities.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([n]) => n).join(' · ');
    if (top) { g.fillStyle = '#fff'; g.font = font(600, 34); g.fillText(top.slice(0, 48), 90, 1050); }
    g.fillStyle = '#fff'; g.font = font(800, 44); g.fillText('Rasel On the Run', 90, 1250);
    g.fillStyle = '#f3b765'; g.font = font(600, 24); g.fillText(T('EVERY JOURNEY TELLS A STORY', 'প্রতিটি যাত্রাই একটি গল্প'), 90, 1292);
    const blob = await new Promise(r => c.toBlob(r, 'image/png'));
    const file = new File([blob], `rasel-on-the-run-${year}.png`, { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] }) && matchMedia('(pointer: coarse)').matches) {
      try { await navigator.share({ files: [file], title: `${year} in travels` }); return; } catch (error) { if (error?.name === 'AbortError') return; }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = file.name; document.body.append(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

  // Render when the Timeline page is opened (and when content changes while it is open).
  const visible = () => !section.classList.contains('rnr-off');
  new MutationObserver(() => { if (visible()) load(); }).observe(section, { attributes: true, attributeFilter: ['class'] });
  ['rnr:photos-changed', 'rnr:viewer-closed', 'rnr:language'].forEach(ev => addEventListener(ev, () => { if (visible()) load(); }));
  window.RNR_TIMELINE = { reload: load, yearCard, open: openYear, close: closeYear };
  setTimeout(load, 1200);
})();

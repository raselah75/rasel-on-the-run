/* =====================================================================
   RASEL ON THE RUN — TIMELINE + YEAR IN TRAVELS
   Timeline page: photos, videos and stories grouped by month, newest first.
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

  const section = document.createElement('section');
  section.id = 'rnrTimeline';
  section.className = 'section rnr-tl-section';
  section.innerHTML = `
    <div class="rnr-tl-years" role="tablist" aria-label="Choose a year"></div>
    <div class="rnr-tl-summary"></div>
    <div class="rnr-tl-months"></div>`;
  main.append(section);

  let data = { photos: [], films: [], stories: [] };
  let year = null;

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

  function render() {
    const items = collect();
    const years = [...new Set(items.map(i => i.date.getFullYear()))].sort((a, b) => b - a);
    section.classList.toggle('has-items', items.length > 0);
    if (!years.length) { section.querySelector('.rnr-tl-years').innerHTML = ''; section.querySelector('.rnr-tl-summary').innerHTML = ''; section.querySelector('.rnr-tl-months').innerHTML = ''; window.RNR_PAGES?.refresh(); return; }
    if (!years.includes(year)) {
      const withPhotos = years.find(y => items.some(i => i.type === 'photo' && i.date.getFullYear() === y));
      year = withPhotos ?? years[0];
    }
    section.querySelector('.rnr-tl-years').innerHTML = years.map(y => `<button type="button" role="tab" aria-selected="${y === year}" data-year="${y}">${num(y)}</button>`).join('');
    const inYear = items.filter(i => i.date.getFullYear() === year);
    const { cities, countries } = placesOf(inYear);
    const count = t => inYear.filter(i => i.type === t).length;
    const top = [...cities.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([n]) => n);
    section.querySelector('.rnr-tl-summary').innerHTML = `
      <div class="rnr-year-card">
        <div><p class="eyebrow">${T('YEAR IN TRAVELS', 'বছরের ভ্রমণ')}</p><h2>${num(year)}</h2>${top.length ? `<p class="rnr-year-top">${T('Most photographed', 'সবচেয়ে বেশি ছবি')}: ${top.map(esc).join(' · ')}</p>` : ''}</div>
        <div class="rnr-year-stats">
          <div><strong>${num(count('photo'))}</strong><span>${T('Photos', 'ছবি')}</span></div>
          <div><strong>${num(count('video'))}</strong><span>${T('Videos', 'ভিডিও')}</span></div>
          <div><strong>${num(count('story'))}</strong><span>${T('Stories', 'গল্প')}</span></div>
          <div><strong>${num(cities.size)}</strong><span>${T('Cities', 'শহর')}</span></div>
          <div><strong>${num(countries.size)}</strong><span>${T('Countries', 'দেশ')}</span></div>
        </div>
        <button type="button" class="rnr-year-share" data-year-card>${T('Download year card', 'বছরের কার্ড ডাউনলোড')}</button><button type="button" class="rnr-owner-pill is-solid" data-photo-book data-year="${year}">📖 Photo book</button>
      </div>`;
    // Months
    const months = new Map();
    inYear.forEach(i => { const k = monthKey(i.date); if (!months.has(k)) months.set(k, []); months.get(k).push(i); });
    const host = section.querySelector('.rnr-tl-months');
    host.innerHTML = '';
    for (const [key, list] of months) {
      const [y, m] = key.split('-').map(Number);
      const label = new Date(y, m - 1, 1).toLocaleDateString(bn() ? 'bn-BD' : 'en-US', { month: 'long', year: 'numeric' });
      const photos = list.filter(i => i.type === 'photo').map(i => i.ref);
      const films = list.filter(i => i.type === 'video').map(i => i.ref);
      const stories = list.filter(i => i.type === 'story').map(i => i.ref);
      const { cities: mc } = placesOf(list);
      const block = document.createElement('article');
      block.className = 'rnr-tl-month';
      block.innerHTML = `
        <div class="rnr-tl-head"><span class="rnr-tl-dot" aria-hidden="true"></span><div><h3>${esc(label)}</h3>
          <p>${[photos.length ? `${num(photos.length)} ${T(photos.length === 1 ? 'photo' : 'photos', 'ছবি')}` : '', films.length ? `${num(films.length)} ${T(films.length === 1 ? 'video' : 'videos', 'ভিডিও')}` : '', stories.length ? `${num(stories.length)} ${T(stories.length === 1 ? 'story' : 'stories', 'গল্প')}` : '', [...mc.keys()].slice(0, 4).map(esc).join(', ')].filter(Boolean).join(' · ')}</p></div></div>
        <div class="rnr-tl-links">${films.map(f => `<button type="button" class="rnr-tl-chip is-video" data-tl-video="${esc(f.id)}">▶ ${esc(f.title || T('Video', 'ভিডিও'))}</button>`).join('')}${stories.map(s => `<button type="button" class="rnr-tl-chip is-story" data-story="${esc(s.id)}">✎ ${esc(s.title || T('Story', 'গল্প'))}</button>`).join('')}</div>
        <div class="rnr-tl-photos"></div>`;
      host.append(block);
      if (photos.length && window.RNR_GALLERY?.renderInto) window.RNR_GALLERY.renderInto(block.querySelector('.rnr-tl-photos'), photos, { general: true }, '', { plain: true, keepOrder: false });
    }
    window.RNR_PAGES?.refresh();
  }

  section.addEventListener('click', e => {
    const y = e.target.closest('[data-year]');
    if (y) { year = Number(y.dataset.year); render(); return; }
    if (e.target.closest('[data-year-card]')) yearCard();
    const v = e.target.closest('[data-tl-video]');
    if (v) window.RNR_VIDEOS?.play(v.dataset.tlVideo);
  });

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
  window.RNR_TIMELINE = { reload: load, yearCard };
  setTimeout(load, 1200);
})();

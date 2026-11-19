/* =====================================================================
   RASEL ON THE RUN — "MY YEAR IN TRAVEL" RECAP (Timeline page)
   A full-screen, story-style slideshow for any year with photos:
   numbers, new countries, top place, busiest month, best photos, food,
   and a goodbye slide with a downloadable picture (1080×1920).
   Tap right / left (or ← →) to move, hold to pause, ✕ or Esc to close.
   Built only from what is already on the site.
   ===================================================================== */
(() => {
  'use strict';
  const bn = () => document.documentElement.lang === 'bn';
  const T = (en, b) => (bn() ? b : en);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = n => (bn() ? String(n).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]) : String(n));
  const data = () => (typeof travelData !== 'undefined' && Array.isArray(travelData) ? travelData : []);
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SLIDE_MS = 5600;

  // ---------- Gather a year ----------
  async function gather(year) {
    let photos = [];
    try { photos = (await window.RNR_GALLERY.allPhotos()).filter(p => p.blob); } catch {}
    const when = p => window.RNR_GALLERY?.dateOf?.(p)?.date || null;
    const all = photos.map(p => ({ p, d: when(p) })).filter(x => x.d);
    const inYear = all.filter(x => x.d.getFullYear() === year).sort((a, b) => a.d - b.d);
    const before = all.filter(x => x.d.getFullYear() < year);
    const countryOf = id => data().find(c => c.id === id);
    const placeOf = p => { const c = countryOf(p.countryId); const r = c?.regions?.find(x => x.id === p.regionId); const t = r?.cities?.find(x => x.id === p.cityId); return { c, r, t }; };
    const countries = new Map(), cities = new Map();
    inYear.forEach(({ p }) => {
      const { c, r, t } = placeOf(p);
      if (c) countries.set(c.name, (countries.get(c.name) || 0) + 1);
      if (t || r) { const k = `${(t || r).name}|${c?.name || ''}`; const e = cities.get(k) || { name: (t || r).name, country: c?.name || '', n: 0, photo: p }; e.n += 1; if (p.highlight) e.photo = p; cities.set(k, e); }
    });
    const seenBefore = new Set(before.map(({ p }) => countryOf(p.countryId)?.name).filter(Boolean));
    const stamps = (() => { try { return JSON.parse(localStorage.getItem('raselOnTheRunPassportV1') || '{}'); } catch { return {}; } })();
    Object.entries(stamps).forEach(([n, v]) => { if (v?.date && Number(v.date.slice(0, 4)) < year) seenBefore.add(n); });
    const newCountries = [...countries.keys()].filter(n => !seenBefore.has(n) && n !== 'Bangladesh');
    Object.entries(stamps).forEach(([n, v]) => { if (v?.date && Number(v.date.slice(0, 4)) === year && !newCountries.includes(n) && n !== 'Bangladesh') newCountries.push(n); });
    const months = Array.from({ length: 12 }, (_, m) => inYear.filter(x => x.d.getMonth() === m).length);
    const busiest = months.indexOf(Math.max(...months));
    const topPlace = [...cities.values()].sort((a, b) => b.n - a.n)[0] || null;
    const stars = inYear.filter(x => x.p.highlight).map(x => x.p);
    const others = inYear.filter(x => !x.p.highlight).map(x => x.p);
    const step = Math.max(1, Math.floor(others.length / 6));
    const best = [...stars, ...others.filter((_, i) => i % step === 0)].slice(0, 6);
    const food = (window.RNR_FOOD?.all?.() || []).filter(d => String(d.date || '').startsWith(String(year)));
    const topFood = food.slice().sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0))[0] || null;
    const stories = (window.RNR_STORIES?.all?.() || []).filter(s => String(s.date || '').startsWith(String(year)));
    const films = (window.RNR_VIDEOS?.all?.() || []).filter(f => String(f.date || '').startsWith(String(year)));
    return { year, photos: inYear.map(x => x.p), countries, cities, newCountries, months, busiest, topPlace, best, food, topFood, stories, films, first: inYear[0]?.d, last: inYear[inYear.length - 1]?.d };
  }

  async function years() {
    let photos = [];
    try { photos = await window.RNR_GALLERY.allPhotos(); } catch {}
    const ys = new Set(photos.map(p => window.RNR_GALLERY?.dateOf?.(p)?.date?.getFullYear()).filter(Boolean));
    return [...ys].sort((a, b) => b - a);
  }

  // ---------- Player ----------
  const el = document.createElement('div');
  el.className = 'rnr-recap'; el.hidden = true;
  el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Year in travel');
  document.body.append(el);
  let slides = [], index = 0, timer = 0, started = 0, elapsed = 0, paused = false, urls = [], info = null;
  const url = blob => { const u = URL.createObjectURL(blob); urls.push(u); return u; };
  const flagOf = n => (typeof getCountryFlag === 'function' ? getCountryFlag(n) : '') || window.RNR_WORLD?.flag(n) || '🏳️';
  const monthName = (m, style = 'long') => new Date(2000, m, 1).toLocaleDateString(bn() ? 'bn-BD' : 'en-GB', { month: style });

  function build(r) {
    const s = [];
    const bgPhoto = r.best[0] ? url(r.best[0].blob) : '';
    s.push({ cls: 'is-intro', bg: bgPhoto, html: `<p class="rnr-rc-kicker">RASEL ON THE RUN</p><h2><span>${T('My', 'আমার')}</span> <b data-count="${r.year}">${num(r.year)}</b><span>${T('in travel', 'ভ্রমণের বছর')}</span></h2><p class="rnr-rc-sub">${T('A look back at the roads, places and moments.', 'পথ, জায়গা আর মুহূর্তগুলোর দিকে একবার ফিরে দেখা।')}</p>` });
    const stats = [[r.photos.length, T('photos', 'ছবি')], [r.cities.size, T('places', 'জায়গা')], [r.countries.size, T(r.countries.size === 1 ? 'country' : 'countries', 'দেশ')], [r.stories.length, T('stories', 'গল্প')], [r.films.length, T('videos', 'ভিডিও')], [r.food.length, T('dishes', 'খাবার')]].filter(x => x[0] > 0);
    s.push({ cls: 'is-numbers', html: `<p class="rnr-rc-kicker">${T('THE YEAR IN NUMBERS', 'সংখ্যায় বছরটা')}</p><ul class="rnr-rc-stats">${stats.map(([n, l], i) => `<li style="--i:${i}"><b data-count="${n}">0</b><span>${esc(l)}</span></li>`).join('')}</ul>` });
    if (r.newCountries.length) s.push({ cls: 'is-new', html: `<p class="rnr-rc-kicker">${T('FIRST TIME IN', 'প্রথমবার গেলাম')}</p><h3>${num(r.newCountries.length)} ${T(r.newCountries.length === 1 ? 'new country' : 'new countries', 'নতুন দেশ')}</h3><div class="rnr-rc-flags">${r.newCountries.slice(0, 8).map((n, i) => `<div style="--i:${i}"><span>${esc(flagOf(n))}</span><b data-no-translate>${esc(n)}</b>${window.RNR_PASSPORT?.stampHTML?.(n) ? `<i>${window.RNR_PASSPORT.stampHTML(n)}</i>` : ''}</div>`).join('')}</div>` });
    else if (r.countries.size) s.push({ cls: 'is-new', html: `<p class="rnr-rc-kicker">${T('WHERE I WAS', 'যেখানে ছিলাম')}</p><div class="rnr-rc-flags">${[...r.countries.keys()].slice(0, 8).map((n, i) => `<div style="--i:${i}"><span>${esc(flagOf(n))}</span><b data-no-translate>${esc(n)}</b></div>`).join('')}</div>` });
    if (r.topPlace) s.push({ cls: 'is-place', bg: url(r.topPlace.photo.blob), html: `<p class="rnr-rc-kicker">${T('MOST PHOTOGRAPHED PLACE', 'সবচেয়ে বেশি ছবি তুলেছি')}</p><h3 data-no-translate>${esc(r.topPlace.name)}</h3><p class="rnr-rc-sub" data-no-translate>${esc(flagOf(r.topPlace.country))} ${esc(r.topPlace.country)} · ${num(r.topPlace.n)} ${T(r.topPlace.n === 1 ? 'photo' : 'photos', 'ছবি')}</p>` });
    if (Math.max(...r.months) > 0) {
      const max = Math.max(...r.months);
      s.push({ cls: 'is-months', html: `<p class="rnr-rc-kicker">${T('BUSIEST MONTH', 'সবচেয়ে ব্যস্ত মাস')}</p><h3>${esc(monthName(r.busiest))}</h3><p class="rnr-rc-sub">${num(r.months[r.busiest])} ${T(r.months[r.busiest] === 1 ? 'photo that month' : 'photos that month', 'ছবি সেই মাসে')}</p><div class="rnr-rc-bars">${r.months.map((n, m) => `<div class="${m === r.busiest ? 'is-top' : ''}" style="--h:${max ? Math.max(4, Math.round(n / max * 100)) : 4}%;--i:${m}"><i></i><span>${esc(monthName(m, 'narrow'))}</span></div>`).join('')}</div>` });
    }
    if (r.best.length) s.push({ cls: 'is-best', html: `<p class="rnr-rc-kicker">${T('BEST MOMENTS', 'সেরা মুহূর্ত')}</p><div class="rnr-rc-grid n${Math.min(r.best.length, 6)}">${r.best.map((p, i) => `<img src="${url(p.blob)}" alt="" style="--i:${i}" data-no-archive-watermark>`).join('')}</div>` });
    if (r.topFood) s.push({ cls: 'is-food', bg: r.topFood.photo instanceof Blob ? url(r.topFood.photo) : '', html: `<p class="rnr-rc-kicker">${T('TASTE OF THE YEAR', 'বছরের সেরা স্বাদ')}</p><h3 data-no-translate>${esc(r.topFood.name)}</h3><p class="rnr-rc-sub" data-no-translate>${esc([r.topFood.place, r.topFood.country].filter(Boolean).join(', '))}</p>${r.food.length > 1 ? `<p class="rnr-rc-sub">+ ${num(r.food.length - 1)} ${T('more dishes in my food diary', 'আরও খাবার ডায়েরিতে')}</p>` : ''}` });
    s.push({ cls: 'is-outro', bg: bgPhoto, html: `<p class="rnr-rc-kicker">${T('THANK YOU', 'ধন্যবাদ')}, ${num(r.year)}</p><h3>${T(`See you on the road in ${r.year + 1}`, `${num(r.year + 1)}-এ আবার পথে দেখা হবে`)}</h3><div class="rnr-rc-actions"><button type="button" data-rc-download>⬇ ${T('Save as picture', 'ছবি হিসেবে রাখুন')}</button><button type="button" data-rc-again>↺ ${T('Watch again', 'আবার দেখুন')}</button></div>` });
    return s;
  }

  function render() {
    el.innerHTML = `<div class="rnr-rc-bars-top">${slides.map((_, i) => `<span><i style="--p:${i < index ? 1 : 0}"></i></span>`).join('')}</div>
      <button type="button" class="rnr-rc-close" data-rc-close aria-label="${T('Close', 'বন্ধ করুন')}">✕</button>
      <div class="rnr-rc-stage">${slides.map((s, i) => `<section class="rnr-rc-slide ${s.cls}${i === index ? ' is-on' : ''}"${s.bg ? ` style="--bg:url('${s.bg}')"` : ''} aria-hidden="${i !== index}"><div class="rnr-rc-in">${s.html}</div></section>`).join('')}</div>
      <button type="button" class="rnr-rc-nav is-prev" data-rc-prev aria-label="${T('Previous', 'আগের')}"></button>
      <button type="button" class="rnr-rc-nav is-next" data-rc-next aria-label="${T('Next', 'পরের')}"></button>`;
  }
  function go(i) {
    index = Math.max(0, Math.min(slides.length - 1, i));
    el.classList.toggle('is-last', index === slides.length - 1);
    el.querySelectorAll('.rnr-rc-slide').forEach((s, k) => { s.classList.toggle('is-on', k === index); s.setAttribute('aria-hidden', k !== index); });
    el.querySelectorAll('.rnr-rc-bars-top i').forEach((b, k) => { b.style.setProperty('--p', k < index ? 1 : 0); });
    countUp(el.querySelectorAll('.rnr-rc-slide')[index]);
    elapsed = 0; started = performance.now(); tick();
  }
  function tick() {
    cancelAnimationFrame(timer);
    const bar = el.querySelectorAll('.rnr-rc-bars-top i')[index];
    const loop = now => {
      if (el.hidden) return;
      if (!paused) {
        const p = Math.min(1, (elapsed + now - started) / SLIDE_MS);
        bar?.style.setProperty('--p', p);
        if (p >= 1) { if (index < slides.length - 1) { go(index + 1); return; } return; }
      }
      timer = requestAnimationFrame(loop);
    };
    timer = requestAnimationFrame(loop);
  }
  function pause(on) {
    if (on === paused) return;
    if (on) { elapsed += performance.now() - started; } else { started = performance.now(); }
    paused = on;
    el.classList.toggle('is-paused', on);
  }
  function countUp(slide) {
    slide?.querySelectorAll('[data-count]').forEach(b => {
      const target = Number(b.dataset.count);
      if (reduce() || target > 5000 || target < 2) { b.textContent = num(target); return; }
      const t0 = performance.now(), dur = 1100;
      const step = now => { const k = Math.min(1, (now - t0) / dur); b.textContent = num(Math.round(target * (1 - Math.pow(1 - k, 3)))); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
  }

  async function open(year) {
    info = await gather(year);
    if (!info.photos.length) { alert(T(`No photos with a date in ${year} yet.`, `${num(year)} সালের তারিখসহ কোনো ছবি এখনো নেই।`)); return; }
    urls.forEach(u => URL.revokeObjectURL(u)); urls = [];
    slides = build(info); index = 0; paused = false;
    render();
    el.hidden = false;
    document.body.classList.add('rnr-modal-open');
    try { history.pushState({ ...(history.state || {}), rnrRecap: true }, '', location.href); } catch {}
    go(0);
    el.querySelector('.rnr-rc-close').focus();
  }
  function close(fromHistory) {
    if (el.hidden) return;
    cancelAnimationFrame(timer);
    el.hidden = true; document.body.classList.remove('rnr-modal-open');
    urls.forEach(u => URL.revokeObjectURL(u)); urls = [];
    if (!fromHistory && history.state?.rnrRecap) { try { history.back(); } catch {} }
  }
  addEventListener('popstate', () => { if (!el.hidden) close(true); });

  // Tap left/right, hold to pause, swipe down to close.
  let downAt = 0, downY = 0, holdTimer = 0, held = false, suppress = false, downActive = false;
  el.addEventListener('pointerdown', e => {
    downActive = false;
    if (e.target.closest('button:not(.rnr-rc-nav)')) return;
    downActive = true; downAt = Date.now(); downY = e.clientY; held = false;
    holdTimer = setTimeout(() => { held = true; pause(true); }, 220);
  });
  el.addEventListener('pointerup', e => {
    clearTimeout(holdTimer);
    if (!downActive) return;
    downActive = false;
    if (held) { pause(false); held = false; suppress = true; setTimeout(() => { suppress = false; }, 60); return; }
    if (e.clientY - downY > 90) close();
  });
  el.addEventListener('click', e => {
    if (suppress) return;
    if (e.target.closest('[data-rc-close]')) { close(); return; }
    if (e.target.closest('[data-rc-download]')) { download(); return; }
    if (e.target.closest('[data-rc-again]')) { go(0); return; }
    if (e.target.closest('[data-rc-next]')) { if (index < slides.length - 1) go(index + 1); return; }
    if (e.target.closest('[data-rc-prev]')) { go(index - 1); }
  });
  addEventListener('keydown', e => {
    if (el.hidden) return;
    if (e.key === 'Escape') { e.stopImmediatePropagation(); close(); }
    else if (e.key === 'ArrowRight') go(index + 1);
    else if (e.key === 'ArrowLeft') go(index - 1);
    else if (e.key === ' ') { e.preventDefault(); pause(!paused); }
  }, true);
  document.addEventListener('visibilitychange', () => { if (!el.hidden) pause(document.hidden); });

  // ---------- Downloadable picture (1080 × 1920) ----------
  async function download() {
    const r = info; if (!r) return;
    const c = document.createElement('canvas'); c.width = 1080; c.height = 1920;
    const g = c.getContext('2d');
    const bg = g.createLinearGradient(0, 0, 1080, 1920); bg.addColorStop(0, '#0a1824'); bg.addColorStop(.6, '#17384c'); bg.addColorStop(1, '#1d6b74');
    g.fillStyle = bg; g.fillRect(0, 0, 1080, 1920);
    const imgs = await Promise.all(r.best.slice(0, 4).map(p => createImageBitmap(p.blob).catch(() => null)));
    const cell = 470, gap = 20, x0 = (1080 - cell * 2 - gap) / 2, y0 = 560;
    imgs.forEach((im, i) => {
      if (!im) return;
      const x = x0 + (i % 2) * (cell + gap), y = y0 + Math.floor(i / 2) * (cell + gap);
      const s = Math.max(cell / im.width, cell / im.height), w = im.width * s, h = im.height * s;
      g.save(); g.beginPath(); g.roundRect ? g.roundRect(x, y, cell, cell, 28) : g.rect(x, y, cell, cell); g.clip();
      g.drawImage(im, x + (cell - w) / 2, y + (cell - h) / 2, w, h); g.restore();
    });
    const font = (w, s) => `${w} ${s}px "Inter", "Noto Sans Bengali", system-ui, sans-serif`;
    g.textAlign = 'center';
    g.fillStyle = '#f3b765'; g.font = font(800, 30); g.fillText('RASEL ON THE RUN', 540, 150);
    g.fillStyle = '#fff'; g.font = font(900, 190); g.fillText(num(r.year), 540, 350);
    g.font = font(700, 50); g.fillText(T('my year in travel', 'আমার ভ্রমণের বছর'), 540, 440);
    const stats = [[r.photos.length, T('photos', 'ছবি')], [r.cities.size, T('places', 'জায়গা')], [r.countries.size, T('countries', 'দেশ')]];
    stats.forEach(([n, l], i) => {
      const x = 180 + i * 360, y = 1600;
      g.fillStyle = '#fff'; g.font = font(900, 96); g.fillText(num(n), x, y);
      g.fillStyle = 'rgba(255,255,255,.7)'; g.font = font(700, 34); g.fillText(l, x, y + 56);
    });
    if (r.topPlace) { g.fillStyle = '#f3b765'; g.font = font(700, 36); g.fillText(`${T('Top place', 'সেরা জায়গা')}: ${r.topPlace.name}`, 540, 1760); }
    g.fillStyle = 'rgba(255,255,255,.55)'; g.font = font(600, 28); g.fillText(location.host || 'rasel-on-the-run', 540, 1860);
    c.toBlob(blob => {
      if (!blob) return;
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `rasel-on-the-run-${r.year}-recap.png`;
      document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 3000);
    }, 'image/png');
  }

  // ---------- Entry: "Play my year" on the Timeline year card ----------
  function addButton() {
    const card = document.querySelector('#rnrTimeline .rnr-year-card');
    if (!card || card.querySelector('[data-recap-play]')) return;
    const year = Number(document.querySelector('#rnrTimeline .rnr-tl-years [aria-selected="true"]')?.dataset.year);
    if (!year) return;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'rnr-recap-play'; b.dataset.recapPlay = year;
    b.innerHTML = `<span aria-hidden="true">▶</span> ${T(`Play my ${year} recap`, `আমার ${num(year)} রিক্যাপ দেখুন`)}`;
    card.prepend(b);
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-recap-play]');
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    open(Number(b.dataset.recapPlay));
  }, true);
  const tl = document.getElementById('rnrTimeline');
  if (tl) new MutationObserver(addButton).observe(tl, { childList: true, subtree: true });
  addButton();
  window.RNR_RECAP = { open, years, gather };
})();

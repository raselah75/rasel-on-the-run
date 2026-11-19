/* =====================================================================
   RASEL ON THE RUN — COUNTRY STORY (one beautiful page per country)
   Opens from: a passport stamp, the globe's visited list, search, and the
   "Country story" button on every country in Travel Destinations.
   Shows: cover, flag, name (English + Bangla), when I first arrived,
   numbers (photos, cities, months travelled), the passport stamp, a
   month-by-month timeline, the cities with photos, best photos, and the
   stories, food and plans that belong to this country.
   Everything is built from what is already on the site — nothing new to fill in.
   ===================================================================== */
(() => {
  'use strict';
  const bn = () => document.documentElement.lang === 'bn';
  const T = (en, b) => (bn() ? b : en);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = n => (bn() ? String(n).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]) : String(n));
  const fold = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const data = () => (typeof travelData !== 'undefined' && Array.isArray(travelData) ? travelData : []);
  let bnRegion = null; try { bnRegion = new Intl.DisplayNames(['bn'], { type: 'region' }); } catch {}
  const locale = () => (bn() ? 'bn-BD' : 'en-GB');
  const fmtDay = d => d.toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' });
  const fmtMonth = d => d.toLocaleDateString(locale(), { month: 'long', year: 'numeric' });

  const view = document.createElement('div');
  view.className = 'rnr-cs'; view.hidden = true;
  view.setAttribute('role', 'dialog'); view.setAttribute('aria-modal', 'true');
  document.body.append(view);
  let urls = [], current = null;
  const release = () => { urls.forEach(u => URL.revokeObjectURL(u)); urls = []; };
  const url = blob => { const u = URL.createObjectURL(blob); urls.push(u); return u; };

  async function open(name) {
    const country = data().find(c => fold(c.name) === fold(name));
    const w = window.RNR_WORLD?.find(name);
    if (!country && !w) return;
    const cname = country?.name || w.name;
    current = cname;
    const flag = (typeof getCountryFlag === 'function' ? getCountryFlag(cname) : '') || w?.flag || '';
    const bnName = w && bnRegion ? bnRegion.of(w.code) : '';
    const globe = (() => { try { return window.RNR_GLOBE?.countries() || []; } catch { return []; } })().find(c => c.name === cname);

    // Photos of this country, oldest → newest.
    let photos = [];
    try { photos = (await window.RNR_GALLERY.allPhotos()).filter(p => country && p.countryId === country.id && p.blob); } catch {}
    const when = p => window.RNR_GALLERY?.dateOf?.(p)?.date || null;
    photos.sort((a, b) => (when(a)?.getTime() || 9e15) - (when(b)?.getTime() || 9e15));
    const dated = photos.filter(p => when(p));
    const stampInfo = (() => { try { return JSON.parse(localStorage.getItem('raselOnTheRunPassportV1') || '{}')[cname] || {}; } catch { return {}; } })();
    const first = stampInfo.date ? new Date(`${stampInfo.date}T12:00:00`) : dated.length ? when(dated[0]) : null;
    const last = dated.length ? when(dated[dated.length - 1]) : null;

    // Places with photos.
    const cityMap = new Map();
    photos.forEach(p => {
      const region = country.regions?.find(r => r.id === p.regionId);
      const city = region?.cities?.find(c => c.id === p.cityId);
      const k = city ? `c:${city.id}` : region ? `r:${region.id}` : '';
      if (!k) return;
      const e = cityMap.get(k) || { name: city?.name || region.name, sub: city ? region.name : '', region, city, n: 0, cover: p };
      e.n += 1; if (p.highlight) e.cover = p; cityMap.set(k, e);
    });
    const places = [...cityMap.values()].sort((a, b) => b.n - a.n);
    const regionsWith = new Set(photos.map(p => p.regionId).filter(Boolean));

    // Month-by-month timeline.
    const months = new Map();
    dated.forEach(p => {
      const d = when(p); const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const e = months.get(k) || { d, n: 0, places: new Set() };
      e.n += 1;
      const region = country.regions?.find(r => r.id === p.regionId); const city = region?.cities?.find(c => c.id === p.cityId);
      if (city || region) e.places.add((city || region).name);
      months.set(k, e);
    });

    // Best photos: Best-shot stars first, then spread across the trip.
    const stars = photos.filter(p => p.highlight);
    const rest = photos.filter(p => !p.highlight);
    const step = Math.max(1, Math.floor(rest.length / 9));
    const best = [...stars, ...rest.filter((_, i) => i % step === 0)].slice(0, 9);
    const cover = stars[0] || photos[Math.floor(photos.length / 2)] || null;

    // Stories, food, plans for this country.
    const has = text => fold(text).includes(fold(cname)) || (country?.regions || []).some(r => fold(text).includes(fold(r.name)) && r.name.length > 3);
    const stories = (window.RNR_STORIES?.all?.() || []).filter(s => has(`${s.location || ''} ${s.title || ''}`));
    const food = (window.RNR_FOOD?.all?.() || []).filter(d => fold(d.country) === fold(cname) || has(d.place || ''));
    const plans = (window.RNR_PLAN?.items?.() || []).filter(p => has(`${p.place || ''} ${p.title || ''}`));

    const stamp = window.RNR_PASSPORT?.stampHTML?.(cname) || '';
    const stats = [
      [photos.length, T('photos', 'ছবি')],
      [places.filter(p => p.city).length || places.length, T('places', 'জায়গা')],
      [regionsWith.size, typeof pluralRegionLabelFor === 'function' ? T(pluralRegionLabelFor(cname).toLowerCase(), 'অঞ্চল') : T('regions', 'অঞ্চল')],
      [months.size, T(months.size === 1 ? 'month' : 'months', 'মাস')]
    ].filter(s => s[0] > 0);

    release();
    const coverUrl = cover ? url(cover.blob) : '';
    view.innerHTML = `
      <div class="rnr-cs-scroll">
        <div class="rnr-cs-hero"${coverUrl ? ` style="--cover:url('${coverUrl}')"` : ''}>
          <button type="button" class="rnr-cs-close" data-cs-close aria-label="${T('Close', 'বন্ধ করুন')}">✕</button>
          <div class="rnr-cs-hero-in">
            <span class="rnr-cs-flag" aria-hidden="true">${esc(flag)}</span>
            <p class="rnr-cs-eyebrow">${T('COUNTRY STORY', 'দেশের গল্প')}${w?.continent ? ` · ${esc(w.continent.toUpperCase())}` : ''}</p>
            <h2 data-no-translate>${esc(bn() && bnName ? bnName : cname)}</h2>
            ${bnName && !bn() ? `<p class="rnr-cs-bn" data-no-translate>${esc(bnName)}</p>` : bn() ? `<p class="rnr-cs-bn" data-no-translate>${esc(cname)}</p>` : ''}
            <p class="rnr-cs-when">${cname === 'Bangladesh' ? T('Home country', 'আমার দেশ') : first ? `${T('First arrived', 'প্রথম গিয়েছিলাম')} ${esc(fmtDay(first))}` : globe?.visited ? T('Visited', 'ঘুরে এসেছি') : globe?.wish ? T('On my wishlist', 'যাওয়ার ইচ্ছা আছে') : ''}${last && first && fmtMonth(last) !== fmtMonth(first) ? ` · ${T('last photos', 'শেষ ছবি')} ${esc(fmtMonth(last))}` : ''}</p>
          </div>
        </div>
        <div class="rnr-cs-body">
          ${stats.length || stamp ? `<div class="rnr-cs-top">
            ${stats.length ? `<ul class="rnr-cs-stats">${stats.map(([n, l]) => `<li><b>${num(n)}</b><span>${esc(l)}</span></li>`).join('')}</ul>` : ''}
            ${stamp ? `<div class="rnr-cs-stamp" aria-hidden="true">${stamp}</div>` : ''}
          </div>` : ''}
          ${best.length ? `<div class="rnr-cs-block"><h3>${T('Best photos', 'সেরা ছবি')}</h3><div class="rnr-cs-photos${best.length < 4 ? ' is-few' : ''}">${best.map((p, i) => `<button type="button" data-cs-photo="${i}"><img src="${url(p.blob)}" alt="${esc(p.caption || '')}" loading="lazy" data-no-archive-watermark></button>`).join('')}</div></div>` : ''}
          ${places.length ? `<div class="rnr-cs-block"><h3>${T('Places I went', 'যেসব জায়গায় গেছি')}</h3><div class="rnr-cs-places">${places.slice(0, 12).map((p, i) => `<button type="button" data-cs-place="${i}"><img src="${url(p.cover.blob)}" alt="" loading="lazy" data-no-archive-watermark><span><b data-no-translate>${esc(p.name)}</b><small data-no-translate>${esc(p.sub)}${p.sub ? ' · ' : ''}${num(p.n)} ${T(p.n === 1 ? 'photo' : 'photos', 'ছবি')}</small></span></button>`).join('')}</div></div>` : ''}
          ${months.size ? `<div class="rnr-cs-block"><h3>${T('Timeline', 'সময়রেখা')}</h3><ol class="rnr-cs-timeline">${[...months.values()].map(m => `<li><time>${esc(fmtMonth(m.d))}</time><p data-no-translate>${esc([...m.places].slice(0, 4).join(' · ') || cname)}</p><span>${num(m.n)} ${T(m.n === 1 ? 'photo' : 'photos', 'ছবি')}</span></li>`).join('')}</ol></div>` : ''}
          ${stories.length ? `<div class="rnr-cs-block"><h3>${T('Stories', 'গল্প')}</h3><div class="rnr-cs-list">${stories.map(s => `<button type="button" data-cs-story="${esc(s.id)}"><span>📖</span><b data-no-translate>${esc(s.title)}</b><small data-no-translate>${esc([s.location, s.date].filter(Boolean).join(' · '))}</small></button>`).join('')}</div></div>` : ''}
          ${food.length ? `<div class="rnr-cs-block"><h3>${T('What I ate', 'যা খেয়েছি')}</h3><div class="rnr-cs-list">${food.map(d => `<div><span>🍽️</span><b data-no-translate>${esc(d.name)}</b><small data-no-translate>${esc([d.place, d.note].filter(Boolean).join(' · ').slice(0, 120))}</small></div>`).join('')}</div></div>` : ''}
          ${plans.length ? `<div class="rnr-cs-block"><h3>${T('Plans here', 'এখানের পরিকল্পনা')}</h3><div class="rnr-cs-list">${plans.map(p => `<div><span>🧭</span><b data-no-translate>${esc(p.title)}</b><small data-no-translate>${esc([p.place, p.start].filter(Boolean).join(' · '))}</small></div>`).join('')}</div></div>` : ''}
          ${!photos.length && !stories.length && !food.length ? `<p class="rnr-cs-empty">${T('Photos and stories from this country will appear here.', 'এই দেশের ছবি আর গল্প এখানে দেখা যাবে।')}</p>` : ''}
          ${country ? `<div class="rnr-cs-actions"><button type="button" class="rnr-cs-all" data-cs-all>${T('Browse all photos', 'সব ছবি দেখুন')} →</button></div>` : ''}
        </div>
      </div>`;
    view._ctx = { country, best, places };
    if (view.hidden) {
      view.hidden = false;
      document.body.classList.add('rnr-modal-open');
      try { history.pushState({ ...(history.state || {}), rnrCountryStory: true }, '', location.href); } catch {}
    }
    view.querySelector('.rnr-cs-scroll').scrollTop = 0;
    view.querySelector('.rnr-cs-close').focus();
  }
  function close(fromHistory) {
    if (view.hidden) return;
    view.hidden = true; current = null;
    document.body.classList.remove('rnr-modal-open');
    release();
    if (!fromHistory && history.state?.rnrCountryStory) { try { history.back(); } catch {} }
  }
  addEventListener('popstate', () => { if (!view.hidden) close(true); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !view.hidden && !window.RNR_VIEWER?.isOpen?.() && sheetClosed()) close(); }, true);
  const sheetClosed = () => !document.querySelector('.rnr-owner-modal:not([hidden]), .rnr-app-sheet:not([hidden])');

  function goArchive(country, region, city) {
    close();
    try {
      window.RNR_PAGES?.show('travels');
      selectedCountryId = country.id; selectedRegionId = region?.id || null; selectedCityId = city?.id || null;
      archiveLevel = city ? 'photos' : region ? 'cities' : 'regions';
      renderCountries();
    } catch (error) { console.error(error); }
    setTimeout(() => document.getElementById('destinations')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  }
  view.addEventListener('click', e => {
    const ctx = view._ctx || {};
    if (e.target.closest('[data-cs-close]')) { close(); return; }
    const ph = e.target.closest('[data-cs-photo]');
    if (ph && window.RNR_VIEWER && window.RNR_GALLERY?.viewerItem) { window.RNR_VIEWER.open(ctx.best.map(p => window.RNR_GALLERY.viewerItem(p, {})), Number(ph.dataset.csPhoto)); return; }
    const pl = e.target.closest('[data-cs-place]');
    if (pl) { const p = ctx.places[Number(pl.dataset.csPlace)]; goArchive(ctx.country, p.region, p.city); return; }
    const st = e.target.closest('[data-cs-story]');
    if (st) { close(); window.RNR_PAGES?.show('stories'); setTimeout(() => window.RNR_STORIES?.open(st.dataset.csStory), 150); return; }
    if (e.target.closest('[data-cs-all]')) goArchive(ctx.country);
  });

  // ---------- Entry points ----------
  // Passport stamps and the globe's "visited" list open the story.
  document.addEventListener('click', e => {
    const s = e.target.closest('#rnrPassport [data-pp-open], #rnrGlobe .rnr-globe-list [data-globe-country]');
    if (!s || e.target.closest('[data-pp-edit]')) return;
    e.preventDefault(); e.stopImmediatePropagation();
    open(s.dataset.ppOpen || s.dataset.globeCountry);
  }, true);
  // A "Country story" button on each country in Travel Destinations.
  function addButton() {
    try {
      if (typeof archiveLevel === 'undefined' || archiveLevel !== 'regions') return;
      const head = document.querySelector('#countryList .archive-page-heading');
      const country = data().find(c => c.id === selectedCountryId);
      if (!head || !country || head.querySelector('.rnr-cs-open')) return;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'rnr-cs-open';
      b.innerHTML = `<span aria-hidden="true">📖</span> ${T(`${country.name} — my story`, `${country.name} — আমার গল্প`)}`;
      b.addEventListener('click', () => open(country.name));
      head.append(b);
    } catch {}
  }
  const prev = window.renderCountries || (typeof renderCountries === 'function' ? renderCountries : null);
  if (prev) {
    const wrapped = function (...args) { const r = prev.apply(this, args); addButton(); return r; };
    try { renderCountries = wrapped; } catch {}
    window.renderCountries = wrapped;
  }
  addEventListener('rnr:language', () => { if (current) open(current); });
  window.RNR_COUNTRY_STORY = { open, close };
})();

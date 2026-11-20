/* =====================================================================
   RASEL ON THE RUN — SMART SEARCH (⌕ Search, Ctrl/⌘ + K)
   One box finds everything, in English or Bangla:
   pages, countries (with Bangla names), divisions / states, cities,
   the 64 Bangladesh districts, stories, food, videos, trip routes,
   journey plans and study journey entries.
   Only public content is searched; owner tools are listed only in Admin mode.
   Keyboard: ↑ ↓ to move, Enter to open, Esc to close.
   ===================================================================== */
(() => {
  'use strict';
  const layer = document.getElementById('rnrSearchLayer');
  const input = document.getElementById('rnrSearchInput');
  const box = document.getElementById('rnrSearchResults');
  if (!layer || !input || !box) return;

  const bn = () => document.documentElement.lang === 'bn';
  const T = (en, b) => (bn() ? b : en);
  const isAdmin = () => document.body.classList.contains('admin-mode');
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fold = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’'`]/g, '').replace(/\s+/g, ' ').trim();
  const json = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } };
  let bnRegion = null;
  try { bnRegion = new Intl.DisplayNames(['bn'], { type: 'region' }); } catch {}

  const PAGES = [
    ['home', 'Home', 'হোম', '🏠'], ['travels', 'Travel Destinations', 'ভ্রমণের গন্তব্য', '🌍'], ['stories', 'Stories', 'গল্প', '📖'],
    ['timeline', 'Timeline', 'টাইমলাইন', '🗓️'], ['study', 'My Study Journey', 'আমার পড়াশোনার যাত্রা', '🎓'], ['plan', 'Journey Plan', 'যাত্রা পরিকল্পনা', '🧭'],
    ['videos', 'Videos', 'ভিডিও', '🎬'], ['about', 'About Me', 'আমার কথা', '👋']
  ];
  const SECTIONS = [
    ['rnrPassport', 'Passport stamps', 'পাসপোর্টের সিল', '🛂', 'passport stamp visa'], ['rnrDistricts', 'My Bangladesh – 64 districts', 'আমার বাংলাদেশ – ৬৪ জেলা', '🇧🇩', 'district map zila jela'],
    ['rnrGlobe', 'World globe', 'পৃথিবীর গ্লোব', '🌐', 'globe world map visited wishlist'], ['rnrTripRoutes', 'Trip routes', 'ভ্রমণের রুট', '✈️', 'route flight road trip'],
    ['rnrPhotoMap', 'Photo map', 'ছবির মানচিত্র', '📍', 'map pins'], ['rnrPanoramas', '360° views', '৩৬০° দৃশ্য', '🔭', 'panorama 360'],
    ['rnrFood', 'Food diary', 'খাবারের ডায়েরি', '🍽️', 'food dish eat restaurant'], ['contact', 'Contact', 'যোগাযোগ', '✉️', 'email message contact']
  ];

  // ---------- Build the index (fresh each time the box opens) ----------
  let index = [];
  async function build() {
    const out = [];
    const add = (type, title, sub, icon, words, go, rank = 0, names = '') => out.push({ type, title, sub, icon, key: fold(`${title} ${names} ${sub || ''} ${words || ''}`), tkey: fold(title), nkey: fold(`${title} ${names}`), go, rank });

    PAGES.forEach(([k, en, b, icon]) => add('page', T(en, b), T('Page', 'পাতা'), icon, k, () => window.RNR_PAGES?.show(k), 3, `${en} ${b}`));
    SECTIONS.forEach(([id, en, b, icon, words]) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (!isAdmin() && window.RNR_PAGES?.hasContent && !window.RNR_PAGES.hasContent(id)) return;
      add('page', T(en, b), T('Section', 'অংশ'), icon, words, () => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 2, `${en} ${b}`);
    });

    // Year recaps.
    try { (await (window.RNR_RECAP?.years?.() || [])).forEach(y => add('page', T(`My ${y} in travel`, `আমার ${y} ভ্রমণের বছর`), T('Year recap', 'বছরের রিক্যাপ'), '✨', `recap year wrapped ${y}`, () => window.RNR_RECAP.open(y), 1, `${y} recap রিক্যাপ`)); } catch {}

    // Countries, divisions / states and cities from the archive.
    const data = typeof travelData !== 'undefined' && Array.isArray(travelData) ? travelData : [];
    const globe = (() => { try { return window.RNR_GLOBE?.countries() || []; } catch { return []; } })();
    const visited = new Set(globe.filter(c => c.visited).map(c => c.name));
    let photoCity = new Map(), photoCountry = new Map();
    try {
      (await (window.RNR_GALLERY?.allPhotos?.() || [])).forEach(p => {
        if (p.cityId) photoCity.set(p.cityId, (photoCity.get(p.cityId) || 0) + 1);
        if (p.countryId) photoCountry.set(p.countryId, (photoCountry.get(p.countryId) || 0) + 1);
      });
    } catch {}
    const flagOf = n => (typeof getCountryFlag === 'function' ? getCountryFlag(n) : '') || window.RNR_WORLD?.flag(n) || '🏳️';
    const openArchive = (country, region, city) => {
      try {
        window.RNR_PAGES?.show('travels', { scroll: 'none' });
        selectedCountryId = country.id; selectedRegionId = region?.id || null; selectedCityId = city?.id || null;
        archiveLevel = city ? 'photos' : region ? 'cities' : 'regions';
        renderCountries();
      } catch (error) { console.error(error); }
      setTimeout(() => document.getElementById('destinations')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    };
    data.forEach(country => {
      const w = window.RNR_WORLD?.find(country.name);
      const bnName = w && bnRegion ? (bnRegion.of(w.code) || '') : '';
      const n = photoCountry.get(country.id) || 0;
      const sub = [visited.has(country.name) ? T('Visited', 'ঘুরে এসেছি') : T('Country', 'দেশ'), n ? `${n} ${T(n === 1 ? 'photo' : 'photos', 'ছবি')}` : ''].filter(Boolean).join(' · ');
      add('country', bn() && bnName ? bnName : country.name, sub, flagOf(country.name), '', () => (window.RNR_COUNTRY_STORY ? window.RNR_COUNTRY_STORY.open(country.name) : openArchive(country)), (visited.has(country.name) ? 2 : 0) + (n ? 1 : 0), `${country.name} ${bnName} ${(w?.alt || []).join(' ')}`);
      (country.regions || []).forEach(region => {
        add('place', region.name, `${typeof regionLabelFor === 'function' ? regionLabelFor(country.name) : ''} · ${flagOf(country.name)} ${country.name}`.replace(/^ · /, ''), '🗺️', `${country.name}`, () => openArchive(country, region), 0);
        (region.cities || []).forEach(city => {
          const c = photoCity.get(city.id) || 0;
          add('place', city.name, `${region.name}, ${country.name}${c ? ` · ${c} ${T(c === 1 ? 'photo' : 'photos', 'ছবি')}` : ''}`, '📍', `${region.name} ${country.name}`, () => openArchive(country, region, city), c ? 2 : 0);
        });
      });
    });

    // Bangladesh districts (with Bangla names).
    (window.RNR_DISTRICTS?.list?.() || []).forEach(d => add('place', T(d.name, d.bn), `${T(`District · ${d.division} Division`, `জেলা · ${d.divisionBn} বিভাগ`)}${d.visited ? ` · ${T('Visited', 'ঘুরে এসেছি')}` : ''}`, '🇧🇩',
      `district zila jela জেলা ${d.division}`, () => { window.RNR_PAGES?.show('travels', { scroll: 'none' }); window.RNR_DISTRICTS.select(d.name); }, d.visited ? 1 : 0, `${d.name} ${d.bn}`));

    // Stories, food, videos.
    (window.RNR_STORIES?.all?.() || []).forEach(s => s?.title && add('story', s.title, [s.location, s.date].filter(Boolean).join(' · ') || T('Story', 'গল্প'), '📖', `${s.story || ''}`.slice(0, 400), () => window.RNR_STORIES.open(s.id), 1));
    (window.RNR_FOOD?.all?.() || []).forEach(d => add('food', d.name, [d.place, d.country].filter(Boolean).join(', ') || T('Food diary', 'খাবারের ডায়েরি'), '🍽️', `${d.note || ''} food`, () => {
      window.RNR_PAGES?.show('stories', { scroll: 'none' });
      const card = [...document.querySelectorAll('#rnrFood .rnr-food-card')].find(c => c.querySelector('h3')?.textContent === d.name);
      (card || document.getElementById('rnrFood'))?.scrollIntoView({ behavior: 'smooth', block: 'center' }); flash(card);
    }, 1));
    (window.RNR_VIDEOS?.all?.() || []).forEach(f => f?.title && add('video', f.title, f.place || T('Video', 'ভিডিও'), '🎬', 'video film', () => { window.RNR_PAGES?.show('videos'); window.RNR_VIDEOS.play?.(f.id); }, 1));

    // Trip routes.
    (Array.isArray(json('raselOnTheRunTripRoutesV1')) ? json('raselOnTheRunTripRoutesV1') : []).forEach((t, i) => {
      const stops = (t.stops || []).map(s => (typeof s === 'string' ? s.split('|')[0] : s?.name || '')).filter(Boolean);
      if (t.title) add('route', t.title, stops.join(' → '), '✈️', `route ${stops.join(' ')}`, () => {
        window.RNR_PAGES?.show('travels', { scroll: 'none' });
        document.getElementById('rnrTripRoutes')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => document.querySelector(`#rnrTripRoutes [data-route-tab="${i}"]`)?.click(), 500);
      }, 1);
    });

    // Journey plans (public, text-only copy).
    (window.RNR_PLAN?.items?.() || []).forEach(p => add('plan', p.title, [p.place, p.start].filter(Boolean).join(' · ') || T('Journey plan', 'যাত্রা পরিকল্পনা'), '🧭', `${p.type} ${p.notes} plan trip`, () => {
      window.RNR_PAGES?.show('plan');
      setTimeout(() => { const card = [...document.querySelectorAll('.rnr-plan-card')].find(c => c.querySelector('h3')?.textContent === p.title); card?.scrollIntoView({ behavior: 'smooth', block: 'center' }); flash(card); }, 120);
    }, 1));

    // Study journey.
    (window.RNR_STUDY?.read?.() || []).forEach(s => s?.title && add('study', s.title, [s.institution, s.period].filter(Boolean).join(' · ') || T('Study journey', 'পড়াশোনার যাত্রা'), '🎓', `${s.level} ${s.story || ''}`.slice(0, 300), () => {
      window.RNR_PAGES?.show('study');
      setTimeout(() => { const el = [...document.querySelectorAll('.study-entry')].find(e => e.querySelector('h3')?.textContent === s.title); el?.scrollIntoView({ behavior: 'smooth', block: 'center' }); flash(el); }, 120);
    }, 1));

    index = out;
  }
  function flash(el) { if (!el) return; el.classList.add('rnr-search-flash'); setTimeout(() => el.classList.remove('rnr-search-flash'), 1800); }

  // ---------- Search & show ----------
  const GROUPS = { page: ['Pages', 'পাতা'], country: ['Countries', 'দেশ'], place: ['Places', 'জায়গা'], story: ['Stories', 'গল্প'], food: ['Food', 'খাবার'], video: ['Videos', 'ভিডিও'], route: ['Trip routes', 'রুট'], plan: ['Journey plans', 'পরিকল্পনা'], study: ['Study journey', 'পড়াশোনা'] };
  let shown = [], active = 0;
  function score(item, q, words) {
    if (!words.every(w => item.key.includes(w))) return -1;
    const named = item.nkey.includes(words[0]);
    // A place or country must match by its own name; the rest may match their text.
    if (!named && (item.type === 'place' || item.type === 'country' || item.type === 'page') && words.length === 1) return -1;
    let s = item.rank;
    const names = item.nkey.split(/[\s,()-]+/);
    if (item.tkey === q || names.includes(q)) s += 100; else if (item.tkey.startsWith(q)) s += 60; else if (names.some(w => w.startsWith(words[0]))) s += 35; else if (named) s += 20; else s -= 10;
    return s;
  }
  function show(qRaw) {
    const q = fold(qRaw);
    let list;
    if (!q) {
      // Starting view: pages + countries visited.
      list = index.filter(i => i.type === 'page' && PAGES.some(p => p[3] === i.icon)).concat(index.filter(i => i.type === 'country' && i.rank >= 2).slice(0, 8));
    } else {
      const words = q.split(' ');
      list = index.map(i => [i, score(i, q, words)]).filter(([, s]) => s >= 0).sort((a, b) => b[1] - a[1]).map(([i]) => i);
      // Keep each group short so results stay readable.
      const per = {}; list = list.filter(i => (per[i.type] = (per[i.type] || 0) + 1) <= (i.type === 'place' ? 8 : 6)).slice(0, 40);
    }
    shown = list; active = 0;
    if (!list.length) {
      box.innerHTML = `<div class="rnr-empty rnr-sr-none">${T(`Nothing found for “${esc(qRaw.trim())}”. Try a country, a city or a story title.`, `“${esc(qRaw.trim())}” দিয়ে কিছু পাওয়া যায়নি। দেশ, শহর বা গল্পের নাম লিখে দেখুন।`)}</div>`;
      return;
    }
    // Groups appear in the order of their best match, so Enter opens the best result.
    const order = q ? [...new Set(list.map(i => i.type))] : Object.keys(GROUPS);
    const groups = order.map(g => [g, list.filter(i => i.type === g)]).filter(([, l]) => l.length);
    shown = groups.flatMap(([, l]) => l);
    let n = 0;
    box.innerHTML = groups.map(([g, l]) => `<p class="rnr-sr-group">${esc(T(...GROUPS[g]))}</p>` + l.map(i => `
      <button type="button" class="rnr-sr-item${n === 0 ? ' is-active' : ''}" data-sr="${n++}">
        <span class="rnr-sr-icon" aria-hidden="true">${esc(i.icon)}</span>
        <span class="rnr-sr-text"><b>${mark(i.title, q)}</b>${i.sub ? `<small>${esc(i.sub)}</small>` : ''}</span>
        <span class="rnr-sr-go" aria-hidden="true">↗</span>
      </button>`).join('')).join('');
  }
  function mark(text, q) {
    const t = String(text); if (!q) return esc(t);
    const i = fold(t).indexOf(q.split(' ')[0]);
    if (i < 0 || fold(t).length !== t.length) return esc(t);
    const w = q.split(' ')[0].length;
    return `${esc(t.slice(0, i))}<mark>${esc(t.slice(i, i + w))}</mark>${esc(t.slice(i + w))}`;
  }
  function choose(n) {
    const item = shown[n]; if (!item) return;
    layer.classList.remove('open');
    try { item.go(); } catch (error) { console.error(error); }
  }
  function move(d) {
    const items = [...box.querySelectorAll('.rnr-sr-item')]; if (!items.length) return;
    active = (active + d + items.length) % items.length;
    items.forEach((b, i) => b.classList.toggle('is-active', i === active));
    items[active].scrollIntoView({ block: 'nearest' });
  }

  // Our results replace the old section-only list (runs after its listener).
  input.placeholder = T('Search countries, cities, stories, food…', 'দেশ, শহর, গল্প, খাবার খুঁজুন…');
  input.setAttribute('enterkeyhint', 'search');
  input.addEventListener('input', () => show(input.value));
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(active); }
  });
  box.addEventListener('click', e => {
    const b = e.target.closest('[data-sr]');
    if (!b) return;
    e.stopPropagation();
    choose(Number(b.dataset.sr));
  }, true);
  new MutationObserver(async () => {
    if (!layer.classList.contains('open')) return;
    input.placeholder = T('Search countries, cities, stories, food…', 'দেশ, শহর, গল্প, খাবার খুঁজুন…');
    box.innerHTML = `<div class="rnr-empty">${T('Loading…', 'লোড হচ্ছে…')}</div>`;
    await build();
    show(input.value);
  }).observe(layer, { attributes: true, attributeFilter: ['class'] });
  window.RNR_SEARCH = { build, show, results: () => shown.map(i => `${i.type}:${i.title}`) };
})();

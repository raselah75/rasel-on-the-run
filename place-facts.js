/* =====================================================================
   RASEL ON THE RUN — "ABOUT THIS PLACE" BOX
   Shown on every country, state / division and city page in Travel
   Destinations, right under the title.
   • Facts are looked up online (Wikipedia + Wikidata, free, no key):
     capital, area (km²), population, people per km², currency, language,
     elevation, and for states / cities their share of the country's land
     and people. Saved on the device for 30 days.
   • From your own archive: how many states / divisions and cities, and
     how many of your photos are from here.
   • Admin mode: "Edit this box" — write your own words about the place,
     and correct or fill in area, population or capital by hand.
     Saved in raselOnTheRunPlaceNotesV1 (published with your site).
   ===================================================================== */
(() => {
  'use strict';
  const NOTES_KEY = 'raselOnTheRunPlaceNotesV1';
  const CACHE_KEY = 'raselOnTheRunPlaceFactsV3';
  const MAX_AGE = 30 * 864e5;
  const bn = () => document.documentElement.lang === 'bn';
  const T = (en, b) => (bn() ? b : en);
  const isAdmin = () => document.body.classList.contains('admin-mode');
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const read = k => { try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch { return {}; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };
  const data = () => (typeof travelData !== 'undefined' && Array.isArray(travelData) ? travelData : []);
  const loc = () => (bn() ? 'bn-BD' : 'en-US');
  const fmt = (n, digits = 0) => (Number.isFinite(n) ? n.toLocaleString(loc(), { maximumFractionDigits: digits }) : '');
  const big = n => {
    if (!Number.isFinite(n)) return '';
    if (n >= 1e6) {
      const v = n >= 1e9 ? [n / 1e9, T('billion', 'শত কোটি')] : [n / 1e6, T('million', 'মিলিয়ন')];
      return `${fmt(v[0], v[0] < 10 ? 2 : 1)} ${v[1]}`;
    }
    return fmt(n);
  };
  const pct = (a, b) => (Number.isFinite(a) && Number.isFinite(b) && b > 0 ? a / b * 100 : NaN);
  const pctText = p => (Number.isFinite(p) ? `${fmt(p, p < 1 ? 2 : 1)}%` : '');

  // ---------- Wikipedia / Wikidata lookups ----------
  const WP = 'https://en.wikipedia.org';
  const WD = 'https://www.wikidata.org/w/api.php';
  const getJSON = async url => { const r = await fetch(url, { headers: { Accept: 'application/json' } }); if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); };
  const BAD = /\b(university|college|school|airport|station|stadium|club|f\.?c\.?|cricket|hospital|cantonment|bridge|river|railway|constituency|election|team|district court|list of)\b/i;
  async function summary(title) {
    try {
      const s = await getJSON(`${WP}/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`);
      if (!s || s.type === 'disambiguation' || !s.wikibase_item) return null;
      return s;
    } catch { return null; }
  }
  async function search(query) {
    try {
      const j = await getJSON(`${WP}/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=6&format=json&origin=*`);
      return (j.query?.search || []).map(x => x.title);
    } catch { return []; }
  }
  const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  // Does this Wikipedia page belong to the right country?
  function inCountry(page, ctx) {
    const text = norm(`${page.description || ''} ${page.extract || ''}`);
    const w = window.RNR_WORLD?.find(ctx.country);
    return [ctx.country, w?.name, ...(w?.alt || [])].filter(Boolean).some(n => text.includes(norm(n)));
  }
  async function findPage(kind, name, ctx) {
    if (kind === 'country') return summary(ctx.wikiName || name);
    const tries = kind === 'region'
      ? [`${name} ${ctx.label}`, `${name}, ${ctx.country}`, name]
      : [`${name}, ${ctx.region}`, `${name}, ${ctx.country}`, name];
    for (const t of tries) {
      const s = await summary(t);
      if (s && !BAD.test(s.title) && inCountry(s, ctx)) return s;
    }
    const n = norm(name);
    const titles = (await search(kind === 'region' ? `${name} ${ctx.label} ${ctx.country}` : `${name} ${ctx.region} ${ctx.country}`))
      .filter(t => !BAD.test(t) && !tries.includes(t));
    for (const t of [...titles.filter(t => norm(t).startsWith(n)), ...titles.filter(t => !norm(t).startsWith(n) && norm(t).includes(n))].slice(0, 3)) {
      const s = await summary(t);
      if (s && inCountry(s, ctx)) return s;
    }
    return null;
  }
  const UNITS = { Q712226: 1, Q232291: 2.589988, Q35852: 0.01, Q25343: 1e-6, Q81292: 0.00404686, Q11573: 1, Q174728: 0.01, Q3710: 0.3048 };
  const amount = c => { const v = c?.mainsnak?.datavalue?.value; if (!v?.amount) return NaN; const unit = String(v.unit || '').split('/').pop(); return Number(v.amount) * (UNITS[unit] ?? 1); };
  const itemId = c => c?.mainsnak?.datavalue?.value?.id || '';
  const timeOf = c => c?.qualifiers?.P585?.[0]?.datavalue?.value?.time || '';
  // Wikidata time "+2022-00-00T00:00:00Z" → milliseconds (unknown month = middle of the year).
  const msOf = t => { const m = /^\+?(\d{4})-(\d{2})-(\d{2})/.exec(t || ''); if (!m) return NaN; const y = +m[1], mo = +m[2], d = +m[3]; return mo ? Date.UTC(y, mo - 1, d || 1) : Date.UTC(y, 6, 1); };
  const YEAR = 365.2425 * 864e5;
  // Yearly growth from the population history (e.g. census 2011 → 2022).
  function growthOf(claims = []) {
    const pts = claims.filter(c => c.rank !== 'deprecated' && c.mainsnak?.snaktype === 'value').map(c => ({ t: msOf(timeOf(c)), v: amount(c) }))
      .filter(x => Number.isFinite(x.t) && Number.isFinite(x.v) && x.v > 0).sort((a, b) => a.t - b.t);
    if (pts.length < 2) return NaN;
    const last = pts[pts.length - 1];
    const older = pts.filter(x => (last.t - x.t) / YEAR >= 3);
    if (!older.length) return NaN;
    const first = older.reduce((best, x) => (Math.abs((last.t - x.t) / YEAR - 10) < Math.abs((last.t - best.t) / YEAR - 10) ? x : best));
    const g = Math.pow(last.v / first.v, 1 / ((last.t - first.t) / YEAR)) - 1;
    return Number.isFinite(g) ? Math.max(-0.03, Math.min(0.06, g)) : NaN;
  }
  function best(claims = []) {
    const ok = claims.filter(c => c.rank !== 'deprecated' && c.mainsnak?.snaktype === 'value');
    const pref = ok.filter(c => c.rank === 'preferred');
    const pool = pref.length ? pref : ok;
    return pool.slice().sort((a, b) => timeOf(b).localeCompare(timeOf(a)))[0] || null;
  }
  async function facts(kind, name, ctx) {
    const page = await findPage(kind, name, ctx);
    if (!page) return { none: true };
    const ent = (await getJSON(`${WD}?action=wbgetentities&ids=${page.wikibase_item}&props=claims|labels&languages=en|bn&format=json&origin=*`)).entities?.[page.wikibase_item];
    const cl = ent?.claims || {};
    const popClaim = best(cl.P1082);
    const out = {
      title: page.title, url: page.content_urls?.desktop?.page || `${WP}/wiki/${encodeURIComponent(page.title)}`,
      text: String(page.extract || '').split(/(?<=\.)\s+/).slice(0, 2).join(' ').slice(0, 420),
      bnName: ent?.labels?.bn?.value || '',
      population: amount(popClaim), popYear: timeOf(popClaim).slice(1, 5), popAt: msOf(timeOf(popClaim)), popGrowth: growthOf(cl.P1082),
      area: amount(best(cl.P2046)), elevation: amount(best(cl.P2044)),
      capitalId: itemId(best(cl.P36)), currencyId: itemId(best(cl.P38)), inId: kind === 'city' ? itemId(best(cl.P131)) : '',
      languageIds: (cl.P37 || []).filter(c => c.rank !== 'deprecated').map(itemId).filter(Boolean).slice(0, 3)
    };
    // The district / county the city belongs to (its area and people, when the city has none).
    if (out.inId) {
      try {
        const pe = (await getJSON(`${WD}?action=wbgetentities&ids=${out.inId}&props=claims|labels&languages=en|bn&format=json&origin=*`)).entities?.[out.inId];
        const pc = pe?.claims || {};
        const pp = best(pc.P1082);
        out.inArea = { name: { en: pe?.labels?.en?.value || '', bn: pe?.labels?.bn?.value || '' }, population: amount(pp), popAt: msOf(timeOf(pp)), area: amount(best(pc.P2046)) };
      } catch {}
    }
    const ids = [out.capitalId, out.currencyId, ...out.languageIds].filter(Boolean);
    if (ids.length) {
      try {
        const labels = (await getJSON(`${WD}?action=wbgetentities&ids=${ids.join('|')}&props=labels&languages=en|bn&format=json&origin=*`)).entities || {};
        const lab = id => ({ en: labels[id]?.labels?.en?.value || '', bn: labels[id]?.labels?.bn?.value || '' });
        out.capital = out.capitalId ? lab(out.capitalId) : null;
        out.currency = out.currencyId ? lab(out.currencyId) : null;
        out.languages = out.languageIds.map(lab).filter(l => l.en);
      } catch {}
    }
    return out;
  }
  const pending = new Map();
  function getFacts(key, kind, name, ctx) {
    const cache = read(CACHE_KEY);
    const hit = cache[key];
    if (hit && Date.now() - hit.t < MAX_AGE) return Promise.resolve(hit.d);
    if (pending.has(key)) return pending.get(key);
    const job = facts(kind, name, ctx).then(d => {
      const c = read(CACHE_KEY);
      c[key] = { t: Date.now(), d };
      // Keep the saved facts small: at most 150 places.
      const keys = Object.keys(c).sort((a, b) => c[b].t - c[a].t);
      keys.slice(150).forEach(k => delete c[k]);
      write(CACHE_KEY, c);
      return d;
    }).catch(() => (hit ? hit.d : null)).finally(() => pending.delete(key));
    pending.set(key, job);
    return job;
  }

  // ---------- What page are we on? ----------
  function current() {
    let level, country, region, city;
    try { level = archiveLevel; country = data().find(c => c.id === selectedCountryId); region = country?.regions?.find(r => r.id === selectedRegionId); city = region?.cities?.find(c => c.id === selectedCityId); } catch { return null; }
    if (level === 'regions' && country) return { kind: 'country', country };
    if (level === 'cities' && country && region) return { kind: 'region', country, region };
    if (level === 'photos' && country && region && city) return { kind: 'city', country, region, city };
    return null;
  }
  const keyOf = p => [p.country.name, p.region?.name, p.city?.name].filter(Boolean).join(' › ');
  const label = name => (typeof regionLabelFor === 'function' ? regionLabelFor(name) : 'Region');
  const plural = name => (typeof pluralRegionLabelFor === 'function' ? pluralRegionLabelFor(name) : 'Regions');

  async function photoCounts(p) {
    try {
      const all = await window.RNR_GALLERY.allPhotos();
      const mine = all.filter(x => x.countryId === p.country.id && (!p.region || x.regionId === p.region.id) && (!p.city || x.cityId === p.city.id));
      return mine.length;
    } catch { return 0; }
  }

  // ---------- Drawing ----------
  let drawToken = 0;
  async function draw() {
    const p = current();
    const head = document.querySelector('#countryList .archive-page-heading');
    document.querySelectorAll('#countryList .rnr-place-box').forEach(b => { if (!p || b.dataset.key !== keyOf(p)) b.remove(); });
    if (!p || !head) return;
    const key = keyOf(p);
    let box = document.querySelector(`#countryList .rnr-place-box[data-key="${CSS.escape(key)}"]`);
    if (!box) {
      box = document.createElement('div');
      box.className = `rnr-place-box is-${p.kind}`;
      box.dataset.key = key;
      head.after(box);
    }
    const token = ++drawToken;
    const notes = read(NOTES_KEY)[key] || {};
    const photos = await photoCounts(p);
    render(box, p, notes, null, photos, true);
    const ctx = { country: p.country.name, region: p.region?.name || '', label: label(p.country.name), wikiName: window.RNR_WORLD?.find(p.country.name)?.name };
    const name = p.city?.name || p.region?.name || p.country.name;
    const f = await getFacts(key, p.kind, name, ctx);
    // For shares (% of the country), the country's own numbers.
    let parent = null;
    if (p.kind !== 'country') parent = await getFacts(p.country.name, 'country', p.country.name, { ...ctx, region: '' });
    if (p.kind === 'city' && parent) parent = { ...parent, regionFacts: await getFacts(`${p.country.name} › ${p.region.name}`, 'region', p.region.name, ctx) };
    if (token !== drawToken || !box.isConnected) return;
    render(box, p, notes, f, photos, false, parent);
  }

  const ICON = {
    capital: '<path d="M4 21h16M6 21V10l6-5 6 5v11M10 21v-5h4v5" />',
    area: '<path d="M4 4h16v16H4z M4 9h16 M9 4v16" />',
    people: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 20c.6-3.4 2.8-5.4 5.5-5.4s4.9 2 5.5 5.4"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.7c2.5.2 4 1.9 4.5 5.3"/>',
    density: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    states: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z M9 4v14 M15 6v14"/>',
    cities: '<path d="M3 21V9l5-3v15M8 21V4l8 4v13M16 21v-8l5 2v6M2 21h20"/>',
    money: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.8"/>',
    lang: '<path d="M4 5h9M8.5 3v2M6 5c.5 3.5 3 6.5 6 8M11 5c-.6 3.6-3.4 7-7 9M13 21l4-10 4 10M14.5 17.5h5"/>',
    mountain: '<path d="M2 20l7-12 4 6 3-4 6 10z"/>',
    photo: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 8"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.4"/>',
    pie: '<path d="M12 3v9h9"/><path d="M20.5 15.5A9 9 0 1 1 8.5 3.7"/>',
    land: '<path d="M3 18c3-1 4-5 7-5s3 3 6 3 3-4 5-4"/><path d="M3 21h18"/>'
  };
  const svg = k => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON[k]}</svg>`;
  const lbl = o => (o ? (bn() && o.bn ? o.bn : o.en) : '');

  function render(box, p, notes, f, photos, loading, parent) {
    const num = v => { const n = Number(String(v ?? '').replace(/[, ]/g, '')); return Number.isFinite(n) && n > 0 ? n : NaN; };
    const area = num(notes.area) || f?.area;
    const pop = num(notes.population) || f?.population;
    const capital = notes.capital || lbl(f?.capital);
    const rows = [];
    const add = (icon, title, value, sub = '', extra = {}) => { if (value !== '' && value != null && value !== 'NaN') rows.push({ icon, title, value, sub, ...extra }); };
    // Live population: latest count + yearly growth (from the census history, or the country's).
    const growth = [f?.popGrowth, parent?.popGrowth].find(Number.isFinite);
    // Count date: the place's own census date, else the country's latest census, else today.
    const popAt = num(notes.population) ? Number(notes.popAt) || Date.now() : [f?.popAt, parent?.popAt].find(Number.isFinite) ?? Date.now();
    const live = Number.isFinite(pop) && Number.isFinite(growth) && Number.isFinite(popAt) ? { base: pop, t0: popAt, g: growth } : null;
    const popValue = live ? fmt(Math.round(livePop(live))) : big(pop);
    const cnt = (n, suffix = '', dec = 0) => (Number.isFinite(n) ? { count: { n, suffix, dec } } : {});
    const country = p.country;
    if (p.kind === 'country') {
      const regions = country.regions || [];
      const cities = regions.reduce((n, r) => n + (r.cities || []).length, 0);
      add('capital', T('Capital', 'রাজধানী'), capital);
      add('area', T('Area', 'আয়তন'), Number.isFinite(area) ? `${fmt(area)} km²` : '', '', cnt(area, ' km²'));
      add('people', T('Population', 'জনসংখ্যা'), popValue, live ? '' : (f?.popYear && !num(notes.population) ? `${T('in', '')} ${f.popYear}` : ''), { live });
      add('density', T('People per km²', 'প্রতি বর্গকিমিতে মানুষ'), Number.isFinite(pop / area) ? fmt(pop / area) : '', '', cnt(pop / area));
      // World: about 8.23 billion people in mid-2025 (UN), growing ~0.85% a year.
      const world = 8.232e9 * Math.pow(1.0085, (Date.now() - Date.UTC(2025, 6, 1)) / YEAR);
      add('globe', T("Share of the world's people", 'পৃথিবীর মানুষের অংশ'), pctText(pct(pop, world)), Number.isFinite(pop) ? T(`1 in every ${fmt(Math.round(world / pop))} people on Earth`, `পৃথিবীর প্রতি ${fmt(Math.round(world / pop))} জনে ১ জন`) : '');
      add('land', T("Share of the world's land", 'পৃথিবীর ভূমির অংশ'), pctText(pct(area, 148.94e6)));
      add('states', plural(country.name), regions.length ? fmt(regions.length) : '', '', cnt(regions.length));
      add('cities', T('Cities in my archive', 'আর্কাইভে শহর'), cities ? fmt(cities) : '', '', cnt(cities));
      add('money', T('Currency', 'মুদ্রা'), lbl(f?.currency));
      add('lang', T('Language', 'ভাষা'), (f?.languages || []).map(lbl).filter(Boolean).join(', '));
      add('globe', T('Continent', 'মহাদেশ'), window.RNR_WORLD?.find(country.name)?.continent || '');
    } else {
      const cArea = parent?.area, cPop = parent?.population;
      const rf = parent?.regionFacts, rNotes = read(NOTES_KEY)[`${country.name} › ${p.region?.name}`] || {};
      const rPop = num(rNotes.population) || rf?.population, rArea = num(rNotes.area) || rf?.area;
      const dash = '—';
      const share = (a, b) => (pctText(pct(a, b)) || '');
      if (p.kind === 'region') {
        add('capital', T('Capital', 'প্রধান শহর'), capital || dash);
      } else {
        add('pin', T('Located in', 'অবস্থান'), `${p.region.name}, ${country.name}`);
      }
      add('people', T('Population', 'জনসংখ্যা'), popValue || dash, !live && f?.popYear && !num(notes.population) ? `${T('in', '')} ${f.popYear}` : '', { live });
      add('area', T('Area', 'আয়তন'), Number.isFinite(area) ? `${fmt(area)} km²` : dash, '', cnt(area, ' km²'));
      add('density', T('People per km²', 'প্রতি বর্গকিমিতে মানুষ'), Number.isFinite(pop / area) ? fmt(pop / area) : dash, '', cnt(pop / area));
      add('pie', T(`Share of ${country.name}'s people`, `${country.name}-এর মানুষের অংশ`), share(pop, cPop) || dash, Number.isFinite(pop) && Number.isFinite(cPop) ? T(`1 in every ${fmt(Math.round(cPop / pop))} people`, `প্রতি ${fmt(Math.round(cPop / pop))} জনে ১ জন`) : '');
      if (p.kind === 'city') add('pie', T(`Share of ${p.region.name}'s people`, `${p.region.name}-এর মানুষের অংশ`), share(pop, rPop) || dash);
      add('land', T(`Share of ${country.name}'s land`, `${country.name}-এর ভূমির অংশ`), share(area, cArea) || dash);
      if (p.kind === 'city') {
        add('mountain', T('Elevation', 'উচ্চতা'), Number.isFinite(f?.elevation) ? `${fmt(f.elevation)} m` : dash);
        const d = f?.inArea;
        if (d && (Number.isFinite(d.population) || Number.isFinite(d.area)) && lbl(d.name) && norm(lbl(d.name)) !== norm(p.region.name)) {
          add('states', lbl(d.name), [Number.isFinite(d.population) ? `${big(d.population)} ${T('people', 'মানুষ')}` : '', Number.isFinite(d.area) ? `${fmt(d.area)} km²` : ''].filter(Boolean).join(' · '),
            Number.isFinite(pop) && Number.isFinite(d.population) && pop < d.population ? T(`${pctText(pct(pop, d.population))} of them live in ${p.city.name}`, `এর ${pctText(pct(pop, d.population))} মানুষ ${p.city.name}-এ থাকে`) : '');
        }
      } else {
        add('cities', T('Cities in my archive', 'আর্কাইভে শহর'), fmt((p.region.cities || []).length));
        add('people', T('Average per city', 'শহরপ্রতি গড়'), Number.isFinite(pop) && (p.region.cities || []).length ? big(pop / p.region.cities.length) : dash);
      }
    }
    add('photo', T('My photos here', 'এখানে আমার ছবি'), fmt(photos || 0), '', cnt(photos));

    const flag = (typeof getCountryFlag === 'function' ? getCountryFlag(country.name) : '') || '';
    const kindText = p.kind === 'country' ? T('ABOUT THIS COUNTRY', 'দেশটি সম্পর্কে') : p.kind === 'region' ? T(`ABOUT THIS ${label(country.name).toUpperCase()}`, 'এই অঞ্চল সম্পর্কে') : T('ABOUT THIS CITY', 'শহরটি সম্পর্কে');
    const title = p.city?.name || p.region?.name || country.name;
    const bnName = f?.bnName && bn() ? f.bnName : '';
    const desc = notes.text ? '' : f?.text || '';
    box.innerHTML = `
      <div class="rnr-pb-head">
        <span class="rnr-pb-flag" aria-hidden="true">${esc(flag)}</span>
        <div><p class="rnr-pb-eyebrow">${esc(kindText)}</p><h3 data-no-translate>${esc(bnName || title)}</h3></div>
        <button type="button" class="rnr-owner-pill rnr-pb-edit" data-pb-edit>✎ Edit this box</button>
      </div>
      ${notes.text ? `<p class="rnr-pb-note" data-no-translate>${esc(notes.text)}</p>` : ''}
      ${desc ? `<p class="rnr-pb-desc" data-no-translate>${esc(desc)}</p>` : ''}
      ${rows.length ? `<ul class="rnr-pb-grid">${rows.map(r => `<li${r.live ? ' class="is-live"' : ''}><span class="rnr-pb-ico">${svg(r.icon)}</span><div><small>${esc(r.title)}${r.live ? ` <span class="rnr-pb-livebadge"><i></i>${T('LIVE', 'লাইভ')}</span>` : ''}</small><b data-no-translate${r.live ? ` data-live='${JSON.stringify(r.live)}'` : ''}${r.count ? ` data-count='${JSON.stringify(r.count)}'` : ''}>${esc(r.value)}</b>${r.live ? `<em class="rnr-pb-today" data-no-translate></em>` : ''}${r.sub ? `<em data-no-translate>${esc(r.sub)}</em>` : ''}</div></li>`).join('')}</ul>` : ''}
      ${loading ? `<p class="rnr-pb-loading">${T('Looking up facts…', 'তথ্য খোঁজা হচ্ছে…')}</p>` : ''}
      ${!loading && (!f || f.none) && !notes.text ? `<p class="rnr-pb-miss">${T('More facts appear when you are online.', 'অনলাইনে থাকলে আরও তথ্য দেখা যাবে।')}${isAdmin() ? ' <span class="rnr-pb-only">You can also add them with "Edit this box".</span>' : ''}</p>` : ''}
      ${f?.url ? `<p class="rnr-pb-src">${T('Facts', 'তথ্য')}: <a href="${esc(f.url)}" target="_blank" rel="noopener">Wikipedia</a> · Wikidata${live ? ` · ${T(`Live number = latest count${f.popYear ? ` (${f.popYear})` : ''} + about ${fmt(live.g * 100, 2)}% growth a year, so it is an estimate.`, `লাইভ সংখ্যা = সর্বশেষ গণনা${f.popYear ? ` (${f.popYear})` : ''} + বছরে প্রায় ${fmt(live.g * 100, 2)}% বৃদ্ধি, তাই এটি একটি অনুমান।`)}` : ''}</p>` : ''}`;
    box._ctx = { p, f };
    if (!loading) animate(box);
  }

  // ---------- Animation: numbers count up, population ticks live ----------
  const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  function livePop(l, at = Date.now()) { return l.base * Math.pow(1 + l.g, (at - l.t0) / YEAR); }
  const opened = Date.now();
  function animate(box) {
    const go = () => {
      box.querySelectorAll('b[data-count]').forEach(b => {
        let c; try { c = JSON.parse(b.dataset.count); } catch { return; }
        if (reduceMotion() || !(c.n > 0)) return;
        const t0 = performance.now(), dur = 1300;
        const step = now => { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3); b.textContent = `${fmt(c.n * e, c.dec)}${c.suffix}`; if (k < 1) requestAnimationFrame(step); };
        requestAnimationFrame(step);
      });
      box.querySelectorAll('b[data-live]').forEach(b => startLive(b));
    };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); go(); } }, { threshold: 0.15 });
      io.observe(box);
    } else go();
  }
  function startLive(b) {
    let l; try { l = JSON.parse(b.dataset.live); } catch { return; }
    const today = b.parentElement.querySelector('.rnr-pb-today');
    const midnight = new Date(); midnight.setHours(0, 0, 0, 0);
    let shown = Math.round(livePop(l));
    const paint = n => { b.textContent = fmt(n); };
    const showToday = now => {
      if (!today) return;
      const d = Math.round(livePop(l, now) - livePop(l, midnight.getTime()));
      today.textContent = d ? `${d > 0 ? '▲ +' : '▼ '}${fmt(Math.abs(d))} ${T('today', 'আজ')}` : '';
      today.classList.toggle('is-down', d < 0);
    };
    // Count up from 99.5% to the live number first.
    if (!reduceMotion()) {
      const from = shown * 0.995, t0 = performance.now(), dur = 1600;
      const step = now => { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3); paint(Math.round(from + (livePop(l) - from) * e)); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    } else paint(shown);
    showToday(Date.now());
    const timer = setInterval(() => {
      if (!b.isConnected) { clearInterval(timer); return; }
      if (document.hidden) return;
      const now = Date.now(), n = Math.round(livePop(l, now));
      if (n !== shown) {
        const diff = n - shown; shown = n; paint(n);
        if (!reduceMotion()) {
          b.classList.remove('is-tick'); void b.offsetWidth; b.classList.add('is-tick');
          const pop = document.createElement('span');
          pop.className = `rnr-pb-plus${diff < 0 ? ' is-down' : ''}`;
          pop.textContent = `${diff > 0 ? '+' : '−'}${fmt(Math.abs(diff))}`;
          b.parentElement.append(pop);
          setTimeout(() => pop.remove(), 1600);
        }
      }
      showToday(now);
    }, 1000);
  }

  // ---------- Owner editing ----------
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-pb-edit]');
    if (!b || !isAdmin()) return;
    const box = b.closest('.rnr-place-box'); const { p, f } = box._ctx || {};
    if (!p) return;
    const key = box.dataset.key, all = read(NOTES_KEY), n = all[key] || {};
    window.RNR_OWNER_FORM?.({ eyebrow: 'ABOUT THIS PLACE', title: p.city?.name || p.region?.name || p.country.name,
      note: 'Write in your own words. Leave a number empty to use the automatic one from Wikipedia.',
      fields: [
        { name: 'text', label: 'In my words (shown at the top of the box)', type: 'textarea', rows: 4, value: n.text || '', maxlength: 800, placeholder: f?.text || 'What is special about this place for you?' },
        { name: 'capital', label: p.kind === 'city' ? 'Capital (not shown for cities)' : 'Capital / main city', value: n.capital || '', placeholder: lbl(f?.capital) || '' },
        { name: 'area', label: 'Area in km²', value: n.area || '', placeholder: Number.isFinite(f?.area) ? String(Math.round(f.area)) : 'e.g. 148460' },
        { name: 'population', label: 'Population', value: n.population || '', placeholder: Number.isFinite(f?.population) ? String(Math.round(f.population)) : 'e.g. 171466990' }
      ],
      save: d => {
        const v = { text: d.text.trim(), capital: d.capital.trim(), area: d.area.replace(/[^\d.]/g, ''), population: d.population.replace(/[^\d]/g, '') };
        if (v.population) v.popAt = v.population === n.population && n.popAt ? n.popAt : Date.now();
        if (Object.values(v).some(Boolean)) all[key] = v; else delete all[key];
        if (!write(NOTES_KEY, all)) { alert('Could not save.'); return false; }
        draw();
      },
      extraLabel: 'Refresh facts', extra: () => { const c = read(CACHE_KEY); delete c[key]; write(CACHE_KEY, c); draw(); }
    });
  });

  // Draw after every archive change.
  const prev = window.renderCountries || (typeof renderCountries === 'function' ? renderCountries : null);
  if (prev) {
    const wrapped = function (...args) { const r = prev.apply(this, args); setTimeout(draw, 0); return r; };
    try { renderCountries = wrapped; } catch {}
    window.renderCountries = wrapped;
  }
  addEventListener('rnr:language', () => draw());
  let lastAdmin = isAdmin();
  new MutationObserver(() => { if (isAdmin() !== lastAdmin) { lastAdmin = isAdmin(); draw(); } }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  window.RNR_PLACE_FACTS = { draw, getFacts };
})();

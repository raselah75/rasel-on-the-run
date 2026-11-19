/* =====================================================================
   RASEL ON THE RUN — SMART "ADD PHOTOS" (Admin mode)
   Pick many photos at once. Each photo's own camera information is read
   on this device: the date it was taken and, if the phone saved it, the
   GPS position. Photos are grouped by place, the country / division /
   city is found automatically (online lookup of the GPS point via
   BigDataCloud, coordinates only), and you check the groups before saving.
   GPS is never stored or published: photos are re-saved without it.
   Photos without GPS can be placed by hand or go to "My Memories".
   ===================================================================== */
(() => {
  'use strict';
  const isAdmin = () => document.body.classList.contains('admin-mode');
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const data = () => (typeof travelData !== 'undefined' && Array.isArray(travelData) ? travelData : []);
  const STRIP = /\b(division|district|province|state|region|prefecture|county|city|municipality|upazila|sadar|zila|governorate|department|oblast|of)\b/g;
  const ALIAS = { chittagong: 'chattogram', comilla: 'cumilla', barisal: 'barishal', jessore: 'jashore', bogra: 'bogura', dacca: 'dhaka', coxsbazaar: 'coxsbazar', chapainawabganj: 'chapainawabganj', nawabganj: 'chapainawabganj', jhenaidaha: 'jhenaidah', maulvibazar: 'moulvibazar', sreemangal: 'sreemangal', srimangal: 'sreemangal', mymensing: 'mymensingh', netrakona: 'netrokona', brahmanbaria: 'brahmanbaria', lakshmipur: 'lakshmipur', laxmipur: 'lakshmipur', jhalakati: 'jhalokati', jhalokathi: 'jhalokati', narshingdi: 'narsingdi', kishorganj: 'kishoreganj', thakurgoan: 'thakurgaon' };
  const key = s => { const k = String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(STRIP, '').replace(/[^a-z]/g, ''); return ALIAS[k] || k; };

  // ---------- Reading the photo's GPS (JPEG EXIF) ----------
  async function exifGPS(file) {
    try {
      if (!/jpe?g/i.test(file.type || '') && !/\.jpe?g$/i.test(file.name || '')) return null;
      const view = new DataView(await file.slice(0, 256 * 1024).arrayBuffer());
      if (view.getUint16(0) !== 0xFFD8) return null;
      let offset = 2;
      while (offset + 4 < view.byteLength) {
        const marker = view.getUint16(offset), size = view.getUint16(offset + 2);
        if (marker === 0xFFE1 && view.getUint32(offset + 4) === 0x45786966) {
          const tiff = offset + 10, little = view.getUint16(tiff) === 0x4949;
          const u16 = o => view.getUint16(o, little), u32 = o => view.getUint32(o, little);
          const find = (ifd, tag) => { const n = u16(ifd); for (let i = 0; i < n; i += 1) { const e = ifd + 2 + i * 12; if (u16(e) === tag) return e; } return 0; };
          const gpsEntry = find(tiff + u32(tiff + 4), 0x8825);
          if (!gpsEntry) return null;
          const gps = tiff + u32(gpsEntry + 8);
          const ref = tag => { const e = find(gps, tag); return e ? String.fromCharCode(view.getUint8(e + 8)) : ''; };
          const dms = tag => { const e = find(gps, tag); if (!e) return NaN; const o = tiff + u32(e + 8); const r = i => { const d = u32(o + i * 8 + 4); return d ? u32(o + i * 8) / d : 0; }; return r(0) + r(1) / 60 + r(2) / 3600; };
          let lat = dms(2), lng = dms(4);
          if (!isFinite(lat) || !isFinite(lng) || (lat === 0 && lng === 0)) return null;
          if (ref(1) === 'S') lat = -lat;
          if (ref(3) === 'W') lng = -lng;
          return { lat, lng };
        }
        if ((marker & 0xFF00) !== 0xFF00 || size < 2) break;
        offset += 2 + size;
      }
    } catch {}
    return null;
  }

  // ---------- GPS point → place names (cached, one request at a time) ----------
  const CACHE_KEY = 'raselOnTheRunGeoCacheV1';
  const cache = (() => { try { return JSON.parse(sessionStorage.getItem(CACHE_KEY) || '{}'); } catch { return {}; } })();
  async function reverse({ lat, lng }) {
    const k = `${lat.toFixed(2)},${lng.toFixed(2)}`;
    if (cache[k]) return cache[k];
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}&localityLanguage=en`;
    const r = await fetch(url, { referrerPolicy: 'no-referrer' });
    if (!r.ok) throw new Error(`lookup ${r.status}`);
    const j = await r.json();
    const admin = (j.localityInfo?.administrative || []).map(a => a.name).filter(Boolean);
    const place = { country: j.countryName || '', countryCode: j.countryCode || '', region: j.principalSubdivision || '', city: j.city || '', locality: j.locality || '', names: admin };
    cache[k] = place;
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch {}
    return place;
  }

  // ---------- Match names to the archive ----------
  function matchPlace(p) {
    const w = window.RNR_WORLD?.find(p.country) || (p.countryCode && window.RNR_WORLD?.list.find(c => c.code === p.countryCode));
    const countryName = w?.name || p.country;
    const country = data().find(c => key(c.name) === key(countryName)) || null;
    const out = { countryName, country, region: null, city: null, newCity: '', newRegion: '' };
    if (!country) { out.newRegion = String(p.region || '').replace(/\s+(Division|District|Province|State|Region|Canton|Prefecture|County)$/i, ''); out.newCity = p.city || p.locality || ''; return out; }
    const candidates = [p.city, p.locality, ...p.names.slice().reverse()].filter(Boolean);
    // City first (also tells us the region).
    for (const name of candidates) {
      for (const region of country.regions || []) {
        const city = (region.cities || []).find(c => key(c.name) === key(name));
        if (city) { out.region = region; out.city = city; return out; }
      }
    }
    const regionNames = [p.region, ...p.names];
    out.region = (country.regions || []).find(r => regionNames.some(n => key(n) && key(r.name) === key(n))) || null;
    out.newCity = p.city || p.locality || '';
    return out;
  }

  // ---------- Flow ----------
  const sheet = document.createElement('div');
  sheet.className = 'rnr-su'; sheet.hidden = true;
  sheet.innerHTML = '<div class="rnr-su-backdrop"></div><div class="rnr-su-card" role="dialog" aria-modal="true" aria-label="Add photos"></div>';
  document.body.append(sheet);
  const card = sheet.querySelector('.rnr-su-card');
  let groups = [], urls = [];
  const open = html => { card.innerHTML = html; sheet.hidden = false; document.body.classList.add('rnr-modal-open'); };
  const close = () => { sheet.hidden = true; document.body.classList.remove('rnr-modal-open'); urls.forEach(u => URL.revokeObjectURL(u)); urls = []; groups = []; };

  function chooser() {
    open(`<button type="button" class="rnr-su-x" data-su-close aria-label="Close">✕</button>
      <p class="rnr-su-eyebrow">ADD PHOTOS</p><h3>Where do these photos go?</h3>
      <div class="rnr-su-choices">
        <button type="button" data-su-smart><span>📍</span><b>Find the place for me</b><small>Choose many photos from any trips. Each photo is put in its country, division and city from its own location and date. You check before saving.</small></button>
        <button type="button" data-su-general><span>🖼️</span><b>Add to My Memories</b><small>Photos without a place, shown in “My Memories”.</small></button>
      </div>
      <p class="rnr-su-note">Tip (iPhone): in the photo picker tap <b>Options</b> and turn <b>Location</b> on, so the place can be found. The location is used only to sort the photos — it is removed before saving and never published.</p>`);
  }
  function pick() {
    const picker = document.createElement('input');
    picker.type = 'file'; picker.accept = 'image/*'; picker.multiple = true;
    picker.addEventListener('change', () => { const files = [...(picker.files || [])].filter(f => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name)); if (files.length) analyse(files); });
    picker.click();
  }
  async function analyse(files) {
    open(`<p class="rnr-su-eyebrow">ADD PHOTOS</p><h3>Reading ${files.length} photo${files.length === 1 ? '' : 's'}…</h3><div class="rnr-su-bar"><i></i></div><p class="rnr-su-status">Looking at dates and places</p>`);
    const bar = card.querySelector('.rnr-su-bar i'), status = card.querySelector('.rnr-su-status');
    const items = [];
    let offline = false;
    for (const [i, file] of files.entries()) {
      const [gps, date] = await Promise.all([exifGPS(file), window.RNR_GALLERY?.exifDate ? window.RNR_GALLERY.exifDate(file) : null]);
      let place = null;
      if (gps && !offline) {
        try { place = await reverse(gps); } catch { offline = true; }
      }
      items.push({ file, gps, date, place });
      bar.style.width = `${Math.round(((i + 1) / files.length) * 100)}%`;
      status.textContent = `${i + 1} of ${files.length}${place ? ` · ${[place.city || place.locality, place.country].filter(Boolean).join(', ')}` : ''}`;
    }
    // Group by matched place.
    const map = new Map();
    items.forEach(it => {
      const m = it.place ? matchPlace(it.place) : null;
      const k = m ? [m.countryName, m.region?.id || '', m.city?.id || m.newCity].join('|') : (it.gps ? 'gps-no-lookup' : 'none');
      if (!map.has(k)) map.set(k, { match: m, items: [], noGps: !it.gps, lookupFailed: Boolean(it.gps && !it.place) });
      map.get(k).items.push(it);
    });
    groups = [...map.values()].sort((a, b) => (a.match ? 0 : 1) - (b.match ? 0 : 1) || b.items.length - a.items.length);
    review(offline);
  }

  const fmt = d => d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  function dateRange(items) {
    const ds = items.map(i => i.date).filter(Boolean).sort((a, b) => a - b);
    if (!ds.length) return '';
    const a = fmt(ds[0]), b = fmt(ds[ds.length - 1]);
    return a === b ? a : `${a} – ${b}`;
  }
  const countryOptions = sel => `<option value="">— Choose country —</option>` + data().slice().sort((a, b) => a.name.localeCompare(b.name)).map(c => `<option value="${esc(c.id)}"${c.id === sel ? ' selected' : ''}>${esc(c.name)}</option>`).join('');
  const regionOptions = (country, sel) => `<option value="">— Choose ${esc(typeof regionLabelFor === 'function' && country ? regionLabelFor(country.name).toLowerCase() : 'region')} —</option>` + (country?.regions || []).map(r => `<option value="${esc(r.id)}"${r.id === sel ? ' selected' : ''}>${esc(r.name)}</option>`).join('');
  const cityOptions = (region, sel, extra) => `<option value="">Whole ${region ? 'area' : '—'} (no city)</option>` + (extra ? `<option value="new:${esc(extra)}"${sel === `new:${extra}` ? ' selected' : ''}>➕ New city: ${esc(extra)}</option>` : '') + (region?.cities || []).map(c => `<option value="${esc(c.id)}"${c.id === sel ? ' selected' : ''}>${esc(c.name)}</option>`).join('');

  function review(offline) {
    const total = groups.reduce((n, g) => n + g.items.length, 0);
    const html = groups.map((g, gi) => {
      const m = g.match;
      const thumbs = g.items.slice(0, 6).map(it => { const u = URL.createObjectURL(it.file); urls.push(u); return `<img src="${u}" alt="" loading="lazy">`; }).join('') + (g.items.length > 6 ? `<span>+${g.items.length - 6}</span>` : '');
      const title = m ? [m.city?.name || m.newCity, m.region?.name, m.countryName].filter(Boolean).join(', ') : g.noGps ? 'No location in these photos' : 'Location found, but the place lookup did not work';
      const missingCountry = m && !m.country ? `<p class="rnr-su-warn">${esc(m.countryName)} is not in your Travel Destinations yet — it will be added${[m.newCity, m.newRegion].filter(Boolean).length ? ` (with ${esc([m.newCity, m.newRegion].filter((v, i, a) => v && a.indexOf(v) === i).join(', '))})` : ''}.</p>` : '';
      const cityDefault = m?.city?.id || (m?.newCity && m?.region ? `new:${m.newCity}` : '');
      return `<section class="rnr-su-group" data-g="${gi}">
        <div class="rnr-su-thumbs">${thumbs}</div>
        <div class="rnr-su-info">
          <p class="rnr-su-count">${g.items.length} photo${g.items.length === 1 ? '' : 's'}${dateRange(g.items) ? ` · ${esc(dateRange(g.items))}` : ''}</p>
          <h4>${m ? '📍 ' : ''}${esc(title)}</h4>${missingCountry}
          <div class="rnr-su-selects">
            ${m && !m.country ? `<input type="hidden" data-su-newcountry value="${esc(m.countryName)}"><input type="hidden" data-su-newregion value="${esc(m.newRegion)}"><input type="hidden" data-su-newcity value="${esc(m.newCity)}">` : `<select data-su-country aria-label="Country">${countryOptions(m?.country?.id || '')}</select>`}
            <select data-su-region aria-label="Division / state"${m && !m.country ? ' hidden' : ''}>${regionOptions(m?.country, m?.region?.id || '')}</select>
            <select data-su-city aria-label="City"${m && !m.country ? ' hidden' : ''}>${cityOptions(m?.region, cityDefault, m?.newCity && m?.region ? m.newCity : '')}</select>
          </div>
          <label class="rnr-su-skip"><input type="checkbox" data-su-memories${m ? '' : ' checked'}> Put in “My Memories” instead</label>
        </div></section>`;
    }).join('');
    open(`<button type="button" class="rnr-su-x" data-su-close aria-label="Close">✕</button>
      <p class="rnr-su-eyebrow">CHECK BEFORE SAVING</p><h3>${total} photo${total === 1 ? '' : 's'} in ${groups.length} place${groups.length === 1 ? '' : 's'}</h3>
      ${offline ? '<p class="rnr-su-warn">Could not look up places (no internet?). Choose the places by hand, or try again later.</p>' : ''}
      <div class="rnr-su-groups">${html}</div>
      <div class="rnr-su-foot"><button type="button" class="rnr-su-ghost" data-su-close>Cancel</button><button type="button" class="rnr-su-save" data-su-save>Save ${total} photo${total === 1 ? '' : 's'}</button></div>`);
  }

  card.addEventListener('change', e => {
    const group = e.target.closest('.rnr-su-group'); if (!group) return;
    const country = data().find(c => c.id === group.querySelector('[data-su-country]')?.value);
    if (e.target.matches('[data-su-country]')) {
      group.querySelector('[data-su-region]').innerHTML = regionOptions(country, '');
      group.querySelector('[data-su-city]').innerHTML = cityOptions(null, '');
      group.querySelector('[data-su-memories]').checked = !country;
    }
    if (e.target.matches('[data-su-region]')) {
      const region = country?.regions?.find(r => r.id === e.target.value);
      group.querySelector('[data-su-city]').innerHTML = cityOptions(region, '');
    }
  });

  async function save() {
    const btn = card.querySelector('[data-su-save]'); btn.disabled = true; btn.textContent = 'Saving…';
    let saved = 0, changedArchive = false;
    for (const [gi, g] of groups.entries()) {
      const el = card.querySelector(`.rnr-su-group[data-g="${gi}"]`);
      const files = g.items.map(i => i.file);
      if (el.querySelector('[data-su-memories]').checked) { saved += await window.RNR_GALLERY.addPhotos(files, { general: true }); continue; }
      let country = data().find(c => c.id === el.querySelector('[data-su-country]')?.value);
      const newCountry = el.querySelector('[data-su-newcountry]')?.value;
      if (!country && newCountry) {
        country = { id: typeof createId === 'function' ? createId() : `c${Date.now()}`, name: newCountry, regions: [] };
        const rName = el.querySelector('[data-su-newregion]')?.value || '', cName = el.querySelector('[data-su-newcity]')?.value || '';
        if (rName || cName) country.regions.push({ id: typeof createId === 'function' ? createId() : `r${Date.now()}`, name: rName || cName, cities: cName ? [{ id: typeof createId === 'function' ? createId() : `t${Date.now()}`, name: cName }] : [] });
        data().push(country); changedArchive = true;
        const r0 = country.regions[0];
        if (r0) { saved += await window.RNR_GALLERY.addPhotos(files, { countryId: country.id, regionId: r0.id, cityId: r0.cities[0]?.id || null }); markVisited(country.name); continue; }
      }
      if (!country) { saved += await window.RNR_GALLERY.addPhotos(files, { general: true }); continue; }
      const region = country.regions?.find(r => r.id === el.querySelector('[data-su-region]')?.value) || null;
      let cityVal = el.querySelector('[data-su-city]')?.value || '';
      let city = region?.cities?.find(c => c.id === cityVal) || null;
      if (!city && region && cityVal.startsWith('new:')) {
        city = { id: typeof createId === 'function' ? createId() : `t${Date.now()}`, name: cityVal.slice(4) };
        region.cities = region.cities || []; region.cities.push(city); changedArchive = true;
      }
      saved += await window.RNR_GALLERY.addPhotos(files, { countryId: country.id, regionId: region?.id || null, cityId: city?.id || null });
      markVisited(country.name);
    }
    function markVisited(name) {
      // A country with photos counts as visited on the globe and in the passport.
      const country = { name };
      try {
        const k = 'raselOnTheRunGlobeListsV1';
        const lists = JSON.parse(localStorage.getItem(k) || 'null') || { visited: (window.RNR_GLOBE?.countries() || []).filter(c => c.visited).map(c => c.name), wishlist: [] };
        if (!lists.visited.includes(country.name)) { lists.visited.push(country.name); lists.wishlist = (lists.wishlist || []).filter(n => n !== country.name); localStorage.setItem(k, JSON.stringify(lists)); }
      } catch {}
    }
    if (changedArchive) { try { if (typeof sortCountries === 'function') sortCountries(); if (typeof saveData === 'function') saveData(); } catch {} }
    close();
    try { renderCountries(); } catch {}
    window.RNR_GLOBE?.refresh();
    window.dispatchEvent(new CustomEvent('rnr:photos-changed'));
    note(`${saved} photo${saved === 1 ? '' : 's'} added.`);
  }
  function note(text) {
    const t = document.createElement('div'); t.className = 'rnr-lost-note is-on'; t.textContent = text; document.body.append(t);
    setTimeout(() => { t.classList.remove('is-on'); setTimeout(() => t.remove(), 400); }, 3500);
  }

  sheet.addEventListener('click', e => {
    if (e.target.closest('[data-su-close]') || e.target.classList.contains('rnr-su-backdrop')) { close(); return; }
    if (e.target.closest('[data-su-smart]')) { pick(); return; }
    if (e.target.closest('[data-su-general]')) { close(); window.RNR_GALLERY?.addPhotos && pickGeneral(); return; }
    if (e.target.closest('[data-su-save]')) save();
  });
  function pickGeneral() {
    const picker = document.createElement('input');
    picker.type = 'file'; picker.accept = 'image/*'; picker.multiple = true;
    picker.addEventListener('change', async () => {
      const n = await window.RNR_GALLERY.addPhotos([...(picker.files || [])], { general: true });
      window.dispatchEvent(new CustomEvent('rnr:photos-changed'));
      try { window.renderGallery?.(); } catch {}
      if (n) note(`${n} photo${n === 1 ? '' : 's'} added to My Memories.`);
    });
    picker.click();
  }
  addEventListener('keydown', e => { if (e.key === 'Escape' && !sheet.hidden) close(); });

  // The header "Add Photos" button opens this instead of going straight to My Memories.
  window.addEventListener('click', e => {
    if (!e.target.closest('#uploadNavButton')) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (!isAdmin()) return;
    document.querySelector('.site-header')?.classList.remove('rnr-menu-open');
    chooser();
  }, true);
  window.RNR_SMART_UPLOAD = { open: chooser, analyse, exifGPS, matchPlace };
})();

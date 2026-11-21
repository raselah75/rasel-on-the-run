/* =====================================================================
   RASEL ON THE RUN — PASSPORT STAMPS (Travels page)
   One ink stamp for every visited country (the same list as the globe).
   The date comes from the oldest photo of that country, or from the date
   you set. Admin mode: ✎ on a stamp to set the date, the entry point,
   the ink colour and the shape. Saved in raselOnTheRunPassportV1.
   Visitors: tap a stamp to open that country.
   ===================================================================== */
(() => {
  'use strict';
  const main = document.querySelector('main');
  if (!main || document.getElementById('rnrPassport')) return;
  const KEY = 'raselOnTheRunPassportV1';
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { return {}; } };
  const write = v => { try { localStorage.setItem(KEY, JSON.stringify(v)); return true; } catch { alert('Could not save. Browser storage may be full.'); return false; } };
  const isAdmin = () => document.body.classList.contains('admin-mode');
  const bn = () => document.documentElement.lang === 'bn';
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = n => (bn() ? String(n).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]) : String(n));

  const INKS = { Red: '#b3263e', Blue: '#1f4fa3', Green: '#23704a', Purple: '#5f3a9c', Orange: '#c45a1c', Teal: '#16707a', Black: '#262626' };
  const INK_LIST = Object.values(INKS);
  const SHAPES = ['round', 'rect', 'oval', 'octagon'];
  const SHAPE_NAMES = { Round: 'round', Rectangle: 'rect', Oval: 'oval', Octagon: 'octagon' };
  const hash = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const stampDate = iso => { if (!iso) return ''; const d = new Date(`${iso.slice(0, 10)}T12:00:00`); return isNaN(d) ? '' : `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };

  // ---------- Section ----------
  const section = document.createElement('section');
  section.id = 'rnrPassport';
  section.className = 'section rnr-passport-section';
  section.innerHTML = `
    <div class="section-heading"><div><p class="eyebrow">PASSPORT</p><h2>My passport stamps</h2><p>One stamp for every country I have stepped into.</p></div><button type="button" class="rnr-owner-pill rnr-pp-add-top" data-pp-add>+ Add a stamp</button></div>
    <div class="rnr-passport">
      <div class="rnr-passport-cover" aria-hidden="true">
        <span class="rnr-pp-top">TRAVEL JOURNAL</span>
        <svg class="rnr-pp-emblem" viewBox="0 0 100 100"><circle cx="50" cy="50" r="34" fill="none" stroke="currentColor" stroke-width="2.4"/><ellipse cx="50" cy="50" rx="15" ry="34" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 50h68M21 33h58M21 67h58" fill="none" stroke="currentColor" stroke-width="2"/><path d="M50 4l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill="currentColor"/></svg>
        <strong class="rnr-pp-title">PASSPORT</strong>
        <span class="rnr-pp-name">RASEL ON THE RUN</span>
        <span class="rnr-pp-count"><b data-pp-count>0</b> <span>countries</span></span>
      </div>
      <div class="rnr-passport-page">
        <div class="rnr-pp-pagehead"><span>VISAS · STAMPS</span><span class="rnr-pp-pageno">07</span></div>
        <div class="rnr-pp-stamps" role="list"></div>
        <p class="rnr-pp-empty">No stamps yet. Press "+ Add a stamp", type the country (for example Switzerland) and the date. Only you can see this message.</p>
      </div>
    </div>
    <svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
      <filter id="rnrStampInk" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="2.4" xChannelSelector="R" yChannelSelector="G" result="d"/>
        <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="1" seed="9" result="m"/>
        <feColorMatrix in="m" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.75" result="mask"/>
        <feComposite in="d" in2="mask" operator="in"/>
      </filter></defs></svg>`;
  const globe = document.getElementById('rnrGlobe');
  (globe || document.getElementById('destinations') || main).after(section);
  const grid = section.querySelector('.rnr-pp-stamps');

  // ---------- Data ----------
  async function firstPhotoDates() {
    const out = {};
    try {
      const photos = window.RNR_GALLERY?.allPhotos ? await window.RNR_GALLERY.allPhotos() : [];
      photos.forEach(p => {
        const t = p.travelDate || (p.takenAt ? new Date(p.takenAt).toISOString().slice(0, 10) : '');
        if (!t || !p.countryId) return;
        if (!out[p.countryId] || t < out[p.countryId]) out[p.countryId] = t;
      });
    } catch {}
    return out;
  }
  function visitedCountries() {
    try { return (window.RNR_GLOBE?.countries() || []).filter(c => c.visited); } catch { return []; }
  }

  // ---------- Stamp drawing ----------
  function fitText(text, max, size) {
    const est = text.length * size * 0.62;
    return est > max ? ` textLength="${max}" lengthAdjust="spacingAndGlyphs"` : '';
  }
  const PLANE = '<path d="M0-9l2 6 8 4v2l-8-2-1 5 3 2v1.5l-4-1-4 1V17l3-2-1-5-8 2v-2l8-4z" fill="currentColor"/>';
  function stampSVG(c, info) {
    const name = c.name.toUpperCase();
    const date = stampDate(info.date);
    const entry = (info.entry || (c.name === 'Bangladesh' ? 'HOME COUNTRY' : '')).toUpperCase().slice(0, 26);
    const h = hash(c.name);
    const shape = SHAPE_NAMES[info.shape] || SHAPES[h % SHAPES.length];
    const ink = INKS[info.ink] || INK_LIST[(h >> 3) % INK_LIST.length];
    const label = date ? 'ARRIVED' : 'VISITED';
    const id = `pp${h.toString(36)}`;
    let body = '';
    if (shape === 'round') {
      body = `<circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" stroke-width="5"/>
        <circle cx="100" cy="100" r="77" fill="none" stroke="currentColor" stroke-width="1.6"/>
        <path id="${id}t" d="M30 100a70 70 0 0 1 140 0" fill="none"/><path id="${id}b" d="M24 100a76 76 0 0 0 152 0" fill="none"/>
        <text font-size="19" font-weight="800" letter-spacing="2"><textPath href="#${id}t" startOffset="50%" text-anchor="middle"${fitText(name, 190, 19)}>${esc(name)}</textPath></text>
        ${entry ? `<text font-size="11" font-weight="700" letter-spacing="1.5"><textPath href="#${id}b" startOffset="50%" text-anchor="middle" dominant-baseline="hanging">${esc(entry)}</textPath></text>` : ''}
        <g transform="translate(100 82) scale(1.05)">${PLANE}</g>
        <text x="100" y="122" text-anchor="middle" font-size="12" font-weight="700" letter-spacing="3">${label}</text>
        ${date ? `<text x="100" y="145" text-anchor="middle" font-size="17" font-weight="800" letter-spacing="1">${esc(date)}</text>` : ''}
        <path d="M44 132h12M144 132h12" stroke="currentColor" stroke-width="2"/>`;
    } else if (shape === 'rect') {
      body = `<rect x="10" y="38" width="180" height="124" rx="10" fill="none" stroke="currentColor" stroke-width="5"/>
        <rect x="20" y="48" width="160" height="104" rx="5" fill="none" stroke="currentColor" stroke-width="1.6"/>
        <text x="100" y="70" text-anchor="middle" font-size="11" font-weight="700" letter-spacing="3">${label}</text>
        <text x="100" y="98" text-anchor="middle" font-size="22" font-weight="900" letter-spacing="1.5"${fitText(name, 150, 22)}>${esc(name)}</text>
        ${date ? `<text x="100" y="122" text-anchor="middle" font-size="16" font-weight="800" letter-spacing="1">${esc(date)}</text>` : ''}
        ${entry ? `<text x="100" y="142" text-anchor="middle" font-size="10" font-weight="700" letter-spacing="1.2"${fitText(entry, 150, 10)}>${esc(entry)}</text>` : ''}
        <g transform="translate(34 70) scale(.7) rotate(45)">${PLANE}</g>`;
    } else if (shape === 'oval') {
      body = `<ellipse cx="100" cy="100" rx="92" ry="66" fill="none" stroke="currentColor" stroke-width="5"/>
        <ellipse cx="100" cy="100" rx="80" ry="55" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="4 3"/>
        <text x="100" y="80" text-anchor="middle" font-size="11" font-weight="700" letter-spacing="3">★ ${label} ★</text>
        <text x="100" y="106" text-anchor="middle" font-size="21" font-weight="900" letter-spacing="1.5"${fitText(name, 140, 21)}>${esc(name)}</text>
        ${date ? `<text x="100" y="128" text-anchor="middle" font-size="15" font-weight="800" letter-spacing="1">${esc(date)}</text>` : ''}
        ${entry ? `<text x="100" y="146" text-anchor="middle" font-size="9.5" font-weight="700" letter-spacing="1"${fitText(entry, 110, 9.5)}>${esc(entry)}</text>` : ''}`;
    } else {
      body = `<polygon points="62,14 138,14 186,62 186,138 138,186 62,186 14,138 14,62" fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/>
        <polygon points="67,26 133,26 174,67 174,133 133,174 67,174 26,133 26,67" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
        <g transform="translate(100 56) scale(1.1)">${PLANE}</g>
        <text x="100" y="96" text-anchor="middle" font-size="12" font-weight="700" letter-spacing="3">${label}</text>
        <text x="100" y="121" text-anchor="middle" font-size="20" font-weight="900" letter-spacing="1.2"${fitText(name, 140, 20)}>${esc(name)}</text>
        ${date ? `<text x="100" y="143" text-anchor="middle" font-size="15" font-weight="800" letter-spacing="1">${esc(date)}</text>` : ''}
        ${entry ? `<text x="100" y="160" text-anchor="middle" font-size="9" font-weight="700" letter-spacing="1"${fitText(entry, 104, 9)}>${esc(entry)}</text>` : ''}`;
    }
    return `<svg viewBox="0 0 200 200" style="color:${ink}" role="img" aria-label="${esc(`${c.name} ${date || ''}`.trim())}"><g filter="url(#rnrStampInk)" fill="currentColor" font-family="'Courier New', Courier, monospace">${body}</g></svg>`;
  }

  // ---------- Render ----------
  let lastKey = '';
  async function render() {
    const countries = visitedCountries();
    const saved = read();
    const auto = await firstPhotoDates();
    const list = countries.map(c => ({ c, info: { ...(saved[c.name] || {}), date: (saved[c.name] || {}).date || auto[c.id] || '' } }))
      .sort((a, b) => (a.info.date || '9999').localeCompare(b.info.date || '9999') || a.c.name.localeCompare(b.c.name));
    const key = JSON.stringify(list.map(x => [x.c.name, x.info])) + isAdmin();
    section.classList.toggle('has-stamps', list.length > 0);
    section.querySelector('[data-pp-count]').textContent = num(list.length);
    section.querySelector('.rnr-pp-count span').textContent = bn() ? 'দেশ' : (list.length === 1 ? 'country' : 'countries');
    if (key !== lastKey) {
      lastKey = key;
      grid.innerHTML = list.map(({ c, info }, i) => {
        const h = hash(c.name);
        const rot = ((h % 29) - 14);
        const dx = ((h >> 5) % 13) - 6, dy = ((h >> 9) % 13) - 6;
        return `<div class="rnr-stamp" role="listitem" style="--r:${rot}deg;--dx:${dx}px;--dy:${dy}px;--i:${i}" data-no-translate>
          <button type="button" class="rnr-stamp-open" data-pp-open="${esc(c.name)}" aria-label="${esc(bn() ? `${c.name} দেখুন` : `Open ${c.name}`)}">${stampSVG(c, info)}</button>
          <button type="button" class="rnr-stamp-edit" data-pp-edit="${esc(c.name)}" aria-label="Edit stamp for ${esc(c.name)}">✎</button>
        </div>`;
      }).join('') + `<button type="button" class="rnr-stamp-add" data-pp-add aria-label="Add a passport stamp"><span>+</span><b>Add a stamp</b><small>New country</small></button>`;
      if (seen) grid.querySelectorAll('.rnr-stamp').forEach(s => s.classList.add('is-in'));
    }
    window.RNR_PAGES?.refresh();
  }

  // Stamps "thud" onto the page the first time it is seen.
  let seen = false;
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    if (!entries.some(e => e.isIntersecting)) return;
    seen = true;
    grid.querySelectorAll('.rnr-stamp').forEach(s => s.classList.add('is-in'));
    io.disconnect();
  }, { threshold: 0.25 }) : null;
  if (io) io.observe(grid); else seen = true;

  section.addEventListener('click', e => {
    if (e.target.closest('[data-pp-add]') && isAdmin()) { addStamp(); return; }
    const edit = e.target.closest('[data-pp-edit]');
    if (edit && isAdmin()) { editStamp(edit.dataset.ppEdit); return; }
    const open = e.target.closest('[data-pp-open]');
    if (!open) return;
    window.RNR_PAGES?.show('travels');
    window.RNR_GLOBE?.openCountry(open.dataset.ppOpen);
  });

  async function editStamp(name) {
    const all = read();
    const cur = all[name] || {};
    const country = visitedCountries().find(c => c.name === name);
    const auto = country ? (await firstPhotoDates())[country.id] : '';
    window.RNR_OWNER_FORM?.({ eyebrow: 'PASSPORT STAMP', title: name, note: auto && !cur.date ? `Date from your oldest photo: ${stampDate(auto)}. Change it if you arrived earlier.` : '',
      fields: [
        { name: 'date', label: 'Date of arrival', type: 'date', value: cur.date || auto || '' },
        { name: 'entry', label: 'Entry point (optional)', value: cur.entry || '', placeholder: 'e.g. Toronto Pearson Airport', maxlength: 26 },
        { name: 'ink', label: 'Ink colour', type: 'select', options: ['Automatic', ...Object.keys(INKS)], value: cur.ink || 'Automatic' },
        { name: 'shape', label: 'Stamp shape', type: 'select', options: ['Automatic', ...Object.keys(SHAPE_NAMES)], value: cur.shape || 'Automatic' }
      ],
      save: d => {
        const rec = {};
        if (d.date && d.date !== auto) rec.date = d.date;
        if (d.entry.trim()) rec.entry = d.entry.trim();
        if (d.ink !== 'Automatic') rec.ink = d.ink;
        if (d.shape !== 'Automatic') rec.shape = d.shape;
        if (Object.keys(rec).length) all[name] = rec; else delete all[name];
        if (!write(all)) return false;
        lastKey = ''; render();
      },
      extraLabel: 'Remove stamp', extra: () => {
        if (!confirm(`Remove the ${name} stamp? ${name} will no longer be shown as visited. Photos are not deleted.`)) return false;
        delete all[name]; write(all); setVisited(name, false); lastKey = ''; render();
      }
    });
  }

  // ---------- Adding a new stamp ----------
  const GLOBE_LISTS = 'raselOnTheRunGlobeListsV1';
  const clean = v => (typeof cleanName === 'function' ? cleanName(v) : String(v || '').toLowerCase().trim());
  const archive = () => (typeof travelData !== 'undefined' && Array.isArray(travelData) ? travelData : []);
  function resolveCountry(input) {
    const text = String(input || '').replace(/^\S*[\u{1F1E6}-\u{1F1FF}]{2}\S*\s*/u, '').trim();
    if (!text) return null;
    const own = archive().find(c => clean(c.name) === clean(text));
    if (own) return own.name;
    const w = window.RNR_WORLD?.find(text);
    if (!w) return null;
    return archive().find(c => clean(c.name) === clean(w.name))?.name || w.name;
  }
  function readGlobeLists() {
    try { const v = JSON.parse(localStorage.getItem(GLOBE_LISTS) || 'null'); if (v && Array.isArray(v.visited)) return { visited: v.visited, wishlist: v.wishlist || [] }; } catch {}
    const all = window.RNR_GLOBE?.countries() || [];
    return { visited: all.filter(c => c.visited).map(c => c.name), wishlist: all.filter(c => c.wish).map(c => c.name) };
  }
  function setVisited(name, on) {
    const lists = readGlobeLists();
    lists.visited = lists.visited.filter(n => clean(n) !== clean(name));
    lists.wishlist = lists.wishlist.filter(n => clean(n) !== clean(name));
    if (on) lists.visited.push(name);
    else archive().forEach(c => { if (clean(c.name) === clean(name)) c.visited = false; });
    try { localStorage.setItem(GLOBE_LISTS, JSON.stringify(lists)); } catch {}
    if (!on && typeof saveData === 'function') saveData();
    window.RNR_GLOBE?.refresh();
  }
  function ensureInArchive(name) {
    if (archive().some(c => clean(c.name) === clean(name))) return;
    archive().push({ id: typeof createId === 'function' ? createId() : `c${Date.now().toString(36)}`, name, regions: [] });
    try { if (typeof sortCountries === 'function') sortCountries(); if (typeof saveData === 'function') saveData(); if (typeof renderCountries === 'function') renderCountries(); } catch (error) { console.error(error); }
  }
  function addStamp() {
    const stamped = new Set(visitedCountries().map(c => clean(c.name)));
    const names = [...new Set([...archive().map(c => c.name), ...(window.RNR_WORLD?.list || []).map(c => c.name)])]
      .filter(n => !stamped.has(clean(n))).sort((a, b) => a.localeCompare(b));
    const options = names.map(n => `<option value="${esc(n)}">`).join('');
    window.RNR_OWNER_FORM?.({ eyebrow: 'PASSPORT STAMP', title: 'Add a new stamp',
      note: 'The stamp is made from the country name. The country is also marked as visited on the globe and added to your Travel Destinations, so you can upload its photos later.',
      fields: [
        { name: 'country', label: 'Country', placeholder: 'Start typing, e.g. Switzerland', extraHTML: `<datalist id="rnrPpCountries">${options}</datalist><span class="rnr-pp-pick" aria-live="polite"></span>`,
          after: label => {
            const input = label.querySelector('input'); const pick = label.querySelector('.rnr-pp-pick');
            input.setAttribute('list', 'rnrPpCountries'); input.autocomplete = 'off';
            input.addEventListener('input', () => {
              const name = resolveCountry(input.value);
              pick.textContent = name ? `${window.RNR_WORLD?.flag(name) || (typeof getCountryFlag === 'function' ? getCountryFlag(name) : '')} ${name}${stamped.has(clean(name)) ? ' — already has a stamp' : ' ✓'}` : (input.value.trim() ? 'Pick a country from the list' : '');
              pick.classList.toggle('is-ok', Boolean(name));
            });
          } },
        { name: 'date', label: 'Date of arrival', type: 'date', value: '' },
        { name: 'entry', label: 'Entry point (optional)', value: '', placeholder: 'e.g. Zurich Airport', maxlength: 26 },
        { name: 'ink', label: 'Ink colour', type: 'select', options: ['Automatic', ...Object.keys(INKS)], value: 'Automatic' },
        { name: 'shape', label: 'Stamp shape', type: 'select', options: ['Automatic', ...Object.keys(SHAPE_NAMES)], value: 'Automatic' }
      ],
      save: d => {
        const name = resolveCountry(d.country);
        if (!name) { alert('Please choose a country from the list (for example: Switzerland, Czechia, Belgium).'); return false; }
        const all = read();
        const rec = { ...(all[name] || {}) };
        if (d.date) rec.date = d.date;
        if (d.entry.trim()) rec.entry = d.entry.trim();
        if (d.ink !== 'Automatic') rec.ink = d.ink;
        if (d.shape !== 'Automatic') rec.shape = d.shape;
        if (Object.keys(rec).length) all[name] = rec;
        if (!write(all)) return false;
        ensureInArchive(name);
        setVisited(name, true);
        lastKey = ''; seen = true;
        render().then(() => {
          const el = [...grid.querySelectorAll('[data-pp-open]')].find(b => b.dataset.ppOpen === name)?.closest('.rnr-stamp');
          if (el) { el.classList.add('is-new'); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => el.classList.remove('is-new'), 1600); }
        });
      }
    });
  }

  addEventListener('rnr:globe-changed', () => render());
  addEventListener('rnr:photos-changed', () => render());
  addEventListener('rnr:language', () => { lastKey = ''; render(); });
  let lastAdmin = isAdmin();
  new MutationObserver(() => { if (isAdmin() !== lastAdmin) { lastAdmin = isAdmin(); render(); } }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  window.RNR_PASSPORT = {
    render, add: addStamp,
    stampHTML: name => { const c = visitedCountries().find(x => x.name === name); if (!c) return ''; const info = read()[name] || {}; return stampSVG(c, info); }
  };
  setTimeout(render, 600);
})();

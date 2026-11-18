/* =====================================================================
   RASEL ON THE RUN — FOOD DIARY (Stories page)
   What I ate, where, when, and how good it was. Each dish has a photo,
   a place, a date, a 1–5 star rating and a short note.
   Admin mode: "+ Add food", and Edit / Delete in the photo viewer.
   Stored in IndexedDB RaselOnTheRunFoodDiaryV1 / dishes (published).
   ===================================================================== */
(() => {
  'use strict';
  const main = document.querySelector('main');
  if (!main || document.getElementById('rnrFood')) return;
  const DB = 'RaselOnTheRunFoodDiaryV1', STORE = 'dishes';
  const isAdmin = () => document.body.classList.contains('admin-mode');
  const bn = () => document.documentElement.lang === 'bn';
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const openDB = () => new Promise((res, rej) => { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(STORE)) r.result.createObjectStore(STORE, { keyPath: 'id' }); }; r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const run = async (mode, fn) => { const db = await openDB(); return new Promise((res, rej) => { const t = db.transaction(STORE, mode); const out = fn(t.objectStore(STORE)); t.oncomplete = () => { db.close(); res(out?.result ?? out); }; t.onerror = () => { db.close(); rej(t.error); }; }); };

  const RATINGS = ['★★★★★  Loved it', '★★★★  Really good', '★★★  Good', '★★  Okay', '★  Not for me'];
  const ratingLabel = n => ({ 5: ['Loved it', 'দারুণ লেগেছে'], 4: ['Really good', 'খুব ভালো'], 3: ['Good', 'ভালো'], 2: ['Okay', 'মোটামুটি'], 1: ['Not for me', 'আমার পছন্দ না'] }[n] || ['', ''])[bn() ? 1 : 0];
  const stars = n => `<span class="rnr-food-stars" aria-label="${n} of 5">${'★'.repeat(n)}<i>${'★'.repeat(5 - n)}</i></span>`;
  const fmt = iso => { if (!iso) return ''; const d = new Date(`${iso}T12:00:00`); return isNaN(d) ? '' : d.toLocaleDateString(bn() ? 'bn-BD' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }); };
  const PAGE = 12;
  const localToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

  const section = document.createElement('section');
  section.id = 'rnrFood';
  section.className = 'section rnr-food-section';
  section.innerHTML = `
    <div class="section-heading"><div><p class="eyebrow">FOOD DIARY</p><h2>Tastes from the road</h2><p>What I ate, where I ate it, and whether I would go back for more.</p></div>
      <button type="button" class="rnr-owner-pill is-solid" data-food-add>+ Add food</button></div>
    <div class="rnr-food-filters" role="toolbar" aria-label="Filter by country"></div>
    <div class="rnr-food-grid"></div>
    <div class="rnr-food-more"><button type="button" class="rnr-see-all-link" data-food-more>Show more dishes</button></div>
    <p class="rnr-food-hint">Add a dish with a photo, the place and a rating. Only you can see this message.</p>`;
  (document.getElementById('rnrStories') || main).after(section);

  let dishes = [], urls = [], filter = 'all', shown = PAGE;
  async function load() {
    try { dishes = (await run('readonly', s => s.getAll())).filter(d => d && d.name); } catch { dishes = []; }
    dishes.sort((a, b) => String(b.date || b.createdAt).localeCompare(String(a.date || a.createdAt)));
  }
  const visible = () => dishes.filter(d => filter === 'all' || d.country === filter);

  function render() {
    urls.forEach(u => URL.revokeObjectURL(u)); urls = [];
    const countries = [...new Set(dishes.map(d => d.country).filter(Boolean))];
    if (filter !== 'all' && !countries.includes(filter)) filter = 'all';
    const filters = section.querySelector('.rnr-food-filters');
    filters.innerHTML = countries.length > 1 ? [['all', bn() ? 'সব' : 'All'], ...countries.map(c => [c, c])].map(([v, l]) => {
      const flag = v !== 'all' && typeof getCountryFlag === 'function' ? getCountryFlag(v) : '';
      return `<button type="button" data-food-filter="${esc(v)}" class="${v === filter ? 'is-active' : ''}">${flag ? `<span aria-hidden="true">${esc(flag)}</span> ` : ''}${esc(l)}</button>`;
    }).join('') : '';
    const list = visible();
    section.querySelector('.rnr-food-grid').innerHTML = list.slice(0, shown).map((d, i) => {
      let img = '';
      if (d.photo instanceof Blob) { const u = URL.createObjectURL(d.photo); urls.push(u); img = `<img src="${u}" alt="${esc(d.name)}" loading="lazy" data-no-archive-watermark>`; }
      const where = [d.place, d.country].filter(Boolean).join(', ');
      return `<article class="rnr-food-card" style="--i:${i % PAGE}">
        <button type="button" class="rnr-food-photo" data-food-open="${i}" aria-label="${esc(d.name)}">${img || '<span class="rnr-food-noimg" aria-hidden="true">🍽</span>'}
          ${d.rating ? `<span class="rnr-food-badge">${esc(ratingLabel(d.rating))}</span>` : ''}</button>
        <div class="rnr-food-body">
          <h3 data-no-translate>${esc(d.name)}</h3>
          <p class="rnr-food-where" data-no-translate>${where ? `<span aria-hidden="true">📍</span> ${esc(where)}` : ''}</p>
          <div class="rnr-food-meta">${d.rating ? stars(d.rating) : ''}<time>${esc(fmt(d.date))}</time></div>
          ${d.note ? `<p class="rnr-food-note" data-no-translate>${esc(d.note)}</p>` : ''}
          <button type="button" class="rnr-owner-pill" data-food-edit="${esc(d.id)}">Edit</button>
        </div>
      </article>`;
    }).join('');
    section.querySelector('.rnr-food-more').hidden = list.length <= shown;
    section.classList.toggle('has-items', dishes.length > 0);
    window.RNR_PAGES?.refresh();
  }

  function viewerItems(list) {
    return list.map(d => { let u = ''; return {
      load: async () => (u || (d.photo instanceof Blob ? (u = URL.createObjectURL(d.photo)) : '')),
      caption: d.name,
      meta: [
        [d.place, d.country].filter(Boolean).length && { icon: '📍', text: [d.place, d.country].filter(Boolean).join(', ') },
        d.date && { icon: '📅', text: fmt(d.date) },
        d.rating && { icon: '★', text: `${'★'.repeat(d.rating)} ${ratingLabel(d.rating)}` },
        d.note && { icon: '✎', text: d.note }
      ].filter(Boolean),
      actions: [
        { label: 'Edit', ownerOnly: true, run: (item, ctl) => { ctl.close(); edit(d); } },
        { label: 'Delete', ownerOnly: true, danger: true, run: async (item, ctl) => { if (!confirm(`Delete "${d.name}"?`)) return; await run('readwrite', s => s.delete(d.id)); ctl.remove(); await refresh(); } }
      ]
    }; });
  }

  function countryOptions(current) {
    const names = typeof travelData !== 'undefined' ? travelData.map(c => c.name) : [];
    const visited = (window.RNR_GLOBE?.countries() || []).filter(c => c.visited).map(c => c.name);
    const rest = names.filter(n => !visited.includes(n)).sort();
    const all = ['—', ...visited, ...rest];
    if (current && !all.includes(current)) all.push(current);
    return all;
  }

  function edit(d) {
    const shrink = f => (window.RNR_SHRINK ? window.RNR_SHRINK(f).catch(() => f) : f);
    window.RNR_OWNER_FORM?.({ eyebrow: 'FOOD DIARY', title: d ? 'Edit dish' : 'Add a dish', fields: [
      { name: 'name', label: 'Dish name', value: d?.name || '', placeholder: 'e.g. Kacchi biryani', maxlength: 70 },
      { name: 'place', label: 'Restaurant / city', value: d?.place || '', placeholder: 'e.g. Star Kabab, Dhaka', maxlength: 80 },
      { name: 'country', label: 'Country', type: 'select', options: countryOptions(d?.country), value: d?.country || '—' },
      { name: 'date', label: 'Date', type: 'date', value: d?.date || localToday() },
      { name: 'rating', label: 'How was it?', type: 'select', options: RATINGS, value: RATINGS[5 - (d?.rating || 5)] },
      { name: 'note', label: 'Short note (optional)', type: 'textarea', rows: 3, value: d?.note || '', placeholder: 'What did it taste like? Would you go back?', maxlength: 400 },
      { name: 'photo', label: d ? 'Photo (choose to replace)' : 'Photo', type: 'file', accept: 'image/*' }
    ], save: async f => {
      if (!f.name.trim()) { alert('Please add the name of the dish.'); return false; }
      const file = f.photo?.[0];
      const rec = { ...(d || { id: `food-${Date.now()}`, createdAt: new Date().toISOString() }),
        name: f.name.trim(), place: f.place.trim(), country: f.country === '—' ? '' : f.country, date: f.date || '',
        rating: 5 - RATINGS.indexOf(f.rating), note: f.note.trim() };
      if (file) rec.photo = await shrink(file);
      try { await run('readwrite', s => s.put(rec)); } catch { alert('Could not save. Browser storage may be full.'); return false; }
      await refresh();
    }, extraLabel: d ? 'Delete' : undefined, extra: d ? async () => { if (!confirm(`Delete "${d.name}"?`)) return false; await run('readwrite', s => s.delete(d.id)); await refresh(); } : undefined });
  }

  section.addEventListener('click', e => {
    const f = e.target.closest('[data-food-filter]');
    if (f) { filter = f.dataset.foodFilter; shown = PAGE; render(); return; }
    if (e.target.closest('[data-food-more]')) { shown += PAGE; render(); return; }
    if (e.target.closest('[data-food-add]') && isAdmin()) { edit(null); return; }
    const ed = e.target.closest('[data-food-edit]');
    if (ed && isAdmin()) { edit(dishes.find(d => d.id === ed.dataset.foodEdit)); return; }
    const o = e.target.closest('[data-food-open]');
    if (o) { const list = visible(); window.RNR_VIEWER?.open(viewerItems(list), Number(o.dataset.foodOpen)); }
  });

  async function refresh() { await load(); render(); }
  addEventListener('rnr:language', () => render());
  window.RNR_FOOD = { refresh, all: () => dishes.slice() };
  setTimeout(refresh, 300);
})();

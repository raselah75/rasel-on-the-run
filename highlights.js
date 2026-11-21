/* =====================================================================
   RASEL ON THE RUN — STORY HIGHLIGHTS (Instagram-style)
   A row of round highlights above "My Destinations" (Home and Travel
   Destinations): a colourful ring, a cover photo and a name with a flag.
   Tap one to watch its best photos like a story — progress bars, tap
   left / right, hold to pause, swipe down (or Esc) to close, swipe
   sideways for the next highlight.

   Before you make your own, highlights are built automatically: one per
   country that has photos (your favourites first).
   Admin mode: "＋ New" circle and "✎" on every highlight —
     name, flag / emoji, ring colour, choose the best photos from your
     archive (tap in the order you want) or upload new ones, move left /
     right, delete. Saved in raselOnTheRunHighlightsV1 (names / order) and
     the RaselOnTheRunHighlightsV1 database (uploaded photos). Both are
     included in Publish.
   ===================================================================== */
(() => {
  'use strict';
  const section = document.getElementById('destinations');
  if (!section || document.getElementById('rnrHighlights')) return;
  const KEY = 'raselOnTheRunHighlightsV1';
  const DB = 'RaselOnTheRunHighlightsV1';
  const STORE = 'media';
  const isAdmin = () => document.body.classList.contains('admin-mode');
  const bn = () => document.documentElement.lang === 'bn';
  const T = (en, b) => (bn() ? b : en);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => `hl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const RINGS = {
    insta: ['Instagram', 'linear-gradient(45deg, #feda75, #fa7e1e 30%, #d62976 60%, #962fbf 80%, #4f5bd5)'],
    sunset: ['Sunset', 'linear-gradient(45deg, #f6c46f, #ee8456 50%, #d9466f)'],
    ocean: ['Ocean', 'linear-gradient(45deg, #5cc0c9, #1d6b74 50%, #2f6fb0)'],
    forest: ['Forest', 'linear-gradient(45deg, #c6e06a, #3f8a4f 55%, #1d6b74)'],
    berry: ['Berry', 'linear-gradient(45deg, #ffb3c7, #d62976 50%, #7a4fb0)'],
    gold: ['Gold', 'linear-gradient(45deg, #fff1b8, #f6c46f 45%, #c98a2b)']
  };
  const RING_ORDER = Object.keys(RINGS);
  const MAX_AUTO = 15;

  // ---------- storage ----------
  const readList = () => { try { const d = JSON.parse(localStorage.getItem(KEY) || 'null'); return Array.isArray(d?.list) ? d.list : null; } catch { return null; } };
  const writeList = list => { try { localStorage.setItem(KEY, JSON.stringify({ list })); } catch (e) { alert(T('Could not save (storage is full).', 'সেভ করা গেল না (স্টোরেজ ভর্তি)।')); throw e; } };
  function openDB() {
    return new Promise((resolve, reject) => {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(STORE)) r.result.createObjectStore(STORE, { keyPath: 'id' }); };
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  }
  async function dbAll() { try { const db = await openDB(); return await new Promise((res, rej) => { const q = db.transaction(STORE).objectStore(STORE).getAll(); q.onsuccess = () => { db.close(); res(q.result || []); }; q.onerror = () => { db.close(); rej(q.error); }; }); } catch { return []; } }
  async function dbPut(rec) { const db = await openDB(); return new Promise((res, rej) => { const tx = db.transaction(STORE, 'readwrite'); tx.objectStore(STORE).put(rec); tx.oncomplete = () => { db.close(); res(); }; tx.onerror = () => { db.close(); rej(tx.error); }; }); }
  async function dbDelete(ids) { if (!ids.length) return; const db = await openDB(); return new Promise(res => { const tx = db.transaction(STORE, 'readwrite'); ids.forEach(id => tx.objectStore(STORE).delete(id)); tx.oncomplete = () => { db.close(); res(); }; tx.onerror = () => { db.close(); res(); }; }); }
  const archivePhotos = async () => { try { return ((await window.RNR_GALLERY?.allPhotos?.()) || []).filter(p => p.blob && /^image\//.test(p.type || p.blob.type || '')); } catch { return []; } };
  const countries = () => { try { return Array.isArray(travelData) ? travelData : []; } catch { return []; } };
  const flagFor = name => window.RNR_WORLD?.flag?.(name) || countries().find(c => c.name === name)?.flag || '';

  // ---------- data → highlights ----------
  let photos = [], own = [], urls = new Map(), highlights = [], auto = true;
  const urlOf = (kind, rec) => { const k = `${kind}:${rec.id}`; if (!urls.has(k)) urls.set(k, URL.createObjectURL(rec.blob)); return urls.get(k); };
  function resolveItem(it) {
    if (it.k === 'p') { const p = photos.find(x => x.id === it.id); if (!p) return null; return { url: urlOf('p', p), caption: (window.RNR_GALLERY?.viewerItem?.(p, {})?.caption) || p.caption || '', place: window.RNR_GALLERY?.placeLine?.(p) || '', date: window.RNR_GALLERY?.dateOf?.(p)?.date || null }; }
    const m = own.find(x => x.id === it.id); if (!m) return null; return { url: urlOf('h', m), caption: m.caption || '', place: '', date: m.date ? new Date(m.date) : null };
  }
  function buildAuto() {
    const byCountry = new Map();
    photos.forEach(p => { if (p.countryId) { if (!byCountry.has(p.countryId)) byCountry.set(p.countryId, []); byCountry.get(p.countryId).push(p); } });
    const order = countries().map(c => c.id);
    return [...byCountry.entries()]
      .sort((a, b) => (order.indexOf(a[0]) - order.indexOf(b[0])))
      .map(([cid, list], i) => {
        const c = countries().find(x => x.id === cid);
        list.sort((a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0) || String(b.takenAt || b.uploadedAt || '').localeCompare(String(a.takenAt || a.uploadedAt || '')));
        return { id: `auto-${cid}`, title: c?.name || 'Travel', flag: flagFor(c?.name), ring: RING_ORDER[i % RING_ORDER.length], items: list.slice(0, MAX_AUTO).map(p => ({ k: 'p', id: p.id })), auto: true };
      });
  }
  async function load() {
    [photos, own] = await Promise.all([archivePhotos(), dbAll()]);
    urls.forEach(u => URL.revokeObjectURL(u)); urls = new Map();
    const saved = readList();
    auto = !saved;
    highlights = (saved || buildAuto()).map(h => ({ ...h, items: (h.items || []).filter(it => resolveItem(it)) }));
  }

  // ---------- row ----------
  const row = document.createElement('div');
  row.id = 'rnrHighlights';
  row.className = 'rnr-hl';
  row.setAttribute('role', 'list');
  section.prepend(row);
  function cover(h) { const it = h.items.find(x => x.id === h.coverId) || h.items[0]; return it ? resolveItem(it)?.url : ''; }
  function draw() {
    const admin = isAdmin();
    const visible = highlights.filter(h => h.items.length || admin);
    row.hidden = !visible.length && !admin;
    row.setAttribute('aria-label', T('Story highlights', 'স্টোরি হাইলাইট'));
    row.innerHTML = `<div class="rnr-hl-track">${visible.map(h => {
      const c = cover(h);
      return `<div class="rnr-hl-item" role="listitem"><button type="button" class="rnr-hl-open" data-hl="${esc(h.id)}" ${h.items.length ? '' : 'disabled'} aria-label="${esc(`${h.title} — ${h.items.length} ${T('photos', 'ছবি')}`)}">
        <span class="rnr-hl-ring${seen.has(h.id) ? ' is-seen' : ''}" style="--ring:${RINGS[h.ring]?.[1] || RINGS.insta[1]}"><span class="rnr-hl-pic">${c ? `<img src="${c}" alt="" loading="lazy" decoding="async">` : '<span class="rnr-hl-empty">＋</span>'}</span></span>
        <span class="rnr-hl-name" data-no-translate>${esc(h.title)}${h.flag ? ` <span class="rnr-hl-flag">${esc(h.flag)}</span>` : ''}</span></button>
        ${admin ? `<button type="button" class="rnr-hl-edit" data-hl-edit="${esc(h.id)}" aria-label="${esc(T(`Edit ${h.title}`, `${h.title} এডিট`))}">✎</button>` : ''}</div>`;
    }).join('')}${admin ? `<div class="rnr-hl-item" role="listitem"><button type="button" class="rnr-hl-open rnr-hl-new" data-hl-new><span class="rnr-hl-ring is-new"><span class="rnr-hl-pic"><span class="rnr-hl-empty">＋</span></span></span><span class="rnr-hl-name">${T('New', 'নতুন')}</span></button></div>` : ''}</div>
      ${admin && auto && highlights.length ? `<p class="rnr-hl-hint">${T('These highlights are made automatically from your countries. Tap ✎ to choose the best photos — then they become yours.', 'এই হাইলাইটগুলো আপনার দেশগুলোর ছবি থেকে নিজে থেকেই তৈরি। ✎ চাপলে সেরা ছবি বেছে নিতে পারবেন।')}</p>` : ''}`;
  }
  const seen = new Set();
  async function refresh() { if (view || editor) return; await load(); if (!view && !editor) draw(); }
  row.addEventListener('click', e => {
    const edit = e.target.closest('[data-hl-edit]');
    if (edit) { openEditor(edit.dataset.hlEdit); return; }
    if (e.target.closest('[data-hl-new]')) { openEditor(null); return; }
    const b = e.target.closest('[data-hl]');
    if (b) openViewer(highlights.findIndex(h => h.id === b.dataset.hl));
  });

  // Only at the country list (not inside a country).
  function placeRow() {
    let level = 'countries';
    try { level = archiveLevel; } catch {}
    row.classList.toggle('is-off', level !== 'countries');
  }
  const prev = window.renderCountries || (typeof renderCountries === 'function' ? renderCountries : null);
  if (prev) {
    const wrapped = function (...args) { const r = prev.apply(this, args); placeRow(); return r; };
    try { renderCountries = wrapped; } catch {}
    window.renderCountries = wrapped;
  }

  // ---------- story viewer ----------
  let view = null;
  const DURATION = 5000;
  function openViewer(index) {
    if (index < 0 || !highlights[index]?.items.length) return;
    closeViewer(true);
    const el = document.createElement('div');
    el.className = 'rnr-story';
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
    el.innerHTML = `<div class="rnr-story-bg"></div><div class="rnr-story-frame">
      <div class="rnr-story-bars"></div>
      <div class="rnr-story-head"><span class="rnr-story-avatar"></span><div class="rnr-story-who"><b data-no-translate></b><small></small></div>
        <button type="button" class="rnr-story-pause" aria-label="Pause">❚❚</button><button type="button" class="rnr-story-close" aria-label="Close">✕</button></div>
      <img class="rnr-story-img" alt="">
      <div class="rnr-story-cap" data-no-translate></div>
      <button type="button" class="rnr-story-prev" aria-label="Previous photo"></button><button type="button" class="rnr-story-next" aria-label="Next photo"></button></div>`;
    document.body.append(el);
    document.body.classList.add('rnr-story-lock');
    view = { el, h: index, i: 0, start: 0, elapsed: 0, paused: false, raf: 0, last: document.activeElement };
    el.querySelector('.rnr-story-close').addEventListener('click', () => closeViewer());
    el.querySelector('.rnr-story-pause').addEventListener('click', () => setPause(!view.paused, true));
    el.querySelector('.rnr-story-prev').addEventListener('click', () => step(-1));
    el.querySelector('.rnr-story-next').addEventListener('click', () => step(1));
    // hold to pause, swipe down to close, swipe sideways for the next highlight
    let sx = 0, sy = 0, t0 = 0, holding = 0;
    const frame = el.querySelector('.rnr-story-frame');
    frame.addEventListener('pointerdown', e => { if (e.target.closest('.rnr-story-head')) return; sx = e.clientX; sy = e.clientY; t0 = Date.now(); holding = setTimeout(() => setPause(true), 220); });
    const end = e => {
      clearTimeout(holding);
      if (!t0) return;
      const dx = e.clientX - sx, dy = e.clientY - sy, held = Date.now() - t0 > 220; t0 = 0;
      if (dy > 90 && Math.abs(dy) > Math.abs(dx)) { closeViewer(); return; }
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy)) { jump(dx < 0 ? 1 : -1); return; }
      if (held) { setPause(false); e.preventDefault(); }
    };
    frame.addEventListener('pointerup', end); frame.addEventListener('pointercancel', end);
    frame.addEventListener('click', e => { if (view?.suppress) { e.stopPropagation(); e.preventDefault(); view.suppress = false; } }, true);
    show();
    el.querySelector('.rnr-story-close').focus();
  }
  function setPause(p, byButton) {
    if (!view) return;
    if (p === view.paused) return;
    view.paused = p;
    if (p) view.elapsed += performance.now() - view.start; else view.start = performance.now();
    if (!byButton && !p) view.suppress = true;
    const b = view.el.querySelector('.rnr-story-pause'); b.textContent = p ? '▶' : '❚❚'; b.setAttribute('aria-label', p ? 'Play' : 'Pause');
    view.el.classList.toggle('is-paused', p);
  }
  function show() {
    const h = highlights[view.h], it = resolveItem(h.items[view.i]);
    seen.add(h.id);
    const el = view.el;
    el.style.setProperty('--ring', RINGS[h.ring]?.[1] || RINGS.insta[1]);
    el.querySelector('.rnr-story-bars').innerHTML = h.items.map((_, k) => `<span><i style="width:${k < view.i ? 100 : 0}%"></i></span>`).join('');
    el.querySelector('.rnr-story-avatar').innerHTML = cover(h) ? `<img src="${cover(h)}" alt="">` : '';
    el.querySelector('.rnr-story-who b').textContent = `${h.title}${h.flag ? ` ${h.flag}` : ''}`;
    el.querySelector('.rnr-story-who small').textContent = `${view.i + 1} / ${h.items.length}${it?.date && !isNaN(it.date) ? ` · ${it.date.toLocaleDateString(bn() ? 'bn-BD' : 'en-US', { month: 'short', year: 'numeric' })}` : ''}`;
    const img = el.querySelector('.rnr-story-img');
    img.src = it?.url || ''; img.alt = it?.caption || it?.place || h.title;
    el.querySelector('.rnr-story-bg').style.backgroundImage = it?.url ? `url("${it.url}")` : '';
    const cap = [it?.caption, it?.place].filter(Boolean);
    el.querySelector('.rnr-story-cap').innerHTML = cap.length ? `${it.caption ? `<p>${esc(it.caption)}</p>` : ''}${it.place ? `<small>📍 ${esc(it.place)}</small>` : ''}` : '';
    el.setAttribute('aria-label', `${h.title}: ${T('photo', 'ছবি')} ${view.i + 1} / ${h.items.length}`);
    // preload next
    const nx = h.items[view.i + 1]; if (nx) { const p = new Image(); p.src = resolveItem(nx)?.url || ''; }
    view.elapsed = 0; view.start = performance.now();
    cancelAnimationFrame(view.raf);
    const bar = el.querySelectorAll('.rnr-story-bars i')[view.i];
    const tick = () => {
      if (!view) return;
      const t = view.paused ? view.elapsed : view.elapsed + performance.now() - view.start;
      if (bar) bar.style.width = `${Math.min(100, (t / DURATION) * 100)}%`;
      if (t >= DURATION && !reduce()) { step(1); return; }
      view.raf = requestAnimationFrame(tick);
    };
    view.raf = requestAnimationFrame(tick);
  }
  function step(d) {
    if (!view) return;
    const h = highlights[view.h];
    const n = view.i + d;
    if (n < 0) { if (view.h > 0) { jump(-1); } else { view.i = 0; show(); } return; }
    if (n >= h.items.length) { jump(1); return; }
    view.i = n; setPause(false, true); show();
  }
  function jump(d) {
    let n = view.h + d;
    while (n >= 0 && n < highlights.length && !highlights[n].items.length) n += d;
    if (n < 0 || n >= highlights.length) { closeViewer(); return; }
    view.h = n; view.i = 0; setPause(false, true); show();
  }
  function closeViewer(silent) {
    if (!view) return;
    cancelAnimationFrame(view.raf);
    const last = view.last;
    view.el.remove(); view = null;
    document.body.classList.remove('rnr-story-lock');
    if (!silent) { draw(); last?.focus?.(); }
  }
  addEventListener('keydown', e => {
    if (!view) return;
    if (e.key === 'Escape') { e.stopImmediatePropagation(); closeViewer(); }
    else if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === ' ') { e.preventDefault(); setPause(!view.paused, true); }
  }, true);
  document.addEventListener('visibilitychange', () => { if (view && document.hidden) setPause(true, true); });

  // ---------- editor (owner) ----------
  let editor = null;
  function closeEditor() { editor?.el.remove(); editor = null; document.body.classList.remove('rnr-story-lock'); }
  async function openEditor(id) {
    if (!isAdmin()) return;
    await load();
    const existing = highlights.find(h => h.id === id);
    const h = existing ? JSON.parse(JSON.stringify(existing)) : { id: uid(), title: '', flag: '', ring: RING_ORDER[highlights.length % RING_ORDER.length], items: [] };
    const el = document.createElement('div');
    el.className = 'rnr-hl-editor';
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Highlight');
    const countryOptions = countries().map(c => `<option value="${esc(c.name)}">${esc(flagFor(c.name))} ${esc(c.name)}</option>`).join('');
    el.innerHTML = `<form class="rnr-hle-card" novalidate>
      <div class="rnr-hle-top"><div><p class="rnr-hle-eyebrow">STORY HIGHLIGHT</p><h3>${existing ? 'Edit highlight' : 'New highlight'}</h3></div><button type="button" class="rnr-hle-x" aria-label="Close">✕</button></div>
      <div class="rnr-hle-grid2">
        <label>Name<input name="title" maxlength="24" required placeholder="e.g. Canada" value="${esc(h.title)}" list="rnrHleCountries"><datalist id="rnrHleCountries">${countryOptions}</datalist></label>
        <label>Flag or emoji<input name="flag" maxlength="8" placeholder="🇨🇦 or ✈️" value="${esc(h.flag)}"></label>
      </div>
      <fieldset class="rnr-hle-rings"><legend>Ring colour</legend>${RING_ORDER.map(k => `<label><input type="radio" name="ring" value="${k}" ${h.ring === k ? 'checked' : ''}><span style="--ring:${RINGS[k][1]}" title="${RINGS[k][0]}"></span></label>`).join('')}</fieldset>
      <div class="rnr-hle-pickhead"><b>Choose the best photos</b><small>Tap in the order you want them to play. The first one is the cover.</small></div>
      <div class="rnr-hle-filter"><select name="filter"><option value="">All my photos</option>${countries().filter(c => photos.some(p => p.countryId === c.id)).map(c => `<option value="${esc(c.id)}">${esc(flagFor(c.name))} ${esc(c.name)}</option>`).join('')}<option value="__own">Uploaded here</option></select>
        <label class="rnr-hle-upload">＋ Upload new photos<input type="file" accept="image/*" multiple hidden></label></div>
      <div class="rnr-hle-pick" role="group" aria-label="Photos"></div>
      <p class="rnr-hle-count"></p>
      <div class="rnr-hle-actions">
        ${existing ? '<button type="button" class="rnr-hle-del">Delete</button><button type="button" class="rnr-hle-move" data-move="-1" aria-label="Move left">←</button><button type="button" class="rnr-hle-move" data-move="1" aria-label="Move right">→</button>' : ''}
        <span></span><button type="button" class="rnr-hle-cancel">Cancel</button><button type="submit" class="rnr-hle-save">Save</button></div>
    </form>`;
    document.body.append(el);
    document.body.classList.add('rnr-story-lock');
    editor = { el, h, existing, uploads: [] };
    const form = el.querySelector('form');
    const pick = el.querySelector('.rnr-hle-pick');
    const key = it => `${it.k}:${it.id}`;
    function drawPick() {
      const f = form.filter.value;
      const pool = f === '__own' ? own.map(m => ({ k: 'h', id: m.id })) : photos.filter(p => !f || p.countryId === f).map(p => ({ k: 'p', id: p.id }));
      const chosen = h.items.map(key);
      pick.innerHTML = pool.length ? pool.map(it => {
        const r = resolveItem(it); if (!r) return '';
        const n = chosen.indexOf(key(it));
        return `<button type="button" class="rnr-hle-ph${n >= 0 ? ' is-on' : ''}" data-k="${it.k}" data-id="${esc(it.id)}" aria-pressed="${n >= 0}"><img src="${r.url}" alt="${esc(r.caption || r.place || 'Photo')}" loading="lazy"><span>${n >= 0 ? n + 1 : ''}</span></button>`;
      }).join('') : '<p class="rnr-hle-none">No photos here yet — upload some with “＋ Upload new photos”.</p>';
      el.querySelector('.rnr-hle-count').textContent = `${h.items.length} selected${h.items.length > 30 ? ' — tip: 5 to 15 photos make the best highlight' : ''}`;
    }
    pick.addEventListener('click', e => {
      const b = e.target.closest('.rnr-hle-ph'); if (!b) return;
      const k = `${b.dataset.k}:${b.dataset.id}`, i = h.items.findIndex(it => key(it) === k);
      if (i >= 0) h.items.splice(i, 1); else h.items.push({ k: b.dataset.k, id: b.dataset.id });
      drawPick();
    });
    form.filter.addEventListener('change', drawPick);
    form.title.addEventListener('change', () => { if (!form.flag.value.trim()) { const f = flagFor(form.title.value.trim()); if (f) form.flag.value = f; } });
    el.querySelector('.rnr-hle-upload input').addEventListener('change', async e => {
      const files = [...e.target.files].filter(f => /^image\//.test(f.type));
      for (const f of files) {
        const rec = { id: uid(), blob: f, type: f.type, name: f.name, caption: '', date: f.lastModified ? new Date(f.lastModified).toISOString() : '' };
        try {
          const shot = await window.RNR_GALLERY?.exifDate?.(f); if (shot) rec.date = new Date(shot).toISOString();
        } catch {}
        await dbPut(rec); own.push(rec); editor.uploads.push(rec.id); h.items.push({ k: 'h', id: rec.id });
      }
      e.target.value = '';
      drawPick();
    });
    const close = async () => { if (editor.uploads.length) { await dbDelete(editor.uploads); own = own.filter(m => !editor.uploads.includes(m.id)); } closeEditor(); };
    el.querySelector('.rnr-hle-x').addEventListener('click', close);
    el.querySelector('.rnr-hle-cancel').addEventListener('click', close);
    el.addEventListener('click', e => { if (e.target === el) close(); });
    el.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } });
    // The first edit turns the automatic list into your own list.
    const baseList = () => highlights.map(x => ({ id: x.auto ? uid() : x.id, title: x.title, flag: x.flag, ring: x.ring, items: x.items, coverId: x.coverId }));
    const keepIds = () => new Set(readList()?.flatMap(x => x.items.filter(it => it.k === 'h').map(it => it.id)) || []);
    async function cleanOrphans() { const used = keepIds(); await dbDelete(own.filter(m => !used.has(m.id)).map(m => m.id)); }
    el.querySelector('.rnr-hle-del')?.addEventListener('click', async () => {
      if (!confirm(`Delete the highlight “${h.title}”? Photos in your archive are not deleted.`)) return;
      const idx = highlights.findIndex(x => x.id === h.id);
      const list = baseList(); list.splice(idx, 1);
      writeList(list); editor.uploads = []; await cleanOrphans(); closeEditor(); refresh();
    });
    el.querySelectorAll('.rnr-hle-move').forEach(b => b.addEventListener('click', () => {
      const idx = highlights.findIndex(x => x.id === h.id), to = idx + Number(b.dataset.move);
      if (to < 0 || to >= highlights.length) return;
      const list = baseList(); const [m] = list.splice(idx, 1); list.splice(to, 0, m);
      writeList(list); editor.uploads = []; closeEditor(); refresh();
    }));
    form.addEventListener('submit', async e => {
      e.preventDefault();
      h.title = form.title.value.trim(); h.flag = form.flag.value.trim(); h.ring = form.ring.value || h.ring;
      if (!h.title) { form.title.focus(); form.title.setCustomValidity('Please add a name'); form.title.reportValidity(); form.title.setCustomValidity(''); return; }
      if (!h.items.length) { alert('Choose at least one photo.'); return; }
      const list = baseList();
      const rec = { id: h.auto ? uid() : h.id, title: h.title, flag: h.flag, ring: h.ring, items: h.items };
      const idx = existing ? highlights.findIndex(x => x.id === existing.id) : -1;
      if (idx >= 0) list[idx] = rec; else list.push(rec);
      writeList(list); editor.uploads = []; await cleanOrphans(); closeEditor(); refresh();
    });
    drawPick();
    form.title.focus();
  }

  // ---------- keep fresh ----------
  let t = 0;
  const later = () => { clearTimeout(t); t = setTimeout(refresh, 400); };
  let lastAdmin = isAdmin();
  new MutationObserver(() => { if (isAdmin() !== lastAdmin) { lastAdmin = isAdmin(); later(); } }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  const gal = document.getElementById('memoryGallery'); if (gal) new MutationObserver(later).observe(gal, { childList: true });
  addEventListener('storage', e => { if (e.key === KEY) later(); });
  addEventListener('rnr:language', draw);
  window.RNR_HIGHLIGHTS = { refresh, open: i => openViewer(i), list: () => highlights };
  placeRow();
  refresh();
})();

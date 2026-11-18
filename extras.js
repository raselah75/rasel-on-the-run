/* =====================================================================
   RASEL ON THE RUN — NEXT TRIP COUNTDOWN, BEST SHOTS, THEN & NOW
   ===================================================================== */
(() => {
  'use strict';
  const main = document.querySelector('main');
  if (!main) return;
  const isAdmin = () => document.body.classList.contains('admin-mode');
  const bn = () => document.documentElement.lang === 'bn';
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const form = (...a) => window.RNR_OWNER_FORM?.(...a);
  const welcome = document.getElementById('welcome') || document.querySelector('main > .intro-section') || document.getElementById('home');

  // =================================================================
  // 1. NEXT TRIP COUNTDOWN (Home)
  // =================================================================
  const TRIP_KEY = 'raselOnTheRunNextTripV1';
  const readTrip = () => { try { return JSON.parse(localStorage.getItem(TRIP_KEY) || 'null'); } catch { return null; } };
  const trip = document.createElement('section');
  trip.id = 'rnrNextTrip';
  trip.className = 'section rnr-trip-section';
  welcome.after(trip);
  const dayMs = 86400000;
  const startOfDay = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  function renderTrip() {
    const t = readTrip();
    const today = startOfDay(new Date());
    let state = 'none', days = 0;
    if (t?.start) {
      const start = startOfDay(`${t.start}T12:00:00`), end = t.end ? startOfDay(`${t.end}T12:00:00`) : start;
      if (today < start) { state = 'upcoming'; days = Math.round((start - today) / dayMs); }
      else if (today <= end) { state = 'now'; }
      else state = 'past';
    }
    const fmt = d => new Date(`${d}T12:00:00`).toLocaleDateString(bn() ? 'bn-BD' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const num = n => (bn() ? String(n).replace(/\d/g, x => '০১২৩৪৫৬৭৮৯'[x]) : String(n));
    if (state === 'upcoming' || state === 'now') {
      trip.innerHTML = `<div class="rnr-trip-card">
        <div class="rnr-trip-count">${state === 'now' ? `<strong>${bn() ? 'এখন' : 'Now'}</strong><span>${bn() ? 'ভ্রমণে আছি' : 'travelling'}</span>` : `<strong>${num(days)}</strong><span>${days === 1 ? (bn() ? 'দিন বাকি' : 'day to go') : (bn() ? 'দিন বাকি' : 'days to go')}</span>`}</div>
        <div class="rnr-trip-text"><p class="eyebrow">${bn() ? 'পরের অভিযান' : 'NEXT ADVENTURE'}</p><h3>${esc(t.place)}</h3><p>${esc(fmt(t.start))}${t.end && t.end !== t.start ? ` – ${esc(fmt(t.end))}` : ''}${t.note ? ` · ${esc(t.note)}` : ''}</p></div>
        <button type="button" class="rnr-owner-pill" data-trip-edit>Edit next trip</button></div>`;
    } else {
      trip.innerHTML = `<div class="rnr-trip-card is-empty"><div class="rnr-trip-text"><p class="eyebrow">NEXT ADVENTURE</p><h3>${state === 'past' ? 'Your last trip is over — set the next one.' : 'Set your next trip to show a countdown here.'}</h3><p>Only you can see this message.</p></div><button type="button" class="rnr-owner-pill" data-trip-edit>Set next trip</button></div>`;
    }
    trip.classList.toggle('has-trip', state === 'upcoming' || state === 'now');
    window.RNR_PAGES?.refresh();
  }
  trip.addEventListener('click', e => {
    if (!e.target.closest('[data-trip-edit]') || !isAdmin()) return;
    const t = readTrip() || {};
    form({ eyebrow: 'NEXT ADVENTURE', title: 'Next trip countdown', fields: [
      { name: 'place', label: 'Where are you going?', value: t.place || '', placeholder: 'e.g. Japan', maxlength: 60 },
      { name: 'start', label: 'Start date', type: 'date', value: t.start || '' },
      { name: 'end', label: 'End date (optional)', type: 'date', value: t.end || '' },
      { name: 'note', label: 'Short note (optional)', value: t.note || '', placeholder: 'e.g. Cherry blossom season', maxlength: 80 }
    ], save: d => {
      if (!d.place.trim() || !d.start) { alert('Please add the place and the start date.'); return false; }
      if (d.end && d.end < d.start) { alert('The end date is before the start date.'); return false; }
      localStorage.setItem(TRIP_KEY, JSON.stringify({ place: d.place.trim(), start: d.start, end: d.end || '', note: d.note.trim() }));
      renderTrip();
    }, extraLabel: 'Remove countdown', extra: () => { localStorage.removeItem(TRIP_KEY); renderTrip(); } });
  });

  // =================================================================
  // 2. BEST SHOTS (Home) — photos starred in the photo viewer
  // =================================================================
  const best = document.createElement('section');
  best.id = 'rnrBestShots';
  best.className = 'section rnr-best-section';
  best.innerHTML = `<div class="section-heading"><div><p class="eyebrow">HIGHLIGHTS</p><h2>Best shots</h2><p>A few favourite photographs from the road.</p></div></div>
    <div class="rnr-best-gallery"></div>
    <p class="rnr-best-hint">Open any photo and choose “☆ Add to Best shots” to show it here. Only you can see this message.</p>`;
  trip.after(best);
  async function renderBest() {
    const host = best.querySelector('.rnr-best-gallery');
    if (!window.RNR_GALLERY?.allPhotos) return;
    let photos = [];
    try { photos = (await window.RNR_GALLERY.allPhotos()).filter(p => p.blob && p.highlight); } catch {}
    photos.sort(window.RNR_GALLERY.byNewest);
    best.classList.toggle('has-photos', photos.length > 0);
    if (!photos.length) { host.innerHTML = ''; window.RNR_PAGES?.refresh(); return; }
    window.RNR_GALLERY.renderInto(host, photos.slice(0, 18), { general: true }, '', { plain: true, keepOrder: true });
    window.RNR_PAGES?.refresh();
  }
  addEventListener('rnr:photos-changed', renderBest);
  addEventListener('rnr:viewer-closed', renderBest);

  // =================================================================
  // 3. THEN & NOW (Stories page) — drag to compare two photos
  // =================================================================
  const DB = 'RaselOnTheRunThenNowV1', STORE = 'pairs';
  const openDB = () => new Promise((res, rej) => { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(STORE)) r.result.createObjectStore(STORE, { keyPath: 'id' }); }; r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const run = async (mode, fn) => { const db = await openDB(); return new Promise((res, rej) => { const t = db.transaction(STORE, mode); const out = fn(t.objectStore(STORE)); t.oncomplete = () => { db.close(); res(out?.result ?? out); }; t.onerror = () => { db.close(); rej(t.error); }; }); };
  const tn = document.createElement('section');
  tn.id = 'rnrThenNow';
  tn.className = 'section rnr-tn-section';
  tn.innerHTML = `<div class="section-heading"><div><p class="eyebrow">THEN &amp; NOW</p><h2>Then &amp; Now</h2><p>The same place, years apart. Drag the line to compare.</p></div>
    <button type="button" class="rnr-owner-pill is-solid" data-tn-add>+ Add Then &amp; Now</button></div><div class="rnr-tn-grid"></div>`;
  (document.getElementById('rnrStories') || main).after(tn);
  let tnUrls = [];
  async function renderThenNow() {
    let pairs = [];
    try { pairs = (await run('readonly', s => s.getAll())).filter(p => p.before && p.after); } catch {}
    tnUrls.forEach(u => URL.revokeObjectURL(u)); tnUrls = [];
    const url = b => { const u = URL.createObjectURL(b); tnUrls.push(u); return u; };
    pairs.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    tn.querySelector('.rnr-tn-grid').innerHTML = pairs.map(p => `
      <article class="rnr-tn-card" data-tn="${esc(p.id)}">
        <div class="rnr-tn-compare" style="--pos:50%">
          <img src="${url(p.after)}" alt="${esc(p.title || 'Now')}" data-no-archive-watermark>
          <div class="rnr-tn-before"><img src="${url(p.before)}" alt="${esc(p.title || 'Then')}" data-no-archive-watermark></div>
          <span class="rnr-tn-label is-then">${esc(p.thenLabel || 'Then')}</span><span class="rnr-tn-label is-now">${esc(p.nowLabel || 'Now')}</span>
          <span class="rnr-tn-handle" aria-hidden="true"><i></i></span>
          <input type="range" min="0" max="100" value="50" aria-label="Compare then and now">
        </div>
        <div class="rnr-tn-body"><h3>${esc(p.title || '')}</h3><p>${esc(p.place || '')}</p><button type="button" class="rnr-owner-pill" data-tn-edit>Edit</button></div>
      </article>`).join('');
    tn.classList.toggle('has-pairs', pairs.length > 0);
    window.RNR_PAGES?.refresh();
  }
  tn.addEventListener('input', e => { const r = e.target.closest('.rnr-tn-compare input'); if (r) r.parentElement.style.setProperty('--pos', `${r.value}%`); });
  tn.addEventListener('click', async e => {
    if (!isAdmin()) return;
    const add = e.target.closest('[data-tn-add]');
    const edit = e.target.closest('[data-tn-edit]');
    if (!add && !edit) return;
    let pair = null;
    if (edit) pair = await run('readonly', s => s.get(edit.closest('[data-tn]').dataset.tn));
    const shrink = f => (window.RNR_SHRINK ? window.RNR_SHRINK(f).catch(() => f) : f);
    form({ eyebrow: 'THEN & NOW', title: pair ? 'Edit Then & Now' : 'New Then & Now', fields: [
      { name: 'title', label: 'Title', value: pair?.title || '', placeholder: 'e.g. My school, 2012 and 2024', maxlength: 80 },
      { name: 'place', label: 'Place', value: pair?.place || '', placeholder: 'e.g. Cumilla, Bangladesh', maxlength: 80 },
      { name: 'thenLabel', label: 'Label for the old photo', value: pair?.thenLabel || 'Then', maxlength: 20 },
      { name: 'nowLabel', label: 'Label for the new photo', value: pair?.nowLabel || 'Now', maxlength: 20 },
      { name: 'before', label: pair ? 'Old photo (choose to replace)' : 'Old photo', type: 'file', accept: 'image/*' },
      { name: 'after', label: pair ? 'New photo (choose to replace)' : 'New photo', type: 'file', accept: 'image/*' }
    ], save: async d => {
      const before = d.before?.[0], after = d.after?.[0];
      if (!pair && (!before || !after)) { alert('Please choose both photos.'); return false; }
      const rec = { ...(pair || { id: `tn-${Date.now()}`, createdAt: new Date().toISOString() }), title: d.title.trim(), place: d.place.trim(), thenLabel: d.thenLabel.trim() || 'Then', nowLabel: d.nowLabel.trim() || 'Now' };
      if (before) rec.before = await shrink(before);
      if (after) rec.after = await shrink(after);
      try { await run('readwrite', s => s.put(rec)); } catch { alert('Could not save. Browser storage may be full.'); return false; }
      renderThenNow();
    }, extraLabel: pair ? 'Delete' : undefined, extra: pair ? async () => { if (!confirm('Delete this Then & Now?')) return false; await run('readwrite', s => s.delete(pair.id)); renderThenNow(); } : undefined });
  });

  // Owner/visitor switch re-draws owner-only messages.
  let lastAdmin = isAdmin();
  new MutationObserver(() => { if (isAdmin() !== lastAdmin) { lastAdmin = isAdmin(); renderTrip(); } }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  addEventListener('rnr:language', () => renderTrip());

  function init() { renderTrip(); renderBest(); renderThenNow(); setInterval(renderTrip, 60 * 60 * 1000); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(init, 0), { once: true }); else setTimeout(init, 0);
})();

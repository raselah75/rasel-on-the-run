/* =====================================================================
   RASEL ON THE RUN — VIDEOS
   Two collections for visitors to watch:
   • Cinematic  — short films, up to 15 seconds (play silently in the grid).
   • Travel videos — up to 2½ minutes, open in a full-screen player.
   Owner (Admin mode): add, edit (title, place, date, story, replace video,
   cover image), and delete. Stored in IndexedDB "RaselOnTheRunFilmsV1" and
   published with "Publish".
   ===================================================================== */
(() => {
  'use strict';
  const main = document.querySelector('main');
  if (!main || document.getElementById('rnrVideos')) return;
  const DB = 'RaselOnTheRunFilmsV1', STORE = 'films';
  const LIMITS = { cinematic: 15.5, normal: 150.5 };
  const LABEL = { cinematic: 'Cinematic', normal: 'Travel video' };
  const PUBLISH_LIMIT = 50 * 1024 * 1024;
  const isAdmin = () => document.body.classList.contains('admin-mode');
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const bn = () => document.documentElement.lang === 'bn';
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `film-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const clock = s => { s = Math.round(s || 0); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

  // ---------- storage ----------
  const openDB = () => new Promise((resolve, reject) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(STORE)) r.result.createObjectStore(STORE, { keyPath: 'id' }); };
    r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error);
  });
  const tx = async (mode, fn) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const t = db.transaction(STORE, mode); const store = t.objectStore(STORE);
      const out = fn(store);
      t.oncomplete = () => { db.close(); resolve(out?.result ?? out); };
      t.onerror = () => { db.close(); reject(t.error); };
      t.onabort = () => { db.close(); reject(t.error || new Error('Storage is full')); };
    });
  };
  const allFilms = () => tx('readonly', s => s.getAll());
  const putFilm = film => tx('readwrite', s => s.put(film));
  const deleteFilm = id => tx('readwrite', s => s.delete(id));

  // ---------- reading a video file ----------
  function inspect(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const v = document.createElement('video');
      v.preload = 'auto'; v.muted = true; v.playsInline = true; v.src = url;
      const fail = () => { URL.revokeObjectURL(url); reject(new Error('This video format cannot be played in this browser. Please export it as MP4 (H.264) and try again.')); };
      const timer = setTimeout(fail, 20000);
      v.onerror = () => { clearTimeout(timer); fail(); };
      v.onloadedmetadata = () => {
        const duration = v.duration;
        v.currentTime = Math.min(1, Math.max(0, (duration || 1) / 3));
        v.onseeked = () => {
          clearTimeout(timer);
          const w = v.videoWidth, h = v.videoHeight;
          const scale = Math.min(1, 960 / Math.max(w || 1, h || 1));
          const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w * scale)); c.height = Math.max(1, Math.round(h * scale));
          try { c.getContext('2d').drawImage(v, 0, 0, c.width, c.height); } catch {}
          c.toBlob(poster => { URL.revokeObjectURL(url); resolve({ duration, width: w, height: h, poster }); }, 'image/jpeg', 0.82);
        };
      };
    });
  }

  // ---------- section ----------
  const section = document.createElement('section');
  section.id = 'rnrVideos';
  section.className = 'section rnr-videos-section';
  section.innerHTML = `
    <div class="section-heading rnr-videos-heading">
      <div><p class="eyebrow">ON THE MOVE</p><h2>Videos</h2><p>Short cinematic moments and travel videos from the road.</p></div>
    </div>
    <div class="rnr-film-block" data-kind="cinematic">
      <div class="rnr-film-head"><div><h3>Cinematic</h3><p>Moments in 15 seconds or less.</p></div><button type="button" class="rnr-film-add" data-add="cinematic">+ Add cinematic video</button></div>
      <div class="rnr-cine-grid" id="rnrCineGrid"></div>
      <p class="rnr-film-empty">No cinematic videos yet. Add a clip of up to 15 seconds.</p>
    </div>
    <div class="rnr-film-block" data-kind="normal">
      <div class="rnr-film-head"><div><h3>Travel videos</h3><p>Stories from the road, up to 2½ minutes.</p></div><button type="button" class="rnr-film-add" data-add="normal">+ Add travel video</button></div>
      <div class="rnr-film-grid" id="rnrFilmGrid"></div>
      <p class="rnr-film-empty">No travel videos yet. Add a video of up to 2½ minutes.</p>
    </div>
    <div class="rnr-see-all rnr-home-only"><a class="rnr-see-all-link" href="#videos">Watch all videos <span aria-hidden="true">→</span></a></div>`;
  const anchor = document.getElementById('rnrStories') || document.getElementById('memories');
  if (anchor) anchor.after(section); else main.append(section);

  let films = [];
  const urls = new Map();
  const urlOf = (film, field) => { const k = `${film.id}:${field}`; if (!urls.has(k) && film[field]) urls.set(k, URL.createObjectURL(film[field])); return urls.get(k); };
  const clearUrls = () => { urls.forEach(u => URL.revokeObjectURL(u)); urls.clear(); };

  const metaLine = f => [f.place, f.date ? new Date(`${f.date}T12:00:00`).toLocaleDateString(bn() ? 'bn-BD' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''].filter(Boolean).join(' · ');

  function render() {
    clearUrls();
    const cine = films.filter(f => f.kind === 'cinematic').sort((a, b) => String(b.date || b.uploadedAt).localeCompare(String(a.date || a.uploadedAt)));
    const normal = films.filter(f => f.kind === 'normal').sort((a, b) => String(b.date || b.uploadedAt).localeCompare(String(a.date || a.uploadedAt)));
    const cineGrid = section.querySelector('#rnrCineGrid');
    const filmGrid = section.querySelector('#rnrFilmGrid');
    cineGrid.innerHTML = cine.map(f => `
      <article class="rnr-film-card rnr-cine-card${f.height > f.width ? ' is-portrait' : ''}" data-film="${esc(f.id)}">
        <button type="button" class="rnr-film-open" aria-label="Play ${esc(f.title || 'cinematic video')}">
          <video muted loop playsinline preload="none" poster="${urlOf(f, 'poster') || ''}" data-no-archive-watermark></video>
          <span class="rnr-cine-shade"></span>
          <span class="rnr-cine-text">${f.title ? `<strong>${esc(f.title)}</strong>` : ''}${f.place ? `<small>${esc(f.place)}</small>` : ''}</span>
          <span class="rnr-film-badge">${clock(f.duration)}</span>
        </button>
      </article>`).join('');
    filmGrid.innerHTML = normal.map(f => `
      <article class="rnr-film-card rnr-travel-card" data-film="${esc(f.id)}">
        <button type="button" class="rnr-film-open" aria-label="Play ${esc(f.title || 'travel video')}">
          <span class="rnr-film-poster" style="background-image:url('${urlOf(f, 'poster') || ''}')"></span>
          <span class="rnr-film-play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>
          <span class="rnr-film-badge">${clock(f.duration)}</span>
        </button>
        <div class="rnr-film-body">${f.title ? `<h4>${esc(f.title)}</h4>` : ''}${metaLine(f) ? `<p>${esc(metaLine(f))}</p>` : ''}</div>
      </article>`).join('');
    section.querySelector('[data-kind="cinematic"]').classList.toggle('is-empty', !cine.length);
    section.querySelector('[data-kind="normal"]').classList.toggle('is-empty', !normal.length);
    section.classList.toggle('has-films', films.length > 0);
    // Cinematic clips play silently while visible.
    cineGrid.querySelectorAll('video').forEach(v => { const f = films.find(x => x.id === v.closest('[data-film]').dataset.film); v.dataset.src = urlOf(f, 'blob'); autoplay.observe(v); });
    window.RNR_PAGES?.refresh();
  }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const autoplay = new IntersectionObserver(entries => {
    entries.forEach(e => {
      const v = e.target;
      if (e.isIntersecting && !reduce) {
        if (!v.src) v.src = v.dataset.src;
        v.play().catch(() => {});
      } else if (!v.paused) v.pause();
    });
  }, { threshold: 0.35 });

  // ---------- player ----------
  const player = document.createElement('div');
  player.className = 'rnr-player';
  player.hidden = true;
  player.setAttribute('role', 'dialog');
  player.setAttribute('aria-modal', 'true');
  player.innerHTML = `
    <div class="rnr-viewer-top"><span class="rnr-viewer-count"></span><button type="button" class="rnr-viewer-close" aria-label="Close">✕</button></div>
    <button type="button" class="rnr-viewer-nav is-prev" aria-label="Previous video">‹</button>
    <div class="rnr-player-stage"><video controls playsinline data-no-archive-watermark></video></div>
    <button type="button" class="rnr-viewer-nav is-next" aria-label="Next video">›</button>
    <div class="rnr-viewer-info"><p class="rnr-viewer-caption"></p><ul class="rnr-viewer-meta"></ul><p class="rnr-player-story"></p><div class="rnr-viewer-actions"></div></div>`;
  document.body.append(player);
  const pVideo = player.querySelector('video');
  let queue = [], at = 0;
  function play(list, index) {
    queue = list; at = index;
    const f = queue[at];
    player.hidden = false;
    document.body.classList.add('rnr-viewer-open');
    pVideo.src = urlOf(f, 'blob');
    pVideo.poster = urlOf(f, 'poster') || '';
    pVideo.play().catch(() => {});
    player.querySelector('.rnr-viewer-count').textContent = queue.length > 1 ? `${at + 1} / ${queue.length}` : '';
    player.classList.toggle('is-single', queue.length < 2);
    player.querySelector('.rnr-viewer-caption').textContent = f.title || '';
    const when = f.date ? new Date(`${f.date}T12:00:00`).toLocaleDateString(bn() ? 'bn-BD' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
    const meta = [LABEL[f.kind], clock(f.duration), f.place, when].filter(Boolean);
    player.querySelector('.rnr-viewer-meta').innerHTML = meta.map(m => `<li><span>${esc(m)}</span></li>`).join('');
    player.querySelector('.rnr-player-story').textContent = f.story || '';
    const actions = player.querySelector('.rnr-viewer-actions');
    actions.innerHTML = isAdmin() ? '<button type="button" class="rnr-viewer-action" data-act="edit">Edit video</button><button type="button" class="rnr-viewer-action is-danger" data-act="delete">Delete video</button>' : '';
    player.querySelector('.rnr-viewer-close').focus();
  }
  function stop() {
    pVideo.pause(); pVideo.removeAttribute('src'); pVideo.load(); player.hidden = true; document.body.classList.remove('rnr-viewer-open');
  }
  player.addEventListener('click', e => {
    if (e.target.closest('.rnr-viewer-close') || e.target === player) stop();
    else if (e.target.closest('.is-prev')) play(queue, (at - 1 + queue.length) % queue.length);
    else if (e.target.closest('.is-next')) play(queue, (at + 1) % queue.length);
    else if (e.target.closest('[data-act="edit"]')) { const f = queue[at]; stop(); edit(f); }
    else if (e.target.closest('[data-act="delete"]')) { const f = queue[at]; if (confirm('Delete this video? This cannot be undone.')) { stop(); deleteFilm(f.id).then(load); } }
  });
  document.addEventListener('keydown', e => { if (!player.hidden && e.key === 'Escape') stop(); });

  section.addEventListener('click', e => {
    const add = e.target.closest('[data-add]');
    if (add) { edit(null, add.dataset.add); return; }
    const card = e.target.closest('[data-film]');
    if (!card) return;
    const f = films.find(x => x.id === card.dataset.film);
    const list = films.filter(x => x.kind === f.kind).sort((a, b) => String(b.date || b.uploadedAt).localeCompare(String(a.date || a.uploadedAt)));
    play(list, list.indexOf(f));
  });

  // ---------- add / edit ----------
  const modal = document.createElement('div');
  modal.className = 'rnr-modal';
  modal.hidden = true;
  modal.innerHTML = `
    <div class="rnr-modal-backdrop" data-close></div>
    <form class="rnr-modal-card" role="dialog" aria-modal="true">
      <div class="rnr-modal-preview rnr-film-preview"><video muted loop playsinline autoplay data-no-archive-watermark></video><span></span></div>
      <div class="rnr-modal-body">
        <p class="rnr-modal-eyebrow"></p><h3></h3>
        <label class="rnr-field">Type<select name="kind"><option value="cinematic">Cinematic (up to 15 seconds)</option><option value="normal">Travel video (up to 2½ minutes)</option></select></label>
        <label class="rnr-field">Title<input name="title" maxlength="90" placeholder="e.g. Sunrise at Cox's Bazar"></label>
        <label class="rnr-field">Place<input name="place" maxlength="90" placeholder="e.g. Cox's Bazar, Bangladesh"></label>
        <label class="rnr-field">Date<input name="date" type="date"></label>
        <label class="rnr-field">Short story (optional)<input name="story" maxlength="400" placeholder="What happened in this video?"></label>
        <div class="rnr-photo-actions"><button type="button" class="rnr-btn rnr-btn-soft" data-pick>Choose video</button><input type="file" accept="video/*" hidden></div>
        <p class="rnr-modal-note"></p>
        <div class="rnr-modal-footer"><button type="button" class="rnr-btn rnr-btn-ghost rnr-film-delete" hidden>Delete</button><button type="button" class="rnr-btn rnr-btn-ghost" data-close>Cancel</button><button type="submit" class="rnr-btn rnr-btn-primary">Save</button></div>
      </div>
    </form>`;
  document.body.append(modal);
  const form = modal.querySelector('form');
  const note = t => { modal.querySelector('.rnr-modal-note').textContent = t || ''; };
  let editing = null, picked = null, previewUrl = null;
  function edit(film, kind = 'cinematic') {
    editing = film; picked = null;
    form.reset();
    form.kind.value = film?.kind || kind;
    form.title.value = film?.title || ''; form.place.value = film?.place || ''; form.date.value = film?.date || ''; form.story.value = film?.story || '';
    modal.querySelector('.rnr-modal-eyebrow').textContent = film ? 'EDIT VIDEO' : 'ADD VIDEO';
    modal.querySelector('h3').textContent = film ? (film.title || LABEL[film.kind]) : (kind === 'cinematic' ? 'New cinematic video' : 'New travel video');
    modal.querySelector('[data-pick]').textContent = film ? 'Replace video' : 'Choose video';
    modal.querySelector('.rnr-film-delete').hidden = !film;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const pv = modal.querySelector('.rnr-film-preview video');
    previewUrl = film?.blob ? URL.createObjectURL(film.blob) : null;
    if (previewUrl) pv.src = previewUrl; else pv.removeAttribute('src');
    note(film ? `${LABEL[film.kind]} · ${clock(film.duration)}` : `Choose a video (${form.kind.value === 'cinematic' ? 'up to 15 seconds' : 'up to 2½ minutes'}). MP4 works on every device.`);
    modal.hidden = false; document.body.classList.add('rnr-modal-open');
  }
  const closeModal = () => { modal.hidden = true; document.body.classList.remove('rnr-modal-open'); modal.querySelector('.rnr-film-preview video').pause(); };
  modal.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeModal(); });
  modal.querySelector('[data-pick]').addEventListener('click', () => modal.querySelector('input[type="file"]').click());
  modal.querySelector('input[type="file"]').addEventListener('change', async e => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    note('Checking video…');
    try {
      const info = await inspect(file);
      const limit = LIMITS[form.kind.value];
      if (info.duration > limit) {
        note(form.kind.value === 'cinematic'
          ? `This video is ${clock(info.duration)} long. Cinematic videos can be up to 15 seconds — choose “Travel video” or trim it.`
          : `This video is ${clock(info.duration)} long. Travel videos can be up to 2½ minutes — please trim it.`);
        return;
      }
      picked = { file, ...info };
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = URL.createObjectURL(file);
      modal.querySelector('.rnr-film-preview video').src = previewUrl;
      const mb = (file.size / 1048576).toFixed(1);
      note(`${clock(info.duration)} · ${mb} MB${file.size > PUBLISH_LIMIT ? ' — larger than 50 MB: it plays on this device, but to publish it online export a smaller copy (720p).' : ''}`);
    } catch (error) { note(error.message); }
  });
  form.kind.addEventListener('change', () => {
    const d = picked?.duration ?? editing?.duration;
    if (d && d > LIMITS[form.kind.value]) note(`This video is ${clock(d)} — too long for ${form.kind.value === 'cinematic' ? 'Cinematic (15 seconds)' : 'Travel video (2½ minutes)'}.`);
  });
  modal.querySelector('.rnr-film-delete').addEventListener('click', async () => {
    if (!editing || !confirm('Delete this video? This cannot be undone.')) return;
    await deleteFilm(editing.id); closeModal(); load();
  });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const kind = form.kind.value;
    const duration = picked?.duration ?? editing?.duration;
    if (!picked && !editing) { note('Please choose a video first.'); return; }
    if (duration > LIMITS[kind]) { note('This video is too long for the selected type.'); return; }
    const film = {
      ...(editing || { id: uid(), uploadedAt: new Date().toISOString() }),
      kind, title: form.title.value.trim(), place: form.place.value.trim(), date: form.date.value, story: form.story.value.trim()
    };
    if (picked) Object.assign(film, { blob: picked.file, name: picked.file.name, type: picked.file.type, duration: picked.duration, width: picked.width, height: picked.height, poster: picked.poster || film.poster });
    note('Saving…');
    try { await putFilm(film); closeModal(); load(); }
    catch (error) { note(/quota|full/i.test(String(error)) ? 'Browser storage is full. Delete some videos or use a smaller file.' : `Could not save: ${error.message || error}`); }
  });

  async function load() {
    try { films = (await allFilms()).filter(f => f && f.blob); } catch (error) { console.warn(error); films = []; }
    render();
  }
  window.RNR_VIDEOS = { reload: load, all: () => films.slice(), play: (id) => { const f = films.find(x => x.id === id); if (f) { const list = films.filter(x => x.kind === f.kind); play(list, list.indexOf(f)); } } };
  load();
})();

/* =====================================================================
   RASEL ON THE RUN — PUBLISH TO THE WEB (Supabase) + OWNER LOGIN
   Owner: Admin mode → "Publish" → sign in with an email link → Publish now.
          Public content (countries, photos, cover, study journey, stories,
          About Me) is uploaded to your Supabase Storage bucket "site".
          Photos are re-saved first, which removes hidden GPS/camera data.
          Private tools (vault, expenses, reservations, notes…) are NEVER uploaded.
   Visitors: the website downloads the published copy and shows it.
   Security: only your email can upload (see supabase-site.sql).
   ===================================================================== */
(() => {
  'use strict';
  const cfgAll = window.RNR_SITE || {};
  const cfg = cfgAll.cloud || {};
  const configured = Boolean(cfg.supabaseUrl && cfg.supabaseAnonKey);
  const BASE = String(cfg.supabaseUrl || '').replace(/\/+$/, '');
  const BUCKET = cfg.bucket || 'site';
  const SESSION_KEY = 'raselOnTheRunCloudSessionV1';
  const PUBLISHED_KEY = 'raselOnTheRunPublishedV1';
  const OWNER_FLAG = 'raselOnTheRunOwnerDeviceV1';
  const ADMIN_KEY = 'raselOnTheRunAdminCredentialV1';

  // What is public. Everything else stays on your device.
  const LOCAL_KEYS = ['raselOnTheRunData', 'raselOnTheRunAboutMe', 'raselOnTheRunStudyJourneyV1', 'raselOnTheRunLifetimeDocumentaryV1',
    'raselOnTheRunCountryOrderV1', 'raselOnTheRunRemovedDefaultsV1', 'raselOnTheRunHeroCoverV1', 'raselOnTheRunSiteTextV1', 'raselOnTheRunNextTripV1', 'raselOnTheRunGlobeListsV1',
    'raselOnTheRunPassportV1', 'raselOnTheRunTripRoutesV1', 'raselOnTheRunSeasonV1', 'raselOnTheRunJourneyPlanPublicV1', 'raselOnTheRunDistrictsV1', 'raselOnTheRunWatermarkV1'];
  const DATABASES = [
    { name: 'RaselOnTheRunPhotos', stores: ['photos'], logo: true },
    { name: 'RaselOnTheRunDesignAssets', stores: ['assets'] },
    { name: 'RaselOnTheRunShortVideosV1', stores: null },
    { name: 'RaselOnTheRunLifetimeDocMediaV1', stores: ['media'], logo: true },
    { name: 'RaselOnTheRunFilmsV1', stores: ['films'] },
    { name: 'RaselOnTheRunThenNowV1', stores: ['pairs'], logo: true },
    { name: 'RaselOnTheRunFoodDiaryV1', stores: ['dishes'], logo: true },
    { name: 'RaselOnTheRunPanoramasV1', stores: ['panos'], maxEdge: 6000 }
  ];

  const ls = {
    get: k => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { console.warn(e); } },
    del: k => { try { localStorage.removeItem(k); } catch {} },
    json: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }
  };
  const isOwnerDevice = () => ls.get(OWNER_FLAG) === '1' || Boolean(ls.get(ADMIN_KEY));
  const publicURL = path => `${BASE}/storage/v1/object/public/${BUCKET}/${path.split('/').map(encodeURIComponent).join('/')}`;
  // New Supabase keys (sb_publishable_...) go ONLY in the apikey header; the
  // Authorization header carries the signed-in owner's session token, or the
  // old-style anon key (a JWT) for projects that still use it.
  const headers = (token, extra = {}) => {
    const h = { apikey: cfg.supabaseAnonKey, ...extra };
    if (token) h.Authorization = `Bearer ${token}`;
    else if (/^eyJ/.test(cfg.supabaseAnonKey || '')) h.Authorization = `Bearer ${cfg.supabaseAnonKey}`;
    return h;
  };

  // ------------------------------------------------------------------
  // 1. Sign-in link landing: the email link returns here with tokens.
  //    This runs immediately, before the page router reads the address.
  // ------------------------------------------------------------------
  function captureLogin() {
    const hash = location.hash.slice(1);
    if (!/(^|&)(access_token|error_description)=/.test(hash)) return false;
    const params = new URLSearchParams(hash);
    if (params.get('access_token')) {
      const expiresIn = Number(params.get('expires_in') || 3600);
      ls.set(SESSION_KEY, JSON.stringify({
        access_token: params.get('access_token'), refresh_token: params.get('refresh_token') || '',
        expires_at: Date.now() + expiresIn * 1000
      }));
      ls.set(OWNER_FLAG, '1');
      try { sessionStorage.setItem('rnrOpenPublish', 'signed-in'); } catch {}
    } else {
      try { sessionStorage.setItem('rnrOpenPublish', `error:${params.get('error_description') || 'Sign-in failed'}`); } catch {}
    }
    history.replaceState(null, '', `${location.pathname}${location.search}#home`);
    return true;
  }
  captureLogin();
  // The link can also land in a tab where the website is already open.
  addEventListener('hashchange', event => {
    if (!captureLogin()) return;
    event.stopImmediatePropagation();
    let pending = null;
    try { pending = sessionStorage.getItem('rnrOpenPublish'); sessionStorage.removeItem('rnrOpenPublish'); } catch {}
    document.body.classList.add('rnr-owner-device');
    window.RNR_PAGES?.show('home');
    setTimeout(() => openPanel(pending?.startsWith('error:') ? `Sign-in failed: ${pending.slice(6)}` : ''), 200);
  });

  // ------------------------------------------------------------------
  // IndexedDB helpers
  // ------------------------------------------------------------------
  const req = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  async function dbExists(name) {
    if (indexedDB.databases) { try { return (await indexedDB.databases()).some(d => d.name === name); } catch {} }
    return true;
  }
  function openDB(name, version, schema) {
    return new Promise((resolve, reject) => {
      const r = version ? indexedDB.open(name, version) : indexedDB.open(name);
      r.onupgradeneeded = () => {
        const db = r.result;
        (schema || []).forEach(s => {
          if (db.objectStoreNames.contains(s.name)) return;
          const store = db.createObjectStore(s.name, { keyPath: s.keyPath ?? undefined, autoIncrement: Boolean(s.autoIncrement) });
          (s.indexes || []).forEach(ix => { try { store.createIndex(ix.name, ix.keyPath, { unique: ix.unique, multiEntry: ix.multiEntry }); } catch {} });
        });
      };
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
      r.onblocked = () => reject(new Error(`${name} is open in another tab`));
    });
  }

  // ------------------------------------------------------------------
  // 2. VISITORS: download the published copy
  // ------------------------------------------------------------------
  async function fetchSite() {
    const response = await fetch(`${publicURL('site.json')}?t=${Date.now()}`, { cache: 'no-store' });
    if (response.status === 400 || response.status === 404) return null;
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  async function applySnapshot(site, onProgress = () => {}) {
    const state = ls.json(PUBLISHED_KEY, {});
    // localStorage
    const previousKeys = state.keys || [];
    Object.entries(site.localStorage || {}).forEach(([k, v]) => ls.set(k, v));
    previousKeys.filter(k => !(k in (site.localStorage || {}))).forEach(k => ls.del(k));
    // IndexedDB
    let done = 0;
    const totalFiles = (site.databases || []).reduce((n, d) => n + d.stores.reduce((m, s) => m + s.records.reduce((x, r) => x + Object.values(r.value || {}).filter(v => v && v.__file).length, 0), 0), 0);
    for (const dbSnap of site.databases || []) {
      let db;
      try { db = await openDB(dbSnap.name, dbSnap.version, dbSnap.stores); }
      catch (error) {
        if (error?.name !== 'VersionError') throw error;
        db = await openDB(dbSnap.name);
      }
      for (const storeSnap of dbSnap.stores) {
        if (!db.objectStoreNames.contains(storeSnap.name)) continue;
        // Reuse files this browser already has.
        const existing = new Map();
        const tx1 = db.transaction(storeSnap.name, 'readonly');
        const store1 = tx1.objectStore(storeSnap.name);
        const [keys, values] = await Promise.all([req(store1.getAllKeys()), req(store1.getAll())]);
        keys.forEach((k, i) => existing.set(JSON.stringify(k), values[i]));
        const prepared = [];
        for (const rec of storeSnap.records) {
          const value = Array.isArray(rec.value) || typeof rec.value !== 'object' || rec.value === null ? rec.value : { ...rec.value };
          if (value && typeof value === 'object') {
            for (const [field, v] of Object.entries(value)) {
              if (!v || !v.__file) continue;
              const old = existing.get(JSON.stringify(rec.key));
              const oldBlob = old?.[field];
              if (oldBlob instanceof Blob && old?.__rnrFiles?.[field] === v.__file) value[field] = oldBlob;
              else {
                const r = await fetch(publicURL(v.__file));
                if (!r.ok) throw new Error(`Could not download ${v.__file}`);
                const blob = await r.blob();
                value[field] = v.name ? new File([blob], v.name, { type: v.type || blob.type }) : new Blob([blob], { type: v.type || blob.type });
              }
              value.__rnrFiles = { ...(value.__rnrFiles || {}), [field]: v.__file };
              done += 1; onProgress(done, totalFiles);
            }
          }
          prepared.push({ key: rec.key, value });
        }
        const tx2 = db.transaction(storeSnap.name, 'readwrite');
        const store2 = tx2.objectStore(storeSnap.name);
        store2.clear();
        prepared.forEach(p => (store2.keyPath === null ? store2.put(p.value, p.key) : store2.put(p.value)));
        await new Promise((res, rej) => { tx2.oncomplete = res; tx2.onerror = () => rej(tx2.error); tx2.onabort = () => rej(tx2.error); });
      }
      db.close();
    }
    ls.set(PUBLISHED_KEY, JSON.stringify({ version: site.version, publishedAt: site.publishedAt, keys: Object.keys(site.localStorage || {}) }));
  }

  function showVeil() {
    document.documentElement.classList.add('rnr-hydrating');
    const veil = document.createElement('div');
    veil.className = 'rnr-hydrate-veil';
    veil.innerHTML = '<div><span class="rnr-veil-spinner" aria-hidden="true"></span><p>Loading Rasel\'s journeys…</p></div>';
    const add = () => document.body ? document.body.append(veil) : requestAnimationFrame(add);
    add();
    return () => { document.documentElement.classList.remove('rnr-hydrating'); veil.remove(); };
  }

  async function visitorSync() {
    if (!configured || isOwnerDevice()) return;
    const state = ls.json(PUBLISHED_KEY, null);
    const first = !state;
    const hide = first ? showVeil() : () => {};
    const giveUp = setTimeout(hide, 12000);
    let reloading = false;
    try {
      const site = await fetchSite();
      if (!site) { if (first) ls.set(PUBLISHED_KEY, JSON.stringify({ version: 'none' })); return; }
      if (state?.version === site.version) return;
      await applySnapshot(site);
      if (first || state?.version === 'none') { reloading = true; location.reload(); return; }
      toast('New photos and stories are available.', 'Refresh', () => location.reload());
    } catch (error) {
      console.warn('Published content unavailable:', error);
    } finally {
      clearTimeout(giveUp);
      if (!reloading) hide();
    }
  }

  // ------------------------------------------------------------------
  // 3. OWNER: sign in + publish
  // ------------------------------------------------------------------
  async function session() {
    let s = ls.json(SESSION_KEY, null);
    if (!s?.access_token) return null;
    if (Date.now() > (s.expires_at || 0) - 60000) {
      if (!s.refresh_token) { ls.del(SESSION_KEY); return null; }
      const r = await fetch(`${BASE}/auth/v1/token?grant_type=refresh_token`, { method: 'POST', headers: headers(null, { 'Content-Type': 'application/json' }), body: JSON.stringify({ refresh_token: s.refresh_token }) });
      if (!r.ok) { ls.del(SESSION_KEY); return null; }
      const d = await r.json();
      s = { access_token: d.access_token, refresh_token: d.refresh_token, expires_at: Date.now() + (d.expires_in || 3600) * 1000 };
      ls.set(SESSION_KEY, JSON.stringify(s));
    }
    return s;
  }
  async function currentUser() {
    const s = await session();
    if (!s) return null;
    const r = await fetch(`${BASE}/auth/v1/user`, { headers: headers(s.access_token) });
    if (!r.ok) return null;
    return r.json();
  }
  async function sendLink() {
    const email = cfg.ownerEmail;
    const redirect = `${location.origin}${location.pathname}`;
    const r = await fetch(`${BASE}/auth/v1/otp?redirect_to=${encodeURIComponent(redirect)}`, {
      method: 'POST', headers: headers(null, { 'Content-Type': 'application/json' }), body: JSON.stringify({ email, create_user: true })
    });
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).msg || `Could not send the link (HTTP ${r.status})`);
  }
  function signOut() { ls.del(SESSION_KEY); }

  // Re-save photos without hidden metadata (GPS, camera) and at web size.
  async function cleanImage(blob, maxEdge = 2400, withLogo = false) {
    if (!(blob instanceof Blob) || !/^image\/(jpeg|png|webp|heic|heif)/.test(blob.type)) return blob;
    try {
      const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
      const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
      const ctx2d = canvas.getContext('2d');
      ctx2d.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close?.();
      // Small logo in the corner of published photos (originals stay untouched).
      if (withLogo && window.RNR_LOGO) { try { await window.RNR_LOGO.stamp(ctx2d, canvas.width, canvas.height); } catch {} }
      const type = blob.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const out = await new Promise(res => canvas.toBlob(res, type, 0.88));
      return out ? (blob.name ? new File([out], blob.name.replace(/\.(heic|heif|webp)$/i, '.jpg'), { type }) : out) : blob;
    } catch { return blob; }
  }
  async function digest(blob) {
    const hash = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
    return [...new Uint8Array(hash)].slice(0, 10).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  const extOf = type => ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm' }[type] || 'bin');
  const safe = v => String(v).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60);

  async function buildSnapshot(onStep) {
    const site = { version: `${Date.now()}`, publishedAt: new Date().toISOString(), localStorage: {}, databases: [] };
    const files = [];
    LOCAL_KEYS.forEach(k => { const v = ls.get(k); if (v !== null) site.localStorage[k] = v; });
    for (const spec of DATABASES) {
      if (!(await dbExists(spec.name))) continue;
      let db;
      try { db = await openDB(spec.name); } catch { continue; }
      const storeNames = (spec.stores || [...db.objectStoreNames]).filter(n => db.objectStoreNames.contains(n));
      if (!storeNames.length) { db.close(); continue; }
      const dbSnap = { name: spec.name, version: db.version, stores: [] };
      for (const name of storeNames) {
        const tx = db.transaction(name, 'readonly');
        const store = tx.objectStore(name);
        const [keys, values] = await Promise.all([req(store.getAllKeys()), req(store.getAll())]);
        const storeSnap = {
          name, keyPath: store.keyPath, autoIncrement: store.autoIncrement,
          indexes: [...store.indexNames].map(n => { const ix = store.index(n); return { name: n, keyPath: ix.keyPath, unique: ix.unique, multiEntry: ix.multiEntry }; }),
          records: []
        };
        for (let i = 0; i < values.length; i += 1) {
          const original = values[i];
          const value = original && typeof original === 'object' && !(original instanceof Blob) ? { ...original } : original;
          if (value && typeof value === 'object') {
            delete value.__rnrFiles;
            for (const [field, v] of Object.entries(value)) {
              if (!(v instanceof Blob)) continue;
              onStep?.(`Preparing ${spec.name.replace('RaselOnTheRun', '')} ${i + 1}/${values.length}`);
              const clean = await cleanImage(v, spec.maxEdge, Boolean(spec.logo) && /^image\//.test(v.type || ''));
              const hash = await digest(clean);
              const path = `media/${safe(spec.name)}/${safe(name)}/${safe(keys[i])}-${safe(field)}-${hash}.${extOf(clean.type)}`;
              files.push({ path, blob: clean });
              value[field] = { __file: path, type: clean.type, size: clean.size, name: clean.name || '' };
            }
          }
          storeSnap.records.push({ key: keys[i], value });
        }
        dbSnap.stores.push(storeSnap);
      }
      db.close();
      site.databases.push(dbSnap);
    }
    return { site, files };
  }

  async function upload(path, body, type, token, cache = '31536000') {
    const r = await fetch(`${BASE}/storage/v1/object/${BUCKET}/${path.split('/').map(encodeURIComponent).join('/')}`, {
      method: 'POST', headers: headers(token, { 'Content-Type': type || 'application/octet-stream', 'x-upsert': 'true', 'cache-control': `max-age=${cache}` }), body
    });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      const msg = d.message || d.error || `HTTP ${r.status}`;
      if (/row-level security|unauthorized|403/i.test(msg)) throw new Error('This account is not allowed to publish. Check the owner email in supabase-site.sql.');
      if (/maximum allowed size|too large|413/i.test(msg)) throw new Error(`A file is too large for your Supabase plan: ${path.split('/').pop()}`);
      throw new Error(msg);
    }
  }

  async function publish(onStep) {
    const s = await session();
    if (!s) throw new Error('Please sign in first.');
    onStep('Collecting your public content…');
    const { site, files } = await buildSnapshot(onStep);
    let previous = null;
    try { previous = await fetchSite(); } catch {}
    const already = new Set();
    (previous?.databases || []).forEach(d => d.stores.forEach(st => st.records.forEach(r => Object.values(r.value || {}).forEach(v => { if (v?.__file) already.add(v.__file); }))));
    const todo = files.filter(f => !already.has(f.path));
    for (let i = 0; i < todo.length; i += 1) {
      onStep(`Uploading ${i + 1} of ${todo.length}…`, (i / Math.max(todo.length, 1)) * 100);
      await upload(todo[i].path, todo[i].blob, todo[i].blob.type, s.access_token);
    }
    onStep('Publishing…', 100);
    await upload('site.json', new Blob([JSON.stringify(site)], { type: 'application/json' }), 'application/json', s.access_token, '0');
    // Remove files that are no longer used.
    const keep = new Set(files.map(f => f.path));
    const stale = [...already].filter(p => !keep.has(p));
    if (stale.length) {
      onStep('Tidying up old files…', 100);
      await fetch(`${BASE}/storage/v1/object/${BUCKET}`, { method: 'DELETE', headers: headers(s.access_token, { 'Content-Type': 'application/json' }), body: JSON.stringify({ prefixes: stale }) }).catch(() => {});
    }
    ls.set('raselOnTheRunLastPublishV1', JSON.stringify({ at: site.publishedAt, files: files.length, uploaded: todo.length }));
    return { files: files.length, uploaded: todo.length };
  }

  // ------------------------------------------------------------------
  // 4. Owner panel
  // ------------------------------------------------------------------
  let panel = null;
  function toast(text, action, onAction) {
    const t = document.createElement('div');
    t.className = 'rnr-toast';
    t.innerHTML = `<span></span>${action ? '<button type="button"></button>' : ''}`;
    t.querySelector('span').textContent = text;
    if (action) { const b = t.querySelector('button'); b.textContent = action; b.addEventListener('click', onAction); }
    document.body.append(t);
    setTimeout(() => t.classList.add('is-in'), 20);
    setTimeout(() => { t.classList.remove('is-in'); setTimeout(() => t.remove(), 400); }, action ? 15000 : 5000);
  }

  function buildPanel() {
    panel = document.createElement('div');
    panel.className = 'rnr-modal rnr-publish';
    panel.hidden = true;
    panel.innerHTML = `
      <div class="rnr-modal-backdrop" data-close></div>
      <div class="rnr-modal-card" role="dialog" aria-modal="true" aria-labelledby="rnrPubTitle">
        <div class="rnr-modal-body">
          <p class="rnr-modal-eyebrow">PUBLISH TO THE WEB</p>
          <h3 id="rnrPubTitle">Share your journeys with everyone</h3>
          <p class="rnr-pub-text">Publishing copies your public content to your website so every visitor can see it: countries and their photos, your cover, memories, short videos, study journey, stories and About Me. Private tools (planner, expenses, reservations, vault, notes) are never published. Photos are re-saved without hidden GPS/camera data.</p>
          <div class="rnr-pub-status" id="rnrPubStatus"></div>
          <div class="rnr-pub-progress" hidden><i></i></div>
          <div class="rnr-modal-footer rnr-pub-actions"></div>
        </div>
      </div>`;
    document.body.append(panel);
    panel.addEventListener('click', e => { if (e.target.closest('[data-close]')) closePanel(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && panel && !panel.hidden) closePanel(); });
  }
  function closePanel() { panel.hidden = true; document.body.classList.remove('rnr-modal-open'); }
  const setStatus = (html, kind = '') => { const el = panel.querySelector('#rnrPubStatus'); el.innerHTML = html; el.dataset.kind = kind; };
  const setActions = buttons => {
    const box = panel.querySelector('.rnr-pub-actions');
    box.innerHTML = '';
    buttons.forEach(([label, cls, fn]) => { const b = document.createElement('button'); b.type = 'button'; b.className = `rnr-btn ${cls}`; b.textContent = label; b.addEventListener('click', fn); box.append(b); });
  };
  const progress = pct => {
    const bar = panel.querySelector('.rnr-pub-progress');
    bar.hidden = pct == null;
    if (pct != null) bar.querySelector('i').style.width = `${Math.max(3, pct)}%`;
  };

  async function openPanel(note) {
    if (!panel) buildPanel();
    panel.hidden = false;
    document.body.classList.add('rnr-modal-open');
    progress(null);
    if (!configured) {
      setStatus('<b>Cloud is not set up yet.</b> Follow “PUBLISH TO THE WEB – ONE-TIME SETUP” in README.txt, then add your Supabase address and public key in <code>site-config.js</code>.', 'warn');
      setActions([['Close', 'rnr-btn-ghost', closePanel], ['Logo on photos', 'rnr-btn-ghost', () => window.RNR_LOGO?.settings()]]);
      return;
    }
    setStatus('Checking sign-in…');
    setActions([]);
    let user = null;
    try { user = await currentUser(); } catch {}
    const last = ls.json('raselOnTheRunLastPublishV1', null);
    const lastLine = last ? `<br><small>Last published: ${new Date(last.at).toLocaleString()}</small>` : '';
    if (!user) {
      setStatus(`${note ? `<b>${note}</b><br>` : ''}To publish, sign in with your owner email <b>${cfg.ownerEmail}</b>. We will email you a sign-in link; open it on this device.${lastLine}`, note?.startsWith('Sign-in failed') ? 'warn' : '');
      setActions([['Close', 'rnr-btn-ghost', closePanel], ['Email me a sign-in link', 'rnr-btn-primary', async () => {
        setStatus('Sending…');
        try { await sendLink(); setStatus(`Sign-in link sent to <b>${cfg.ownerEmail}</b>. Open the email on this device and tap the link. You will come back here signed in.`, 'ok'); }
        catch (error) { setStatus(error.message, 'warn'); }
      }]]);
      return;
    }
    const isOwner = String(user.email || '').toLowerCase() === String(cfg.ownerEmail || '').toLowerCase();
    setStatus(`Signed in as <b>${user.email}</b>${isOwner ? '' : ' — this is not the owner email in site-config.js.'}${lastLine}`, isOwner ? 'ok' : 'warn');
    setActions([
      ['Sign out', 'rnr-btn-ghost', () => { signOut(); openPanel(); }],
      ['Logo on photos', 'rnr-btn-ghost', () => window.RNR_LOGO?.settings()],
      ['Download published copy', 'rnr-btn-ghost', async () => {
        if (!confirm('Replace the content on THIS device with the published website copy? (Use this on a new phone or laptop.)')) return;
        try { setStatus('Downloading…'); const site = await fetchSite(); if (!site) { setStatus('Nothing has been published yet.', 'warn'); return; }
          await applySnapshot(site, (d, t) => progress((d / Math.max(t, 1)) * 100)); setStatus('Done. Reloading…', 'ok'); setTimeout(() => location.reload(), 600); }
        catch (error) { setStatus(error.message, 'warn'); }
      }],
      ['Publish now', 'rnr-btn-primary', async () => {
        setActions([]);
        try {
          const result = await publish((text, pct) => { setStatus(text); progress(pct ?? 0); });
          progress(null);
          setStatus(`Published! ${result.files} photos/videos are online (${result.uploaded} new). Visitors will see the update the next time they open your website.`, 'ok');
          setActions([['Done', 'rnr-btn-primary', closePanel]]);
        } catch (error) {
          progress(null);
          setStatus(`Could not publish: ${error.message}`, 'warn');
          setActions([['Close', 'rnr-btn-ghost', closePanel], ['Try again', 'rnr-btn-primary', () => openPanel()]]);
        }
      }]
    ]);
  }

  function addPublishButton() {
    const corner = document.getElementById('ownerCornerControls') || document.querySelector('.main-nav');
    if (!corner || document.getElementById('rnrPublishButton')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'rnrPublishButton';
    button.className = 'rnr-publish-button';
    button.textContent = 'Publish';
    button.addEventListener('click', () => openPanel());
    corner.prepend(button);
  }

  // Expose for testing and for other modules.
  window.RNR_CLOUD = { configured, openPanel, publish, applySnapshot, fetchSite, base: BASE, headers: (token, extra) => headers(token, extra), session };

  // Start
  if (configured && !isOwnerDevice()) visitorSync();
  const ready = () => {
    addPublishButton();
    let pending = null;
    try { pending = sessionStorage.getItem('rnrOpenPublish'); sessionStorage.removeItem('rnrOpenPublish'); } catch {}
    if (pending) {
      document.body.classList.add('rnr-owner-device');
      setTimeout(() => openPanel(pending.startsWith('error:') ? `Sign-in failed: ${pending.slice(6)}` : ''), 400);
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(ready, 0), { once: true }); else setTimeout(ready, 0);
})();

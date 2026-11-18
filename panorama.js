/* =====================================================================
   RASEL ON THE RUN — 360° VIEWS (Travels page)
   Panorama photos you can look around in: drag, swipe, zoom, or move
   the phone. Three kinds:
     wide   — a normal phone panorama (stops at both ends)
     loop   — a full-circle phone panorama (goes round and round)
     sphere — a photo from a 360° camera (look up and down too, WebGL)
   Admin mode: "+ Add 360° view", Edit / Delete in the viewer.
   Stored in IndexedDB RaselOnTheRunPanoramasV1 / panos (published at a
   larger size than normal photos so they stay sharp).
   ===================================================================== */
(() => {
  'use strict';
  const main = document.querySelector('main');
  if (!main || document.getElementById('rnrPanoramas')) return;
  const DB = 'RaselOnTheRunPanoramasV1', STORE = 'panos';
  const isAdmin = () => document.body.classList.contains('admin-mode');
  const bn = () => document.documentElement.lang === 'bn';
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const openDB = () => new Promise((res, rej) => { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(STORE)) r.result.createObjectStore(STORE, { keyPath: 'id' }); }; r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const run = async (mode, fn) => { const db = await openDB(); return new Promise((res, rej) => { const t = db.transaction(STORE, mode); const out = fn(t.objectStore(STORE)); t.oncomplete = () => { db.close(); res(out?.result ?? out); }; t.onerror = () => { db.close(); rej(t.error); }; }); };
  const fmt = iso => { if (!iso) return ''; const d = new Date(`${iso}T12:00:00`); return isNaN(d) ? '' : d.toLocaleDateString(bn() ? 'bn-BD' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }); };
  const KINDS = { 'Automatic': '', 'Wide panorama (stops at the ends)': 'wide', '360° all around (loops)': 'loop', '360° camera photo (look up and down)': 'sphere' };
  const kindName = k => Object.keys(KINDS).find(n => KINDS[n] === k) || 'Automatic';
  const badge = k => (k === 'wide' ? (bn() ? 'প্যানোরামা' : 'PANORAMA') : '360°');

  // ---------- Section ----------
  const section = document.createElement('section');
  section.id = 'rnrPanoramas';
  section.className = 'section rnr-pano-section';
  section.innerHTML = `
    <div class="section-heading"><div><p class="eyebrow">360° VIEWS</p><h2>Stand where I stood</h2><p>Open a view and drag to look around, or move your phone.</p></div>
      <button type="button" class="rnr-owner-pill is-solid" data-pano-add>+ Add 360° view</button></div>
    <div class="rnr-pano-grid"></div>
    <p class="rnr-pano-hint">Add a panorama from your phone or a photo from a 360° camera. Only you can see this message.</p>`;
  (document.getElementById('memories') || main).after(section);

  let panos = [], urls = [];
  async function load() {
    try { panos = (await run('readonly', s => s.getAll())).filter(p => p && p.image instanceof Blob); } catch { panos = []; }
    panos.sort((a, b) => String(b.date || b.createdAt).localeCompare(String(a.date || a.createdAt)));
  }
  function render() {
    urls.forEach(u => URL.revokeObjectURL(u)); urls = [];
    section.querySelector('.rnr-pano-grid').innerHTML = panos.map((p, i) => {
      const u = URL.createObjectURL(p.image); urls.push(u);
      return `<article class="rnr-pano-card">
        <button type="button" class="rnr-pano-thumb" data-pano-open="${i}" style="background-image:url('${u}')" aria-label="${esc((bn() ? 'চারপাশ দেখুন: ' : 'Look around: ') + (p.title || ''))}">
          <span class="rnr-pano-badge">${badge(p.kind)}</span><span class="rnr-pano-play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 5c-5 0-9 1.6-9 3.5v7C3 17.4 7 19 12 19s9-1.6 9-3.5v-7C21 6.6 17 5 12 5z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 12l3 0M13 12l3 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M15 9.5l2.5 2.5-2.5 2.5M9 9.5L6.5 12 9 14.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
        </button>
        <div class="rnr-pano-body"><h3 data-no-translate>${esc(p.title || '')}</h3><p data-no-translate>${esc([p.place, fmt(p.date)].filter(Boolean).join(' · '))}</p>
          <button type="button" class="rnr-owner-pill" data-pano-edit="${esc(p.id)}">Edit</button></div>
      </article>`;
    }).join('');
    section.classList.toggle('has-items', panos.length > 0);
    window.RNR_PAGES?.refresh();
  }

  // ---------- Viewer ----------
  const viewer = document.createElement('div');
  viewer.className = 'rnr-pano-viewer';
  viewer.hidden = true;
  viewer.setAttribute('role', 'dialog');
  viewer.setAttribute('aria-modal', 'true');
  viewer.innerHTML = `
    <div class="rnr-pano-stage"><canvas class="rnr-pano-canvas"></canvas><div class="rnr-pano-strip"></div><div class="rnr-pano-loading"><span></span></div></div>
    <div class="rnr-pano-top">
      <div class="rnr-pano-title"><strong data-no-translate></strong><small data-no-translate></small></div>
      <div class="rnr-pano-owner"><button type="button" data-pv-edit>Edit</button><button type="button" class="is-danger" data-pv-delete>Delete</button></div>
      <button type="button" class="rnr-pano-close" data-pv-close aria-label="Close">✕</button>
    </div>
    <button type="button" class="rnr-pano-nav is-prev" data-pv-step="-1" aria-label="Previous view">‹</button>
    <button type="button" class="rnr-pano-nav is-next" data-pv-step="1" aria-label="Next view">›</button>
    <div class="rnr-pano-controls">
      <button type="button" data-pv-turn="-1" aria-label="Turn left">◀</button>
      <button type="button" data-pv-auto aria-label="Auto-rotate" class="is-on">⟳</button>
      <button type="button" data-pv-turn="1" aria-label="Turn right">▶</button>
      <span class="rnr-pano-sep"></span>
      <button type="button" data-pv-zoom="-1" aria-label="Zoom out">−</button>
      <button type="button" data-pv-zoom="1" aria-label="Zoom in">+</button>
      <button type="button" data-pv-gyro aria-label="Move your phone to look around" hidden>📱</button>
    </div>
    <p class="rnr-pano-hint2">Drag to look around</p>`;
  document.body.append(viewer);
  const canvas = viewer.querySelector('canvas');
  const strip = viewer.querySelector('.rnr-pano-strip');
  const stage = viewer.querySelector('.rnr-pano-stage');

  const state = { index: 0, kind: 'wide', yaw: 0, pitch: 0, fov: 1.35, zoom: 1, x: 0, vx: 0, vyaw: 0, auto: true, img: null, url: '', raf: 0, dragging: false, gyro: false, lastT: 0 };
  let gl = null, prog = null, tex = null, uni = {};

  // --- WebGL sphere (360° camera photos) ---
  function initGL() {
    if (gl) return true;
    gl = canvas.getContext('webgl', { antialias: false, preserveDrawingBuffer: false }) || canvas.getContext('experimental-webgl');
    if (!gl) return false;
    const vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    const fs = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D t;uniform vec2 r;uniform float yaw,pitch,fov;const float PI=3.14159265;
void main(){vec2 q=(gl_FragCoord.xy/r)*2.-1.;q.x*=r.x/r.y;float f=1./tan(fov*.5);vec3 d=normalize(vec3(q.x,q.y,-f));
float cp=cos(pitch),sp=sin(pitch);d=vec3(d.x,d.y*cp-d.z*sp,d.y*sp+d.z*cp);
float cy=cos(yaw),sy=sin(yaw);d=vec3(d.x*cy+d.z*sy,d.y,-d.x*sy+d.z*cy);
float lon=atan(d.x,-d.z);float lat=asin(clamp(d.y,-1.,1.));
gl_FragColor=texture2D(t,vec2(lon/(2.*PI)+.5,.5-lat/PI));}`;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link');
    } catch (error) { console.warn('360 viewer:', error.message); gl = null; return false; }
    gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    ['t', 'r', 'yaw', 'pitch', 'fov'].forEach(n => { uni[n] = gl.getUniformLocation(prog, n); });
    tex = gl.createTexture();
    return true;
  }
  function uploadTexture(img) {
    // Power-of-two size so the seam at the back joins cleanly.
    const max = Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE) || 2048, 4096);
    let w = 1; while (w * 2 <= Math.min(max, img.naturalWidth * 1.2)) w *= 2;
    w = Math.max(w, 512);
    const c = document.createElement('canvas'); c.width = w; c.height = w / 2;
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, c);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  }
  function drawSphere() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = Math.round(stage.clientWidth * dpr), h = Math.round(stage.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, w, h);
    gl.uniform2f(uni.r, w, h); gl.uniform1f(uni.yaw, state.yaw); gl.uniform1f(uni.pitch, state.pitch); gl.uniform1f(uni.fov, state.fov); gl.uniform1i(uni.t, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  // --- Flat strip (phone panoramas) ---
  function stripSize() {
    const h = stage.clientHeight * state.zoom;
    const w = h * (state.img.naturalWidth / state.img.naturalHeight);
    return { w, h };
  }
  function clampStrip() {
    const { w } = stripSize();
    const vw = stage.clientWidth;
    if (state.kind === 'loop') { state.x = ((state.x % w) + w) % w - w; return; }
    if (w <= vw) { state.x = (vw - w) / 2; state.vx = 0; return; }
    const min = vw - w;
    if (state.x > 0) { state.x = 0; state.vx = 0; }
    if (state.x < min) { state.x = min; state.vx = 0; }
  }
  function drawStrip() {
    const { w, h } = stripSize();
    clampStrip();
    strip.style.backgroundSize = `${w}px ${h}px`;
    strip.style.backgroundPosition = `${state.x}px 50%`;
  }

  const draw = () => { if (!state.img) return; if (state.kind === 'sphere') { if (gl) drawSphere(); } else drawStrip(); };
  function tick(t) {
    state.raf = requestAnimationFrame(tick);
    if (!state.img) return;
    const dt = Math.min(0.05, (t - (state.lastT || t)) / 1000); state.lastT = t;
    if (!state.dragging && !state.gyro) {
      if (state.kind === 'sphere') {
        if (state.auto) state.yaw += 0.12 * dt;
        state.yaw += state.vyaw * dt; state.vyaw *= Math.pow(0.04, dt);
      } else {
        if (state.auto) state.x += (state.kind === 'wide' ? state.autoDir : -1) * 26 * dt;
        else { state.x += state.vx * dt; state.vx *= Math.pow(0.04, dt); }
        if (state.kind === 'wide' && state.auto) {
          const { w } = stripSize(); const min = stage.clientWidth - w;
          if (state.x >= 0) state.autoDir = -1; else if (state.x <= min) state.autoDir = 1;
        }
      }
    }
    draw();
  }

  async function show(i) {
    const p = panos[i];
    if (!p) return;
    state.index = i;
    state.img = null;
    viewer.classList.add('is-loading');
    viewer.querySelector('.rnr-pano-title strong').textContent = p.title || '';
    viewer.querySelector('.rnr-pano-title small').textContent = [p.place, fmt(p.date)].filter(Boolean).join(' · ');
    viewer.classList.toggle('is-single', panos.length < 2);
    if (state.url) URL.revokeObjectURL(state.url);
    state.url = URL.createObjectURL(p.image);
    const img = new Image();
    img.src = state.url;
    try { await img.decode(); } catch { await new Promise(r => { img.onload = r; img.onerror = r; }); }
    if (state.index !== i || viewer.hidden) return;
    state.img = img;
    let kind = p.kind || ((img.naturalWidth / img.naturalHeight > 1.9 && img.naturalWidth / img.naturalHeight < 2.1) ? 'sphere' : 'wide');
    if (kind === 'sphere' && !initGL()) kind = 'loop';
    state.kind = kind;
    viewer.dataset.kind = kind;
    state.yaw = 0; state.pitch = 0; state.fov = 1.35; state.zoom = 1; state.vx = 0; state.vyaw = 0; state.autoDir = -1;
    if (kind === 'sphere') uploadTexture(img);
    else { strip.style.backgroundImage = `url("${state.url}")`; strip.style.backgroundRepeat = kind === 'loop' ? 'repeat-x' : 'no-repeat'; state.x = 0; }
    viewer.classList.remove('is-loading');
    draw();
  }
  function open(i) {
    viewer.hidden = false;
    document.body.classList.add('rnr-viewer-open', 'rnr-pano-open');
    state.auto = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    viewer.querySelector('[data-pv-auto]').classList.toggle('is-on', state.auto);
    viewer.querySelector('[data-pv-gyro]').hidden = !('DeviceOrientationEvent' in window && matchMedia('(pointer: coarse)').matches);
    state.lastT = 0;
    cancelAnimationFrame(state.raf); state.raf = requestAnimationFrame(tick);
    show(i);
    viewer.querySelector('[data-pv-close]').focus();
  }
  function close() {
    if (viewer.hidden) return;
    viewer.hidden = true;
    cancelAnimationFrame(state.raf);
    stopGyro();
    document.body.classList.remove('rnr-viewer-open', 'rnr-pano-open');
    if (state.url) { URL.revokeObjectURL(state.url); state.url = ''; }
    strip.style.backgroundImage = '';
  }

  // --- Dragging, pinching, wheel ---
  const pointers = new Map();
  let last = null, pinch0 = 0, zoom0 = 1, fov0 = 1.35;
  stage.addEventListener('pointerdown', e => {
    stage.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    state.dragging = true; stopAuto();
    last = { x: e.clientX, y: e.clientY, t: performance.now() };
    if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); zoom0 = state.zoom; fov0 = state.fov; }
  });
  stage.addEventListener('pointermove', e => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch0) setZoom(d / pinch0, zoom0, fov0);
      return;
    }
    const now = performance.now(), dx = e.clientX - last.x, dy = e.clientY - last.y, dt = Math.max(1, now - last.t) / 1000;
    if (state.kind === 'sphere') {
      const k = state.fov / stage.clientHeight;
      state.yaw -= dx * k; state.pitch = Math.max(-1.45, Math.min(1.45, state.pitch + dy * k));
      state.vyaw = -dx * k / dt;
    } else { state.x += dx; state.vx = dx / dt; }
    last = { x: e.clientX, y: e.clientY, t: now };
  });
  const up = e => { pointers.delete(e.pointerId); if (!pointers.size) { state.dragging = false; pinch0 = 0; } };
  stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
  stage.addEventListener('wheel', e => { e.preventDefault(); stopAuto(); setZoom(e.deltaY < 0 ? 1.12 : 1 / 1.12); }, { passive: false });
  function setZoom(factor, baseZoom = state.zoom, baseFov = state.fov) {
    if (state.kind === 'sphere') state.fov = Math.max(0.6, Math.min(1.9, baseFov / factor));
    else {
      const before = stripSize().w, cx = stage.clientWidth / 2;
      state.zoom = Math.max(1, Math.min(3, baseZoom * factor));
      const after = stripSize().w;
      state.x = cx - (cx - state.x) * (after / before);
    }
  }
  function stopAuto() { state.auto = false; viewer.querySelector('[data-pv-auto]').classList.remove('is-on'); }

  // --- Moving the phone ---
  let g0 = null;
  function onOrient(e) {
    if (e.alpha == null) return;
    const portrait = (screen.orientation?.angle ?? window.orientation ?? 0) % 180 === 0;
    const a = e.alpha * Math.PI / 180, tilt = ((portrait ? e.beta : Math.abs(e.gamma)) - 90) * Math.PI / 180;
    if (!g0) g0 = { a, yaw: state.yaw, x: state.x };
    let da = a - g0.a; if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI;
    if (state.kind === 'sphere') { state.yaw = g0.yaw + da; state.pitch = Math.max(-1.45, Math.min(1.45, tilt)); }
    else { const { w } = stripSize(); state.x = g0.x + da / (2 * Math.PI) * w; }
  }
  async function startGyro() {
    try { if (typeof DeviceOrientationEvent.requestPermission === 'function' && (await DeviceOrientationEvent.requestPermission()) !== 'granted') return; } catch { return; }
    g0 = null; state.gyro = true; stopAuto();
    addEventListener('deviceorientation', onOrient);
    viewer.querySelector('[data-pv-gyro]').classList.add('is-on');
  }
  function stopGyro() { state.gyro = false; removeEventListener('deviceorientation', onOrient); viewer.querySelector('[data-pv-gyro]').classList.remove('is-on'); }

  viewer.addEventListener('click', async e => {
    if (e.target.closest('[data-pv-close]')) { close(); return; }
    const step = e.target.closest('[data-pv-step]');
    if (step) { show((state.index + Number(step.dataset.pvStep) + panos.length) % panos.length); return; }
    const turn = e.target.closest('[data-pv-turn]');
    if (turn) { stopAuto(); const d = Number(turn.dataset.pvTurn); if (state.kind === 'sphere') state.vyaw = d * 1.6; else state.vx = -d * 420; return; }
    if (e.target.closest('[data-pv-auto]')) { state.auto = !state.auto; e.target.closest('[data-pv-auto]').classList.toggle('is-on', state.auto); if (state.auto) stopGyro(); return; }
    const z = e.target.closest('[data-pv-zoom]');
    if (z) { stopAuto(); setZoom(Number(z.dataset.pvZoom) > 0 ? 1.25 : 0.8); return; }
    if (e.target.closest('[data-pv-gyro]')) { if (state.gyro) stopGyro(); else startGyro(); return; }
    if (e.target.closest('[data-pv-edit]') && isAdmin()) { const p = panos[state.index]; close(); edit(p); return; }
    if (e.target.closest('[data-pv-delete]') && isAdmin()) { const p = panos[state.index]; if (!confirm(`Delete "${p.title || 'this view'}"?`)) return; await run('readwrite', s => s.delete(p.id)); close(); await refresh(); }
  });
  document.addEventListener('keydown', e => {
    if (viewer.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { stopAuto(); const d = e.key === 'ArrowLeft' ? -1 : 1; if (state.kind === 'sphere') state.vyaw = d * 1.6; else state.vx = -d * 420; }
    else if (e.key === '+' || e.key === '=') setZoom(1.25);
    else if (e.key === '-') setZoom(0.8);
  });
  addEventListener('resize', () => { if (!viewer.hidden) draw(); });

  // ---------- Owner form ----------
  async function guessKind(file) {
    try { const b = await createImageBitmap(file); const r = b.width / b.height; b.close?.(); return r > 1.9 && r < 2.1 ? 'sphere' : 'wide'; } catch { return 'wide'; }
  }
  function edit(p) {
    window.RNR_OWNER_FORM?.({ eyebrow: '360° VIEW', title: p ? 'Edit 360° view' : 'Add a 360° view',
      note: 'Use a panorama from your phone camera, or a photo from a 360° camera (twice as wide as it is tall).',
      fields: [
        { name: 'title', label: 'Title', value: p?.title || '', placeholder: 'e.g. Sunset at Cox\'s Bazar beach', maxlength: 80 },
        { name: 'place', label: 'Place', value: p?.place || '', placeholder: 'e.g. Cox\'s Bazar, Bangladesh', maxlength: 80 },
        { name: 'date', label: 'Date', type: 'date', value: p?.date || '' },
        { name: 'kind', label: 'Type of photo', type: 'select', options: Object.keys(KINDS), value: kindName(p?.kind) },
        { name: 'image', label: p ? 'Photo (choose to replace)' : 'Panorama photo', type: 'file', accept: 'image/*' }
      ],
      save: async d => {
        const file = d.image?.[0];
        if (!p && !file) { alert('Please choose the panorama photo.'); return false; }
        const rec = { ...(p || { id: `pano-${Date.now()}`, createdAt: new Date().toISOString() }), title: d.title.trim(), place: d.place.trim(), date: d.date || '' };
        if (file) rec.image = window.RNR_SHRINK ? await window.RNR_SHRINK(file, { maxEdge: 6000 }).catch(() => file) : file;
        rec.kind = KINDS[d.kind] || (file ? await guessKind(rec.image) : (p?.kind || 'wide'));
        try { await run('readwrite', s => s.put(rec)); } catch { alert('Could not save. Browser storage may be full.'); return false; }
        await refresh();
      },
      extraLabel: p ? 'Delete' : undefined,
      extra: p ? async () => { if (!confirm(`Delete "${p.title || 'this view'}"?`)) return false; await run('readwrite', s => s.delete(p.id)); await refresh(); } : undefined });
  }

  section.addEventListener('click', e => {
    if (e.target.closest('[data-pano-add]') && isAdmin()) { edit(null); return; }
    const ed = e.target.closest('[data-pano-edit]');
    if (ed && isAdmin()) { edit(panos.find(p => p.id === ed.dataset.panoEdit)); return; }
    const o = e.target.closest('[data-pano-open]');
    if (o) open(Number(o.dataset.panoOpen));
  });

  async function refresh() { await load(); render(); }
  addEventListener('rnr:language', () => render());
  window.RNR_PANORAMA = { refresh, open, all: () => panos.slice() };
  setTimeout(refresh, 350);
})();

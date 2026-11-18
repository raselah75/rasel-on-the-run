/* =====================================================================
   RASEL ON THE RUN — PREMIUM EXPERIENCE
   1. Full-screen photo viewer (swipe, arrows, keyboard, caption).
   2. Gentle reveal animation while scrolling.
   3. Photos are resized automatically when uploaded (faster site, less storage).
   4. Optional visitor statistics (Plausible or Google Analytics, see site-config.js).
   ===================================================================== */
(() => {
  'use strict';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isFileName = text => /\.(jpe?g|png|heic|heif|webp|gif|avif|bmp|tiff?)$/i.test(String(text || '').trim()) || /^(img|dsc|pxl|photo|image|whatsapp image)[\s_-]?\d/i.test(String(text || '').trim());

  // ---------------------------------------------------------------
  // 1. PHOTO VIEWER
  // ---------------------------------------------------------------
  const GALLERY_SELECTOR = '#memoryGallery, .memory-grid, .study-photo-grid, .rnr-reader-gallery, .city-photo-grid, [id$="PhotoGallery"]';
  const viewer = document.createElement('div');
  viewer.className = 'rnr-viewer';
  viewer.hidden = true;
  viewer.setAttribute('role', 'dialog');
  viewer.setAttribute('aria-modal', 'true');
  viewer.setAttribute('aria-label', 'Photo viewer');
  viewer.innerHTML = `
    <div class="rnr-viewer-top"><span class="rnr-viewer-count" aria-live="polite"></span><button type="button" class="rnr-viewer-close" aria-label="Close">✕</button></div>
    <button type="button" class="rnr-viewer-nav is-prev" aria-label="Previous photo">‹</button>
    <div class="rnr-viewer-stage"><div class="rnr-viewer-frame"><img alt=""><span class="rnr-viewer-mark" aria-hidden="true">Rasel's Archive</span></div><span class="rnr-viewer-spinner" aria-hidden="true"></span></div>
    <button type="button" class="rnr-viewer-nav is-next" aria-label="Next photo">›</button>
    <div class="rnr-viewer-info">
      <p class="rnr-viewer-caption"></p>
      <ul class="rnr-viewer-meta"></ul>
      <div class="rnr-viewer-actions"></div>
    </div>`;
  document.body.append(viewer);
  const vImg = viewer.querySelector('img');
  let items = [], index = 0, lastFocus = null, token = 0;

  const captionOf = img => {
    const text = img.closest('article, figure, .memory-card')?.querySelector('h3, figcaption, .memory-caption h3')?.textContent?.trim() || img.alt || '';
    return isFileName(text) ? '' : text;
  };
  const ICONS = {
    date: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7Zm12 7v10H5V9h14Z"/></svg>',
    place: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"/></svg>',
    camera: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3 7.2 5H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.2L15 3H9Zm3 5a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"/></svg>',
    note: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v2H4V4Zm0 5h16v2H4V9Zm0 5h10v2H4v-2Z"/></svg>'
  };
  function renderInfo(item) {
    const info = viewer.querySelector('.rnr-viewer-info');
    viewer.querySelector('.rnr-viewer-caption').textContent = item.caption || '';
    viewer.querySelector('.rnr-viewer-meta').innerHTML = (item.meta || []).filter(m => m && m.text)
      .map(m => `<li>${ICONS[m.icon] || ''}<span></span></li>`).join('');
    [...viewer.querySelectorAll('.rnr-viewer-meta li span')].forEach((span, i) => { span.textContent = (item.meta || []).filter(m => m && m.text)[i].text; });
    const box = viewer.querySelector('.rnr-viewer-actions');
    box.innerHTML = '';
    (item.actions || []).filter(a => !a.ownerOnly || document.body.classList.contains('admin-mode')).forEach(action => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `rnr-viewer-action${action.danger ? ' is-danger' : ''}`;
      b.textContent = action.label;
      b.addEventListener('click', () => action.run(item, { refresh: () => show(index), close, remove: () => { items.splice(index, 1); if (!items.length) close(); else show(Math.min(index, items.length - 1)); } }));
      box.append(b);
    });
    info.classList.toggle('is-empty', !item.caption && !viewer.querySelector('.rnr-viewer-meta li') && !box.children.length);
  }
  async function show(i) {
    if (!items.length) return;
    index = (i + items.length) % items.length;
    const item = items[index];
    const mine = ++token;
    vImg.classList.remove('is-in');
    viewer.classList.add('is-loading');
    viewer.querySelector('.rnr-viewer-count').textContent = items.length > 1 ? `${index + 1} / ${items.length}` : '';
    viewer.classList.toggle('is-single', items.length < 2);
    renderInfo(item);
    try {
      const src = typeof item.load === 'function' ? await item.load() : item.src;
      if (mine !== token) return;
      vImg.src = src || '';
      vImg.alt = item.alt || item.caption || 'Photo';
      await vImg.decode().catch(() => {});
    } catch (error) { console.warn(error); }
    if (mine !== token) return;
    viewer.classList.remove('is-loading');
    requestAnimationFrame(() => vImg.classList.add('is-in'));
    if (typeof item.details === 'function') {
      item.details().then(extra => { if (mine === token && extra) { Object.assign(item, extra); renderInfo(item); } }).catch(() => {});
    }
    // Warm up the next photo.
    const next = items[(index + 1) % items.length];
    if (next && typeof next.load === 'function' && items.length > 1) next.load().catch(() => {});
  }
  function open(group, start) {
    items = group; lastFocus = document.activeElement;
    viewer.hidden = false;
    document.body.classList.add('rnr-viewer-open');
    show(start);
    viewer.querySelector('.rnr-viewer-close').focus();
  }
  function close() {
    viewer.hidden = true;
    token += 1;
    document.body.classList.remove('rnr-viewer-open');
    vImg.removeAttribute('src');
    lastFocus?.focus?.();
    window.dispatchEvent(new CustomEvent('rnr:viewer-closed'));
  }
  window.RNR_VIEWER = { open, close, isOpen: () => !viewer.hidden };

  // Plain galleries elsewhere on the site (memories, study journey, stories).
  document.addEventListener('click', event => {
    const img = event.target.closest('img');
    if (!img || event.target.closest('button, a, input, label, .rnr-viewer')) return;
    const gallery = img.closest(GALLERY_SELECTOR);
    if (!gallery || img.closest('.empty-state') || img.closest('.rnr-gallery')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const group = [...gallery.querySelectorAll('img')].filter(el => el.offsetParent !== null || el === img);
    open(group.map(el => ({ src: el.currentSrc || el.src, caption: captionOf(el), alt: el.alt })), Math.max(0, group.indexOf(img)));
  }, true);
  viewer.addEventListener('click', event => {
    if (event.target.closest('.rnr-viewer-close') || event.target === viewer || event.target.classList.contains('rnr-viewer-stage')) close();
    else if (event.target.closest('.is-prev')) show(index - 1);
    else if (event.target.closest('.is-next')) show(index + 1);
  });
  document.addEventListener('keydown', event => {
    if (viewer.hidden || event.target.closest?.('input, textarea')) return;
    if (event.key === 'Escape') close();
    if (event.key === 'ArrowLeft') show(index - 1);
    if (event.key === 'ArrowRight') show(index + 1);
  });
  // Swipe left / right on phones, swipe down to close.
  let touch = null;
  viewer.addEventListener('touchstart', event => { const t = event.touches[0]; touch = { x: t.clientX, y: t.clientY }; }, { passive: true });
  viewer.addEventListener('touchend', event => {
    if (!touch || event.target.closest('.rnr-viewer-info')) { touch = null; return; }
    const t = event.changedTouches[0], dx = t.clientX - touch.x, dy = t.clientY - touch.y;
    touch = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(index + (dx < 0 ? 1 : -1));
    else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) close();
  }, { passive: true });

  // Hide captions that are only camera file names (e.g. "IMG_2041.jpg") from visitors.
  function markFileNameCaptions(root = document) {
    root.querySelectorAll?.('.memory-caption h3, .jt-photo-body h3').forEach(h => h.classList.toggle('rnr-file-name', isFileName(h.textContent)));
  }

  // ---------------------------------------------------------------
  // 2. REVEAL ON SCROLL
  // ---------------------------------------------------------------
  const REVEAL = '.section-heading, .rnr-globe-card, #countryList .country-shell, .memory-card, .rnr-story-card, .study-entry, .rnr-contact-wrap, .about-me-card, .intro-section > *, .rnr-coming-soon > div';
  let observer = null;
  if (!reduceMotion && 'IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('rnr-in');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    document.documentElement.classList.add('rnr-reveal-ready');
  }
  function watchReveal(root = document) {
    if (!observer) return;
    const list = root.querySelectorAll ? root.querySelectorAll(REVEAL) : [];
    list.forEach((el, i) => {
      if (el.dataset.rnrReveal) return;
      el.dataset.rnrReveal = '1';
      el.style.setProperty('--rnr-delay', `${Math.min(i % 4, 3) * 70}ms`);
      // Anything already on screen appears straight away.
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0 && el.offsetParent !== null) { el.classList.add('rnr-in'); return; }
      observer.observe(el);
    });
  }

  // ---------------------------------------------------------------
  // 3. AUTOMATIC PHOTO RESIZE ON UPLOAD
  // ---------------------------------------------------------------
  const MAX_EDGE = 2400, MIN_BYTES = 900 * 1024;
  async function shrink(file, { maxEdge = MAX_EDGE } = {}) {
    if (!file.type.startsWith('image/') || /gif|svg/.test(file.type)) return file;
    let bitmap;
    try { bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch { return file; }
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < MIN_BYTES) { bitmap.close?.(); return file; }
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const keepPng = file.type === 'image/png' && file.size < 4 * 1024 * 1024;
    const type = keepPng ? 'image/png' : 'image/jpeg';
    const blob = await new Promise(resolve => canvas.toBlob(resolve, type, 0.86));
    if (!blob || blob.size >= file.size) return file;
    const name = keepPng ? file.name : file.name.replace(/\.(png|heic|heif|webp|bmp|tiff?|avif)$/i, '.jpg');
    return new File([blob], name, { type, lastModified: file.lastModified });
  }
  window.RNR_SHRINK = shrink;
  const resizing = new WeakSet();
  document.addEventListener('change', async event => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || input.type !== 'file' || !input.files?.length) return;
    if (resizing.has(input)) { resizing.delete(input); return; }
    if (![...input.files].some(f => f.type.startsWith('image/') && !/gif|svg/.test(f.type))) return;
    if (typeof DataTransfer === 'undefined') return;
    event.stopImmediatePropagation();
    document.body.classList.add('rnr-busy');
    try {
      const files = await Promise.all([...input.files].map(f => shrink(f).catch(() => f)));
      const dt = new DataTransfer();
      files.forEach(f => dt.items.add(f));
      input.files = dt.files;
    } catch (error) { console.warn('Photo resize skipped:', error); }
    document.body.classList.remove('rnr-busy');
    resizing.add(input);
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, true);

  // ---------------------------------------------------------------
  // 4. VISITOR STATISTICS (only when configured; never counts the owner)
  // ---------------------------------------------------------------
  function analytics() {
    const cfg = (window.RNR_SITE || {}).analytics || {};
    let owner = false;
    try { owner = localStorage.getItem('raselOnTheRunOwnerDeviceV1') === '1' || Boolean(localStorage.getItem('raselOnTheRunAdminCredentialV1')); } catch {}
    if (owner || location.protocol === 'file:' || /^(localhost|127\.)/.test(location.hostname)) return;
    if (cfg.plausibleDomain) {
      const s = document.createElement('script');
      s.defer = true; s.dataset.domain = cfg.plausibleDomain; s.src = 'https://plausible.io/js/script.js';
      document.head.append(s);
    }
    if (cfg.googleAnalyticsId) {
      const s = document.createElement('script');
      s.async = true; s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(cfg.googleAnalyticsId)}`;
      document.head.append(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', cfg.googleAnalyticsId, { anonymize_ip: true });
    }
  }

  // ---------------------------------------------------------------
  function init() {
    markFileNameCaptions();
    watchReveal();
    analytics();
    let queued = 0;
    new MutationObserver(mutations => {
      cancelAnimationFrame(queued);
      queued = requestAnimationFrame(() => {
        mutations.forEach(m => m.addedNodes.forEach(node => { if (node.nodeType === 1) { markFileNameCaptions(node); watchReveal(node); } }));
        watchReveal();
      });
    }).observe(document.querySelector('main') || document.body, { childList: true, subtree: true });
    // Elements on a newly shown page that were hidden before.
    addEventListener('hashchange', () => setTimeout(() => {
      document.querySelectorAll('[data-rnr-reveal]:not(.rnr-in)').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.top < innerHeight && r.bottom > 0) el.classList.add('rnr-in');
      });
    }, 60));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();

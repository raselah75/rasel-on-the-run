/* Final readiness layer: accessibility, resilient media, device-aware behavior. */
(() => {
  'use strict';
  const root = document.documentElement;
  const body = document.body;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const saveData = Boolean(navigator.connection && navigator.connection.saveData);

  // 1. Identify broad device classes for responsive styling (no user-agent lock-in).
  const ua = navigator.userAgent || '';
  const platform = /iPhone|iPad|iPod/i.test(ua) ? 'ios' : /Android/i.test(ua) ? 'android' : /Mac/i.test(navigator.platform || ua) ? 'mac' : /Windows/i.test(ua) ? 'windows' : 'desktop';
  root.dataset.platform = platform;
  root.dataset.input = coarsePointer ? 'touch' : 'pointer';
  if (saveData) root.dataset.saveData = 'true';

  // 2. Honor motion preferences and 3. improve keyboard focus visibility.
  if (reducedMotion) root.classList.add('rnr-reduced-motion');
  document.addEventListener('keydown', event => {
    if (event.key === 'Tab') body.classList.add('rnr-keyboard-user');
  }, { once: true });
  document.addEventListener('pointerdown', () => body.classList.remove('rnr-keyboard-user'), { passive: true });

  // 4. Lazy-load dynamically-added images and 5. decode images before display where supported.
  const prepareImage = img => {
    if (!(img instanceof HTMLImageElement)) return;
    if (!img.hasAttribute('loading') && !img.closest('.hero-photo')) img.loading = 'lazy';
    if (!img.hasAttribute('decoding')) img.decoding = 'async';
    if (saveData && !img.hasAttribute('fetchpriority')) img.fetchPriority = 'low';
    img.addEventListener('error', () => {
      img.classList.add('rnr-image-unavailable');
      img.setAttribute('aria-label', img.alt ? `${img.alt} (image unavailable)` : 'Image unavailable');
    }, { once: true });
  };
  document.querySelectorAll('img').forEach(prepareImage);
  new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(node => {
    if (node.nodeType !== 1) return;
    if (node.matches?.('img')) prepareImage(node);
    node.querySelectorAll?.('img').forEach(prepareImage);
  }))).observe(body, { childList: true, subtree: true });

  // 6. Native form validation feedback without blocking existing submit handlers.
  document.addEventListener('invalid', event => {
    const field = event.target;
    field.classList.add('rnr-invalid');
    field.addEventListener('input', () => field.classList.remove('rnr-invalid'), { once: true });
  }, true);

  // 7. External links open safely in a new tab only when already configured to do so.
  document.querySelectorAll('a[target="_blank"]').forEach(link => {
    const rel = new Set((link.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
    rel.add('noopener'); rel.add('noreferrer'); link.setAttribute('rel', [...rel].join(' '));
  });

  // 8. Provide a non-intrusive online/offline status for connectivity-dependent features.
  const status = document.createElement('div');
  status.className = 'rnr-connectivity-status'; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  status.textContent = navigator.onLine ? '' : 'You are offline. Locally saved content remains available; online services may not work.';
  body.append(status);
  const updateConnection = () => {
    status.textContent = navigator.onLine ? '' : 'You are offline. Locally saved content remains available; online services may not work.';
    status.classList.toggle('is-visible', !navigator.onLine);
  };
  addEventListener('online', updateConnection); addEventListener('offline', updateConnection);
  updateConnection();

  // 9. Add descriptive page metadata when missing.
  if (!document.querySelector('meta[name="color-scheme"]')) {
    const meta = document.createElement('meta'); meta.name = 'color-scheme'; meta.content = 'light'; document.head.append(meta);
  }
  if (!document.querySelector('meta[property="og:title"]')) {
    const meta = document.createElement('meta'); meta.setAttribute('property', 'og:title'); meta.content = document.title; document.head.append(meta);
  }
  if (!document.querySelector('meta[property="og:description"]')) {
    const meta = document.createElement('meta'); meta.setAttribute('property', 'og:description'); meta.content = document.querySelector('meta[name="description"]')?.content || 'A personal travel and life archive.'; document.head.append(meta);
  }

  // 10. Keep touch controls comfortably tappable on phones/tablets.
  if (coarsePointer) root.classList.add('rnr-touch-device');
})();

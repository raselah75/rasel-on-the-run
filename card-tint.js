/* =====================================================================
   RASEL ON THE RUN — CARD COLOURS FROM THE PHOTO
   Every country / state / city card takes its colour from its own cover
   photo: the dark fade at the bottom, the flag badge, the small "COUNTRY"
   label and the Explore button are tinted with the photo's main colour,
   so each card looks different (sea-blue Maldives, green Bangladesh...).
   Colours are worked out in the browser (no service) and remembered.
   If a photo does not allow reading its colours, the card keeps the
   normal look.
   ===================================================================== */
(() => {
  'use strict';
  const KEY = 'raselOnTheRunCardTintV1';
  const MAX = 400;
  let cache = {};
  try { cache = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { cache = {}; }
  let saveTimer = 0;
  const save = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const keys = Object.keys(cache);
      if (keys.length > MAX) keys.slice(0, keys.length - MAX).forEach(k => delete cache[k]);
      try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch {}
    }, 400);
  };
  const pending = new Map();

  const urlOf = card => {
    const v = card.style.getPropertyValue('--rnr-card-photo') || '';
    const m = v.match(/url\(\s*["']?(.*?)["']?\s*\)/);
    return m ? m[1].replace(/\\"/g, '"') : '';
  };
  // blob: links change every visit — remember them only for this visit.
  const keyOf = url => (url.startsWith('blob:') ? '' : url);

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
    if (max === min) return [0, 0, l];
    const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [h * 60, s, l];
  }
  const hsl = (h, s, l) => `hsl(${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`;

  // Main colour: average of the most colourful pixels (skips grey sky and black shadow).
  function measure(url) {
    if (pending.has(url)) return pending.get(url);
    const job = new Promise(resolve => {
      const img = new Image();
      if (!url.startsWith('blob:') && !url.startsWith('data:')) img.crossOrigin = 'anonymous';
      img.decoding = 'async';
      const t = setTimeout(() => resolve(null), 15000);
      img.onload = () => {
        clearTimeout(t);
        try {
          const c = document.createElement('canvas'); c.width = 36; c.height = 36;
          const x = c.getContext('2d', { willReadFrequently: true });
          x.drawImage(img, 0, 0, 36, 36);
          const d = x.getImageData(0, 0, 36, 36).data;
          const buckets = new Map();
          for (let i = 0; i < d.length; i += 4) {
            const [h, s, l] = rgbToHsl(d[i], d[i + 1], d[i + 2]);
            if (l < 0.12 || l > 0.92) continue;
            const w = 0.15 + s * s * 2;
            const b = Math.round(h / 24) % 15;
            const e = buckets.get(b) || { w: 0, h: 0, s: 0, l: 0, sin: 0, cos: 0 };
            e.w += w; e.s += s * w; e.l += l * w;
            e.sin += Math.sin(h * Math.PI / 180) * w; e.cos += Math.cos(h * Math.PI / 180) * w;
            buckets.set(b, e);
          }
          const best = [...buckets.values()].sort((a, b) => b.w - a.w)[0];
          if (!best) return resolve(null);
          let h = Math.atan2(best.sin, best.cos) * 180 / Math.PI; if (h < 0) h += 360;
          resolve({ h: Math.round(h), s: +(best.s / best.w).toFixed(2), l: +(best.l / best.w).toFixed(2) });
        } catch { resolve(null); } // the photo does not allow reading its colours
      };
      img.onerror = () => { clearTimeout(t); resolve(null); };
      img.src = url;
    });
    pending.set(url, job);
    return job;
  }

  function paint(card, tint) {
    if (!tint) { card.classList.remove('rnr-tinted'); return; }
    const s = Math.min(0.75, Math.max(0.32, tint.s));
    card.style.setProperty('--rnr-tint', hsl(tint.h, s, 0.5));
    card.style.setProperty('--rnr-tint-deep', hsl(tint.h, Math.min(0.6, s), 0.13));
    card.style.setProperty('--rnr-tint-mid', `hsl(${tint.h} ${Math.round(Math.min(0.6, s) * 100)}% 22% / .55)`);
    card.style.setProperty('--rnr-tint-light', hsl(tint.h, Math.min(0.9, s + 0.2), 0.78));
    card.classList.add('rnr-tinted');
  }

  async function tintCard(card) {
    const url = urlOf(card);
    if (!url || card.dataset.rnrTintUrl === url) return;
    card.dataset.rnrTintUrl = url;
    const k = keyOf(url);
    if (k && cache[k] !== undefined) { paint(card, cache[k]); return; }
    const tint = await measure(url);
    if (k) { cache[k] = tint; save(); }
    if (card.isConnected && urlOf(card) === url) paint(card, tint);
  }

  let timer = 0;
  function scan() {
    clearTimeout(timer);
    timer = setTimeout(() => document.querySelectorAll('.rnr-photo-card').forEach(card => {
      if (urlOf(card)) tintCard(card); else if (card.classList.contains('rnr-tinted')) { card.classList.remove('rnr-tinted'); delete card.dataset.rnrTintUrl; }
    }), 120);
  }
  function init() {
    scan();
    const root = document.getElementById('countryList') || document.querySelector('main');
    if (root) new MutationObserver(scan).observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
  }
  window.RNR_CARD_TINT = { scan, measure };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();

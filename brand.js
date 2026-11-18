/* =====================================================================
   RASEL ON THE RUN — LOGO + FIRST-VISIT LOADING ANIMATION
   The monogram: an "R" path over a mountain with a rising sun.
   ===================================================================== */
(() => {
  'use strict';
  let logoCount = 0;
  const makeLogo = () => { logoCount += 1; return LOGO.replaceAll('rnrSun', `rnrSun${logoCount}`); };
  const LOGO = `<svg class="rnr-logo" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
    <defs><linearGradient id="rnrSun" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6c46f"/><stop offset="1" stop-color="#e9785a"/></linearGradient></defs>
    <rect x="2" y="2" width="60" height="60" rx="18" fill="#0f2233" stroke="rgba(243,183,101,.55)" stroke-width="2"/>
    <circle class="rnr-logo-sun" cx="44" cy="20" r="6" fill="url(#rnrSun)"/>
    <path class="rnr-logo-mountain" d="M8 50 L24 28 L32 39 L39 31 L56 50 Z" fill="#1d6b74"/>
    <path class="rnr-logo-r" d="M21 46 V20 h9.5 a7 7 0 0 1 0 14 H21 M29 34 L38 46" fill="none" stroke="#fff" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
  window.RNR_LOGO_SVG = makeLogo;

  // Header brand mark
  const brand = document.querySelector('.site-header .brand');
  if (brand && !brand.querySelector('.rnr-logo')) {
    brand.classList.add('rnr-brand-with-logo');
    brand.insertAdjacentHTML('afterbegin', `<span class="rnr-brand-mark">${makeLogo()}</span>`);
  }
  // Footer brand mark
  const footerBrand = document.querySelector('.site-footer .footer-brand');
  if (footerBrand && !footerBrand.querySelector('.rnr-logo')) footerBrand.insertAdjacentHTML('afterbegin', `<span class="rnr-brand-mark">${makeLogo()}</span>`);

  // First visit in this browser session: a short logo animation.
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let seen = false;
  try { seen = sessionStorage.getItem('rnrIntroSeen') === '1'; sessionStorage.setItem('rnrIntroSeen', '1'); } catch {}
  if (seen || reduce) return;
  const splash = document.createElement('div');
  splash.className = 'rnr-splash';
  splash.setAttribute('aria-hidden', 'true');
  splash.innerHTML = `<div class="rnr-splash-inner">${makeLogo()}<strong>Rasel On the Run</strong><span>Every Journey Tells a Story.</span></div>`;
  document.body.append(splash);
  document.body.classList.add('rnr-splash-on');
  const hide = () => {
    if (!splash.isConnected || splash.classList.contains('is-leaving')) return;
    splash.classList.add('is-leaving');
    document.body.classList.remove('rnr-splash-on');
    setTimeout(() => splash.remove(), 700);
  };
  // Leave after the animation, and never block the page for more than ~2 seconds.
  const started = performance.now();
  addEventListener('load', () => setTimeout(hide, Math.max(0, 1300 - (performance.now() - started))), { once: true });
  setTimeout(hide, 2200);
  splash.addEventListener('click', hide);
})();

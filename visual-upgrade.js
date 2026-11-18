/* Visual polish and usability improvements. Additive: preserves existing data and feature modules. */
(() => {
  'use strict';
  const style = document.createElement('style');
  style.textContent = `
    :root { --font-ui: Helvetica, Arial, sans-serif; --surface-shadow: 0 12px 34px rgba(24,35,29,.065); --surface-shadow-hover: 0 18px 42px rgba(24,35,29,.11); }
    html { scroll-behavior: smooth; scroll-padding-top: 100px; }
    body, button, input, select, textarea { font-family: Helvetica, Arial, sans-serif !important; }
    body { text-rendering: optimizeLegibility; -webkit-font-smoothing: antialiased; }
    .site-header { min-height: 76px; padding: 14px clamp(18px,4vw,58px); gap: 24px; box-shadow: 0 5px 24px rgba(20,35,28,.045); backdrop-filter: blur(16px); }
    .brand { display:flex; flex-direction:column; gap:3px; text-decoration:none; flex-shrink:0; }
    .brand-name { font-family: Helvetica, Arial, sans-serif !important; font-weight:700; letter-spacing:-.045em; }
    .brand-tagline { font-size:10px; letter-spacing:.11em; text-transform:uppercase; }
    .main-nav { gap: clamp(12px,1.8vw,25px); align-items:center; }
    .main-nav a { position:relative; transition:color .2s ease; }
    .main-nav a[aria-current="location"] { color:var(--gold,#b18b55); }
    .main-nav a[aria-current="location"]::after { content:""; position:absolute; left:0; right:0; bottom:-8px; height:2px; border-radius:2px; background:currentColor; }
    .hero { padding:clamp(70px,9vw,126px) clamp(22px,7vw,100px); gap:clamp(28px,5vw,70px); }
    .hero h1,.intro-section h2,.section-heading h2 { font-family:Helvetica,Arial,sans-serif !important; letter-spacing:-.045em; line-height:1.08; }
    .hero-description,.intro-section>p:last-child,.section-heading p { line-height:1.75; }
    .section { padding:clamp(44px,6vw,82px) clamp(18px,5vw,72px); scroll-margin-top:90px; }
    .section-heading { margin-bottom:26px; gap:22px; }
    .country-grid,.memory-grid { gap:clamp(14px,2vw,24px); }
    .country-card,.region-card,.city-item,.memory-card,.premium-card,.next-card,.p7-card,.study-entry,.study-entry-form,.about-me-inner,.media-count-dashboard,.mcd-stat,.ax-card,.fj-card,.fj-item,.ltd-project,.ltd-form,.ltd-chapter,.human-card,.next-upgrade-card { border:0 !important; box-shadow:var(--surface-shadow) !important; border-radius:18px !important; transition:transform .22s ease,box-shadow .22s ease; }
    .country-card:hover,.memory-card:hover,.premium-card:hover,.next-card:hover,.p7-card:hover,.study-entry:hover { transform:translateY(-3px); box-shadow:var(--surface-shadow-hover) !important; }
    .country-card img,.memory-card img,.study-photo-grid img { display:block; }
    img,video { max-width:100%; }
    button,a,input,select,textarea { -webkit-tap-highlight-color:transparent; }
    :where(a,button,input,select,textarea,[tabindex]):focus-visible { outline:3px solid rgba(177,139,85,.58) !important; outline-offset:3px; }
    button { min-height:40px; }
    input,select,textarea { border-radius:10px !important; }
    .site-footer { margin-top:clamp(45px,7vw,90px); padding:58px 22px 30px; }
    .footer-brand { font-family:Helvetica,Arial,sans-serif !important; font-weight:700; letter-spacing:-.04em; }
    #raselBackToTop { position:fixed; z-index:30; right:20px; bottom:20px; width:44px; height:44px; border:0; border-radius:50%; background:#263b31; color:white; box-shadow:0 8px 24px #0002; cursor:pointer; opacity:0; pointer-events:none; transform:translateY(8px); transition:opacity .2s,transform .2s; }
    #raselBackToTop.visible { opacity:1; pointer-events:auto; transform:translateY(0); }
    @media(max-width:900px){ .site-header{gap:12px}.main-nav{gap:18px}.section{padding-inline:clamp(18px,4vw,36px)} }
    @media(max-width:600px){ html{scroll-padding-top:125px}.site-header{gap:8px}.brand-name{font-size:21px}.main-nav{padding:7px 0 9px;gap:18px}.main-nav a{font-size:12px}.section-heading{gap:15px}.country-grid,.memory-grid{grid-template-columns:1fr}.country-card,.memory-card{min-width:0}.site-footer{padding:42px 18px 25px}#raselBackToTop{right:14px;bottom:14px} }
    @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}*,*::before,*::after{transition:none !important;animation:none !important}}
  `;
  document.head.append(style);

  // Lazy-load media added by existing and future feature modules.
  const optimizeMedia = root => {
    (root || document).querySelectorAll('img:not([loading]), video:not([preload])').forEach(el => {
      if (el.tagName === 'IMG') { el.loading = 'lazy'; el.decoding = 'async'; }
      else el.preload = 'metadata';
    });
  };
  optimizeMedia();
  new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(node => {
    if (node.nodeType === 1) optimizeMedia(node);
  }))).observe(document.documentElement,{childList:true,subtree:true});

  // Keep the current section clear in the existing navigation.
  const navLinks = [...document.querySelectorAll('.main-nav a[href^="#"]')];
  const targets = navLinks.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navLinks.forEach(link => link.removeAttribute('aria-current'));
      const active = navLinks.find(link => link.getAttribute('href') === `#${entry.target.id}`);
      if (active) active.setAttribute('aria-current','location');
    }),{rootMargin:'-22% 0px -68% 0px'});
    targets.forEach(target => observer.observe(target));
  }

  const top = document.createElement('button');
  top.id = 'raselBackToTop'; top.type = 'button'; top.setAttribute('aria-label','Back to top'); top.textContent = '↑';
  top.addEventListener('click',() => window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}));
  document.body.append(top);
  const updateTop = () => top.classList.toggle('visible',window.scrollY > 550);
  window.addEventListener('scroll',updateTop,{passive:true}); updateTop();
})();

/* =====================================================================
   RASEL ON THE RUN — INSTALL AS AN APP (phone / tablet / computer)
   • "Get the app" button in the footer and in the phone menu.
   • Android / Chrome / Edge: opens the browser's own install window.
   • iPhone / iPad (Safari), Mac Safari and others: a short picture guide.
   • On phones, a small one-time invitation from the second visit on.
   • When opened from the home screen: full screen, no browser bars.
   ===================================================================== */
(() => {
  'use strict';
  const KEY = 'raselOnTheRunAppPromptV1';
  const bn = () => document.documentElement.lang === 'bn';
  const T = (en, b) => (bn() ? b : en);
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isMacSafari = !isIOS && /Macintosh/.test(ua) && /Safari/.test(ua) && !/Chrome|Chromium|Edg|Firefox/.test(ua);
  const isPhone = matchMedia('(max-width: 820px)').matches && (isIOS || isAndroid || matchMedia('(pointer: coarse)').matches);
  const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { return {}; } };
  const write = v => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {} };

  // Opened from the home screen.
  if (standalone()) {
    document.documentElement.classList.add('rnr-standalone');
    const vp = document.querySelector('meta[name="viewport"]');
    if (vp && !/viewport-fit/.test(vp.content)) vp.content += ', viewport-fit=cover';
    if (/[?&]source=app/.test(location.search)) history.replaceState(history.state, '', `${location.pathname}${location.hash || '#home'}`);
  }

  let deferred = null;
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; update(); });
  addEventListener('appinstalled', () => { deferred = null; const s = read(); s.installed = true; write(s); closeSheet(); update(); toast(T('Installed! Find "Rasel Travels" on your home screen.', 'ইনস্টল হয়েছে! হোম স্ক্রিনে "Rasel Travels" খুঁজুন।')); });

  // ---------- Buttons ----------
  const ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 7v7m-3-3 3 3 3-3M10 18.5h4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const footer = document.querySelector('.site-footer');
  const footBtn = document.createElement('button');
  footBtn.type = 'button'; footBtn.className = 'rnr-app-btn'; footBtn.dataset.appInstall = '';
  footer?.querySelector('.copyright')?.before(footBtn);

  function update() {
    const label = `${ICON}<span>${T('Get the app', 'অ্যাপ হিসেবে রাখুন')}</span>`;
    footBtn.innerHTML = label;
    footBtn.hidden = standalone();
    document.querySelectorAll('.rnr-app-menu-btn').forEach(b => { b.innerHTML = label; b.hidden = standalone(); });
  }
  // A copy inside the phone menu (the nav list), placed after the page links.
  function placeMenuButton() {
    const nav = document.querySelector('.main-nav');
    if (!nav || nav.querySelector('.rnr-app-menu-btn')) return;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'rnr-app-menu-btn'; b.dataset.appInstall = '';
    nav.append(b); update();
  }

  // ---------- Guide sheet ----------
  const sheet = document.createElement('div');
  sheet.className = 'rnr-app-sheet'; sheet.hidden = true;
  sheet.innerHTML = '<div class="rnr-app-backdrop" data-app-close></div><div class="rnr-app-card" role="dialog" aria-modal="true" aria-labelledby="rnrAppTitle"></div>';
  document.body.append(sheet);
  const SHARE = '<svg viewBox="0 0 24 24" class="rnr-app-ico"><path d="M12 3v12M8 7l4-4 4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 10H5.5A1.5 1.5 0 0 0 4 11.5v8A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5v-8a1.5 1.5 0 0 0-1.5-1.5H17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  const PLUS = '<svg viewBox="0 0 24 24" class="rnr-app-ico"><rect x="3.5" y="3.5" width="17" height="17" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 8v8M8 12h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  const DOTS = '<svg viewBox="0 0 24 24" class="rnr-app-ico"><circle cx="12" cy="5" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="19" r="2" fill="currentColor"/></svg>';
  function steps() {
    if (isIOS) return [
      [SHARE, T('Tap the <b>Share</b> button at the bottom of Safari (top right on iPad).', 'Safari-র নিচে <b>Share</b> বোতামে চাপ দিন (iPad-এ উপরে ডানে)।')],
      [PLUS, T('Scroll down and tap <b>Add to Home Screen</b>.', 'একটু নিচে নেমে <b>Add to Home Screen</b> চাপুন।')],
      ['<img src="icon-192.png" alt="" class="rnr-app-ico is-img">', T('Tap <b>Add</b>. The app icon appears on your home screen.', '<b>Add</b> চাপুন। হোম স্ক্রিনে অ্যাপের আইকন চলে আসবে।')]
    ];
    if (isMacSafari) return [
      [SHARE, T('In Safari, open the <b>File</b> menu (or the Share button).', 'Safari-তে <b>File</b> মেনু (বা Share বোতাম) খুলুন।')],
      [PLUS, T('Choose <b>Add to Dock</b>.', '<b>Add to Dock</b> বেছে নিন।')],
      ['<img src="icon-192.png" alt="" class="rnr-app-ico is-img">', T('The app opens from your Dock like any other app.', 'এখন Dock থেকে অন্য অ্যাপের মতোই খুলবে।')]
    ];
    if (isAndroid) return [
      [DOTS, T('Tap the browser menu <b>⋮</b> (top right).', 'ব্রাউজারের মেনু <b>⋮</b> চাপুন (উপরে ডানে)।')],
      [PLUS, T('Tap <b>Install app</b> or <b>Add to Home screen</b>.', '<b>Install app</b> বা <b>Add to Home screen</b> চাপুন।')],
      ['<img src="icon-192.png" alt="" class="rnr-app-ico is-img">', T('Tap <b>Install</b>. The app icon appears on your home screen.', '<b>Install</b> চাপুন। হোম স্ক্রিনে অ্যাপের আইকন চলে আসবে।')]
    ];
    return [
      [PLUS, T('In Chrome or Edge, click the <b>install icon</b> at the right end of the address bar.', 'Chrome বা Edge-এ ঠিকানা লেখার ঘরের ডান পাশে <b>install আইকনে</b> ক্লিক করুন।')],
      [DOTS, T('Or open the menu <b>⋮</b> › <b>Cast, save and share</b> › <b>Install page as app</b>.', 'অথবা মেনু <b>⋮</b> › <b>Cast, save and share</b> › <b>Install page as app</b>।')],
      ['<img src="icon-192.png" alt="" class="rnr-app-ico is-img">', T('It opens in its own window, like an app.', 'এটি অ্যাপের মতো আলাদা জানালায় খুলবে।')]
    ];
  }
  function openSheet() {
    const card = sheet.querySelector('.rnr-app-card');
    card.innerHTML = `
      <button type="button" class="rnr-app-x" data-app-close aria-label="${T('Close', 'বন্ধ করুন')}">✕</button>
      <div class="rnr-app-head"><img src="icon-192.png" alt="" width="64" height="64"><div><p>${T('ADD TO HOME SCREEN', 'হোম স্ক্রিনে রাখুন')}</p><h3 id="rnrAppTitle">Rasel On the Run</h3></div></div>
      <p class="rnr-app-lead">${T('Open my travels with one tap — full screen, like an app. Nothing to download from a store.', 'এক চাপে আমার ভ্রমণগুলো খুলুন — পুরো স্ক্রিনে, অ্যাপের মতো। কোনো স্টোর থেকে ডাউনলোড লাগবে না।')}</p>
      <ol class="rnr-app-steps">${steps().map(([i, t]) => `<li><span>${i}</span><p>${t}</p></li>`).join('')}</ol>
      ${isIOS && !/Safari/.test(ua.replace(/CriOS|FxiOS|EdgiOS/, 'X')) ? `<p class="rnr-app-note">${T('Tip: this works in Safari. Open this page in Safari first.', 'টিপ: এটা Safari-তে কাজ করে। আগে পেজটি Safari-তে খুলুন।')}</p>` : ''}
      <button type="button" class="rnr-app-ok" data-app-close>${T('Got it', 'বুঝেছি')}</button>`;
    sheet.hidden = false;
    document.body.classList.add('rnr-modal-open');
    card.querySelector('.rnr-app-ok').focus();
  }
  function closeSheet() { if (sheet.hidden) return; sheet.hidden = true; document.body.classList.remove('rnr-modal-open'); }
  sheet.addEventListener('click', e => { if (e.target.closest('[data-app-close]')) closeSheet(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });

  async function install() {
    hideInvite(true);
    if (deferred) {
      const ev = deferred; deferred = null;
      try { ev.prompt(); const r = await ev.userChoice; if (r?.outcome === 'accepted') return; } catch {}
      update(); return;
    }
    openSheet();
  }
  document.addEventListener('click', e => {
    if (!e.target.closest('[data-app-install]')) return;
    e.preventDefault();
    document.querySelector('.site-header')?.classList.remove('rnr-menu-open');
    install();
  });

  // ---------- One-time invitation on phones ----------
  const invite = document.createElement('div');
  invite.className = 'rnr-app-invite'; invite.hidden = true; invite.setAttribute('role', 'status');
  document.body.append(invite);
  function hideInvite(forever) {
    if (invite.hidden) return;
    invite.classList.remove('is-on');
    setTimeout(() => { invite.hidden = true; }, 350);
    if (forever) { const s = read(); s.dismissed = Date.now(); write(s); }
  }
  invite.addEventListener('click', e => {
    if (e.target.closest('[data-app-later]')) hideInvite(true);
    else if (e.target.closest('[data-app-yes]')) install();
  });
  function maybeInvite() {
    const s = read();
    s.visits = (s.visits || 0) + 1; write(s);
    if (!isPhone || standalone() || s.installed) return;
    if (document.body.classList.contains('admin-mode')) return;
    // Ask from the second visit, and again only after 45 days if dismissed.
    if (s.visits < 2 || (s.dismissed && Date.now() - s.dismissed < 45 * 864e5)) return;
    setTimeout(() => {
      if (document.body.classList.contains('rnr-modal-open')) return;
      invite.innerHTML = `<img src="icon-192.png" alt="" width="44" height="44"><div><b>${T('Keep my travels on your phone', 'আমার ভ্রমণ ফোনে রাখুন')}</b><span>${T('Add it to your home screen — opens like an app.', 'হোম স্ক্রিনে যোগ করুন — অ্যাপের মতো খুলবে।')}</span></div><button type="button" class="rnr-app-yes" data-app-yes>${T('Add', 'যোগ করুন')}</button><button type="button" class="rnr-app-later" data-app-later aria-label="${T('Not now', 'এখন না')}">✕</button>`;
      invite.hidden = false;
      requestAnimationFrame(() => invite.classList.add('is-on'));
    }, 9000);
  }

  function toast(text) {
    const t = document.createElement('div');
    t.className = 'rnr-lost-note is-on'; t.textContent = text; document.body.append(t);
    setTimeout(() => { t.classList.remove('is-on'); setTimeout(() => t.remove(), 400); }, 4000);
  }

  addEventListener('rnr:language', update);
  update();
  if (document.readyState === 'complete') { placeMenuButton(); maybeInvite(); }
  else addEventListener('load', () => { placeMenuButton(); maybeInvite(); }, { once: true });
  window.RNR_APP = { install, guide: openSheet };
})();

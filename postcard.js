/* =====================================================================
   RASEL ON THE RUN — QR POSTCARDS
   On every country page (Travel Destinations → a country) there is a
   "📮 Postcard" button. It makes a real-looking postcard picture:
     • a photo of the country (your own photo if you have one, otherwise
       the card's landmark photo, otherwise a colour background)
     • "Greetings from <country>", the flag stamp and a dated postmark
     • how many divisions / cities / photos you have there
     • a QR code — scanning it opens that country on the website
   Visitors can download it (PNG) or share it from their phone.
   Links like  yoursite/#place=bangladesh  open that country directly.
   ===================================================================== */
(() => {
  'use strict';
  const COVER_KEY = 'raselOnTheRunPostcardCoversV1';
  const bn = () => document.documentElement.lang === 'bn';
  const T = (en, b) => (bn() ? b : en);
  const toBn = s => String(s).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]);
  const num = n => (bn() ? toBn(n) : String(n));
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const slug = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const data = () => { try { return Array.isArray(travelData) ? travelData : []; } catch { return []; } };
  const siteBase = () => { const u = (window.RNR_SITE?.siteUrl || '').trim().replace(/\/+$/, ''); return u || `${location.origin}${location.pathname.replace(/index\.html$/, '')}`.replace(/\/+$/, ''); };
  const linkFor = country => `${siteBase()}/#place=${slug(country.name)}`;

  // ---------- Remember each country's card photo ----------
  let covers = {};
  try { covers = JSON.parse(localStorage.getItem(COVER_KEY) || '{}') || {}; } catch { covers = {}; }
  const urlOf = card => { const m = (card.style.getPropertyValue('--rnr-card-photo') || '').match(/url\(\s*["']?(.*?)["']?\s*\)/); return m ? m[1] : ''; };
  function collectCovers() {
    let changed = false;
    document.querySelectorAll('#countryList [data-open-country]').forEach(card => {
      const u = urlOf(card);
      if (u && !u.startsWith('blob:') && covers[card.dataset.openCountry] !== u) { covers[card.dataset.openCountry] = u; changed = true; }
    });
    if (changed) { try { localStorage.setItem(COVER_KEY, JSON.stringify(covers)); } catch {} }
  }

  // ---------- Picture helpers ----------
  const loadImage = (src, cors) => new Promise((resolve, reject) => {
    const img = new Image();
    if (cors) img.crossOrigin = 'anonymous';
    const t = setTimeout(() => reject(new Error('timeout')), 15000);
    img.onload = () => { clearTimeout(t); resolve(img); };
    img.onerror = () => { clearTimeout(t); reject(new Error('image failed')); };
    img.src = src;
  });
  async function ownPhoto(country) {
    try {
      const all = (await window.RNR_GALLERY?.allPhotos?.()) || [];
      const mine = all.filter(p => p.countryId === country.id && p.blob && /^image\//.test(p.type || p.blob.type || ''));
      mine.sort((a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0));
      return mine[0] ? URL.createObjectURL(mine[0].blob) : '';
    } catch { return ''; }
  }
  function cover(ctx, img, x, y, w, h) {
    const r = Math.max(w / img.naturalWidth, h / img.naturalHeight), iw = img.naturalWidth * r, ih = img.naturalHeight * r;
    ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
  }
  function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function fitText(ctx, text, maxW, size, weight, family) {
    let s = size; do { ctx.font = `${weight} ${s}px ${family}`; s -= 4; } while (ctx.measureText(text).width > maxW && s > 24);
  }
  const FONT = '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif';
  const SERIF = 'Georgia, "Times New Roman", serif';

  function stats(country) {
    const regions = country.regions || [];
    const cities = regions.reduce((n, r) => n + (r.cities || []).length, 0);
    return { regions: regions.length, cities };
  }
  const regionWord = (country, n) => { try { return (n === 1 ? regionLabelFor(country.name) : pluralRegionLabelFor(country.name)) || (n === 1 ? 'region' : 'regions'); } catch { return n === 1 ? 'region' : 'regions'; } };

  // ---------- Draw the postcard ----------
  async function draw(country, withPhoto = true) {
    const W = 1800, H = 1200, c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    const flag = window.RNR_WORLD?.flag(country.name) || country.flag || '🏳️';
    // Paper
    ctx.fillStyle = '#fbf6ec'; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 0.05; for (let i = 0; i < 2600; i += 1) { ctx.fillStyle = i % 2 ? '#7a5a2b' : '#000'; ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2); } ctx.globalAlpha = 1;
    // Photo panel (left)
    const px = 60, py = 60, pw = 1040, ph = H - 120;
    ctx.save(); roundRect(ctx, px, py, pw, ph, 28); ctx.clip();
    const g = ctx.createLinearGradient(px, py, px + pw, py + ph); g.addColorStop(0, '#17384c'); g.addColorStop(0.55, '#1d6b74'); g.addColorStop(1, '#ef9a5c');
    ctx.fillStyle = g; ctx.fillRect(px, py, pw, ph);
    let usedPhoto = false;
    if (withPhoto) {
      const own = await ownPhoto(country);
      const tries = [own && [own, false], covers[country.id] && [covers[country.id], true]].filter(Boolean);
      for (const [src, cors] of tries) {
        try { cover(ctx, await loadImage(src, cors), px, py, pw, ph); usedPhoto = true; break; } catch {}
      }
      if (own) setTimeout(() => URL.revokeObjectURL(own), 5000);
    }
    if (!usedPhoto) { ctx.font = `300px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.globalAlpha = 0.9; ctx.fillText(flag, px + pw / 2, py + ph / 2 - 60); ctx.globalAlpha = 1; }
    const shade = ctx.createLinearGradient(0, py + ph * 0.45, 0, py + ph); shade.addColorStop(0, 'rgba(8,20,30,0)'); shade.addColorStop(1, 'rgba(8,20,30,.82)');
    ctx.fillStyle = shade; ctx.fillRect(px, py, pw, ph);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f6c46f'; ctx.font = `italic 600 62px ${SERIF}`;
    ctx.fillText(bn() ? 'শুভেচ্ছা,' : 'Greetings from', px + 56, py + ph - 200);
    ctx.fillStyle = '#ffffff'; fitText(ctx, country.name.toUpperCase(), pw - 112, 150, 900, FONT);
    ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 24; ctx.fillText(country.name.toUpperCase(), px + 52, py + ph - 70); ctx.shadowBlur = 0;
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 10; roundRect(ctx, px + 5, py + 5, pw - 10, ph - 10, 24); ctx.stroke();

    // Right side
    const rx = 1160, rw = W - rx - 60;
    // Stamp (perforated) with the flag
    const sx = W - 60 - 230, sy = 60, sw = 230, sh = 270;
    ctx.fillStyle = '#fffdf8'; ctx.fillRect(sx, sy, sw, sh);
    ctx.fillStyle = '#fbf6ec'; for (let i = 0; i <= sw; i += 20) { ctx.beginPath(); ctx.arc(sx + i, sy, 8, 0, 6.283); ctx.arc(sx + i, sy + sh, 8, 0, 6.283); ctx.fill(); } for (let i = 0; i <= sh; i += 20) { ctx.beginPath(); ctx.arc(sx, sy + i, 8, 0, 6.283); ctx.arc(sx + sw, sy + i, 8, 0, 6.283); ctx.fill(); }
    ctx.strokeStyle = '#c98a2b'; ctx.lineWidth = 4; ctx.strokeRect(sx + 18, sy + 18, sw - 36, sh - 36);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `120px ${FONT}`; ctx.fillStyle = '#000'; ctx.fillText(flag, sx + sw / 2, sy + 118);
    ctx.font = `800 16px ${FONT}`; ctx.fillStyle = '#17384c'; ctx.fillText('RASEL ON THE RUN', sx + sw / 2, sy + 212);
    ctx.font = `600 18px ${FONT}`; ctx.fillStyle = '#a5582a'; ctx.fillText(new Date().getFullYear(), sx + sw / 2, sy + 238);
    // Postmark
    const mx = sx - 150, my = sy + 150;
    ctx.save(); ctx.translate(mx, my); ctx.rotate(-0.22); ctx.strokeStyle = 'rgba(29,60,90,.55)'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(0, 0, 92, 0, 6.283); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 66, 0, 6.283); ctx.stroke();
    ctx.fillStyle = 'rgba(29,60,90,.7)'; ctx.font = `800 20px ${FONT}`; ctx.fillText(country.name.toUpperCase().slice(0, 14), 0, -22);
    ctx.font = `700 19px ${FONT}`; ctx.fillText(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase(), 0, 10);
    for (let k = 0; k < 4; k += 1) { ctx.beginPath(); ctx.moveTo(-100, -36 + k * 24); ctx.bezierCurveTo(-130, -56 + k * 24, -160, -16 + k * 24, -190, -36 + k * 24); ctx.stroke(); }
    ctx.restore();
    // Message lines
    const st = stats(country);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    const lines = [
      bn() ? `${num(st.regions)}টি ${regionWord(country, st.regions)} · ${num(st.cities)}টি শহর` : `${st.regions} ${regionWord(country, st.regions)} · ${st.cities} ${st.cities === 1 ? 'city' : 'cities'}`,
      bn() ? 'প্রতিটা রাস্তার একটা গল্প আছে।' : 'Every road here has a story.',
      bn() ? '— রাসেল' : '— Rasel'
    ];
    ctx.strokeStyle = 'rgba(23,40,58,.16)'; ctx.lineWidth = 2;
    for (let i = 0; i < 4; i += 1) { const ly = 450 + i * 74; ctx.beginPath(); ctx.moveTo(rx, ly); ctx.lineTo(rx + rw, ly); ctx.stroke(); }
    ctx.fillStyle = '#17283a'; ctx.font = `italic 500 40px ${SERIF}`;
    lines.forEach((t, i) => { fitText(ctx, t, rw - 10, i === 2 ? 40 : 38, i === 0 ? 700 : 500, i === 0 ? FONT : SERIF); ctx.fillText(t, rx + 6, 438 + i * 74); });
    // QR code
    const q = 300, qx = rx, qy = H - 60 - q;
    ctx.fillStyle = '#ffffff'; roundRect(ctx, qx - 6, qy - 6, q + 12, q + 12, 18); ctx.fill();
    window.RNR_QR.draw(ctx, linkFor(country), qx, qy, q, { dark: '#10202c', light: '#ffffff' });
    ctx.fillStyle = '#17384c'; ctx.font = `800 30px ${FONT}`; ctx.fillText(bn() ? 'স্ক্যান করে' : 'Scan to see', qx + q + 30, qy + 110);
    ctx.fillText(bn() ? 'ছবিগুলো দেখুন' : 'my photos', qx + q + 30, qy + 150);
    ctx.fillStyle = '#a5582a'; ctx.font = `600 20px ${FONT}`;
    const host = siteBase().replace(/^https?:\/\//, '');
    fitText(ctx, host, rw - q - 30, 22, 600, FONT); ctx.fillText(host, qx + q + 30, qy + 200);
    ctx.fillStyle = '#c98a2b'; ctx.fillRect(qx + q + 30, qy + 230, 60, 5);
    // Brand
    ctx.fillStyle = '#17384c'; ctx.font = `900 34px ${FONT}`; ctx.fillText('Rasel On the Run', qx + q + 30, qy + q - 8);
    return { canvas: c, usedPhoto };
  }

  async function render(country) {
    let out = await draw(country, true);
    try { await new Promise((res, rej) => out.canvas.toBlob(b => (b ? res(b) : rej(new Error('blank'))), 'image/png')); }
    catch { out = await draw(country, false); } // a photo that cannot be saved: use the colour background
    return out.canvas;
  }

  // ---------- Preview sheet ----------
  let sheet = null, lastURL = '';
  function closeSheet() { if (!sheet) return; sheet.remove(); sheet = null; if (lastURL) URL.revokeObjectURL(lastURL); lastURL = ''; document.body.classList.remove('rnr-pc-lock'); }
  async function open(country) {
    closeSheet();
    sheet = document.createElement('div');
    sheet.className = 'rnr-pc-sheet';
    sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true');
    sheet.setAttribute('aria-label', T(`Postcard from ${country.name}`, `${country.name} থেকে পোস্টকার্ড`));
    sheet.innerHTML = `<div class="rnr-pc-card"><button type="button" class="rnr-pc-close" aria-label="${esc(T('Close', 'বন্ধ করুন'))}">✕</button>
      <p class="rnr-pc-eyebrow">📮 ${esc(T('POSTCARD', 'পোস্টকার্ড'))}</p><h3 data-no-translate>${esc(T(`Greetings from ${country.name}`, `${country.name} থেকে শুভেচ্ছা`))}</h3>
      <div class="rnr-pc-frame"><p class="rnr-pc-wait">${esc(T('Making your postcard…', 'পোস্টকার্ড তৈরি হচ্ছে…'))}</p></div>
      <p class="rnr-pc-note">${esc(T('The QR code opens this country on the website.', 'QR কোড স্ক্যান করলে ওয়েবসাইটে এই দেশটা খুলবে।'))}</p>
      <div class="rnr-pc-actions"><button type="button" class="rnr-pc-download" disabled>⬇ ${esc(T('Download', 'ডাউনলোড'))}</button><button type="button" class="rnr-pc-share" hidden>↗ ${esc(T('Share', 'শেয়ার'))}</button><button type="button" class="rnr-pc-copy">🔗 ${esc(T('Copy link', 'লিংক কপি'))}</button></div></div>`;
    document.body.append(sheet);
    document.body.classList.add('rnr-pc-lock');
    const mine = sheet;
    sheet.addEventListener('click', e => { if (e.target === sheet || e.target.closest('.rnr-pc-close')) closeSheet(); });
    sheet.querySelector('.rnr-pc-close').focus();
    sheet.querySelector('.rnr-pc-copy').addEventListener('click', async e => {
      try { await navigator.clipboard.writeText(linkFor(country)); e.currentTarget.textContent = `✓ ${T('Copied', 'কপি হয়েছে')}`; } catch { prompt(T('Copy this link:', 'এই লিংকটি কপি করুন:'), linkFor(country)); }
    });
    const canvas = await render(country);
    if (sheet !== mine) return;
    const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
    lastURL = URL.createObjectURL(blob);
    const name = `postcard-${slug(country.name)}.png`;
    sheet.querySelector('.rnr-pc-frame').innerHTML = `<img src="${lastURL}" alt="${esc(T(`Postcard: Greetings from ${country.name}, with a QR code`, `পোস্টকার্ড: ${country.name} থেকে শুভেচ্ছা, QR কোড সহ`))}">`;
    const dl = sheet.querySelector('.rnr-pc-download');
    dl.disabled = false;
    dl.addEventListener('click', () => { const a = document.createElement('a'); a.href = lastURL; a.download = name; document.body.append(a); a.click(); a.remove(); });
    const file = new File([blob], name, { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      const sh = sheet.querySelector('.rnr-pc-share'); sh.hidden = false;
      sh.addEventListener('click', () => navigator.share({ files: [file], title: `Greetings from ${country.name}`, text: linkFor(country) }).catch(() => {}));
    }
  }
  addEventListener('keydown', e => { if (e.key === 'Escape' && sheet) closeSheet(); });

  // ---------- Button on the country page ----------
  function addButton() {
    try {
      collectCovers();
      if (typeof archiveLevel === 'undefined' || archiveLevel !== 'regions') return;
      const head = document.querySelector('#countryList .archive-page-heading');
      const country = data().find(c => c.id === selectedCountryId);
      if (!head || !country || head.querySelector('.rnr-pc-open')) return;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'rnr-pc-open';
      b.innerHTML = `<span aria-hidden="true">📮</span> ${esc(T('Postcard', 'পোস্টকার্ড'))}`;
      b.title = T('Make a postcard with a QR code', 'QR কোডসহ পোস্টকার্ড তৈরি করুন');
      b.addEventListener('click', () => open(country));
      head.append(b);
    } catch {}
  }
  const prev = window.renderCountries || (typeof renderCountries === 'function' ? renderCountries : null);
  if (prev) {
    const wrapped = function (...args) { const r = prev.apply(this, args); addButton(); return r; };
    try { renderCountries = wrapped; } catch {}
    window.renderCountries = wrapped;
  }
  const list = document.getElementById('countryList');
  if (list) new MutationObserver(() => { clearTimeout(addButton.t); addButton.t = setTimeout(addButton, 150); }).observe(list, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });

  // ---------- Links like #place=bangladesh ----------
  function openPlace(key, tries = 0) {
    const want = slug(decodeURIComponent(key || ''));
    const country = data().find(c => slug(c.name) === want);
    if (!country) { if (tries < 40) setTimeout(() => openPlace(key, tries + 1), 250); return false; } // published data may still be loading
    try {
      archiveLevel = 'regions'; selectedCountryId = country.id;
      try { selectedRegionId = null; selectedCityId = null; } catch {}
      window.renderCountries();
      window.RNR_PAGES?.show('travels', { push: false, scroll: 'none' });
      requestAnimationFrame(() => document.getElementById('destinations')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    } catch (error) { console.error(error); }
    return true;
  }
  window.RNR_POSTCARD = { open: name => { const c = data().find(x => slug(x.name) === slug(name)); if (c) open(c); }, openPlace, linkFor, render };
})();

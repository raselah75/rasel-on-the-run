/* =====================================================================
   RASEL ON THE RUN — DARK MODE
   A moon / sun button in the header switches the whole website between
   light and dark. Each visitor's choice is remembered on their device.
   (A tiny script in <head> applies it before the page appears, so there
   is no white flash.) Colours live in theme-final.css under "DARK MODE".
   ===================================================================== */
(() => {
  'use strict';
  const KEY = 'raselOnTheRunThemeModeV1';
  const root = document.documentElement;
  const isDark = () => root.classList.contains('rnr-dark');
  const meta = document.querySelector('meta[name="theme-color"]');
  const MOON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 14.6A8.5 8.5 0 0 1 9.4 3.5a.6.6 0 0 0-.8-.7A9.5 9.5 0 1 0 21.2 15.4a.6.6 0 0 0-.7-.8z" fill="currentColor"/></svg>';
  const SUN = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.6" fill="currentColor"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 1.8v2.4M12 19.8v2.4M1.8 12h2.4M19.8 12h2.4M4.8 4.8l1.7 1.7M17.5 17.5l1.7 1.7M4.8 19.2l1.7-1.7M17.5 6.5l1.7-1.7"/></g></svg>';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'rnr-theme-toggle';
  button.setAttribute('data-no-translate', '');
  function label() {
    const dark = isDark();
    button.innerHTML = dark ? SUN : MOON;
    const bn = root.lang === 'bn';
    const text = dark ? (bn ? 'লাইট মোড' : 'Light mode') : (bn ? 'ডার্ক মোড' : 'Dark mode');
    button.setAttribute('aria-label', text);
    button.title = text;
    button.setAttribute('aria-pressed', String(dark));
    if (meta) meta.content = dark ? '#071019' : '#0f2233';
  }
  function set(dark, remember = true) {
    root.classList.add('rnr-theme-switching');
    root.classList.toggle('rnr-dark', dark);
    document.body?.classList.remove('jt-dark');
    if (remember) { try { localStorage.setItem(KEY, dark ? 'dark' : 'light'); } catch {} }
    label();
    clearTimeout(set.t);
    set.t = setTimeout(() => root.classList.remove('rnr-theme-switching'), 450);
    dispatchEvent(new CustomEvent('rnr:theme', { detail: dark ? 'dark' : 'light' }));
  }
  button.addEventListener('click', () => set(!isDark()));

  // The old "Toggle dark / light" button in My Toolkit now uses this switch.
  document.addEventListener('click', e => {
    if (!e.target.closest('#premiumTheme')) return;
    e.preventDefault(); e.stopImmediatePropagation();
    set(!isDark());
  }, true);
  try { localStorage.removeItem('raselOnTheRunTheme'); } catch {}

  function place() {
    const tools = document.getElementById('rnrNavTools');
    const lang = tools?.querySelector('.rnr-lang-toggle');
    if (tools && button.parentElement !== tools) { if (lang) lang.after(button); else tools.prepend(button); }
    else if (!tools && !button.isConnected) document.querySelector('.site-header')?.append(button);
  }
  function init() {
    document.body.classList.remove('jt-dark');
    label(); place();
    setTimeout(place, 300);
    new MutationObserver(() => { if (!button.isConnected || (document.getElementById('rnrNavTools') && button.parentElement?.id !== 'rnrNavTools')) place(); })
      .observe(document.querySelector('.site-header') || document.body, { childList: true, subtree: true });
  }
  // ---------------------------------------------------------------
  // Automatic dark colours for the older sections.
  // Reads every style rule once and writes a dark version of any light
  // background, light border or dark text colour it finds. Rules with a
  // coloured background (gold buttons, badges) and fixed-colour areas
  // (header, cover, photo viewers, maps, passport paper) are left alone.
  // ---------------------------------------------------------------
  const SKIP_SEL = /site-header|\.hero\b|#home\b|site-footer|rnr-viewer|rnr-player|rnr-pano|rnr-passport|rnr-pp-|rnr-stamp|leaflet|rnr-book-overlay|rnr-reader-hero|rnr-season|rnr-splash|rnr-globe-stage|rnr-tn-|::selection|rnr-dark|rnr-theme-toggle|rnr-lang-toggle|rnr-route-head|rnr-route-stop|rnr-pin\b/;
  const probe = document.createElement('canvas').getContext('2d');
  function rgba(value) {
    if (!value || /var\(|gradient|url\(|inherit|initial|unset|currentcolor|transparent/i.test(value)) return null;
    probe.fillStyle = '#010203'; probe.fillStyle = value;
    const v = probe.fillStyle;
    if (v === '#010203' && !/^#010203$/i.test(value.trim())) return null;
    if (v[0] === '#') return [parseInt(v.slice(1, 3), 16), parseInt(v.slice(3, 5), 16), parseInt(v.slice(5, 7), 16), 1];
    const m = v.match(/rgba?\(([^)]+)\)/); if (!m) return null;
    const p = m[1].split(',').map(Number); return [p[0], p[1], p[2], p[3] ?? 1];
  }
  const lum = ([r, g, b]) => { const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const spread = ([r, g, b]) => Math.max(r, g, b) - Math.min(r, g, b);
  const neutralLight = c => c && c[3] > 0.35 && spread(c) < 42 && lum(c) > 0.62;
  function hsl([r, g, b]) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2; if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; } return [h, s, l]; }
  function darkBg(c) { const L = lum(c); const a = c[3]; return L > 0.9 ? `rgba(20,35,48,${a})` : L > 0.75 ? `rgba(16,29,40,${a})` : `rgba(255,255,255,${Math.min(0.08, a * 0.08).toFixed(3)})`; }
  function lightText(c) { const L = lum(c); if (L > 0.3) return null; const [h, s] = hsl(c); if (s > 0.28 && spread(c) > 40) return `hsla(${h.toFixed(0)},${Math.min(80, s * 100).toFixed(0)}%,72%,${c[3]})`; return L < 0.08 ? `rgba(232,239,243,${c[3]})` : `rgba(170,186,197,${c[3]})`; }
  function scope(sel) {
    return sel.split(',').map(x => x.trim()).filter(x => x && !SKIP_SEL.test(x)).map(x => {
      if (/^:root\b/.test(x)) return x.replace(/^:root/, 'html.rnr-dark');
      if (/^html\b/.test(x)) return x.replace(/^html/, 'html.rnr-dark');
      return `html.rnr-dark ${x}`;
    }).join(', ');
  }
  function convert(rule) {
    const st = rule.style; const out = [];
    const bgC = rgba(st.getPropertyValue('background-color'));
    const bgImg = st.getPropertyValue('background-image');
    let bgLight = false, bgColoured = false;
    if (bgC) { if (neutralLight(bgC)) { bgLight = true; out.push(`background-color:${darkBg(bgC)}`); } else if (bgC[3] > 0.3 && lum(bgC) > 0.3) bgColoured = true; }
    if (bgImg && /gradient/.test(bgImg) && !/url\(/.test(bgImg)) {
      const stops = (bgImg.match(/rgba?\([^)]+\)|#[0-9a-f]{3,8}\b|\bwhite\b/gi) || []).map(rgba).filter(Boolean);
      if (stops.length && stops.every(c => neutralLight(c) || c[3] < 0.2)) { bgLight = true; out.push('background-image:none', `background-color:${darkBg(stops[0])}`); }
      else if (stops.some(c => c[3] > 0.3 && lum(c) > 0.3)) bgColoured = true;
    }
    const col = rgba(st.getPropertyValue('color'));
    if (col && !bgColoured) { const t = lightText(col); if (t) out.push(`color:${t}`); }
    ['border-color', 'border-top-color', 'border-bottom-color', 'border-left-color', 'border-right-color'].forEach(prop => {
      const b = rgba(st.getPropertyValue(prop));
      if (b && neutralLight(b) && b[3] > 0.35) out.push(`${prop}:rgba(255,255,255,.12)`);
    });
    if (bgLight && st.getPropertyValue('box-shadow') && !/inset/.test(st.getPropertyValue('box-shadow'))) out.push('box-shadow:0 14px 34px rgba(0,0,0,.35)');
    return out;
  }
  function walk(rules, acc) {
    for (const rule of rules) {
      if (rule.type === 1) {
        if (/rnr-dark/.test(rule.selectorText)) continue;
        const decl = convert(rule);
        if (!decl.length) continue;
        const sel = scope(rule.selectorText);
        if (sel) acc.push(`${sel}{${decl.map(d => `${d} !important`).join(';')}}`);
      } else if (rule.cssRules && (rule.type === 4 || rule.type === 12)) {
        const inner = []; walk(rule.cssRules, inner);
        if (inner.length) acc.push(`@${rule.type === 4 ? 'media' : 'supports'} ${rule.conditionText}{${inner.join('')}}`);
      }
    }
  }
  const autoSheet = document.createElement('style');
  autoSheet.id = 'rnrAutoDark';
  let building = 0, dirty = true;
  function buildAuto() {
    if (!isDark()) { dirty = true; return; }
    const acc = [];
    for (const sheet of document.styleSheets) {
      if (sheet.ownerNode === autoSheet) continue;
      let rules; try { rules = sheet.cssRules; } catch { continue; }
      if (rules) walk(rules, acc);
    }
    autoSheet.textContent = acc.join('\n');
    // Before the final theme so its own dark rules still win.
    const final = document.getElementById('rnrThemeFinal');
    if (final && autoSheet.nextSibling !== final) final.before(autoSheet);
    else if (!final && !autoSheet.isConnected) document.head.append(autoSheet);
    dirty = false;
  }
  const scheduleAuto = () => { clearTimeout(building); building = setTimeout(buildAuto, 60); };
  new MutationObserver(list => {
    for (const m of list) for (const n of m.addedNodes) {
      if (n === autoSheet) continue;
      if (n.nodeName === 'STYLE') scheduleAuto();
      if (n.nodeName === 'LINK' && n.rel === 'stylesheet') { n.addEventListener('load', scheduleAuto, { once: true }); scheduleAuto(); }
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
  addEventListener('rnr:theme', () => { if (isDark() && dirty) buildAuto(); });
  addEventListener('load', scheduleAuto);
  document.addEventListener('DOMContentLoaded', scheduleAuto);
  if (isDark()) buildAuto();

  addEventListener('rnr:language', label);
  window.RNR_THEME = { set, isDark, rebuild: buildAuto };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();

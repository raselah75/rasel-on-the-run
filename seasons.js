/* =====================================================================
   RASEL ON THE RUN — SEASONAL THEMES (homepage cover)
   Changes by itself with the date (Toronto seasons + special days):
     Winter (Dec–Feb) gentle snow · Spring (Mar 20–May) blossom petals
     Summer (Jun–Sep 14) warm sparkles · Autumn (Sep 15–Nov) falling leaves
   Special days add a greeting on the cover:
     New Year · Eid al-Fitr · Eid al-Adha · Pohela Boishakh (14 Apr)
     Independence Day (26 Mar) · Victory Day (16 Dec) · Canada Day (1 Jul)
   Eid dates follow the moon, so they are expected dates (± a day).
   Admin mode: "✦ Season" on the cover — Automatic, Off, or pick one, and
   an optional greeting of your own. Saved in raselOnTheRunSeasonV1.
   People who prefer reduced motion get the greeting without animation.
   SMART EXTRAS (Nov 2026):
     • Live weather: when it is really raining or snowing in Toronto right
       now (Open-Meteo, no key), the cover shows rain or snow with a note.
     • Ramadan: crescent moon + glowing lanterns for the month before Eid.
     • Eid: crescent moon with the stars.
     • The effect also runs on the top banner of every other page.
   ===================================================================== */
(() => {
  'use strict';
  const hero = document.getElementById('home');
  if (!hero) return;
  const KEY = 'raselOnTheRunSeasonV1';
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { return {}; } };
  const isAdmin = () => document.body.classList.contains('admin-mode');
  const bn = () => document.documentElement.lang === 'bn';
  const toBn = s => String(s).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]);
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Expected Eid dates (first day). Celebrated for 3 days.
  const EID_FITR = ['2026-03-20', '2027-03-09', '2028-02-26', '2029-02-14', '2030-02-04', '2031-01-24'];
  const EID_ADHA = ['2026-05-27', '2027-05-16', '2028-05-05', '2029-04-24', '2030-04-13', '2031-04-02'];

  const THEMES = {
    winter: { label: 'Winter snow', fx: 'snow' },
    spring: { label: 'Spring petals', fx: 'petals' },
    summer: { label: 'Summer sparkles', fx: 'sparkles' },
    autumn: { label: 'Autumn leaves', fx: 'leaves' },
    newyear: { label: 'New Year', fx: 'confetti', colors: ['#f6c46f', '#ffffff', '#ee8456', '#ffe2a8'], icon: '✨', en: y => `Happy New Year ${y}`, bnText: y => `শুভ নববর্ষ ${toBn(y)}` },
    ramadan: { label: 'Ramadan', fx: 'lanterns', moon: true, icon: '🌙', en: () => 'Ramadan Mubarak', bnText: () => 'রমজান মোবারক' },
    rain: { label: 'Rain', fx: 'rain' },
    eid: { label: 'Eid', fx: 'stars', moon: true, icon: '☪', en: () => 'Eid Mubarak', bnText: () => 'ঈদ মোবারক' },
    boishakh: { label: 'Pohela Boishakh', fx: 'confetti', colors: ['#d7263d', '#ffffff', '#f6c46f'], icon: '🌺', en: y => `Shubho Noboborsho ${y}`, bnText: y => `শুভ নববর্ষ ${toBn(y)}` },
    independence: { label: 'Independence Day (Bangladesh)', fx: 'confetti', colors: ['#006a4e', '#f42a41', '#ffffff'], icon: '🇧🇩', en: () => 'Happy Independence Day', bnText: () => 'মহান স্বাধীনতা দিবসের শুভেচ্ছা' },
    victory: { label: 'Victory Day (Bangladesh)', fx: 'confetti', colors: ['#006a4e', '#f42a41', '#ffffff'], icon: '🇧🇩', en: () => 'Happy Victory Day', bnText: () => 'মহান বিজয় দিবসের শুভেচ্ছা' },
    canada: { label: 'Canada Day', fx: 'maple', icon: '🇨🇦', en: () => 'Happy Canada Day', bnText: () => 'কানাডা দিবসের শুভেচ্ছা' }
  };
  // ---------- Live weather (Toronto) ----------
  const WX_KEY = 'raselOnTheRunWeatherV1';
  const weather = (() => { try { const w = JSON.parse(localStorage.getItem(WX_KEY) || '{}'); return Date.now() - (w.at || 0) < 40 * 60 * 1000 ? w : { kind: '' }; } catch { return { kind: '' }; } })();
  async function checkWeather() {
    if (Date.now() - (weather.at || 0) < 30 * 60 * 1000) return;
    try {
      const r = await fetch('https://api.open-meteo.com/v1/forecast?latitude=43.65&longitude=-79.38&current=weather_code,temperature_2m&timezone=America%2FToronto');
      if (!r.ok) return;
      const c = (await r.json()).current || {};
      const code = Number(c.weather_code);
      const kind = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code) ? 'rain' : [71, 73, 75, 77, 85, 86].includes(code) ? 'snow' : 'clear';
      Object.assign(weather, { kind, temp: Math.round(c.temperature_2m), at: Date.now() });
      try { localStorage.setItem(WX_KEY, JSON.stringify(weather)); } catch {}
      if (!read().mode) apply();
    } catch {}
  }
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const within = (day, start, days) => { const s = new Date(`${start}T00:00:00`), d = new Date(`${day}T00:00:00`); return d >= s && (d - s) / 864e5 < days; };

  function automatic(now = new Date()) {
    const day = iso(now), m = now.getMonth() + 1, dd = now.getDate();
    if ((m === 12 && dd === 31) || (m === 1 && dd <= 2)) return { key: 'newyear', year: m === 12 ? now.getFullYear() + 1 : now.getFullYear() };
    if (EID_FITR.some(s => within(day, s, 3)) || EID_ADHA.some(s => within(day, s, 3))) return { key: 'eid' };
    if (EID_FITR.some(s => { const st = new Date(`${s}T00:00:00`); st.setDate(st.getDate() - 30); return within(day, iso(st), 30); })) return { key: 'ramadan' };
    // Live weather in Toronto beats the calendar season (not special days).
    if (weather.kind === 'rain') return { key: 'rain', live: true };
    if (weather.kind === 'snow') return { key: 'winter', live: true };
    if (m === 4 && dd === 14) return { key: 'boishakh', year: now.getFullYear() - 593 };
    if (m === 3 && dd === 26) return { key: 'independence' };
    if (m === 12 && dd === 16) return { key: 'victory' };
    if (m === 7 && dd === 1) return { key: 'canada' };
    if (m === 12 || m <= 2) return { key: 'winter' };
    if ((m === 3 && dd >= 20) || m === 4 || m === 5) return { key: 'spring' };
    if (m === 3) return { key: 'winter' };
    if (m >= 6 && (m < 9 || (m === 9 && dd < 15))) return { key: 'summer' };
    return { key: 'autumn' };
  }
  function choose() {
    const s = read();
    if (s.mode === 'off') return null;
    const now = new Date();
    if (s.mode && THEMES[s.mode]) {
      const pick = { key: s.mode };
      if (s.mode === 'newyear') pick.year = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();
      if (s.mode === 'boishakh') pick.year = now.getFullYear() - (now.getMonth() < 3 || (now.getMonth() === 3 && now.getDate() < 14) ? 594 : 593);
      return pick;
    }
    return automatic(now);
  }

  // ---------- Greeting on the cover ----------
  const greet = document.createElement('p');
  greet.className = 'rnr-season-greeting';
  greet.setAttribute('data-no-translate', '');
  greet.hidden = true;
  const content = hero.querySelector('.hero-content');
  (content || hero).prepend(greet);

  // ---------- Particles ----------
  const canvas = document.createElement('canvas');
  canvas.className = 'rnr-season-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  hero.prepend(canvas);
  const ctx = canvas.getContext('2d');
  let parts = [], fx = '', colors = [], raf = 0, running = false, onScreen = true, w = 0, h = 0, lastT = 0;

  const rand = (a, b) => a + Math.random() * (b - a);
  const COUNT = { snow: 70, petals: 26, sparkles: 34, leaves: 20, confetti: 70, stars: 46, maple: 22, rain: 110, lanterns: 14 };
  let moon = false;
  function make(initial) {
    const p = { x: rand(0, w), y: initial ? rand(-h, h) : rand(-60, -10), r: 0, rot: rand(0, 6.28), vr: rand(-1.4, 1.4), sway: rand(0, 6.28), sw: rand(0.6, 1.6) };
    if (fx === 'snow') Object.assign(p, { r: rand(1.2, 3.6), vy: rand(18, 46), vx: rand(-8, 8), a: rand(0.5, 0.95) });
    if (fx === 'petals') Object.assign(p, { r: rand(5, 9), vy: rand(22, 44), vx: rand(10, 30), a: rand(0.7, 0.95), c: ['#ffc4d6', '#ffd6e3', '#f9a8c5', '#fff0f5'][Math.floor(rand(0, 4))] });
    if (fx === 'leaves' || fx === 'maple') Object.assign(p, { r: rand(9, 15), vy: rand(26, 52), vx: rand(-14, 14), a: rand(0.75, 0.95), c: fx === 'maple' ? ['#d52b1e', '#e84a3c', '#ffffff'][Math.floor(rand(0, 3))] : ['#d9622b', '#e8913a', '#b8401f', '#f2b53c', '#a8501c'][Math.floor(rand(0, 5))] });
    if (fx === 'confetti') Object.assign(p, { r: rand(4, 8), vy: rand(40, 90), vx: rand(-20, 20), a: 0.95, c: colors[Math.floor(rand(0, colors.length))] });
    if (fx === 'sparkles') Object.assign(p, { y: rand(0, h), r: rand(1.2, 3), vy: rand(-10, -3), vx: rand(-5, 5), a: 0, life: rand(0, 6.28), sp: rand(0.6, 1.4) });
    if (fx === 'rain') Object.assign(p, { r: rand(10, 22), vy: rand(520, 820), vx: -60, a: rand(0.25, 0.55) });
    if (fx === 'lanterns') Object.assign(p, { y: initial ? rand(0, h) : h + 40, r: rand(9, 16), vy: rand(-16, -8), vx: rand(-4, 4), a: rand(0.75, 0.95), life: rand(0, 6.28), sp: rand(1, 2), c: ['#f6c46f', '#ee8456', '#ffd98a'][Math.floor(rand(0, 3))] });
    if (fx === 'stars') Object.assign(p, { y: rand(0, h * 0.75), r: rand(1, 2.6), vy: 0, vx: 0, a: 0, life: rand(0, 6.28), sp: rand(0.5, 1.6), big: Math.random() < 0.12 });
    return p;
  }
  function leafPath(r) {
    ctx.beginPath(); ctx.moveTo(0, -r); ctx.bezierCurveTo(r * 0.9, -r * 0.6, r * 0.8, r * 0.5, 0, r); ctx.bezierCurveTo(-r * 0.8, r * 0.5, -r * 0.9, -r * 0.6, 0, -r); ctx.closePath();
  }
  function maplePath(r) {
    const pts = [[0, -1], [0.18, -0.55], [0.5, -0.7], [0.4, -0.25], [0.95, -0.35], [0.75, 0], [0.9, 0.12], [0.45, 0.3], [0.5, 0.5], [0.08, 0.4], [0.08, 1], [-0.08, 1], [-0.08, 0.4], [-0.5, 0.5], [-0.45, 0.3], [-0.9, 0.12], [-0.75, 0], [-0.95, -0.35], [-0.4, -0.25], [-0.5, -0.7], [-0.18, -0.55]];
    ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x * r, y * r) : ctx.moveTo(x * r, y * r))); ctx.closePath();
  }
  function star(r) {
    ctx.beginPath();
    for (let i = 0; i < 8; i += 1) { const a = i * Math.PI / 4, rr = i % 2 ? r * 0.28 : r; ctx.lineTo(Math.sin(a) * rr, -Math.cos(a) * rr); }
    ctx.closePath();
  }
  function frame(t) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (t - (lastT || t)) / 1000); lastT = t;
    ctx.clearRect(0, 0, w, h);
    for (const p of parts) {
      p.sway += dt * p.sw;
      p.rot += p.vr * dt;
      p.x += (p.vx + Math.sin(p.sway) * (fx === 'snow' ? 10 : 22)) * dt;
      p.y += p.vy * dt;
      if (fx === 'sparkles' || fx === 'stars') { p.life += dt * p.sp; p.a = fx === 'stars' ? 0.25 + 0.75 * Math.abs(Math.sin(p.life)) : Math.max(0, Math.sin(p.life)) * 0.8; if (fx === 'sparkles' && p.y < -10) Object.assign(p, make(false), { y: h + 10 }); }
      else if (fx === 'lanterns') { p.life += dt * p.sp; if (p.y < -40) Object.assign(p, make(false)); }
      else if (fx === 'rain') { if (p.y > h + 20) Object.assign(p, make(false), { x: rand(0, w + 80) }); p.x -= Math.sin(p.sway) * 22 * dt; }
      else if (p.y > h + 20 || p.x < -40 || p.x > w + 40) Object.assign(p, make(false));
      ctx.save(); ctx.globalAlpha = p.a; ctx.translate(p.x, p.y);
      if (fx === 'snow') { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, p.r, 0, 6.283); ctx.fill(); }
      else if (fx === 'petals') { ctx.rotate(p.rot); ctx.scale(1, 0.55 + 0.45 * Math.abs(Math.sin(p.sway))); ctx.fillStyle = p.c; ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r * 0.62, 0, 0, 6.283); ctx.fill(); }
      else if (fx === 'leaves') { ctx.rotate(p.rot); ctx.scale(Math.cos(p.sway), 1); ctx.fillStyle = p.c; leafPath(p.r); ctx.fill(); ctx.strokeStyle = 'rgba(80,30,10,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -p.r); ctx.lineTo(0, p.r); ctx.stroke(); }
      else if (fx === 'maple') { ctx.rotate(p.rot); ctx.scale(Math.cos(p.sway), 1); ctx.fillStyle = p.c; maplePath(p.r); ctx.fill(); }
      else if (fx === 'confetti') { ctx.rotate(p.rot); ctx.scale(1, Math.cos(p.sway * 2)); ctx.fillStyle = p.c; ctx.fillRect(-p.r / 2, -p.r, p.r, p.r * 2); }
      else if (fx === 'sparkles') { const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.r * 4); g.addColorStop(0, 'rgba(255,236,170,1)'); g.addColorStop(1, 'rgba(255,200,90,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, p.r * 4, 0, 6.283); ctx.fill(); }
      else if (fx === 'rain') { ctx.strokeStyle = 'rgba(200,225,245,1)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-p.r * 0.1, -p.r); ctx.stroke(); }
      else if (fx === 'lanterns') { const glow = 0.6 + 0.4 * Math.sin(p.life); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.r * 2.6); g.addColorStop(0, `rgba(255,214,130,${0.45 * glow})`); g.addColorStop(1, 'rgba(255,190,90,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, p.r * 2.6, 0, 6.283); ctx.fill(); ctx.fillStyle = p.c; ctx.beginPath(); ctx.moveTo(-p.r * 0.55, -p.r * 0.7); ctx.quadraticCurveTo(-p.r, 0, -p.r * 0.45, p.r * 0.8); ctx.lineTo(p.r * 0.45, p.r * 0.8); ctx.quadraticCurveTo(p.r, 0, p.r * 0.55, -p.r * 0.7); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(80,40,10,.55)'; ctx.fillRect(-p.r * 0.4, -p.r * 0.95, p.r * 0.8, p.r * 0.25); ctx.fillRect(-p.r * 0.35, p.r * 0.78, p.r * 0.7, p.r * 0.2); }
      else if (fx === 'stars') { ctx.fillStyle = '#ffe7a3'; if (p.big) { star(p.r * 3.4); ctx.fill(); } else { ctx.beginPath(); ctx.arc(0, 0, p.r, 0, 6.283); ctx.fill(); } }
      ctx.restore();
    }
    if (moon) drawMoon();
  }
  // Crescent moon (Ramadan / Eid), top-right of the cover.
  let moonCache = null;
  function moonCanvas(r) {
    if (moonCache && moonCache.r === r) return moonCache.c;
    const c = document.createElement('canvas'), size = Math.ceil(r * 2 + 4); c.width = size; c.height = size;
    const m = c.getContext('2d');
    m.fillStyle = '#ffe7a3'; m.beginPath(); m.arc(size / 2, size / 2, r, 0, 6.283); m.fill();
    m.globalCompositeOperation = 'destination-out';
    m.beginPath(); m.arc(size / 2 + r * 0.45, size / 2 - r * 0.25, r * 0.88, 0, 6.283); m.fill();
    moonCache = { r, c };
    return c;
  }
  function drawMoon() {
    const r = Math.max(22, Math.min(46, w * 0.035)), x = w - r * 3.2, y = r * 2.6;
    ctx.save();
    const g = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 3); g.addColorStop(0, 'rgba(255,231,163,.35)'); g.addColorStop(1, 'rgba(255,231,163,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 3, 0, 6.283); ctx.fill();
    const m = moonCanvas(r);
    ctx.drawImage(m, x - m.width / 2, y - m.height / 2);
    ctx.restore();
  }
  // The effect runs on the home cover, or on the top banner of the other pages.
  const banner = () => document.getElementById('rnrPageBanner');
  function host() { const b = banner(); return hero.classList.contains('rnr-off') && b && !b.hidden ? b : hero; }
  function hostHidden() { const el = host(); return el.classList.contains('rnr-off') || el.hidden; }
  function rehost() {
    const el = host();
    if (canvas.parentElement !== el) { stop(); el.prepend(canvas); parts = []; if (!seenBanner && el !== hero) { io?.observe(el); seenBanner = true; } }
    if (hostHidden()) stop(); else start();
  }
  let seenBanner = false;
  function size() {
    const r = host().getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function start() {
    if (running || !fx || reduce() || !onScreen || document.hidden || hostHidden()) return;
    running = true; lastT = 0; size();
    if (!parts.length) parts = Array.from({ length: Math.round(COUNT[fx] * (w < 700 ? 0.6 : 1)) }, () => make(true));
    raf = requestAnimationFrame(frame);
  }
  function stop() { running = false; cancelAnimationFrame(raf); }

  // ---------- Apply ----------
  let active = null;
  function apply() {
    const pick = choose();
    active = pick;
    const theme = pick ? THEMES[pick.key] : null;
    const custom = (read().greeting || '').trim();
    document.body.dataset.rnrSeason = pick ? pick.key : 'off';
    if (theme && !theme.en && !custom && pick.live) {
      const t = Number.isFinite(weather.temp) ? ` · ${bn() ? toBn(weather.temp) : weather.temp}°C` : '';
      const txt = weather.kind === 'rain' ? (bn() ? 'টরন্টোতে এখন বৃষ্টি হচ্ছে' : 'Raining in Toronto right now') : (bn() ? 'টরন্টোতে এখন তুষার পড়ছে' : 'Snowing in Toronto right now');
      greet.innerHTML = `<span aria-hidden="true">${weather.kind === 'rain' ? '🌧' : '❄️'}</span> ${txt}${t}`;
      greet.hidden = false;
    } else if (theme && (theme.en || custom)) {
      const text = custom || (bn() ? theme.bnText(pick.year) : theme.en(pick.year));
      greet.innerHTML = `<span aria-hidden="true">${theme.icon || '✦'}</span> ${text.replace(/[&<>"']/g, '')}`;
      greet.hidden = false;
    } else if (custom && pick) { greet.innerHTML = `<span aria-hidden="true">✦</span> ${custom.replace(/[&<>"']/g, '')}`; greet.hidden = false; }
    else greet.hidden = true;
    const nextFx = theme ? theme.fx : '';
    moon = Boolean(theme?.moon);
    if (nextFx !== fx) { stop(); parts = []; fx = nextFx; colors = theme?.colors || []; ctx.clearRect(0, 0, canvas.width, canvas.height); }
    canvas.hidden = !fx || reduce();
    start();
  }

  const io = 'IntersectionObserver' in window ? new IntersectionObserver(entries => { onScreen = entries.some(e => e.isIntersecting); if (onScreen) start(); else stop(); }) : null;
  io?.observe(hero);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  addEventListener('resize', () => { if (running) { size(); } });
  new MutationObserver(() => requestAnimationFrame(rehost)).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  new MutationObserver(() => requestAnimationFrame(rehost)).observe(hero, { attributes: true, attributeFilter: ['class'] });
  addEventListener('rnr:language', apply);

  // ---------- Owner control ----------
  const pill = document.createElement('button');
  pill.type = 'button';
  pill.className = 'rnr-season-edit';
  pill.textContent = '✦ Season';
  hero.append(pill);
  const OPTIONS = { 'Automatic (changes with the date)': '', 'Off': 'off', ...Object.fromEntries(Object.entries(THEMES).map(([k, v]) => [v.label, k])) };
  pill.addEventListener('click', e => {
    e.preventDefault(); e.stopPropagation();
    if (!isAdmin()) return;
    const s = read();
    const auto = automatic();
    window.RNR_OWNER_FORM?.({ eyebrow: 'SEASONAL THEME', title: 'Cover effects and greetings',
      note: `Today the automatic choice is: ${THEMES[auto.key].label}.`,
      fields: [
        { name: 'mode', label: 'Theme', type: 'select', options: Object.keys(OPTIONS), value: Object.keys(OPTIONS).find(k => OPTIONS[k] === (s.mode || '')) },
        { name: 'greeting', label: 'Your own greeting (optional)', value: s.greeting || '', placeholder: 'e.g. Happy birthday to me! 🎂', maxlength: 60 }
      ],
      save: d => {
        const rec = {};
        if (OPTIONS[d.mode]) rec.mode = OPTIONS[d.mode];
        if (d.greeting.trim()) rec.greeting = d.greeting.trim();
        try { if (Object.keys(rec).length) localStorage.setItem(KEY, JSON.stringify(rec)); else localStorage.removeItem(KEY); } catch {}
        apply();
      } });
  });

  // Re-check after midnight.
  setInterval(() => { if (!read().mode) { const k = automatic().key; if (k !== active?.key) apply(); } }, 30 * 60 * 1000);
  window.RNR_SEASON = { apply, automatic, current: () => active, weather: () => ({ ...weather }) };
  apply();
  setTimeout(checkWeather, 1500);
  setInterval(checkWeather, 30 * 60 * 1000);
})();

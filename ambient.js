/* =====================================================================
   RASEL ON THE RUN — AMBIENT SOUND (optional, off by default)
   A small 🔊 button (bottom-left). Visitors can switch on a soft
   background sound while they look at the photos:
     Auto (matches the season, weather and time of day) · Ocean waves ·
     Rain · Forest birds · Wind · Night crickets
   Every sound is made live in the browser with the Web Audio API —
   no audio files are downloaded and nothing is copyrighted.
   It never starts by itself; it pauses when the tab is hidden.
   The chosen sound and volume are remembered (raselOnTheRunAmbientV1).
   ===================================================================== */
(() => {
  'use strict';
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC || document.getElementById('rnrAmbient')) return;
  const KEY = 'raselOnTheRunAmbientV1';
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { return {}; } };
  const write = s => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} };
  const bn = () => document.documentElement.lang === 'bn';
  const T = (en, b) => (bn() ? b : en);

  const SOUNDS = {
    auto: ['✨', 'Auto', 'অটো', 'Matches the season & time', 'মৌসুম ও সময় অনুযায়ী'],
    ocean: ['🌊', 'Ocean waves', 'সমুদ্রের ঢেউ'],
    rain: ['🌧', 'Rain', 'বৃষ্টি'],
    forest: ['🐦', 'Forest birds', 'বনের পাখি'],
    wind: ['🍃', 'Wind', 'বাতাস'],
    night: ['🌙', 'Night crickets', 'রাতের ঝিঁঝিঁ']
  };
  function autoPick() {
    const season = window.RNR_SEASON?.current?.()?.key || '';
    const hour = new Date().getHours();
    if (season === 'rain') return 'rain';
    if (hour >= 20 || hour < 6) return 'night';
    if (season === 'winter') return 'wind';
    if (season === 'autumn') return 'wind';
    if (season === 'spring' || season === 'summer') return 'forest';
    return 'ocean';
  }

  // ---------- UI ----------
  const wrap = document.createElement('div');
  wrap.id = 'rnrAmbient';
  wrap.className = 'rnr-amb';
  wrap.innerHTML = `
    <button type="button" class="rnr-amb-btn" aria-expanded="false" aria-controls="rnrAmbientPanel"><span class="rnr-amb-icon" aria-hidden="true">🔈</span><span class="rnr-amb-bars" aria-hidden="true"><i></i><i></i><i></i></span><span class="rnr-sr"></span></button>
    <div class="rnr-amb-panel" id="rnrAmbientPanel" hidden role="dialog" aria-label="Background sound">
      <p class="rnr-amb-title"></p>
      <div class="rnr-amb-list" role="radiogroup"></div>
      <label class="rnr-amb-vol"><span aria-hidden="true">🔉</span><input type="range" min="0" max="100" step="1"><span aria-hidden="true">🔊</span></label>
      <button type="button" class="rnr-amb-stop"></button>
    </div>`;
  document.body.append(wrap);
  const btn = wrap.querySelector('.rnr-amb-btn');
  const panel = wrap.querySelector('.rnr-amb-panel');
  const listEl = wrap.querySelector('.rnr-amb-list');
  const vol = wrap.querySelector('input[type=range]');
  const stopBtn = wrap.querySelector('.rnr-amb-stop');

  let state = { sound: 'auto', volume: 45, ...read() };
  let playing = false;

  function drawUI() {
    wrap.querySelector('.rnr-amb-title').textContent = T('Background sound', 'ব্যাকগ্রাউন্ড সাউন্ড');
    listEl.innerHTML = Object.entries(SOUNDS).map(([k, v]) => {
      const sub = k === 'auto' ? `<small>${T(v[3], v[4])} · ${SOUNDS[autoPick()][0]} ${T(SOUNDS[autoPick()][1], SOUNDS[autoPick()][2])}</small>` : '';
      const on = playing && state.sound === k;
      return `<button type="button" role="radio" aria-checked="${on}" data-amb="${k}" class="${on ? 'is-on' : ''}"><span aria-hidden="true">${v[0]}</span><b>${T(v[1], v[2])}</b>${sub}</button>`;
    }).join('');
    vol.value = state.volume;
    vol.setAttribute('aria-label', T('Volume', 'ভলিউম'));
    stopBtn.textContent = T('Turn sound off', 'সাউন্ড বন্ধ করুন');
    stopBtn.hidden = !playing;
    const label = playing ? T(`Sound on: ${SOUNDS[current][1]}`, `সাউন্ড চালু: ${SOUNDS[current][2]}`) : T('Background sound (off)', 'ব্যাকগ্রাউন্ড সাউন্ড (বন্ধ)');
    btn.title = label;
    wrap.querySelector('.rnr-sr').textContent = label;
    wrap.querySelector('.rnr-amb-icon').textContent = playing ? '🔊' : '🔈';
    wrap.classList.toggle('is-playing', playing);
  }
  const openPanel = open => { panel.hidden = !open; btn.setAttribute('aria-expanded', String(open)); if (open) drawUI(); };
  btn.addEventListener('click', e => { e.stopPropagation(); openPanel(panel.hidden); });
  document.addEventListener('click', e => { if (!panel.hidden && !wrap.contains(e.target)) openPanel(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) { openPanel(false); btn.focus(); } });
  listEl.addEventListener('click', e => {
    const b = e.target.closest('[data-amb]');
    if (!b) return;
    state.sound = b.dataset.amb; write(state);
    play(state.sound);
  });
  vol.addEventListener('input', () => { state.volume = Number(vol.value); write(state); if (master) master.gain.setTargetAtTime(level(), ctx.currentTime, 0.15); });
  stopBtn.addEventListener('click', () => { stop(); drawUI(); });
  addEventListener('rnr:language', drawUI);

  // ---------- Audio engine ----------
  let ctx = null, master = null, nodes = [], timers = [], current = 'ocean';
  const level = () => Math.pow(state.volume / 100, 1.6) * 0.9;
  const rand = (a, b) => a + Math.random() * (b - a);
  const buffers = {};
  function noise(kind) {
    if (buffers[kind]) return buffers[kind];
    const len = ctx.sampleRate * 4, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    let last = 0, b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i += 1) {
      const w = Math.random() * 2 - 1;
      if (kind === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
      else if (kind === 'pink') { b0 = 0.99765 * b0 + w * 0.099046; b1 = 0.963 * b1 + w * 0.2965164; b2 = 0.57 * b2 + w * 1.0526913; d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.16; }
      else d[i] = w;
    }
    // Smooth the loop point.
    for (let i = 0; i < 2000; i += 1) { const t = i / 2000; d[i] = d[i] * t + d[len - 2000 + i] * (1 - t); }
    return (buffers[kind] = buf);
  }
  const keep = (...n) => { nodes.push(...n); return n[0]; };
  function loop(kind) { const s = keep(ctx.createBufferSource()); s.buffer = noise(kind); s.loop = true; s.start(); return s; }
  function filter(type, freq, q = 0.7) { const f = keep(ctx.createBiquadFilter()); f.type = type; f.frequency.value = freq; f.Q.value = q; return f; }
  function gain(v) { const g = keep(ctx.createGain()); g.gain.value = v; return g; }
  function lfo(rate, depth, target) { const o = keep(ctx.createOscillator()); o.frequency.value = rate; const g = gain(depth); o.connect(g).connect(target); o.start(); return o; }
  function every(fn, min, max) { let alive = true; const tick = () => { if (!alive) return; fn(); timers.push(setTimeout(tick, rand(min, max))); }; timers.push(setTimeout(tick, rand(min, max))); timers.push({ stop: () => { alive = false; } }); }

  const BUILD = {
    ocean() {
      const g = gain(0.5); loop('brown').connect(filter('lowpass', 650)).connect(g).connect(master); lfo(0.085, 0.42, g.gain);
      const foam = gain(0.06); loop('white').connect(filter('highpass', 2500)).connect(filter('lowpass', 6000)).connect(foam).connect(master); lfo(0.085, 0.05, foam.gain);
    },
    rain() {
      loop('pink').connect(filter('highpass', 500)).connect(filter('lowpass', 7500)).connect(gain(0.5)).connect(master);
      every(() => {
        const s = ctx.createBufferSource(); s.buffer = noise('white');
        const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = rand(1800, 5200); f.Q.value = 3;
        const g = ctx.createGain(), t = ctx.currentTime; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(rand(0.05, 0.16), t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
        s.connect(f).connect(g).connect(master); s.start(t, rand(0, 3), 0.07);
      }, 25, 90);
    },
    wind() {
      const f = filter('bandpass', 420, 0.8), g = gain(0.55);
      loop('brown').connect(f).connect(g).connect(master); lfo(0.05, 260, f.frequency); lfo(0.11, 0.3, g.gain);
    },
    forest() {
      const f = filter('bandpass', 600, 0.6); loop('brown').connect(f).connect(gain(0.18)).connect(master); lfo(0.04, 200, f.frequency);
      every(() => {
        const base = rand(2400, 4200), notes = Math.floor(rand(2, 6)), gap = rand(0.07, 0.14), pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        if (pan) { pan.pan.value = rand(-0.8, 0.8); pan.connect(master); }
        for (let i = 0; i < notes; i += 1) {
          const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + i * gap;
          o.type = 'sine'; o.frequency.setValueAtTime(base, t); o.frequency.exponentialRampToValueAtTime(base * rand(1.15, 1.5), t + gap * 0.7);
          g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.06, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + gap * 0.8);
          o.connect(g).connect(pan || master); o.start(t); o.stop(t + gap);
        }
      }, 600, 2600);
    },
    night() {
      loop('brown').connect(filter('lowpass', 300)).connect(gain(0.12)).connect(master);
      every(() => {
        const o = ctx.createOscillator(), g = ctx.createGain(), t0 = ctx.currentTime, f = rand(4200, 4700);
        o.type = 'sine'; o.frequency.value = f; o.connect(g).connect(master); g.gain.value = 0;
        for (let k = 0; k < 3; k += 1) { const t = t0 + k * 0.055; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.035, t + 0.012); g.gain.linearRampToValueAtTime(0, t + 0.04); }
        o.start(t0); o.stop(t0 + 0.2);
      }, 380, 1100);
    }
  };

  function teardown() {
    timers.forEach(t => (t?.stop ? t.stop() : clearTimeout(t))); timers = [];
    nodes.forEach(n => { try { n.stop?.(); } catch {} try { n.disconnect(); } catch {} }); nodes = [];
  }
  async function play(kind) {
    try {
      if (!ctx) { ctx = new AC(); master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination); }
      if (ctx.state === 'suspended') await ctx.resume();
      current = kind === 'auto' ? autoPick() : kind;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.12);
      await new Promise(r => setTimeout(r, playing ? 350 : 0));
      teardown();
      BUILD[current]();
      master.gain.setTargetAtTime(level(), ctx.currentTime, 0.6);
      playing = true;
    } catch (error) { console.warn('Sound unavailable:', error.message); playing = false; }
    drawUI();
  }
  function stop() {
    if (!ctx || !playing) return;
    playing = false;
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.25);
    setTimeout(() => { if (!playing) { teardown(); ctx.suspend().catch(() => {}); } }, 900);
  }
  document.addEventListener('visibilitychange', () => {
    if (!ctx || !playing) return;
    if (document.hidden) ctx.suspend().catch(() => {}); else ctx.resume().catch(() => {});
  });
  window.RNR_AMBIENT = { play, stop, playing: () => playing, current: () => (playing ? current : '') };
  drawUI();
})();

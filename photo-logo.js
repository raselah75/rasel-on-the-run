/* =====================================================================
   RASEL ON THE RUN — LOGO ON PHOTOS
   • When you Publish, a small logo is drawn into the corner of every
     published photo (travel photos, story pictures, then & now, food).
     Your own originals on this device are never changed.
   • Choose the logo (Rasel On the Run / Adventure with Rasel), the corner
     and the size in Publish > "Logo on photos". Saved in
     raselOnTheRunWatermarkV1 (published, so visitors' pages know the
     photos already carry the logo and do not show a second one).
   • The settings window shows a live preview of how it will look.
   ===================================================================== */
(() => {
  'use strict';
  const KEY = 'raselOnTheRunWatermarkV1';
  const LOGOS = {
    run: { label: 'Rasel On the Run', file: 'logos/watermark-rasel-on-the-run.svg' },
    adventure: { label: 'Adventure with Rasel', file: 'logos/watermark-adventure-with-rasel.svg' }
  };
  const CORNERS = { br: 'Bottom right', bl: 'Bottom left', tr: 'Top right', tl: 'Top left' };
  const SIZES = { small: ['Small', 0.24], medium: ['Medium', 0.32], large: ['Large', 0.42] };
  const DEFAULT = { on: true, logo: 'run', corner: 'br', size: 'small' };
  const read = () => { try { return { ...DEFAULT, ...(JSON.parse(localStorage.getItem(KEY) || '{}') || {}) }; } catch { return { ...DEFAULT }; } };
  const write = v => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {} };

  // ---------- On-screen preview overlay (replaces the old text mark) ----------
  function applyOverlay() {
    const s = read();
    const root = document.documentElement;
    root.classList.toggle('rnr-logo-off', !s.on);
    root.dataset.logoCorner = s.corner;
    root.style.setProperty('--rnr-logo-url', `url("${LOGOS[s.logo]?.file || LOGOS.run.file}")`);
    root.style.setProperty('--rnr-logo-ratio', s.logo === 'adventure' ? '3.4' : '4.2');
  }
  applyOverlay();
  addEventListener('storage', e => { if (e.key === KEY) applyOverlay(); });

  // ---------- Drawing the logo into a photo (used by Publish) ----------
  const imgCache = {};
  function loadLogo(file) {
    if (!imgCache[file]) imgCache[file] = (async () => {
      const r = await fetch(file); if (!r.ok) throw new Error('logo missing');
      const url = URL.createObjectURL(await r.blob());
      const img = new Image(); img.src = url; await img.decode();
      return img;
    })();
    return imgCache[file];
  }
  // Draws onto a canvas context that already holds the photo.
  async function stamp(ctx, w, h, settings = read()) {
    if (!settings.on) return false;
    const img = await loadLogo(LOGOS[settings.logo]?.file || LOGOS.run.file).catch(() => null);
    if (!img) return false;
    const short = Math.min(w, h);
    const ratio = img.naturalWidth / img.naturalHeight || 4;
    // Same height for both logos, so the round badge is as easy to read as the wide one.
    let lh = Math.max(30, short * (SIZES[settings.size]?.[1] || 0.24) * 0.34);
    let lw = lh * ratio;
    if (lw > w * 0.55) { lw = w * 0.55; lh = lw / ratio; }
    const m = Math.max(10, short * 0.03);
    const x = settings.corner.endsWith('l') ? m : w - lw - m;
    const y = settings.corner.startsWith('t') ? m : h - lh - m;
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = Math.max(4, lh * 0.18); ctx.shadowOffsetY = Math.max(1, lh * 0.03);
    ctx.drawImage(img, x, y, lw, lh);
    ctx.restore();
    return true;
  }

  // ---------- Settings (from the Publish panel) ----------
  function settings() {
    const s = read();
    window.RNR_OWNER_FORM?.({ eyebrow: 'PUBLISH', title: 'Logo on photos',
      note: 'The logo is added only to the published copies when you press "Publish now". Your originals stay clean. After changing this, publish again to update all photos.',
      fields: [
        { name: 'on', label: 'Add a logo to published photos', type: 'select', options: ['Yes', 'No'], value: s.on ? 'Yes' : 'No' },
        { name: 'logo', label: 'Which logo', type: 'select', options: Object.values(LOGOS).map(l => l.label), value: LOGOS[s.logo].label },
        { name: 'corner', label: 'Corner', type: 'select', options: Object.values(CORNERS), value: CORNERS[s.corner] },
        { name: 'size', label: 'Size', type: 'select', options: Object.values(SIZES).map(z => z[0]), value: SIZES[s.size][0],
          after: label => { label.insertAdjacentHTML('afterend', '<div class="rnr-logo-preview"><canvas width="640" height="420" aria-label="Preview"></canvas></div>'); setTimeout(preview, 30); } }
      ],
      save: d => {
        write({
          on: d.on === 'Yes',
          logo: Object.keys(LOGOS).find(k => LOGOS[k].label === d.logo) || 'run',
          corner: Object.keys(CORNERS).find(k => CORNERS[k] === d.corner) || 'br',
          size: Object.keys(SIZES).find(k => SIZES[k][0] === d.size) || 'small'
        });
        applyOverlay();
      }
    });
    document.querySelector('.rnr-owner-modal')?.addEventListener('change', preview);
  }
  async function preview() {
    const modal = document.querySelector('.rnr-owner-modal:not([hidden])');
    const canvas = modal?.querySelector('.rnr-logo-preview canvas'); if (!canvas) return;
    const v = n => modal.querySelector(`[name="${n}"]`)?.value;
    const s = {
      on: v('on') === 'Yes',
      logo: Object.keys(LOGOS).find(k => LOGOS[k].label === v('logo')) || 'run',
      corner: Object.keys(CORNERS).find(k => CORNERS[k] === v('corner')) || 'br',
      size: Object.keys(SIZES).find(k => SIZES[k][0] === v('size')) || 'small'
    };
    const g = canvas.getContext('2d'), W = canvas.width, H = canvas.height;
    // A sample "photo": sky, sun, mountains, lake.
    const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#f3b765'); sky.addColorStop(.55, '#e98a5f'); sky.addColorStop(1, '#2a5d6b');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    g.fillStyle = '#fff1d6'; g.beginPath(); g.arc(W * .7, H * .32, 38, 0, 7); g.fill();
    g.fillStyle = '#2c7d86'; g.beginPath(); g.moveTo(0, H * .72); g.lineTo(W * .28, H * .38); g.lineTo(W * .5, H * .62); g.lineTo(W * .72, H * .3); g.lineTo(W, H * .7); g.lineTo(W, H); g.lineTo(0, H); g.fill();
    g.fillStyle = '#0f3a44'; g.fillRect(0, H * .78, W, H * .22);
    await stamp(g, W, H, s);
  }

  window.RNR_LOGO = { read, stamp, settings, LOGOS };
})();

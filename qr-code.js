/* =====================================================================
   RASEL ON THE RUN — QR CODE MAKER (no library, no service)
   Makes a standard QR code (byte mode, error correction "M",
   versions 1–10 = up to 213 characters) for the postcards.
   window.RNR_QR.matrix(text) → array of rows of true/false (dark).
   Follows the QR specification (ISO/IEC 18004).
   ===================================================================== */
(() => {
  'use strict';
  const ECC_PER_BLOCK = [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26];   // level M
  const BLOCKS = [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5];                    // level M
  const rawModules = v => { let r = (16 * v + 128) * v + 64; if (v >= 2) { const n = Math.floor(v / 7) + 2; r -= (25 * n - 10) * n - 55; if (v >= 7) r -= 36; } return r; };
  const dataCodewords = v => Math.floor(rawModules(v) / 8) - ECC_PER_BLOCK[v] * BLOCKS[v];

  // GF(256) multiply, polynomial 0x11D
  const mul = (x, y) => { let z = 0; for (let i = 7; i >= 0; i -= 1) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; } return z & 0xFF; };
  function divisor(degree) {
    const r = new Array(degree).fill(0); r[degree - 1] = 1; let root = 1;
    for (let i = 0; i < degree; i += 1) {
      for (let j = 0; j < r.length; j += 1) { r[j] = mul(r[j], root); if (j + 1 < r.length) r[j] ^= r[j + 1]; }
      root = mul(root, 2);
    }
    return r;
  }
  function remainder(data, div) {
    const r = div.map(() => 0);
    data.forEach(b => { const f = b ^ r.shift(); r.push(0); div.forEach((c, i) => { r[i] ^= mul(c, f); }); });
    return r;
  }

  function matrix(text) {
    const bytes = [...new TextEncoder().encode(String(text))];
    let ver = 1;
    for (; ver <= 10; ver += 1) { const cc = ver < 10 ? 8 : 16; if (4 + cc + bytes.length * 8 <= dataCodewords(ver) * 8) break; }
    if (ver > 10) throw new Error('Text too long for this QR code');
    const size = ver * 4 + 17;
    // ---- data bits ----
    const bits = [];
    const put = (val, len) => { for (let i = len - 1; i >= 0; i -= 1) bits.push((val >>> i) & 1); };
    put(4, 4); put(bytes.length, ver < 10 ? 8 : 16); bytes.forEach(b => put(b, 8));
    const cap = dataCodewords(ver) * 8;
    put(0, Math.min(4, cap - bits.length));
    put(0, (8 - bits.length % 8) % 8);
    for (let pad = 0xEC; bits.length < cap; pad ^= 0xEC ^ 0x11) put(pad, 8);
    const data = [];
    for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(''), 2));
    // ---- error correction + interleave ----
    const nb = BLOCKS[ver], eccLen = ECC_PER_BLOCK[ver], raw = Math.floor(rawModules(ver) / 8);
    const shortCount = nb - raw % nb, shortLen = Math.floor(raw / nb), div = divisor(eccLen);
    const blocks = [];
    for (let i = 0, k = 0; i < nb; i += 1) {
      const dat = data.slice(k, k + shortLen - eccLen + (i < shortCount ? 0 : 1)); k += dat.length;
      const ecc = remainder(dat, div);
      if (i < shortCount) dat.push(0);
      blocks.push(dat.concat(ecc));
    }
    const words = [];
    for (let i = 0; i < blocks[0].length; i += 1) blocks.forEach((b, j) => { if (i !== shortLen - eccLen || j >= shortCount) words.push(b[i]); });

    // ---- function patterns ----
    const mod = Array.from({ length: size }, () => new Array(size).fill(false));
    const fn = Array.from({ length: size }, () => new Array(size).fill(false));
    const set = (x, y, dark) => { mod[y][x] = dark; fn[y][x] = true; };
    for (let i = 0; i < size; i += 1) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    const finder = (cx, cy) => { for (let dy = -4; dy <= 4; dy += 1) for (let dx = -4; dx <= 4; dx += 1) { const d = Math.max(Math.abs(dx), Math.abs(dy)), x = cx + dx, y = cy + dy; if (x >= 0 && x < size && y >= 0 && y < size) set(x, y, d !== 2 && d !== 4); } };
    finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
    if (ver >= 2) {
      const n = Math.floor(ver / 7) + 2, step = Math.ceil((ver * 4 + 4) / (n * 2 - 2)) * 2, pos = [];
      for (let i = 0, p = size - 7; i < n - 1; i += 1, p -= step) pos.unshift(p);
      pos.unshift(6);
      pos.forEach((a, i) => pos.forEach((b, j) => {
        if ((i === 0 && j === 0) || (i === 0 && j === n - 1) || (i === n - 1 && j === 0)) return;
        for (let dy = -2; dy <= 2; dy += 1) for (let dx = -2; dx <= 2; dx += 1) set(a + dx, b + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }));
    }
    const drawFormat = mask => {
      const d = (0 << 3) | mask; let r = d;              // level M = 00
      for (let i = 0; i < 10; i += 1) r = (r << 1) ^ ((r >>> 9) * 0x537);
      const b = ((d << 10) | r) ^ 0x5412, bit = i => ((b >>> i) & 1) === 1;
      for (let i = 0; i <= 5; i += 1) set(8, i, bit(i));
      set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
      for (let i = 9; i < 15; i += 1) set(14 - i, 8, bit(i));
      for (let i = 0; i < 8; i += 1) set(size - 1 - i, 8, bit(i));
      for (let i = 8; i < 15; i += 1) set(8, size - 15 + i, bit(i));
      set(8, size - 8, true);
    };
    drawFormat(0);
    if (ver >= 7) {
      let r = ver; for (let i = 0; i < 12; i += 1) r = (r << 1) ^ ((r >>> 11) * 0x1F25);
      const b = (ver << 12) | r;
      for (let i = 0; i < 18; i += 1) { const dark = ((b >>> i) & 1) === 1, a = size - 11 + i % 3, c = Math.floor(i / 3); set(a, c, dark); set(c, a, dark); }
    }
    // ---- data placement ----
    let i = 0;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let v = 0; v < size; v += 1) for (let j = 0; j < 2; j += 1) {
        const x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - v : v;
        if (!fn[y][x] && i < words.length * 8) { mod[y][x] = ((words[i >>> 3] >>> (7 - (i & 7))) & 1) === 1; i += 1; }
      }
    }
    // ---- masking: try all 8, keep the lowest penalty ----
    const MASKS = [
      (x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, x => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
      (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => (x * y) % 2 + (x * y) % 3 === 0,
      (x, y) => ((x * y) % 2 + (x * y) % 3) % 2 === 0, (x, y) => ((x + y) % 2 + (x * y) % 3) % 2 === 0
    ];
    const applyMask = m => { for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) if (!fn[y][x] && MASKS[m](x, y)) mod[y][x] = !mod[y][x]; };
    const penalty = () => {
      let p = 0, dark = 0;
      const line = get => { let run = 1; for (let k = 1; k < size; k += 1) { if (get(k) === get(k - 1)) { run += 1; if (run === 5) p += 3; else if (run > 5) p += 1; } else run = 1; } };
      for (let y = 0; y < size; y += 1) { line(k => mod[y][k]); line(k => mod[k][y]); }
      for (let y = 0; y < size - 1; y += 1) for (let x = 0; x < size - 1; x += 1) { const c = mod[y][x]; if (c === mod[y][x + 1] && c === mod[y + 1][x] && c === mod[y + 1][x + 1]) p += 3; }
      const pat = [true, false, true, true, true, false, true];
      for (let y = 0; y < size; y += 1) for (let x = 0; x + 7 <= size; x += 1) {
        if (pat.every((v, k) => mod[y][x + k] === v)) p += 40;
        if (pat.every((v, k) => mod[x + k][y] === v)) p += 40;
      }
      mod.forEach(r => r.forEach(c => { if (c) dark += 1; }));
      p += Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10;
      return p;
    };
    let best = 0, bestScore = Infinity;
    for (let m = 0; m < 8; m += 1) { applyMask(m); drawFormat(m); const s = penalty(); if (s < bestScore) { bestScore = s; best = m; } applyMask(m); }
    applyMask(best); drawFormat(best);
    return mod;
  }

  // Draw on a canvas context at (x, y) with the given size (includes a 4-module quiet zone).
  function draw(ctx, text, x, y, px, { dark = '#10202c', light = '#ffffff' } = {}) {
    const m = matrix(text), n = m.length + 8, cell = px / n;
    ctx.save(); ctx.fillStyle = light; ctx.fillRect(x, y, px, px); ctx.fillStyle = dark;
    m.forEach((row, r) => row.forEach((c, k) => { if (c) ctx.fillRect(Math.floor(x + (k + 4) * cell), Math.floor(y + (r + 4) * cell), Math.ceil(cell), Math.ceil(cell)); }));
    ctx.restore();
  }
  window.RNR_QR = { matrix, draw };
})();

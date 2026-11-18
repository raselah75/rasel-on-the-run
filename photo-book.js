/* =====================================================================
   RASEL ON THE RUN — PHOTO BOOK (owner only)
   Turns your photos into a printable album: a cover, a chapter page for
   every country, your photos with place and date, and a closing page.
   Choose all photos, one year or one country, the layout and the paper
   size, look at the preview, then "Print / Save as PDF" (choose "Save as
   PDF" in the print window). Nothing is uploaded.
   Open it from My Toolkit, or "📖 Photo book" on the Timeline (Admin).
   ===================================================================== */
(() => {
  'use strict';
  const main = document.querySelector('main');
  if (!main) return;
  const isAdmin = () => document.body.classList.contains('admin-mode');
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const LAYOUTS = { 'Classic — 2 photos per page': 2, 'Large — 1 photo per page': 1, 'Collage — 4 photos per page': 4 };
  const PAPER = { 'A4 (21 × 29.7 cm)': ['210mm', '297mm'], 'Letter (8.5 × 11 in)': ['8.5in', '11in'] };

  // ---------- Toolkit card ----------
  const section = document.createElement('section');
  section.id = 'rnrPhotoBook';
  section.className = 'section rnr-book-section';
  section.innerHTML = `<div class="rnr-book-promo">
      <div class="rnr-book-art" aria-hidden="true"><span></span><span></span><span></span></div>
      <div><p class="eyebrow">PHOTO BOOK</p><h2>Make a photo book</h2>
      <p>Turn your photos into a printable album with a cover, a chapter for every country and the place and date under each photo. Save it as a PDF or print it.</p>
      <button type="button" class="primary-button" data-photo-book>📖 Make a photo book</button></div></div>`;
  main.append(section);

  // ---------- Preview overlay ----------
  const overlay = document.createElement('div');
  overlay.className = 'rnr-book-overlay';
  overlay.hidden = true;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.innerHTML = `<div class="rnr-book-bar"><div><strong>Photo book preview</strong><small></small></div>
      <div class="rnr-book-bar-actions"><button type="button" class="rnr-btn rnr-btn-ghost" data-book-close>Close</button><button type="button" class="rnr-btn rnr-btn-primary" data-book-print>Print / Save as PDF</button></div></div>
    <div class="rnr-book-status" role="status"></div>
    <iframe class="rnr-book-frame" title="Photo book preview"></iframe>`;
  document.body.append(overlay);
  const frame = overlay.querySelector('iframe');
  let urls = [];
  const closeBook = () => { overlay.hidden = true; document.body.classList.remove('rnr-modal-open'); frame.srcdoc = ''; urls.forEach(u => URL.revokeObjectURL(u)); urls = []; };
  overlay.addEventListener('click', e => {
    if (e.target.closest('[data-book-close]')) closeBook();
    if (e.target.closest('[data-book-print]')) { try { frame.contentWindow.focus(); frame.contentWindow.print(); } catch { alert('Printing is not available in this browser.'); } }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !overlay.hidden) closeBook(); });

  // ---------- Data ----------
  const timeOf = p => (p.travelDate ? new Date(`${p.travelDate}T12:00:00`) : p.takenAt ? new Date(p.takenAt) : null);
  const yearOf = p => timeOf(p)?.getFullYear();
  const countryOf = p => (typeof travelData !== 'undefined' ? travelData.find(c => c.id === p.countryId) : null);
  const placeOf = p => (window.RNR_GALLERY?.placeLine ? window.RNR_GALLERY.placeLine(p) : '');
  const dateText = d => (d ? d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '');
  const monthText = d => (d ? d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : '');
  const flagOf = name => (typeof getCountryFlag === 'function' ? getCountryFlag(name) : '');

  async function photos() {
    try { return (window.RNR_GALLERY?.allPhotos ? await window.RNR_GALLERY.allPhotos() : []).filter(p => p.blob instanceof Blob && /^image\//.test(p.blob.type || 'image/')); } catch { return []; }
  }

  async function openOptions(presetYear) {
    if (!isAdmin()) return;
    const all = await photos();
    if (!all.length) { alert('Add some photos first, then make a photo book.'); return; }
    const years = [...new Set(all.map(yearOf).filter(Boolean))].sort((a, b) => b - a);
    const countries = [...new Set(all.map(p => countryOf(p)?.name).filter(Boolean))].sort();
    const scopes = [`All photos (${all.length})`, ...years.map(y => `Year ${y} (${all.filter(p => yearOf(p) === y).length})`), ...countries.map(c => `Country: ${c} (${all.filter(p => countryOf(p)?.name === c).length})`)];
    const preset = presetYear ? scopes.find(s => s.startsWith(`Year ${presetYear} `)) : scopes[0];
    window.RNR_OWNER_FORM?.({ eyebrow: 'PHOTO BOOK', title: 'Make a photo book', note: 'You will see a preview first. In the print window choose "Save as PDF" to keep it as a file.',
      fields: [
        { name: 'scope', label: 'Which photos?', type: 'select', options: scopes, value: preset || scopes[0] },
        { name: 'title', label: 'Book title', value: 'Rasel On the Run', maxlength: 60 },
        { name: 'subtitle', label: 'Subtitle (optional)', value: presetYear ? `My year in travels · ${presetYear}` : 'Every journey tells a story', maxlength: 80 },
        { name: 'layout', label: 'Layout', type: 'select', options: Object.keys(LAYOUTS), value: Object.keys(LAYOUTS)[0] },
        { name: 'paper', label: 'Paper size', type: 'select', options: Object.keys(PAPER), value: Object.keys(PAPER)[0] },
        { name: 'max', label: 'Most photos in the book', type: 'select', options: ['50', '100', '200', '300'], value: '100' }
      ],
      save: d => {
        let list = all;
        const ym = d.scope.match(/^Year (\d{4})/), cm = d.scope.match(/^Country: (.+) \(\d+\)$/);
        if (ym) list = all.filter(p => yearOf(p) === Number(ym[1]));
        if (cm) list = all.filter(p => countryOf(p)?.name === cm[1]);
        build(list, { title: d.title.trim() || 'Rasel On the Run', subtitle: d.subtitle.trim(), per: LAYOUTS[d.layout] || 2, paper: PAPER[d.paper] || PAPER['A4 (21 × 29.7 cm)'], max: Number(d.max) || 100, scope: d.scope.replace(/ \(\d+\)$/, '') });
      } });
  }

  // ---------- Building the book ----------
  async function build(list, opt) {
    overlay.hidden = false;
    document.body.classList.add('rnr-modal-open');
    const status = overlay.querySelector('.rnr-book-status');
    status.textContent = 'Building your photo book…';
    overlay.classList.add('is-busy');
    urls.forEach(u => URL.revokeObjectURL(u)); urls = [];
    // Best photos first if there are too many, then in time order.
    let chosen = list.slice();
    if (chosen.length > opt.max) chosen = [...chosen.filter(p => p.highlight), ...chosen.filter(p => !p.highlight)].slice(0, opt.max);
    const t = p => timeOf(p)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    chosen.sort((a, b) => t(a) - t(b));
    const cover = chosen.find(p => p.highlight) || chosen[Math.floor(chosen.length / 2)] || chosen[0];
    const url = p => { const u = URL.createObjectURL(p.blob); urls.push(u); return u; };

    // Chapters by country, in the order you first visited.
    const chapters = [];
    chosen.forEach(p => {
      const name = countryOf(p)?.name || 'Memories';
      let ch = chapters.find(c => c.name === name);
      if (!ch) { ch = { name, photos: [] }; chapters.push(ch); }
      ch.photos.push(p);
    });
    const dates = chosen.map(timeOf).filter(Boolean);
    const span = dates.length ? (monthText(dates[0]) === monthText(dates[dates.length - 1]) ? monthText(dates[0]) : `${monthText(dates[0])} – ${monthText(dates[dates.length - 1])}`) : '';
    const fig = p => {
      const caption = (p.caption || p.title || '').trim();
      const d = timeOf(p);
      return `<figure><div class="ph"><img src="${url(p)}" alt=""></div><figcaption>${caption ? `<b>${esc(caption)}</b>` : ''}<span>${esc([placeOf(p), dateText(d)].filter(Boolean).join(' · '))}</span></figcaption></figure>`;
    };
    let pageNo = 2;
    const pages = [];
    pages.push(`<section class="page cover"><img src="${url(cover)}" alt=""><div class="shade"></div><div class="cover-text"><p class="kicker">${esc(opt.scope)}</p><h1>${esc(opt.title)}</h1>${opt.subtitle ? `<p class="sub">${esc(opt.subtitle)}</p>` : ''}<p class="meta">${esc(span)} · ${chosen.length} photographs</p></div><div class="brand">RASEL ON THE RUN</div></section>`);
    pages.push(`<section class="page contents"><p class="kicker">INSIDE THIS BOOK</p><h2>Contents</h2><ol>${chapters.map(c => `<li><span>${esc(flagOf(c.name))} ${esc(c.name)}</span><i></i><em>${c.photos.length} photos</em></li>`).join('')}</ol><p class="quote">“Every journey tells a story.”</p><div class="folio">${pageNo}</div></section>`);
    chapters.forEach((ch, ci) => {
      pageNo += 1;
      const cities = [...new Set(ch.photos.map(p => placeOf(p).split(',')[0]).filter(Boolean))];
      const cd = ch.photos.map(timeOf).filter(Boolean);
      const chSpan = cd.length ? (monthText(cd[0]) === monthText(cd[cd.length - 1]) ? monthText(cd[0]) : `${monthText(cd[0])} – ${monthText(cd[cd.length - 1])}`) : '';
      pages.push(`<section class="page chapter"><div class="chapter-photo"><img src="${url(ch.photos[0])}" alt=""></div><div class="chapter-text"><p class="kicker">CHAPTER ${ci + 1}</p><div class="flag">${esc(flagOf(ch.name))}</div><h2>${esc(ch.name)}</h2><p class="span">${esc(chSpan)}</p>${cities.length ? `<p class="cities">${cities.slice(0, 12).map(esc).join(' · ')}</p>` : ''}</div><div class="folio">${pageNo}</div></section>`);
      for (let i = 0; i < ch.photos.length; i += opt.per) {
        pageNo += 1;
        pages.push(`<section class="page photos per-${opt.per}"><header class="running"><span>${esc(opt.title)}</span><span>${esc(ch.name)}</span></header><div class="grid">${ch.photos.slice(i, i + opt.per).map(fig).join('')}</div><div class="folio">${pageNo}</div></section>`);
      }
    });
    pages.push(`<section class="page end"><div><p class="kicker">TO BE CONTINUED</p><h2>The journey continues…</h2><p>${esc(opt.title)} · ${new Date().getFullYear()}</p><p class="small">Made with love on Rasel On the Run</p></div></section>`);

    const [pw, ph] = opt.paper;
    const css = `@page{size:${pw} ${ph};margin:0}
*{box-sizing:border-box}html,body{margin:0;padding:0}body{font-family:Georgia,"Times New Roman",serif;color:#1d2a33;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:${pw};height:${ph};position:relative;overflow:hidden;page-break-after:always;break-after:page;background:#fffdf8;padding:16mm 15mm 18mm}
.kicker{font:700 9pt/1 Helvetica,Arial,sans-serif;letter-spacing:.22em;color:#c06a3c;margin:0 0 6mm}
.folio{position:absolute;bottom:8mm;left:0;right:0;text-align:center;font:9pt Helvetica,Arial,sans-serif;color:#8a959c}
.cover{padding:0;background:#0f2233;color:#fff}.cover img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.cover .shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(10,20,30,.1) 30%,rgba(10,20,30,.85))}
.cover-text{position:absolute;left:15mm;right:15mm;bottom:28mm}.cover h1{font-size:40pt;line-height:1.05;margin:0 0 4mm;font-weight:700}
.cover .sub{font-size:15pt;margin:0 0 6mm;font-style:italic;opacity:.92}.cover .meta{font:10pt Helvetica,Arial,sans-serif;opacity:.85;margin:0}.cover .kicker{color:#f3b765}
.cover .brand{position:absolute;top:12mm;left:15mm;font:700 9pt Helvetica,Arial,sans-serif;letter-spacing:.3em;color:#f3b765}
.contents h2,.end h2{font-size:30pt;margin:0 0 10mm}.contents ol{list-style:none;padding:0;margin:0;font-size:14pt}
.contents li{display:flex;align-items:baseline;gap:3mm;padding:3.2mm 0}.contents li i{flex:1;border-bottom:1px dotted #b9b2a5}.contents em{font:10pt Helvetica,Arial,sans-serif;color:#6b7780}
.contents .quote{position:absolute;bottom:26mm;left:15mm;right:15mm;text-align:center;font-style:italic;font-size:14pt;color:#6b7780}
.chapter{padding:0;display:flex;flex-direction:column}.chapter-photo{height:58%;overflow:hidden}.chapter-photo img{width:100%;height:100%;object-fit:cover}
.chapter-text{padding:12mm 15mm}.chapter .flag{font-size:30pt;line-height:1}.chapter h2{font-size:38pt;margin:2mm 0 3mm}.chapter .span{font:11pt Helvetica,Arial,sans-serif;color:#6b7780;margin:0 0 4mm}.chapter .cities{font-size:12pt;color:#3c4a54;line-height:1.6}
.running{display:flex;justify-content:space-between;font:8.5pt Helvetica,Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#8a959c;border-bottom:1px solid #e6dfd2;padding-bottom:3mm;margin-bottom:6mm}
.grid{display:grid;gap:7mm;height:calc(100% - 14mm)}.per-1 .grid{grid-template-rows:1fr}.per-2 .grid{grid-template-rows:1fr 1fr}.per-4 .grid{grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:6mm}
figure{margin:0;display:flex;flex-direction:column;min-height:0}.ph{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;background:#f3eee4;border-radius:2mm;overflow:hidden}
.per-1 .ph img,.per-2 .ph img{max-width:100%;max-height:100%;object-fit:contain;display:block}.per-4 .ph img{width:100%;height:100%;object-fit:cover;display:block}
figcaption{padding-top:2.5mm;font:9pt/1.4 Helvetica,Arial,sans-serif;color:#55626b}figcaption b{display:block;font:italic 11pt Georgia,serif;color:#1d2a33;margin-bottom:.8mm}
.end{display:flex;align-items:center;justify-content:center;text-align:center;background:#0f2233;color:#fff}.end .kicker{color:#f3b765}.end p{font-size:13pt;opacity:.9}.end .small{font:9pt Helvetica,Arial,sans-serif;opacity:.6;margin-top:20mm}
@media screen{body{background:#d9d3c7;padding:14px 0}.page{margin:0 auto 18px;box-shadow:0 10px 30px rgba(0,0,0,.18)}}
@media print{body{background:none}html{zoom:1!important}}`;
    frame.srcdoc = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${esc(opt.title)}</title><style>${css}</style></head><body>${pages.join('')}</body></html>`;
    await new Promise(r => { frame.onload = r; setTimeout(r, 4000); });
    const doc = frame.contentDocument;
    if (doc) {
      const fit = () => { const page = doc.querySelector('.page'); if (!page) return; const scale = Math.min(1, (frame.clientWidth - 28) / page.offsetWidth); doc.documentElement.style.zoom = scale; };
      fit();
      addEventListener('resize', fit, { once: true });
      const imgs = [...doc.images];
      let done = 0;
      await Promise.all(imgs.map(img => (img.decode ? img.decode() : Promise.resolve()).catch(() => {}).then(() => { done += 1; status.textContent = `Preparing photos… ${done}/${imgs.length}`; })));
    }
    overlay.querySelector('.rnr-book-bar small').textContent = `${chosen.length} photos · ${pages.length} pages`;
    status.textContent = list.length > chosen.length ? `Your ${opt.max} favourite and best-dated photos were used (out of ${list.length}).` : '';
    overlay.classList.remove('is-busy');
  }

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-photo-book]');
    if (!b || !isAdmin()) return;
    e.preventDefault();
    openOptions(b.dataset.year ? Number(b.dataset.year) : null);
  });
  window.RNR_PHOTOBOOK = { open: openOptions, build };
})();

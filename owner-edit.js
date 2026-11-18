/* =====================================================================
   RASEL ON THE RUN — OWNER EDITING FOR TEXT AND STUDY JOURNEY
   Admin mode only:
   • "Edit text" on the homepage cover, the welcome block and every page
     banner (Travels, Videos, Study Journey, Stories, About).
   • "Edit" on every Study Journey entry: level, years, school, title, story,
     add photos, remove single photos, delete the entry.
   Saved text is published with "Publish" (key raselOnTheRunSiteTextV1).
   ===================================================================== */
(() => {
  'use strict';
  const KEY = 'raselOnTheRunSiteTextV1';
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { return {}; } };
  const write = v => { try { localStorage.setItem(KEY, JSON.stringify(v)); return true; } catch { alert('Could not save. Browser storage may be full.'); return false; } };
  const isAdmin = () => document.body.classList.contains('admin-mode');
  window.RNR_SITE_TEXT = read();

  // ---------- generic small form modal ----------
  const modal = document.createElement('div');
  modal.className = 'rnr-modal rnr-owner-modal';
  modal.hidden = true;
  modal.innerHTML = `<div class="rnr-modal-backdrop" data-close></div>
    <form class="rnr-modal-card" role="dialog" aria-modal="true"><div class="rnr-modal-body">
      <p class="rnr-modal-eyebrow"></p><h3></h3><div class="rnr-owner-fields"></div><p class="rnr-modal-note"></p>
      <div class="rnr-modal-footer"><button type="button" class="rnr-btn rnr-btn-ghost rnr-owner-extra" hidden></button><button type="button" class="rnr-btn rnr-btn-ghost" data-close>Cancel</button><button type="submit" class="rnr-btn rnr-btn-primary">Save</button></div>
    </div></form>`;
  document.body.append(modal);
  let onSave = null, onExtra = null;
  const close = () => { modal.hidden = true; document.body.classList.remove('rnr-modal-open'); };
  modal.addEventListener('click', e => { if (e.target.closest('[data-close]')) close(); });
  modal.querySelector('form').addEventListener('submit', async e => {
    e.preventDefault();
    const data = Object.fromEntries([...modal.querySelectorAll('[name]')].map(el => [el.name, el.type === 'file' ? el.files : el.value]));
    if (onSave && (await onSave(data)) !== false) close();
  });
  modal.querySelector('.rnr-owner-extra').addEventListener('click', async () => { if (onExtra && (await onExtra()) !== false) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) close(); });

  function openForm({ eyebrow, title, fields, save, extra, extraLabel, note }) {
    modal.querySelector('.rnr-modal-eyebrow').textContent = eyebrow;
    modal.querySelector('h3').textContent = title;
    modal.querySelector('.rnr-modal-note').textContent = note || '';
    const box = modal.querySelector('.rnr-owner-fields');
    box.innerHTML = '';
    fields.forEach(f => {
      const label = document.createElement('label');
      label.className = 'rnr-field';
      label.append(document.createTextNode(f.label));
      let input;
      if (f.type === 'textarea') { input = document.createElement('textarea'); input.rows = f.rows || 4; }
      else if (f.type === 'select') { input = document.createElement('select'); f.options.forEach(o => input.append(new Option(o, o))); }
      else { input = document.createElement('input'); input.type = f.type || 'text'; if (f.accept) input.accept = f.accept; if (f.multiple) input.multiple = true; }
      input.name = f.name;
      if (f.type !== 'file') input.value = f.value ?? '';
      if (f.placeholder) input.placeholder = f.placeholder;
      if (f.maxlength) input.maxLength = f.maxlength;
      label.append(input);
      if (f.extraHTML) label.insertAdjacentHTML('beforeend', f.extraHTML);
      box.append(label);
      if (f.after) f.after(label);
    });
    onSave = save; onExtra = extra || null;
    const extraBtn = modal.querySelector('.rnr-owner-extra');
    extraBtn.hidden = !extra; extraBtn.textContent = extraLabel || '';
    modal.hidden = false;
    document.body.classList.add('rnr-modal-open');
    setTimeout(() => box.querySelector('input, textarea, select')?.focus(), 30);
  }
  window.RNR_OWNER_FORM = openForm;

  // ---------- editable page text ----------
  const hero = document.getElementById('home');
  const welcome = document.getElementById('welcome');
  const original = {
    heroEyebrow: hero?.querySelector('.eyebrow')?.textContent.trim() || '',
    heroLine1: 'Collect moments.', heroLine2: 'Remember journeys.',
    heroText: hero?.querySelector('.hero-description')?.textContent.replace(/\s+/g, ' ').trim() || '',
    welcomeEyebrow: welcome?.querySelector('.eyebrow')?.textContent.trim() || '',
    welcomeTitle: welcome?.querySelector('h2')?.textContent.trim() || '',
    welcomeText: welcome?.querySelector('p:not(.eyebrow)')?.textContent.replace(/\s+/g, ' ').trim() || ''
  };
  function applyText() {
    const t = window.RNR_SITE_TEXT = read();
    if (hero) {
      const h1 = hero.querySelector('h1');
      if (t.heroLine1 || t.heroLine2) { h1.textContent = ''; h1.append(document.createTextNode(t.heroLine1 ?? original.heroLine1)); h1.append(document.createElement('br')); h1.append(document.createTextNode(t.heroLine2 ?? original.heroLine2)); }
      if (t.heroEyebrow) hero.querySelector('.eyebrow').textContent = t.heroEyebrow;
      if (t.heroText) hero.querySelector('.hero-description').textContent = t.heroText;
    }
    if (welcome) {
      if (t.welcomeEyebrow) welcome.querySelector('.eyebrow').textContent = t.welcomeEyebrow;
      if (t.welcomeTitle) welcome.querySelector('h2').textContent = t.welcomeTitle;
      if (t.welcomeText) welcome.querySelector('p:not(.eyebrow)').textContent = t.welcomeText;
    }
    window.RNR_PAGES?.refresh();
  }
  function editButton(host, label, handler) {
    if (!host || host.querySelector(':scope > .rnr-text-edit')) return;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'rnr-text-edit'; b.textContent = label;
    b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); handler(); });
    host.append(b);
  }
  const keep = (data, keys) => { const t = read(); keys.forEach(k => { const v = (data[k] || '').trim(); if (v && v !== original[k]) t[k] = v; else delete t[k]; }); return write(t); };
  editButton(hero, 'Edit text', () => {
    const t = read();
    openForm({ eyebrow: 'HOMEPAGE COVER', title: 'Edit cover text', fields: [
      { name: 'heroEyebrow', label: 'Small line above the title', value: t.heroEyebrow || original.heroEyebrow, maxlength: 60 },
      { name: 'heroLine1', label: 'Title – first line', value: t.heroLine1 || original.heroLine1, maxlength: 40 },
      { name: 'heroLine2', label: 'Title – second line', value: t.heroLine2 || original.heroLine2, maxlength: 40 },
      { name: 'heroText', label: 'Description', type: 'textarea', rows: 3, value: t.heroText || original.heroText, maxlength: 240 }
    ], save: d => { if (keep(d, ['heroEyebrow', 'heroLine1', 'heroLine2', 'heroText'])) applyText(); },
    extraLabel: 'Restore original', extra: () => { const t2 = read(); ['heroEyebrow', 'heroLine1', 'heroLine2', 'heroText'].forEach(k => delete t2[k]); write(t2); location.reload(); } });
  });
  editButton(welcome, 'Edit text', () => {
    const t = read();
    openForm({ eyebrow: 'WELCOME', title: 'Edit welcome text', fields: [
      { name: 'welcomeEyebrow', label: 'Small line above the title', value: t.welcomeEyebrow || original.welcomeEyebrow, maxlength: 60 },
      { name: 'welcomeTitle', label: 'Title', value: t.welcomeTitle || original.welcomeTitle, maxlength: 80 },
      { name: 'welcomeText', label: 'Text', type: 'textarea', rows: 3, value: t.welcomeText || original.welcomeText, maxlength: 400 }
    ], save: d => { if (keep(d, ['welcomeEyebrow', 'welcomeTitle', 'welcomeText'])) applyText(); } });
  });
  // Page banners (texts are applied by site-pages.js from RNR_SITE_TEXT.banners).
  const banner = document.getElementById('rnrPageBanner');
  editButton(banner, 'Edit text', () => {
    const page = document.body.dataset.rnrPage || 'travels';
    const t = read(); const b = (t.banners || {})[page] || {};
    openForm({ eyebrow: 'PAGE TITLE', title: 'Edit page title', fields: [
      { name: 'title', label: 'Title', value: b.title || document.getElementById('rnrBannerTitle')?.textContent || '', maxlength: 60 },
      { name: 'text', label: 'Text under the title', type: 'textarea', rows: 2, value: b.text || document.getElementById('rnrBannerText')?.textContent || '', maxlength: 200 }
    ], save: d => { const t2 = read(); t2.banners = t2.banners || {}; t2.banners[page] = { title: d.title.trim(), text: d.text.trim() }; if (write(t2)) { window.RNR_SITE_TEXT = t2; window.RNR_PAGES?.refresh(); } },
    extraLabel: 'Restore original', extra: () => { const t2 = read(); if (t2.banners) delete t2.banners[page]; write(t2); window.RNR_SITE_TEXT = t2; window.RNR_PAGES?.refresh(); } });
  });

  // ---------- study journey: edit an entry ----------
  const timeline = document.getElementById('studyJourneyTimeline');
  const LEVELS = ['Primary School', 'High School', 'College', 'University', 'Other'];
  function decorateStudy() {
    if (!timeline || !window.RNR_STUDY) return;
    const items = window.RNR_STUDY.read();
    timeline.querySelectorAll('.study-entry').forEach(article => {
      const id = article.querySelector('[data-delete-study]')?.dataset.deleteStudy;
      if (!id || article.querySelector('.rnr-study-edit')) return;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'rnr-study-edit'; b.textContent = 'Edit'; b.dataset.editStudy = id;
      (article.querySelector('.study-delete') || article).before(b);
    });
    return items;
  }
  const fileToData = file => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
  timeline?.addEventListener('click', async e => {
    const btn = e.target.closest('[data-edit-study]');
    if (!btn || !isAdmin() || !window.RNR_STUDY) return;
    const items = window.RNR_STUDY.read();
    const item = items.find(i => i.id === btn.dataset.editStudy);
    if (!item) return;
    let photos = (item.photos || []).slice();
    openForm({ eyebrow: 'STUDY JOURNEY', title: 'Edit study memory', fields: [
      { name: 'level', label: 'Level', type: 'select', options: LEVELS, value: item.level },
      { name: 'period', label: 'Years', value: item.period || '', placeholder: 'e.g. 2019 – 2023', maxlength: 60 },
      { name: 'institution', label: 'School / college / university', value: item.institution || '', maxlength: 120 },
      { name: 'title', label: 'Title', value: item.title || '', maxlength: 120 },
      { name: 'story', label: 'Story', type: 'textarea', rows: 4, value: item.story || '', maxlength: 3000 },
      { name: 'add', label: 'Add photos', type: 'file', accept: 'image/*', multiple: true, after: label => {
        const strip = document.createElement('div'); strip.className = 'rnr-study-photos';
        const draw = () => { strip.innerHTML = photos.map((p, i) => `<figure><img src="${p.data}" alt=""><button type="button" data-rm="${i}" aria-label="Remove photo">✕</button></figure>`).join('') || '<small>No photos yet.</small>'; };
        strip.addEventListener('click', ev => { const rm = ev.target.closest('[data-rm]'); if (rm) { photos.splice(Number(rm.dataset.rm), 1); draw(); } });
        draw(); label.before(strip);
      } }
    ], save: async d => {
      try {
        const added = await Promise.all([...(d.add || [])].filter(f => f.type.startsWith('image/')).map(async f => {
          const small = typeof window.RNR_SHRINK === 'function' ? await window.RNR_SHRINK(f).catch(() => f) : f;
          return { name: f.name, data: await fileToData(small) };
        }));
        Object.assign(item, { level: d.level, period: d.period.trim(), institution: d.institution.trim(), title: d.title.trim() || item.title, story: d.story.trim(), photos: photos.concat(added), updatedAt: new Date().toISOString() });
        window.RNR_STUDY.save(items);
        window.RNR_STUDY.render();
      } catch (error) { console.error(error); alert('Could not save. Try fewer or smaller photos.'); return false; }
    },
    extraLabel: 'Delete entry', extra: () => {
      if (!confirm('Delete this study memory and its photos?')) return false;
      window.RNR_STUDY.save(items.filter(i => i.id !== item.id)); window.RNR_STUDY.render();
    } });
  });

  function init() {
    applyText();
    decorateStudy();
    if (timeline) new MutationObserver(decorateStudy).observe(timeline, { childList: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();

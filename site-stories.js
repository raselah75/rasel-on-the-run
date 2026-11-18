/* =====================================================================
   RASEL ON THE RUN — STORIES (blog-style trip pages)
   Shows the chapters written in "Lifetime Travel Documentary" (Admin mode,
   Stories page) as story cards. Each story opens as its own full page with a
   large photo, the story text, its photos/videos and a shareable link
   (opened in place). No new data store: chapters and media are read from the
   existing documentary storage.
   ===================================================================== */
(() => {
  'use strict';
  const KEY = 'raselOnTheRunLifetimeDocumentaryV1';
  const DB = 'RaselOnTheRunLifetimeDocMediaV1';
  const STORE = 'media';
  const main = document.querySelector('main');
  if (!main || document.getElementById('rnrStories')) return;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const readChapters = () => {
    try { const data = JSON.parse(localStorage.getItem(KEY) || '{}'); return Array.isArray(data.chapters) ? data.chapters : []; }
    catch { return []; }
  };
  const openDB = () => new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: 'id' }); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const allMedia = async () => {
    try {
      const db = await openDB();
      return await new Promise((resolve, reject) => {
        const request = db.transaction(STORE).objectStore(STORE).getAll();
        request.onsuccess = () => { db.close(); resolve(request.result || []); };
        request.onerror = () => { db.close(); reject(request.error); };
      });
    } catch (error) { console.warn('Story media unavailable:', error); return []; }
  };
  const formatDate = value => {
    if (!value) return '';
    const date = new Date(`${value}T12:00:00`);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };
  const sortKey = chapter => chapter.date || chapter.createdAt || '';

  // ---------- Section ----------
  const section = document.createElement('section');
  section.id = 'rnrStories';
  section.className = 'section rnr-stories-section';
  section.innerHTML = `
    <div class="section-heading rnr-stories-heading">
      <div>
        <p class="eyebrow">TRAVEL STORIES</p>
        <h2>Stories from the road</h2>
        <p>The moments behind the photographs.</p>
      </div>
    </div>
    <div class="rnr-stories-grid" id="rnrStoriesGrid"></div>
    <p class="rnr-stories-owner-hint">Write a new story below in “Lifetime Travel Documentary” (Add a chapter). It appears here automatically.</p>
    <div class="rnr-see-all rnr-home-only"><a class="rnr-see-all-link" href="#stories">Read all stories <span aria-hidden="true">→</span></a></div>`;
  const anchor = document.getElementById('memories');
  if (anchor) anchor.after(section); else main.append(section);
  const grid = section.querySelector('#rnrStoriesGrid');

  let urls = [];
  let cache = { chapters: [], media: new Map() };

  async function load() {
    const chapters = readChapters().slice().sort((a, b) => String(sortKey(b)).localeCompare(String(sortKey(a))));
    const media = await allMedia();
    urls.forEach(url => URL.revokeObjectURL(url));
    urls = [];
    const byId = new Map();
    media.forEach(item => {
      if (!item?.blob) return;
      const url = URL.createObjectURL(item.blob);
      urls.push(url);
      byId.set(item.id, { url, type: item.type || item.blob.type || '', name: item.name || '' });
    });
    cache = { chapters, media: byId };
  }

  const mediaOf = chapter => (chapter.mediaIds || []).map(id => cache.media.get(id)).filter(Boolean);
  const coverOf = chapter => mediaOf(chapter).find(item => item.type.startsWith('image/')) || mediaOf(chapter)[0] || null;

  function render() {
    if (!cache.chapters.length) { grid.innerHTML = ''; return; }
    grid.innerHTML = cache.chapters.map(chapter => {
      const cover = coverOf(chapter);
      const visual = !cover ? '<div class="rnr-story-cover rnr-story-cover-empty"></div>'
        : cover.type.startsWith('video/') ? `<div class="rnr-story-cover"><video src="${cover.url}" muted playsinline preload="metadata"></video></div>`
        : `<div class="rnr-story-cover" style="background-image:url('${cover.url}')"></div>`;
      const excerpt = String(chapter.story || '').trim().slice(0, 150);
      const meta = [chapter.location, formatDate(chapter.date)].filter(Boolean).map(esc).join(' · ');
      return `<article class="rnr-story-card">
        <a href="#" data-story="${esc(chapter.id)}" class="rnr-story-link" aria-label="Read ${esc(chapter.title)}">
          ${visual}
          <div class="rnr-story-body">
            ${chapter.type ? `<span class="rnr-story-tag">${esc(chapter.type)}</span>` : ''}
            <h3>${esc(chapter.title || 'Untitled story')}</h3>
            ${meta ? `<p class="rnr-story-meta">${meta}</p>` : ''}
            ${excerpt ? `<p class="rnr-story-excerpt">${esc(excerpt)}${String(chapter.story).length > 150 ? '…' : ''}</p>` : ''}
            <span class="rnr-story-more">Read story <span aria-hidden="true">→</span></span>
          </div>
        </a>
      </article>`;
    }).join('');
  }

  // ---------- Reader ----------
  const reader = document.createElement('div');
  reader.className = 'rnr-reader';
  reader.id = 'rnrReader';
  reader.hidden = true;
  reader.setAttribute('role', 'dialog');
  reader.setAttribute('aria-modal', 'true');
  document.body.append(reader);

  function openStory(id) {
    const index = cache.chapters.findIndex(chapter => String(chapter.id) === String(id));
    const chapter = cache.chapters[index];
    if (!chapter) { closeStory(); return; }
    const items = mediaOf(chapter);
    const cover = coverOf(chapter);
    const rest = items.filter(item => item !== cover);
    const paragraphs = String(chapter.story || '').split(/\n+/).map(p => p.trim()).filter(Boolean).map(p => `<p>${esc(p)}</p>`).join('');
    const prev = cache.chapters[index + 1];
    const next = cache.chapters[index - 1];
    const hero = !cover ? '' : cover.type.startsWith('video/')
      ? `<div class="rnr-reader-hero"><video src="${cover.url}" controls playsinline></video></div>`
      : `<div class="rnr-reader-hero" style="background-image:url('${cover.url}')"></div>`;
    reader.setAttribute('aria-label', chapter.title || 'Story');
    reader.innerHTML = `
      <div class="rnr-reader-bar">
        <button type="button" class="rnr-reader-back" data-reader-close>← All stories</button>
      </div>
      <article class="rnr-reader-article">
        ${hero}
        <div class="rnr-reader-head">
          ${chapter.type ? `<span class="rnr-story-tag">${esc(chapter.type)}</span>` : ''}
          <h1>${esc(chapter.title || 'Untitled story')}</h1>
          <p class="rnr-story-meta">${[chapter.location, formatDate(chapter.date)].filter(Boolean).map(esc).join(' · ')}</p>
        </div>
        <div class="rnr-reader-text">${paragraphs || '<p>More of this story is coming soon.</p>'}</div>
        ${rest.length ? `<div class="rnr-reader-gallery">${rest.map(item => item.type.startsWith('video/')
          ? `<video src="${item.url}" controls playsinline preload="metadata"></video>`
          : `<img src="${item.url}" alt="${esc(chapter.title)}" loading="lazy">`).join('')}</div>` : ''}
        <nav class="rnr-reader-nav" aria-label="More stories">
          ${prev ? `<a href="#" data-story="${esc(prev.id)}"><small>Previous story</small>${esc(prev.title)}</a>` : '<span></span>'}
          ${next ? `<a href="#" data-story="${esc(next.id)}" class="is-next"><small>Next story</small>${esc(next.title)}</a>` : '<span></span>'}
        </nav>
      </article>`;
    reader.hidden = false;
    reader.scrollTop = 0;
    document.body.classList.add('rnr-reader-open');
    document.title = `${chapter.title || 'Story'} | Rasel On the Run`;
    reader.querySelector('[data-reader-close]').focus();
  }

  function closeStory() {
    if (reader.hidden) return;
    reader.querySelectorAll('video').forEach(video => video.pause());
    reader.hidden = true;
    reader.innerHTML = '';
    document.body.classList.remove('rnr-reader-open');
    window.RNR_PAGES?.refresh();
  }

  reader.addEventListener('click', event => {
    if (event.target.closest('[data-reader-close]')) { closeStory(); return; }
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !reader.hidden) closeStory(); });

  // Stories open in place (no per-story links). Tapping a card, previous/next
  // or a timeline chip opens the reader; changing page closes it.
  document.addEventListener('click', event => {
    const link = event.target.closest('[data-story]');
    if (!link) return;
    event.preventDefault();
    if (window.RNR_PAGES && window.RNR_PAGES.current() !== 'stories') window.RNR_PAGES.show('stories');
    openStory(link.dataset.story);
  });
  addEventListener('hashchange', () => closeStory());
  addEventListener('popstate', () => closeStory());
  window.RNR_STORIES = { all: () => cache.chapters.slice(), mediaOf: chapter => mediaOf(chapter), open: id => openStory(id) };

  // ---------- Refresh when chapters change ----------
  let timer = 0;
  async function refresh() {
    await load();
    render();
    window.RNR_PAGES?.refresh();
  }
  const schedule = () => { clearTimeout(timer); timer = setTimeout(refresh, 250); };
  const timeline = document.getElementById('ltdTimeline');
  if (timeline) new MutationObserver(schedule).observe(timeline, { childList: true });
  addEventListener('storage', event => { if (event.key === KEY) schedule(); });
  refresh();
})();

/* Rasel On the Run — Total Media Counter
   Read-only inventory across this browser's existing IndexedDB media stores. */
(() => {
  'use strict';
  const DB_FALLBACK = [
    'RaselOnTheRunPhotos',
    'RaselOnTheRunDesignAssets',
    'RaselOnTheRunAdventureMediaV1',
    'RaselOnTheRunAdvancedMediaV1',
    'RaselOnTheRunUltimateMediaV1',
    'RaselOnTheRunFinalJourneyMediaV1',
    'RaselOnTheRunLifetimeDocMediaV1',
    'RaselOnTheRunShortVideosV1'
  ];
  const STORE_HINTS = {
    RaselOnTheRunPhotos: ['photos'],
    RaselOnTheRunDesignAssets: ['assets'],
    RaselOnTheRunAdventureMediaV1: ['media'],
    RaselOnTheRunAdvancedMediaV1: ['media'],
    RaselOnTheRunUltimateMediaV1: ['assets'],
    RaselOnTheRunFinalJourneyMediaV1: ['assets'],
    RaselOnTheRunLifetimeDocMediaV1: ['media'],
    RaselOnTheRunShortVideosV1: ['clips']
  };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const bytesOf = record => {
    for (const value of [record?.blob, record?.file, record?.media, record?.asset]) {
      if (value instanceof Blob) return value.size;
    }
    return Number(record?.size) || 0;
  };
  const mediaKind = record => {
    const mime = [record?.blob?.type, record?.file?.type, record?.type, record?.mimeType, record?.mediaType].filter(Boolean).join(' ').toLowerCase();
    if (mime.includes('video')) return 'video';
    if (mime.includes('image')) return 'photo';
    if (record?.blob instanceof Blob && record.blob.type.startsWith('image/')) return 'photo';
    if (record?.file instanceof Blob && record.file.type.startsWith('image/')) return 'photo';
    return null;
  };
  function openExisting(name) {
    return new Promise((resolve, reject) => {
      let created = false;
      const request = indexedDB.open(name);
      request.onupgradeneeded = () => { created = true; request.transaction.abort(); };
      request.onsuccess = () => {
        if (created) { request.result.close(); reject(new Error('Database not found')); }
        else resolve(request.result);
      };
      request.onerror = () => reject(request.error || new Error('Could not open database'));
    });
  }
  async function databaseNames() {
    if (typeof indexedDB.databases === 'function') {
      const rows = await indexedDB.databases();
      return rows.map(row => row.name).filter(Boolean);
    }
    return DB_FALLBACK;
  }
  async function readStore(dbName, storeName) {
    const db = await openExisting(dbName);
    if (!db.objectStoreNames.contains(storeName)) { db.close(); return []; }
    return new Promise((resolve, reject) => {
      const request = db.transaction(storeName, 'readonly').objectStore(storeName).getAll();
      request.onsuccess = () => { db.close(); resolve(request.result || []); };
      request.onerror = () => { const error = request.error; db.close(); reject(error); };
    });
  }
  async function collect() {
    const names = await databaseNames();
    const summary = { photos: 0, videos: 0, bytes: 0, sources: [], errors: [] };
    for (const dbName of names) {
      const hints = STORE_HINTS[dbName];
      if (!hints) continue;
      for (const storeName of hints) {
        try {
          const rows = await readStore(dbName, storeName);
          let photos = 0, videos = 0, bytes = 0;
          rows.forEach(record => {
            const kind = mediaKind(record);
            if (!kind) return;
            if (kind === 'photo') photos++;
            else videos++;
            bytes += bytesOf(record);
          });
          if (photos || videos) {
            summary.photos += photos;
            summary.videos += videos;
            summary.bytes += bytes;
            summary.sources.push({ name: dbName.replace('RaselOnTheRun','').replace(/V1$/,''), photos, videos });
          }
        } catch (error) {
          if (!/not found/i.test(error.message || '')) summary.errors.push(`${dbName}: ${error.message}`);
        }
      }
    }
    return summary;
  }
  const formatBytes = bytes => {
    if (!bytes) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(1)} MB`;
  };
  function mount() {
    const memories = document.getElementById('memories');
    if (!memories || document.getElementById('mediaCountDashboard')) return;
    const section = document.createElement('section');
    section.id = 'mediaCountDashboard';
    section.className = 'media-count-dashboard';
    section.innerHTML = `
      <div class="mcd-head"><div><p class="eyebrow">YOUR COMPLETE COLLECTION</p><h3>My Media Library</h3><p>One combined count of the photos and videos saved across your travel sections on this device.</p></div><button type="button" id="mcdRefresh" class="primary-button">Refresh totals</button></div>
      <div class="mcd-stats" aria-live="polite">
        <article class="mcd-stat"><span>Total Photos</span><strong id="mcdPhotos">—</strong></article>
        <article class="mcd-stat"><span>Total Videos</span><strong id="mcdVideos">—</strong></article>
        <article class="mcd-stat"><span>Total Media</span><strong id="mcdTotal">—</strong></article>
        <article class="mcd-stat"><span>Approx. Storage</span><strong id="mcdStorage">—</strong></article>
      </div>
      <p id="mcdStatus" class="mcd-status">Counting your saved media…</p>
      <details class="mcd-details"><summary>View section breakdown</summary><div id="mcdSources" class="mcd-sources"></div></details>
      <p class="mcd-footnote">Counts include recognized image and video files in this browser's existing travel-media databases. Items stored only in cloud services or other devices are not included until synced here.</p>`;
    const gallery = document.getElementById('memoryGallery');
    const shortVideos = document.getElementById('shortVideoCollection');
    if (shortVideos) shortVideos.insertAdjacentElement('afterend', section);
    else if (gallery) gallery.insertAdjacentElement('afterend', section);
    else memories.append(section);

    let timer = null;
    async function refresh() {
      const status = document.getElementById('mcdStatus');
      status.textContent = 'Counting photos and videos…';
      try {
        const result = await collect();
        document.getElementById('mcdPhotos').textContent = result.photos.toLocaleString();
        document.getElementById('mcdVideos').textContent = result.videos.toLocaleString();
        document.getElementById('mcdTotal').textContent = (result.photos + result.videos).toLocaleString();
        document.getElementById('mcdStorage').textContent = formatBytes(result.bytes);
        document.getElementById('mcdSources').innerHTML = result.sources.length
          ? result.sources.map(source => `<div><span>${esc(source.name)}</span><strong>${source.photos.toLocaleString()} photos · ${source.videos.toLocaleString()} videos</strong></div>`).join('')
          : '<p>No uploaded photos or videos found yet.</p>';
        status.textContent = `Last updated ${new Date().toLocaleTimeString()}${result.errors.length ? ' · Some media stores could not be read.' : ''}`;
      } catch (error) {
        status.textContent = `Could not count media: ${error.message}`;
      }
    }
    const schedule = () => { clearTimeout(timer); timer = setTimeout(refresh, 450); };
    document.getElementById('mcdRefresh').addEventListener('click', refresh);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
    window.addEventListener('rasel-media-updated', schedule);
    // Observe IndexedDB writes from all existing upload/delete modules without changing their data.
    if (!window.__raselMediaCounterHooked && window.IDBObjectStore) {
      window.__raselMediaCounterHooked = true;
      ['put','add','delete','clear'].forEach(method => {
        const original = IDBObjectStore.prototype[method];
        if (typeof original !== 'function') return;
        IDBObjectStore.prototype[method] = function(...args) {
          const result = original.apply(this, args);
          window.dispatchEvent(new Event('rasel-media-updated'));
          return result;
        };
      });
    }
    refresh();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();

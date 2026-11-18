/* Rasel On the Run — Short Video Gallery
   Short clips are stored in this browser's IndexedDB. Upload/delete controls
   are visible only while the owner Admin mode is unlocked. */
(() => {
  'use strict';
  const DB_NAME = 'RaselOnTheRunShortVideosV1';
  const STORE = 'clips';
  const MAX_BYTES = 100 * 1024 * 1024;
  const MAX_SECONDS = 60;
  let urls = [];

  function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE)) {
          request.result.createObjectStore(STORE, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function transact(mode, action) {
    return openDB().then(db => new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const store = tx.objectStore(STORE);
      let request;
      try { request = action(store); }
      catch (error) { db.close(); reject(error); return; }
      tx.oncomplete = () => { db.close(); resolve(request?.result); };
      tx.onerror = tx.onabort = () => { const error = tx.error; db.close(); reject(error); };
    }));
  }

  const allClips = () => transact('readonly', store => store.getAll());
  const saveClip = clip => transact('readwrite', store => store.put(clip));
  const deleteClip = id => transact('readwrite', store => store.delete(id));

  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
    })[char]);
  }

  function getDuration(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        const duration = video.duration;
        URL.revokeObjectURL(url);
        resolve(duration);
      };
      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('This video format could not be read by your browser.'));
      };
      video.src = url;
    });
  }

  function mount() {
    const memories = document.getElementById('memories');
    if (!memories || document.getElementById('shortVideoCollection')) return;
    const section = document.createElement('div');
    section.id = 'shortVideoCollection';
    section.className = 'short-video-collection';
    section.innerHTML = `
      <div class="short-video-heading">
        <div>
          <p class="eyebrow">MOVING MEMORIES</p>
          <h3>My Short Videos</h3>
          <p>Keep your favourite travel moments in short video clips.</p>
        </div>
        <div class="short-video-owner-actions">
          <button type="button" class="primary-button" id="addShortVideoButton">Add Short Video</button>
          <input type="file" id="shortVideoInput" accept="video/*" multiple hidden>
        </div>
      </div>
      <p class="short-video-note">Clips up to 60 seconds · Maximum 100 MB each · Saved on this device</p>
      <div id="shortVideoGrid" class="short-video-grid">
        <div class="empty-state"><h3>Your video memories belong here</h3><p>Unlock Admin to add your first short travel video.</p></div>
      </div>`;
    const gallery = document.getElementById('memoryGallery');
    if (gallery) gallery.insertAdjacentElement('afterend', section);
    else memories.append(section);

    document.getElementById('addShortVideoButton').addEventListener('click', () => {
      if (!document.body.classList.contains('admin-mode')) {
        alert('Unlock Admin to add videos.');
        return;
      }
      document.getElementById('shortVideoInput').click();
    });
    document.getElementById('shortVideoInput').addEventListener('change', handleFiles);
    document.addEventListener('click', async event => {
      const button = event.target.closest('[data-delete-short-video]');
      if (!button || !document.body.classList.contains('admin-mode')) return;
      if (!confirm('Delete this short video?')) return;
      try {
        await deleteClip(button.dataset.deleteShortVideo);
        await render();
      } catch (error) {
        alert('Could not delete this video: ' + error.message);
      }
    });
    render();
    observeAdminMode();
  }

  async function handleFiles(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    for (const file of files) {
      if (!file.type.startsWith('video/')) {
        alert(`${file.name}: Please choose a video file.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        alert(`${file.name}: Maximum video size is 100 MB.`);
        continue;
      }
      try {
        const duration = await getDuration(file);
        if (!Number.isFinite(duration) || duration <= 0 || duration > MAX_SECONDS) {
          alert(`${file.name}: Short videos must be 60 seconds or less.`);
          continue;
        }
        const title = prompt('Enter a title for this video:', file.name.replace(/\.[^.]+$/, ''));
        if (title === null) continue;
        const caption = prompt('Add a short memory or location (optional):', '') || '';
        await saveClip({
          id: (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`),
          title: title.trim() || 'Travel moment',
          caption: caption.trim(),
          name: file.name,
          type: file.type,
          size: file.size,
          duration,
          blob: file,
          createdAt: new Date().toISOString()
        });
      } catch (error) {
        alert(`${file.name}: ${error.message}`);
      }
    }
    await render();
  }

  async function render() {
    const grid = document.getElementById('shortVideoGrid');
    if (!grid) return;
    urls.forEach(URL.revokeObjectURL);
    urls = [];
    try {
      const clips = await allClips();
      clips.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
      if (!clips.length) {
        grid.innerHTML = `<div class="empty-state"><h3>Your video memories belong here</h3><p>Unlock Admin to add your first short travel video.</p></div>`;
        return;
      }
      grid.innerHTML = clips.map(clip => {
        const url = URL.createObjectURL(clip.blob);
        urls.push(url);
        return `<article class="short-video-card">
          <video controls playsinline preload="metadata" src="${url}" aria-label="${escapeHTML(clip.title)}"></video>
          <div class="short-video-card-copy">
            <h4>${escapeHTML(clip.title)}</h4>
            ${clip.caption ? `<p>${escapeHTML(clip.caption)}</p>` : ''}
            <span>${Math.round(clip.duration)} sec</span>
            <button type="button" class="short-video-delete" data-delete-short-video="${escapeHTML(clip.id)}">Delete</button>
          </div>
        </article>`;
      }).join('');
    } catch (error) {
      grid.innerHTML = `<div class="empty-state"><h3>Video gallery unavailable</h3><p>${escapeHTML(error.message)}</p></div>`;
    }
  }

  function observeAdminMode() {
    const button = document.getElementById('addShortVideoButton');
    const sync = () => {
      const unlocked = document.body.classList.contains('admin-mode');
      if (button) button.hidden = !unlocked;
      document.querySelectorAll('.short-video-delete').forEach(el => el.hidden = !unlocked);
    };
    new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    sync();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();

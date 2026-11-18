/* =====================================================================
   RASEL ON THE RUN — PLACE PHOTO GALLERIES
   - City page: your photos in a framed, justified gallery (like a photo
     book). Works smoothly with hundreds of photos: photos load as you scroll.
   - Division / province / state page: "Photos from <area>" (all photos of
     its cities + photos added to the area itself).
   - Country page: "Photos from <country>".
   - Only the photo is shown in the gallery. Tap a photo to see it large with
     its date, place and caption underneath.
   - Owner (Admin mode): add photos at every level, edit date & caption,
     use a photo as the card cover, delete a photo.
   - Uploading: photos are resized, and the date the photo was TAKEN is read
     from the camera information before resizing.
   ===================================================================== */
(() => {
  'use strict';
  if (typeof renderCountries !== 'function' || typeof openPhotoDB !== 'function') return;
  const list = document.getElementById('countryList');
  const PAGE = 60;
  const isAdmin = () => document.body.classList.contains('admin-mode');
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const isFileName = t => /\.(jpe?g|png|heic|heif|webp|gif|avif)$/i.test(String(t || '').trim()) || /^(img|dsc|pxl|photo|image)[\s_-]?\d/i.test(String(t || '').trim());
  const bnLang = () => document.documentElement.lang === 'bn';

  // ---------------------------------------------------------------
  // Storage helpers (existing "RaselOnTheRunPhotos" database)
  // ---------------------------------------------------------------
  async function allPhotos() {
    const db = await openPhotoDB();
    return new Promise((resolve, reject) => {
      const r = db.transaction('photos', 'readonly').objectStore('photos').getAll();
      r.onsuccess = () => { db.close(); resolve(r.result || []); };
      r.onerror = () => { db.close(); reject(r.error); };
    });
  }
  async function putPhoto(record) {
    const db = await openPhotoDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('photos', 'readwrite');
      tx.objectStore('photos').put(record);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  }
  async function getPhoto(id) {
    const db = await openPhotoDB();
    return new Promise((resolve, reject) => {
      const r = db.transaction('photos', 'readonly').objectStore('photos').get(id);
      r.onsuccess = () => { db.close(); resolve(r.result || null); };
      r.onerror = () => { db.close(); reject(r.error); };
    });
  }

  // ---------------------------------------------------------------
  // Camera date (EXIF DateTimeOriginal) from JPEG files
  // ---------------------------------------------------------------
  async function exifDate(blob) {
    try {
      if (!blob || !/jpe?g/i.test(blob.type || '')) return null;
      const view = new DataView(await blob.slice(0, 256 * 1024).arrayBuffer());
      if (view.getUint16(0) !== 0xFFD8) return null;
      let offset = 2;
      while (offset + 4 < view.byteLength) {
        const marker = view.getUint16(offset);
        const size = view.getUint16(offset + 2);
        if (marker === 0xFFE1 && view.getUint32(offset + 4) === 0x45786966) {
          const tiff = offset + 10;
          const little = view.getUint16(tiff) === 0x4949;
          const u16 = o => view.getUint16(o, little), u32 = o => view.getUint32(o, little);
          const readAscii = (o, n) => { let s = ''; for (let i = 0; i < n - 1 && o + i < view.byteLength; i += 1) s += String.fromCharCode(view.getUint8(o + i)); return s; };
          const scan = (ifd, wanted) => {
            const count = u16(ifd);
            for (let i = 0; i < count; i += 1) {
              const e = ifd + 2 + i * 12;
              const tag = u16(e);
              if (wanted.includes(tag)) return { tag, type: u16(e + 2), n: u32(e + 4), value: u32(e + 8), entry: e };
            }
            return null;
          };
          const ifd0 = tiff + u32(tiff + 4);
          const exifPtr = scan(ifd0, [0x8769]);
          let found = exifPtr ? scan(tiff + exifPtr.value, [0x9003, 0x9004]) : null;
          if (!found) found = scan(ifd0, [0x0132]);
          if (!found) return null;
          const text = readAscii(tiff + found.value, found.n);
          const m = text.match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
          if (!m || m[1] === '0000') return null;
          const date = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
          return Number.isNaN(date.getTime()) ? null : date;
        }
        if ((marker & 0xFF00) !== 0xFF00 || size < 2) break;
        offset += 2 + size;
      }
    } catch { /* not a readable EXIF block */ }
    return null;
  }
  async function dimensions(blob) {
    try { const b = await createImageBitmap(blob); const d = { width: b.width, height: b.height }; b.close?.(); return d; }
    catch { return null; }
  }

  // ---------------------------------------------------------------
  // Upload (used everywhere: city, division/state, country)
  // ---------------------------------------------------------------
  const progress = document.createElement('div');
  progress.className = 'rnr-upload-progress';
  progress.hidden = true;
  progress.innerHTML = '<div><strong>Adding photos…</strong><span></span><i><b></b></i></div>';
  document.body.append(progress);
  const setProgress = (done, total) => {
    progress.hidden = false;
    progress.querySelector('span').textContent = `${done} of ${total}`;
    progress.querySelector('b').style.width = `${Math.round((done / Math.max(total, 1)) * 100)}%`;
  };

  async function addPhotos(files, place) {
    const images = files.filter(f => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name));
    if (!images.length) return 0;
    let saved = 0;
    setProgress(0, images.length);
    for (const file of images) {
      try {
        const taken = await exifDate(file);
        const small = typeof window.RNR_SHRINK === 'function' ? await window.RNR_SHRINK(file).catch(() => file) : file;
        const dims = await dimensions(small);
        await savePhoto({
          id: createId(),
          countryId: place.countryId || null,
          regionId: place.regionId || null,
          cityId: place.cityId || null,
          name: file.name,
          type: small.type || file.type,
          blob: small,
          collection: place.general ? 'general' : 'city',
          showInMemories: Boolean(place.general),
          uploadedAt: new Date().toISOString(),
          takenAt: taken ? taken.toISOString() : null,
          fileDate: file.lastModified ? new Date(file.lastModified).toISOString() : null,
          width: dims?.width || null,
          height: dims?.height || null
        });
        saved += 1;
      } catch (error) {
        console.error('Photo upload error:', error);
        if (/quota/i.test(String(error?.name || error))) { alert('Browser storage is full. Some photos were not saved.'); break; }
      }
      setProgress(saved, images.length);
    }
    setTimeout(() => { progress.hidden = true; }, 600);
    return saved;
  }
  function pickPhotos(place) {
    const picker = document.createElement('input');
    picker.type = 'file';
    picker.accept = 'image/*';
    picker.multiple = true;
    picker.addEventListener('change', async () => {
      const count = await addPhotos([...(picker.files || [])], place);
      if (count) toast(`${count} photo${count === 1 ? '' : 's'} added.`);
      window.dispatchEvent(new CustomEvent('rnr:photos-changed'));
      if (place.general) renderMemories(); else refresh();
    });
    picker.click();
  }
  // The existing "Upload photos" buttons on city pages call choosePhotos().
  window.choosePhotos = (countryId, regionId, cityId) => pickPhotos({ countryId, regionId, cityId });
  try { choosePhotos = window.choosePhotos; } catch {}

  function toast(text) {
    const t = document.createElement('div');
    t.className = 'rnr-toast';
    t.innerHTML = '<span></span>';
    t.querySelector('span').textContent = text;
    document.body.append(t);
    setTimeout(() => t.classList.add('is-in'), 20);
    setTimeout(() => { t.classList.remove('is-in'); setTimeout(() => t.remove(), 400); }, 3500);
  }

  // ---------------------------------------------------------------
  // Place names for the info line
  // ---------------------------------------------------------------
  function placeLine(photo) {
    const country = travelData.find(c => c.id === photo.countryId);
    const region = country?.regions?.find(r => r.id === photo.regionId);
    const city = region?.cities?.find(c => c.id === photo.cityId);
    return [city?.name, region?.name, country?.name].filter(Boolean).join(', ');
  }
  function dateOf(photo) {
    if (photo.travelDate) return { date: new Date(`${photo.travelDate}T12:00:00`), exact: false, source: 'set' };
    if (photo.takenAt) return { date: new Date(photo.takenAt), exact: true, source: 'camera' };
    return null;
  }
  const formatDate = (d, withTime) => d.toLocaleDateString(bnLang() ? 'bn-BD' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    + (withTime ? ` · ${d.toLocaleTimeString(bnLang() ? 'bn-BD' : 'en-US', { hour: 'numeric', minute: '2-digit' })}` : '');
  // Photos without a known date go to the end.
  const sortTime = p => (p.travelDate || p.takenAt ? new Date(p.travelDate || p.takenAt).getTime() : null);
  const byNewest = (a, b) => { const x = sortTime(a), y = sortTime(b); if (x === null && y === null) return String(b.uploadedAt || '').localeCompare(String(a.uploadedAt || '')); if (x === null) return 1; if (y === null) return -1; return y - x; };
  const byOldest = (a, b) => { const x = sortTime(a), y = sortTime(b); if (x === null && y === null) return String(a.uploadedAt || '').localeCompare(String(b.uploadedAt || '')); if (x === null) return 1; if (y === null) return -1; return x - y; };

  // ---------------------------------------------------------------
  // Gallery
  // ---------------------------------------------------------------
  const urls = new Map();
  const urlFor = photo => { if (!urls.has(photo.id) && photo.blob) urls.set(photo.id, URL.createObjectURL(photo.blob)); return urls.get(photo.id); };
  // Each gallery reports which photos it shows; other object URLs are released.
  const live = { archive: new Set(), memories: new Set() };
  const releaseUnused = () => { urls.forEach((u, id) => { if (!live.archive.has(id) && !live.memories.has(id)) { URL.revokeObjectURL(u); urls.delete(id); } }); };

  const lazy = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      lazy.unobserve(entry.target);
      const fig = entry.target;
      const photo = fig.__photo;
      const img = fig.querySelector('img');
      if (!photo || !img) return;
      img.onload = () => {
        fig.classList.add('is-loaded');
        // Learn the shape of older photos so the rows fit perfectly next time.
        if (!photo.width && img.naturalWidth) {
          photo.width = img.naturalWidth; photo.height = img.naturalHeight;
          fig.style.setProperty('--r', (img.naturalWidth / img.naturalHeight).toFixed(3));
          getPhoto(photo.id).then(rec => { if (rec && !rec.width) { rec.width = photo.width; rec.height = photo.height; return putPhoto(rec); } }).catch(() => {});
        }
      };
      img.src = urlFor(photo);
    });
  }, { rootMargin: '600px 0px' }) : null;

  function figure(photo, i) {
    const fig = document.createElement('figure');
    fig.className = 'rnr-gallery-item';
    const ratio = photo.width && photo.height ? Math.min(3, Math.max(0.4, photo.width / photo.height)) : 1.33;
    fig.style.setProperty('--r', ratio.toFixed(3));
    fig.dataset.index = String(i);
    fig.innerHTML = '<button type="button" class="rnr-gallery-open"><img alt="" decoding="async" data-no-archive-watermark></button>';
    const alt = photo.caption && !isFileName(photo.caption) ? photo.caption : `Photo from ${placeLine(photo) || 'my travels'}`;
    fig.querySelector('img').alt = alt;
    fig.querySelector('.rnr-gallery-open').setAttribute('aria-label', `Open photo ${i + 1}`);
    fig.__photo = photo;
    if (lazy) lazy.observe(fig); else fig.querySelector('img').src = urlFor(photo);
    return fig;
  }

  let current = null; // state of the gallery being rendered
  function viewerItem(photo, state) {
    const item = {
      id: photo.id,
      caption: photo.caption && !isFileName(photo.caption) ? photo.caption : '',
      alt: photo.caption || '',
      load: async () => urlFor(photo),
      meta: [],
      actions: [
        { label: photo.highlight ? '★ Remove from Best shots' : '☆ Add to Best shots', ownerOnly: true, run: (it, ctl) => toggleHighlight(photo, it, ctl) },
        { label: 'Edit date & caption', ownerOnly: true, run: (it, ctl) => editDetails(photo, ctl) },
        { label: 'Use as card cover', ownerOnly: true, run: () => useAsCover(photo, state) },
        { label: 'Delete photo', ownerOnly: true, danger: true, run: (it, ctl) => removePhoto(photo, ctl, state) }
      ],
      details: async () => {
        // Older photos: read the camera date once and remember it.
        if (!photo.takenAt && !photo.travelDate && photo.blob) {
          const taken = await exifDate(photo.blob);
          if (taken) {
            photo.takenAt = taken.toISOString();
            getPhoto(photo.id).then(rec => { if (rec) { rec.takenAt = photo.takenAt; return putPhoto(rec); } }).catch(() => {});
          }
        }
        return { meta: metaFor(photo), caption: photo.caption && !isFileName(photo.caption) ? photo.caption : '' };
      }
    };
    item.meta = metaFor(photo);
    return item;
  }
  function metaFor(photo) {
    const d = dateOf(photo);
    const place = placeLine(photo);
    const meta = [];
    if (d) meta.push({ icon: 'date', text: formatDate(d.date, d.exact) });
    else if (photo.uploadedAt) meta.push({ icon: 'date', text: `${bnLang() ? 'যোগ করা হয়েছে' : 'Added'} ${new Date(photo.uploadedAt).toLocaleDateString(bnLang() ? 'bn-BD' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}` });
    if (place) meta.push({ icon: 'place', text: place });
    if (photo.story) meta.push({ icon: 'note', text: photo.story });
    return meta;
  }

  async function editDetails(photo, ctl) {
    const d = dateOf(photo);
    const currentDate = d ? d.date.toISOString().slice(0, 10) : '';
    const date = prompt('Date this photo was taken (YYYY-MM-DD). Leave empty to remove:', photo.travelDate || currentDate);
    if (date === null) return;
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) { alert('Please use the format YYYY-MM-DD, for example 2024-03-15.'); return; }
    const caption = prompt('Caption (optional):', photo.caption && !isFileName(photo.caption) ? photo.caption : '');
    if (caption === null) return;
    const rec = await getPhoto(photo.id);
    if (!rec) return;
    rec.travelDate = date.trim() || undefined;
    if (!date.trim()) { delete rec.travelDate; }
    rec.caption = caption.trim() || undefined;
    if (!caption.trim()) delete rec.caption;
    await putPhoto(rec);
    Object.assign(photo, { travelDate: rec.travelDate, caption: rec.caption });
    if (!rec.travelDate) delete photo.travelDate;
    ctl.refresh();
  }
  async function toggleHighlight(photo, item, ctl) {
    const rec = await getPhoto(photo.id);
    if (!rec) return;
    rec.highlight = !rec.highlight;
    if (!rec.highlight) delete rec.highlight;
    await putPhoto(rec);
    photo.highlight = rec.highlight;
    item.actions[0].label = photo.highlight ? '★ Remove from Best shots' : '☆ Add to Best shots';
    toast(photo.highlight ? 'Added to Best shots on the home page.' : 'Removed from Best shots.');
    ctl.refresh();
    window.dispatchEvent(new CustomEvent('rnr:photos-changed'));
  }
  async function useAsCover(photo, state) {
    const entity = state.place.cityId ? archiveDesignFindEntity('city', state.place.cityId)
      : state.place.regionId ? archiveDesignFindEntity('province', state.place.regionId)
      : travelData.find(c => c.id === state.place.countryId);
    if (state.place.general && typeof archiveDesignSavePhoto === 'function') {
      if (!confirm('Use this photo as the homepage cover?')) return;
      const old = localStorage.getItem('raselOnTheRunHeroCoverV1');
      const id = await archiveDesignSavePhoto(new File([photo.blob], photo.name || 'cover.jpg', { type: photo.blob.type || 'image/jpeg' }));
      localStorage.setItem('raselOnTheRunHeroCoverV1', id);
      if (old) archiveDesignDeletePhoto(old).catch(() => {});
      toast('Homepage cover updated. It shows after the page reloads.');
      return;
    }
    if (!entity || typeof archiveDesignSavePhoto !== 'function') return;
    const old = entity.backgroundAssetId;
    entity.backgroundAssetId = await archiveDesignSavePhoto(new File([photo.blob], photo.name || 'cover.jpg', { type: photo.blob.type || 'image/jpeg' }));
    if (saveData() && old) archiveDesignDeletePhoto(old).catch(() => {});
    toast(`Cover photo updated for ${entity.name}.`);
  }
  async function removePhoto(photo, ctl, state) {
    if (!confirm('Delete this photo from your archive? This cannot be undone.')) return;
    await deleteCityPhoto(photo.id);
    ctl.remove();
    window.dispatchEvent(new CustomEvent('rnr:photos-changed'));
    if (state.place.general) renderMemories(); else refresh();
  }

  function renderInto(host, photos, place, title, opts = {}) {
    const sorted = opts.keepOrder ? photos.slice() : photos.slice().sort(byNewest);
    const current = { host, photos: sorted, shown: 0, place, title };
    host.innerHTML = '';
    host.classList.remove('memory-grid');
    host.classList.add('rnr-gallery-wrap');
    host.setAttribute('data-no-archive-watermark', '');
    const head = document.createElement('div');
    head.className = 'rnr-gallery-head';
    head.innerHTML = `
      <div><p class="eyebrow">PHOTO GALLERY</p><h3></h3><p class="rnr-gallery-count"></p></div>
      <div class="rnr-gallery-tools">
        <select class="rnr-gallery-sort" aria-label="Sort photos"><option value="new">Newest first</option><option value="old">Oldest first</option></select>
        <button type="button" class="rnr-gallery-add">+ Add photos</button>
      </div>`;
    head.querySelector('h3').textContent = title;
    if (!title) { head.querySelector('.eyebrow').remove(); head.querySelector('h3').remove(); }
    head.querySelector('.rnr-gallery-count').textContent = sorted.length
      ? `${sorted.length} photo${sorted.length === 1 ? '' : 's'}`
      : (isAdmin() ? 'No photos yet. Add your first photos.' : 'Photos from this place are coming soon.');
    head.querySelector('.rnr-gallery-add').addEventListener('click', () => pickPhotos(place));
    head.querySelector('.rnr-gallery-sort').addEventListener('change', e => {
      current.photos.sort(e.target.value === 'old' ? byOldest : byNewest);
      grid.innerHTML = ''; current.shown = 0; more();
    });
    const grid = document.createElement('div');
    grid.className = 'rnr-gallery';
    const sentinel = document.createElement('div');
    sentinel.className = 'rnr-gallery-more';
    sentinel.innerHTML = '<button type="button">Show more photos</button>';
    if (opts.plain) head.remove();
    host.append(...(opts.plain ? [grid, sentinel] : [head, grid, sentinel]));
    host.classList.toggle('is-empty', !sorted.length);

    function more() {
      const next = current.photos.slice(current.shown, current.shown + PAGE);
      next.forEach((p, i) => grid.append(figure(p, current.shown + i)));
      current.shown += next.length;
      sentinel.hidden = current.shown >= current.photos.length;
      // Keep the last row from stretching.
      grid.querySelector('.rnr-gallery-filler')?.remove();
      const filler = document.createElement('span'); filler.className = 'rnr-gallery-filler'; grid.append(filler);
    }
    sentinel.querySelector('button').addEventListener('click', more);
    if ('IntersectionObserver' in window) {
      const auto = new IntersectionObserver(entries => { if (entries[0].isIntersecting && !sentinel.hidden) more(); }, { rootMargin: '800px 0px' });
      auto.observe(sentinel);
    }
    grid.addEventListener('click', event => {
      const fig = event.target.closest('.rnr-gallery-item');
      if (!fig || !window.RNR_VIEWER) return;
      const state = current;
      window.RNR_VIEWER.open(state.photos.map(p => viewerItem(p, state)), Number(fig.dataset.index));
    });
    more();
  }

  // ---------------------------------------------------------------
  // Where galleries appear
  // ---------------------------------------------------------------
  let busy = 0;
  async function refresh() {
    if (!list) return;
    const mine = ++busy;
    const level = typeof archiveLevel === 'string' ? archiveLevel : '';
    let host = null, place = null, title = '';
    if (level === 'photos') {
      host = document.getElementById('selectedCityGallery');
      const city = typeof findCity === 'function' ? findCity(selectedCountryId, selectedRegionId, selectedCityId) : null;
      place = { countryId: selectedCountryId, regionId: selectedRegionId, cityId: selectedCityId };
      title = city ? `${city.name}` : 'Photos';
    } else if (level === 'regions' || level === 'cities') {
      const country = findCountry(selectedCountryId);
      const region = level === 'cities' ? findRegion(selectedCountryId, selectedRegionId) : null;
      place = { countryId: selectedCountryId, regionId: region ? selectedRegionId : null, cityId: null };
      title = `Photos from ${region ? region.name : country?.name || ''}`;
      host = list.querySelector('.rnr-area-gallery');
      if (!host) { host = document.createElement('div'); host.className = 'rnr-area-gallery'; list.append(host); }
    } else { live.archive = new Set(); releaseUnused(); return; }
    if (!host) return;
    let photos = [];
    try { photos = await allPhotos(); } catch (error) { console.error(error); }
    if (mine !== busy) return;
    photos = photos.filter(p => p.blob && (
      place.cityId ? p.cityId === place.cityId
        : place.regionId ? p.regionId === place.regionId
        : p.countryId === place.countryId));
    live.archive = new Set(photos.map(p => p.id)); releaseUnused();
    if (level !== 'photos' && !photos.length && !isAdmin()) { host.remove(); return; }
    renderInto(host, photos, place, title);
    window.RNR_LANG && document.dispatchEvent(new Event('rnr:content'));
  }
  // ---------------------------------------------------------------
  // "My Travel Memories" (photos not tied to a city) uses the same gallery.
  // ---------------------------------------------------------------
  let memBusy = 0;
  async function renderMemories() {
    const host = document.getElementById('memoryGallery');
    if (!host) return;
    const mine = ++memBusy;
    let photos = [];
    try { photos = await allPhotos(); } catch (error) { console.error(error); }
    if (mine !== memBusy) return;
    photos = photos.filter(p => p.blob && !p.cityId && p.collection !== 'city');
    live.memories = new Set(photos.map(p => p.id)); releaseUnused();
    renderInto(host, photos, { general: true }, '');
  }
  window.renderGallery = renderMemories;
  try { renderGallery = renderMemories; } catch {}
  document.addEventListener('click', event => {
    const b = event.target.closest('#uploadNavButton, #heroUploadButton, #uploadMemoryButton');
    if (!b) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (!isAdmin()) return;
    pickPhotos({ general: true });
  }, true);

  // The site calls this after uploads on a city page.
  window.renderSelectedCityPhotos = async () => refresh();
  try { renderSelectedCityPhotos = window.renderSelectedCityPhotos; } catch {}

  const previousRender = renderCountries;
  renderCountries = function (...args) {
    const result = previousRender.apply(this, args);
    refresh();
    return result;
  };
  // Re-draw when Admin mode is switched on/off (owner buttons appear/disappear).
  let lastAdmin = isAdmin();
  new MutationObserver(() => { if (isAdmin() !== lastAdmin) { lastAdmin = isAdmin(); refresh(); } }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  window.RNR_GALLERY = { refresh, addPhotos, exifDate, renderMemories, renderInto, allPhotos, viewerItem, dateOf, placeLine, sortTime, byNewest };
  renderMemories();
})();

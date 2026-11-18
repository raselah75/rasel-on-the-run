/* Country showcase: famous-landmark photo cards, a proper photo editor for every
   country / area / city card, and an owner-editable homepage cover photo.
   Uploaded photos stay in the existing RaselOnTheRunDesignAssets IndexedDB store
   and always take priority over the default landmark photographs. */
(() => {
  'use strict';
  if (typeof renderCountries !== 'function' || typeof travelData === 'undefined') return;

  // Country -> [Wikipedia article used for the default photo, caption shown on the card]
  const LANDMARKS = {
    'Bangladesh': ['Ahsan Manzil', 'Ahsan Manzil, Dhaka'],
    'Canada': ['Moraine Lake', 'Moraine Lake, Alberta'],
    'Maldives': ['Malé', 'Malé, Maldives'],
    'Nepal': ['Mount Everest', 'Mount Everest'],
    'India': ['Taj Mahal', 'Taj Mahal, Agra'],
    'France': ['Eiffel Tower', 'Eiffel Tower, Paris'],
    'Spain': ['Sagrada Família', 'Sagrada Família, Barcelona'],
    'United States': ['Statue of Liberty', 'Statue of Liberty, New York'],
    'Türkiye': ['Hagia Sophia', 'Hagia Sophia, Istanbul'],
    'Italy': ['Colosseum', 'Colosseum, Rome'],
    'Mexico': ['Chichen Itza', 'Chichén Itzá, Yucatán'],
    'United Kingdom': ['Big Ben', 'Big Ben, London'],
    'Germany': ['Neuschwanstein Castle', 'Neuschwanstein Castle, Bavaria'],
    'Japan': ['Mount Fuji', 'Mount Fuji'],
    'Greece': ['Parthenon', 'Parthenon, Athens'],
    'Thailand': ['Wat Arun', 'Wat Arun, Bangkok'],
    'Austria': ['Hallstatt', 'Hallstatt'],
    'Saudi Arabia': ["Hegra (Mada'in Salih)", 'Hegra, AlUla'],
    'Portugal': ['Belém Tower', 'Belém Tower, Lisbon'],
    'Malaysia': ['Petronas Towers', 'Petronas Towers, Kuala Lumpur'],
    'Netherlands': ['Kinderdijk', 'Windmills of Kinderdijk'],
    'Poland': ['Wawel Castle', 'Wawel Castle, Kraków'],
    'Vietnam': ['Ha Long Bay', 'Ha Long Bay'],
    'Morocco': ['Chefchaouen', 'Chefchaouen'],
    'South Korea': ['Gyeongbokgung', 'Gyeongbokgung Palace, Seoul'],
    'Egypt': ['Giza pyramid complex', 'Pyramids of Giza'],
    'Hungary': ['Hungarian Parliament Building', 'Parliament, Budapest'],
    'Singapore': ['Marina Bay Sands', 'Marina Bay Sands'],
    'Albania': ['Berat', 'Berat'],
    'Tunisia': ['Sidi Bou Said', 'Sidi Bou Said'],
    'Uzbekistan': ['Registan', 'Registan, Samarkand'],
    'South Africa': ['Table Mountain', 'Table Mountain, Cape Town'],
    'Sweden': ['Gamla stan', 'Gamla stan, Stockholm'],
    'Bulgaria': ['Rila Monastery', 'Rila Monastery'],
    'Dominican Republic': ['Punta Cana', 'Punta Cana'],
    'Australia': ['Sydney Opera House', 'Sydney Opera House'],
    'Iran': ['Naqsh-e Jahan Square', 'Naqsh-e Jahan Square, Isfahan'],
    'Brazil': ['Christ the Redeemer (statue)', 'Christ the Redeemer, Rio'],
    'Colombia': ['Cartagena, Colombia', 'Cartagena'],
    'Cambodia': ['Angkor Wat', 'Angkor Wat'],
    'Argentina': ['Iguazu Falls', 'Iguazú Falls'],
    'Ireland': ['Cliffs of Moher', 'Cliffs of Moher'],
    'Bahrain': ["Qal'at al-Bahrain", 'Bahrain Fort'],
    'Philippines': ['Chocolate Hills', 'Chocolate Hills, Bohol'],
    'Chile': ['Torres del Paine National Park', 'Torres del Paine'],
    'Jordan': ['Petra', 'Petra'],
    'Georgia': ['Gergeti Trinity Church', 'Gergeti Trinity Church'],
    'Qatar': ['Museum of Islamic Art, Doha', 'Museum of Islamic Art, Doha'],
    'Andorra': ['Andorra la Vella', 'Andorra la Vella'],
    'Sri Lanka': ['Sigiriya', 'Sigiriya Rock']
  };

  const CACHE_KEY = 'raselOnTheRunLandmarkPhotosV2';
  const HERO_KEY = 'raselOnTheRunHeroCoverV1';
  const RETRY_MS = 3 * 24 * 60 * 60 * 1000;
  const list = document.getElementById('countryList');
  let objectURLs = [];
  let heroURL = null;
  let heroType = '';
  let pending = null;

  const norm = value => (typeof cleanName === 'function' ? cleanName(value) : String(value).toLowerCase().trim());
  const landmarkFor = name => {
    const key = Object.keys(LANDMARKS).find(item => norm(item) === norm(name));
    return key ? LANDMARKS[key] : null;
  };
  const readCache = () => { try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') || {}; } catch { return {}; } };
  const writeCache = value => { try { localStorage.setItem(CACHE_KEY, JSON.stringify(value)); } catch {} };
  const esc = value => (typeof escapeHTML === 'function' ? escapeHTML(value) : String(value));
  const cssURL = url => `url("${String(url).replace(/["\\\n]/g, encodeURIComponent)}")`;
  const hash = value => { let h = 2166136261; for (const ch of String(value)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const fallbackPhoto = (place, country) => `https://loremflickr.com/900/1100/${encodeURIComponent(place)},${encodeURIComponent(country || 'travel')}?lock=${hash(place + country) % 100000}`;

  // Look up landmark photographs from Wikipedia (one request for up to 20 places).
  async function fetchLandmarkPhotos(titles) {
    const cache = readCache();
    const now = Date.now();
    const wanted = titles.filter(title => !cache[title] || (!cache[title].url && now - cache[title].at > RETRY_MS));
    if (!wanted.length || !navigator.onLine) return cache;
    for (let i = 0; i < wanted.length; i += 20) {
      const chunk = wanted.slice(i, i + 20);
      const params = new URLSearchParams({ action: 'query', format: 'json', prop: 'pageimages', piprop: 'thumbnail', pithumbsize: '1100', pilimit: '50', redirects: '1', origin: '*', titles: chunk.join('|') });
      try {
        const response = await fetch(`https://en.wikipedia.org/w/api.php?${params}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const alias = new Map();
        for (const step of [...(data.query?.normalized || []), ...(data.query?.redirects || [])]) alias.set(step.to, step.from);
        const original = title => { let current = title; for (let guard = 0; guard < 4 && alias.has(current); guard += 1) current = alias.get(current); return current; };
        for (const page of Object.values(data.query?.pages || {})) {
          const key = original(page.title);
          cache[key] = { url: page.thumbnail?.source || '', at: now };
        }
        chunk.forEach(title => { if (!cache[title]) cache[title] = { url: '', at: now }; });
      } catch (error) {
        console.warn('Landmark photo lookup unavailable:', error.message);
        break;
      }
    }
    writeCache(cache);
    return cache;
  }

  // ---------- Photos for divisions / provinces / states and cities ----------
  // Looked up on Wikipedia when a card scrolls into view; flags, maps and seals are skipped.
  const BAD_IMAGE = /flag|coat[_ %-]?of[_ %-]?arms|seal_of|emblem|logo|locator|location_map|_map[_.]|map_of|\.svg|banner|signature|icon|blank|montage_template/i;
  const goodImage = url => Boolean(url) && !BAD_IMAGE.test(decodeURIComponent(url));
  const DIVISION_STYLE = { Bangladesh: name => `${name} Division` };
  function placeQuery(type, name, regionName, countryName) {
    const titles = [];
    if (type === 'province') {
      if (DIVISION_STYLE[countryName]) titles.push(DIVISION_STYLE[countryName](name));
      titles.push(`${name}, ${countryName}`, name);
    } else {
      if (countryName === 'Bangladesh') titles.push(name, `${name} District`, `${name}, Bangladesh`);
      else if (regionName) titles.push(`${name}, ${regionName}`);
      if (countryName === 'Bangladesh') { /* titles set above */ }
      else titles.push(name, `${name}, ${countryName}`);
    }
    return { key: `${type}|${countryName}|${regionName}|${name}`, titles: [...new Set(titles)], search: `${name} ${type === 'city' ? regionName : ''} ${countryName}`.replace(/\s+/g, ' ').trim() };
  }
  async function wikiImages(titles) {
    const params = new URLSearchParams({ action: 'query', format: 'json', prop: 'pageimages', piprop: 'thumbnail', pithumbsize: '900', pilimit: '50', pilicense: 'any', redirects: '1', origin: '*', titles: titles.join('|') });
    const response = await fetch(`https://en.wikipedia.org/w/api.php?${params}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const alias = new Map();
    for (const step of [...(data.query?.normalized || []), ...(data.query?.redirects || [])]) alias.set(step.to, step.from);
    const back = title => { const names = [title]; let t = title; for (let i = 0; i < 4 && alias.has(t); i += 1) { t = alias.get(t); names.push(t); } return names; };
    const found = new Map();
    for (const page of Object.values(data.query?.pages || {})) {
      if (page.missing !== undefined) continue;
      const url = page.thumbnail?.source || '';
      back(page.title).forEach(name => found.set(name, url));
    }
    return found;
  }
  async function wikiSearchImage(query) {
    const params = new URLSearchParams({ action: 'query', format: 'json', generator: 'search', gsrsearch: query, gsrlimit: '8', gsrnamespace: '0', prop: 'pageimages', piprop: 'thumbnail', pithumbsize: '900', pilimit: '8', pilicense: 'any', origin: '*' });
    const response = await fetch(`https://en.wikipedia.org/w/api.php?${params}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const pages = Object.values((await response.json()).query?.pages || {}).sort((a, b) => (a.index || 0) - (b.index || 0));
    return pages.map(p => p.thumbnail?.source).find(goodImage) || '';
  }
  let placeQueue = [];
  let placeTimer = 0;
  const waiting = new Map();
  async function resolvePlaces(items) {
    const cache = readCache();
    const now = Date.now();
    const todo = items.filter(item => !cache[item.key] || (!cache[item.key].url && now - cache[item.key].at > RETRY_MS));
    if (todo.length && navigator.onLine) {
      let pending = todo.slice();
      // Try each item's candidate titles, a batch at a time.
      for (let round = 0; round < 4 && pending.length; round += 1) {
        const batch = pending.filter(item => item.titles[round]);
        if (!batch.length) break;
        try {
          for (let i = 0; i < batch.length; i += 40) {
            const slice = batch.slice(i, i + 40);
            const found = await wikiImages(slice.map(item => item.titles[round]));
            slice.forEach(item => { const url = found.get(item.titles[round]); if (goodImage(url)) { cache[item.key] = { url, at: now }; } });
          }
        } catch (error) { console.warn('Place photo lookup unavailable:', error.message); break; }
        pending = pending.filter(item => !cache[item.key]?.url);
      }
      // Last try: a Wikipedia search, a few at a time.
      for (let i = 0; i < pending.length; i += 4) {
        await Promise.all(pending.slice(i, i + 4).map(async item => {
          try { cache[item.key] = { url: await wikiSearchImage(item.search), at: now }; } catch { cache[item.key] = { url: '', at: now }; }
        }));
      }
      writeCache(cache);
    }
    return cache;
  }
  function flushPlaces() {
    const items = placeQueue;
    placeQueue = [];
    resolvePlaces(items).then(cache => items.forEach(item => {
      (waiting.get(item.key) || []).forEach(card => { const url = cache[item.key]?.url; if (url) setPhoto(card, url); });
      waiting.delete(item.key);
    }));
  }
  const placeObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      placeObserver.unobserve(entry.target);
      const item = entry.target.__rnrPlace;
      if (!item) return;
      const cached = readCache()[item.key];
      if (cached?.url) { setPhoto(entry.target, cached.url); return; }
      if (!waiting.has(item.key)) { waiting.set(item.key, []); placeQueue.push(item); }
      waiting.get(item.key).push(entry.target);
      clearTimeout(placeTimer);
      placeTimer = setTimeout(flushPlaces, 120);
    });
  }, { rootMargin: '400px 0px' }) : null;
  function lazyPlace(card, item) {
    card.__rnrPlace = item;
    const cached = readCache()[item.key];
    if (cached?.url) { setPhoto(card, cached.url); return; }
    if (placeObserver) placeObserver.observe(card);
    else resolvePlaces([item]).then(cache => { if (cache[item.key]?.url) setPhoto(card, cache[item.key].url); });
  }

  async function uploadedPhotoURL(entity) {
    if (!entity?.backgroundAssetId || typeof archiveDesignGetPhoto !== 'function') return '';
    try {
      const asset = await archiveDesignGetPhoto(entity.backgroundAssetId);
      if (!asset?.blob) return '';
      const url = URL.createObjectURL(asset.blob);
      objectURLs.push(url);
      return url;
    } catch (error) { console.error(error); return ''; }
  }

  function setPhoto(card, url) {
    if (!url) { card.style.removeProperty('--rnr-card-photo'); card.classList.add('rnr-no-photo'); return; }
    // Probe first so a broken image falls back to the designed gradient.
    const probe = new Image();
    probe.onload = () => { if (card.isConnected) { card.style.setProperty('--rnr-card-photo', cssURL(url)); card.classList.remove('rnr-no-photo'); card.classList.add('rnr-photo-ready'); } };
    probe.onerror = () => { if (card.isConnected) card.classList.add('rnr-no-photo'); };
    probe.src = url;
  }

  function addCaption(card, text) {
    card.querySelector('.rnr-card-caption')?.remove();
    if (!text) return;
    const caption = document.createElement('span');
    caption.className = 'rnr-card-caption';
    caption.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"/></svg>${esc(text)}`;
    (card.querySelector('.hierarchy-info') || card).prepend(caption);
  }

  function findRegionParent(regionId) {
    return travelData.find(country => (country.regions || []).some(region => region.id === regionId));
  }

  async function decorate() {
    if (!list) return;
    objectURLs.forEach(url => URL.revokeObjectURL(url));
    objectURLs = [];
    const level = typeof archiveLevel === 'string' ? archiveLevel : '';
    const jobs = [];

    if (level === 'countries') {
      const cards = [...list.querySelectorAll('[data-open-country]')];
      const titles = [];
      cards.forEach(card => {
        const country = travelData.find(item => item.id === card.dataset.openCountry);
        const landmark = country && landmarkFor(country.name);
        if (landmark && !country.backgroundAssetId) titles.push(landmark[0]);
      });
      const cache = titles.length ? await fetchLandmarkPhotos([...new Set(titles)]) : readCache();
      for (const card of cards) {
        const country = travelData.find(item => item.id === card.dataset.openCountry);
        if (!country) continue;
        card.classList.add('rnr-photo-card');
        const landmark = landmarkFor(country.name);
        addCaption(card, country.photoCaption || (country.backgroundAssetId ? '' : landmark?.[1]) || '');
        jobs.push((async () => {
          let url = await uploadedPhotoURL(country);
          if (!url && landmark) url = cache[landmark[0]]?.url || fallbackPhoto(landmark[0], country.name);
          if (!url) url = fallbackPhoto(country.name, 'landmark');
          setPhoto(card, url);
        })());
      }
    }

    if (level === 'regions' || level === 'cities') {
      const selector = level === 'regions' ? '[data-open-region]' : '[data-open-city]';
      const country = typeof findCountry === 'function' ? findCountry(selectedCountryId) : null;
      const region = level === 'cities' && country && typeof findRegion === 'function' ? findRegion(country.id, selectedRegionId) : null;
      for (const card of list.querySelectorAll(selector)) {
        const id = level === 'regions' ? card.dataset.openRegion : card.dataset.openCity;
        const type = level === 'regions' ? 'province' : 'city';
        const entity = typeof archiveDesignFindEntity === 'function' ? archiveDesignFindEntity(type, id) : null;
        if (!entity) continue;
        card.classList.add('rnr-photo-card', 'rnr-photo-card-small');
        // Hide the icon badge when there is no flag/emoji to show.
        const icon = card.querySelector('.hierarchy-flag, .location-icon-circle, .nested-location-icon, .country-icon');
        if (icon) icon.classList.toggle('rnr-empty-icon', !icon.textContent.replace(/[\s\uFE0F\u200D]/g, ''));
        addCaption(card, entity.photoCaption || '');
        if (entity.backgroundAssetId) {
          jobs.push(uploadedPhotoURL(entity).then(url => setPhoto(card, url)));
        } else {
          const parentCountry = country || findRegionParent(entity.id);
          card.classList.add('rnr-no-photo');
          lazyPlace(card, placeQuery(type, entity.name, region?.name || '', parentCountry?.name || ''));
        }
      }
    }
    await Promise.allSettled(jobs);
  }

  // ---------- Editor panel (replaces the old prompt() based editor) ----------
  function buildModal() {
    let modal = document.getElementById('rnrEditModal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'rnrEditModal';
    modal.className = 'rnr-modal';
    modal.hidden = true;
    modal.innerHTML = `
      <div class="rnr-modal-backdrop" data-rnr-close></div>
      <form class="rnr-modal-card" role="dialog" aria-modal="true" aria-labelledby="rnrEditTitle">
        <div class="rnr-modal-preview" id="rnrEditPreview"><span id="rnrEditPreviewLabel"></span></div>
        <div class="rnr-modal-body">
          <p class="rnr-modal-eyebrow" id="rnrEditEyebrow">EDIT</p>
          <h3 id="rnrEditTitle">Edit</h3>
          <label class="rnr-field" data-field="name">Name<input id="rnrEditName" type="text" maxlength="80" autocomplete="off"></label>
          <label class="rnr-field" data-field="flag">Flag or icon (emoji)<input id="rnrEditFlag" type="text" maxlength="16" autocomplete="off"></label>
          <label class="rnr-field" data-field="caption">Photo caption<input id="rnrEditCaption" type="text" maxlength="80" placeholder="e.g. Eiffel Tower, Paris" autocomplete="off"></label>
          <div class="rnr-photo-actions">
            <button type="button" class="rnr-btn rnr-btn-soft" id="rnrEditUpload">Upload my photo</button>
            <button type="button" class="rnr-btn rnr-btn-ghost" id="rnrEditReset">Use default photo</button>
            <input id="rnrEditFile" type="file" accept="image/*" hidden>
          </div>
          <p class="rnr-modal-note" id="rnrEditNote"></p>
          <div class="rnr-modal-footer">
            <button type="button" class="rnr-btn rnr-btn-ghost" data-rnr-close>Cancel</button>
            <button type="submit" class="rnr-btn rnr-btn-primary">Save changes</button>
          </div>
        </div>
      </form>`;
    document.body.append(modal);
    modal.addEventListener('click', event => { if (event.target.closest('[data-rnr-close]')) closeModal(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && !modal.hidden) closeModal(); });
    modal.querySelector('#rnrEditUpload').addEventListener('click', () => modal.querySelector('#rnrEditFile').click());
    modal.querySelector('#rnrEditFile').addEventListener('change', event => {
      const file = event.target.files?.[0];
      if (!file) return;
      const videoOK = pending?.type === 'hero' && file.type.startsWith('video/');
      if (!file.type.startsWith('image/') && !videoOK) { alert(pending?.type === 'hero' ? 'Please choose a photo or a video.' : 'Please choose an image file.'); return; }
      if (videoOK && file.size > 60 * 1024 * 1024) { alert('Please choose a shorter video (under 60 MB). A 5-15 second clip works best.'); return; }
      pending.file = file; pending.reset = false;
      previewFile(file);
      note(`New photo selected: ${file.name}`);
    });
    modal.querySelector('#rnrEditReset').addEventListener('click', () => {
      pending.file = null; pending.reset = true;
      setPreview(pending.defaultURL || '');
      note('The default photo will be used after you save.');
    });
    modal.querySelector('form').addEventListener('submit', event => { event.preventDefault(); saveModal(); });
    return modal;
  }
  let previewURL = null;
  function setPreview(url) {
    const preview = document.getElementById('rnrEditPreview');
    preview.style.backgroundImage = url ? cssURL(url) : '';
    preview.classList.toggle('is-empty', !url);
  }
  function previewFile(file) {
    if (previewURL) URL.revokeObjectURL(previewURL);
    previewURL = URL.createObjectURL(file);
    const preview = document.getElementById('rnrEditPreview');
    preview.querySelector('video')?.remove();
    if (file.type?.startsWith('video/')) {
      setPreview('');
      preview.classList.remove('is-empty');
      const video = document.createElement('video');
      Object.assign(video, { src: previewURL, muted: true, loop: true, autoplay: true, playsInline: true });
      video.className = 'rnr-modal-preview-video';
      preview.prepend(video);
    } else setPreview(previewURL);
  }
  function note(text) { document.getElementById('rnrEditNote').textContent = text || ''; }
  function closeModal() {
    const modal = document.getElementById('rnrEditModal');
    if (modal) modal.hidden = true;
    document.body.classList.remove('rnr-modal-open');
    if (previewURL) { URL.revokeObjectURL(previewURL); previewURL = null; }
    pending = null;
  }

  async function openEditor(type, id) {
    const modal = buildModal();
    const isHero = type === 'hero';
    const entity = isHero ? null : archiveDesignFindEntity(type, id);
    if (!isHero && !entity) { alert('Could not find this item.'); return; }
    const label = isHero ? 'Homepage cover' : type === 'country' ? 'Country' : type === 'city' ? 'City' : (typeof regionLabelFor === 'function' ? regionLabelFor(findRegionParent(entity.id)?.name || '') : 'Area');
    pending = { type, id, entity, file: null, reset: false, defaultURL: '' };
    modal.querySelector('#rnrEditEyebrow').textContent = `EDIT ${String(label).toUpperCase()}`;
    modal.querySelector('#rnrEditTitle').textContent = isHero ? 'Homepage cover (photo or video)' : entity.name;
    modal.querySelector('#rnrEditFile').accept = isHero ? 'image/*,video/*' : 'image/*';
    modal.querySelector('#rnrEditUpload').textContent = isHero ? 'Upload photo or video' : 'Upload my photo';
    document.getElementById('rnrEditPreview').querySelector('video')?.remove();
    modal.querySelector('#rnrEditPreviewLabel').textContent = isHero ? 'Rasel On the Run' : entity.name;
    modal.querySelectorAll('[data-field]').forEach(field => { field.hidden = isHero; });
    if (!isHero) {
      modal.querySelector('#rnrEditName').value = entity.name;
      modal.querySelector('#rnrEditFlag').value = entity.customFlag || (type === 'country' ? getCountryFlag(entity.name) : '');
      const landmark = type === 'country' ? landmarkFor(entity.name) : null;
      modal.querySelector('#rnrEditCaption').value = entity.photoCaption || '';
      modal.querySelector('#rnrEditCaption').placeholder = landmark ? landmark[1] : 'Optional caption shown on the card';
      modal.querySelector('[data-field="flag"]').hidden = type === 'city';
      const cache = readCache();
      const placeCached = type === 'country' ? null : Object.entries(cache).find(([k, v]) => v?.url && k.endsWith(`|${entity.name}`) && k.startsWith(type))?.[1]?.url;
      pending.defaultURL = landmark ? (cache[landmark[0]]?.url || fallbackPhoto(landmark[0], entity.name)) : (placeCached || '');
    } else {
      pending.defaultURL = 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1400&q=80';
    }
    if (isHero) modal.querySelector('#rnrEditReset').textContent = 'Use default photo';
    const assetId = isHero ? localStorage.getItem(HERO_KEY) : entity.backgroundAssetId;
    setPreview(pending.defaultURL);
    if (assetId) {
      const asset = await archiveDesignGetPhoto(assetId).catch(() => null);
      if (asset?.blob) previewFile(asset.blob);
    }
    note(assetId ? 'Showing your uploaded cover.' : (isHero ? 'Tip: a short, silent 5-15 second video (MP4) looks great as a moving cover.' : 'Showing the default photo. Upload your own to replace it.'));
    modal.querySelector('#rnrEditFile').value = '';
    modal.hidden = false;
    document.body.classList.add('rnr-modal-open');
    setTimeout(() => (isHero ? modal.querySelector('#rnrEditUpload') : modal.querySelector('#rnrEditName')).focus(), 30);
  }

  async function saveModal() {
    if (!pending) return;
    const { type, entity, file, reset } = pending;
    try {
      if (type === 'hero') {
        const oldId = localStorage.getItem(HERO_KEY);
        if (file) { const newId = await archiveDesignSavePhoto(file); localStorage.setItem(HERO_KEY, newId); if (oldId) await archiveDesignDeletePhoto(oldId).catch(() => {}); }
        else if (reset && oldId) { localStorage.removeItem(HERO_KEY); await archiveDesignDeletePhoto(oldId).catch(() => {}); }
        closeModal();
        applyHero();
        return;
      }
      const newName = document.getElementById('rnrEditName').value.trim();
      if (newName && newName !== entity.name) {
        if (type === 'country' && typeof rememberRemovedDefault === 'function' && typeof starterCountries !== 'undefined' && starterCountries.some(([name]) => norm(name) === norm(entity.name))) {
          rememberRemovedDefault('countries', norm(entity.name));
        }
        entity.name = newName;
      }
      if (type !== 'city') {
        const flag = document.getElementById('rnrEditFlag').value.trim();
        if (flag) entity.customFlag = flag; else delete entity.customFlag;
      }
      const caption = document.getElementById('rnrEditCaption').value.trim();
      if (caption) entity.photoCaption = caption; else delete entity.photoCaption;
      const oldId = entity.backgroundAssetId;
      if (file) {
        entity.backgroundAssetId = await archiveDesignSavePhoto(file);
      } else if (reset) {
        delete entity.backgroundAssetId;
      }
      if (!saveData()) return;
      if ((file || reset) && oldId && oldId !== entity.backgroundAssetId) await archiveDesignDeletePhoto(oldId).catch(() => {});
      closeModal();
      renderCountries();
    } catch (error) {
      console.error('Save error:', error);
      alert('Could not save this change. Browser storage may be full.');
    }
  }

  // The existing Edit buttons call archiveDesignEdit(type, id); route them to the new panel.
  window.archiveDesignEdit = (type, id) => { openEditor(type, id).catch(error => console.error(error)); };
  try { archiveDesignEdit = window.archiveDesignEdit; } catch {}

  // ---------- Homepage cover photo ----------
  async function applyHero() {
    const hero = document.getElementById('home');
    if (!hero) return;
    if (heroURL) { URL.revokeObjectURL(heroURL); heroURL = null; heroType = ''; }
    const id = localStorage.getItem(HERO_KEY);
    if (id) {
      const asset = await archiveDesignGetPhoto(id).catch(() => null);
      if (asset?.blob) { heroURL = URL.createObjectURL(asset.blob); heroType = asset.blob.type || ''; }
    }
    hero.querySelector('.rnr-hero-video')?.remove();
    let isVideo = false;
    if (heroURL && heroType.startsWith('video/')) {
      isVideo = true;
      const video = document.createElement('video');
      video.className = 'rnr-hero-video';
      Object.assign(video, { src: heroURL, muted: true, loop: true, playsInline: true, autoplay: !matchMedia('(prefers-reduced-motion: reduce)').matches });
      video.setAttribute('muted', ''); video.setAttribute('playsinline', ''); video.setAttribute('aria-hidden', 'true'); video.setAttribute('data-no-archive-watermark', '');
      hero.prepend(video);
      hero.style.removeProperty('--rnr-hero-photo');
      document.documentElement.style.removeProperty('--rnr-hero-photo');
    } else if (heroURL) {
      hero.style.setProperty('--rnr-hero-photo', cssURL(heroURL));
      document.documentElement.style.setProperty('--rnr-hero-photo', cssURL(heroURL));
    } else {
      hero.style.removeProperty('--rnr-hero-photo');
      document.documentElement.style.removeProperty('--rnr-hero-photo');
    }
    hero.classList.toggle('rnr-hero-custom', Boolean(heroURL));
    hero.classList.toggle('rnr-hero-has-video', isVideo);
  }
  function addHeroButton() {
    const hero = document.getElementById('home');
    if (!hero || hero.querySelector('.rnr-hero-edit')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'rnr-hero-edit';
    button.textContent = 'Change cover';
    button.addEventListener('click', () => openEditor('hero'));
    hero.append(button);
  }

  // Keep the header height available to CSS so the hero fills the first screen exactly.
  function syncHeaderHeight() {
    const header = document.querySelector('.site-header');
    if (header) document.documentElement.style.setProperty('--rnr-header-h', `${Math.round(header.getBoundingClientRect().height)}px`);
  }

  // Wrap the renderer (after every other wrapper) so cards are decorated on each view.
  const previousRender = renderCountries;
  renderCountries = function (...args) {
    const result = previousRender.apply(this, args);
    decorate().catch(error => console.error('Country showcase error:', error));
    return result;
  };

  function init() {
    addHeroButton();
    applyHero();
    syncHeaderHeight();
    renderCountries();
  }
  addEventListener('resize', syncHeaderHeight, { passive: true });
  addEventListener('load', syncHeaderHeight);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();

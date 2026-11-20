/* =========================================================
   RASEL ON THE RUN — TRAVEL JOURNAL FEATURES
   Add-on layer. Keeps the existing archive and its storage.
   ========================================================= */
(() => {
  "use strict";

  const DATA_KEY = "raselOnTheRunData";
  const PROFILE_KEY = "raselOnTheRunAboutMe";
  const PHOTO_DB = "RaselOnTheRunPhotos";
  const ASSET_DB = "RaselOnTheRunDesignAssets";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const safe = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const uid = () => crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const countryCoords = {
    "Bangladesh":[23.685,90.3563], Canada:[56.1304,-106.3468], Maldives:[3.2028,73.2207], Nepal:[28.3949,84.124], India:[20.5937,78.9629], France:[46.2276,2.2137], Spain:[40.4637,-3.7492], "United States":[37.0902,-95.7129], "Türkiye":[38.9637,35.2433], Italy:[41.8719,12.5674], Mexico:[23.6345,-102.5528], "United Kingdom":[55.3781,-3.436], Germany:[51.1657,10.4515], Japan:[36.2048,138.2529], Greece:[39.0742,21.8243], Thailand:[15.87,100.9925], Austria:[47.5162,14.5501], "Saudi Arabia":[23.8859,45.0792], Portugal:[39.3999,-8.2245], Malaysia:[4.2105,101.9758], Netherlands:[52.1326,5.2913], Poland:[51.9194,19.1451], Vietnam:[14.0583,108.2772], Morocco:[31.7917,-7.0926], "South Korea":[35.9078,127.7669], Egypt:[26.8206,30.8025], Hungary:[47.1625,19.5033], Singapore:[1.3521,103.8198], Albania:[41.1533,20.1683], Tunisia:[33.8869,9.5375], Uzbekistan:[41.3775,64.5853], "South Africa":[-30.5595,22.9375], Sweden:[60.1282,18.6435], Bulgaria:[42.7339,25.4858], "Dominican Republic":[18.7357,-70.1627], Australia:[-25.2744,133.7751], Iran:[32.4279,53.688], Brazil:[-14.235,-51.9253], Colombia:[4.5709,-74.2973], Cambodia:[12.5657,104.991], Argentina:[-38.4161,-63.6167], Ireland:[53.1424,-7.6921], Bahrain:[26.0667,50.5577], Philippines:[12.8797,121.774], Chile:[-35.6751,-71.543], Jordan:[30.5852,36.2384], Georgia:[42.3154,43.3569], Qatar:[25.3548,51.1839], Andorra:[42.5063,1.5218], "Sri Lanka":[7.8731,80.7718]
  };

  function openDB(name, version, stores) {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(name, version);
      req.onupgradeneeded = () => {
        const db = req.result;
        stores.forEach(store => { if (!db.objectStoreNames.contains(store)) db.createObjectStore(store, {keyPath:"id"}); });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async function allRecords(dbName, stores, store) {
    const db = await openDB(dbName, 1, stores);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, "readonly"), req = tx.objectStore(store).getAll();
      req.onsuccess = () => { const data = req.result; db.close(); resolve(data); };
      req.onerror = () => { const err = req.error; db.close(); reject(err); };
    });
  }
  async function putRecords(dbName, stores, store, records, clear = false) {
    const db = await openDB(dbName, 1, stores);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, "readwrite"), os = tx.objectStore(store);
      if (clear) os.clear();
      records.forEach(record => os.put(record));
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { const err = tx.error; db.close(); reject(err); };
    });
  }
  async function getPhotos() { return allRecords(PHOTO_DB, ["photos"], "photos"); }
  function getTravel() { try { return JSON.parse(localStorage.getItem(DATA_KEY) || "[]"); } catch { return []; } }
  function saveTravel(data) { localStorage.setItem(DATA_KEY, JSON.stringify(data)); }
  function locationName(photo) {
    const data = getTravel();
    const country = data.find(x => x.id === photo.countryId);
    const region = country?.regions?.find(x => x.id === photo.regionId);
    const city = region?.cities?.find(x => x.id === photo.cityId);
    return [country?.name, region?.name, city?.name].filter(Boolean).join(" · ");
  }

  const style = document.createElement("style");
  style.textContent = `
    .journey-tools{padding:60px 7%;background:#fffdf8;border-top:1px solid #e6e0d4}
    .journey-tools h2,.journey-tools h3{font-family:'Playfair Display',serif;font-weight:500}
    .journey-tools h2{font-size:34px;margin:0 0 10px}.journey-tools .jt-intro{color:#77766d;margin-bottom:24px;font-size:14px}
    .jt-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin:22px 0 34px}
    .jt-stat,.jt-panel,.passport-stamp{background:#f7f4ed;border:1px solid #e6e0d4;border-radius:8px;padding:18px}
    .jt-stat strong{display:block;font:600 30px 'Playfair Display',serif;color:#465b48}.jt-stat span{font-size:12px;color:#77766d}
    .jt-actions{display:flex;flex-wrap:wrap;gap:10px;margin:15px 0 25px}.jt-btn{border:1px solid #465b48;background:#465b48;color:#fff;padding:10px 15px;border-radius:4px;cursor:pointer;font:600 13px 'DM Sans',sans-serif}.jt-btn.alt{background:transparent;color:#465b48}.jt-btn.danger{background:#8b3f35;border-color:#8b3f35}
    .jt-map{height:420px;border:1px solid #e6e0d4;border-radius:8px;z-index:0}.jt-stamps{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin:20px 0 35px}.passport-stamp{text-align:center;min-height:130px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;border-style:dashed}.passport-stamp .stamp-flag{font-size:30px}.passport-stamp strong{font-size:13px}.passport-stamp small{font-size:10px;color:#77766d;letter-spacing:1px}.passport-stamp.unvisited{opacity:.48;filter:grayscale(1)}
    .jt-photo-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin:20px 0 35px}.jt-photo{background:#fff;border:1px solid #e6e0d4;border-radius:7px;overflow:hidden}.jt-photo img{width:100%;height:210px;object-fit:cover;display:block;cursor:zoom-in}.jt-photo-body{padding:13px}.jt-photo-body h3{font:600 16px 'DM Sans',sans-serif;overflow-wrap:anywhere}.jt-photo-body p{font-size:12px;color:#77766d;margin:4px 0}.jt-photo-body .jt-story{font-size:13px;color:#444;margin:9px 0}.jt-photo-actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}.jt-photo-actions button{font-size:11px;padding:7px 9px}.jt-empty{padding:25px;background:#f7f4ed;border:1px dashed #d7cfbf;color:#77766d;border-radius:7px}
    .jt-modal{position:fixed;inset:0;background:rgba(10,12,10,.94);z-index:99999;display:none;align-items:center;justify-content:center;padding:20px}.jt-modal.open{display:flex}.jt-modal img{max-width:90vw;max-height:82vh;object-fit:contain;transition:transform .15s;cursor:zoom-in}.jt-modal-bar{position:absolute;top:18px;right:20px;display:flex;gap:8px}.jt-modal-bar button{background:#fff;color:#222;border:0;border-radius:4px;padding:9px 12px;cursor:pointer}.jt-modal-caption{position:absolute;bottom:18px;left:20px;right:20px;text-align:center;color:#fff;font-size:13px}
    .jt-editor{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:99998;display:none;align-items:center;justify-content:center;padding:15px}.jt-editor.open{display:flex}.jt-editor-card{background:#fffdf8;padding:24px;border-radius:8px;width:min(520px,100%);max-height:90vh;overflow:auto}.jt-editor-card label{display:block;font-size:12px;font-weight:600;margin:12px 0 5px}.jt-editor-card input,.jt-editor-card textarea{width:100%;padding:10px;border:1px solid #d9d2c5;border-radius:4px;font:14px 'DM Sans',sans-serif}.jt-editor-card textarea{min-height:100px;resize:vertical}.jt-editor-card .jt-actions{margin-bottom:0}
    .jt-filter{padding:9px 12px;border:1px solid #d9d2c5;border-radius:4px;background:white}.jt-country-control{display:block;margin-top:10px;font-size:11px;position:relative;z-index:2}.jt-country-control button{font-size:11px;padding:6px 9px;background:#465b48;color:#fff;border:0;border-radius:4px;cursor:pointer}.jt-country-control button.visited{background:#b18b55}
    @media(max-width:850px){.jt-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.jt-photo-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:560px){.journey-tools{padding:42px 5%}.jt-photo-grid{grid-template-columns:1fr}.jt-map{height:340px}.jt-grid{gap:8px}.jt-stat{padding:12px}.jt-stat strong{font-size:24px}}
  `;
  document.head.appendChild(style);

  // Main feature dashboard.
  const dashboard = document.createElement("section");
  dashboard.id = "travelDashboard";
  dashboard.className = "journey-tools";
  dashboard.innerHTML = `
    <p class="eyebrow">YOUR JOURNEY AT A GLANCE</p><h2>My Travel Statistics</h2>
    <p class="jt-intro">A little overview of the places and memories in your archive.</p>
    <div class="jt-grid" id="jtStats"></div>
    <h2>My Travel Passport</h2><p class="jt-intro">Mark countries you have visited and collect your digital stamps.</p>
    <div class="jt-stamps" id="jtPassport"></div>
    <h2>Interactive World Map</h2><p class="jt-intro">Your visited countries are shown on the map. Country pins use approximate country-centre coordinates.</p>
    <div id="jtWorldMap" class="jt-map"></div>
    <div class="jt-actions"><button class="jt-btn alt" id="jtExport">↓ Backup My Travel Archive</button><button class="jt-btn alt" id="jtImport">↑ Restore Backup</button><input id="jtBackupFile" type="file" accept="application/json,.json" hidden></div>
    <h2>Travel Timeline</h2><p class="jt-intro">Your stories in date order.</p><div id="jtTimeline" class="jt-photo-grid"></div>
    <h2>Favorite Memories</h2><p class="jt-intro">The moments you have marked as favorites.</p><div id="jtFavorites" class="jt-photo-grid"></div>
    <h2>All Travel Stories</h2><p class="jt-intro">Add a date, caption and story to each photograph.</p><div class="jt-actions"><select class="jt-filter" id="jtPhotoFilter"><option value="all">All photos</option><option value="favorites">Favorites only</option></select></div><div id="jtAllPhotos" class="jt-photo-grid"></div>
  `;
  const memoriesSection = $("#memories");
  if (memoriesSection) memoriesSection.insertAdjacentElement("afterend", dashboard);

  // Lightbox and story editor.
  const lightbox = document.createElement("div");
  lightbox.className = "jt-modal";
  lightbox.id = "jtLightbox";
  lightbox.innerHTML = `<div class="jt-modal-bar"><button data-zoom="out">−</button><button data-zoom="reset">100%</button><button data-zoom="in">+</button><button data-close-lightbox> Close</button></div><img alt="Travel memory"><div class="jt-modal-caption"></div>`;
  document.body.appendChild(lightbox);
  const editor = document.createElement("div");
  editor.className = "jt-editor";
  editor.id = "jtStoryEditor";
  editor.innerHTML = `<div class="jt-editor-card"><h2>Edit Travel Story</h2><form id="jtStoryForm"><label>Travel date</label><input type="date" name="travelDate"><label>Caption / title</label><input name="caption" maxlength="140" placeholder="A special moment..."><label>Your story</label><textarea name="story" placeholder="Write about this memory..."></textarea><label><input type="checkbox" name="favorite" style="width:auto"> Mark as favorite</label><div class="jt-actions"><button class="jt-btn" type="submit">Save Story</button><button class="jt-btn alt" type="button" data-close-editor>Cancel</button></div></form></div>`;
  document.body.appendChild(editor);

  let activePhotoId = null, zoom = 1, map = null, markers = [];
  function showLightbox(photo, url) {
    const img = $("img", lightbox); img.src = url; img.style.transform = "scale(1)"; zoom = 1;
    $(".jt-modal-caption", lightbox).textContent = `${photo.caption || photo.name} · ${locationName(photo)}`;
    lightbox.classList.add("open");
  }
  function photoCard(photo, url) {
    const date = photo.travelDate || photo.uploadedAt?.slice(0,10) || "Date not set";
    return `<article class="jt-photo"><img src="${url}" alt="${safe(photo.caption || photo.name)}" data-jt-view="${photo.id}"><div class="jt-photo-body"><h3>${safe(photo.caption || photo.name)}</h3><p>${safe(locationName(photo) || "Travel memory")} · ${safe(date)}</p>${photo.story ? `<p class="jt-story">${safe(photo.story)}</p>` : `<p class="jt-story">No story added yet.</p>`}<div class="jt-photo-actions"><button class="jt-btn alt" data-jt-edit="${photo.id}"> Edit story</button><button class="jt-btn alt" data-jt-fav="${photo.id}">${photo.favorite ? " Favorited" : " Favorite"}</button><button class="jt-btn alt" data-jt-open="${photo.id}"> Full screen</button></div></div></article>`;
  }
  async function renderPhotoCollections() {
    const photos = await getPhotos();
    const all = photos.slice().sort((a,b) => new Date(b.travelDate || b.uploadedAt || 0) - new Date(a.travelDate || a.uploadedAt || 0));
    const filter = $("#jtPhotoFilter")?.value || "all";
    const shown = filter === "favorites" ? all.filter(p => p.favorite) : all;
    const renderInto = (selector, list) => {
      const node = $(selector); if (!node) return;
      node.innerHTML = list.length ? list.map(photo => {
        const url = URL.createObjectURL(photo.blob);
        return photoCard(photo, url);
      }).join("") : `<div class="jt-empty">No photos here yet. Upload photos in a city to start your travel story collection.</div>`;
    };
    renderInto("#jtAllPhotos", shown);
    renderInto("#jtTimeline", all);
    renderInto("#jtFavorites", all.filter(p => p.favorite));
  }
  async function renderStats() {
    const data = getTravel(), photos = await getPhotos();
    const regions = data.reduce((n,c)=>n+(c.regions?.length||0),0);
    const cities = data.reduce((n,c)=>n+(c.regions||[]).reduce((m,r)=>m+(r.cities?.length||0),0),0);
    const visited = data.filter(c=>c.visited).length;
    const stats = [[visited,"Countries visited"],[regions,"Regions / provinces"],[cities,"Cities in archive"],[photos.length,"Photos saved"]];
    $("#jtStats").innerHTML = stats.map(([n,label])=>`<div class="jt-stat"><strong>${n}</strong><span>${label}</span></div>`).join("");
  }
  function renderPassport() {
    const data = getTravel();
    $("#jtPassport").innerHTML = data.map(c=>`<div class="passport-stamp ${c.visited ? "" : "unvisited"}"><span class="stamp-flag">${safe(c.customFlag || flagFor(c.name))}</span><strong>${safe(c.name)}</strong><small>${c.visited ? " VISITED" : "NOT VISITED"}</small><button class="jt-btn ${c.visited ? "alt" : ""}" data-jt-visited="${c.id}" style="margin-top:8px;padding:6px 8px">${c.visited ? "Remove stamp" : "Add stamp"}</button></div>`).join("");
  }
  function flagFor(name) {
    const flags={Bangladesh:"",Canada:"",Maldives:"",Nepal:"",India:"",France:"",Spain:"","United States":"","Türkiye":"",Italy:"",Japan:"",Australia:"",Germany:"","United Kingdom":"",Singapore:"","South Korea":"",Brazil:"",Mexico:"",Thailand:"",Malaysia:""}; return flags[name] || "";
  }
  async function renderMap() {
    const host = $("#jtWorldMap"); if (!host) return;
    if (!window.L) {
      host.innerHTML = `<div class="jt-empty">The map library could not load. Please check your internet connection and refresh the page.</div>`;
      return;
    }
    if (!map) {
      map = L.map(host).setView([22,10],2);
      if (window.RNR_TILES) window.RNR_TILES.add(L, map); else L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {maxZoom:18, attribution:"&copy; OpenStreetMap contributors"}).addTo(map);
    }
    markers.forEach(m=>m.remove()); markers=[];
    getTravel().filter(c=>c.visited).forEach(c=>{
      const point = c.coordinates && Number.isFinite(c.coordinates.lat) && Number.isFinite(c.coordinates.lng) ? [c.coordinates.lat,c.coordinates.lng] : countryCoords[c.name];
      if (!point) return;
      const marker=L.marker(point).addTo(map).bindPopup(`<strong>${safe(c.name)}</strong><br>Visited destination`); markers.push(marker);
    });
    setTimeout(()=>map.invalidateSize(),150);
  }
  async function refresh() {
    await renderStats(); renderPassport(); await renderPhotoCollections(); await renderMap();
    addCountryVisitedControls();
  }
  function addCountryVisitedControls() {
    $$("#countryList [data-open-country]").forEach(card=>{
      if ($(".jt-country-control",card)) return;
      const id=card.dataset.openCountry, country=getTravel().find(c=>c.id===id); if(!country)return;
      const wrap=document.createElement("div"); wrap.className="jt-country-control";
      const button=document.createElement("button"); button.type="button"; button.className=country.visited?"visited":""; button.textContent=country.visited?" Visited — Passport stamp":"＋ Mark as visited"; button.dataset.jtVisited=id;
      wrap.append(button); card.append(wrap);
    });
  }
  function editPhoto(id) {
    getPhotos().then(photos=>{
      const photo=photos.find(p=>p.id===id); if(!photo)return;
      activePhotoId=id; const form=$("#jtStoryForm");
      form.elements.travelDate.value=photo.travelDate || "";
      form.elements.caption.value=photo.caption || "";
      form.elements.story.value=photo.story || "";
      form.elements.favorite.checked=!!photo.favorite;
      editor.classList.add("open");
    });
  }

  document.addEventListener("click", async event => {
    const visited=event.target.closest("[data-jt-visited]");
    if(visited){event.preventDefault();event.stopPropagation();const data=getTravel(), c=data.find(x=>x.id===visited.dataset.jtVisited);if(c){c.visited=!c.visited;if(c.visited&&!countryCoords[c.name]&&!c.coordinates){const raw=prompt(`Optional: enter approximate latitude, longitude for ${c.name} (example: 23.8, 90.4). Leave blank to skip the map pin.`);if(raw&&raw.includes(",")){const [lat,lng]=raw.split(",").map(Number);if(Number.isFinite(lat)&&Number.isFinite(lng)&&Math.abs(lat)<=90&&Math.abs(lng)<=180)c.coordinates={lat,lng};}}saveTravel(data);await refresh();}return;}
    const edit=event.target.closest("[data-jt-edit]"); if(edit){editPhoto(edit.dataset.jtEdit);return;}
    const fav=event.target.closest("[data-jt-fav]"); if(fav){const photos=await getPhotos(),p=photos.find(x=>x.id===fav.dataset.jtFav);if(p){p.favorite=!p.favorite;await putRecords(PHOTO_DB,["photos"],"photos",[p]);await refresh();}return;}
    const view=event.target.closest("[data-jt-view], [data-jt-open]"); if(view){const id=view.dataset.jtView||view.dataset.jtOpen;const photos=await getPhotos(),p=photos.find(x=>x.id===id);if(p){const url=URL.createObjectURL(p.blob);showLightbox(p,url);lightbox.dataset.objectUrl=url;}return;}
    if(event.target.closest("[data-close-lightbox]")){const url=lightbox.dataset.objectUrl;if(url)URL.revokeObjectURL(url);lightbox.classList.remove("open");return;}
    if(event.target.closest("[data-zoom]")){const action=event.target.closest("[data-zoom]").dataset.zoom;zoom=action==="in"?Math.min(zoom+.25,4):action==="out"?Math.max(zoom-.25,.5):1;$("img",lightbox).style.transform=`scale(${zoom})`;return;}
    if(event.target.closest("[data-close-editor]")){editor.classList.remove("open");return;}
  }, true);
  $("#jtStoryForm").addEventListener("submit", async event=>{
    event.preventDefault(); const photos=await getPhotos(),p=photos.find(x=>x.id===activePhotoId);if(!p)return;
    const form=event.currentTarget;p.travelDate=form.elements.travelDate.value;p.caption=form.elements.caption.value.trim();p.story=form.elements.story.value.trim();p.favorite=form.elements.favorite.checked;
    await putRecords(PHOTO_DB,["photos"],"photos",[p]);editor.classList.remove("open");await refresh();
  });
  $("#jtPhotoFilter").addEventListener("change",renderPhotoCollections);

  // Backup: include metadata, all photo blobs and background image assets.
  async function blobToBase64(blob) {
    const bytes=new Uint8Array(await blob.arrayBuffer()); let binary="";
    const chunk=0x8000; for(let i=0;i<bytes.length;i+=chunk)binary+=String.fromCharCode(...bytes.subarray(i,i+chunk));
    return {type:blob.type,base64:btoa(binary)};
  }
  function base64ToBlob(item) { const binary=atob(item.base64),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return new Blob([bytes],{type:item.type||"application/octet-stream"}); }
  $("#jtExport").addEventListener("click",async()=>{
    try{
      const photos=await getPhotos(),assets=await allRecords(ASSET_DB,["assets"],"assets");
      const packed=async rows=>Promise.all(rows.map(async r=>({...r,blob:await blobToBase64(r.blob)})));
      const local={};for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);local[key]=localStorage.getItem(key);}
      const backup={app:"Rasel On the Run",formatVersion:1,createdAt:new Date().toISOString(),localStorage:local,photos:await packed(photos),assets:await packed(assets)};
      const blob=new Blob([JSON.stringify(backup)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`rasel-on-the-run-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url);
      alert("Backup created. Keep the JSON file somewhere safe. Large photo collections create large backup files.");
    }catch(err){console.error(err);alert("Backup failed. Check available browser storage and try again.");}
  });
  $("#jtImport").addEventListener("click",()=>$("#jtBackupFile").click());
  $("#jtBackupFile").addEventListener("change",async event=>{
    const file=event.target.files?.[0];if(!file)return;
    if(!confirm("Restore this backup? Current archive data, photos and profile settings will be replaced by the backup. Please export a backup of your current archive first.")){event.target.value="";return;}
    try{
      const backup=JSON.parse(await file.text());
      if(backup.app!=="Rasel On the Run"||backup.formatVersion!==1||!Array.isArray(backup.photos)||!Array.isArray(backup.assets)||!backup.localStorage)throw new Error("Invalid backup format");
      const unpack=rows=>rows.map(r=>({...r,blob:base64ToBlob(r.blob)}));
      const restoredPhotos=unpack(backup.photos),restoredAssets=unpack(backup.assets);
      await putRecords(PHOTO_DB,["photos"],"photos",restoredPhotos,true);
      await putRecords(ASSET_DB,["assets"],"assets",restoredAssets,true);
      Object.keys(backup.localStorage).forEach(k=>localStorage.setItem(k,backup.localStorage[k]));
      alert("Backup restored successfully. The page will now reload.");location.reload();
    }catch(err){console.error(err);alert("Could not restore this file. It may be damaged or not a Rasel On the Run backup.");}
    event.target.value="";
  });

  // Add a direct navigation shortcut to the new travel dashboard.
  const nav = $(".main-nav");
  if (nav && !$("#travelDashboardNav")) {
    const link = document.createElement("a");
    link.id = "travelDashboardNav";
    link.href = "#travelDashboard";
    link.textContent = "Passport & Map";
    nav.insertBefore(link, nav.querySelector("button") || null);
  }

  // Add Leaflet assets without changing the existing visual theme.
  const leafletCSS=document.createElement("link");leafletCSS.rel="stylesheet";leafletCSS.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";document.head.appendChild(leafletCSS);
  const leafletJS=document.createElement("script");leafletJS.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";leafletJS.onload=()=>renderMap();document.head.appendChild(leafletJS);

  // Keep country passport controls visible when the existing archive re-renders.
  const observer=new MutationObserver(()=>{if(document.querySelector("#countryList [data-open-country]"))addCountryVisitedControls();});
  if($("#countryList"))observer.observe($("#countryList"),{childList:true,subtree:true});

  refresh().catch(err=>console.error("Travel dashboard initialization:",err));


})();

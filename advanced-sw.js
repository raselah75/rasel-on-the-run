/* Minimal offline app-shell cache. External maps/CDN content are not cached. */
const CACHE='rasel-on-the-run-shell-v4';
const CORE=['./','./index.html','./styles.css','./script.js','./features.js','./premium.js','./human-experience.js','./next-upgrade.js','./adventure-explorer.js','./advanced-explorer.js','./ultimate-core.js','./ultimate-explorer.js'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}return response;}).catch(()=>caches.match('./index.html'))));});

/* Offline app-shell cache for Rasel On the Run.
   Network-first: when online, visitors always get the newest files (so website
   updates appear immediately); the cached copy is used only when offline.
   External maps, photos and CDN content are not cached. */
const CACHE='rasel-on-the-run-shell-v43';
const CORE=['./', './index.html', './styles.css', './premium-modules-refinement.css', './final-readiness.css', './world-countries.js', './administrative-areas.js', './cities.js', './photo-gallery.js', './script.js', './features.js', './premium.js', './human-experience.js', './next-upgrade.js', './adventure-explorer.js', './advanced-explorer.js', './ultimate-core.js', './ultimate-explorer.js', './final-journey-core.js', './final-journey.js', './content-manager-core.js', './content-manager.js', './lifetime-documentary.js', './premium-seven.js', './profile-access.js', './short-video-gallery.js', './media-count-dashboard.js', './photo-logo.js', './archive-watermark.js', './logos/watermark-rasel-on-the-run.svg', './logos/watermark-adventure-with-rasel.svg', './study-journey.js', './visual-upgrade.js', './navigation-experience.js', './final-readiness.js', './security-maintenance.js', './key-features-polish.js', './section-color-system.js', './archive-polish.js', './country-reorder.js', './country-showcase.js', './world-clock.js', './site-config.js', './site-stories.js', './videos.js', './travel-globe.js', './map-tiles.js', './photo-map.js', './extras.js', './timeline.js', './site-pages.js', './owner-edit.js', './brand.js', './premium-ux.js', './language.js', './cloud-publish.js', './passport.js', './district-map.js', './trip-routes.js', './panorama.js', './food-diary.js', './seasons.js', './photo-book.js', './theme-mode.js', './pwa-install.js', './smart-search.js', './smart-upload.js', './country-story.js', './place-facts.js', './year-recap.js', './guestbook.js', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png', './journey-plan.js', './toolkit-tidy.js', './theme-final.css', './404.html', './offline.html'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>Promise.allSettled(CORE.map(url=>cache.add(url)))).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
  event.respondWith(fetch(event.request).then(response=>{
    if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
    return response;
  }).catch(()=>caches.match(event.request).then(cached=>cached||(event.request.mode==='navigate'?caches.match('./index.html').then(page=>page||caches.match('./offline.html')):Response.error()))));
});

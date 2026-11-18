RASEL ON THE RUN
Every Journey Tells a Story.

RUN ON MAC
1. Extract this ZIP.
2. Open Terminal and move into this folder, for example:
   cd ~/Desktop/rasel-on-the-run
3. Start the local server:
   python3 -m http.server 8000
4. Open http://localhost:8000 in your browser.

COUNTRY ARCHIVE STRUCTURE
The archive is intentionally two levels deep:
Country > the country's own administrative label > City.
Examples: Canada > Province > City; Bangladesh > Division > City;
United States > State > City. Each country has its own label in the interface.

EDIT FLAGS AND BACKGROUND PHOTOS
Use the Edit button on a country, administrative-area, or city card.
You can edit its name, enter a flag emoji, upload/change its background
photo, or remove its current background photo. Use the Remove button to
remove a country, administrative area, or city from the archive. Removing
an item also removes its nested locations from the archive; it cannot be
undone, so export a backup first.

Background images are user-uploaded and stored in this browser's IndexedDB.
This build does not silently download third-party landmark photographs.
You can upload any famous landmark photo you have permission to use.
The world map uses OpenStreetMap tiles and requires internet access.

DATA SAFETY
Your archive data and photos are stored locally in this browser. Use
"Backup My Travel Archive" regularly and keep the JSON backup somewhere safe.
Restoring a backup replaces the current local archive; export the current
archive first if you need to preserve it.

PREMIUM TRAVEL STUDIO
- Travel Studio adds a searchable archive view, 3D visited-country globe,
  video upload, media cards, archive edit/delete controls, dark/light mode,
  and a PDF passport export.
- The 3D globe and PDF export load their libraries from public CDNs and need
  an internet connection.
- Video uploads are stored in the same local IndexedDB photo store. Large
  videos use substantial browser storage; keep regular backups.

OPTIONAL PRIVATE CLOUD BACKUP (SUPABASE)
1. Create your own Supabase project.
2. In Authentication > Providers, enable Email sign-in.
3. Open SQL Editor and run supabase-schema.sql from this project.
4. In Travel Studio, enter your Project URL, anon/publishable key and email;
   choose Save setup, then Email sign-in link.
5. Open the sign-in email link on the same browser/device. Then choose
   Save to cloud or Restore from cloud.
6. Use only the anon/publishable key. NEVER put a Supabase service_role or
   secret key in this website. The SQL uses row-level security so each signed-
   in user can access only their own backup.

CLOUD BACKUP LIMITATION
Supabase stores one latest backup per authenticated user. The payload includes
archive metadata and media blobs, so large video collections may exceed your
project/API request limits. For very large videos, keep an additional local
backup or use a dedicated object-storage workflow.

NEXT UPGRADE — JOURNEY PLANNER & YEARBOOK
-----------------------------------------
Added features:
- My Journey Itinerary (create, edit and delete trip plans)
- Travel Souvenir Collection (image/PDF keepsakes stored in a separate IndexedDB)
- My Travel Routes (manual route records with optional map links)
- Travel Calendar & achievements (derived from saved itinerary/route records)
- My Travel Yearbook (yearly recap with print / Save as PDF)
- Advanced Photography details (image dimensions, file size, MIME type and available file date)
- Travel Expense Tracker (totals are grouped by currency; no exchange rates are guessed)

New data is stored separately:
- localStorage key: raselOnTheRunNextUpgradeV1
- IndexedDB database: RaselOnTheRunSouvenirsV1
Existing archive and photo database keys are not changed. Existing backup/export flows may not include these new records; keep a separate browser/device backup until an integrated backup update is configured.

EXIF NOTE
---------
Image dimensions, size and file type are read locally. Full camera EXIF fields are not guaranteed because browser support and source-image metadata vary. No missing camera, GPS or date values are invented.

ROUTES NOTE
-----------
Routes are entered manually, optionally with a map URL. The website does not infer travel routes or precise GPS coordinates.

ADVENTURE EXPLORER UPGRADE
--------------------------
Added an Adventure Explorer section with:
- Adventure Activities Tracker
- Mountain & Hiking Elevation Tracker
- Camping & Outdoor Journal
- Epic Road Trip Planner
- Hidden Places Explorer
- Adventure Challenges & Achievements
- Sunrise & Sunset Collection
- Adventure Video Documentary (local video upload)

Adventure records are stored separately in localStorage key
raselOnTheRunAdventureV1. Uploaded adventure videos are stored in a separate
IndexedDB database named RaselOnTheRunAdventureMediaV1. This additive module
does not alter the existing country archive, photo records, diary, passport,
journey planner, souvenirs, routes, expenses or previous storage keys.

IMPORTANT: Activity distances, elevation, dates and achievements are manually
entered by the owner; they are not independently GPS-verified. Video files can
be large and consume browser storage. Keep separate backups. Existing backup
and cloud restore flows do not automatically include this new Adventure
Explorer data in this release.

ADVANCED ADVENTURE EXPLORER EDITION
----------------------------------
New additive features:
- Live GPS Adventure Tracking (start / stop / save / discard; browser geolocation permission required)
- Hiking analytics using saved trail logs and available GPS altitude readings
- Trail Explorer Database
- Wildlife & Nature Explorer
- Explorer levels and record-based achievements
- Travel Documentary Studio (local image/video uploads)
- Adventure Weather History (manual observations; no weather is fabricated)
- National Parks & Waterfalls collection
- Offline Adventure Journal
- Safety & Expedition Management
- Advanced Adventure-only JSON backup and restore

New storage is isolated from all previous modules:
- localStorage: raselOnTheRunAdvancedExplorerV1
- IndexedDB: RaselOnTheRunAdvancedMediaV1
The existing archive, photos, premium, diary, planner, souvenir and Adventure Explorer stores are not renamed or migrated.

GPS AND PRIVACY
---------------
GPS works only after you press Start and grant browser permission. It requires
HTTPS or localhost. The page must remain open during recording; browser/device
power-saving can interrupt tracking. Coordinates are stored locally in this
browser. The site does not send GPS coordinates to a server. This is not an
emergency beacon or a substitute for dedicated navigation/safety equipment.

ELEVATION / WEATHER ACCURACY
---------------------------
Trail elevation and weather observations are manually entered. GPS altitude is
recorded only when the device supplies it and may be inaccurate. No elevation,
weather or trail conditions are inferred or independently verified.

OFFLINE MODE
------------
The service worker caches the local app shell after the first successful load.
Use the site through localhost or HTTPS; opening index.html directly as a file
will not enable service-worker offline caching. External map tiles, CDNs and
other third-party resources may not work offline.

BACKUP
------
Use “Export Advanced Adventure Backup” to save this module's records and media.
“Restore Advanced Backup” replaces only this module's records and media. The
older archive backup remains separate and must still be exported separately.
Large video files can create large JSON backups and may exceed browser memory or
storage limits; keep separate copies of important originals.


ULTIMATE EXPLORER EDITION
-------------------------
New additions:
- Interactive globe visualization with drag rotation and zoom; saved GPS track
  start points are shown as markers when present. This is a stylized canvas globe,
  not a satellite-accurate 3D Earth or a geospatial map.
- Expedition replay for saved GPS tracks from the Advanced Adventure module.
- Drone / aerial / 360-degree panorama / action-camera photo and video gallery.
- Smart organizer with search and sort. It can display original archive photos
  read-only; original archive items must still be managed in My Memories.
- Night-sky journal for Milky Way, aurora, star trails and night landscapes.
- Local travel-story drafting assistant that uses only the notes you enter. No
  external AI model/API is connected; review and personalize every draft.
- Automatic GPS trip summary using recorded route points and timestamps only.
- Documentary project builder with media selection, timed slideshow preview and
  JSON project manifest export. It does not render a finished MP4 video.
- Personal dashboard with metrics derived from Ultimate records and saved GPS
  tracks. No achievements or activity facts are invented.

Ultimate module storage (additive; existing keys and databases are unchanged):
- localStorage: raselOnTheRunUltimateV1
- IndexedDB: RaselOnTheRunUltimateMediaV1 (object store: assets)
The original photo archive is read-only in the Ultimate organizer. It is not
modified, moved or deleted by this module.

ULTIMATE MODULE BACKUP
----------------------
Use “Export Ultimate backup” and “Restore backup” inside Ultimate Explorer.
These actions include only Ultimate module records and uploaded Ultimate media.
They do not replace or silently modify the previous archive, Premium, Human
Experience, Journey Planner, Adventure Explorer or Advanced Adventure backups.
Keep using each existing module's backup/export controls as before.

AUTOMATED TESTS
---------------
With Node.js installed, run from the project folder:
  node --test test-ultimate.js
The tests cover route distance, trip summaries, media classification/sorting,
story drafting and record-derived explorer levels. Also run:
  for f in *.js; do node --check "$f"; done
These are automated logic and syntax tests; they do not replace testing GPS
permissions, media playback, IndexedDB persistence and layout in your browser.

FEATURE LIMITATIONS
-------------------
- GPS replay requires existing saved GPS tracks and location permission.
- The globe is a lightweight interactive spherical visualization, not a
  satellite-accurate globe with live map tiles.
- The story assistant is local template-based drafting, not a connected AI API.
- Documentary preview is a timed slideshow and project manifest, not MP4 export.
- 360-degree media is stored and displayed as a panorama/gallery item; a VR
  headset or full spherical WebGL viewer is not included.
- Large videos and panorama files use browser storage. Export backups regularly.

FINAL JOURNEY COLLECTION (ADDITIVE MODULE)
-----------------------------------------
New features:
- Smart Trip Planner with destination, dates, budget, currency and notes.
- Travel Reservation Vault for booking references and attached PDFs/images.
- Multi-Currency Wallet with user-entered exchange rates. Rates are not live.
- Heritage & Culture Explorer for historic sites, museums, architecture and culture.
- Photography Portfolio Builder with separately stored image uploads.
- Digital Travel Magazine preview and HTML download; use browser Print / Save as PDF.
- Voice Memory Recorder using browser microphone permission and MediaRecorder.
- Annual Explorer Wrapped generated from records saved in this module.
- Bird & Species Journal with optional photo attachments.
- Geological Wonders Collection.
- Coastal & Island Explorer.
- Astronomy & Stargazing Log.
- Then vs Now photo comparison with two separately stored images.

Storage is additive and independent:
- localStorage: raselOnTheRunFinalJourneyV1
- IndexedDB: RaselOnTheRunFinalJourneyMediaV1 (object store: assets)
The module does not overwrite the existing travel archive, GPS, Ultimate Explorer,
Premium, Human Experience, itinerary or adventure storage keys. Attachments for
reservations, portfolio, species, voice recordings and comparison photos are held
in the new IndexedDB database.

FINAL JOURNEY BACKUP
--------------------
Use “Export Final Journey backup” and “Restore Final Journey backup” in the
Final Journey Collection section. This backup includes only this new module's
records and attachments. Continue exporting the older modules using their own
backup controls; this is not a combined backup of every module.

TESTS
-----
From the project folder with Node.js installed:
  node --test test-ultimate.js test-final-journey.js
  for f in *.js; do node --check "$f"; done
The included tests cover core route/media/story helpers and final-module trip
summary formatting, annual counts, HTML escaping, manual currency conversion,
and trip date validation. HTML parsing and script-reference checks were also
performed when packaging. Browser-specific GPS, microphone, IndexedDB, media
playback, printing and responsive layout still require manual browser testing.

LIMITATIONS
-----------
- Currency conversion uses a rate entered by the user; no live FX provider is
  connected.
- Voice recording requires microphone permission and a supported browser.
- Reservation documents and personal records are stored locally in this browser;
  do not store highly sensitive identity or payment documents here.
- Magazine export is HTML for browser printing, not a server-rendered PDF.
- The species journal stores observations; it does not automatically identify
  birds or wildlife.
- The Then vs Now comparison displays two uploaded images; it does not verify
  that they depict the same location.

UNIVERSAL CONTENT MANAGER
-------------------------
The floating “Manage Content” control opens a central editor for saved Rasel On
The Run localStorage collections and existing IndexedDB media libraries.

- Records: select a storage section and collection, edit the complete JSON
  record, save, create, or remove a record.
- Images: attach an image to a record as adminImageData/adminImageName. Existing
  Country / Province / Division / State / City appearance controls remain the
  primary renderer-aware controls for flags and cover images.
- Media: select an existing IndexedDB library/store, edit metadata, replace
  the stored file while preserving its record key, or delete the media record.
- Save operations write to the original collection/database rather than
  migrating legacy data to a new schema.

Before bulk edits or deletes, export each module's existing backup. The content
manager does not automatically merge all independent module backups into one
cloud backup. Browser interaction and media replacement should be verified in
the target browser after installation.

Final visual refinement (November 2026)
- Refined the homepage hero into a full-width cinematic mountain/lake presentation with a dark overlay and responsive typography.
- Refined the primary palette, buttons, navigation, section spacing, focus states, and mobile layout.
- Removed decorative pictographic emoji from interface copy; country flags remain in the country archive.
- Preserved existing sections, scripts, storage keys, and module data structures.
- Validation: all JavaScript files pass node --check; automated test suite passes 18/18; index.html parses successfully.
- Note: visual browser/end-to-end testing still needs to be performed on the user's device. The hero background currently loads from Unsplash and therefore needs an internet connection.

CROSS-DEVICE RESPONSIVE EDITION
-------------------------------
This edition includes responsive CSS refinements for laptop/desktop, Mac,
iPad/tablet, iPhone and Android phone widths, including flexible navigation,
single-column small-screen cards, touch-friendly controls, safe text sizing,
and reduced horizontal overflow.

Important data note:
This is still a static front-end package. Browser LocalStorage and IndexedDB
data are stored separately by each browser/device. Cross-device data sync,
public/private cloud permissions, and remote hosting require the separate
Supabase and Vercel setup. Do not assume data entered on one device appears
on another until that cloud integration is completed and tested.

Validation performed for this package:
- JavaScript syntax checks for all project scripts.
- Existing automated Node tests.
- HTML parsing and local script-reference checks.
- ZIP archive integrity check.
Physical-device browser testing is still recommended before public launch.


LIFETIME TRAVEL DOCUMENTARY
---------------------------
A Lifetime Travel Documentary section is included in the main website.
Create a title and opening line, add dated/location-based chapters, attach
photos or videos, edit or delete chapters, export a standalone HTML
documentary (with attached media embedded), or export a JSON project backup.

Documentary chapter text is stored in this browser's LocalStorage and its
media files in a dedicated IndexedDB database. This means entries are local
to the browser/device until cloud synchronization is implemented. Export
the project backup and keep it safe before changing devices or clearing data.


PREMIUM SEVEN UPDATE
- Added an interactive rotating globe with user-entered coordinate pins, a digital travel passport, a date-sorted journey timeline, a coordinate-based photo-location list, a standalone cinematic HTML journey-film export, an AES-GCM encrypted local private-notes vault, and a Premium Collection JSON backup.
- Premium Seven journey entries and encrypted vault records are stored in this browser only. They do not automatically merge with older country/gallery/documentary records.
- The Supabase panel only saves project URL and public anon key locally as setup details; it does NOT connect or sync data. Real cross-device sync requires Supabase Auth, database tables, Row Level Security, Storage policies, and sync implementation. Never use a service-role key in the browser.
- The encrypted vault uses Web Crypto AES-GCM with PBKDF2 key derivation. It is local to this browser; losing the passphrase means the notes cannot be decrypted. Use HTTPS or localhost.

WORLD ADMINISTRATIVE AREAS
- The Country & Location Explorer now preloads first-level administrative areas for all 50 starter countries (states, provinces, divisions, regions, prefectures, etc.).
- Existing user-created countries, regions, cities, and memories are preserved. Standard names are appended only when a matching region name is not already present.
- Every preloaded region uses the existing region appearance editor: rename it, change its icon, upload/change/remove its background image, and add cities beneath it.
- The bundled administrative-area list is a curated subset adapted from public country/state reference datasets, including dr5hn's Countries States Cities Database (Open Database License, ODbL). Dataset reference: https://github.com/dr5hn/countries-states-cities-database
- Country administrative structures can change over time and some jurisdictions use special administrative arrangements. Review names before relying on them for legal or official purposes.
- The preloaded regions are local to the browser's existing website data. They are not a cloud sync implementation.

REGION DEFAULT BACKGROUND PHOTOS
- Every State / Province / Division / Region card now receives its own destination-search-based default background image using the region and parent-country names.
- An admin-uploaded background image takes priority. Choosing “remove current background” returns the card to its default image.
- Default region photos are loaded from LoremFlickr over the internet; the first load therefore requires an internet connection. If the image service is unavailable, the card displays a clean neutral gradient and the admin can upload a local replacement.

PROFILE DETAILS & DISCREET OWNER CONTROLS
- About Me now displays the provided email address, Toronto location, and a short story about being an international student in Canada with a dream of travelling around the world.
- About Me is available from the far-right corner of the top navigation.
- Photo upload, country creation, and selected edit controls are hidden from public visitors. Use the small Admin control in the top-right corner to create an owner passphrase on first use and unlock these controls on this browser.
- This passphrase is a client-side visibility gate only. It is NOT production-grade authentication or a security boundary: a static website cannot securely protect private data or uploads from technically capable visitors. Before public deployment, use server-side authentication (for example Supabase Auth) and storage/database access policies. Do not store genuinely confidential material in this static build.
- The profile email is intentionally displayed publicly because the owner requested it.


SHORT VIDEO GALLERY
- The My Travel Memories section includes a Short Videos collection.
- Owner-only Add Short Video and Delete controls appear while Admin mode is unlocked.
- Upload accepts browser-supported video files up to 100 MB and 60 seconds each.
- Video clips are stored in IndexedDB on the current browser/device; they are not cloud-synced.
- Clips are displayed on the public website by default. Do not upload private or sensitive videos to a public deployment.
- Video playback depends on browser codec support. MP4 (H.264/AAC) is generally the most compatible format.

MEDIA LIBRARY COUNTER
---------------------
The My Media Library panel counts recognized image and video records across the
website's existing local IndexedDB media stores. It shows photo count, video
count, combined count, approximate stored file size, and a per-section breakdown.
It refreshes on page load, when the browser tab becomes active, after IndexedDB
writes in supported browsers, and when the user selects Refresh totals. Counts
are local to this browser/device and do not include cloud files or other devices
unless those files have been synced into the browser's media stores.

CINEMATIC LUXURY DESIGN UPDATE
- Applied a unified warm-neutral and muted-gold visual system.
- Refined the homepage into a cinematic hero with responsive layout.
- Added sticky translucent navigation and editorial typography hierarchy.
- Standardized borderless cards, image gallery hover treatment, and soft tonal shadows.
- Refined media statistics, controls, focus states, motion, mobile layout, and footer.
- Existing sections, storage modules, and feature scripts are retained.
- External hero imagery and Google Fonts require an internet connection.
- Visual QA should still be performed in current Safari, Chrome, iOS, and Android browsers.


RASel'S ARCHIVE WATERMARK
A subtle Rasel's Archive mountain wordmark is automatically displayed over photos and videos rendered inside the main website content. It is positioned in the top-right corner and is responsive. This is a visual on-page overlay; original uploaded files are not modified and downloads/exports of the original media do not contain the watermark.


FINAL CHECK & DESIGN UPDATE (17 November 2026)
----------------------------------------------
New / changed files: theme-final.css, country-showcase.js, country-reorder.js
(rewritten), advanced-sw.js (rewritten), plus small fixes in script.js,
premium.js and index.html.

- Homepage (desktop): the hero now fills exactly one screen below the header,
  edge to edge, with the text centred. It no longer sits high or looks boxed.
- New colour theme "Twilight Ocean & Sunset": deep navy-ink header and footer,
  warm sand background, sunset (amber to coral) buttons and accents.
- Country cards are now photo cards: each of the 50 starter countries shows a
  famous landmark (Taj Mahal, Eiffel Tower, Mount Everest, Ahsan Manzil ...)
  with its flag, name, landmark caption and buttons laid over the photo.
  Landmark photos are looked up from Wikipedia/Wikimedia Commons when the page
  loads (internet needed) and remembered in this browser. If one is missing,
  a destination photo from LoremFlickr or a colour gradient is used.
- Edit panel (Admin mode): the Edit button on every country, division/state/
  province and city card opens a proper panel: change the name, flag/emoji,
  photo caption, upload your own photo (with preview) or go back to the
  default photo. Your uploaded photos always replace the default photo.
- Homepage cover: in Admin mode use "Change cover photo" (bottom-right of
  the homepage photo) to set your own cover photo or reset it.
- Arrange countries (Admin mode): press "Arrange countries", then hold the
  orange grip on a card and slide it to a new place (works with a finger on
  iPhone/Android/iPad and with a mouse), or use the left/right arrows.
  Press "Done arranging" when finished; "Reset order" restores the default.
  The order is saved in this browser.

Fixes found during the check:
- premium.js crashed on every page load ("admin is not defined"), which
  stopped the Travel Studio media list and 3D globe from loading. Fixed.
- The old "Arrange countries" button could not be switched on with a mouse
  or finger tap (the button was rebuilt mid-click). Fixed; the old drag-and-
  drop also did not work on phones. Replaced with touch-friendly dragging.
- "Remove" buttons on country cards were visible to public visitors. They
  are now shown only in Admin mode, like the Edit buttons.
- Removed starter countries and removed standard divisions/states came back
  after a page reload. They now stay removed.
- The offline service worker served old cached files first, so visitors
  (and you) could keep seeing an old version after an update. It is now
  network-first: the newest files load whenever you are online.
- The editor panel is no longer covered by the "Manage Content" button on
  phones.
- Laptop / iPad-landscape widths (901-1359px): the navigation used to
  overlap the logo and search in Admin mode; it now uses the menu button.
- Added a site icon (favicon). Removed the old *.home-backup and
  *.before-global-theme-fix copies from the package.

Validation: all 34 JavaScript files pass node --check; automated tests pass
18/18; every local script/style reference in index.html resolves; pages were
rendered in Chrome at 390, 1024, 1280, 1440 and 1920 px wide with no
JavaScript errors; editing, photo upload/reset, cover photo, country removal,
and mouse + touch drag reordering (with reload persistence) were exercised in
the browser. Real landmark photos need internet access and were not loaded
during this offline test; please check them once on your own device.

LIVE CLOCKS (world-clock.js)
- The homepage shows the live time in Toronto ("Where I live") and Dhaka
  ("Home"), with the date. A gold dot means daytime, a blue dot night-time.
  Daylight-saving changes are handled automatically by the browser.


PROFESSIONAL WEBSITE UPDATE (17 November 2026)
----------------------------------------------
New files: site-config.js, site-pages.js, site-stories.js, netlify.toml,
vercel.json, robots.txt. Nothing was deleted; every earlier section is kept.

PAGES & MENU
- The site now has five pages: Home, Travels, Study Journey, Stories, About.
  Home is short: cover, welcome, 8 featured countries, a few photos and the
  latest 3 stories, each with a "View all" button.
- In Admin mode a sixth page, "My Toolkit", holds all private tools: travel
  statistics, Travel Studio, planner & yearbook, Adventure / Advanced /
  Ultimate Explorer, Final Journey, Premium collection, backups, etc. It has
  quick links at the top to jump to each tool.
- Search, buttons and links that point to a section open the right page.

WHAT VISITORS SEE
- Visitors see only finished content. Empty sections, "nothing yet" boxes,
  forms, trackers, backup buttons, "Manage Content", "Mark as visited", the
  breadcrumb pill and the Admin button are hidden from them.
- A page with nothing to show yet displays a tidy "Coming soon" card.

OPENING ADMIN MODE
- The Admin button is hidden from visitors. On your devices it stays visible
  once you have used it there. On a NEW device, open your website address with
  #owner at the end, e.g.  https://raselontherun.com/#owner  - the Admin
  button then appears in the top-right of the menu.

STORIES (trip pages)
- Stories page > (Admin mode) "Lifetime Travel Documentary" > Add a chapter:
  title, place, date, type, your story and photos/videos. Each chapter
  becomes a story card; it opens as its own page with a large photo, the
  text, gallery and previous/next links.

CONTACT FORM (About page)
- Your email address is no longer printed on the page.
- To receive messages by email: create a free form at https://formspree.io,
  then put its ID in site-config.js (formspreeId). Until then the form opens
  the visitor's email app with the message ready to send to you.

SHARE PREVIEW
- index.html has Open Graph / Twitter tags, so links shared on WhatsApp,
  Facebook, Messenger, LinkedIn or X show a title, description and photo.
  After the site is online, add your address in og:url (see comment in
  index.html) and in siteUrl in site-config.js.

DESIGN
- One font family across the whole site, one button style across every
  module (teal for actions, sunset-orange for the main action).

PUTTING THE SITE ONLINE (free)
1. Netlify: go to app.netlify.com > Add new site > Deploy manually, and drag
   this whole folder onto the page. (Vercel works too: vercel.com > Add New >
   Project, upload the folder.) netlify.toml / vercel.json are included.
2. Buy a domain (for example raselontherun.com, about 10-20 USD/year) from
   Namecheap, Cloudflare or GoDaddy, then in Netlify/Vercel open Domain
   settings > Add domain and follow the DNS steps. HTTPS is automatic.
3. Open https://your-domain/#owner on your phone and laptop to get the Admin
   button there.

IMPORTANT: WHERE YOUR CONTENT LIVES
Your photos, stories, study entries and edits are saved inside YOUR browser
(LocalStorage / IndexedDB) on the device where you added them. When the site
is online, visitors' browsers do not have that data: they will see the
countries with their landmark photos, the About page and the contact form,
but not your uploaded photos or stories. Visitors also cannot change your
data - anything they do stays in their own browser only. To show your own
photos and stories to everyone, the next step is a "publish" system that
uploads your content to cloud storage (for example Supabase) and a real
owner login. That is a separate, larger piece of work.

"WHERE I'VE BEEN" GLOBE (travel-globe.js) - Travels page
- A globe at the top of the Travels page. Visited countries glow (orange,
  pulsing); the other countries in your archive show as small white dots.
  Shows: countries visited, continents, countries in the archive, and a
  button for each visited country. Tap a light or a button to open that
  country's divisions/states/provinces.
- With internet: a realistic 3D Earth (globe.gl from unpkg.com). Without
  internet or WebGL: a built-in globe drawn by the page itself.
- Which countries glow: edit visitedCountries in site-config.js (every
  visitor sees these). Currently: Bangladesh, Canada, Maldives, Nepal, India. Countries you tick
  with "Mark as visited" in Admin mode are added on your own device as well.


PREMIUM UPDATE (17 November 2026)
---------------------------------
New files: cloud-publish.js, supabase-site.sql, brand.js, premium-ux.js,
language.js, og-image.jpg, apple-touch-icon.png. Changed: travel-globe.js,
country-showcase.js, world-clock.js, site-config.js, theme-final.css.

1. PUBLISH TO THE WEB (owner login + cloud)
   In Admin mode press "Publish" (top menu). Sign in with the email link,
   then "Publish now". Your public content goes online for every visitor:
   countries and their photos, cover photo/video, memories, short videos,
   study journey, stories and About Me. Photos are re-saved first, which
   removes hidden GPS/camera information. NOT published: planner, expenses,
   reservations, encrypted notes, Adventure/Ultimate/Final Journey tools and
   other private toolkit data. Publish again whenever you add something new.
   Visitors who already have the site open get a "Refresh" message.
   "Download published copy" puts the published content onto a new device.

   PUBLISH TO THE WEB – ONE-TIME SETUP (about 10 minutes, free plan is fine)
   a. Create a free account at https://supabase.com and a New project.
   b. SQL Editor > New query > paste everything from supabase-site.sql > Run.
      (Only raselahmmed1520@gmail.com can upload. Change the email in the
      SQL and in site-config.js if you use another one.)
   c. Authentication > Sign In / Providers: make sure Email is enabled.
   d. Authentication > URL Configuration: set Site URL to your website
      address (e.g. https://raselontherun.com) and add the same address to
      Redirect URLs. (For testing on your Mac also add http://localhost:8000)
   e. Project Settings > API: copy the Project URL and the anon / publishable
      key into site-config.js (cloud.supabaseUrl, cloud.supabaseAnonKey).
      Never use the service_role / secret key.
   f. Upload the website again (Netlify/Vercel), open it, Admin > Publish.
   g. Optional: after your first sign-in, turn off "Allow new users to sign
      up" in Authentication settings.
   Note: the free Supabase plan allows files up to 50 MB and 1 GB storage in
   total. Keep videos short. Videos keep their original data (they are not
   re-saved), so avoid videos that contain your home location.

2. PHOTO VIEWER: tap any photo in memories, city galleries, study journey or
   a story to open it full screen. Swipe or use arrows to move between
   photos; swipe down or press Esc to close. Camera file names such as
   "IMG_2041.jpg" are no longer shown to visitors.
3. Cards, stories and sections appear with a gentle animation while
   scrolling (switched off automatically for people who prefer less motion).
4. GLOBE JOURNEY LINE: an animated line from Dhaka to Toronto. Add more trips
   in site-config.js > journeys.
5. LOGO: a new "R + mountain + sun" logo in the header, footer, browser tab,
   phone home screen icon (apple-touch-icon.png) and share card
   (og-image.jpg).
6. MOVING COVER: Admin > "Change cover" accepts a photo OR a short video
   (MP4, 5-15 seconds, no sound, under 60 MB).
7. Opening animation: the logo animates for about one second on the first
   visit of a browser session.
8. Photos are automatically resized when uploaded (longest side 2400 px),
   so the site loads faster and storage lasts longer. Note: resized photos
   no longer carry camera details for "Advanced Photography & EXIF".
9. বাংলা / ENGLISH switch in the header. Public pages, menus, buttons, dates,
   numbers and country names change to Bangla; your own story text stays as
   you wrote it. "My Toolkit" stays in English. The choice is remembered.
10. VISITOR STATISTICS: put a Plausible domain or a Google Analytics ID in
   site-config.js > analytics. Your own devices are never counted.


CITIES + PLACE PHOTOS (17 November 2026)
----------------------------------------
- Checked all 50 countries: each has its own first-level areas (Bangladesh 8
  divisions, Canada 13 provinces/territories, United States 50 states, India
  36 states/union territories, Japan 47 prefectures, Türkiye 81 provinces,
  etc.). Added the missing Abkhazia to Georgia (now 12).
- cities.js adds cities under every province/territory of Canada (466 in
  total: every official city from Wikipedia's "List of cities in Canada"
  plus major towns such as Oakville, Ajax, Whitby, Milton, Banff, Whistler;
  Nova Scotia has no official cities since amalgamation, so its main
  communities such as Halifax and Dartmouth are listed) and under every
  division of Bangladesh (the main town of all 64 districts plus Kuakata,
  Teknaf, Saint Martin's Island, Savar and Sreemangal).
  Ontario: 78. Quebec: 234. Dhaka division: 14. Chattogram division: 13.
- Division / province / state cards and city cards now show a real photo of
  that place from Wikipedia (flags, maps and seals are skipped). Photos load
  as you scroll, and are remembered in the browser. Use Edit on any card to
  replace a photo with your own; your photo always wins.
- Removing a city keeps it removed after reloading.


PHOTO GALLERIES FOR EVERY PLACE (17 November 2026)
--------------------------------------------------
- City pages: your photos appear in a framed photo-book style gallery
  (white frame, rounded corners, soft shadow, rows that fit perfectly).
  It stays fast with hundreds of photos: 60 are shown at a time and more
  load as you scroll; each photo loads only when it comes into view.
- Division / province / state pages show "Photos from <area>" and country
  pages show "Photos from <country>" (all photos from their cities, plus
  photos you add directly to that area or country).
- Only the photos are shown in the gallery. Tap a photo to open it large;
  underneath you see the date it was taken, the place (city, division,
  country) and the caption. Swipe or use the arrows for the next photo.
- The date is read automatically from the camera information when you
  upload (before the photo is resized). If a photo has no camera date, the
  upload date is shown as "Added …"; set the real date with "Edit date &
  caption".
- Admin mode in the photo viewer: Edit date & caption, Use as card cover
  (makes that photo the background of the city/division/country card),
  Delete photo. "+ Add photos" is on every gallery (city, division/state,
  country). Several hundred photos can be added at once; a progress bar
  shows how many are done. Photos are resized automatically.
- Sort: Newest first / Oldest first. Photos without a date are listed last.
- The "Rasel's Archive" mark is shown on the large photo in the viewer
  (not on the small gallery photos, so the gallery stays clean).


VIDEOS + EDIT EVERYTHING (17 November 2026)
-------------------------------------------
VIDEOS (new "Videos" page in the menu; latest cinematic clips also on Home)
- Cinematic: clips up to 15 seconds. They play silently in the grid while
  visible; tap to watch full screen with sound.
- Travel videos: up to 2½ minutes. Cards with a cover frame and length;
  tap to open the player with title, place, date and a short story.
- Admin mode: "+ Add cinematic video" / "+ Add travel video". The website
  checks the length (longer videos are refused with a clear message), makes
  a cover image automatically, and stores the video. In the player: Edit
  video (title, place, date, story, type, replace the video file) and
  Delete video. Videos are included when you press Publish.
- Format: MP4 (H.264) plays on every phone and computer. iPhone "HEVC"
  videos may not play on Windows/Android; export as "Most Compatible".
- Size: the free Supabase plan allows up to 50 MB per file. A 2-minute
  1080p phone video is often bigger; export a 720p copy before publishing.

EDIT EVERYTHING (Admin mode only — visitors never see these buttons)
- Homepage cover: "Edit text" (small line, two title lines, description)
  and "Change cover" (photo or video).
- Welcome block and every page title banner: "Edit text" (+ Restore original).
- Countries / divisions / states / cities: Edit (name, flag, caption,
  photo upload / reset to default), Remove, Add, Arrange countries.
- Photos (city, division, country and My Travel Memories): + Add photos;
  in the photo viewer: Edit date & caption, Use as card cover (or homepage
  cover from My Travel Memories), Delete photo.
- Study Journey: Edit on every entry (level, years, school, title, story,
  add photos, remove single photos, delete entry).
- Stories: write, edit and delete chapters (Stories page, Admin mode).
- About Me: Edit About Me and Change Photo.
- Videos: add, edit, replace, delete.
- An automatic check visited every page and every country/division/city
  level as a visitor (phone and desktop): no owner button is visible.


NEW FEATURES (17 November 2026)
------------------------------------
New files: extras.js, timeline.js, photo-map.js.

1. PHOTO MAP (Travels page): a pin for every city that has photos, with the
   number of photos. Tap a pin > "Open photos". City positions come from
   Wikipedia; the map uses Leaflet with OpenStreetMap/CARTO tiles (internet
   needed). On phones, tap "Tap to move the map" first so the page still
   scrolls normally.
2. TIMELINE (new menu item): photos, videos and stories grouped by month,
   newest first, with a year selector.
3. YEAR IN TRAVELS (top of Timeline): photos, videos, stories, cities and
   countries for the chosen year, the most photographed places, and
   "Download year card" (a 1080x1350 image for Instagram/Facebook/WhatsApp;
   on phones it opens the share menu).
4. BEST SHOTS (Home): in the photo viewer (Admin mode) choose
   "☆ Add to Best shots". Up to 18 favourite photos appear on the home page.
5. THEN & NOW (Stories page): Admin > "+ Add Then & Now": an old and a new
   photo of the same place; visitors drag the line to compare. Edit/Delete.
(Likes, Share buttons and per-photo/video/story links were removed on
 request; photos, videos and stories simply open in place.)
6. NEXT TRIP COUNTDOWN (Home): Admin > "Set next trip": place, start date,
   optional end date and note. Shows "123 days to go", then "Now
   travelling" during the trip, and hides itself afterwards.
7. WISHLIST ON THE GLOBE: Admin > "Edit visited & wishlist" on the globe.
   Tick the countries you have visited and the ones you want to visit
   (search box included). Wishlist countries glow light blue.
All of these are included when you press Publish.


SEVEN NEW THEMED FEATURES (17 November 2026)
--------------------------------------------
New files: passport.js, trip-routes.js, panorama.js, food-diary.js,
seasons.js, photo-book.js, theme-mode.js. All are published with "Publish".

1. PASSPORT STAMPS (Travels page, under the globe)
   One ink stamp for every country ticked as "Visited" on the globe. The
   date comes from your oldest photo of that country. Admin: ✎ on a stamp
   to set the arrival date, entry point (e.g. Toronto Pearson Airport),
   ink colour and shape. Visitors tap a stamp to open that country.
2. DARK MODE (moon / sun button in the header, for everyone)
   Every visitor can switch; the choice is remembered on their device.
   Older sections are darkened automatically as well.
3. FOOD DIARY (Stories page)
   Admin: "+ Add food" — dish, restaurant/city, country, date, 1–5 stars,
   note and photo. Visitors can filter by country and open each dish.
4. 360° VIEWS (Travels page, after the photos)
   Admin: "+ Add 360° view". Works with phone panoramas (wide or full
   circle) and with photos from a 360° camera (twice as wide as tall —
   look up and down too). Drag, pinch/scroll to zoom, ⟳ auto-rotate, and
   📱 on phones to look around by moving the phone. Kept at higher
   quality (up to 6000 px) so they stay sharp.
5. TRIP ROUTES (Travels page)
   Admin: "+ Add trip route" — trip name, date, how you travelled and the
   stops, one per line (Dhaka, Bangladesh / Doha, Qatar / Toronto, Canada).
   Places are found on Wikipedia when you save; if one is not found write
   it as: Sreemangal | 24.31, 91.73. The route draws itself with a moving
   plane / car / train / boat, shows the distance and every stop.
   "Mixed" uses flights for long legs (over 700 km) and roads for short ones.
6. SEASONAL THEMES (homepage cover)
   Changes by date: snow in winter, blossom petals in spring, sparkles in
   summer, falling leaves in autumn, plus greetings on New Year, Eid
   al-Fitr, Eid al-Adha (expected dates, may differ by a day), Pohela
   Boishakh, Independence Day, Victory Day and Canada Day.
   Admin: "✦ Season" on the cover — Automatic / Off / choose one, and an
   optional greeting of your own (for example on your birthday).
7. PHOTO BOOK (owner only: My Toolkit, or "📖 Photo book" on the Timeline)
   Choose all photos, a year or a country, a layout (1, 2 or 4 photos per
   page) and A4 or Letter. You get a preview with a cover, contents, a
   chapter page per country, place and date under each photo, and an end
   page. Press "Print / Save as PDF" and choose "Save as PDF".

HEADER ORDER (17 November 2026)
Home · Travel Destinations · Stories · Timeline · Study Journey · My Toolkit ·
Add Photos · Videos · Publish · About Me · Admin
(My Toolkit, Add Photos, Publish and Admin are shown only to you.)
If the row does not fit on a screen (owner buttons, Bangla), the header
switches to the ☰ menu button by itself, in the same order.

DEVICE POLISH (17 November 2026)
Checked on 11 screen sizes: small Android (360), Android (412), iPhone (390),
iPhone SE (320), iPad (820 / 1180), laptop (1280), MacBook Air (1470),
MacBook Pro 16" (1728), desktop (1920) and 4K (2560).
- Nothing is wider than the screen on any device, so phones never zoom out.
- Phones: one-row header (logo + name on the left, buttons on the right).
- Small labels and intro text grow with the screen, so nothing is tiny.
- Big monitors and MacBooks: pages use more of the screen with larger text,
  and photo / food / 360° / stamp grids get bigger cards.

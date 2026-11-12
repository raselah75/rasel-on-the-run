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

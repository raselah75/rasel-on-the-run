/* =====================================================================
   RASEL ON THE RUN — DEMO CONTENT (owner only)
   The first time you open the site in Admin mode after this update,
   every EMPTY public tool gets 2 example entries written in your style
   (Journey Plan tools, Trail / Parks / Wildlife / Weather records, Night
   sky, Heritage, Geology, Coast, Astronomy, Birds, Passport places,
   Souvenirs and photo tools with a made-up "demo" picture, Study Journey).
   Then press Publish and everything is public. Edit or delete any entry
   later — they are normal entries.
   Never touched: private tools (expenses, wallet, reservations, encrypted
   notes, journal, safety), the guestbook, the contact form and anything
   that already has your own entries.
   Settings → "✨ Fill empty tools with demo content" runs it again.
   ===================================================================== */
(() => {
  'use strict';
  const DONE_KEY = 'raselOnTheRunDemoFilledV1';
  const isAdmin = () => document.body.classList.contains('admin-mode');
  const SKIP_FORMS = /guestbook|contact|login|unlock|vault|password|journal|safety|uxStoryForm|ltdChapter/i;
  const SKIP_SECTIONS = new Set(['rnrGuestbook', 'contact', 'humanJournal', 'lifetimeDocumentary', 'rnrMaintenancePanel']);
  const pick = a => a[Math.floor(Math.random() * a.length)];

  const PLACES = ['Sajek Valley, Rangamati', 'Ratargul, Sylhet', 'Cox\'s Bazar', 'Kuakata', 'Sundarbans, Khulna', 'Banff, Alberta', 'Algonquin Park, Ontario', 'Niagara Falls', 'Old Quebec', 'Bandarban', 'Srimangal', 'Tofino, BC'];
  const TITLES = {
    trip: ['Eid trip to Sylhet tea gardens', 'Rocky Mountains road week', 'Monsoon weekend in Bandarban', 'Autumn colours in Algonquin'],
    route: [['Toronto', 'Montreal'], ['Dhaka', 'Sylhet'], ['Calgary', 'Banff'], ['Chattogram', 'Bandarban']],
    activity: ['Sunrise hike to the ridge', 'Kayaking the quiet lake', 'Morning trail run', 'Boat ride through the mangroves'],
    trail: ['Keokradong summit trail', 'Johnston Canyon', 'Bruce Trail — Niagara section', 'Lawachara forest loop'],
    camp: ['Two nights by the lake', 'Hill-top tent under the stars', 'Riverside camp', 'Winter cabin camp'],
    road: ['Coast road to Kuakata', 'Icefields Parkway drive', 'Hill tracts loop', 'Lake Ontario shoreline'],
    hidden: ['Secret waterfall near Nafakhum', 'Quiet beach at Inani', 'Forgotten rajbari', 'Hidden lookout above the falls'],
    challenge: ['Visit all 64 districts', 'Hike 100 km this year', 'See the northern lights', 'Camp in every season'],
    moment: ['Golden sunset at Kuakata', 'Misty sunrise in Sajek', 'Pink dusk over Lake Louise', 'Sunrise on the Sundarbans river'],
    wildlife: ['Royal Bengal tiger tracks', 'Black bear by the road', 'Spotted deer herd', 'Kingfisher on the riverbank'],
    park: ['Lawachara National Park', 'Banff National Park', 'Madhabkunda Waterfall', 'Algonquin Provincial Park'],
    night: ['Milky Way over the hills', 'Full moon on the sea', 'Meteor shower night', 'Clear winter sky'],
    heritage: ['Ahsan Manzil', 'Somapura Mahavihara', 'Old Quebec walls', 'Sixty Dome Mosque'],
    bird: ['Common kingfisher', 'Blue jay', 'Oriental magpie-robin', 'Canada goose'],
    geo: ['Lake Louise moraine', 'Nilgiri cliffs', 'Niagara Escarpment', 'Sitakunda hills'],
    coast: ['Saint Martin\'s Island', 'Inani Beach', 'Peggy\'s Cove', 'Kuakata sea beach'],
    astro: ['Saturn rings through a small scope', 'Orion nebula', 'Total lunar eclipse', 'Jupiter and its moons'],
    souvenir: ['Hand-woven Jamdani piece', 'Maple syrup bottle', 'Tea from Srimangal', 'Clay pot from Bogura'],
    media: ['Drone view of the tea hills', 'River bend from above', 'Waterfall in the monsoon', 'City lights at night'],
    portfolio: ['Fishermen at dawn', 'Mountain reflection', 'Street life in Old Dhaka', 'Autumn forest road'],
    compare: ['My first visit vs now', 'The same lake, 5 years later']
  };
  const NOTES = ['A demo entry — replace this with your own memory.', 'Example text: what you saw, how it felt and one tip for the next traveller.', 'Demo: the light, the people and the road there. Edit me any time.', 'Sample note. Write the real story here later.'];

  // ---------- which kind of form is this? ----------
  function kindOf(form) {
    const id = `${form.id} ${form.closest('[class*=card],[class*=panel],[class*=block]')?.querySelector('h2,h3')?.textContent || ''} ${[...form.elements].map(e => e.name).join(' ')}`.toLowerCase();
    if (/souvenir/.test(id)) return 'souvenir';
    if (/route|from to/.test(id) && /\bfrom\b/.test(id) && !/stops/.test(id)) return 'route';
    if (/stops/.test(id)) return 'road';
    if (/trip|itinerary|destination/.test(id)) return 'trip';
    if (/trail/.test(id)) return 'trail';
    if (/activity/.test(id)) return 'activity';
    if (/nights|gear/.test(id)) return 'camp';
    if (/target|challenge|proof/.test(id)) return 'challenge';
    if (/\btime\b/.test(id) && /weather/.test(id)) return 'moment';
    if (/subject|wildlife/.test(id)) return 'wildlife';
    if (/park|waterfall/.test(id)) return 'park';
    if (/temperature|precipitation/.test(id)) return 'weather';
    if (/night/.test(id)) return 'night';
    if (/heritage/.test(id)) return 'heritage';
    if (/bird/.test(id)) return 'bird';
    if (/geo/.test(id)) return 'geo';
    if (/coast/.test(id)) return 'coast';
    if (/astro|object/.test(id)) return 'astro';
    if (/portfolio/.test(id)) return 'portfolio';
    if (/before after|compare/.test(id)) return 'compare';
    if (/drone|media|uxmedia|axmedia/.test(id)) return 'media';
    if (/hidden|status kind|kind status/.test(id)) return 'hidden';
    if (/p7journey|lat lon/.test(id)) return 'passport';
    if (/study/.test(id)) return 'study';
    if (/story/.test(id) && /mood/.test(id)) return 'storyhelp';
    return 'generic';
  }

  // ---------- made-up demo picture ----------
  async function demoImage(label, n) {
    const c = document.createElement('canvas'); c.width = 1200; c.height = 800;
    const g = c.getContext('2d');
    const hues = [[196, 40], [24, 160], [150, 200], [280, 330]][n % 4];
    const grad = g.createLinearGradient(0, 0, 1200, 800); grad.addColorStop(0, `hsl(${hues[0]} 55% 32%)`); grad.addColorStop(1, `hsl(${hues[1]} 65% 62%)`);
    g.fillStyle = grad; g.fillRect(0, 0, 1200, 800);
    g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.arc(930, 220, 110, 0, 6.283); g.fill();
    g.fillStyle = 'rgba(10,24,36,.55)'; g.beginPath(); g.moveTo(0, 800); g.lineTo(0, 560); g.lineTo(260, 380); g.lineTo(470, 540); g.lineTo(720, 330); g.lineTo(1200, 600); g.lineTo(1200, 800); g.fill();
    g.fillStyle = '#fff'; g.font = '800 54px system-ui, sans-serif'; g.fillText(String(label).slice(0, 34), 60, 690);
    g.font = '600 28px system-ui, sans-serif'; g.fillStyle = 'rgba(255,255,255,.85)'; g.fillText('DEMO PHOTO — replace with your own', 60, 740);
    const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.86));
    return new File([blob], `demo-${Date.now()}-${n}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
  }

  const iso = d => d.toISOString().slice(0, 10);
  function dates(n) {
    const start = new Date(); start.setDate(start.getDate() - 40 - n * 95);
    const end = new Date(start); end.setDate(end.getDate() + 4);
    return { start: iso(start), end: iso(end) };
  }
  function set(el, value) {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async function fillOnce(form, n) {
    const kind = kindOf(form);
    const pool = TITLES[kind] || TITLES.trip;
    const t = pool[n % pool.length];
    const place = PLACES[(n * 3 + kind.length) % PLACES.length];
    const { start, end } = dates(n);
    for (const el of form.elements) {
      if (!el.name && !el.id) continue;
      const name = `${el.name} ${el.id}`.toLowerCase();
      const type = (el.type || '').toLowerCase();
      if (['submit', 'button', 'reset', 'hidden', 'password'].includes(type) || el.disabled) continue;
      if (type === 'file') {
        if (/video/.test(el.accept || '') && !/image/.test(el.accept || '')) return false; // needs a real video
        const dt = new DataTransfer(); dt.items.add(await demoImage(Array.isArray(t) ? t.join(' → ') : t, n + (/after/.test(name) ? 1 : 0)));
        el.files = dt.files; el.dispatchEvent(new Event('change', { bubbles: true }));
        continue;
      }
      if (type === 'checkbox' || type === 'radio') { if (type === 'checkbox' && /favou?rite|public|show/.test(name)) { el.checked = true; el.dispatchEvent(new Event('change', { bubbles: true })); } continue; }
      if (el instanceof HTMLSelectElement) { const opts = [...el.options].filter(o => o.value && !o.disabled); if (opts.length) set(el, opts[(n + 1) % opts.length].value); continue; }
      let v = '';
      if (type === 'date') v = /end|completed/.test(name) ? end : /due/.test(name) ? iso(new Date(Date.now() + 120 * 864e5)) : start;
      else if (type === 'time') v = pick(['05:48', '06:12', '17:55', '18:20']);
      else if (type === 'number') v = /lat/.test(name) ? '23.81' : /lon|lng/.test(name) ? '90.41' : /rating/.test(name) ? '5' : /elev/.test(name) ? String(800 + n * 410) : /gain/.test(name) ? String(350 + n * 120) : /distance/.test(name) ? String(6 + n * 7) : /duration|hour/.test(name) ? String(2 + n) : /night/.test(name) ? '2' : /temp/.test(name) ? String(14 + n * 5) : /wind/.test(name) ? '12' : /precip/.test(name) ? '3' : /count/.test(name) ? String(2 + n) : /budget|amount/.test(name) ? '' : '3';
      else if (type === 'url') v = `https://maps.google.com/?q=${encodeURIComponent(place)}`;
      else if (type === 'email' || type === 'tel') continue;
      else if (/^from\b| from/.test(name)) v = Array.isArray(t) ? t[0] : 'Toronto';
      else if (/^to\b| to\b/.test(name) && !/total|photo/.test(name)) v = Array.isArray(t) ? t[1] : 'Montreal';
      else if (/institution/.test(name)) v = pick(['Cumilla Zilla School', 'Cumilla Victoria College', 'Seneca College, Toronto']);
      else if (/period/.test(name)) v = pick(['2014 – 2016', '2016 – 2018', '2023 – now']);
      else if (/place|location|destination|city|country|where/.test(name)) v = /country/.test(name) ? pick(['Bangladesh', 'Canada']) : place;
      else if (/title|name|trail|subject|dish|label/.test(name)) v = Array.isArray(t) ? `${t[0]} → ${t[1]}` : t;
      else if (/transport|vehicle/.test(name)) v = pick(['Bus + walking', 'Rental car', 'Train', 'Boat']);
      else if (/stay/.test(name)) v = pick(['Hill resort', 'Small guesthouse', 'Tent', 'Hostel']);
      else if (/weather|condition/.test(name)) v = pick(['Clear and cool', 'Light rain', 'Foggy morning', 'Sunny']);
      else if (/target/.test(name)) v = pick(['64 districts', '100 km', '1 night']);
      else if (/stops/.test(name)) v = 'Two tea stops, one viewpoint, lunch by the river';
      else if (/gear/.test(name)) v = 'Tent, sleeping bag, head torch, rain jacket';
      else if (/highlight/.test(name)) v = 'Sunrise above the clouds and a cup of tea with the locals';
      else if (/challenge/.test(name)) v = 'The steep climb in the rain';
      else if (/lesson/.test(name)) v = 'Start early and pack light';
      else if (/caption/.test(name)) v = 'Demo caption — tell the story of this photo.';
      else v = pick(NOTES);
      set(el, v);
    }
    // Some required fields may still be empty (unknown names): give them text.
    [...form.elements].filter(e => e.required && !e.value && !['file', 'checkbox', 'radio'].includes(e.type) && e.type !== 'password').forEach(e => set(e, e.type === 'number' ? '1' : 'Demo'));
    if (!form.checkValidity()) return false;
    form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    await new Promise(r => setTimeout(r, 350));
    return true;
  }

  // A form is "empty" when the list it feeds shows no entries yet.
    // Where each form saves, so a tool that already has entries is left alone.
  const TARGETS = {
    nxTripForm: ['raselOnTheRunNextUpgradeV1', 'trips'], nxRouteForm: ['raselOnTheRunNextUpgradeV1', 'routes'], nxSouvenirForm: ['raselOnTheRunNextUpgradeV1', 'souvenirMeta'],
    uxNightForm: ['raselOnTheRunUltimateV1', 'collections'],
    fjTripForm: ['raselOnTheRunFinalJourneyV1', 'trips'], fjHeritageForm: ['raselOnTheRunFinalJourneyV1', 'heritage'], fjBirdForm: ['raselOnTheRunFinalJourneyV1', 'birds'],
    fjGeoForm: ['raselOnTheRunFinalJourneyV1', 'geology'], fjCoastalForm: ['raselOnTheRunFinalJourneyV1', 'coastal'], fjAstroForm: ['raselOnTheRunFinalJourneyV1', 'astronomy'],
    fjPortfolioForm: ['raselOnTheRunFinalJourneyV1', 'portfolio'], fjCompareForm: ['raselOnTheRunFinalJourneyV1', 'comparisons'],
    p7JourneyForm: ['raselOnTheRunPremiumSevenV1', 'journeys'], studyEntryForm: ['raselOnTheRunStudyJourneyV1', null]
  };
  function targetOf(form) {
    if (form.dataset.advForm) return ['raselOnTheRunAdventureV1', form.dataset.advForm];
    if (form.dataset.axForm) return ['raselOnTheRunAdvancedExplorerV1', form.dataset.axForm];
    return TARGETS[form.id] || null;
  }
  function hasEntries(form) {
    const t = targetOf(form);
    if (t) {
      try { const d = JSON.parse(localStorage.getItem(t[0]) || 'null'); const list = t[1] ? d?.[t[1]] : d; return Array.isArray(list) && list.length > 0; } catch { return true; }
    }
    const box = form.closest('.adv-grid, .ax-card, .fj-panel, .ux-panel, .next-grid, .p7-grid, .study-journey, section');
    if (!box) return true;
    return [...box.querySelectorAll('button, [role=button]')].some(b => !form.contains(b) && /delete|remove|✕|🗑/i.test(`${b.textContent} ${b.getAttribute('aria-label') || ''} ${b.title || ''} ${Object.keys(b.dataset).join(' ')}`));
  }

  async function run({ force = false } = {}) {
    if (!isAdmin()) return 0;
    const forms = [...document.querySelectorAll('main > section form')].filter(f => {
      const sec = f.closest('main > section');
      if (!sec || SKIP_SECTIONS.has(sec.id)) return false;
      if (f.closest('.rnr-private-block, .rnr-tk-hidden')) return false;
      const label = `${f.id} ${f.className} ${f.closest('[class*=card],[class*=panel],[class*=block]')?.querySelector('h2,h3')?.textContent || ''}`;
      if (SKIP_FORMS.test(label)) return false;
      if ([...f.elements].some(e => e.type === 'password')) return false;
      return [...f.elements].some(e => ['text', 'textarea', 'date'].includes(e.type) || e.tagName === 'TEXTAREA');
    });
    let added = 0, tools = 0;
    for (const form of forms) {
      if (!force && hasEntries(form)) continue;
      let ok = 0;
      for (let n = 0; n < 2; n += 1) { try { if (await fillOnce(form, n)) ok += 1; } catch (e) { console.warn('Demo fill skipped a form:', e.message); } }
      if (ok) { tools += 1; added += ok; }
    }
    try { localStorage.setItem(DONE_KEY, new Date().toISOString()); } catch {}
    window.dispatchEvent(new CustomEvent('rnr:photos-changed'));
    toast(`✨ ${added} demo entries added in ${tools} tools. Edit anything you like, then press Publish.`);
    return added;
  }

  function toast(text) {
    const t = document.createElement('div');
    t.className = 'rnr-demo-toast'; t.setAttribute('role', 'status'); t.textContent = text;
    document.body.append(t); setTimeout(() => t.classList.add('is-out'), 6500); setTimeout(() => t.remove(), 7200);
  }

  // Button on the Settings page
  function addButton() {
    const host = document.getElementById('rnrMaintenancePanel');
    if (!host || host.querySelector('.rnr-demo-btn')) return;
    const wrap = document.createElement('div');
    wrap.className = 'rnr-demo-box';
    wrap.innerHTML = `<div><b>Demo content</b><p>Adds 2 example entries to every empty public tool (never the private ones), so the whole site has something to publish. Edit or delete them later.</p></div><button type="button" class="rnr-demo-btn">✨ Fill empty tools with demo content</button>`;
    host.prepend(wrap);
    wrap.querySelector('button').addEventListener('click', async e => { e.currentTarget.disabled = true; await run(); e.currentTarget.disabled = false; });
  }

  // First time in Admin mode after this update: fill automatically once.
  let started = false;
  function maybeAuto() {
    addButton();
    if (started || !isAdmin()) return;
    try { if (localStorage.getItem(DONE_KEY)) return; } catch { return; }
    started = true;
    setTimeout(() => run(), 2500);
  }
  new MutationObserver(maybeAuto).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  window.RNR_DEMO = { run };
  if (document.readyState === 'complete') maybeAuto(); else addEventListener('load', maybeAuto, { once: true });
})();

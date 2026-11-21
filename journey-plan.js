/* =====================================================================
   RASEL ON THE RUN — MY JOURNEY PLAN (public page)
   Shows the trips, plans and adventures you write in My Toolkit as tidy
   cards (text only, no photos):
     Plans      — Journey Itinerary, Smart Trip Planner
     Trips      — Epic Road Trips, Travel Routes, Camping
     Adventures — Adventure Activities, Mountain & Hiking, Trail Database,
                  Challenges & Achievements
     Nature     — Hidden Places, National Parks & Waterfalls, Wildlife,
                  Sunrise & Sunset
   Private tools (expenses, wallet, reservations, safety / emergency
   numbers, journals, GPS tracks) are never shown here.
   Only the fields listed below are copied into a public copy
   (raselOnTheRunJourneyPlanPublicV1), which is what "Publish" sends.
   ===================================================================== */
(() => {
  'use strict';
  const main = document.querySelector('main');
  if (!main || document.getElementById('rnrJourneyPlan')) return;
  const PUBLIC_KEY = 'raselOnTheRunJourneyPlanPublicV1';
  const isAdmin = () => document.body.classList.contains('admin-mode');
  const bn = () => document.documentElement.lang === 'bn';
  const T = (en, b) => (bn() ? b : en);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const json = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } };
  const num = n => (bn() ? String(n).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]) : String(n));
  const clean = v => String(v ?? '').trim();
  const has = v => clean(v) !== '' && clean(v) !== '0';
  const safeUrl = u => (/^https?:\/\//i.test(clean(u)) ? clean(u) : '');

  // ---------- Where the information comes from ----------
  const SOURCES = [
    { key: 'raselOnTheRunNextUpgradeV1', list: 'trips', cat: 'plan', edit: 'nextTravelUpgrade', map: r => ({
      type: 'Trip plan', title: r.title, place: r.destination, start: r.start, end: r.end,
      facts: [['Transport', r.transport], ['Stay', r.stay]], notes: r.plan }) },
    { key: 'raselOnTheRunFinalJourneyV1', list: 'trips', cat: 'plan', edit: 'finalJourneyPack', map: r => ({
      type: 'Trip plan', title: r.title, place: r.destination, start: r.startDate, end: r.endDate, facts: [], notes: r.notes }) },
    { key: 'raselOnTheRunNextUpgradeV1', list: 'routes', cat: 'trip', edit: 'nextTravelUpgrade', map: r => ({
      type: 'Route', title: [r.from, r.to].filter(has).join(' → '), start: r.date, facts: [['By', r.mode]], notes: r.notes, link: r.map }) },
    { key: 'raselOnTheRunAdventureV1', list: 'roadtrips', cat: 'trip', edit: 'adventureExplorer', map: r => ({
      type: 'Road trip', title: r.title, place: [r.from, r.to].filter(has).join(' → '), start: r.date,
      facts: [['Distance', has(r.distance) && `${r.distance} km`], ['Vehicle', r.transport], ['Stops', r.stops]], notes: r.notes, link: r.map }) },
    { key: 'raselOnTheRunAdventureV1', list: 'camping', cat: 'trip', edit: 'adventureExplorer', map: r => ({
      type: 'Camping', title: r.title, place: r.place, start: r.start, end: r.end,
      facts: [['Nights', r.nights], ['Weather', r.weather]], notes: r.notes }) },
    { key: 'raselOnTheRunAdventureV1', list: 'activities', cat: 'adventure', edit: 'adventureExplorer', map: r => ({
      type: r.activity || 'Adventure', title: r.title, place: r.place, start: r.date,
      facts: [['Distance', has(r.distance) && `${r.distance} km`], ['Time', has(r.duration) && `${r.duration} h`], ['Difficulty', r.difficulty]], notes: r.notes }) },
    { key: 'raselOnTheRunAdventureV1', list: 'elevation', cat: 'adventure', edit: 'adventureExplorer', map: r => ({
      type: 'Hike', title: r.trail, place: r.place, start: r.date,
      facts: [['Highest point', has(r.elevation) && `${r.elevation} m`], ['Climb', has(r.gain) && `${r.gain} m`], ['Distance', has(r.distance) && `${r.distance} km`], ['Time', has(r.duration) && `${r.duration} h`]], notes: r.notes }) },
    { key: 'raselOnTheRunAdvancedExplorerV1', list: 'trails', cat: 'adventure', edit: 'advancedAdventure', map: r => ({
      type: 'Trail', title: r.name, place: r.location, start: r.visited,
      facts: [['Difficulty', r.difficulty], ['Distance', has(r.distance) && `${r.distance} km`], ['Highest point', has(r.elevation) && `${r.elevation} m`], ['Climb', has(r.gain) && `${r.gain} m`]], notes: r.notes }) },
    { key: 'raselOnTheRunAdventureV1', list: 'challenges', cat: 'adventure', edit: 'adventureExplorer', map: r => ({
      type: 'Challenge', title: r.title, start: r.completed || r.due, status: r.status,
      facts: [['Category', r.category], ['Goal', r.target], ['Progress', r.status]], notes: r.notes }) },
    { key: 'raselOnTheRunAdventureV1', list: 'hidden', cat: 'nature', edit: 'adventureExplorer', map: r => ({
      type: r.kind || 'Hidden place', title: r.title, place: r.place, start: r.date, status: r.status,
      facts: [['Status', r.status]], notes: r.notes, link: r.map }) },
    { key: 'raselOnTheRunAdvancedExplorerV1', list: 'parks', cat: 'nature', edit: 'advancedAdventure', map: r => ({
      type: r.type || 'Park', title: r.name, place: [r.location, r.country].filter(has).join(', '), start: r.date, status: r.status,
      facts: [['Status', r.status], ['Rating', has(r.rating) && `${'★'.repeat(Math.max(0, Math.min(5, Math.round(Number(r.rating) || 0))))}`]], notes: r.notes, link: r.map }) },
    { key: 'raselOnTheRunAdvancedExplorerV1', list: 'nature', cat: 'nature', edit: 'advancedAdventure', map: r => ({
      type: r.kind || 'Wildlife', title: r.subject, place: r.location, start: r.date, facts: [['Seen', r.count]], notes: r.notes }) },
    { key: 'raselOnTheRunAdventureV1', list: 'moments', cat: 'nature', edit: 'adventureExplorer', map: r => ({
      type: r.kind || 'Sunrise & sunset', title: r.title, place: r.place, start: r.date, facts: [['Time', r.time], ['Weather', r.weather]], notes: r.notes }) }
  ];
  const SOURCE_KEYS = [...new Set(SOURCES.map(s => s.key))];
  const CAT_TEXT = {
    plan: ['Trips I am getting ready for.', 'যে ভ্রমণগুলোর প্রস্তুতি চলছে।'],
    trip: ['Road trips, routes and nights outdoors.', 'রোড ট্রিপ, রুট আর খোলা আকাশের নিচের রাত।'],
    adventure: ['Hikes, trails, activities and challenges.', 'হাইকিং, ট্রেইল, অ্যাডভেঞ্চার আর চ্যালেঞ্জ।'],
    nature: ['Waterfalls, parks, wildlife and hidden places.', 'ঝরনা, পার্ক, বন্যপ্রাণী আর লুকানো জায়গা।']
  };
  const CATS = {
    all: ['All', 'সব'], plan: ['Plans', 'পরিকল্পনা'], trip: ['Trips', 'ভ্রমণ'], adventure: ['Adventures', 'অ্যাডভেঞ্চার'], nature: ['Nature & places', 'প্রকৃতি ও জায়গা']
  };
  const ICONS = {
    plan: '<svg viewBox="0 0 24 24"><path d="M7 2v3M17 2v3M3.5 9h17M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><path d="M8 13h3M8 17h6" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
    trip: '<svg viewBox="0 0 24 24"><path d="M12 2c.8 0 1.4.7 1.4 1.5V9l7.6 4.6v2l-7.6-2.3v4.9l2.2 1.6V21L12 20l-3.6 1v-1.2l2.2-1.6v-4.9L3 15.6v-2L10.6 9V3.5C10.6 2.7 11.2 2 12 2z" fill="currentColor"/></svg>',
    adventure: '<svg viewBox="0 0 24 24"><path d="M2 20 9 7l4 7 2-3 7 9z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/><path d="M9 7 7.5 9.8 9 9l1.4.9" fill="currentColor"/></svg>',
    nature: '<svg viewBox="0 0 24 24"><path d="M12 22V11M12 11c0-5 3-8 8-9 0 6-3 9-8 9zM12 14c0-4-2.5-6.5-7-7 0 5 2.5 7 7 7z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/></svg>'
  };
  const LABEL_BN = { 'Trip plan': 'ভ্রমণ পরিকল্পনা', 'Route': 'রুট', 'Road trip': 'রোড ট্রিপ', 'Camping': 'ক্যাম্পিং', 'Hike': 'হাইকিং', 'Trail': 'ট্রেইল', 'Challenge': 'চ্যালেঞ্জ',
    'Transport': 'যাতায়াত', 'Stay': 'থাকা', 'By': 'মাধ্যম', 'Distance': 'দূরত্ব', 'Vehicle': 'গাড়ি', 'Stops': 'পথের থামা', 'Nights': 'রাত', 'Weather': 'আবহাওয়া', 'Time': 'সময়',
    'Difficulty': 'কঠিনতা', 'Highest point': 'সর্বোচ্চ উচ্চতা', 'Climb': 'উঠেছি', 'Category': 'ধরন', 'Goal': 'লক্ষ্য', 'Progress': 'অগ্রগতি', 'Status': 'অবস্থা', 'Rating': 'রেটিং', 'Seen': 'দেখা গেছে' };
  const L = s => (bn() && LABEL_BN[s]) || s;

  const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const PLANNED = /want|wish|plan|not started|in progress|upcoming|someday/i;

  function collectFromSources() {
    const items = [];
    SOURCES.forEach(src => {
      const data = json(src.key);
      const list = data && Array.isArray(data[src.list]) ? data[src.list] : [];
      list.forEach((r, i) => {
        if (!r || typeof r !== 'object') return;
        const m = src.map(r);
        if (!has(m.title)) return;
        items.push({
          id: `${src.list}-${r.id || i}`, cat: src.cat, edit: src.edit, type: clean(m.type), title: clean(m.title).slice(0, 120),
          place: clean(m.place).slice(0, 140), start: clean(m.start).slice(0, 10), end: clean(m.end).slice(0, 10), status: clean(m.status),
          facts: (m.facts || []).filter(f => f && f[1] && has(f[1])).map(f => [f[0], clean(f[1]).slice(0, 160)]),
          notes: clean(m.notes).slice(0, 1200), link: safeUrl(m.link)
        });
      });
    });
    return items;
  }

  // Example journeys shown until real ones are added in My Toolkit (then only the real ones show).
  const S = (cat, edit, type, title, place, start, end, facts, notes, status = '') => ({ id: `sample-${cat}-${title.replace(/\W+/g, '-').toLowerCase()}`, cat, edit, type, title, place, start, end, status, facts, notes, link: '', sample: true });
  const SAMPLE = [
    S('plan', 'finalJourneyPack', 'Trip plan', 'Home for Eid — Dhaka & Cumilla', 'Dhaka · Cumilla, Bangladesh', '2027-03-18', '2027-04-05', [['Transport', 'Flight Toronto → Dhaka, then train to Cumilla'], ['Stay', 'With family']], 'Three weeks with family for Eid: rasmalai in Cumilla, the old town in Dhaka, Moynamoti ruins and as much home food as possible.'),
    S('plan', 'nextTravelUpgrade', 'Trip plan', 'Banff & Lake Louise in summer', 'Alberta, Canada', '2027-07-08', '2027-07-15', [['Transport', 'Flight to Calgary + rental car'], ['Stay', 'Hostel in Banff town']], 'Moraine Lake at sunrise, the Icefields Parkway, a canoe on Lake Louise and a hike up to the Plain of Six Glaciers tea house.'),
    S('plan', 'nextTravelUpgrade', 'Trip plan', 'Montreal & Quebec City by train', 'Quebec, Canada', '2027-05-20', '2027-05-24', [['Transport', 'VIA Rail from Toronto'], ['Stay', 'Old Montreal guesthouse']], 'Long weekend: Old Montreal, Mount Royal, bagels, then the walls and little streets of Old Quebec.'),
    S('trip', 'nextTravelUpgrade', 'Route', 'Toronto → Dhaka', 'Toronto Pearson → Hazrat Shahjalal Airport', '2027-03-17', '', [['By', 'Flight via Doha']], 'About 20 hours door to door — the longest and best trip of every year.'),
    S('trip', 'adventureExplorer', 'Road trip', 'Niagara Falls & wine country', 'Ontario, Canada', '2026-09-14', '2026-09-14', [['Vehicle', 'Car'], ['Stops', 'Niagara-on-the-Lake · Horseshoe Falls · Clifton Hill']], 'A full day: the boat ride into the mist, the falls lit up at night and a slow drive back along the lake.'),
    S('trip', 'adventureExplorer', 'Camping', 'Two nights in Algonquin Park', 'Algonquin Provincial Park, Ontario', '2027-09-24', '2027-09-26', [['Nights', '2'], ['Weather', 'Cool autumn nights']], 'Canoe camping for the autumn colours — paddling Canoe Lake and cooking over a fire.'),
    S('adventure', 'adventureExplorer', 'Hike', 'Keokradong summit trek', 'Bandarban, Bangladesh', '2027-03-26', '2027-03-28', [['Difficulty', 'Hard'], ['Category', 'Mountain trek']], 'Three days through Ruma and Boga Lake to one of the highest points in Bangladesh, staying with Bawm families on the way.'),
    S('adventure', 'advancedAdventure', 'Trail', 'Bruce Trail — Toronto section', 'Ontario, Canada', '2026-10-04', '', [['Difficulty', 'Moderate'], ['Time', 'About 5 hours']], 'Escarpment views and autumn leaves, one weekend at a time.'),
    S('adventure', 'adventureExplorer', 'Challenge', 'Visit all 64 districts of Bangladesh', 'Bangladesh', '', '', [['Goal', '64 districts'], ['Progress', 'Started']], 'One district at a time — every trip home adds a few more to the map.', 'Planned'),
    S('nature', 'advancedAdventure', 'Hidden place', 'Ratargul Swamp Forest', 'Sylhet, Bangladesh', '2027-03-30', '', [['Category', 'Freshwater swamp forest']], 'Rowing a small boat between trees standing in water — best in the rainy season.'),
    S('nature', 'advancedAdventure', 'Park', 'Sajek Valley', 'Rangamati, Bangladesh', '', '', [['Category', 'Hills & clouds']], 'Waking up above the clouds on the roof of the Chittagong Hill Tracts.', 'Planned'),
    S('nature', 'advancedAdventure', 'Wildlife', 'Sundarbans — Royal Bengal tiger country', 'Khulna, Bangladesh', '', '', [['Seen', 'Spotted deer, kingfishers, crocodiles'], ['Category', 'Mangrove forest']], 'A three-day boat trip into the largest mangrove forest in the world.', 'Planned'),
    S('nature', 'advancedAdventure', 'Sunrise & sunset', 'Sunset at Kuakata beach', 'Patuakhali, Bangladesh', '', '', [['Category', 'Sunrise and sunset from the same beach']], 'One of the few beaches where you can watch both the sunrise and the sunset over the sea.', 'Planned')
  ];
  const hasOwnerData = () => SOURCE_KEYS.some(k => localStorage.getItem(k) !== null);
  function items() {
    if (hasOwnerData()) {
      const list = collectFromSources();
      const next = JSON.stringify({ items: list });
      try { if (localStorage.getItem(PUBLIC_KEY) !== next) { realSet.call(localStorage, PUBLIC_KEY, next); } } catch {}
      if (list.length) return list;
    }
    const pub = (json(PUBLIC_KEY) || {}).items || [];
    return pub.length ? pub : SAMPLE;
  }
  const isUpcoming = it => (it.start && it.start >= todayISO()) || (it.end && it.end >= todayISO()) || (!it.start && PLANNED.test(it.status)) || (it.cat === 'plan' && !it.start);
  const fmt = iso => { if (!iso) return ''; const d = new Date(`${iso}T12:00:00`); return isNaN(d) ? iso : d.toLocaleDateString(bn() ? 'bn-BD' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }); };
  const dateLine = it => (it.start && it.end && it.end !== it.start ? `${fmt(it.start)} – ${fmt(it.end)}` : fmt(it.start || it.end));
  const daysTo = iso => Math.round((new Date(`${iso}T12:00:00`) - new Date(`${todayISO()}T12:00:00`)) / 864e5);

  // ---------- Section ----------
  const section = document.createElement('section');
  section.id = 'rnrJourneyPlan';
  section.className = 'section rnr-plan-section';
  section.innerHTML = `
    <div class="rnr-plan-owner"><span>Only you can see this:</span> add or edit entries in My Toolkit —
      <a href="#nextTravelUpgrade">Itinerary &amp; routes</a><a href="#adventureExplorer">Adventures, road trips &amp; camping</a><a href="#advancedAdventure">Trails, parks &amp; wildlife</a><a href="#finalJourneyPack">Smart Trip Planner</a><a href="#toolkit" class="rnr-plan-alltools">🧰 All my tools (backup, photo book, security)</a></div>
    <div class="rnr-plan-next"></div>
    <div class="rnr-plan-tabs" role="tablist" aria-label="Filter"></div>
    <div class="rnr-plan-grid"></div>
    <p class="rnr-plan-empty"></p>`;
  (document.getElementById('studyJourney') || main).after(section);
  let filter = 'all';
  const open = new Set();

  function card(it) {
    const up = isUpcoming(it);
    const facts = it.facts.filter(f => f[0] !== 'Status' || !up);
    const long = it.notes.length > 180;
    const opened = open.has(it.id);
    return `<article class="rnr-plan-card is-${it.cat}${up ? ' is-upcoming' : ''}" data-no-translate>
      <div class="rnr-plan-top"><span class="rnr-plan-icon" aria-hidden="true">${ICONS[it.cat]}</span><span class="rnr-plan-type">${esc(L(it.type))}</span>
        ${up ? `<span class="rnr-plan-badge">${T('Planned', 'পরিকল্পিত')}</span>` : ''}</div>
      <h3>${esc(it.title)}</h3>
      ${it.place ? `<p class="rnr-plan-place"><span aria-hidden="true">📍</span> ${esc(it.place)}</p>` : ''}
      ${dateLine(it) ? `<p class="rnr-plan-date"><span aria-hidden="true">📅</span> ${esc(dateLine(it))}</p>` : ''}
      ${facts.length ? `<dl class="rnr-plan-facts">${facts.map(([k, v]) => `<div><dt>${esc(L(k))}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
      ${it.notes ? `<p class="rnr-plan-notes${long && !opened ? ' is-clamped' : ''}">${esc(it.notes)}</p>${long ? `<button type="button" class="rnr-plan-more" data-plan-more="${esc(it.id)}">${opened ? T('Show less', 'কম দেখুন') : T('Read more', 'আরও পড়ুন')}</button>` : ''}` : ''}
      ${it.link ? `<a class="rnr-plan-link" href="${esc(it.link)}" target="_blank" rel="noopener noreferrer">${T('Open map', 'ম্যাপ খুলুন')} ↗</a>` : ''}
      ${it.edit ? `<a class="rnr-owner-pill rnr-plan-edit" href="#${esc(it.edit)}">${it.sample ? 'Example — add your own in My Toolkit' : 'Edit in My Toolkit'}</a>` : ''}
    </article>`;
  }

  function render() {
    const all = items();
    const today = todayISO();
    const sorted = all.slice().sort((a, b) => {
      const ua = isUpcoming(a), ub = isUpcoming(b);
      if (ua !== ub) return ua ? -1 : 1;
      const da = a.start || a.end || '', db = b.start || b.end || '';
      return ua ? (da || '9999').localeCompare(db || '9999') : db.localeCompare(da);
    });
    section.classList.toggle('has-items', all.length > 0);
    const counts = Object.fromEntries(Object.keys(CATS).map(k => [k, k === 'all' ? all.length : all.filter(i => i.cat === k).length]));
    if (filter !== 'all' && !counts[filter]) filter = 'all';
    section.querySelector('.rnr-plan-tabs').innerHTML = all.length ? Object.keys(CATS).filter(k => k === 'all' || counts[k]).map(k =>
      `<button type="button" role="tab" data-plan-tab="${k}" aria-selected="${k === filter}">${T(...CATS[k])}<span>${num(counts[k])}</span></button>`).join('') : '';
    // Next trip highlight
    const next = sorted.find(i => i.start && i.start >= today && (i.cat === 'plan' || i.cat === 'trip'));
    const box = section.querySelector('.rnr-plan-next');
    if (next) {
      const d = daysTo(next.start);
      box.innerHTML = `<div class="rnr-plan-hero"><div class="rnr-plan-count"><strong>${d === 0 ? T('Today', 'আজ') : num(d)}</strong><span>${d === 0 ? T('leaving', 'যাত্রা') : d === 1 ? T('day to go', 'দিন বাকি') : T('days to go', 'দিন বাকি')}</span></div>
        <div class="rnr-plan-hero-text" data-no-translate><p class="eyebrow">${T('NEXT ON MY PLAN', 'পরের পরিকল্পনা')}</p><h3>${esc(next.title)}</h3><p>${esc([next.place, dateLine(next)].filter(Boolean).join(' · '))}</p></div></div>`;
      box.hidden = false;
    } else { box.innerHTML = ''; box.hidden = true; }
    const boxes = ['plan', 'trip', 'adventure', 'nature'].filter(c => (filter === 'all' || filter === c) && counts[c]);
    section.querySelector('.rnr-plan-grid').innerHTML = boxes.map(c => `
      <div class="rnr-plan-box is-${c}">
        <div class="rnr-plan-box-head"><span class="rnr-plan-box-icon" aria-hidden="true">${ICONS[c]}</span>
          <div><h3>${T(...CATS[c])}</h3><p>${T(...CAT_TEXT[c])}</p></div><span class="rnr-plan-box-count">${num(counts[c])}</span></div>
        <div class="rnr-plan-cards">${sorted.filter(i => i.cat === c).map(card).join('')}</div>
      </div>`).join('');
    section.querySelector('.rnr-plan-empty').textContent = all.length ? '' : 'Add a trip plan, road trip, hike or hidden place in My Toolkit and it appears here. Only you can see this message.';
    window.RNR_PAGES?.refresh();
  }

  section.addEventListener('click', e => {
    const tab = e.target.closest('[data-plan-tab]');
    if (tab) { filter = tab.dataset.planTab; render(); return; }
    const more = e.target.closest('[data-plan-more]');
    if (more) { const id = more.dataset.planMore; if (open.has(id)) open.delete(id); else open.add(id); render(); }
  });

  // Re-draw when a toolkit form saves (they write straight to localStorage).
  const realSet = Storage.prototype.setItem;
  let timer = 0;
  Storage.prototype.setItem = function (k, v) {
    realSet.call(this, k, v);
    if (this === localStorage && SOURCE_KEYS.includes(k)) { clearTimeout(timer); timer = setTimeout(render, 250); }
  };
  addEventListener('storage', e => { if (SOURCE_KEYS.includes(e.key) || e.key === PUBLIC_KEY) render(); });
  addEventListener('rnr:language', render);
  let lastAdmin = isAdmin();
  new MutationObserver(() => { if (isAdmin() !== lastAdmin) { lastAdmin = isAdmin(); render(); } }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  window.RNR_PLAN = { render, items };
  setTimeout(render, 200);
})();

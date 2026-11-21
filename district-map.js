/* =====================================================================
   RASEL ON THE RUN — MY BANGLADESH: 64 DISTRICTS (Travels page)
   A hexagon tile map of all 64 districts, coloured by division.
   A district lights up when you have photos from it (any town in it),
   or when you mark it as visited in Admin mode. Tap a district to see
   its name, division and photos, and to open its photo gallery.
   Manual marks are saved in raselOnTheRunDistrictsV1 (published).
   ===================================================================== */
(() => {
  'use strict';
  const main = document.querySelector('main');
  if (!main || document.getElementById('rnrDistricts')) return;
  const KEY = 'raselOnTheRunDistrictsV1';
  const isAdmin = () => document.body.classList.contains('admin-mode');
  const bn = () => document.documentElement.lang === 'bn';
  const T = (en, b) => (bn() ? b : en);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = n => (bn() ? String(n).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]) : String(n));
  const readMarks = () => { try { const v = JSON.parse(localStorage.getItem(KEY) || '{}'); return Array.isArray(v.visited) ? v.visited : []; } catch { return []; } };
  const writeMarks = list => { try { localStorage.setItem(KEY, JSON.stringify({ visited: list })); } catch { alert('Could not save.'); } };

  // [division, column, row, code, Bangla name]
  const D = {
    'Barguna': ['Barishal', 4, 11, 'BRG', 'বরগুনা'], 'Barishal': ['Barishal', 5, 9, 'BSL', 'বরিশাল'], 'Bhola': ['Barishal', 6, 10, 'BHO', 'ভোলা'],
    'Jhalokati': ['Barishal', 4, 9, 'JHL', 'ঝালকাঠি'], 'Patuakhali': ['Barishal', 5, 10, 'PTK', 'পটুয়াখালী'], 'Pirojpur': ['Barishal', 4, 10, 'PRJ', 'পিরোজপুর'],
    'Bandarban': ['Chattogram', 9, 10, 'BAN', 'বান্দরবান'], 'Brahmanbaria': ['Chattogram', 7, 6, 'BBR', 'ব্রাহ্মণবাড়িয়া'], 'Chandpur': ['Chattogram', 6, 8, 'CDP', 'চাঁদপুর'],
    'Chattogram': ['Chattogram', 8, 10, 'CTG', 'চট্টগ্রাম'], "Cox's Bazar": ['Chattogram', 9, 11, 'COX', 'কক্সবাজার'], 'Cumilla': ['Chattogram', 7, 7, 'CUM', 'কুমিল্লা'],
    'Feni': ['Chattogram', 8, 8, 'FEN', 'ফেনী'], 'Khagrachhari': ['Chattogram', 9, 8, 'KHG', 'খাগড়াছড়ি'], 'Lakshmipur': ['Chattogram', 6, 9, 'LKP', 'লক্ষ্মীপুর'],
    'Noakhali': ['Chattogram', 7, 8, 'NOA', 'নোয়াখালী'], 'Rangamati': ['Chattogram', 9, 9, 'RNM', 'রাঙ্গামাটি'],
    'Dhaka': ['Dhaka', 5, 6, 'DHK', 'ঢাকা'], 'Faridpur': ['Dhaka', 3, 7, 'FRD', 'ফরিদপুর'], 'Gazipur': ['Dhaka', 5, 5, 'GAZ', 'গাজীপুর'],
    'Gopalganj': ['Dhaka', 4, 8, 'GOP', 'গোপালগঞ্জ'], 'Kishoreganj': ['Dhaka', 6, 5, 'KIS', 'কিশোরগঞ্জ'], 'Madaripur': ['Dhaka', 4, 7, 'MDP', 'মাদারীপুর'],
    'Manikganj': ['Dhaka', 4, 6, 'MNK', 'মানিকগঞ্জ'], 'Munshiganj': ['Dhaka', 6, 7, 'MUN', 'মুন্সীগঞ্জ'], 'Narayanganj': ['Dhaka', 5, 7, 'NGJ', 'নারায়ণগঞ্জ'],
    'Narsingdi': ['Dhaka', 6, 6, 'NSD', 'নরসিংদী'], 'Rajbari': ['Dhaka', 3, 6, 'RJB', 'রাজবাড়ী'], 'Shariatpur': ['Dhaka', 5, 8, 'SRP', 'শরীয়তপুর'], 'Tangail': ['Dhaka', 4, 5, 'TAN', 'টাঙ্গাইল'],
    'Bagerhat': ['Khulna', 3, 9, 'BAG', 'বাগেরহাট'], 'Chuadanga': ['Khulna', 0, 7, 'CHU', 'চুয়াডাঙ্গা'], 'Jashore': ['Khulna', 2, 8, 'JSR', 'যশোর'],
    'Jhenaidah': ['Khulna', 1, 7, 'JHN', 'ঝিনাইদহ'], 'Khulna': ['Khulna', 2, 9, 'KHL', 'খুলনা'], 'Kushtia': ['Khulna', 2, 6, 'KUS', 'কুষ্টিয়া'],
    'Magura': ['Khulna', 2, 7, 'MAG', 'মাগুরা'], 'Meherpur': ['Khulna', 1, 6, 'MEH', 'মেহেরপুর'], 'Narail': ['Khulna', 3, 8, 'NRL', 'নড়াইল'], 'Satkhira': ['Khulna', 1, 9, 'SAT', 'সাতক্ষীরা'],
    'Jamalpur': ['Mymensingh', 4, 4, 'JAM', 'জামালপুর'], 'Mymensingh': ['Mymensingh', 5, 4, 'MYM', 'ময়মনসিংহ'], 'Netrokona': ['Mymensingh', 6, 4, 'NET', 'নেত্রকোনা'], 'Sherpur': ['Mymensingh', 4, 3, 'SHE', 'শেরপুর'],
    'Bogura': ['Rajshahi', 3, 4, 'BOG', 'বগুড়া'], 'Chapai Nawabganj': ['Rajshahi', 0, 4, 'CNB', 'চাঁপাইনবাবগঞ্জ'], 'Joypurhat': ['Rajshahi', 1, 3, 'JOY', 'জয়পুরহাট'],
    'Naogaon': ['Rajshahi', 2, 4, 'NAO', 'নওগাঁ'], 'Natore': ['Rajshahi', 1, 5, 'NAT', 'নাটোর'], 'Pabna': ['Rajshahi', 2, 5, 'PAB', 'পাবনা'],
    'Rajshahi': ['Rajshahi', 0, 5, 'RAJ', 'রাজশাহী'], 'Sirajganj': ['Rajshahi', 3, 5, 'SIR', 'সিরাজগঞ্জ'],
    'Dinajpur': ['Rangpur', 1, 2, 'DIN', 'দিনাজপুর'], 'Gaibandha': ['Rangpur', 3, 3, 'GAI', 'গাইবান্ধা'], 'Kurigram': ['Rangpur', 3, 2, 'KUR', 'কুড়িগ্রাম'],
    'Lalmonirhat': ['Rangpur', 2, 1, 'LAL', 'লালমনিরহাট'], 'Nilphamari': ['Rangpur', 1, 1, 'NIL', 'নীলফামারী'], 'Panchagarh': ['Rangpur', 1, 0, 'PAN', 'পঞ্চগড়'],
    'Rangpur': ['Rangpur', 2, 2, 'RNG', 'রংপুর'], 'Thakurgaon': ['Rangpur', 0, 1, 'THA', 'ঠাকুরগাঁও'],
    'Habiganj': ['Sylhet', 7, 5, 'HAB', 'হবিগঞ্জ'], 'Moulvibazar': ['Sylhet', 8, 5, 'MOU', 'মৌলভীবাজার'], 'Sunamganj': ['Sylhet', 7, 4, 'SUN', 'সুনামগঞ্জ'], 'Sylhet': ['Sylhet', 8, 4, 'SYL', 'সিলেট']
  };
  const DIV = {
    Dhaka: ['#e57a4c', 'ঢাকা'], Chattogram: ['#1d7f8a', 'চট্টগ্রাম'], Rajshahi: ['#c0662a', 'রাজশাহী'], Khulna: ['#3f8a4f', 'খুলনা'],
    Barishal: ['#2f6fb0', 'বরিশাল'], Sylhet: ['#7a4fb0', 'সিলেট'], Rangpur: ['#b3263e', 'রংপুর'], Mymensingh: ['#b88a12', 'ময়মনসিংহ']
  };
  // Towns in the site's city list that sit inside another district.
  const TOWN_TO_DISTRICT = { 'Kuakata': 'Patuakhali', "Saint Martin's Island": "Cox's Bazar", 'Teknaf': "Cox's Bazar", 'Savar': 'Dhaka', 'Sreemangal': 'Moulvibazar' };
  const NAMES = Object.keys(D);

  // ---------- Section ----------
  const section = document.createElement('section');
  section.id = 'rnrDistricts';
  section.className = 'section rnr-district-section';
  section.innerHTML = `
    <div class="section-heading"><div><p class="eyebrow">MY BANGLADESH</p><h2>64 Districts, One Map</h2><p>Every district I have been to lights up. Tap one to see its photos.</p></div></div>
    <div class="rnr-district-wrap" data-no-translate>
      <div class="rnr-district-map"><svg role="img" aria-label="Map of the 64 districts of Bangladesh"></svg></div>
      <aside class="rnr-district-side">
        <div class="rnr-district-total"><strong data-dm-count>0</strong><span data-dm-of>of 64 districts</span><div class="rnr-district-bar"><i></i></div></div>
        <div class="rnr-district-info" aria-live="polite"></div>
        <ul class="rnr-district-legend"></ul>
      </aside>
    </div>
    <p class="rnr-district-hint">Districts light up from your Bangladesh photos (town level), or tap a district and press "Mark as visited". Only you can see this message.</p>`;
  (document.getElementById('rnrPassport') || document.getElementById('rnrGlobe') || main).after(section);
  const svg = section.querySelector('svg');

  // ---------- Geometry ----------
  const R = 30, W = Math.sqrt(3) * R, H = 2 * R, PAD = 6;
  const cols = Math.max(...NAMES.map(n => D[n][1])) + 1.5, rows = Math.max(...NAMES.map(n => D[n][2])) + 1;
  const VW = cols * W + PAD * 2, VH = (rows - 1) * H * 0.75 + H + PAD * 2;
  svg.setAttribute('viewBox', `0 0 ${VW.toFixed(1)} ${VH.toFixed(1)}`);
  const centre = n => { const [, c, r] = D[n]; return [PAD + W / 2 + (c + (r % 2 ? 0.5 : 0)) * W, PAD + H / 2 + r * H * 0.75]; };
  const hexPath = (x, y, s = R - 1.6) => Array.from({ length: 6 }, (_, i) => { const a = Math.PI / 180 * (60 * i - 30); return `${i ? 'L' : 'M'}${(x + s * Math.cos(a)).toFixed(1)},${(y + s * Math.sin(a)).toFixed(1)}`; }).join('') + 'Z';

  // ---------- Data ----------
  let photoCount = {}, cityOf = {}, selected = '';
  async function loadPhotos() {
    photoCount = {}; cityOf = {};
    const bd = (typeof travelData !== 'undefined' ? travelData : []).find(c => c.name === 'Bangladesh');
    if (!bd) return;
    const cityName = {};
    (bd.regions || []).forEach(r => (r.cities || []).forEach(c => { cityName[c.id] = { name: c.name, region: r, city: c }; }));
    let photos = [];
    try { photos = window.RNR_GALLERY?.allPhotos ? await window.RNR_GALLERY.allPhotos() : []; } catch {}
    const perCity = {};
    photos.forEach(p => {
      if (p.countryId !== bd.id || !p.cityId || !cityName[p.cityId]) return;
      const town = cityName[p.cityId].name;
      const district = D[town] ? town : TOWN_TO_DISTRICT[town];
      if (!district) return;
      photoCount[district] = (photoCount[district] || 0) + 1;
      perCity[p.cityId] = (perCity[p.cityId] || 0) + 1;
    });
    // For "Open photos": the town in each district with the most photos.
    Object.entries(perCity).forEach(([id, n]) => {
      const info = cityName[id]; const district = D[info.name] ? info.name : TOWN_TO_DISTRICT[info.name];
      if (!cityOf[district] || n > cityOf[district].n) cityOf[district] = { n, countryId: bd.id, regionId: info.region.id, cityId: id };
    });
  }
  const visitedSet = () => new Set([...Object.keys(photoCount), ...readMarks().filter(n => D[n])]);

  // ---------- Draw ----------
  function render() {
    const visited = visitedSet();
    section.classList.toggle('has-items', visited.size > 0);
    svg.innerHTML = `<defs><filter id="rnrHexGlow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity=".28"/></filter></defs>` +
      NAMES.map((n, i) => {
        const [div, , , code] = D[n]; const [x, y] = centre(n); const on = visited.has(n);
        return `<g class="rnr-hex${on ? ' is-on' : ''}${selected === n ? ' is-selected' : ''}" data-district="${esc(n)}" tabindex="0" role="button" aria-label="${esc(n)}${on ? ' (visited)' : ''}" style="--dc:${DIV[div][0]};--i:${i}">
          <path d="${hexPath(x, y)}"/><text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="middle">${code}</text>${photoCount[n] ? `<circle cx="${(x + 14).toFixed(1)}" cy="${(y - 15).toFixed(1)}" r="4.2"/>` : ''}</g>`;
      }).join('');
    section.querySelector('[data-dm-count]').textContent = num(visited.size);
    section.querySelector('[data-dm-of]').textContent = T('of 64 districts', '/ ৬৪ জেলা');
    section.querySelector('.rnr-district-bar i').style.width = `${(visited.size / 64 * 100).toFixed(1)}%`;
    section.querySelector('.rnr-district-legend').innerHTML = Object.entries(DIV).map(([d, [c, b]]) => {
      const all = NAMES.filter(n => D[n][0] === d); const v = all.filter(n => visited.has(n)).length;
      return `<li style="--dc:${c}"><i></i><span>${esc(T(d, b))}</span><b>${num(v)}/${num(all.length)}</b></li>`;
    }).join('');
    info();
    window.RNR_PAGES?.refresh();
  }
  function info() {
    const box = section.querySelector('.rnr-district-info');
    const visited = visitedSet();
    if (!selected) {
      const list = NAMES.filter(n => visited.has(n));
      box.innerHTML = list.length
        ? `<p class="rnr-district-label">${T('Districts I have visited', 'যে জেলাগুলোতে গেছি')}</p><div class="rnr-district-chips">${list.map(n => `<button type="button" data-district="${esc(n)}" style="--dc:${DIV[D[n][0]][0]}">${esc(T(n, D[n][4]))}</button>`).join('')}</div>`
        : `<p class="rnr-district-label">${T('Tap any district to see it.', 'যেকোনো জেলায় চাপ দিন।')}</p>`;
      return;
    }
    const [div, , , , bnName] = D[selected]; const on = visited.has(selected); const n = photoCount[selected] || 0; const manual = readMarks().includes(selected);
    box.innerHTML = `<div class="rnr-district-card" style="--dc:${DIV[div][0]}">
      <p class="rnr-district-div">${esc(T(`${div} Division`, `${DIV[div][1]} বিভাগ`))}</p>
      <h3>${esc(T(selected, bnName))}</h3>
      <p class="rnr-district-state">${on ? `<span class="is-on">✓ ${T('Visited', 'ঘুরে এসেছি')}</span>` : T('Not visited yet', 'এখনো যাওয়া হয়নি')}${n ? ` · ${num(n)} ${T(n === 1 ? 'photo' : 'photos', 'ছবি')}` : ''}</p>
      <div class="rnr-district-actions">
        ${cityOf[selected] ? `<button type="button" class="rnr-district-open" data-dm-open>${T('Open photos', 'ছবি দেখুন')} →</button>` : ''}
        <button type="button" class="rnr-owner-pill" data-dm-mark>${manual ? 'Remove visited mark' : (on ? 'Also mark as visited' : 'Mark as visited')}</button>
        <button type="button" class="rnr-district-close" data-dm-close aria-label="Close">✕</button>
      </div></div>`;
  }

  function openPhotos(name) {
    const target = cityOf[name];
    if (!target) return;
    try {
      archiveLevel = 'photos'; selectedCountryId = target.countryId; selectedRegionId = target.regionId; selectedCityId = target.cityId;
      renderCountries();
    } catch (error) { console.error(error); return; }
    document.getElementById('destinations')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  section.addEventListener('click', e => {
    if (e.target.closest('[data-dm-close]')) { selected = ''; render(); return; }
    if (e.target.closest('[data-dm-open]')) { openPhotos(selected); return; }
    if (e.target.closest('[data-dm-mark]') && isAdmin()) {
      const marks = readMarks(); const i = marks.indexOf(selected);
      if (i >= 0) marks.splice(i, 1); else marks.push(selected);
      writeMarks(marks); render(); return;
    }
    const hex = e.target.closest('[data-district]');
    if (hex) { selected = selected === hex.dataset.district && hex.tagName === 'g' ? '' : hex.dataset.district; render(); }
  });
  section.addEventListener('keydown', e => {
    const hex = e.target.closest('g[data-district]');
    if (hex && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); selected = hex.dataset.district; render(); }
  });

  // Tiles appear one by one the first time the map is seen.
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => { if (es.some(x => x.isIntersecting)) { section.classList.add('is-seen'); io.disconnect(); } }, { threshold: 0.2 });
    io.observe(svg);
  } else section.classList.add('is-seen');

  async function refresh() { await loadPhotos(); render(); }
  addEventListener('rnr:photos-changed', refresh);
  addEventListener('rnr:language', render);
  let lastAdmin = isAdmin();
  new MutationObserver(() => { if (isAdmin() !== lastAdmin) { lastAdmin = isAdmin(); render(); } }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  window.RNR_DISTRICTS = {
    refresh,
    list: () => { const v = visitedSet(); return NAMES.map(n => ({ name: n, bn: D[n][4], division: D[n][0], divisionBn: DIV[D[n][0]][1], visited: v.has(n) })); },
    select: name => { if (!D[name]) return; selected = name; render(); section.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  };
  setTimeout(refresh, 500);
})();

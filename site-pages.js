/* =====================================================================
   RASEL ON THE RUN — PAGES, MENU AND PUBLIC / OWNER VIEW
   - Splits the long single page into pages: Home, Travels, Stories, Timeline,
     Journey Plan, Study Journey, About, Videos (plus "Settings" for the owner).
     The old "My Toolkit" tools now sit under Journey Plan (owner only) and
     the security / backup / money tools under Settings.
     Nothing is deleted: every existing section stays on one of the pages.
   - Visitors only see finished content. Forms, trackers, backups, empty
     placeholders and owner buttons are shown only in Admin mode.
   - The Admin button is hidden from visitors. On a new device open the
     website address with #owner at the end (example: raselontherun.com/#owner).
   ===================================================================== */
(() => {
  'use strict';
  const main = document.querySelector('main');
  const header = document.querySelector('.site-header');
  const nav = document.querySelector('.main-nav');
  if (!main || !nav) return;

  const OWNER_FLAG = 'raselOnTheRunOwnerDeviceV1';
  const ADMIN_KEY = 'raselOnTheRunAdminCredentialV1';
  const isAdmin = () => document.body.classList.contains('admin-mode');
  const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Give the welcome block an id so it can be placed on a page.
  const intro = main.querySelector('.intro-section');
  if (intro && !intro.id) intro.id = 'welcome';

  const PAGES = {
    home:    { label: 'Home', sections: ['home', 'welcome', 'rnrNextTrip', 'rnrBestShots', 'destinations', 'memories', 'rnrStories', 'rnrVideos'] },
    travels: { label: 'Travel Destinations', title: 'Travel Destinations', text: 'Countries, cities and the photographs from every road I have travelled.', sections: ['rnrGlobe', 'rnrPassport', 'rnrDistricts', 'rnrTripRoutes', 'rnrPhotoMap', 'destinations', 'memories', 'rnrPanoramas'] },
    videos:  { label: 'Videos', title: 'Videos', text: 'Cinematic moments and travel videos from the road.', sections: ['rnrVideos'], soon: 'The first videos are being edited.' },
    timeline: { label: 'Timeline', title: 'Timeline', text: 'Every photo, video and story in the order it happened.', sections: ['rnrTimeline'], soon: 'Add dates to your photos to build your timeline.' },
    study:   { label: 'My Study Journey', title: 'My Study Journey', text: 'From my first classroom to studying in Canada, one chapter at a time.', sections: ['studyJourney'], soon: 'Study memories are on their way.' },
    stories: { label: 'Stories', title: 'Stories', text: 'The moments, people and places behind the photographs.', sections: ['rnrStories', 'rnrFood', 'rnrThenNow', 'lifetimeDocumentary'], soon: 'The first stories are being written.' },
    plan:    { label: 'Journey Plan', title: 'Journey Plan', text: 'Trips, plans and adventures — where I have been and where I am going next.', sections: ['rnrJourneyPlan'], soon: 'The first plans are being written.' },
    about:   { label: 'About Me', title: 'About Me', text: 'An international student in Toronto with a dream of seeing the whole world.', sections: ['aboutMeSection', 'rnrGuestbook', 'contact'] },
    settings: { label: 'Settings', owner: true, title: 'Settings', text: 'Security, backups and private records — expenses, reservations, wallet and encrypted notes. Only you can see this page.', sections: [] }
  };
  // Old links to "My Toolkit" now open the matching new place.
  const ALIAS = { toolkit: 'plan', settings: 'settings' };
  const pageKey = key => (PAGES[key] ? key : (ALIAS[key] || null));
  // Sections that are only for the owner, even on public pages.
  const OWNER_ONLY_SECTIONS = new Set(['lifetimeDocumentary']);
  // Older photo tools that were removed from My Toolkit (kept in the files, never shown).
  const RETIRED_SECTIONS = new Set(['premiumStudio', 'humanJournal', 'rnrArchivePolish']);
  const ORDER = ['home', 'travels', 'stories', 'timeline', 'plan', 'study', 'about', 'videos', 'settings'];

  // ---------- The old "My Toolkit" is split in two ----------
  // Journey Plan (owner view): every planning / record tool, in the same order as before,
  //   below the public plan. Visitors still only see the public plan cards.
  // Settings (owner only): security, backups and private money / booking / notes tools.
  const PRIVATE_TOOLS = ['Travel Expense Tracker', 'Travel Reservation Vault', 'Multi-Currency Travel Wallet',
    'Encrypted Personal Notes', 'Offline Data & Backup', 'Ultimate Explorer Backup', 'Final Journey Pack Backup',
    'One Archive Across Every Device', 'Offline Adventure Journal', 'Safety & Expedition Management', 'Live GPS Adventure Tracking'];
  const SETTINGS_ONLY = ['rnrMaintenancePanel'];
  function assignToolkit() {
    const placed = new Set(ORDER.filter(key => key !== 'settings').flatMap(key => PAGES[key].sections));
    const tools = [...main.children]
      .filter(el => el.tagName === 'SECTION' && el.id && !placed.has(el.id) && !RETIRED_SECTIONS.has(el.id) && el.id !== 'rnrPageBanner' && el.id !== 'rnrComingSoon')
      .map(el => el.id);
    const planTools = tools.filter(id => !SETTINGS_ONLY.includes(id));
    // Journey Plan tools are public (read-only for visitors; editing stays in Admin).
    // Put the tools straight after the public plan, keeping their order.
    const plan = document.getElementById('rnrJourneyPlan');
    const maint = document.getElementById('rnrMaintenancePanel');
    if (plan && maint) plan.after(maint);
    if (plan) { let at = maint && plan.nextElementSibling === maint ? maint : plan; planTools.forEach(id => { const el = document.getElementById(id); if (el) { at.after(el); at = el; } }); }
    PAGES.plan.sections = ['rnrJourneyPlan', ...planTools];
    PAGES.settings.all = [...SETTINGS_ONLY.filter(id => tools.includes(id)), ...planTools];
    PAGES.settings.sections = PAGES.settings.all.slice();
    markPrivate();
    markOwnerControls();
  }
  // Visitors see the entries but not the forms or edit / delete / backup buttons.
  const OWNER_CTL = /^\s*(＋|\+|✎|🗑|✕|×)|\b(add|edit|delete|remove|save|backup|restore|export|import|upload|clear|reset|generate|mark as|choose file|download (json|backup)|sync|unlock|lock)\b/i;
  function markOwnerControls() {
    (PAGES.plan.sections || []).slice(1).forEach(id => {
      const sec = document.getElementById(id);
      if (!sec) return;
      sec.classList.add('rnr-plan-tool');
      sec.querySelectorAll('button, [role=button], label.btn, a.btn').forEach(b => {
        if (b.closest('[role=tablist], .fj-tabs, .ux-tabs, .adv-tabs, nav')) return;
        if (b.dataset.fjTab || b.dataset.uxTab || b.getAttribute('role') === 'tab') return;
        const text = `${b.textContent} ${b.getAttribute('aria-label') || ''} ${b.title || ''}`;
        if (OWNER_CTL.test(text) || /delete|remove|edit/i.test(Object.keys(b.dataset).join(' '))) b.classList.add('rnr-owner-ctl');
      });
      // "＋ Add …" headings and the line under them belong to the forms.
      sec.querySelectorAll('h3, h4').forEach(h => {
        if (!/^\s*[＋+]/.test(h.textContent)) return;
        h.classList.add('rnr-owner-ctl');
        const next = h.nextElementSibling;
        if (next && next.tagName === 'P') next.classList.add('rnr-owner-ctl');
      });
      sec.querySelectorAll('form').forEach(f => {
        const card = f.closest('article, .fj-card, .ux-card, .ax-card, .next-card, .p7-card, .adv-card');
        if (!card) { f.classList.add('rnr-owner-ctl'); return; }
        const clone = card.cloneNode(true); clone.querySelectorAll('form, h2, h3, p').forEach(x => x.remove());
        if (clone.textContent.trim().length < 40) card.classList.add('rnr-owner-ctl'); else f.classList.add('rnr-owner-ctl');
      });
    });
  }

  // Mark the private tools inside the shared sections. On Journey Plan they are hidden;
  // on Settings only they (and the wrappers around them) are shown.
  function privateBlock(heading, section) {
    if (heading.parentElement === section || heading.parentElement.querySelectorAll(':scope > h2, :scope > h3').length > 2) {
      const run = []; let el = heading;
      do { run.push(el); el = el.nextElementSibling; } while (el && el.tagName !== heading.tagName);
      return run;
    }
    const others = el => [...el.querySelectorAll('h2, h3')].filter(h => h !== heading && !/^[+＋]/.test(h.textContent.trim())).length;
    let box = heading;
    while (box.parentElement && box.parentElement !== section && others(box.parentElement) === 0) box = box.parentElement;
    return [box];
  }
  function markPrivate() {
    (PAGES.settings.all || []).forEach(id => {
      const section = document.getElementById(id);
      if (!section || SETTINGS_ONLY.includes(id)) return;
      section.querySelectorAll('.rnr-private-block, .rnr-set-skip, .rnr-set-path, .rnr-plan-hide').forEach(el => el.classList.remove('rnr-private-block', 'rnr-set-skip', 'rnr-set-path', 'rnr-plan-hide'));
      const keep = new Set(), path = new Set();
      section.querySelectorAll('h2, h3').forEach(h => {
        if (!PRIVATE_TOOLS.includes(h.textContent.trim()) || h.closest('.rnr-tk-hidden')) return;
        privateBlock(h, section).forEach(el => {
          el.classList.add('rnr-private-block'); keep.add(el);
          // A tab button that opens this tool is hidden on Journey Plan.
          const panel = el.dataset?.fjPanel || el.dataset?.uxPanel;
          if (panel) section.querySelectorAll(`[data-fj-tab="${panel}"], [data-ux-tab="${panel}"]`).forEach(t => t.classList.add('rnr-plan-hide'));
          for (let up = el.parentElement; up && up !== section; up = up.parentElement) { keep.add(up); path.add(up); up.classList.add('rnr-set-path'); }
        });
      });
      section.classList.toggle('rnr-has-private', keep.size > 0);
      if (!keep.size) return;
      [section, ...path].forEach(el => [...el.children].forEach(child => { if (!keep.has(child)) child.classList.add('rnr-set-skip'); }));
    });
    // Settings shows only sections that hold a private tool.
    PAGES.settings.sections = (PAGES.settings.all || []).filter(id => SETTINGS_ONLY.includes(id) || document.getElementById(id)?.classList.contains('rnr-has-private'));
  }

  // ---------- Contact section (About page) ----------
  function buildContact() {
    if (document.getElementById('contact')) return;
    const about = document.getElementById('aboutMeSection');
    const section = document.createElement('section');
    section.id = 'contact';
    section.className = 'section rnr-contact-section';
    section.innerHTML = `
      <div class="rnr-contact-wrap">
        <div class="rnr-contact-intro">
          <p class="eyebrow">SAY HELLO</p>
          <h2>Get in touch</h2>
          <p>Have a travel tip, a question about studying in Canada, or a place I should see next? Send me a message.</p>
        </div>
        <form class="rnr-contact-form" id="rnrContactForm" novalidate>
          <div class="rnr-contact-row">
            <label>Your name<input name="name" type="text" autocomplete="name" required maxlength="80"></label>
            <label>Your email<input name="email" type="email" autocomplete="email" required maxlength="120"></label>
          </div>
          <label>Message<textarea name="message" rows="5" required maxlength="3000"></textarea></label>
          <label class="rnr-hp" aria-hidden="true">Leave this empty<input name="_gotcha" tabindex="-1" autocomplete="off"></label>
          <div class="rnr-contact-actions">
            <button class="primary-button" type="submit">Send message</button>
            <p class="rnr-contact-status" id="rnrContactStatus" role="status" aria-live="polite"></p>
          </div>
        </form>
      </div>`;
    if (about) about.after(section); else main.append(section);
    section.querySelector('form').addEventListener('submit', sendContact);
  }

  async function sendContact(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const status = document.getElementById('rnrContactStatus');
    const data = Object.fromEntries(new FormData(form).entries());
    if (data._gotcha) return;
    if (!data.name?.trim() || !/^\S+@\S+\.\S+$/.test(data.email || '') || !data.message?.trim()) {
      status.textContent = 'Please add your name, a valid email and a message.';
      status.dataset.state = 'error';
      return;
    }
    const cfg = window.RNR_SITE || {};
    const button = form.querySelector('button[type="submit"]');
    if (cfg.formspreeId) {
      button.disabled = true;
      status.textContent = 'Sending…';
      status.dataset.state = '';
      try {
        const response = await fetch(`https://formspree.io/f/${encodeURIComponent(cfg.formspreeId)}`, {
          method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form)
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        form.reset();
        status.textContent = 'Thank you! Your message has been sent.';
        status.dataset.state = 'ok';
      } catch (error) {
        console.error(error);
        status.textContent = 'Sorry, the message could not be sent. Please try again later.';
        status.dataset.state = 'error';
      } finally { button.disabled = false; }
      return;
    }
    // No form service yet: open the visitor's email app with the message filled in.
    const to = `${cfg.contactEmailUser || ''}@${cfg.contactEmailDomain || ''}`;
    const body = `${data.message}\n\n— ${data.name} (${data.email})`;
    location.href = `mailto:${to}?subject=${encodeURIComponent('Message from your website')}&body=${encodeURIComponent(body)}`;
    status.textContent = 'Your email app should open with the message ready to send.';
    status.dataset.state = 'ok';
  }

  // ---------- Page banner ----------
  const banner = document.createElement('section');
  banner.id = 'rnrPageBanner';
  banner.className = 'rnr-page-banner';
  banner.innerHTML = '<div class="rnr-page-banner-inner"><p class="eyebrow" id="rnrBannerEyebrow">RASEL ON THE RUN</p><h1 id="rnrBannerTitle"></h1><p id="rnrBannerText"></p></div>';
  main.prepend(banner);

  const soon = document.createElement('section');
  soon.id = 'rnrComingSoon';
  soon.className = 'rnr-coming-soon';
  soon.innerHTML = '<div><span class="rnr-soon-icon" aria-hidden="true"></span><h2>Coming soon</h2><p id="rnrSoonText"></p><a class="primary-button" href="#travels">Explore my travels</a></div>';
  banner.after(soon);

  // ---------- Home-page extras ----------
  function addHomeLinks() {
    const destinations = document.getElementById('destinations');
    if (destinations && !destinations.querySelector('.rnr-see-all')) {
      const link = document.createElement('div');
      link.className = 'rnr-see-all rnr-home-only rnr-countries-only';
      link.innerHTML = '<a class="rnr-see-all-link" href="#travels">View all destinations <span aria-hidden="true">→</span></a>';
      destinations.append(link);
    }
    const memories = document.getElementById('memories');
    if (memories && !memories.querySelector('.rnr-see-all')) {
      const link = document.createElement('div');
      link.className = 'rnr-see-all rnr-home-only';
      link.innerHTML = '<a class="rnr-see-all-link" href="#travels" data-scroll="memories">See all photos <span aria-hidden="true">→</span></a>';
      memories.append(link);
    }
  }

  // ---------- Navigation ----------
  function buildNav() {
    nav.querySelectorAll('a.rnr-nav-link').forEach(a => a.remove());
    const first = nav.firstChild;
    ORDER.forEach(key => {
      const a = document.createElement('a');
      a.href = `#${key}`;
      a.className = 'rnr-nav-link' + (PAGES[key].owner ? ' rnr-owner-link' : '');
      a.dataset.page = key;
      a.textContent = PAGES[key].label;
      nav.insertBefore(a, first);
    });
    const brand = document.querySelector('.site-header .brand');
    if (brand) brand.setAttribute('href', '#home');
  }

  // Header order: Home · Travel Destinations · Stories · Timeline · Journey Plan ·
  // My Study Journey · About Me · Videos · Settings · Publish · Admin
  // (Settings, Publish and Admin are only shown to the owner.)
  function navSequence() {
    const link = key => nav.querySelector(`a.rnr-nav-link[data-page="${key}"]`);
    const id = x => document.getElementById(x);
    return [link('home'), link('travels'), link('stories'), link('timeline'), link('plan'), link('study'),
      link('about'), link('videos'), link('settings'), id('rnrPublishButton'), id('ownerAdminToggle')].filter(Boolean);
  }
  let arranging = false;
  function arrangeNav() {
    const seq = navSequence();
    const inNav = [...nav.children].filter(el => seq.includes(el));
    if (inNav.length === seq.length && inNav.every((el, i) => el === seq[i]) && nav.firstElementChild === seq[0]) return;
    arranging = true;
    const anchor = [...nav.childNodes].find(n => !seq.includes(n)) || null;
    seq.forEach(el => nav.insertBefore(el, anchor));
    arranging = false;
    fitHeader();
  }
  // If the row does not fit (long labels, Bangla, owner buttons), use the menu button.
  function fitHeader() {
    if (!header) return;
    header.classList.remove('rnr-nav-collapse');
    if (innerWidth < 1360) return;
    const kids = [...nav.children].filter(el => el.getClientRects().length && getComputedStyle(el).display !== 'none');
    const box = nav.getBoundingClientRect();
    const brand = header.querySelector('.brand')?.getBoundingClientRect();
    const tools = document.getElementById('rnrNavTools')?.getBoundingClientRect();
    const left = Math.min(...kids.map(el => el.getBoundingClientRect().left));
    const right = Math.max(...kids.map(el => el.getBoundingClientRect().right));
    const over = kids.length > 0 && (left < box.left - 1 || right > box.right + 1 || (brand && left < brand.right + 8) || (tools && right > tools.left - 8)
      || nav.scrollWidth > nav.clientWidth + 2 || header.scrollWidth > header.clientWidth + 2);
    if (over) header.classList.add('rnr-nav-collapse');
  }
  new MutationObserver(() => { if (!arranging) requestAnimationFrame(arrangeNav); }).observe(nav, { childList: true, subtree: true });
  let fitTimer = 0;
  const scheduleFit = () => { clearTimeout(fitTimer); fitTimer = setTimeout(fitHeader, 80); };
  addEventListener('resize', scheduleFit);
  addEventListener('rnr:language', scheduleFit);
  addEventListener('load', scheduleFit);
  document.fonts?.ready?.then(scheduleFit);
  new MutationObserver(scheduleFit).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  // Floating "back" / "top" buttons: top only after scrolling, back not on Home.
  let scrolledOn = false;
  const onScroll = () => { const on = scrollY > 520; if (on !== scrolledOn) { scrolledOn = on; document.body.classList.toggle('rnr-scrolled', on); } };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  function buildFooter() {
    const footer = document.querySelector('.site-footer');
    if (!footer || footer.querySelector('.rnr-footer-links')) return;
    const links = document.createElement('nav');
    links.className = 'rnr-footer-links';
    links.setAttribute('aria-label', 'Footer');
    links.innerHTML = ORDER.filter(key => !PAGES[key].owner).map(key => `<a href="#${key}">${PAGES[key].label}</a>`).join('');
    footer.querySelector('.copyright')?.before(links);
    const year = footer.querySelector('.copyright');
    if (year) year.textContent = `© ${new Date().getFullYear()} Rasel On the Run. All rights reserved.`;
  }

  // ---------- Showing a page ----------
  let current = 'home';

  const hasRealContent = section => {
    if (section.id === 'memories') return [...section.querySelectorAll('img, video')].some(el => !el.closest('.empty-state'));
    if (section.id === 'studyJourney') return Boolean(section.querySelector('.study-entry'));
    if (section.id === 'rnrStories') return Boolean(section.querySelector('.rnr-story-card'));
    if (section.id === 'rnrNextTrip') return section.classList.contains('has-trip');
    if (section.id === 'rnrBestShots') return section.classList.contains('has-photos');
    if (section.id === 'rnrThenNow') return section.classList.contains('has-pairs');
    if (section.id === 'rnrTimeline') return section.classList.contains('has-items');
    if (section.id === 'rnrPhotoMap') return section.classList.contains('has-places');
    if (section.id === 'rnrPassport') return section.classList.contains('has-stamps');
    if (section.id === 'rnrDistricts') return section.classList.contains('has-items') || isAdmin();
    if (section.id === 'rnrJourneyPlan') return section.classList.contains('has-items');
    if (section.id === 'rnrTripRoutes') return section.classList.contains('has-trips');
    if (section.id === 'rnrPanoramas' || section.id === 'rnrFood') return section.classList.contains('has-items');
    if (section.id === 'rnrGuestbook') return section.classList.contains('is-live');
    if (section.id === 'rnrVideos') return current === 'home' ? Boolean(section.querySelector('.rnr-cine-card')) : Boolean(section.querySelector('.rnr-film-card'));
    return true;
  };

  function applyPage() {
    const page = PAGES[current] || PAGES.home;
    const admin = isAdmin();
    const visible = new Set(page.sections);
    let shown = 0;
    [...main.children].forEach(el => {
      if (el.tagName !== 'SECTION' || el === banner || el === soon) return;
      let on = visible.has(el.id);
      if (on && !admin && OWNER_ONLY_SECTIONS.has(el.id)) on = false;
      if (on && !admin && !hasRealContent(el)) on = false;
      el.classList.toggle('rnr-off', !on);
      if (on && el.id !== 'home' && el.id !== 'welcome') shown += 1;
    });

    banner.hidden = current === 'home';
    const custom = ((window.RNR_SITE_TEXT || {}).banners || {})[current] || {};
    document.getElementById('rnrBannerTitle').textContent = custom.title || page.title || '';
    document.getElementById('rnrBannerText').textContent = custom.text || page.text || '';
    soon.hidden = current === 'home' || shown > 0;
    document.getElementById('rnrSoonText').textContent = page.soon || 'New content is on its way.';

    document.body.dataset.rnrPage = current;
    ORDER.forEach(key => document.body.classList.toggle(`rnr-page-${key}`, key === current));
    nav.querySelectorAll('a.rnr-nav-link').forEach(a => {
      const active = a.dataset.page === current;
      a.classList.toggle('is-active', active);
      if (active) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    document.title = current === 'home' ? 'Rasel On the Run | Every Journey Tells a Story' : `${page.title || page.label} | Rasel On the Run`;
  }

  function pageOfSection(id) {
    if (PAGES[current]?.sections.includes(id)) return current;
    return ORDER.find(key => PAGES[key].sections.includes(id) && (!PAGES[key].owner || isAdmin())) || null;
  }

  // Soft fade + rise when moving between pages (skipped for reduced motion).
  let pageReady = false, transitionTimer = 0;
  setTimeout(() => { pageReady = true; }, 600);
  function playPageTransition() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const body = document.body;
    body.classList.remove('rnr-page-enter');
    void body.offsetWidth;
    body.classList.add('rnr-page-enter');
    clearTimeout(transitionTimer);
    transitionTimer = setTimeout(() => body.classList.remove('rnr-page-enter'), 700);
  }

  function showPage(key, { push = true, scroll = 'top' } = {}) {
    key = pageKey(key) || key;
    if (!PAGES[key] || (PAGES[key].owner && !isAdmin())) key = 'home';
    const changed = key !== current;
    current = key;
    applyPage();
    if (changed && pageReady) playPageTransition();
    if (push && location.hash !== `#${key}`) history.pushState({ rnrPage: key }, '', `#${key}`);
    if (scroll === 'top' && changed) window.scrollTo({ top: 0, behavior: 'instant' });
    header?.classList.remove('rnr-menu-open');
    document.getElementById('rnrMobileToggle')?.setAttribute('aria-expanded', 'false');
  }

  // Any module that scrolls to a section (search, buttons, breadcrumbs) first
  // switches to the page that holds that section.
  const nativeScrollIntoView = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = function (...args) {
    try {
      const section = this.closest?.('main > section');
      if (section && section.classList.contains('rnr-off')) {
        const key = pageOfSection(section.id);
        if (key && key !== current) showPage(key, { scroll: 'none' });
      }
    } catch {}
    return nativeScrollIntoView.apply(this, args);
  };

  // A link to something that no longer exists: land on Home with a friendly note.
  function lostNotice() {
    const bn = document.documentElement.lang === 'bn';
    let note = document.getElementById('rnrLostNote');
    if (!note) { note = document.createElement('div'); note.id = 'rnrLostNote'; note.className = 'rnr-lost-note'; note.setAttribute('role', 'status'); document.body.append(note); }
    note.textContent = bn ? 'এই লিংকটি কোথাও যায় না — তাই আপনাকে হোমে নিয়ে এলাম।' : "That link doesn't lead anywhere — so here's home.";
    note.classList.add('is-on');
    clearTimeout(lostNotice.t);
    lostNotice.t = setTimeout(() => note.classList.remove('is-on'), 4200);
  }

  function route({ push = false } = {}) {
    const hash = decodeURIComponent(location.hash.slice(1));
    if (hash === 'owner') {
      try { localStorage.setItem(OWNER_FLAG, '1'); } catch {}
      document.body.classList.add('rnr-owner-device');
      history.replaceState(null, '', '#home');
      showPage('home', { push: false });
      setTimeout(() => document.getElementById('ownerAdminToggle')?.focus(), 200);
      return;
    }
    // Postcard / shared links: #place=<country>
    if (/^place=/.test(hash)) {
      showPage('travels', { push: false });
      const go = () => window.RNR_POSTCARD?.openPlace(hash.slice(6));
      if (document.readyState === 'complete') setTimeout(go, 100); else addEventListener('load', () => setTimeout(go, 100), { once: true });
      return;
    }
    if (!hash || pageKey(hash)) { showPage(pageKey(hash) || 'home', { push }); if (hash && !PAGES[hash]) history.replaceState(null, '', `#${pageKey(hash)}`); return; }
    const target = document.getElementById(hash);
    const section = target?.closest('main > section');
    const key = target?.closest('.rnr-private-block') && isAdmin() ? 'settings' : section ? pageOfSection(section.id) : null;
    showPage(key || 'home', { push: false, scroll: key ? 'none' : 'top' });
    if (!target) { history.replaceState(null, '', '#home'); lostNotice(); }
    if (target) requestAnimationFrame(() => nativeScrollIntoView.call(target, { block: 'start' }));
  }

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const key = pageKey(link.getAttribute('href').slice(1));
    if (!key) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    showPage(key);
    const scrollTo = link.dataset.scroll && document.getElementById(link.dataset.scroll);
    if (scrollTo) requestAnimationFrame(() => nativeScrollIntoView.call(scrollTo, { block: 'start' }));
  }, true);
  addEventListener('popstate', () => route());
  addEventListener('hashchange', () => route());

  // Menu panel: close when tapping outside it or pressing Esc.
  document.addEventListener('click', event => {
    const head = document.querySelector('.site-header');
    if (!head?.classList.contains('rnr-menu-open')) return;
    if (event.target.closest('.main-nav, #rnrMobileToggle')) return;
    head.classList.remove('rnr-menu-open');
    document.getElementById('rnrMobileToggle')?.setAttribute('aria-expanded', 'false');
  });
  addEventListener('keydown', event => {
    const head = document.querySelector('.site-header');
    if (event.key === 'Escape' && head?.classList.contains('rnr-menu-open')) { head.classList.remove('rnr-menu-open'); document.getElementById('rnrMobileToggle')?.focus(); }
  });

  // ---------- Owner device / admin button ----------
  function syncOwner() {
    let owner = false;
    try { owner = localStorage.getItem(OWNER_FLAG) === '1' || Boolean(localStorage.getItem(ADMIN_KEY)); } catch {}
    if (isAdmin()) { owner = true; try { localStorage.setItem(OWNER_FLAG, '1'); } catch {} }
    document.body.classList.toggle('rnr-owner-device', owner);
  }

  // Re-check visibility when modules finish loading content (IndexedDB etc.).
  let pending = 0;
  const refresh = () => { cancelAnimationFrame(pending); pending = requestAnimationFrame(applyPage); };
  let lastAdmin = isAdmin();
  new MutationObserver(() => {
    if (isAdmin() !== lastAdmin) {
      lastAdmin = isAdmin();
      syncOwner();
      if (!lastAdmin && PAGES[current]?.owner) showPage('home');
      else refresh();
    }
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  ['memoryGallery', 'studyJourneyTimeline', 'rnrStoriesGrid'].forEach(id => {
    const el = document.getElementById(id);
    if (el) new MutationObserver(refresh).observe(el, { childList: true, subtree: true });
  });
  const memories = document.getElementById('memories');
  if (memories) new MutationObserver(refresh).observe(memories, { childList: true, subtree: true });

  function init() {
    // English only: forget an old Bangla choice from earlier versions.
    try { localStorage.removeItem('raselOnTheRunLanguageV1'); } catch {}
    document.documentElement.lang = 'en';
    // Story Highlights were removed: clear their saved data.
    try { localStorage.removeItem('raselOnTheRunHighlightsV1'); indexedDB.deleteDatabase('RaselOnTheRunHighlightsV1'); } catch {}
    buildContact();
    assignToolkit();
    setTimeout(markPrivate, 900); setTimeout(markPrivate, 2600);
    setTimeout(markOwnerControls, 1000); setTimeout(markOwnerControls, 3000);
    new MutationObserver(() => { clearTimeout(markOwnerControls.t); markOwnerControls.t = setTimeout(markOwnerControls, 300); }).observe(main, { childList: true, subtree: true });
    buildNav();
    arrangeNav();
    buildFooter();
    addHomeLinks();
    syncOwner();
    route();
    // Stories grid is created by site-stories.js; observe it once it exists.
    const grid = document.getElementById('rnrStoriesGrid');
    if (grid) new MutationObserver(refresh).observe(grid, { childList: true, subtree: true });
    document.body.classList.add('rnr-pages-ready');
  }
  window.RNR_PAGES = { show: (key, opts) => showPage(key, opts), refresh: () => applyPage(), current: () => current, hasContent: id => { const el = document.getElementById(id); return Boolean(el) && hasRealContent(el); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();

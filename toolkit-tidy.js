/* =====================================================================
   RASEL ON THE RUN — TIDY "MY TOOLKIT"
   Photo-type tools were removed from My Toolkit on request. The older
   modules still exist (nothing else breaks), but these tools are hidden:
   whole sections "My Travel Studio", "Stories Behind the Places" and
   "Make the memories easier to revisit" (see site-pages.js), plus the
   photo / video tools listed below inside other sections.
   ===================================================================== */
(() => {
  'use strict';
  const HIDE = [
    'Favorite Memories', 'All Travel Stories', 'Travel Timeline',            // My Travel Statistics
    'Advanced Photography & EXIF',                                           // Journey Planner
    'Adventure Video Documentary',                                           // Adventure Explorer
    'Travel Documentary Studio',                                             // Advanced Adventure
    'Drone & 360° Photography Gallery', 'Smart Photo Organizer', 'Cinematic Documentary Editor', // Ultimate Explorer
    'Photography Portfolio Builder', 'Then vs Now Memories',                 // Final Journey
    'Places Behind Your Photos', 'Make a Journey Film'                       // Your World. Your Story.
  ];
  const SECTIONS = ['travelDashboard', 'nextTravelUpgrade', 'adventureExplorer', 'advancedAdventure', 'ultimateExplorer', 'finalJourneyPack', 'premiumSeven', 'rnrKeyFeatures'];
  // Shortcut cards on "The archive, your way." that only led to photo tools.
  const HIDE_SHORTCUTS = ['Open a memory', 'Make a travel film', 'Favourite moments', 'Choose your view'];

  function hideBlock(heading, section) {
    // A heading placed straight in the section: hide it and everything up to the next heading of the same level.
    if (heading.parentElement === section) {
      let el = heading;
      do { el.classList.add('rnr-tk-hidden'); el = el.nextElementSibling; }
      while (el && !(el.tagName === heading.tagName));
      return;
    }
    // Otherwise hide the largest wrapper that holds only this one tool.
    const others = el => [...el.querySelectorAll('h2, h3')].filter(h => h !== heading && !/^[+＋]/.test(h.textContent.trim())).length;
    let box = heading;
    while (box.parentElement && box.parentElement !== section && others(box.parentElement) === 0) box = box.parentElement;
    box.classList.add('rnr-tk-hidden');
  }

  function apply() {
    SECTIONS.forEach(id => {
      const section = document.getElementById(id);
      if (!section) return;
      section.querySelectorAll('h2, h3').forEach(h => {
        const t = h.textContent.trim();
        if (HIDE.includes(t) && !h.classList.contains('rnr-tk-hidden') && !h.closest('.rnr-tk-hidden')) hideBlock(h, section);
      });
      if (id === 'rnrKeyFeatures') {
        section.querySelectorAll('a, article, .card, div').forEach(card => {
          const title = card.querySelector?.('h3, strong, b')?.textContent?.trim();
          if (title && HIDE_SHORTCUTS.includes(title) && card.querySelectorAll('h3, strong, b').length === 1 && (card.tagName === 'A' || card.matches('[class*="card"], article'))) card.classList.add('rnr-tk-hidden');
        });
      }
    });
    // Quick links at the top of My Toolkit: drop retired sections.
    document.querySelectorAll('.rnr-toolkit-links a').forEach(a => {
      const id = (a.getAttribute('href') || '').slice(1);
      if (['premiumStudio', 'humanJournal', 'rnrArchivePolish'].includes(id)) a.remove();
    });
  }
  let t = 0;
  const schedule = () => { clearTimeout(t); t = setTimeout(apply, 120); };
  function init() {
    apply();
    SECTIONS.forEach(id => { const s = document.getElementById(id); if (s) new MutationObserver(schedule).observe(s, { childList: true, subtree: true }); });
    setTimeout(apply, 800); setTimeout(apply, 2500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(init, 0), { once: true }); else setTimeout(init, 0);
})();

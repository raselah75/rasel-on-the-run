/* Section color identities: soft, natural accents with a shared neutral foundation. */
(() => {
  'use strict';
  const tones = [
    { key: 'home', words: /home|welcome|introduction|hero/i, color: '#6689A8', wash: '#EEF4F8' },
    { key: 'destination', words: /destination|country|region|city|world.?map|passport|route|geograph/i, color: '#56866B', wash: '#EEF5F0' },
    { key: 'memory', words: /memor|photo|gallery|album|favorite|souvenir|portfolio/i, color: '#B88759', wash: '#F8F1E8' },
    { key: 'story', words: /stor|diary|journal|guestbook|people|food|culture|heritage/i, color: '#9A8061', wash: '#F5F0E9' },
    { key: 'study', words: /study|education|school|college|university|achievement|certificate/i, color: '#8376A7', wash: '#F2EFF7' },
    { key: 'adventure', words: /adventure|hiking|camp|road.?trip|trail|challenge|elevation|wildlife/i, color: '#B87555', wash: '#F8F0EB' },
    { key: 'timeline', words: /timeline|yearbook|history|calendar|wrapped|milestone/i, color: '#56899A', wash: '#EDF4F6' },
    { key: 'documentary', words: /documentary|cinema|film|video|voice|magazine/i, color: '#9A7890', wash: '#F5EFF3' },
    { key: 'planning', words: /planner|reservation|wallet|expense|budget|dream|bucket|goal/i, color: '#8A9160', wash: '#F3F4EA' },
    { key: 'admin', words: /admin|setting|content.?manager|backup|restore|maintenance|security|dashboard/i, color: '#71818A', wash: '#F0F3F4' }
  ];
  const labelOf = el => [el.id, el.className, el.getAttribute('aria-label'), el.querySelector('h1,h2,h3,[data-title]')?.textContent, el.textContent?.slice(0, 180)].filter(Boolean).join(' ');
  function apply() {
    document.querySelectorAll('main section, main [class*="section"], main [id]').forEach(el => {
      if (el.dataset.colorIdentityApplied) return;
      const label = labelOf(el);
      const match = tones.find(t => t.words.test(label));
      if (!match) return;
      el.dataset.sectionTone = match.key;
      el.style.setProperty('--section-accent', match.color);
      el.style.setProperty('--section-wash', match.wash);
      el.dataset.colorIdentityApplied = 'true';
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply, { once: true }); else apply();
  const observer = new MutationObserver(() => apply());
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('pageshow', apply);
})();

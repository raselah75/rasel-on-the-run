/* Rasel On the Run — thoughtful entry points to existing archive features.
   This layer improves discovery without creating duplicate data stores or fake services. */
(() => {
  'use strict';
  if (document.getElementById('rnrKeyFeatures')) return;
  const $ = (s, r=document) => r.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const entries = [
    {title:'Explore the world', note:'See the places saved in your travel archive.', target:'jtWorldMap', group:'Places', mark:'01'},
    {title:'Open a memory', note:'Browse photographs and view them up close.', target:'jtAllPhotos', group:'Photography', mark:'02'},
    {title:'Your travels, at a glance', note:'A quiet overview of countries, trips and media.', target:'travelDashboard', group:'Overview', mark:'03'},
    {title:'Find something quickly', note:'Search destinations, stories and sections.', action:'search', group:'Shortcuts', mark:'04'},
    {title:'Follow the timeline', note:'Return to moments in the order they happened.', target:'jtTimeline', group:'Stories', mark:'05'},
    {title:'Make a travel film', note:'Bring selected memories together as a story.', target:'p7Film', fallback:'lifetimeDocumentary', group:'Creative', mark:'06'},
    {title:'Favourite moments', note:'Keep the photographs you want to revisit.', target:'jtFavorites', group:'Photography', mark:'07'},
    {title:'Save an archive copy', note:'Export a copy of the travel records available here.', target:'jtExport', fallback:'rnrBackupNow', group:'Your archive', mark:'08'},
    {title:'Choose your view', note:'Switch between the existing light and dark themes.', action:'theme', group:'Appearance', mark:'09'},
    {title:'Tell the longer story', note:'Build chapters from the journeys that matter.', target:'lifetimeDocumentary', fallback:'finalJourneyPack', group:'Stories', mark:'10'}
  ];
  const style = document.createElement('style'); style.id='rnr-key-feature-style';
  style.textContent = `
  #rnrKeyFeatures{padding:clamp(34px,5vw,68px) clamp(18px,6vw,84px);background:var(--paper,#fffdf8);color:var(--text,#24333a)}
  #rnrKeyFeatures .rnr-kf-head{max-width:720px;margin:0 auto 26px;text-align:center}
  #rnrKeyFeatures .rnr-kf-kicker{font-size:10px;letter-spacing:.19em;text-transform:uppercase;color:var(--muted,#78827e);margin:0 0 10px}
  #rnrKeyFeatures h2{font:500 clamp(25px,3vw,36px)/1.2 Helvetica,Arial,sans-serif;letter-spacing:-.035em;margin:0 0 9px}
  #rnrKeyFeatures .rnr-kf-intro{font:14px/1.7 Helvetica,Arial,sans-serif;color:var(--muted,#78827e);margin:0}
  .rnr-kf-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;max-width:1240px;margin:auto}
  .rnr-kf-item{position:relative;min-height:148px;text-align:left;padding:17px 16px;border:0;border-radius:13px;background:rgba(120,130,110,.075);color:inherit;cursor:pointer;display:flex;flex-direction:column;justify-content:space-between;transition:transform .22s ease,background .22s ease,box-shadow .22s ease;font:inherit}
  .rnr-kf-item:hover{transform:translateY(-3px);background:rgba(177,139,85,.12);box-shadow:0 12px 28px rgba(35,43,35,.07)}
  .rnr-kf-number{font-size:10px;letter-spacing:.13em;color:var(--muted,#78827e)}
  .rnr-kf-item strong{display:block;font:600 14px/1.35 Helvetica,Arial,sans-serif;margin:18px 0 6px}
  .rnr-kf-item small{display:block;font:12px/1.55 Helvetica,Arial,sans-serif;color:var(--muted,#78827e)}
  .rnr-kf-arrow{position:absolute;right:15px;top:13px;font-size:15px;color:var(--muted,#78827e)}
  @media(max-width:900px){.rnr-kf-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
  @media(max-width:560px){#rnrKeyFeatures{padding:36px 16px}.rnr-kf-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.rnr-kf-item{min-height:135px;padding:14px}.rnr-kf-item strong{font-size:13px}}
  @media(prefers-reduced-motion:reduce){.rnr-kf-item{transition:none}}
  `;
  document.head.append(style);
  const section=document.createElement('section'); section.id='rnrKeyFeatures'; section.setAttribute('aria-labelledby','rnrKfTitle');
  section.innerHTML=`<div class="rnr-kf-head"><p class="rnr-kf-kicker">A few ways to explore</p><h2 id="rnrKfTitle">The archive, your way.</h2><p class="rnr-kf-intro">A few useful paths into the places, photographs and stories collected here.</p></div><div class="rnr-kf-grid">${entries.map(x=>`<button class="rnr-kf-item" type="button" data-kf="${esc(x.mark)}"><span class="rnr-kf-number">${x.mark} / ${esc(x.group)}</span><span><strong>${esc(x.title)}</strong><small>${esc(x.note)}</small></span><span class="rnr-kf-arrow" aria-hidden="true">↗</span></button>`).join('')}</div>`;
  const intro=$('.intro-section'); if(intro) intro.insertAdjacentElement('afterend',section); else $('main')?.prepend(section);
  const resolve = item => document.getElementById(item.target) || (item.fallback && document.getElementById(item.fallback));
  section.addEventListener('click', e=>{
    const btn=e.target.closest('[data-kf]'); if(!btn)return;
    const item=entries.find(x=>x.mark===btn.dataset.kf); if(!item)return;
    if(item.action==='search'){ $('#rnrSearchOpen')?.click(); return; }
    if(item.action==='theme'){ const theme=$('#premiumTheme'); if(theme){theme.click();return;} document.body.classList.toggle('jt-dark');localStorage.setItem('raselOnTheRunTheme',document.body.classList.contains('jt-dark')?'dark':'light');return; }
    const target=resolve(item); if(!target){btn.querySelector('small').textContent='This part of the archive is not available yet.';return;}
    target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
    if(target.matches('button,input,a')) setTimeout(()=>target.focus({preventScroll:true}),250);
    if(target.id==='jtAllPhotos') setTimeout(()=>target.querySelector('img,button')?.focus?.({preventScroll:true}),300);
  });
})();

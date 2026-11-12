/* Rasel On the Run — navigation & interaction polish (non-destructive enhancement) */
(() => {
  'use strict';
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const header = $('.site-header');
  const nav = $('.main-nav');
  if (!header || !nav || document.getElementById('rnrNavTools')) return;

  const style = document.createElement('style');
  style.textContent = `
  .site-header{position:sticky;top:0;z-index:1000;backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);transition:box-shadow .25s ease,background .25s ease}
  .site-header.rnr-scrolled{box-shadow:0 10px 28px rgba(12,28,38,.10)}
  .main-nav a[aria-current="location"]{position:relative;color:var(--gold,#b18b55)}
  .main-nav a[aria-current="location"]:after{content:"";position:absolute;left:0;right:0;bottom:-7px;height:2px;border-radius:4px;background:currentColor}
  #rnrNavTools{display:flex;align-items:center;gap:8px;margin-left:auto}
  .rnr-tool{border:0;background:rgba(128,142,150,.12);color:inherit;border-radius:999px;min-height:40px;padding:0 13px;font:inherit;font-size:12px;cursor:pointer;transition:transform .2s,background .2s}
  .rnr-tool:hover{transform:translateY(-2px);background:rgba(177,139,85,.17)}
  #rnrMobileToggle{display:none}
  #rnrBreadcrumb{position:fixed;z-index:900;left:18px;top:calc(var(--rnr-header-height,72px) + 10px);display:none;gap:7px;align-items:center;padding:8px 12px;border-radius:999px;background:rgba(255,255,255,.9);box-shadow:0 8px 24px rgba(0,0,0,.08);backdrop-filter:blur(12px);font-size:11px;color:#334653}
  #rnrBreadcrumb button{border:0;background:none;color:inherit;font:inherit;cursor:pointer}
  #rnrFloating{position:fixed;right:18px;bottom:20px;z-index:1100;display:grid;gap:8px}
  #rnrFloating .rnr-tool{width:44px;height:44px;padding:0;font-size:17px;background:rgba(18,43,58,.92);color:#fff;box-shadow:0 8px 22px rgba(0,0,0,.16)}
  #rnrSearchLayer{position:fixed;inset:0;z-index:3000;background:rgba(8,20,28,.58);backdrop-filter:blur(8px);display:none;align-items:flex-start;justify-content:center;padding:12vh 18px 20px}
  #rnrSearchLayer.open{display:flex}
  .rnr-search-panel{width:min(620px,100%);background:var(--paper,#fff);color:var(--text,#203747);border-radius:20px;padding:20px;box-shadow:0 25px 80px rgba(0,0,0,.25)}
  .rnr-search-panel input{width:100%;padding:15px 16px;border:1px solid rgba(120,130,140,.2);border-radius:12px;background:transparent;color:inherit;font:inherit;outline:none}
  .rnr-search-results{display:grid;gap:5px;margin-top:12px;max-height:48vh;overflow:auto}
  .rnr-search-results button{display:flex;justify-content:space-between;gap:12px;text-align:left;border:0;border-radius:10px;padding:12px;background:transparent;color:inherit;font:inherit;cursor:pointer}
  .rnr-search-results button:hover,.rnr-search-results button:focus{background:rgba(177,139,85,.13);outline:none}
  .rnr-search-results small{color:var(--muted,#71808a)}
  .rnr-empty{padding:14px;color:var(--muted,#71808a);font-size:13px}
  .rnr-page-arrive{animation:rnrArrive .32s ease both}
  @keyframes rnrArrive{from{opacity:.65;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  @media(max-width:900px){.site-header{display:flex;flex-wrap:wrap;align-items:center}.main-nav{display:none!important;order:3;width:100%;padding:12px 0 6px;flex-direction:column;align-items:stretch;gap:4px}.site-header.rnr-menu-open .main-nav{display:flex!important}.main-nav a,.main-nav button{padding:12px 14px;border-radius:10px}.main-nav a[aria-current="location"]:after{display:none}#rnrMobileToggle{display:inline-flex}#rnrNavTools{gap:6px}.rnr-desktop-only{display:none!important}#rnrBreadcrumb{top:calc(var(--rnr-header-height,72px) + 8px)}}
  @media(prefers-reduced-motion:reduce){.rnr-page-arrive{animation:none!important}.rnr-tool{transition:none!important}}
  `;
  document.head.append(style);

  const tools = document.createElement('div'); tools.id='rnrNavTools';
  tools.innerHTML = `<button class="rnr-tool" id="rnrSearchOpen" type="button" aria-label="Search website">⌕ <span class="rnr-desktop-only">Search</span></button><button class="rnr-tool" id="rnrMobileToggle" type="button" aria-expanded="false" aria-controls="rnrMainNav" aria-label="Toggle navigation">☰</button>`;
  nav.id='rnrMainNav'; header.append(tools);
  const crumb=document.createElement('div');crumb.id='rnrBreadcrumb';crumb.setAttribute('aria-live','polite');document.body.append(crumb);
  const floating=document.createElement('div');floating.id='rnrFloating';floating.innerHTML='<button class="rnr-tool" id="rnrBack" type="button" aria-label="Go back" title="Go back">←</button><button class="rnr-tool" id="rnrTop" type="button" aria-label="Back to top" title="Back to top">↑</button>';document.body.append(floating);
  const layer=document.createElement('div');layer.id='rnrSearchLayer';layer.innerHTML='<div class="rnr-search-panel" role="dialog" aria-modal="true" aria-label="Search this website"><input id="rnrSearchInput" type="search" placeholder="Search destinations, stories, galleries…" autocomplete="off"><div class="rnr-search-results" id="rnrSearchResults"><div class="rnr-empty">Start typing to find a section.</div></div><div class="rnr-empty">Press Esc to close · Ctrl/⌘ + K to search</div></div>';document.body.append(layer);

  const sections=()=>$$('main section[id]').map(el=>({id:el.id,title:($('h1,h2,h3',el)?.textContent||el.id).trim(),el}));
  const recordVisit=id=>{try{let a=JSON.parse(localStorage.getItem('rnrRecentlyViewed')||'[]');a=[id,...a.filter(x=>x!==id)].slice(0,8);localStorage.setItem('rnrRecentlyViewed',JSON.stringify(a));}catch(_){}}
  const navigate=id=>{const target=document.getElementById(id);if(!target)return;history.pushState({rnrSection:id},'',`#${id}`);target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});recordVisit(id);closeMenu();};
  const closeMenu=()=>{header.classList.remove('rnr-menu-open');$('#rnrMobileToggle').setAttribute('aria-expanded','false')};
  const active=()=>{const list=sections();let current=list[0];for(const s of list){if(s.el.getBoundingClientRect().top<=150)current=s;}if(!current)return;$$('.main-nav a[href^="#"]').forEach(a=>{if(a.getAttribute('href')===`#${current.id}`)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')});crumb.innerHTML=`<button type="button" data-go="home">Home</button><span>›</span><span>${current.title}</span>`;crumb.style.display=scrollY>500?'flex':'none';};
  let ticking=false;addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(()=>{header.classList.toggle('rnr-scrolled',scrollY>8);active();ticking=false});ticking=true;}},{passive:true});
  nav.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(!a)return;const id=a.getAttribute('href').slice(1);if(document.getElementById(id)){e.preventDefault();navigate(id)}});
  $('#rnrMobileToggle').addEventListener('click',()=>{const open=header.classList.toggle('rnr-menu-open');$('#rnrMobileToggle').setAttribute('aria-expanded',String(open))});
  $('#rnrBack').addEventListener('click',()=>{if(history.length>1)history.back();else navigate('home')});
  $('#rnrTop').addEventListener('click',()=>scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}));
  crumb.addEventListener('click',e=>{if(e.target.dataset.go)navigate(e.target.dataset.go)});
  addEventListener('popstate',()=>{const id=location.hash.slice(1);if(id&&document.getElementById(id))document.getElementById(id).scrollIntoView({behavior:'smooth',block:'start'});else scrollTo({top:0,behavior:'smooth'});});

  const searchOpen=()=>{layer.classList.add('open');$('#rnrSearchInput').value='';renderResults('');setTimeout(()=>$('#rnrSearchInput').focus(),30)};
  const searchClose=()=>{layer.classList.remove('open');$('#rnrSearchOpen').focus()};
  const renderResults=q=>{const box=$('#rnrSearchResults'),query=q.trim().toLowerCase();const all=sections().filter(s=>!query||`${s.title} ${s.id} ${s.el.textContent.slice(0,350)}`.toLowerCase().includes(query));box.innerHTML=all.length?all.map(s=>`<button type="button" data-result="${s.id}"><span>${s.title.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}</span><small>Open section ↗</small></button>`).join(''):'<div class="rnr-empty">No matching section found.</div>';};
  $('#rnrSearchOpen').addEventListener('click',searchOpen);$('#rnrSearchInput').addEventListener('input',e=>renderResults(e.target.value));
  $('#rnrSearchResults').addEventListener('click',e=>{const b=e.target.closest('[data-result]');if(b){searchClose();navigate(b.dataset.result)}});
  layer.addEventListener('click',e=>{if(e.target===layer)searchClose()});
  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();searchOpen()}if(e.key==='Escape'){if(layer.classList.contains('open'))searchClose();closeMenu()}});
  const headerHeight=()=>document.documentElement.style.setProperty('--rnr-header-height',`${header.getBoundingClientRect().height}px`);new ResizeObserver(headerHeight).observe(header);headerHeight();
  // Add stable anchor offsets and accessible labels to existing in-page links.
  sections().forEach(s=>{s.el.style.scrollMarginTop='105px';if(!s.el.hasAttribute('tabindex'))s.el.setAttribute('tabindex','-1')});
  active();
})();

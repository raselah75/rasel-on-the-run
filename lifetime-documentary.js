/* Rasel On the Run — Lifetime Travel Documentary */
(() => {
  'use strict';
  if (document.getElementById('lifetimeDocumentary')) return;
  const KEY='raselOnTheRunLifetimeDocumentaryV1';
  const DB='RaselOnTheRunLifetimeDocMediaV1', STORE='media';
  const $=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const id=()=>`doc-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  const read=()=>{try{const d=JSON.parse(localStorage.getItem(KEY)||'{}');return {title:d.title||'My Lifetime Journey',subtitle:d.subtitle||'Every journey leaves a story.',chapters:Array.isArray(d.chapters)?d.chapters:[]}}catch{return {title:'My Lifetime Journey',subtitle:'Every journey leaves a story.',chapters:[]}}};
  const write=d=>localStorage.setItem(KEY,JSON.stringify(d));
  const openDB=()=>new Promise((res,rej)=>{const q=indexedDB.open(DB,1);q.onupgradeneeded=()=>{if(!q.result.objectStoreNames.contains(STORE))q.result.createObjectStore(STORE,{keyPath:'id'})};q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)});
  const mediaPut=async(file,meta)=>{const db=await openDB();return new Promise((res,rej)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put({id:meta.id,blob:file,name:file.name,type:file.type,...meta});tx.oncomplete=()=>{db.close();res()};tx.onerror=()=>{db.close();rej(tx.error)}})};
  const mediaAll=async()=>{const db=await openDB();return new Promise((res,rej)=>{const q=db.transaction(STORE).objectStore(STORE).getAll();q.onsuccess=()=>{db.close();res(q.result)};q.onerror=()=>{db.close();rej(q.error)}})};
  const mediaDelete=async(mid)=>{const db=await openDB();return new Promise((res,rej)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(mid);tx.oncomplete=()=>{db.close();res()};tx.onerror=()=>{db.close();rej(tx.error)}})};
  const section=document.createElement('section');section.id='lifetimeDocumentary';section.className='ltd-section';
  section.innerHTML=`
    <div class="ltd-wrap">
      <p class="ltd-kicker">YOUR STORY, THROUGH THE YEARS</p>
      <h2>Lifetime Travel Documentary</h2>
      <p class="ltd-intro">Bring your journeys together as chapters of one lifetime story. Add milestones, memories, photographs and notes, then create a documentary edition to keep or share.</p>
      <div class="ltd-editor">
        <div class="ltd-project">
          <label>Documentary title<input id="ltdTitle" maxlength="100" placeholder="My Lifetime Journey"></label>
          <label>Opening line<input id="ltdSubtitle" maxlength="180" placeholder="Every journey leaves a story."></label>
          <button class="ltd-btn" id="ltdSaveTitle" type="button">Save title</button>
        </div>
        <form id="ltdChapterForm" class="ltd-form">
          <h3>Add a chapter</h3>
          <div class="ltd-fields">
            <label>Chapter title<input name="title" required maxlength="100" placeholder="My first international journey"></label>
            <label>Country / destination<input name="location" maxlength="100" placeholder="Country, city or place"></label>
            <label>Date<input name="date" type="date"></label>
            <label>Chapter type<select name="type"><option>First journey</option><option>Family trip</option><option>Solo adventure</option><option>Road trip</option><option>Nature & wildlife</option><option>Culture & people</option><option>Special memory</option><option>Other</option></select></label>
            <label class="ltd-wide">Your story<textarea name="story" rows="3" maxlength="3000" placeholder="What happened? What made this journey memorable?"></textarea></label>
            <label class="ltd-wide">Add photos or short video<input name="media" type="file" accept="image/*,video/*" multiple></label>
          </div>
          <button class="ltd-btn" type="submit">Add chapter</button>
          <span class="ltd-status" id="ltdStatus" role="status"></span>
        </form>
      </div>
      <div class="ltd-toolbar"><div><strong id="ltdCount">0 chapters</strong><p>Build your story one memory at a time.</p></div><div class="ltd-actions"><button class="ltd-btn secondary" id="ltdExport" type="button">Create documentary file</button><button class="ltd-btn secondary" id="ltdBackup" type="button">Export project backup</button></div></div>
      <div id="ltdTimeline" class="ltd-timeline"><div class="ltd-empty">Your documentary chapters will appear here.</div></div>
    </div>`;
  const main=document.querySelector('main');(main||document.body).append(section);
  const style=document.createElement('style');style.textContent=`
  .ltd-section{padding:clamp(42px,6vw,76px) 5%;background:#f1f4f5;color:#172f42;border-top:1px solid #dce4e9}
  .ltd-wrap{max-width:1180px;margin:auto}.ltd-kicker{color:#a47d42;letter-spacing:.16em;font-size:12px;font-weight:800}
  .ltd-wrap h2{font:500 clamp(28px,4vw,42px) Georgia,serif;margin:8px 0 12px}.ltd-intro{color:#667788;max-width:760px;line-height:1.7}
  .ltd-editor{display:grid;grid-template-columns:minmax(220px,.8fr) minmax(0,1.5fr);gap:20px;margin:28px 0}
  .ltd-project,.ltd-form,.ltd-chapter{background:#fff;border:1px solid #dce4e9;border-radius:16px;padding:22px;box-shadow:0 7px 22px #2630380d;min-width:0}
  .ltd-project label,.ltd-form label{display:block;font-size:13px;font-weight:700;color:#334b5b;margin-bottom:14px}
  .ltd-project input,.ltd-form input,.ltd-form select,.ltd-form textarea{display:block;width:100%;margin-top:7px;padding:11px 12px;border:1px solid #ccd8df;border-radius:9px;background:#fff;color:#172f42;min-width:0}
  .ltd-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 14px}.ltd-wide{grid-column:1/-1}
  .ltd-btn{border:1px solid #173d50;background:#173d50;color:#fff;padding:10px 16px;border-radius:999px;min-height:42px;font-weight:700;cursor:pointer}
  .ltd-btn.secondary{background:#fff;color:#173d50}.ltd-btn:hover{filter:brightness(1.08)}
  .ltd-toolbar{display:flex;justify-content:space-between;align-items:center;gap:18px;margin:32px 0 18px}.ltd-toolbar p{margin:5px 0;color:#667788;font-size:13px}.ltd-actions{display:flex;gap:9px;flex-wrap:wrap}
  .ltd-timeline{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:18px}
  .ltd-empty{padding:28px;border:1px dashed #c4d1d9;border-radius:14px;color:#667788;background:#fff;grid-column:1/-1}
  .ltd-chapter h3{margin:0 0 8px;font:500 22px Georgia,serif}.ltd-meta{font-size:12px;color:#9a753d;font-weight:700}.ltd-story{color:#566977;line-height:1.7;white-space:pre-wrap}
  .ltd-media{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin:12px 0}.ltd-media img,.ltd-media video{width:100%;height:120px;object-fit:cover;border-radius:9px;background:#e8edf0}
  .ltd-chapter-actions{display:flex;gap:8px;margin-top:14px}.ltd-chapter-actions button{font-size:12px}
  .ltd-status{display:inline-block;margin-left:10px;color:#286b4c;font-size:13px}
  @media(max-width:760px){.ltd-editor{grid-template-columns:1fr}.ltd-toolbar{align-items:flex-start;flex-direction:column}.ltd-actions{width:100%}.ltd-actions button{flex:1}}
  @media(max-width:560px){.ltd-section{padding-inline:18px}.ltd-fields{grid-template-columns:1fr}.ltd-wide{grid-column:auto}.ltd-project,.ltd-form,.ltd-chapter{padding:17px}.ltd-actions{flex-direction:column}.ltd-actions button{width:100%}}
  `;document.head.append(style);
  const title=$('#ltdTitle'),subtitle=$('#ltdSubtitle'),form=$('#ltdChapterForm'),status=$('#ltdStatus');
  function saveProject(){const d=read();d.title=title.value.trim()||'My Lifetime Journey';d.subtitle=subtitle.value.trim()||'Every journey leaves a story.';write(d);status.textContent='Documentary title saved.'}
  $('#ltdSaveTitle').addEventListener('click',saveProject);
  async function render(){const d=read(),assets=await mediaAll();title.value=d.title;subtitle.value=d.subtitle;$('#ltdCount').textContent=`${d.chapters.length} ${d.chapters.length===1?'chapter':'chapters'}`;
    const cards=d.chapters.slice().sort((a,b)=>(a.date||'').localeCompare(b.date||'')).map(c=>{const media=c.mediaIds.map(mid=>assets.find(a=>a.id===mid)).filter(Boolean);return `<article class="ltd-chapter"><div class="ltd-meta">${esc([c.date,c.location,c.type].filter(Boolean).join(' · '))}</div><h3>${esc(c.title)}</h3><p class="ltd-story">${esc(c.story||'')}</p>${media.length?`<div class="ltd-media">${media.map(a=>a.type.startsWith('video/')?`<video controls preload="metadata" src="${URL.createObjectURL(a.blob)}"></video>`:`<img loading="lazy" src="${URL.createObjectURL(a.blob)}" alt="${esc(a.name)}">`).join('')}</div>`:''}<div class="ltd-chapter-actions"><button class="ltd-btn secondary" data-ltd-edit="${esc(c.id)}" type="button">Edit</button><button class="ltd-btn secondary" data-ltd-delete="${esc(c.id)}" type="button">Delete</button></div></article>`}).join('');
    $('#ltdTimeline').innerHTML=cards||'<div class="ltd-empty">Your documentary chapters will appear here. Add your first journey above.</div>';
  }
  form.addEventListener('submit',async e=>{e.preventDefault();const fd=new FormData(form),files=[...form.elements.media.files],chapter={id:id(),title:fd.get('title'),location:fd.get('location'),date:fd.get('date'),type:fd.get('type'),story:fd.get('story'),mediaIds:[]};try{for(const file of files){if(file.size>100*1024*1024)throw new Error('Each media file must be under 100 MB.');const mid=id();await mediaPut(file,{id:mid,chapterId:chapter.id});chapter.mediaIds.push(mid)}const d=read();d.chapters.push(chapter);write(d);form.reset();status.textContent='Chapter saved on this device.';await render()}catch(err){status.textContent=`Could not save: ${err.message}` }});
  $('#ltdTimeline').addEventListener('click',async e=>{const del=e.target.closest('[data-ltd-delete]'),edit=e.target.closest('[data-ltd-edit]');if(del){const d=read(),c=d.chapters.find(x=>x.id===del.dataset.ltdDelete);if(!c||!confirm('Delete this documentary chapter and its attached media?'))return;for(const mid of c.mediaIds)await mediaDelete(mid);d.chapters=d.chapters.filter(x=>x.id!==c.id);write(d);render();return}if(edit){const d=read(),c=d.chapters.find(x=>x.id===edit.dataset.ltdEdit);if(!c)return;const title=prompt('Chapter title',c.title);if(title===null)return;const story=prompt('Chapter story',c.story||'');if(story===null)return;c.title=title.trim()||c.title;c.story=story;write(d);render()}});
  const download=(blob,name)=>{const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),2000)};
  $('#ltdBackup').addEventListener('click',()=>download(new Blob([JSON.stringify(read(),null,2)],{type:'application/json'}),'rasel-lifetime-documentary-project.json'));
  $('#ltdExport').addEventListener('click',async()=>{const d=read(),assets=await mediaAll();const toDataURL=blob=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.readAsDataURL(blob)});const rows=await Promise.all(d.chapters.slice().sort((a,b)=>(a.date||'').localeCompare(b.date||'')).map(async c=>{const media=await Promise.all(c.mediaIds.map(async mid=>{const a=assets.find(x=>x.id===mid);if(!a)return '';const src=await toDataURL(a.blob);return a.type.startsWith('video/')?`<video controls src="${src}"></video>`:`<img src="${src}" alt="${esc(a.name)}">`}));return `<article><small>${esc([c.date,c.location,c.type].filter(Boolean).join(' · '))}</small><h2>${esc(c.title)}</h2><p>${esc(c.story||'').replace(/\n/g,'<br>')}</p><div>${media.join('')}</div></article>`}));const html=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(d.title)}</title><style>body{font:17px Georgia,serif;max-width:850px;margin:40px auto;padding:0 22px;color:#203747;line-height:1.7}h1{font-size:42px}article{padding:24px 0;border-top:1px solid #d8e0e5}small{color:#a47d42;font-weight:bold}img,video{max-width:100%;max-height:440px;display:block;margin:14px 0;border-radius:12px}</style></head><body><h1>${esc(d.title)}</h1><p>${esc(d.subtitle)}</p>${rows.join('')}<footer>Created with Rasel On the Run</footer></body></html>`;download(new Blob([html],{type:'text/html'}),'rasel-lifetime-travel-documentary.html')});
  render().catch(err=>{console.error(err);status.textContent='Documentary could not load.'});
})();
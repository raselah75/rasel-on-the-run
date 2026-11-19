/* Rasel On the Run — local security, maintenance and recovery helpers.
   Important: this static-site layer is not a substitute for server-side authentication/RLS. */
(() => {
  'use strict';
  const KEY = 'rnrMaintenanceAuditV1';
  const MAX_AUDIT = 100;
  const MAX_IMPORT_BYTES = 25 * 1024 * 1024;
  const $ = (s, r=document) => r.querySelector(s);
  const safeParse = (value, fallback) => { try { return JSON.parse(value); } catch (_) { return fallback; } };
  const audit = (type, detail='') => {
    const items = safeParse(localStorage.getItem(KEY) || '[]', []);
    items.unshift({ at: new Date().toISOString(), type: String(type).slice(0,60), detail: String(detail).slice(0,180) });
    try { localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX_AUDIT))); } catch (_) {}
  };
  const download = (name, data) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1500);
  };
  const localSnapshot = () => {
    const data = {};
    for (let i=0; i<localStorage.length; i++) { const key=localStorage.key(i); if (key) data[key]=localStorage.getItem(key); }
    return { format:'rasel-on-the-run-local-snapshot', version:1, createdAt:new Date().toISOString(), storage:'localStorage only; IndexedDB media and other module-specific exports are not included', data };
  };
  const addStyles = () => {
    if ($('#rnr-maintenance-style')) return;
    const style=document.createElement('style'); style.id='rnr-maintenance-style';
    style.textContent=`.rnr-maintenance{margin:48px auto;padding:28px;max-width:1180px;background:var(--paper,#fff);border-radius:18px;box-shadow:0 12px 36px rgba(30,35,28,.07)}.rnr-maintenance[hidden]{display:none}.rnr-maintenance h2{font-size:clamp(22px,3vw,30px);margin-bottom:8px}.rnr-maintenance p{color:var(--muted,#777);font-size:14px}.rnr-maint-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px;margin:22px 0}.rnr-maint-stat{padding:17px;border-radius:13px;background:rgba(120,130,110,.09)}.rnr-maint-stat strong{display:block;font-size:23px}.rnr-maint-actions{display:flex;flex-wrap:wrap;gap:10px;margin:16px 0}.rnr-maint-actions button,.rnr-maint-actions label{border:0;border-radius:9px;padding:11px 15px;background:var(--green,#465b48);color:#fff;font:inherit;cursor:pointer}.rnr-maint-actions .secondary{background:#e9e7df;color:#30342e}.rnr-maint-log{max-height:190px;overflow:auto;padding:12px;background:rgba(120,130,110,.07);border-radius:10px;font:12px/1.6 ui-monospace,monospace;white-space:pre-wrap}.rnr-maint-note{margin-top:14px;padding:13px;border-left:3px solid #b18b55;background:rgba(177,139,85,.09);font-size:13px}.rnr-maintenance input[type=file]{display:none}@media(max-width:600px){.rnr-maintenance{margin:28px 12px;padding:19px}.rnr-maint-actions>*{flex:1 1 100%;text-align:center}}`;
    document.head.append(style);
  };
  function renderPanel(){
    if ($('#rnrMaintenancePanel')) return;
    const panel=document.createElement('section'); panel.id='rnrMaintenancePanel'; panel.className='rnr-maintenance'; panel.hidden=true; panel.setAttribute('aria-labelledby','rnrMaintTitle');
    panel.innerHTML=`<h2 id="rnrMaintTitle">Security & Maintenance</h2><p>Local archive health, recovery tools and activity history.</p><div class="rnr-maint-grid"><div class="rnr-maint-stat"><span>Browser storage</span><strong id="rnrStorageValue">Checking…</strong></div><div class="rnr-maint-stat"><span>Saved browser records</span><strong id="rnrKeysValue">—</strong></div><div class="rnr-maint-stat"><span>Recent issues</span><strong id="rnrErrorsValue">0</strong></div><div class="rnr-maint-stat"><span>Archive check</span><strong id="rnrHealthValue">Ready</strong></div></div><div class="rnr-maint-actions"><button type="button" id="rnrBackupNow">Export local backup</button><label for="rnrRestoreFile" class="secondary">Restore local backup</label><input id="rnrRestoreFile" type="file" accept="application/json,.json"><button type="button" id="rnrRunCheck" class="secondary">Run health check</button><button type="button" id="rnrExportLog" class="secondary">Export activity log</button></div><h3>Recent admin activity & errors</h3><div id="rnrMaintenanceLog" class="rnr-maint-log" aria-live="polite">No activity recorded yet.</div><div class="rnr-maint-note"><strong>Security note:</strong> These tools run in this browser. The current static website's owner passphrase is a local visibility gate, not server-enforced authentication. Real public-site protection, cloud backup and cross-device restore still require backend authentication, database/storage policies and deployment security configuration.</div>`;
    const target=$('main') || $('body'); target.append(panel);
    $('#rnrBackupNow').addEventListener('click',()=>{ const snap=localSnapshot(); download(`rasel-archive-local-backup-${new Date().toISOString().slice(0,10)}.json`,snap); audit('Backup exported','localStorage snapshot only'); refresh(); });
    $('#rnrRestoreFile').addEventListener('change', async e=>{
      const file=e.target.files?.[0]; if(!file)return;
      try{
        if(file.size>MAX_IMPORT_BYTES) throw new Error('Backup is larger than 25 MB. Use module-specific backup tools for large media.');
        const parsed=safeParse(await file.text(),null);
        if(!parsed || parsed.format!=='rasel-on-the-run-local-snapshot' || parsed.version!==1 || !parsed.data || typeof parsed.data!=='object' || Array.isArray(parsed.data)) throw new Error('This is not a supported Rasel On the Run local backup.');
        if(!confirm('Restore this backup? Current localStorage values with matching keys will be replaced. Export a backup first.')) return;
        const before=localSnapshot(); download(`rasel-archive-before-restore-${Date.now()}.json`,before);
        Object.entries(parsed.data).forEach(([k,v])=>{ if(typeof k==='string' && typeof v==='string') localStorage.setItem(k,v); });
        audit('Backup restored',`Imported ${Object.keys(parsed.data).length} localStorage keys`); alert('Local backup restored. Reload the page to refresh all sections.'); location.reload();
      }catch(err){ alert(err.message || 'Could not restore this backup.'); audit('Restore failed',err.message); refresh(); }
      finally{ e.target.value=''; }
    });
    $('#rnrRunCheck').addEventListener('click',()=>{ const result=healthCheck(); audit('Health check',`${result.bad} invalid JSON value(s); ${result.keys} local keys`); refresh(); alert(result.bad ? `Check complete: ${result.bad} invalid JSON value(s) found. See the activity log.` : `Check complete: ${result.keys} localStorage keys checked. No invalid JSON values found.`); });
    $('#rnrExportLog').addEventListener('click',()=>download(`rasel-archive-activity-${Date.now()}.json`,safeParse(localStorage.getItem(KEY)||'[]',[])));
  }
  function healthCheck(){ let bad=0,keys=0; for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(!k)continue;keys++;const v=localStorage.getItem(k);if(v && /^[\[{]/.test(v.trim()) && safeParse(v,undefined)===undefined)bad++;} return {bad,keys}; }
  function refresh(){
    if(!$('#rnrMaintenancePanel'))return;
    const keys=localStorage.length; $('#rnrKeysValue').textContent=String(keys);
    const errors=safeParse(localStorage.getItem('rnrMaintenanceErrorsV1')||'[]',[]); $('#rnrErrorsValue').textContent=String(errors.length);
    const result=healthCheck(); $('#rnrHealthValue').textContent=result.bad?`${result.bad} issue(s)`:'Healthy';
    const log=safeParse(localStorage.getItem(KEY)||'[]',[]); $('#rnrMaintenanceLog').textContent=log.length?log.slice(0,20).map(x=>`${x.at}  ${x.type}  ${x.detail}`).join('\n'):'No activity recorded yet.';
    if(navigator.storage?.estimate) navigator.storage.estimate().then(x=>{const used=x.usage||0,total=x.quota||0;$('#rnrStorageValue').textContent=total?`${(used/1048576).toFixed(1)} / ${(total/1048576).toFixed(0)} MB`:'Available';}).catch(()=>$('#rnrStorageValue').textContent='Unavailable'); else $('#rnrStorageValue').textContent='Browser dependent';
  }
  function reveal(){const p=$('#rnrMaintenancePanel'); if(!p)return; p.hidden=!document.body.classList.contains('admin-mode'); if(!p.hidden)refresh();}
  // 1) Maintain a short, local-only error history; do not collect or transmit data.
  const recordError=(kind,message)=>{const items=safeParse(localStorage.getItem('rnrMaintenanceErrorsV1')||'[]',[]);items.unshift({at:new Date().toISOString(),kind,message:String(message||'').slice(0,220)});try{localStorage.setItem('rnrMaintenanceErrorsV1',JSON.stringify(items.slice(0,30)));}catch(_){}};
  addEventListener('error',e=>recordError('error',e.message)); addEventListener('unhandledrejection',e=>recordError('promise',e.reason?.message||e.reason));
  // 2) Auto-lock the existing local owner UI after 30 minutes of inactivity.
  let idleTimer; const resetIdle=()=>{clearTimeout(idleTimer);if(document.body.classList.contains('admin-mode'))idleTimer=setTimeout(()=>{document.body.classList.remove('admin-mode');document.getElementById('ownerAdminToggle')?.replaceChildren(document.createTextNode('Admin'));audit('Admin auto-locked','30 minutes of inactivity');reveal();},30*60*1000);};
  ['pointerdown','keydown','touchstart'].forEach(ev=>document.addEventListener(ev,resetIdle,{passive:true}));
  // 3) Audit admin unlock/lock and reflect the maintenance panel state.
  let lastActive=document.body.classList.contains('admin-mode');const observer=new MutationObserver(()=>{const active=document.body.classList.contains('admin-mode');if(active===lastActive)return;lastActive=active;if(active){audit('Admin mode opened','Local browser session');resetIdle();}else{clearTimeout(idleTimer);audit('Admin mode locked','Local browser session');}reveal();});
  function init(){addStyles();renderPanel();observer.observe(document.body,{attributes:true,attributeFilter:['class']});reveal();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

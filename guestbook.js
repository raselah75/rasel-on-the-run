/* =====================================================================
   RASEL ON THE RUN — GUESTBOOK (About Me page)
   Visitors leave a short message (name, where from, message).
   New messages are hidden until the owner approves them in Admin mode
   (needs the owner to be signed in through Publish).
   Stored in Supabase table "guestbook" (see supabase-site.sql).
   Until Publish is set up the section is shown only to the owner, with a note.
   ===================================================================== */
(() => {
  'use strict';
  const main = document.querySelector('main');
  if (!main || document.getElementById('rnrGuestbook')) return;
  const bn = () => document.documentElement.lang === 'bn';
  const T = (en, b) => (bn() ? b : en);
  const isAdmin = () => document.body.classList.contains('admin-mode');
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const cloud = () => window.RNR_CLOUD;
  const ready = () => Boolean(cloud()?.configured && cloud()?.base);
  const SENT_KEY = 'raselOnTheRunGuestbookSentV1';
  const COLORS = ['#e57a4c', '#1d7f8a', '#7a4fb0', '#3f8a4f', '#2f6fb0', '#c0662a', '#b3263e'];
  const colorOf = s => COLORS[[...String(s)].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];

  const section = document.createElement('section');
  section.id = 'rnrGuestbook';
  section.className = 'section rnr-gb-section';
  section.innerHTML = `
    <div class="section-heading"><div><p class="eyebrow">GUESTBOOK</p><h2>Leave a note</h2><p>A few words from you — where you are from, a travel tip, or just hello. Notes appear here for everyone.</p></div></div>
    <div class="rnr-gb-wrap">
      <form class="rnr-gb-form" novalidate>
        <label><span>Your name</span><input name="name" maxlength="60" required autocomplete="name"></label>
        <label><span>From (city or country)</span><input name="place" maxlength="60" autocomplete="address-level2" placeholder="e.g. Dhaka"></label>
        <label><span>Message</span><textarea name="message" rows="4" maxlength="500" required></textarea><small class="rnr-gb-count">0 / 500</small></label>
        <label class="rnr-gb-hp" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>
        <button type="submit" class="rnr-gb-send">Send message</button>
        <p class="rnr-gb-status" role="status" aria-live="polite"></p>
        <p class="rnr-gb-fine">Messages appear after I read them. Please don't share private details.</p>
      </form>
      <div class="rnr-gb-side">
        <div class="rnr-gb-owner"></div>
        <div class="rnr-gb-list" aria-live="polite"></div>
      </div>
    </div>`;
  const contact = document.getElementById('contact'), about = document.getElementById('aboutMeSection');
  if (contact) contact.before(section); else if (about) about.after(section); else main.append(section);
  const form = section.querySelector('form');
  const list = section.querySelector('.rnr-gb-list');
  const ownerBox = section.querySelector('.rnr-gb-owner');
  const status = section.querySelector('.rnr-gb-status');

  const api = (path, opts = {}, token = null) => fetch(`${cloud().base}/rest/v1/${path}`, { ...opts, headers: cloud().headers(token, { 'Content-Type': 'application/json', ...(opts.headers || {}) }) });
  const when = iso => { try { return new Date(iso).toLocaleDateString(bn() ? 'bn-BD' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return ''; } };
  const card = (m, owner) => `<article class="rnr-gb-card${m.approved === false ? ' is-waiting' : ''}" data-id="${esc(m.id)}">
      <span class="rnr-gb-avatar" style="--c:${colorOf(m.name)}" aria-hidden="true">${esc(String(m.name).trim().charAt(0).toUpperCase())}</span>
      <div><p class="rnr-gb-who" data-no-translate><b>${esc(m.name)}</b>${m.place ? ` · ${esc(m.place)}` : ''}</p>
      <p class="rnr-gb-msg" data-no-translate>${esc(m.message)}</p>
      <time>${esc(when(m.created_at))}</time>
      ${owner ? `<div class="rnr-gb-actions">${m.approved === false ? '<button type="button" data-gb-approve>✓ Approve</button>' : '<button type="button" data-gb-hide>Hide</button>'}<button type="button" data-gb-delete class="is-danger">Delete</button></div>` : ''}</div>
    </article>`;

  let approved = [], waiting = [];
  async function load() {
    const c = document.getElementById('contact');
    if (c && c.compareDocumentPosition(section) & Node.DOCUMENT_POSITION_FOLLOWING) c.before(section);
    if (!ready()) {
      section.classList.remove('is-live');
      list.innerHTML = '';
      ownerBox.innerHTML = `<p class="rnr-gb-setup">The guestbook starts working after Publish is set up (Supabase). Run <b>supabase-site.sql</b> again — it now also creates the guestbook. Only you can see this message.</p>`;
      form.hidden = true;
      window.RNR_PAGES?.refresh();
      return;
    }
    form.hidden = false;
    section.classList.add('is-live');
    try {
      const r = await api('guestbook?select=id,name,place,message,created_at&approved=eq.true&order=created_at.desc&limit=60');
      approved = r.ok ? await r.json() : [];
    } catch { approved = []; }
    waiting = [];
    if (isAdmin()) {
      const s = await cloud().session?.().catch(() => null);
      if (s) {
        try { const r = await api('guestbook?select=id,name,place,message,created_at,approved&approved=eq.false&order=created_at.desc&limit=100', {}, s.access_token); waiting = r.ok ? await r.json() : []; } catch {}
        ownerBox.innerHTML = waiting.length ? `<p class="rnr-gb-label">${waiting.length} waiting for approval</p>${waiting.map(m => card(m, true)).join('')}` : '<p class="rnr-gb-label is-calm">No new messages waiting.</p>';
      } else ownerBox.innerHTML = '<p class="rnr-gb-setup">Sign in with <b>Publish</b> to see and approve new messages.</p>';
    } else ownerBox.innerHTML = '';
    list.innerHTML = approved.length ? approved.map(m => card(m, isAdmin())).join('') : `<p class="rnr-gb-empty">${T('Be the first to say hello! 👋', 'প্রথম শুভেচ্ছাটা আপনিই জানান! 👋')}</p>`;
    window.RNR_PAGES?.refresh();
  }

  form.addEventListener('input', () => { section.querySelector('.rnr-gb-count').textContent = `${form.message.value.length} / 500`; });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!ready()) return;
    const name = form.name.value.trim(), place = form.place.value.trim(), message = form.message.value.trim();
    if (form.website.value) { status.textContent = T('Thank you!', 'ধন্যবাদ!'); form.reset(); section.querySelector('.rnr-gb-count').textContent = '0 / 500'; return; } // bots fill hidden fields
    if (!name || message.length < 2) { status.textContent = T('Please write your name and a message.', 'নাম আর একটি বার্তা লিখুন।'); status.className = 'rnr-gb-status is-error'; return; }
    const sent = (() => { try { return JSON.parse(localStorage.getItem(SENT_KEY) || '[]'); } catch { return []; } })().filter(t => Date.now() - t < 864e5);
    if (sent.length >= 3) { status.textContent = T('Thank you — you have already sent a few messages today.', 'ধন্যবাদ — আজ আপনি কয়েকটি বার্তা পাঠিয়েছেন।'); return; }
    const btn = form.querySelector('.rnr-gb-send'); btn.disabled = true; btn.textContent = T('Sending…', 'পাঠানো হচ্ছে…');
    try {
      const r = await api('guestbook', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ name, place: place || null, message }) });
      if (!r.ok) throw new Error(String(r.status));
      sent.push(Date.now()); try { localStorage.setItem(SENT_KEY, JSON.stringify(sent)); } catch {}
      form.reset(); section.querySelector('.rnr-gb-count').textContent = '0 / 500';
      status.className = 'rnr-gb-status is-ok';
      status.textContent = T('Thank you! Your message will appear after Rasel reads it. 🙏', 'ধন্যবাদ! রাসেল পড়ার পর আপনার বার্তাটি দেখা যাবে। 🙏');
    } catch {
      status.className = 'rnr-gb-status is-error';
      status.textContent = T('Could not send right now. Please try again later.', 'এখন পাঠানো গেল না। একটু পরে আবার চেষ্টা করুন।');
    }
    btn.disabled = false; btn.textContent = T('Send message', 'বার্তা পাঠান');
  });

  section.addEventListener('click', async e => {
    const b = e.target.closest('[data-gb-approve], [data-gb-hide], [data-gb-delete]');
    if (!b || !isAdmin()) return;
    const id = b.closest('[data-id]')?.dataset.id; if (!id) return;
    const s = await cloud().session?.().catch(() => null);
    if (!s) { alert('Please sign in with Publish first.'); return; }
    if (b.matches('[data-gb-delete]') && !confirm('Delete this message for good?')) return;
    b.disabled = true;
    const q = `guestbook?id=eq.${encodeURIComponent(id)}`;
    const r = b.matches('[data-gb-delete]')
      ? await api(q, { method: 'DELETE', headers: { Prefer: 'return=minimal' } }, s.access_token).catch(() => null)
      : await api(q, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ approved: b.matches('[data-gb-approve]') }) }, s.access_token).catch(() => null);
    if (!r?.ok) { alert('Could not change the message. Please try again.'); b.disabled = false; return; }
    load();
  });

  let lastAdmin = isAdmin();
  new MutationObserver(() => { if (isAdmin() !== lastAdmin) { lastAdmin = isAdmin(); load(); } }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  addEventListener('rnr:language', () => { load(); });
  window.RNR_GUESTBOOK = { load };
  setTimeout(load, 700);
})();

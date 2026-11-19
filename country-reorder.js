/* Country card ordering (owner only).
   "Arrange countries" mode lets the owner drag cards by their grip with a finger
   (iPhone / Android / iPad) or a mouse (Mac / Windows), or nudge them with the
   arrow buttons. The order is saved in this browser and restored on every visit. */
(() => {
  'use strict';
  const ORDER_KEY = 'raselOnTheRunCountryOrderV1';
  const list = document.getElementById('countryList');
  if (!list || typeof renderCountries !== 'function') return;

  const readOrder = () => {
    try { const value = JSON.parse(localStorage.getItem(ORDER_KEY) || '[]'); return Array.isArray(value) ? value : []; }
    catch { return []; }
  };
  const writeOrder = ids => { try { localStorage.setItem(ORDER_KEY, JSON.stringify(ids)); } catch (error) { console.error(error); } };
  const isAdmin = () => document.body.classList.contains('admin-mode');
  const grid = () => list.querySelector('.nested-country-list');
  const shells = () => [...(grid()?.querySelectorAll(':scope > .country-shell') || [])];
  const idOf = shell => shell?.querySelector('[data-open-country]')?.dataset.openCountry || '';
  const nameOf = shell => shell?.querySelector('.hierarchy-info h2')?.textContent?.trim() || 'country';
  const saveCurrentOrder = () => writeOrder(shells().map(idOf).filter(Boolean));

  let enabled = false;
  let drag = null;

  function applySavedOrder() {
    const container = grid();
    const saved = readOrder();
    if (!container || !saved.length) return;
    const rank = new Map(saved.map((id, index) => [id, index]));
    shells()
      .map((shell, index) => ({ shell, index, rank: rank.has(idOf(shell)) ? rank.get(idOf(shell)) : Number.MAX_SAFE_INTEGER }))
      .sort((a, b) => a.rank - b.rank || a.index - b.index)
      .forEach(({ shell }) => container.append(shell));
  }

  // Smoothly animate cards to their new positions (FLIP technique).
  function animateMove(mutate) {
    const before = new Map(shells().map(shell => [shell, shell.getBoundingClientRect()]));
    mutate();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    shells().forEach(shell => {
      const old = before.get(shell);
      if (!old || shell.classList.contains('rnr-drag-placeholder')) return;
      const now = shell.getBoundingClientRect();
      const dx = old.left - now.left, dy = old.top - now.top;
      if (!dx && !dy) return;
      shell.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 220, easing: 'cubic-bezier(.2,.8,.2,1)' });
    });
  }

  function decorate() {
    const heading = list.querySelector('.archive-page-heading');
    const container = grid();
    if (!heading || !container) return;
    if (!isAdmin()) enabled = false;
    container.classList.toggle('rnr-arranging', enabled);

    let toolbar = heading.querySelector('.country-order-toolbar');
    if (!toolbar) {
      toolbar = document.createElement('div');
      toolbar.className = 'country-order-toolbar';
      heading.append(toolbar);
    }
    const signature = `${isAdmin()}|${enabled}`;
    if (toolbar.dataset.state !== signature) {
      toolbar.dataset.state = signature;
      toolbar.innerHTML = isAdmin()
      ? (enabled
        ? `<button type="button" class="country-order-toggle is-on" aria-pressed="true">Done arranging</button><button type="button" class="country-order-reset">Reset order</button><span class="country-order-hint">Hold a card (or its grip) and slide it to its new place, or use the arrows.</span>`
        : `<button type="button" class="country-order-toggle" aria-pressed="false">Arrange countries</button><button type="button" class="country-order-cards">Drag the cards</button>`)
      : '';
    }

    shells().forEach(shell => {
      const card = shell.querySelector('[data-open-country]');
      let tools = shell.querySelector('.rnr-order-tools');
      if (!enabled) { tools?.remove(); shell.classList.remove('country-sort-active'); return; }
      shell.classList.add('country-sort-active');
      if (!tools) {
        const name = nameOf(shell);
        tools = document.createElement('div');
        tools.className = 'rnr-order-tools';
        tools.innerHTML = `
          <button type="button" class="rnr-order-arrow" data-rnr-move="-1" aria-label="Move ${name} earlier">&#8592;</button>
          <button type="button" class="country-drag-handle" aria-label="Drag ${name} to reorder" title="Hold and drag">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>
          </button>
          <button type="button" class="rnr-order-arrow" data-rnr-move="1" aria-label="Move ${name} later">&#8594;</button>`;
        (card || shell).append(tools);
      }
    });
  }

  function move(shell, step) {
    const all = shells();
    const index = all.indexOf(shell);
    const target = all[index + step];
    if (!target) return;
    animateMove(() => (step < 0 ? target.before(shell) : target.after(shell)));
    saveCurrentOrder();
    shell.querySelector(`[data-rnr-move="${step}"]`)?.focus();
  }

  // ----- Pointer drag (touch + mouse + pen) -----
  function startDrag(event, handle) {
    const shell = handle.closest('.country-shell');
    if (!shell) return;
    event.preventDefault();
    const rect = shell.getBoundingClientRect();
    // A light "lifted card" that follows the finger / mouse.
    const card = shell.querySelector('[data-open-country]') || shell;
    const look = getComputedStyle(card);
    const ghost = document.createElement('div');
    ghost.className = 'rnr-drag-ghost';
    ghost.innerHTML = `<span class="rnr-ghost-flag"></span><strong></strong>`;
    ghost.querySelector('.rnr-ghost-flag').textContent = shell.querySelector('.hierarchy-flag')?.textContent.trim() || '';
    ghost.querySelector('strong').textContent = nameOf(shell);
    Object.assign(ghost.style, {
      width: `${rect.width}px`, height: `${rect.height}px`, left: `${rect.left}px`, top: `${rect.top}px`,
      backgroundImage: look.backgroundImage, backgroundColor: look.backgroundColor, borderRadius: look.borderRadius
    });
    document.body.append(ghost);
    shell.classList.add('rnr-drag-placeholder');
    drag = { shell, ghost, pointerId: event.pointerId, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top, x: event.clientX, y: event.clientY, raf: 0 };
    try { handle.setPointerCapture(event.pointerId); } catch {}
    if (navigator.vibrate) { try { navigator.vibrate(12); } catch {} }
    document.body.classList.add('rnr-dragging');
    document.documentElement.style.overflowAnchor = 'none';
    drag.raf = requestAnimationFrame(autoScroll);
  }

  function autoScroll() {
    if (!drag) return;
    const edge = 90, speed = 14;
    if (drag.y < edge) window.scrollBy(0, -speed * (1 - drag.y / edge));
    else if (drag.y > innerHeight - edge) window.scrollBy(0, speed * (1 - (innerHeight - drag.y) / edge));
    reposition();
    drag.raf = requestAnimationFrame(autoScroll);
  }

  function reposition() {
    if (!drag) return;
    drag.ghost.style.left = `${drag.x - drag.offsetX}px`;
    drag.ghost.style.top = `${drag.y - drag.offsetY}px`;
    // Wait until the previous swap animation settles, otherwise cards bounce back and forth.
    if (performance.now() < (drag.settleUntil || 0)) return;
    // Hit-test against the cards' layout positions (not their animated
    // positions), so a card that is still sliding cannot trigger a swap back.
    const container = grid();
    if (!container) return;
    const box = container.getBoundingClientRect();
    const px = drag.x - box.left - container.clientLeft;
    const py = drag.y - box.top - container.clientTop;
    const under = shells().find(shell => shell.offsetParent === container
      && px >= shell.offsetLeft && px <= shell.offsetLeft + shell.offsetWidth
      && py >= shell.offsetTop && py <= shell.offsetTop + shell.offsetHeight);
    if (!under || under === drag.shell) return;
    const all = shells();
    const from = all.indexOf(drag.shell), to = all.indexOf(under);
    animateMove(() => (from < to ? under.after(drag.shell) : under.before(drag.shell)));
    drag.settleUntil = performance.now() + 120;
  }

  function savedNote() {
    const t = document.createElement('div');
    t.className = 'rnr-lost-note is-on';
    t.textContent = window.RNR_CLOUD?.configured ? 'Order saved. Press Publish so visitors see the new order too.' : 'Order saved on this device. Visitors will see it after Publish is set up.';
    document.body.append(t);
    setTimeout(() => { t.classList.remove('is-on'); setTimeout(() => t.remove(), 400); }, 4200);
  }

  function endDrag() {
    if (!drag) return;
    cancelAnimationFrame(drag.raf);
    const { shell, ghost } = drag;
    const target = shell.getBoundingClientRect();
    drag = null;
    document.body.classList.remove('rnr-dragging');
    document.documentElement.style.overflowAnchor = '';
    const finish = () => { ghost.remove(); shell.classList.remove('rnr-drag-placeholder'); };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) finish();
    else ghost.animate([{ left: ghost.style.left, top: ghost.style.top }, { left: `${target.left}px`, top: `${target.top}px` }], { duration: 180, easing: 'ease-out' }).onfinish = finish;
    saveCurrentOrder();
    savedNote();
  }

  let pressTimer = 0, pressStart = null;
  list.addEventListener('pointerdown', event => {
    if (!enabled) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const handle = event.target.closest('.country-drag-handle');
    if (handle) { startDrag(event, handle); return; }
    // Hold anywhere on a card for a moment to pick it up (like a phone home screen).
    const shell = event.target.closest('.country-shell');
    if (!shell || event.target.closest('[data-rnr-move]')) return;
    pressStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
    clearTimeout(pressTimer);
    pressTimer = setTimeout(() => {
      const grip = shell.querySelector('.country-drag-handle');
      if (grip && pressStart) startDrag({ pointerId: pressStart.id, clientX: pressStart.x, clientY: pressStart.y, preventDefault() {} }, grip);
    }, event.pointerType === 'mouse' ? 160 : 380);
  });
  addEventListener('pointermove', event => {
    if (pressStart && !drag && Math.hypot(event.clientX - pressStart.x, event.clientY - pressStart.y) > 10) { clearTimeout(pressTimer); pressStart = null; }
  });
  addEventListener('pointerup', () => { clearTimeout(pressTimer); pressStart = null; });
  addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    event.preventDefault();
    drag.x = event.clientX; drag.y = event.clientY;
  }, { passive: false });
  addEventListener('pointerup', event => { if (drag && event.pointerId === drag.pointerId) endDrag(); });
  addEventListener('pointercancel', event => { if (drag && event.pointerId === drag.pointerId) endDrag(); });
  // iOS Safari: stop the page from scrolling while a card is being dragged.
  document.addEventListener('touchmove', event => { if (drag) event.preventDefault(); }, { passive: false });

  // Clicks: toolbar, arrows, and blocking navigation while arranging.
  list.addEventListener('click', event => {
    if (event.target.closest('.country-order-toggle')) {
      event.preventDefault(); event.stopImmediatePropagation();
      if (enabled) { enabled = false; decorate(); return; }
      openSheet();
      return;
    }
    if (event.target.closest('.country-order-cards')) {
      event.preventDefault(); event.stopImmediatePropagation();
      enabled = true; decorate();
      return;
    }
    if (event.target.closest('.country-order-reset')) {
      event.preventDefault(); event.stopImmediatePropagation();
      if (!confirm('Reset countries to the original order?')) return;
      localStorage.removeItem(ORDER_KEY);
      renderCountries();
      return;
    }
    const arrow = event.target.closest('[data-rnr-move]');
    if (arrow && enabled) {
      event.preventDefault(); event.stopImmediatePropagation();
      move(arrow.closest('.country-shell'), Number(arrow.dataset.rnrMove));
      return;
    }
    if (enabled && event.target.closest('.country-shell')) {
      // While arranging, a tap should never open the country.
      event.preventDefault(); event.stopImmediatePropagation();
    }
  }, true);
  list.addEventListener('keydown', event => {
    if (enabled && event.target.closest?.('[data-open-country]') && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault(); event.stopImmediatePropagation();
    }
  }, true);

  // ----- "Arrange countries" list: every country in one short list -----
  let sheet = null, rows = [], listDrag = null;
  const allCountries = () => {
    const data = typeof travelData !== 'undefined' && Array.isArray(travelData) ? travelData : [];
    const rank = new Map(readOrder().map((id, i) => [id, i]));
    return data.map((c, i) => ({ c, i, r: rank.has(c.id) ? rank.get(c.id) : 1e9 })).sort((a, b) => a.r - b.r || a.i - b.i).map(x => x.c);
  };
  const flag = n => (typeof getCountryFlag === 'function' ? getCountryFlag(n) : '');
  const esc = v => String(v ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  function openSheet() {
    if (!sheet) {
      sheet = document.createElement('div');
      sheet.className = 'rnr-arr';
      sheet.innerHTML = `<div class="rnr-arr-backdrop" data-arr-close></div><div class="rnr-arr-card" role="dialog" aria-modal="true" aria-labelledby="rnrArrTitle">
        <div class="rnr-arr-head"><div><p>ARRANGE</p><h3 id="rnrArrTitle">Order of countries</h3></div><button type="button" class="rnr-arr-x" data-arr-close aria-label="Close">✕</button></div>
        <p class="rnr-arr-help">Hold <b>⋮⋮</b> and slide up or down, or use <b>↑ ↓</b>. <b>⤒</b> sends a country to the top. The first 8 are the ones shown on the Home page.</p>
        <div class="rnr-arr-quick"><button type="button" data-arr-sort="visited">Visited first</button><button type="button" data-arr-sort="az">A → Z</button><button type="button" data-arr-sort="reset">Original order</button></div>
        <ol class="rnr-arr-list"></ol>
        <div class="rnr-arr-foot"><button type="button" class="rnr-arr-cancel" data-arr-close>Cancel</button><button type="button" class="rnr-arr-save" data-arr-save>Save order</button></div>
      </div>`;
      document.body.append(sheet);
      sheet.addEventListener('click', onSheetClick);
      sheet.addEventListener('pointerdown', onListDown);
    }
    rows = allCountries();
    drawRows();
    sheet.hidden = false;
    document.body.classList.add('rnr-modal-open');
  }
  function closeSheet() { if (!sheet) return; sheet.hidden = true; document.body.classList.remove('rnr-modal-open'); }
  function drawRows(focusId) {
    const ol = sheet.querySelector('.rnr-arr-list');
    ol.innerHTML = rows.map((c, i) => `<li data-id="${esc(c.id)}"${i === 7 ? ' class="is-cut"' : ''}>
      <button type="button" class="rnr-arr-grip" aria-label="Drag ${esc(c.name)}">⋮⋮</button>
      <span class="rnr-arr-n">${i + 1}</span><span class="rnr-arr-flag" aria-hidden="true">${esc(flag(c.name))}</span><span class="rnr-arr-name">${esc(c.name)}</span>
      <span class="rnr-arr-btns"><button type="button" data-arr-top aria-label="Move ${esc(c.name)} to the top"${i === 0 ? ' disabled' : ''}>⤒</button><button type="button" data-arr-move="-1" aria-label="Move ${esc(c.name)} up"${i === 0 ? ' disabled' : ''}>↑</button><button type="button" data-arr-move="1" aria-label="Move ${esc(c.name)} down"${i === rows.length - 1 ? ' disabled' : ''}>↓</button></span>
    </li>`).join('');
    if (focusId) ol.querySelector(`li[data-id="${CSS.escape(focusId)}"]`)?.scrollIntoView({ block: 'nearest' });
  }
  function onSheetClick(e) {
    if (e.target.closest('[data-arr-close]')) { closeSheet(); return; }
    if (e.target.closest('[data-arr-save]')) {
      writeOrder(rows.map(c => c.id));
      closeSheet();
      renderCountries();
      savedNote();
      return;
    }
    const sort = e.target.closest('[data-arr-sort]')?.dataset.arrSort;
    if (sort) {
      const data = typeof travelData !== 'undefined' ? travelData : [];
      if (sort === 'az') rows.sort((a, b) => a.name.localeCompare(b.name));
      if (sort === 'reset') rows = data.slice();
      if (sort === 'visited') {
        const v = new Set((window.RNR_GLOBE?.countries() || []).filter(c => c.visited).map(c => c.name));
        rows = [...rows.filter(c => v.has(c.name)), ...rows.filter(c => !v.has(c.name))];
      }
      drawRows(); return;
    }
    const li = e.target.closest('li[data-id]'); if (!li) return;
    const i = rows.findIndex(c => c.id === li.dataset.id);
    if (e.target.closest('[data-arr-top]')) { rows.unshift(...rows.splice(i, 1)); drawRows(li.dataset.id); sheet.querySelector('.rnr-arr-list').scrollTop = 0; return; }
    const step = Number(e.target.closest('[data-arr-move]')?.dataset.arrMove || 0);
    if (step && rows[i + step]) { [rows[i], rows[i + step]] = [rows[i + step], rows[i]]; drawRows(li.dataset.id); sheet.querySelector(`li[data-id="${CSS.escape(li.dataset.id)}"] [data-arr-move="${step}"]`)?.focus(); }
  }
  function onListDown(e) {
    const grip = e.target.closest('.rnr-arr-grip'); if (!grip) return;
    e.preventDefault();
    const li = grip.closest('li');
    const ol = li.parentElement;
    listDrag = { li, ol, id: e.pointerId, y: e.clientY, startTop: li.offsetTop };
    li.classList.add('is-dragging');
    try { grip.setPointerCapture(e.pointerId); } catch {}
    if (navigator.vibrate) { try { navigator.vibrate(10); } catch {} }
  }
  addEventListener('pointermove', e => {
    if (!listDrag || e.pointerId !== listDrag.id) return;
    e.preventDefault();
    const { li, ol } = listDrag;
    const box = ol.getBoundingClientRect();
    // Scroll the list when the finger nears its top or bottom.
    if (e.clientY < box.top + 40) ol.scrollTop -= 12; else if (e.clientY > box.bottom - 40) ol.scrollTop += 12;
    const others = [...ol.children].filter(x => x !== li);
    const target = others.find(x => { const r = x.getBoundingClientRect(); return e.clientY < r.top + r.height / 2; });
    if (target) { if (li.nextElementSibling !== target) target.before(li); } else if (ol.lastElementChild !== li) ol.append(li);
  }, { passive: false });
  const endListDrag = e => {
    if (!listDrag || (e && e.pointerId !== listDrag.id)) return;
    const ids = [...listDrag.ol.children].map(x => x.dataset.id);
    const id = listDrag.li.dataset.id;
    listDrag.li.classList.remove('is-dragging');
    listDrag = null;
    const byId = new Map(rows.map(c => [c.id, c]));
    rows = ids.map(x => byId.get(x)).filter(Boolean);
    drawRows(id);
  };
  addEventListener('pointerup', endListDrag);
  addEventListener('pointercancel', endListDrag);
  document.addEventListener('touchmove', event => { if (listDrag) event.preventDefault(); }, { passive: false });
  addEventListener('keydown', e => { if (e.key === 'Escape' && sheet && !sheet.hidden) closeSheet(); });

  const originalRender = renderCountries;
  renderCountries = function (...args) {
    const result = originalRender.apply(this, args);
    if (document.getElementById('countryList')) {
      applySavedOrder();
      decorate();
    }
    return result;
  };

  // Only react when admin mode is switched on or off (other modules toggle body classes often).
  let lastAdmin = isAdmin();
  new MutationObserver(() => {
    if (isAdmin() === lastAdmin) return;
    lastAdmin = isAdmin();
    decorate();
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  applySavedOrder();
  decorate();
})();

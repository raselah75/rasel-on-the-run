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
      ? `<button type="button" class="country-order-toggle${enabled ? ' is-on' : ''}" aria-pressed="${enabled}">${enabled ? 'Done arranging' : 'Arrange countries'}</button>
         ${enabled ? '<button type="button" class="country-order-reset">Reset order</button><span class="country-order-hint">Hold the grip and slide a card to its new place, or use the arrows.</span>' : ''}`
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
  }

  list.addEventListener('pointerdown', event => {
    if (!enabled) return;
    const handle = event.target.closest('.country-drag-handle');
    if (!handle || (event.pointerType === 'mouse' && event.button !== 0)) return;
    startDrag(event, handle);
  });
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
      enabled = !enabled;
      decorate();
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

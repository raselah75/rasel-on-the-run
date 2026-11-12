/* Country card ordering: owner-only drag and drop with persistent order. */
(() => {
  'use strict';
  const ORDER_KEY = 'raselOnTheRunCountryOrderV1';
  const list = document.getElementById('countryList');
  if (!list || typeof renderCountries !== 'function') return;
  const readOrder = () => {
    try { const value = JSON.parse(localStorage.getItem(ORDER_KEY) || '[]'); return Array.isArray(value) ? value : []; }
    catch { return []; }
  };
  const writeOrder = ids => localStorage.setItem(ORDER_KEY, JSON.stringify(ids));
  let draggedId = null;
  let enabled = false;

  function orderedIds() {
    return [...list.querySelectorAll('[data-open-country]')].map(el => el.dataset.openCountry);
  }
  function applySavedOrder() {
    const grid = list.querySelector('.nested-country-list');
    if (!grid) return;
    const saved = readOrder();
    if (!saved.length) return;
    const cards = [...grid.querySelectorAll('.country-shell')];
    const rank = new Map(saved.map((id, i) => [id, i]));
    cards.sort((a, b) => {
      const aid = a.querySelector('[data-open-country]')?.dataset.openCountry;
      const bid = b.querySelector('[data-open-country]')?.dataset.openCountry;
      const ar = rank.has(aid) ? rank.get(aid) : Number.MAX_SAFE_INTEGER;
      const br = rank.has(bid) ? rank.get(bid) : Number.MAX_SAFE_INTEGER;
      return ar - br;
    }).forEach(card => grid.append(card));
  }
  function decorate() {
    const heading = list.querySelector('.archive-page-heading');
    const grid = list.querySelector('.nested-country-list');
    if (!heading || !grid) return;
    const admin = document.body.classList.contains('admin-mode');
    let toolbar = heading.querySelector('.country-order-toolbar');
    if (!toolbar) {
      toolbar = document.createElement('div');
      toolbar.className = 'country-order-toolbar';
      heading.append(toolbar);
    }
    toolbar.innerHTML = admin
      ? `<button type="button" class="country-order-toggle" aria-pressed="${enabled}">${enabled ? 'Done arranging' : 'Arrange countries'}</button><span class="country-order-hint">Drag a country card to change its position.</span>`
      : '';
    grid.querySelectorAll('.country-shell').forEach(shell => {
      const card = shell.querySelector('[data-open-country]');
      if (!card) return;
      let handle = shell.querySelector('.country-drag-handle');
      if (!admin || !enabled) { handle?.remove(); shell.classList.remove('country-sort-active'); card.removeAttribute('draggable'); return; }
      if (!handle) {
        handle = document.createElement('button');
        handle.type = 'button';
        handle.className = 'country-drag-handle';
        handle.textContent = '↕';
        handle.setAttribute('aria-label', `Reorder ${card.querySelector('h2')?.textContent || 'country'}`);
        handle.title = 'Drag to reorder';
        handle.draggable = true;
        card.prepend(handle);
      }
      shell.classList.add('country-sort-active');
      card.removeAttribute('draggable');
    });
  }
  const originalRender = renderCountries;
  renderCountries = function(...args) {
    const result = originalRender.apply(this, args);
    if (document.getElementById('countryList')) {
      applySavedOrder();
      decorate();
    }
    return result;
  };

  list.addEventListener('click', event => {
    if (event.target.closest('.country-drag-handle')) { event.preventDefault(); event.stopImmediatePropagation(); return; }
    if (event.target.closest('.country-order-toggle')) {
      enabled = !enabled;
      decorate();
      return;
    }
    if (event.target.closest('.country-drag-handle')) event.preventDefault();
  });
  list.addEventListener('dragstart', event => {
    const handle = event.target.closest('.country-drag-handle');
    if (!handle || !document.body.classList.contains('admin-mode') || !enabled) { event.preventDefault(); return; }
    const shell = handle.closest('.country-shell');
    draggedId = shell?.querySelector('[data-open-country]')?.dataset.openCountry || null;
    if (!draggedId) { event.preventDefault(); return; }
    shell.classList.add('country-dragging');
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', draggedId);
  });
  list.addEventListener('dragover', event => {
    if (!enabled || !draggedId) return;
    const target = event.target.closest('.country-shell');
    if (!target) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    list.querySelectorAll('.country-drop-target').forEach(x => x.classList.remove('country-drop-target'));
    target.classList.add('country-drop-target');
  });
  list.addEventListener('drop', event => {
    if (!enabled || !draggedId) return;
    const target = event.target.closest('.country-shell');
    if (!target) return;
    event.preventDefault();
    const targetId = target.querySelector('[data-open-country]')?.dataset.openCountry;
    if (!targetId || targetId === draggedId) return;
    const grid = list.querySelector('.nested-country-list');
    const source = [...grid.querySelectorAll('.country-shell')].find(x => x.querySelector('[data-open-country]')?.dataset.openCountry === draggedId);
    if (!source) return;
    const targetRect = target.getBoundingClientRect();
    const insertAfter = event.clientY > targetRect.top + targetRect.height / 2;
    grid.insertBefore(source, insertAfter ? target.nextSibling : target);
    writeOrder(orderedIds());
    list.querySelectorAll('.country-drop-target,.country-dragging').forEach(x => x.classList.remove('country-drop-target','country-dragging'));
  });
  list.addEventListener('dragend', () => {
    draggedId = null;
    list.querySelectorAll('.country-drop-target,.country-dragging').forEach(x => x.classList.remove('country-drop-target','country-dragging'));
  });
  const observer = new MutationObserver(() => {
    if (!document.body.classList.contains('admin-mode')) { enabled = false; }
    applySavedOrder();
    decorate();
  });
  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  applySavedOrder();
  decorate();
})();

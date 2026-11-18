/* Rasel On the Run — My Study Journey */
(() => {
  'use strict';
  const KEY = 'raselOnTheRunStudyJourneyV1';
  const $ = (id) => document.getElementById(id);
  const timeline = $('studyJourneyTimeline');
  const form = $('studyEntryForm');
  if (!timeline || !form) return;
  const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const read = () => { try { const value = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(value) ? value : []; } catch (_) { return []; } };
  const save = (items) => localStorage.setItem(KEY, JSON.stringify(items));
  function render() {
    const items = read();
    if (!items.length) {
      timeline.innerHTML = '<div class="empty-state study-empty"><h3>Your story starts in the classroom</h3><p>School photographs, class memories, certificates, friends, and milestones will live here.</p></div>';
      return;
    }
    const order = {'Primary School':0,'High School':1,'College':2,'University':3,'Other':4};
    items.sort((a,b) => (order[a.level] ?? 9) - (order[b.level] ?? 9) || String(a.period || '').localeCompare(String(b.period || '')));
    timeline.innerHTML = items.map((item) => `<article class="study-entry"><div class="study-entry-meta"><span class="study-level">${escapeHTML(item.level)}</span><span class="study-period">${escapeHTML(item.period || 'A memorable chapter')}</span><span class="study-institution">${escapeHTML(item.institution)}</span></div><div class="study-entry-content"><h3>${escapeHTML(item.title)}</h3>${item.story ? `<p>${escapeHTML(item.story)}</p>` : ''}${item.photos?.length ? `<div class="study-photo-grid">${item.photos.map((photo) => `<img src="${photo.data}" alt="${escapeHTML(photo.name || 'Study memory')}" loading="lazy">`).join('')}</div>` : ''}<button class="study-delete" type="button" data-delete-study="${escapeHTML(item.id)}">Delete memory</button></div></article>`).join('');
  }
  $('addStudyEntryButton')?.addEventListener('click', () => { form.hidden = false; form.scrollIntoView({behavior:'smooth',block:'center'}); });
  $('cancelStudyEntry')?.addEventListener('click', () => { form.reset(); form.hidden = true; $('studyFormStatus').textContent = ''; });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!document.body.classList.contains('admin-mode')) return;
    const files = Array.from($('studyPhotos').files || []).filter(file => file.type.startsWith('image/'));
    const status = $('studyFormStatus');
    status.textContent = 'Preparing photos…';
    try {
      const photos = await Promise.all(files.map(file => new Promise((resolve, reject) => {
        const reader = new FileReader(); reader.onload = () => resolve({name:file.name,data:reader.result}); reader.onerror = reject; reader.readAsDataURL(file);
      })));
      const items = read();
      items.push({id:`study-${Date.now()}`,level:$('studyLevel').value,institution:$('studyInstitution').value.trim(),period:$('studyPeriod').value.trim(),title:$('studyTitle').value.trim(),story:$('studyStory').value.trim(),photos,createdAt:new Date().toISOString()});
      save(items); render(); form.reset(); form.hidden = true; status.textContent = '';
    } catch (error) { status.textContent = 'Could not save. Try fewer or smaller photos.'; console.error(error); }
  });
  timeline.addEventListener('click', (event) => {
    const button = event.target.closest('[data-delete-study]');
    if (!button || !document.body.classList.contains('admin-mode')) return;
    if (!confirm('Delete this study memory and its photos?')) return;
    save(read().filter(item => item.id !== button.dataset.deleteStudy)); render();
  });
  window.RNR_STUDY = { read, save, render };
  render();
})();

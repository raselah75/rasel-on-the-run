/* Rasel On the Run — profile details and discreet owner controls */
(() => {
  'use strict';
  const PROFILE_KEY = 'raselOnTheRunAboutMe';
  const ADMIN_KEY = 'raselOnTheRunAdminCredentialV1';
  const EMAIL = 'raselahmmed1520@gmail.com';
  const LOCATION = 'Toronto, ON, Canada';
  const STORY = "I'm an international student in Canada, currently based in Toronto, with a dream of travelling around the world. I want to discover new cultures, meet people, and experience the beauty of different places. Rasel On the Run is my personal space to document those journeys and keep every special memory alive.";

  function readProfile() {
    try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}') || {}; }
    catch (_) { return {}; }
  }
  const profile = { ...readProfile(), name: 'Rasel Ahmmed', title: 'International Student in Canada · Traveller · Explorer', bio: STORY, email: EMAIL, location: LOCATION };
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch (e) { console.warn('Profile details could not be saved', e); }
  if (typeof aboutMeProfile !== 'undefined') aboutMeProfile = profile;

  function addContactDetails() {
    const content = document.querySelector('#aboutMeSection .about-me-content');
    if (!content || content.querySelector('.about-contact-details')) return;
    const details = document.createElement('div');
    details.className = 'about-contact-details';
    const email = document.createElement('a');
    email.href = `mailto:${EMAIL}`;
    email.textContent = EMAIL;
    const location = document.createElement('span');
    location.textContent = LOCATION;
    details.append(email, location);
    const bio = content.querySelector('#aboutMeBio');
    (bio || content).insertAdjacentElement('afterend', details);
  }

  function addCornerControls() {
    document.getElementById('aboutMeNavLink')?.remove();
    document.getElementById('aboutMeHeroButton')?.remove();
    const nav = document.querySelector('.main-nav');
    if (!nav || document.getElementById('ownerCornerControls')) return;
    const wrap = document.createElement('div');
    wrap.id = 'ownerCornerControls';
    wrap.className = 'owner-corner-controls';
    const about = document.createElement('a');
    about.href = '#aboutMeSection';
    about.textContent = 'About Me';
    about.className = 'owner-about-link';
    about.addEventListener('click', () => document.getElementById('aboutMeSection')?.scrollIntoView({behavior:'smooth'}));
    const admin = document.createElement('button');
    admin.type = 'button';
    admin.id = 'ownerAdminToggle';
    admin.className = 'owner-admin-toggle';
    admin.textContent = 'Admin';
    admin.setAttribute('aria-label', 'Open private owner controls');
    wrap.append(about, admin);
    nav.append(wrap);
    admin.addEventListener('click', handleAdminToggle);
  }

  async function derive(password, salt) {
    if (!crypto?.subtle) throw new Error('Secure password support needs localhost or HTTPS.');
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({name:'PBKDF2', salt, iterations:180000, hash:'SHA-256'}, key, 256);
    return Array.from(new Uint8Array(bits), b => b.toString(16).padStart(2,'0')).join('');
  }
  function randomSalt() {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, b => b.toString(16).padStart(2,'0')).join('');
  }
  function fromHex(value) { return new Uint8Array((value.match(/.{2}/g) || []).map(x => parseInt(x,16))); }

  async function handleAdminToggle() {
    const existing = localStorage.getItem(ADMIN_KEY);
    try {
      if (!existing) {
        const first = prompt('Create your private owner passphrase (at least 8 characters):');
        if (first === null) return;
        if (first.length < 8) { alert('Use at least 8 characters.'); return; }
        const second = prompt('Enter the passphrase again:');
        if (second !== first) { alert('Passphrases did not match.'); return; }
        const salt = randomSalt();
        const hash = await derive(first, fromHex(salt));
        localStorage.setItem(ADMIN_KEY, JSON.stringify({salt, hash}));
        document.body.classList.add('admin-mode');
        updateAdminButton();
        alert('Owner controls are now visible on this device.');
        return;
      }
      if (document.body.classList.contains('admin-mode')) {
        document.body.classList.remove('admin-mode');
        updateAdminButton();
        return;
      }
      const pass = prompt('Enter your owner passphrase:');
      if (pass === null) return;
      const saved = JSON.parse(existing);
      const hash = await derive(pass, fromHex(saved.salt));
      if (hash !== saved.hash) { alert('Incorrect passphrase.'); return; }
      document.body.classList.add('admin-mode');
      updateAdminButton();
    } catch (error) {
      console.error(error);
      alert(error.message || 'Could not open owner controls.');
    }
  }
  function updateAdminButton() {
    const button = document.getElementById('ownerAdminToggle');
    if (button) button.textContent = document.body.classList.contains('admin-mode') ? 'Lock' : 'Admin';
  }

  function init() {
    if (typeof updateAboutMeDisplay === 'function') updateAboutMeDisplay();
    addContactDetails();
    addCornerControls();
    updateAdminButton();
    // Keep the existing profile editor/photo picker available only in owner mode.
    const edit = document.getElementById('editAboutMeButton');
    const photo = document.getElementById('changeAboutMePhotoButton');
    if (edit) edit.title = 'Visible only while owner controls are unlocked';
    if (photo) photo.title = 'Visible only while owner controls are unlocked';
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

/* =====================================================================
   RASEL ON THE RUN — SITE SETTINGS
   Edit the values below, save the file, and upload the site again.
   ===================================================================== */
window.RNR_SITE = {
  ownerName: 'Rasel Ahmmed',

  // Contact form ---------------------------------------------------------
  // 1. Create a free account at https://formspree.io and make a new form.
  // 2. Formspree gives you an address like https://formspree.io/f/abcdwxyz
  // 3. Put only the last part here, e.g. formspreeId: 'abcdwxyz'
  // Messages then arrive in your email inbox. Until this is filled in, the
  // form opens the visitor's own email app instead (your address is never
  // printed on the page).
  formspreeId: '',
  contactEmailUser: 'raselahmmed1520',
  contactEmailDomain: 'gmail.com',

  // Travels page globe ----------------------------------------------------
  // Countries you have been to. Every visitor sees these glowing on the globe.
  // Use the same names as on the country cards, e.g. 'United States', 'Türkiye'.
  // (Countries you tick with "Mark as visited" in Admin mode are added on your
  // own device too.)
  visitedCountries: ['Bangladesh', 'Canada', 'Maldives', 'Nepal', 'India'],

  // Journey lines on the globe (from -> to). Add more trips the same way.
  journeys: [
    { label: 'Dhaka → Toronto', from: { name: 'Dhaka', lat: 23.81, lng: 90.41 }, to: { name: 'Toronto', lat: 43.65, lng: -79.38 } }
  ],

  // Visitor statistics (optional) -------------------------------------------
  // Plausible (simple, privacy-friendly, paid after a free trial): sign up at
  // plausible.io, add your domain, then put it here, e.g. 'raselontherun.com'.
  // Google Analytics (free): create a property and paste the Measurement ID,
  // e.g. 'G-ABC123XYZ'. Your own visits (Admin devices) are never counted.
  analytics: { plausibleDomain: '', googleAnalyticsId: '' },

  // Publish to the web (Supabase) -----------------------------------------
  // See "PUBLISH TO THE WEB – ONE-TIME SETUP" in README.txt.
  // supabaseUrl:      the "Connect" button at the top of your Supabase project
  //                   (or Project Settings > General: https://<Reference ID>.supabase.co)
  // supabaseAnonKey:  Project Settings > API Keys > Publishable key (sb_publishable_...)
  //                   An old-style "anon" key (eyJ...) also works. Both are public, safe here.
  // NEVER put the service_role / secret key in this file.
  cloud: {
    supabaseUrl: '',
    supabaseAnonKey: '',
    ownerEmail: 'raselahmmed1520@gmail.com',
    bucket: 'site'
  },

  // Your website address after you put it online, e.g. 'https://raselontherun.com'
  siteUrl: ''
};

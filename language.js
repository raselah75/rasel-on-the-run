/* =====================================================================
   RASEL ON THE RUN — বাংলা / ENGLISH
   A switch in the header shows the public pages in Bangla.
   Your own written content (stories, captions, names of places) stays as
   you wrote it. Owner tools in "My Toolkit" stay in English.
   ===================================================================== */
(() => {
  'use strict';
  const KEY = 'raselOnTheRunLanguageV1';
  const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
  const toBn = value => String(value).replace(/\d/g, d => BN_DIGITS[d]);

  const T = {
    // Header, footer, navigation
    'Every Journey Tells a Story.': 'প্রতিটি যাত্রাই একটি গল্প।',
    'Home': 'হোম', 'Travels': 'ভ্রমণ', 'Travel Destinations': 'ভ্রমণের গন্তব্য', 'My Journey Plan': 'আমার যাত্রা পরিকল্পনা', 'Journey Plan': 'যাত্রা পরিকল্পনা', 'My Study Journey': 'আমার পড়াশোনার যাত্রা', 'Trips, plans and adventures — where I have been and where I am going next.': 'ভ্রমণ, পরিকল্পনা আর অ্যাডভেঞ্চার—কোথায় গেছি আর এরপর কোথায় যাচ্ছি।', 'The first plans are being written.': 'প্রথম পরিকল্পনাগুলো লেখা হচ্ছে।', 'Study Journey': 'পড়াশোনার যাত্রা', 'Stories': 'গল্প', 'About': 'আমার কথা',
    'My Toolkit': 'আমার টুলকিট', 'Search': 'খুঁজুন', 'Add Photos': 'ছবি যোগ করুন',
    // Hero + clocks
    'MY PERSONAL TRAVEL JOURNAL': 'আমার ব্যক্তিগত ভ্রমণ-ডায়েরি',
    'Collect moments.': 'মুহূর্তগুলো জমিয়ে রাখি।',
    'Remember journeys.': 'যাত্রাগুলো মনে রাখি।',
    "A personal collection of places I've explored, people I've met, and memories I've made.": 'যেসব জায়গা ঘুরেছি, যাদের সাথে দেখা হয়েছে আর যে স্মৃতিগুলো জমেছে—সব এক জায়গায়।',
    'Explore My Travels': 'আমার ভ্রমণ দেখুন', 'Add Your Memories': 'স্মৃতি যোগ করুন',
    'Toronto': 'টরন্টো', 'Dhaka': 'ঢাকা', 'Where I live': 'যেখানে থাকি',
    // Welcome
    'WELCOME TO MY WORLD': 'আমার পৃথিবীতে স্বাগতম',
    'Every destination has a story.': 'প্রতিটি গন্তব্যের একটি গল্প আছে।',
    'This is where I keep my travel photographs and experiences, organized by country, region, and city.': 'এখানে আমি আমার ভ্রমণের ছবি আর অভিজ্ঞতা দেশ, অঞ্চল আর শহর অনুযায়ী সাজিয়ে রাখি।',
    // Destinations
    'THE JOURNEY': 'যাত্রা', 'My Destinations': 'আমার গন্তব্যগুলো',
    'Explore my memories, one destination at a time.': 'এক এক করে গন্তব্য ধরে আমার স্মৃতিগুলো দেখুন।',
    'Choose a country to explore its administrative areas, cities and memories.': 'একটি দেশ বেছে নিন—তার অঞ্চল, শহর আর স্মৃতিগুলো দেখতে।',
    'COUNTRY': 'দেশ', 'See City Memories →': 'শহরের স্মৃতি দেখুন →',
    'PHOTO GALLERY': 'ছবির গ্যালারি', 'Timeline': 'টাইমলাইন', 'Every photo, video and story in the order it happened.': 'প্রতিটি ছবি, ভিডিও আর গল্প—যে ক্রমে ঘটেছে।',
    'Add dates to your photos to build your timeline.': 'টাইমলাইন তৈরি করতে ছবিতে তারিখ যোগ করুন।',
    'HIGHLIGHTS': 'সেরা মুহূর্ত', 'Best shots': 'সেরা ছবি', 'A few favourite photographs from the road.': 'পথের কিছু প্রিয় ছবি।',
    'THEN & NOW': 'তখন ও এখন', 'Then & Now': 'তখন ও এখন', 'The same place, years apart. Drag the line to compare.': 'একই জায়গা, বছরের ব্যবধানে। দাগটা টেনে তুলনা করুন।',
    'PHOTO MAP': 'ছবির ম্যাপ', 'Where my photos were taken': 'আমার ছবিগুলো কোথায় তোলা', 'Tap a pin to open the photos from that city.': 'পিনে চাপ দিলে সেই শহরের ছবি খুলবে।',
    'Tap to move the map': 'ম্যাপ সরাতে চাপ দিন', 'Want to visit': 'যেতে চাই', 'Videos': 'ভিডিও', 'ON THE MOVE': 'চলার পথে', 'Cinematic': 'সিনেমাটিক', 'Travel videos': 'ভ্রমণের ভিডিও',
    'Short cinematic moments and travel videos from the road.': 'পথের ছোট সিনেমাটিক মুহূর্ত আর ভ্রমণের ভিডিও।',
    'Cinematic moments and travel videos from the road.': 'পথের সিনেমাটিক মুহূর্ত আর ভ্রমণের ভিডিও।',
    'Moments in 15 seconds or less.': '১৫ সেকেন্ড বা তার কম সময়ের মুহূর্ত।', 'Stories from the road, up to 2½ minutes.': 'পথের গল্প, সর্বোচ্চ আড়াই মিনিট।',
    'Watch all videos': 'সব ভিডিও দেখুন', 'The first videos are being edited.': 'প্রথম ভিডিওগুলো এডিট হচ্ছে।',
    'Cinematic videos': 'সিনেমাটিক ভিডিও', 'Travel video': 'ভ্রমণের ভিডিও', 'Newest first': 'নতুন আগে', 'Oldest first': 'পুরোনো আগে', '+ Add photos': '+ ছবি যোগ করুন',
    'Show more photos': 'আরও ছবি দেখুন', 'Photos from this place are coming soon.': 'এই জায়গার ছবি শিগগিরই আসছে।',
    'No photos yet. Add your first photos.': 'এখনো কোনো ছবি নেই। প্রথম ছবিগুলো যোগ করুন।', 'Adding photos…': 'ছবি যোগ হচ্ছে…', 'View all destinations': 'সব গন্তব্য দেখুন', 'See all photos': 'সব ছবি দেখুন',
    '← All Countries': '← সব দেশ', 'Explore the cities in this region.': 'এই অঞ্চলের শহরগুলো দেখুন।',
    // Memories
    'PERSONAL COLLECTION': 'ব্যক্তিগত সংগ্রহ', 'My Travel Memories': 'আমার ভ্রমণের স্মৃতি',
    'Your photographs, preserved in one beautiful place.': 'আমার ছবিগুলো, এক সুন্দর জায়গায় সাজানো।',
    // Stories
    'TRAVEL STORIES': 'ভ্রমণের গল্প', 'Stories from the road': 'পথের গল্প',
    'The moments behind the photographs.': 'ছবির পেছনের মুহূর্তগুলো।',
    'Read story': 'গল্পটি পড়ুন', 'Read all stories': 'সব গল্প পড়ুন', '← All stories': '← সব গল্প',
    'Copy link': 'লিংক কপি করুন', 'Link copied': 'লিংক কপি হয়েছে', 'Previous story': 'আগের গল্প', 'Next story': 'পরের গল্প',
    'More of this story is coming soon.': 'এই গল্পের বাকিটা শিগগিরই আসছে।',
    'Road trip': 'রোড ট্রিপ', 'Family trip': 'পারিবারিক ভ্রমণ', 'Solo adventure': 'একা অভিযান', 'First journey': 'প্রথম যাত্রা',
    'Nature & wildlife': 'প্রকৃতি ও বন্যপ্রাণী', 'Culture & people': 'সংস্কৃতি ও মানুষ', 'Special memory': 'বিশেষ স্মৃতি', 'Other': 'অন্যান্য',
    // Page banners + coming soon
    'RASEL ON THE RUN': 'রাসেল অন দ্য রান',
    'Countries, cities and the photographs from every road I have travelled.': 'যত পথ ঘুরেছি—তার দেশ, শহর আর ছবি।',
    'My Study Journey': 'আমার পড়াশোনার যাত্রা',
    'From my first classroom to studying in Canada, one chapter at a time.': 'প্রথম ক্লাসরুম থেকে কানাডায় পড়াশোনা—এক এক অধ্যায় করে।',
    'The moments, people and places behind the photographs.': 'ছবির পেছনের মুহূর্ত, মানুষ আর জায়গাগুলো।',
    'About Me': 'আমার কথা',
    'An international student in Toronto with a dream of seeing the whole world.': 'টরন্টোর একজন আন্তর্জাতিক শিক্ষার্থী, যার স্বপ্ন পুরো পৃথিবী দেখা।',
    'Coming soon': 'শিগগিরই আসছে', 'Explore my travels': 'আমার ভ্রমণ দেখুন',
    'Study memories are on their way.': 'পড়াশোনার স্মৃতিগুলো শিগগিরই আসছে।',
    'The first stories are being written.': 'প্রথম গল্পগুলো লেখা হচ্ছে।',
    'New content is on its way.': 'নতুন কিছু শিগগিরই আসছে।',
    // Guestbook
    'GUESTBOOK': 'অতিথি খাতা', 'Leave a note': 'একটি নোট রেখে যান', 'A few words from you — where you are from, a travel tip, or just hello. Notes appear here for everyone.': 'আপনার দুই লাইন — কোথা থেকে এসেছেন, ভ্রমণের কোনো টিপস, বা শুধু হ্যালো। নোটগুলো সবাই এখানে দেখতে পাবে।',
    'Your name': 'আপনার নাম', 'From (city or country)': 'কোথা থেকে (শহর বা দেশ)', 'Message': 'বার্তা', 'Send message': 'বার্তা পাঠান',
    "Messages appear after I read them. Please don't share private details.": 'আমি পড়ার পর বার্তা দেখা যাবে। ব্যক্তিগত তথ্য লিখবেন না।',
    // Bangladesh districts map
    'MY BANGLADESH': 'আমার বাংলাদেশ', '64 districts, one map': '৬৪ জেলা, একটি মানচিত্র', '64 Districts, One Map': '৬৪ জেলা, একটি মানচিত্র', 'Every district I have been to lights up. Tap one to see its photos.': 'যে জেলাগুলোতে গেছি সেগুলো আলোকিত। ছবি দেখতে যেকোনো জেলায় চাপ দিন।',
    // Passport, routes, 360° views, food diary
    'PASSPORT': 'পাসপোর্ট', 'My passport stamps': 'আমার পাসপোর্টের সিল', 'One stamp for every country I have stepped into.': 'যে দেশেই পা রেখেছি, তার একটি করে সিল।',
    'ON THE ROAD': 'পথে পথে', 'My trip routes': 'আমার ভ্রমণের রুট', 'Pick a trip and watch the route draw itself, stop by stop.': 'একটি ট্রিপ বেছে নিন—রুটটা নিজে নিজে আঁকা হবে, এক স্টপ থেকে আরেক স্টপে।',
    'Stops': 'স্টপ', 'km': 'কিমি', '▶ Replay route': '▶ আবার দেখুন',
    '360° VIEWS': '৩৬০° দৃশ্য', 'Stand where I stood': 'আমি যেখানে দাঁড়িয়েছিলাম', 'Open a view and drag to look around, or move your phone.': 'একটি দৃশ্য খুলে টেনে চারপাশ দেখুন, অথবা ফোনটা ঘোরান।',
    'Drag to look around': 'টেনে চারপাশ দেখুন',
    'FOOD DIARY': 'খাবারের ডায়েরি', 'Tastes from the road': 'পথের স্বাদ', 'What I ate, where I ate it, and whether I would go back for more.': 'কী খেয়েছি, কোথায় খেয়েছি, আর আবার খেতে যাব কি না।',
    'Show more dishes': 'আরও খাবার দেখুন',
    // Globe
    'MY WORLD': 'আমার পৃথিবী', "Where I've been": 'যেখানে গিয়েছি',
    'Every glowing light is a country I have visited. Spin the globe and tap a light to open that country.': 'প্রতিটি জ্বলজ্বলে আলো এমন একটি দেশ, যেখানে আমি গিয়েছি। গ্লোবটি ঘুরিয়ে যেকোনো আলোতে চাপ দিলে সেই দেশটি খুলবে।',
    'Countries visited': 'দেশ ঘুরেছি', 'Continents': 'মহাদেশ', 'Countries in my archive': 'দেশ আর্কাইভে আছে',
    'Visited': 'ঘুরেছি', 'In my archive': 'আর্কাইভে আছে', 'My journey': 'আমার যাত্রা', 'Dhaka → Toronto': 'ঢাকা → টরন্টো',
    // Study
    'A JOURNEY THROUGH THE YEARS': 'বছরের পর বছরের যাত্রা',
    "From my first school days to college and university — a collection of the people, places, achievements, and little moments I'll always remember.": 'স্কুলের প্রথম দিন থেকে কলেজ আর বিশ্ববিদ্যালয়—যে মানুষ, জায়গা, অর্জন আর ছোট ছোট মুহূর্ত সবসময় মনে থাকবে, তার সংগ্রহ।',
    'Primary School': 'প্রাথমিক বিদ্যালয়', 'High School': 'উচ্চ বিদ্যালয়', 'College': 'কলেজ', 'University': 'বিশ্ববিদ্যালয়',
    // About + contact
    'THE PERSON BEHIND THE JOURNEYS': 'যাত্রাগুলোর পেছনের মানুষটি',
    "Hi, I'm Rasel Ahmmed.": 'হাই, আমি রাসেল আহমেদ।',
    'International Student in Canada · Traveller · Explorer': 'কানাডায় আন্তর্জাতিক শিক্ষার্থী · ভ্রমণপ্রেমী · অভিযাত্রী',
    "I'm an international student in Canada, currently based in Toronto, with a dream of travelling around the world. I want to discover new cultures, meet people, and experience the beauty of different places. Rasel On the Run is my personal space to document those journeys and keep every special memory alive.": 'আমি কানাডায় একজন আন্তর্জাতিক শিক্ষার্থী, এখন টরন্টোতে থাকি, আর আমার স্বপ্ন পুরো পৃথিবী ঘুরে দেখা। নতুন সংস্কৃতি জানতে, মানুষের সাথে পরিচিত হতে আর নানা জায়গার সৌন্দর্য উপভোগ করতে চাই। "রাসেল অন দ্য রান" আমার নিজের জায়গা, যেখানে সেই যাত্রাগুলো লিখে রাখি আর প্রতিটি বিশেষ স্মৃতি বাঁচিয়ে রাখি।',
    'Location:': 'অবস্থান:', 'My Travel Philosophy': 'আমার ভ্রমণ-দর্শন',
    'Collect moments, discover cultures, explore new places, and keep every journey alive through memories.': 'মুহূর্ত জমাও, সংস্কৃতি জানো, নতুন জায়গা ঘুরে দেখো, আর স্মৃতির মধ্যে প্রতিটি যাত্রা বাঁচিয়ে রাখো।',
    'SAY HELLO': 'হ্যালো বলুন', 'Get in touch': 'যোগাযোগ করুন',
    'Have a travel tip, a question about studying in Canada, or a place I should see next? Send me a message.': 'ভ্রমণের কোনো টিপস, কানাডায় পড়াশোনা নিয়ে প্রশ্ন, বা পরের কোনো জায়গার পরামর্শ আছে? আমাকে একটা বার্তা পাঠান।',
    'Your name': 'আপনার নাম', 'Your email': 'আপনার ইমেইল', 'Message': 'বার্তা', 'Send message': 'বার্তা পাঠান',
    'Sending…': 'পাঠানো হচ্ছে…',
    'Thank you! Your message has been sent.': 'ধন্যবাদ! আপনার বার্তা পাঠানো হয়েছে।',
    'Please add your name, a valid email and a message.': 'অনুগ্রহ করে নাম, সঠিক ইমেইল আর বার্তা লিখুন।',
    'Sorry, the message could not be sent. Please try again later.': 'দুঃখিত, বার্তাটি পাঠানো যায়নি। পরে আবার চেষ্টা করুন।',
    'Your email app should open with the message ready to send.': 'আপনার ইমেইল অ্যাপে বার্তাটি পাঠানোর জন্য তৈরি হয়ে খুলবে।'
  };
  // Administrative labels (singular and plural are the same in Bangla).
  const LABELS = {
    Division: 'বিভাগ', Province: 'প্রদেশ', State: 'রাজ্য', Region: 'অঞ্চল', Atoll: 'প্রবালদ্বীপ', County: 'কাউন্টি',
    District: 'জেলা', Governorate: 'গভর্নরেট', Prefecture: 'প্রিফেকচার', Voivodeship: 'ভয়েভোডশিপ', Department: 'ডিপার্টমেন্ট',
    Municipality: 'পৌরসভা', Parish: 'প্যারিশ', Country: 'দেশ', 'Autonomous Community': 'স্বায়ত্তশাসিত অঞ্চল', City: 'শহর', Emirate: 'আমিরাত', Canton: 'ক্যান্টন'
  };
  const PLURAL = { Divisions: 'Division', Provinces: 'Province', States: 'State', Regions: 'Region', Atolls: 'Atoll', Counties: 'County', Districts: 'District',
    Governorates: 'Governorate', Prefectures: 'Prefecture', Voivodeships: 'Voivodeship', Departments: 'Department', Municipalities: 'Municipality',
    Parishes: 'Parish', Countries: 'Country', 'Autonomous Communities': 'Autonomous Community', Cities: 'City', Emirates: 'Emirate', Cantons: 'Canton' };
  const labelBn = word => LABELS[PLURAL[word] || word];

  // Country names in Bangla (from the browser's own language data).
  const ISO = { Bangladesh: 'BD', Canada: 'CA', Maldives: 'MV', Nepal: 'NP', India: 'IN', France: 'FR', Spain: 'ES', 'United States': 'US', 'Türkiye': 'TR',
    Italy: 'IT', Mexico: 'MX', 'United Kingdom': 'GB', Germany: 'DE', Japan: 'JP', Greece: 'GR', Thailand: 'TH', Austria: 'AT', 'Saudi Arabia': 'SA',
    Portugal: 'PT', Malaysia: 'MY', Netherlands: 'NL', Poland: 'PL', Vietnam: 'VN', Morocco: 'MA', 'South Korea': 'KR', Egypt: 'EG', Hungary: 'HU',
    Singapore: 'SG', Albania: 'AL', Tunisia: 'TN', Uzbekistan: 'UZ', 'South Africa': 'ZA', Sweden: 'SE', Bulgaria: 'BG', 'Dominican Republic': 'DO',
    Australia: 'AU', Iran: 'IR', Brazil: 'BR', Colombia: 'CO', Cambodia: 'KH', Argentina: 'AR', Ireland: 'IE', Bahrain: 'BH', Philippines: 'PH',
    Chile: 'CL', Jordan: 'JO', Georgia: 'GE', Qatar: 'QA', Andorra: 'AD', 'Sri Lanka': 'LK' };
  let regionNames = null;
  try { regionNames = new Intl.DisplayNames(['bn'], { type: 'region' }); } catch {}
  const countryBn = name => { const code = ISO[name]; if (!code || !regionNames) return null; const bn = regionNames.of(code); return bn && bn !== code ? bn : null; };

  const PATTERNS = [
    [/^(\d+) (.+)$/, (m) => { const l = labelBn(m[2]); return l ? `${toBn(m[1])}টি ${l}` : null; }],
    [/^Explore (.+) →$/, (m) => { const l = labelBn(m[1]); return l ? `${l} দেখুন →` : null; }],
    [/^← All (.+)$/, (m) => { const l = labelBn(m[1]); return l ? `← সব ${l}` : null; }],
    [/^\+ Add (.+)$/, (m) => { const l = labelBn(m[1]); return l ? `+ ${l} যোগ করুন` : null; }],
    [/^Choose a (.+) to explore its cities\.$/, (m) => { const l = labelBn(m[1]); return l ? `শহরগুলো দেখতে একটি ${l} বেছে নিন।` : null; }],
    [/^CITIES IN (.+)$/, (m) => `${m[1]}-এর শহরগুলো`],
    [/^Travel memories from (.+)\.$/, (m) => `${m[1]}-এর ভ্রমণ-স্মৃতি।`],
    [/^Photos from (.+)$/, (m) => `${countryBn(m[1]) || m[1]}-এর ছবি`],
    [/^(\d+) photos?$/, (m) => `${toBn(m[1])}টি ছবি`],
    [/^([A-Z][A-Z ]+)$/, (m) => { const word = m[1].toLowerCase().replace(/\b\w/g, c => c.toUpperCase()); const l = labelBn(word); return l || null; }],
    [/^© (\d{4}) Rasel On the Run\. All rights reserved\.$/, (m) => `© ${toBn(m[1])} রাসেল অন দ্য রান। সর্বস্বত্ব সংরক্ষিত।`],
    [/^(.+) \| Rasel On the Run$/, (m) => `${T[m[1]] || m[1]} | রাসেল অন দ্য রান`]
  ];

  // Areas that are translated (public pages). Owner tools are skipped.
  const ROOTS = '.rnr-upload-progress, #rnrJourneyPlan, #rnrPassport, #rnrDistricts, #rnrGuestbook, #rnrTripRoutes, #rnrPanoramas, #rnrFood, .rnr-pano-viewer, #rnrVideos, #rnrNextTrip, #rnrBestShots, #rnrThenNow, #rnrPhotoMap, #rnrTimeline, .rnr-player, .site-header, .site-footer, #home, #welcome, #rnrPageBanner, #rnrComingSoon, #rnrGlobe, #destinations, #memories, #rnrStories, #studyJourney, #aboutMeSection, #contact, #rnrReader';
  const SKIP = 'script, style, input, textarea, .rnr-story-excerpt, .rnr-reader-text, .rnr-card-caption, .memory-caption, .rnr-story-body h3, .rnr-reader-head h1, .study-entry-content, .brand-name, .footer-brand, .hierarchy-flag, .rnr-clock-time, .rnr-clock-date, .ltd-section, [data-no-translate]';
  const originals = new WeakMap();
  let lang = 'en';
  try { lang = localStorage.getItem(KEY) === 'bn' ? 'bn' : 'en'; } catch {}

  function translate(text, node) {
    const key = text.replace(/\s+/g, ' ').trim();
    if (!key) return null;
    if (node?.parentElement?.closest('.rnr-clock-label small') && key === 'Home') return 'নিজের দেশ';
    if (T[key]) return T[key];
    const parentIsCountry = node?.parentElement?.closest('#countryList .hierarchy-info h2, .rnr-globe-list button, .archive-page-heading h2');
    if (parentIsCountry) { const bn = countryBn(key); if (bn) return bn; }
    for (const [re, fn] of PATTERNS) { const m = key.match(re); if (m) { const out = fn(m); if (out) return out; } }
    return null;
  }

  let applying = false;
  function apply(root) {
    applying = true;
    const roots = root ? [root] : [...document.querySelectorAll(ROOTS)];
    roots.forEach(r => {
      const walker = document.createTreeWalker(r, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        const el = node.parentElement;
        if (!el || el.closest(SKIP) || !el.closest(ROOTS)) continue;
        if (lang === 'bn') {
          const source = originals.has(node) && node.nodeValue === originals.get(node).shown ? originals.get(node).en : node.nodeValue;
          const out = translate(source, node);
          if (out && node.nodeValue.trim() !== out) {
            const lead = source.match(/^\s*/)[0], tail = source.match(/\s*$/)[0];
            originals.set(node, { en: source, shown: lead + out + tail });
            node.nodeValue = lead + out + tail;
          }
        } else if (originals.has(node)) {
          const saved = originals.get(node);
          if (node.nodeValue === saved.shown) node.nodeValue = saved.en;
          originals.delete(node);
        }
      }
      r.querySelectorAll?.('input[placeholder], textarea[placeholder]').forEach(input => {
        if (!input.dataset.enPlaceholder) input.dataset.enPlaceholder = input.placeholder;
        input.placeholder = lang === 'bn' ? (T[input.dataset.enPlaceholder] || input.dataset.enPlaceholder) : input.dataset.enPlaceholder;
      });
    });
    const title = document.title;
    if (lang === 'bn') { const t = translate(title); if (t) document.title = t; }
    document.documentElement.lang = lang === 'bn' ? 'bn' : 'en';
    document.body.classList.toggle('rnr-lang-bn', lang === 'bn');
    applying = false;
  }

  // ---------- Switch in the header ----------
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'rnr-lang-toggle';
  button.setAttribute('data-no-translate', '');
  const label = () => {
    button.textContent = lang === 'bn' ? 'English' : 'বাংলা';
    button.setAttribute('aria-label', lang === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন');
  };
  label();
  button.addEventListener('click', () => {
    lang = lang === 'bn' ? 'en' : 'bn';
    try { localStorage.setItem(KEY, lang); } catch {}
    label();
    apply();
    window.dispatchEvent(new CustomEvent('rnr:language', { detail: lang }));
  });
  function placeButton() {
    const tools = document.getElementById('rnrNavTools');
    if (tools && !tools.contains(button)) tools.prepend(button);
    else if (!tools && !button.isConnected) document.querySelector('.site-header')?.append(button);
  }

  // Re-apply when pages, cards or stories are re-drawn.
  let queued = 0;
  const observer = new MutationObserver(() => {
    if (applying || lang !== 'bn') return;
    cancelAnimationFrame(queued);
    queued = requestAnimationFrame(() => apply());
  });
  function init() {
    placeButton();
    apply();
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    new MutationObserver(() => { if (lang === 'bn' && !applying) { const t = translate(document.title); if (t && t !== document.title) document.title = t; } })
      .observe(document.querySelector('title'), { childList: true, characterData: true, subtree: true });
  }
  window.RNR_LANG = () => lang;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(init, 0), { once: true }); else setTimeout(init, 0);
})();

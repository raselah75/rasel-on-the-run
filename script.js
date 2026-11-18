
"use strict";

// =============================================
// RASEL ON THE RUN
// COUNTRY > PROVINCE > CITY > PHOTOS
// =============================================

const STORAGE_KEY = "raselOnTheRunData";
const DB_NAME = "RaselOnTheRunPhotos";
const DB_VERSION = 1;

// =============================================
// 50 STARTER COUNTRIES AND FLAGS
// =============================================

const starterCountries = [
  ["Bangladesh", "🇧🇩"],
  ["Canada", "🇨🇦"],
  ["Maldives", "🇲🇻"],
  ["Nepal", "🇳🇵"],
  ["India", "🇮🇳"],
  ["France", "🇫🇷"],
  ["Spain", "🇪🇸"],
  ["United States", "🇺🇸"],
  ["Türkiye", "🇹🇷"],
  ["Italy", "🇮🇹"],
  ["Mexico", "🇲🇽"],
  ["United Kingdom", "🇬🇧"],
  ["Germany", "🇩🇪"],
  ["Japan", "🇯🇵"],
  ["Greece", "🇬🇷"],
  ["Thailand", "🇹🇭"],
  ["Austria", "🇦🇹"],
  ["Saudi Arabia", "🇸🇦"],
  ["Portugal", "🇵🇹"],
  ["Malaysia", "🇲🇾"],
  ["Netherlands", "🇳🇱"],
  ["Poland", "🇵🇱"],
  ["Vietnam", "🇻🇳"],
  ["Morocco", "🇲🇦"],
  ["South Korea", "🇰🇷"],
  ["Egypt", "🇪🇬"],
  ["Hungary", "🇭🇺"],
  ["Singapore", "🇸🇬"],
  ["Albania", "🇦🇱"],
  ["Tunisia", "🇹🇳"],
  ["Uzbekistan", "🇺🇿"],
  ["South Africa", "🇿🇦"],
  ["Sweden", "🇸🇪"],
  ["Bulgaria", "🇧🇬"],
  ["Dominican Republic", "🇩🇴"],
  ["Australia", "🇦🇺"],
  ["Iran", "🇮🇷"],
  ["Brazil", "🇧🇷"],
  ["Colombia", "🇨🇴"],
  ["Cambodia", "🇰🇭"],
  ["Argentina", "🇦🇷"],
  ["Ireland", "🇮🇪"],
  ["Bahrain", "🇧🇭"],
  ["Philippines", "🇵🇭"],
  ["Chile", "🇨🇱"],
  ["Jordan", "🇯🇴"],
  ["Georgia", "🇬🇪"],
  ["Qatar", "🇶🇦"],
  ["Andorra", "🇦🇩"],
  ["Sri Lanka", "🇱🇰"]
];

const countryFlags = Object.fromEntries(starterCountries);


// Country-specific administrative labels: keep the archive exactly two levels deep.
function regionLabelFor(countryName) {
  const labels = {
    "Bangladesh": "Division",
    "Canada": "Province",
    "Maldives": "Atoll",
    "Nepal": "Province",
    "India": "State",
    "France": "Region",
    "Spain": "Autonomous Community",
    "United States": "State",
    "Türkiye": "Province",
    "Italy": "Region",
    "Mexico": "State",
    "United Kingdom": "Country",
    "Germany": "State",
    "Japan": "Prefecture",
    "Greece": "Region",
    "Thailand": "Province",
    "Austria": "State",
    "Saudi Arabia": "Province",
    "Portugal": "District",
    "Malaysia": "State",
    "Netherlands": "Province",
    "Poland": "Voivodeship",
    "Vietnam": "Province",
    "Morocco": "Region",
    "South Korea": "Province",
    "Egypt": "Governorate",
    "Hungary": "County",
    "Singapore": "District",
    "Albania": "County",
    "Tunisia": "Governorate",
    "Uzbekistan": "Region",
    "South Africa": "Province",
    "Sweden": "County",
    "Bulgaria": "Province",
    "Dominican Republic": "Province",
    "Australia": "State",
    "Iran": "Province",
    "Brazil": "State",
    "Colombia": "Department",
    "Cambodia": "Province",
    "Argentina": "Province",
    "Ireland": "County",
    "Bahrain": "Governorate",
    "Philippines": "Province",
    "Chile": "Region",
    "Jordan": "Governorate",
    "Georgia": "Region",
    "Qatar": "Municipality",
    "Andorra": "Parish",
    "Sri Lanka": "Province",
  };
  return labels[countryName] || "Administrative Area";
}

function pluralRegionLabelFor(countryName) {
  const label = regionLabelFor(countryName);
  const irregular = {
    "Country": "Countries",
    "County": "Counties",
    "Autonomous Community": "Autonomous Communities",
    "Municipality": "Municipalities",
    "Parish": "Parishes",
    "Voivodeship": "Voivodeships",
    "Prefecture": "Prefectures",
    "Governorate": "Governorates",
    "Atoll": "Atolls",
    "District": "Districts",
    "Department": "Departments",
    "Region": "Regions",
    "Province": "Provinces",
    "Division": "Divisions",
    "State": "States"
  };
  return irregular[label] || `${label}s`;
}

// =============================================
// HELPER FUNCTIONS
// =============================================

function createId() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : "id-" + Date.now() + Math.random().toString(16).slice(2);
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function getCountryFlag(name) {
  const country = travelData?.find(item => item.name === name);
  return country?.customFlag || countryFlags[name] || "🏳️";
}

function cleanName(name) {
  return String(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

// =============================================
// LOAD AND SAVE TRAVEL DATA
// =============================================

function loadTravelData() {
  try {
    const data = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );

    if (!Array.isArray(data)) return [];

    return data.map(country => ({
      ...country,
      id: country.id || createId(),
      regions: Array.isArray(country.regions)
        ? country.regions.map(region => ({
            ...region,
            id: region.id || createId(),
            cities: Array.isArray(region.cities)
              ? region.cities.map(city => ({
                  ...city,
                  id: city.id || createId()
                }))
              : []
          }))
        : []
    }));

  } catch (error) {
    console.error("Data loading error:", error);
    return [];
  }
}

let travelData = loadTravelData();

function saveData() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(travelData)
    );

    return true;

  } catch (error) {
    console.error("Saving error:", error);
    alert("Could not save data. Browser storage may be full.");
    return false;
  }
}

// Add missing starter countries.
// Existing countries, provinces and cities are preserved.

// Countries / areas the owner removed stay removed after a reload.
const REMOVED_DEFAULTS_KEY = "raselOnTheRunRemovedDefaultsV1";
function readRemovedDefaults() {
  try {
    const value = JSON.parse(localStorage.getItem(REMOVED_DEFAULTS_KEY) || "{}");
    return { countries: Array.isArray(value.countries) ? value.countries : [], areas: Array.isArray(value.areas) ? value.areas : [], cities: Array.isArray(value.cities) ? value.cities : [] };
  } catch { return { countries: [], areas: [], cities: [] }; }
}
function rememberRemovedDefault(kind, key) {
  const value = readRemovedDefaults();
  if (!value[kind].includes(key)) value[kind].push(key);
  try { localStorage.setItem(REMOVED_DEFAULTS_KEY, JSON.stringify(value)); } catch (error) { console.error(error); }
}
const removedDefaults = readRemovedDefaults();
const removedCountrySet = new Set(removedDefaults.countries);
const removedAreaSet = new Set(removedDefaults.areas);

starterCountries.forEach(([name]) => {
  if (removedCountrySet.has(cleanName(name))) return;
  const exists = travelData.some(
    country => cleanName(country.name) === cleanName(name)
  );

  if (!exists) {
    travelData.push({
      id: createId(),
      name,
      regions: []
    });
  }
});

// Add the standard first-level administrative areas for every starter country.
// Existing user-created regions are preserved; matching names are not duplicated.
const standardAdministrativeAreas = window.RASEL_ADMIN_AREAS || {};
for (const [countryName, areaNames] of Object.entries(standardAdministrativeAreas)) {
  const country = travelData.find(item => cleanName(item.name) === cleanName(countryName));
  if (!country || !Array.isArray(areaNames)) continue;
  const existingNames = new Set((country.regions || []).map(item => cleanName(item.name)));
  for (const areaName of areaNames) {
    if (existingNames.has(cleanName(areaName))) continue;
    if (removedAreaSet.has(`${cleanName(countryName)}::${cleanName(areaName)}`)) continue;
    country.regions.push({ id: createId(), name: areaName, cities: [] });
    existingNames.add(cleanName(areaName));
  }
}

// Add the bundled cities (Canada by province, Bangladesh by division).
// Existing cities are kept; names are not duplicated; removed cities stay removed.
const standardCities = window.RASEL_CITIES || {};
const removedCitySet = new Set(removedDefaults.cities || []);
for (const [countryName, regionsMap] of Object.entries(standardCities)) {
  const country = travelData.find(item => cleanName(item.name) === cleanName(countryName));
  if (!country) continue;
  for (const [regionName, cityNames] of Object.entries(regionsMap)) {
    const region = (country.regions || []).find(item => cleanName(item.name) === cleanName(regionName));
    if (!region || !Array.isArray(cityNames)) continue;
    region.cities = region.cities || [];
    const existing = new Set(region.cities.map(item => cleanName(item.name)));
    for (const cityName of cityNames) {
      const key = `${cleanName(countryName)}::${cleanName(regionName)}::${cleanName(cityName)}`;
      if (existing.has(cleanName(cityName)) || removedCitySet.has(key)) continue;
      region.cities.push({ id: createId(), name: cityName });
      existing.add(cleanName(cityName));
    }
  }
}

// Keep first five countries in requested order.
// Remaining starter countries follow.
// Custom countries follow alphabetically.

function sortCountries() {
  const order = new Map(
    starterCountries.map(([name], index) => [
      cleanName(name),
      index
    ])
  );

  travelData.sort((a, b) => {
    const aIndex = order.has(cleanName(a.name))
      ? order.get(cleanName(a.name))
      : 999;

    const bIndex = order.has(cleanName(b.name))
      ? order.get(cleanName(b.name))
      : 999;

    return aIndex - bIndex || a.name.localeCompare(b.name);
  });
}

sortCountries();
saveData();

// =============================================
// PAGE ELEMENTS
// =============================================

const countryList = document.getElementById("countryList");
const memoryGallery = document.getElementById("memoryGallery");

// =============================================
// NAVIGATION STATE
// =============================================

let archiveLevel = "countries";

let selectedCountryId = null;
let selectedRegionId = null;
let selectedCityId = null;

// =============================================
// FIND COUNTRY, PROVINCE AND CITY
// =============================================

function findCountry(countryId) {
  return travelData.find(
    country => country.id === countryId
  );
}

function findRegion(countryId, regionId) {
  const country = findCountry(countryId);

  return country?.regions.find(
    region => region.id === regionId
  );
}

function findCity(countryId, regionId, cityId) {
  const region = findRegion(countryId, regionId);

  return region?.cities.find(
    city => city.id === cityId
  );
}

// =============================================
// INDEXEDDB PHOTO STORAGE
// =============================================

function openPhotoDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains("photos")) {
        db.createObjectStore("photos", {
          keyPath: "id"
        });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function savePhoto(photo) {
  const db = await openPhotoDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      "photos",
      "readwrite"
    );

    transaction.objectStore("photos").put(photo);

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };

    transaction.onerror = () => {
      const error = transaction.error;
      db.close();
      reject(error);
    };
  });
}

async function getPhotos() {
  const db = await openPhotoDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      "photos",
      "readonly"
    );

    const request = transaction
      .objectStore("photos")
      .getAll();

    request.onsuccess = () => {
      const result = request.result;
      db.close();
      resolve(result);
    };

    request.onerror = () => {
      const error = request.error;
      db.close();
      reject(error);
    };
  });
}

// =============================================
// ADD COUNTRY
// =============================================

function addCountry() {
  const input = prompt("Enter country name:");

  if (!input || !input.trim()) return;

  const name = input.trim();

  const exists = travelData.some(
    country =>
      country.name.toLowerCase() === name.toLowerCase()
  );

  if (exists) {
    alert("This country already exists!");
    return;
  }

  travelData.push({
    id: createId(),
    name,
    regions: []
  });

  sortCountries();

  if (saveData()) {
    renderCountries();
    alert(`${name} added successfully!`);
  }
}

// =============================================
// ADD PROVINCE / STATE / DIVISION / REGION
// =============================================

function addRegion(countryId) {
  const country = findCountry(countryId);

  if (!country) return;

  const input = prompt(
    `Enter ${regionLabelFor(country.name)} name for ${country.name}:`
  );

  if (!input || !input.trim()) return;

  const name = input.trim();

  const exists = country.regions.some(
    region =>
      region.name.toLowerCase() === name.toLowerCase()
  );

  if (exists) {
    alert("This Province / Region already exists!");
    return;
  }

  country.regions.push({
    id: createId(),
    name,
    cities: []
  });

  if (saveData()) {
    renderCountries();
  }
}

// =============================================
// ADD CITY
// =============================================

function addCity(countryId, regionId) {
  const country = findCountry(countryId);
  const region = findRegion(countryId, regionId);

  if (!country || !region) return;

  const input = prompt(
    `Enter city name for ${region.name}, ${country.name}:`
  );

  if (!input || !input.trim()) return;

  const name = input.trim();

  const exists = region.cities.some(
    city =>
      city.name.toLowerCase() === name.toLowerCase()
  );

  if (exists) {
    alert("This city already exists!");
    return;
  }

  region.cities.push({
    id: createId(),
    name
  });

  if (saveData()) {
    renderCountries();
  }
}

// =============================================
// UPLOAD PHOTOS FROM MAC
// =============================================

function choosePhotos(countryId, regionId, cityId) {
  const picker = document.createElement("input");

  picker.type = "file";
  picker.accept = "image/*";
  picker.multiple = true;

  picker.addEventListener("change", async () => {
    const files = Array.from(picker.files || []);

    if (!files.length) return;

    try {
      let savedCount = 0;

      for (const file of files) {
        if (!file.type.startsWith("image/")) continue;

        await savePhoto({
          id: createId(),
          countryId,
          regionId,
          cityId,
          name: file.name,
          type: file.type,
          blob: file,
          uploadedAt: new Date().toISOString()
        });

        savedCount++;
      }

      alert(`${savedCount} photo(s) saved successfully!`);

      if (archiveLevel === "photos") {
        await renderSelectedCityPhotos(
          countryId,
          regionId,
          cityId
        );
      }

      await renderGallery();

    } catch (error) {
      console.error("Photo upload error:", error);

      alert(
        "Could not save photos. Browser storage may be full."
      );
    }
  });

  picker.click();
}

// =============================================
// CITY PHOTO GALLERY
// =============================================

let cityImageURLs = [];

async function renderSelectedCityPhotos(
  countryId,
  regionId,
  cityId
) {
  const gallery = document.getElementById(
    "selectedCityGallery"
  );

  if (!gallery) return;

  try {
    const allPhotos = await getPhotos();

    if (
      archiveLevel !== "photos" ||
      selectedCityId !== cityId
    ) return;

    cityImageURLs.forEach(url => URL.revokeObjectURL(url));
    cityImageURLs = [];

    const cityPhotos = allPhotos.filter(photo =>
      photo.countryId === countryId &&
      photo.regionId === regionId &&
      photo.cityId === cityId
    );

    if (!cityPhotos.length) {
      gallery.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon"></span>
          <h3>No Photos Yet</h3>
          <p>Upload your first memory from this city.</p>
        </div>
      `;
      return;
    }

    gallery.innerHTML = cityPhotos.map(photo => {
      const imageURL = URL.createObjectURL(photo.blob);
      cityImageURLs.push(imageURL);

      return `
        <article class="memory-card">
          <img
            src="${imageURL}"
            alt="${escapeHTML(photo.name)}"
            loading="lazy"
          >

          <div class="memory-caption">
            <h3>${escapeHTML(photo.name)}</h3>
          </div>
        </article>
      `;
    }).join("");

  } catch (error) {
    console.error("City gallery error:", error);

    gallery.innerHTML = `
      <div class="empty-state">
        <h3>Could not load photos</h3>
      </div>
    `;
  }
}

// =============================================
// MAIN MEMORIES GALLERY
// =============================================

let mainGalleryURLs = [];

async function renderGallery() {
  if (!memoryGallery) return;

  try {
    const photos = await getPhotos();

    mainGalleryURLs.forEach(url => URL.revokeObjectURL(url));
    mainGalleryURLs = [];

    if (!photos.length) {
      memoryGallery.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon"></span>
          <h3>Your memories belong here</h3>
          <p>Choose photos from your Mac to start your collection.</p>
        </div>
      `;
      return;
    }

    memoryGallery.innerHTML = photos.map(photo => {
      const country = findCountry(photo.countryId);
      const region = findRegion(photo.countryId, photo.regionId);
      const city = findCity(
        photo.countryId,
        photo.regionId,
        photo.cityId
      );

      const imageURL = URL.createObjectURL(photo.blob);
      mainGalleryURLs.push(imageURL);

      return `
        <article class="memory-card">
          <img
            src="${imageURL}"
            alt="${escapeHTML(photo.name)}"
            loading="lazy"
          >

          <div class="memory-caption">
            <h3>${escapeHTML(photo.name)}</h3>

            <p>
              ${escapeHTML(country?.name || "")}
              · ${escapeHTML(region?.name || "")}
              · ${escapeHTML(city?.name || "")}
            </p>
          </div>
        </article>
      `;
    }).join("");

  } catch (error) {
    console.error("Gallery loading error:", error);
  }
}

// =============================================
// UPLOAD FROM MAIN BUTTON
// =============================================

async function uploadMemory() {
  if (!travelData.length) {
    alert("Please add a country first.");
    return;
  }

  const countryChoices = travelData.map(
    (item, index) => `${index + 1}. ${item.name}`
  ).join("\n");

  const countryNumber = Number(
    prompt(`Choose a country:\n${countryChoices}`)
  );

  const country = travelData[countryNumber - 1];

  if (!country) return;

  if (!country.regions.length) {
    alert(`Please add a ${regionLabelFor(country.name)} first.`);
    return;
  }

  const regionChoices = country.regions.map(
    (item, index) => `${index + 1}. ${item.name}`
  ).join("\n");

  const regionNumber = Number(
    prompt(`Choose a ${regionLabelFor(country.name)}:\n${regionChoices}`)
  );

  const region = country.regions[regionNumber - 1];

  if (!region) return;

  if (!region.cities.length) {
    alert("Please add a city first.");
    return;
  }

  const cityChoices = region.cities.map(
    (item, index) => `${index + 1}. ${item.name}`
  ).join("\n");

  const cityNumber = Number(
    prompt(`Choose a city:\n${cityChoices}`)
  );

  const city = region.cities[cityNumber - 1];

  if (!city) return;

  choosePhotos(country.id, region.id, city.id);
}

// =============================================
// RENDER CURRENT PAGE ONLY
// =============================================

function renderCountries() {
  if (!countryList) return;

  const country = findCountry(selectedCountryId);

  const region = country
    ? findRegion(country.id, selectedRegionId)
    : null;

  const city = region
    ? findCity(country.id, region.id, selectedCityId)
    : null;

  // -----------------------------------------
  // PAGE 1: COUNTRIES ONLY
  // -----------------------------------------

  if (archiveLevel === "countries") {
    countryList.innerHTML = `
      <div class="archive-page-heading">
        <span class="archive-eyebrow">EXPLORE THE WORLD</span>
        <h2>My Destinations</h2>
        <p>Choose a country to explore its ${escapeHTML("administrative areas")}, cities and memories.</p>
      </div>

      <div class="nested-country-list">
        ${travelData.map(item => `
          <section class="hierarchy-shell country-shell">

            <div
              class="hierarchy-parent country-parent"
              data-open-country="${item.id}"
              tabindex="0"
              role="button">

              <div class="hierarchy-flag" role="img" aria-label="${escapeHTML(item.name)} flag" title="${escapeHTML(item.name)}">
                ${getCountryFlag(item.name)}
              </div>

              <div class="hierarchy-info">
                <span class="archive-eyebrow">COUNTRY</span>

                <h2>${escapeHTML(item.name)}</h2>

                <p>${item.regions.length} ${escapeHTML(item.regions.length === 1 ? regionLabelFor(item.name) : pluralRegionLabelFor(item.name))}</p>

                <span class="card-explore">
                  Explore ${escapeHTML(regionLabelFor(item.name))} →
                </span>
              </div>

            </div>

          </section>
        `).join("")}
      </div>
    `;

    return;
  }

  // -----------------------------------------
  // PAGE 2: PROVINCES ONLY
  // Country Card is NOT shown here.
  // -----------------------------------------

  if (archiveLevel === "regions" && country) {
    countryList.innerHTML = `
      <div class="archive-page-heading">

        <button class="back-button" data-action="archive-back">
          ← All Countries
        </button>

        <span class="archive-eyebrow">
          ${escapeHTML(pluralRegionLabelFor(country.name).toUpperCase())}
        </span>

        <h2>${escapeHTML(country.name)}</h2>

        <p>Choose a ${escapeHTML(regionLabelFor(country.name))} to explore its cities.</p>

        <button
          class="primary-button"
          data-action="add-region"
          data-country="${country.id}">
          + Add ${escapeHTML(regionLabelFor(country.name))}
        </button>

      </div>

      <div class="country-grid premium-archive-grid">

        ${country.regions.length ? country.regions.map(item => `
          <article
            class="region-card premium-region-card"
            data-open-region="${item.id}"
            tabindex="0"
            role="button">

            <div class="location-icon-circle"></div>

            <span class="archive-eyebrow">
              ${escapeHTML(regionLabelFor(country.name).toUpperCase())}
            </span>

            <h3>${escapeHTML(item.name)}</h3>

            <p>${item.cities.length} Cities</p>

            <span class="card-explore">
              Explore City →
            </span>

          </article>
        `).join("") : `
          <div class="empty-state">
            <span class="empty-icon"></span>
            <h3>No ${escapeHTML(regionLabelFor(country.name))} Added Yet</h3>
            <p>Add a ${escapeHTML(regionLabelFor(country.name))} to ${escapeHTML(country.name)}.</p>
          </div>
        `}

      </div>
    `;

    return;
  }

  // -----------------------------------------
  // PAGE 3: CITIES ONLY
  // Country and Province Cards are NOT shown.
  // -----------------------------------------

  if (archiveLevel === "cities" && country && region) {
    countryList.innerHTML = `
      <div class="archive-page-heading">

        <button class="back-button" data-action="back-to-regions">
          ← All ${escapeHTML(pluralRegionLabelFor(country.name))}
        </button>

        <span class="archive-eyebrow">
          CITIES IN ${escapeHTML(region.name.toUpperCase())}
        </span>

        <h2>${escapeHTML(region.name)}</h2>

        <p>Explore the cities in this region.</p>

        <button
          class="primary-button"
          data-action="add-city"
          data-country="${country.id}"
          data-region="${region.id}">
          + Add City
        </button>

      </div>

      <div class="country-grid premium-archive-grid">

        ${region.cities.length ? region.cities.map(item => `
          <article
            class="city-card premium-city-card"
            data-open-city="${item.id}"
            tabindex="0"
            role="button">

            <div class="location-icon-circle">️</div>

            <span class="archive-eyebrow">CITY</span>

            <h3>${escapeHTML(item.name)}</h3>

            <p>Travel memories from ${escapeHTML(item.name)}.</p>

            <span class="card-explore">
              See City Memories →
            </span>

          </article>
        `).join("") : `
          <div class="empty-state">
            <span class="empty-icon">️</span>
            <h3>No City Added Yet</h3>
            <p>Add a city inside ${escapeHTML(region.name)}.</p>
          </div>
        `}

      </div>
    `;

    return;
  }

  // -----------------------------------------
  // PAGE 4: CITY PHOTOS ONLY
  // Country and Province Cards are NOT shown.
  // -----------------------------------------

  if (archiveLevel === "photos" && country && region && city) {
    countryList.innerHTML = `
      <div class="archive-page-heading">

        <button class="back-button" data-action="back-to-cities">
          ← All Cities
        </button>

        <span class="archive-eyebrow">
          ${escapeHTML(country.name)} · ${escapeHTML(region.name)}
        </span>

        <h2>${escapeHTML(city.name)}</h2>

        <p>Your personal photographs and memories from this city.</p>

        <button
          class="primary-button"
          data-action="upload-city-photos"
          data-country="${country.id}"
          data-region="${region.id}"
          data-city="${city.id}">
          + Upload Photos
        </button>

      </div>

      <div id="selectedCityGallery" class="memory-grid">
        <div class="empty-state">
          <span class="empty-icon"></span>
          <h3>Loading City Memories...</h3>
        </div>
      </div>
    `;

    renderSelectedCityPhotos(
      country.id,
      region.id,
      city.id
    );

    return;
  }

  // Safe fallback
  archiveLevel = "countries";

  selectedCountryId = null;
  selectedRegionId = null;
  selectedCityId = null;

  renderCountries();
}

// =============================================
// NAVIGATION AND BUTTON EVENTS
// =============================================

if (countryList) {
  countryList.addEventListener("click", event => {

    // Handle buttons first.
    const button = event.target.closest("button[data-action]");

    if (button) {
      const action = button.dataset.action;

      if (action === "archive-back") {
        archiveLevel = "countries";

        selectedCountryId = null;
        selectedRegionId = null;
        selectedCityId = null;

        renderCountries();
        return;
      }

      if (action === "back-to-regions") {
        archiveLevel = "regions";

        selectedRegionId = null;
        selectedCityId = null;

        renderCountries();
        return;
      }

      if (action === "back-to-cities") {
        archiveLevel = "cities";

        selectedCityId = null;

        renderCountries();
        return;
      }

      if (action === "add-region") {
        addRegion(button.dataset.country);
        return;
      }

      if (action === "add-city") {
        addCity(
          button.dataset.country,
          button.dataset.region
        );
        return;
      }

      if (action === "upload-city-photos") {
        choosePhotos(
          button.dataset.country,
          button.dataset.region,
          button.dataset.city
        );
        return;
      }
    }

    // Country click
    const countryCard = event.target.closest(
      "[data-open-country]"
    );

    // Province click
    const regionCard = event.target.closest(
      "[data-open-region]"
    );

    // City click
    const cityCard = event.target.closest(
      "[data-open-city]"
    );

    if (countryCard) {
      selectedCountryId = countryCard.dataset.openCountry;

      selectedRegionId = null;
      selectedCityId = null;

      archiveLevel = "regions";

      renderCountries();
      return;
    }

    if (regionCard) {
      selectedRegionId = regionCard.dataset.openRegion;

      selectedCityId = null;

      archiveLevel = "cities";

      renderCountries();
      return;
    }

    if (cityCard) {
      selectedCityId = cityCard.dataset.openCity;

      archiveLevel = "photos";

      renderCountries();
    }
  });

  // Keyboard navigation
  countryList.addEventListener("keydown", event => {
    if (event.key !== "Enter" && event.key !== " ") return;

    const card = event.target.closest(
      "[data-open-country], [data-open-region], [data-open-city]"
    );

    if (!card) return;

    event.preventDefault();
    card.click();
  });
}

// =============================================
// MAIN PAGE BUTTONS
// =============================================

document.getElementById("addCountryButton")
  ?.addEventListener("click", addCountry);

document.getElementById("uploadMemoryButton")
  ?.addEventListener("click", uploadMemory);

document.getElementById("uploadNavButton")
  ?.addEventListener("click", uploadMemory);

document.getElementById("heroUploadButton")
  ?.addEventListener("click", uploadMemory);

// =============================================
// INITIALIZE WEBSITE
// =============================================

renderCountries();

renderGallery().catch(error => {
  console.error("Gallery loading error:", error);
});





// ==================================================
// COUNTRY / PROVINCE / CITY CUSTOM EDITOR
// Name + Flag + Background Photo
// ==================================================

const ARCHIVE_DESIGN_DB = "RaselOnTheRunDesignAssets";
let archiveDesignURLs = [];

function archiveDesignOpenDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(ARCHIVE_DESIGN_DB, 1);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains("assets")) {
        db.createObjectStore("assets", { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function archiveDesignSavePhoto(file) {
  const db = await archiveDesignOpenDB();

  const asset = {
    id: createId(),
    name: file.name,
    blob: file,
    uploadedAt: new Date().toISOString()
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction("assets", "readwrite");
    tx.objectStore("assets").put(asset);

    tx.oncomplete = () => {
      db.close();
      resolve(asset.id);
    };

    tx.onerror = () => {
      const error = tx.error;
      db.close();
      reject(error);
    };
  });
}

async function archiveDesignGetPhoto(id) {
  const db = await archiveDesignOpenDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction("assets", "readonly");
    const request = tx.objectStore("assets").get(id);

    request.onsuccess = () => {
      const result = request.result;
      db.close();
      resolve(result || null);
    };

    request.onerror = () => {
      const error = request.error;
      db.close();
      reject(error);
    };
  });
}

async function archiveDesignDeletePhoto(id) {
  if (!id) return;

  const db = await archiveDesignOpenDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction("assets", "readwrite");
    tx.objectStore("assets").delete(id);

    tx.oncomplete = () => {
      db.close();
      resolve();
    };

    tx.onerror = () => {
      const error = tx.error;
      db.close();
      reject(error);
    };
  });
}

// Find any Country, Province or City by its ID.
function archiveDesignFindEntity(type, id) {
  if (type === "country") {
    return findCountry(id);
  }

  for (const country of travelData) {
    for (const region of country.regions) {
      if (type === "province" && region.id === id) {
        return region;
      }

      if (type === "city") {
        const city = region.cities.find(item => item.id === id);
        if (city) return city;
      }
    }
  }

  return null;
}

function archiveDesignDefaultFlag(type, entity) {
  if (entity.customFlag) return entity.customFlag;

  if (type === "country") {
    return getCountryFlag(entity.name);
  }

  return type === "province" ? "" : "️";
}

// Create Edit button.
function archiveDesignAddEditButton(element, type, id) {
  if (!element || element.querySelector(".archive-edit-button")) {
    return;
  }

  element.style.position = "relative";

  const button = document.createElement("button");

  button.type = "button";
  button.className = "archive-edit-button";
  button.textContent = " Edit";

  button.dataset.archiveAppearanceEdit = type;
  button.dataset.archiveAppearanceId = id;

  button.title = `Edit ${type} name, flag and background`;

  element.appendChild(button);

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.className = "archive-remove-button";
  removeButton.textContent = "× Remove";
  removeButton.dataset.archiveAppearanceRemove = type;
  removeButton.dataset.archiveAppearanceId = id;
  removeButton.title = `Remove this ${type} and its nested locations`;
  element.appendChild(removeButton);
}

// Create a stable, area-specific default photo URL. The remote image service
// searches by the actual region + country names; an uploaded admin photo always
// takes priority over this default.
function archiveDesignHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function archiveDesignDefaultRegionPhoto(entity) {
  const parentCountry = travelData.find(country =>
    (country.regions || []).some(region => region.id === entity.id)
  );
  const countryName = parentCountry?.name || "Travel";
  const searchTerms = `${entity.name},${countryName}`;
  const lock = archiveDesignHash(searchTerms) % 100000;
  return `https://loremflickr.com/960/640/${encodeURIComponent(entity.name)},${encodeURIComponent(countryName)}?lock=${lock}`;
}

// Apply saved background photo and flag to a card. Regions receive an
// individual default destination photo until the admin uploads their own.
async function archiveDesignDecorateCard(element, entity, type) {
  if (!element || !entity) return;

  const icon = element.querySelector(
    ".hierarchy-flag, .country-icon, .location-icon-circle, .nested-location-icon"
  );

  if (icon) {
    icon.textContent = archiveDesignDefaultFlag(type, entity);
  }

  element.style.backgroundSize = "cover";
  element.style.backgroundPosition = "center";
  element.style.backgroundRepeat = "no-repeat";

  if (entity.backgroundAssetId) {
    try {
      const asset = await archiveDesignGetPhoto(entity.backgroundAssetId);

      if (asset?.blob) {
        const url = URL.createObjectURL(asset.blob);
        archiveDesignURLs.push(url);
        element.style.backgroundImage =
          `linear-gradient(rgba(255,253,248,.70), rgba(255,253,248,.70)), url("${url}")`;
      }
    } catch (error) {
      console.error("Background photo loading error:", error);
    }
  } else if (false && type === "province") {
    // Replaced by country-showcase.js (Wikipedia place photos, loaded lazily).
    const defaultPhoto = archiveDesignDefaultRegionPhoto(entity);
    element.style.backgroundImage =
      `linear-gradient(rgba(255,253,248,.68), rgba(255,253,248,.68)), url("${defaultPhoto}")`;
    element.dataset.defaultRegionBackground = "true";

    // If the image service is unavailable, retain a clean visual fallback.
    const probe = new Image();
    probe.onload = () => {
      if (element.isConnected && !entity.backgroundAssetId) {
        element.style.backgroundImage =
          `linear-gradient(rgba(255,253,248,.68), rgba(255,253,248,.68)), url("${defaultPhoto}")`;
      }
    };
    probe.onerror = () => {
      if (element.isConnected && !entity.backgroundAssetId) {
        element.style.backgroundImage =
          "linear-gradient(135deg, rgba(215,226,219,.95), rgba(238,231,214,.95))";
      }
    };
    probe.src = defaultPhoto;
  }

  archiveDesignAddEditButton(element, type, entity.id);
}

// Add Edit buttons and apply saved customizations after every render.
async function archiveDesignRefresh() {
  archiveDesignURLs.forEach(url => URL.revokeObjectURL(url));
  archiveDesignURLs = [];

  if (archiveLevel === "countries") {
    document.querySelectorAll(
      "#countryList [data-open-country]"
    ).forEach(card => {
      const country = findCountry(card.dataset.openCountry);

      if (country) {
        archiveDesignDecorateCard(
          card,
          country,
          "country"
        );
      }
    });
  }

  if (archiveLevel === "regions") {
    const country = findCountry(selectedCountryId);

    if (country) {
      const heading = countryList.querySelector(
        ".archive-page-heading"
      );

      if (heading) {
        archiveDesignAddEditButton(
          heading,
          "country",
          country.id
        );
      }
    }

    document.querySelectorAll(
      "#countryList [data-open-region]"
    ).forEach(card => {
      const region = archiveDesignFindEntity(
        "province",
        card.dataset.openRegion
      );

      if (region) {
        archiveDesignDecorateCard(
          card,
          region,
          "province"
        );
      }
    });
  }

  if (archiveLevel === "cities") {
    const heading = countryList.querySelector(
      ".archive-page-heading"
    );

    const region = findRegion(
      selectedCountryId,
      selectedRegionId
    );

    if (heading && region) {
      archiveDesignAddEditButton(
        heading,
        "province",
        region.id
      );
    }

    document.querySelectorAll(
      "#countryList [data-open-city]"
    ).forEach(card => {
      const city = archiveDesignFindEntity(
        "city",
        card.dataset.openCity
      );

      if (city) {
        archiveDesignDecorateCard(
          card,
          city,
          "city"
        );
      }
    });
  }

  if (archiveLevel === "photos") {
    const city = findCity(
      selectedCountryId,
      selectedRegionId,
      selectedCityId
    );

    const heading = countryList.querySelector(
      ".archive-page-heading"
    );

    if (heading && city) {
      await archiveDesignDecorateCard(
        heading,
        city,
        "city"
      );
    }
  }
}

// Open the Mac file picker for a background photo.
function archiveDesignChooseBackground(type, entity) {
  const picker = document.createElement("input");

  picker.type = "file";
  picker.accept = "image/*";
  picker.multiple = false;

  picker.addEventListener("change", async () => {
    const file = picker.files?.[0];

    if (!file) {
      renderCountries();
      return;
    }

    try {
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file.");
        return;
      }

      const oldAssetId = entity.backgroundAssetId;

      const newAssetId = await archiveDesignSavePhoto(file);

      entity.backgroundAssetId = newAssetId;

      if (!saveData()) return;

      if (oldAssetId) {
        await archiveDesignDeletePhoto(oldAssetId);
      }

      renderCountries();

      alert("Background photo updated successfully!");

    } catch (error) {
      console.error("Background upload error:", error);
      alert("Could not save background photo. Storage may be full.");
    }
  });

  picker.click();
}

// Edit name, flag, and background.
async function archiveDesignEdit(type, id) {
  const entity = archiveDesignFindEntity(type, id);

  if (!entity) {
    alert("Could not find this item.");
    return;
  }

  const title = {
    country: "Country",
    province: "State / Province / Division",
    city: "City"
  }[type];

  // Edit name.
  const newName = prompt(
    `Edit ${title} name:`,
    entity.name
  );

  if (newName === null) return;

  if (newName.trim()) {
    entity.name = newName.trim();
  }

  // Edit flag / emoji.
  const currentFlag = archiveDesignDefaultFlag(type, entity);

  const newFlag = prompt(
    `Change ${title} flag or icon.\nEnter an emoji:`,
    currentFlag
  );

  if (newFlag !== null) {
    entity.customFlag = newFlag.trim();
  }

  if (!saveData()) return;

  // Background photo options.
  const choice = prompt(
    "Background Photo Options:\n\n1 = Choose or change background photo\n2 = Remove current background photo\nPress Enter to keep the current background.",
    ""
  );

  if (choice === "1") {
    archiveDesignChooseBackground(type, entity);
    return;
  }

  if (choice === "2") {
    const oldAssetId = entity.backgroundAssetId;

    delete entity.backgroundAssetId;

    if (saveData() && oldAssetId) {
      try {
        await archiveDesignDeletePhoto(oldAssetId);
      } catch (error) {
        console.error(error);
      }
    }
  }

  renderCountries();
}

// Capture Edit button clicks before the normal navigation handler.
if (countryList) {
  countryList.addEventListener("click", event => {
    const editButton = event.target.closest("button[data-archive-appearance-edit]");
    const removeButton = event.target.closest("button[data-archive-appearance-remove]");
    const button = editButton || removeButton;
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    const type = editButton ? editButton.dataset.archiveAppearanceEdit : removeButton.dataset.archiveAppearanceRemove;
    const id = button.dataset.archiveAppearanceId;
    if (editButton) { archiveDesignEdit(type, id); return; }
    const entity = archiveDesignFindEntity(type, id);
    if (!entity) return;
    const label = type === "country" ? "country" : type === "city" ? "city" : "administrative area";
    if (!confirm(`Remove ${label} “${entity.name}” and all its nested locations from your archive? This cannot be undone. Export a backup first if needed.`)) return;
    if (type === "country") {
      const index = travelData.findIndex(item => item.id === id);
      if (index >= 0) { rememberRemovedDefault("countries", cleanName(travelData[index].name)); travelData.splice(index, 1); }
    } else if (type === "province") {
      for (const country of travelData) { const index = country.regions.findIndex(item => item.id === id); if (index >= 0) { rememberRemovedDefault("areas", `${cleanName(country.name)}::${cleanName(country.regions[index].name)}`); country.regions.splice(index, 1); } }
    } else {
      for (const country of travelData) for (const region of country.regions) { const index = region.cities.findIndex(item => item.id === id); if (index >= 0) { rememberRemovedDefault("cities", `${cleanName(country.name)}::${cleanName(region.name)}::${cleanName(region.cities[index].name)}`); region.cities.splice(index, 1); } }
    }
    saveData();
    renderCountries();
  }, true);
}

// Wrap the existing renderer without replacing its navigation logic.
const archiveDesignOriginalRender = renderCountries;

renderCountries = function () {
  archiveDesignOriginalRender();

  archiveDesignRefresh().catch(error => {
    console.error("Archive appearance error:", error);
  });
};

// Apply the controls to the current page.
renderCountries();



// ==================================================
// RASEL ON THE RUN — ABOUT ME SECTION
// Navigation + Homepage Button + Editable Profile
// ==================================================

const ABOUT_ME_STORAGE_KEY = "raselOnTheRunAboutMe";

function loadAboutMeProfile() {
  try {
    return JSON.parse(
      localStorage.getItem(ABOUT_ME_STORAGE_KEY)
    ) || {
      name: "Rasel",
      title: "Traveller · Explorer · Memory Collector",
      bio: "Welcome to my personal travel journal. I created this space to collect the places I explore, the cultures I discover, and the memories I make along the way. Every destination has a story, and this is where I share mine.",
      photo: ""
    };
  } catch (error) {
    return {
      name: "Rasel",
      title: "Traveller · Explorer · Memory Collector",
      bio: "Welcome to my personal travel journal. I created this space to collect the places I explore, the cultures I discover, and the memories I make along the way. Every destination has a story, and this is where I share mine.",
      photo: ""
    };
  }
}

let aboutMeProfile = loadAboutMeProfile();

// Create About Me section
function createAboutMeSection() {
  if (document.getElementById("aboutMeSection")) return;

  const section = document.createElement("section");

  section.id = "aboutMeSection";
  section.className = "about-me-section";

  section.innerHTML = `
    <div class="about-me-inner">

      <div class="about-me-avatar">
        <img id="aboutMePhoto" alt="About me profile photo" hidden>
        <span id="aboutMeInitial">R</span>
      </div>

      <div class="about-me-content">

        <span class="archive-eyebrow">
          THE PERSON BEHIND THE JOURNEYS
        </span>

        <h2>About Me</h2>

        <h3 id="aboutMeName">Hi, I'm Rasel.</h3>

        <p id="aboutMeTitle" class="about-me-subtitle"></p>

        <p id="aboutMeBio" class="about-me-description"></p>

        <div class="about-me-actions">
          <button type="button" id="editAboutMeButton" class="about-edit-button">Edit About Me</button>
          <button type="button" id="changeAboutMePhotoButton" class="about-edit-button about-photo-button">Change Photo</button>
          <input type="file" id="aboutMePhotoInput" accept="image/*" hidden>
        </div>

      </div>

      <div class="about-me-side">

        <span class="about-side-icon" aria-hidden="true"></span>

        <h3>My Travel Philosophy</h3>

        <p>
          Collect moments, discover cultures,
          explore new places, and keep every
          journey alive through memories.
        </p>

        <span class="about-side-signature">
          Every Journey Tells a Story.
        </span>

      </div>

    </div>
  `;

  // Place after the homepage welcome section.
  const headings = Array.from(
    document.querySelectorAll("h1, h2, h3")
  );

  const welcomeHeading = headings.find(element =>
    element.textContent.trim().toLowerCase()
      .includes("every destination has a story")
  );

  if (welcomeHeading) {
    const welcomeSection =
      welcomeHeading.closest("section") ||
      welcomeHeading.parentElement?.parentElement;

    if (welcomeSection) {
      welcomeSection.insertAdjacentElement("afterend", section);
    } else {
      document.body.appendChild(section);
    }
  } else {
    const destinations = document.getElementById("destinations");

    if (destinations) {
      destinations.before(section);
    } else {
      document.body.appendChild(section);
    }
  }

  updateAboutMeDisplay();
}

// Update About Me information
function updateAboutMeDisplay() {
  const nameElement = document.getElementById("aboutMeName");
  const titleElement = document.getElementById("aboutMeTitle");
  const bioElement = document.getElementById("aboutMeBio");
  const initialElement = document.getElementById("aboutMeInitial");
  const photoElement = document.getElementById("aboutMePhoto");

  if (!nameElement) return;

  nameElement.textContent = `Hi, I'm ${aboutMeProfile.name}.`;

  titleElement.textContent = aboutMeProfile.title;

  bioElement.textContent = aboutMeProfile.bio;

  initialElement.textContent =
    aboutMeProfile.name.charAt(0).toUpperCase();

  if (photoElement) {
    if (aboutMeProfile.photo) {
      photoElement.src = aboutMeProfile.photo;
      photoElement.hidden = false;
      initialElement.hidden = true;
    } else {
      photoElement.removeAttribute("src");
      photoElement.hidden = true;
      initialElement.hidden = false;
    }
  }
}

// Edit profile information
function editAboutMeProfile() {
  const newName = prompt(
    "Enter your name:",
    aboutMeProfile.name
  );

  if (newName === null) return;

  const newTitle = prompt(
    "Enter your travel title:",
    aboutMeProfile.title
  );

  if (newTitle === null) return;

  const newBio = prompt(
    "Write your About Me story:",
    aboutMeProfile.bio
  );

  if (newBio === null) return;

  aboutMeProfile = {
    name: newName.trim() || "Rasel",
    title: newTitle.trim(),
    bio: newBio.trim(),
    email: aboutMeProfile.email || "raselahmmed1520@gmail.com",
    location: aboutMeProfile.location || "Toronto, ON, Canada",
    photo: aboutMeProfile.photo || ""
  };

  try {
    localStorage.setItem(
      ABOUT_ME_STORAGE_KEY,
      JSON.stringify(aboutMeProfile)
    );

    updateAboutMeDisplay();

    alert("About Me updated successfully!");

  } catch (error) {
    console.error(error);
    alert("Could not save About Me information.");
  }
}

// Create navigation link
function addAboutMeNavigation() {
  if (document.getElementById("aboutMeNavLink")) return;

  const headerLinks = Array.from(
    document.querySelectorAll("header a, nav a")
  );

  const memoriesLink = headerLinks.find(link =>
    link.textContent.trim().toLowerCase().includes("my memories")
  );

  const aboutLink = document.createElement("a");

  aboutLink.id = "aboutMeNavLink";
  aboutLink.href = "#aboutMeSection";
  aboutLink.textContent = "About Me";
  aboutLink.className = memoriesLink
    ? memoriesLink.className
    : "about-nav-link";

  aboutLink.addEventListener("click", event => {
    event.preventDefault();

    document.getElementById("aboutMeSection")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
  });

  if (memoriesLink) {
    memoriesLink.insertAdjacentElement("afterend", aboutLink);
  } else {
    const nav = document.querySelector("header nav, nav");

    if (nav) nav.appendChild(aboutLink);
  }
}

// Add About Me button next to Add Your Memories
function addAboutMeHeroButton() {
  if (document.getElementById("aboutMeHeroButton")) return;

  const buttons = Array.from(
    document.querySelectorAll("a, button")
  );

  const memoryButton = buttons.find(element =>
    element.textContent.trim().toLowerCase() === "add your memories"
  );

  if (!memoryButton) return;

  const button = document.createElement("a");

  button.id = "aboutMeHeroButton";
  button.href = "#aboutMeSection";
  button.textContent = "About Me";
  button.className = memoryButton.className;
  button.classList.add("about-me-hero-button");

  button.addEventListener("click", event => {
    event.preventDefault();

    document.getElementById("aboutMeSection")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
  });

  memoryButton.insertAdjacentElement("afterend", button);
}

// About Me edit button
document.addEventListener("click", event => {
  if (event.target.closest("#editAboutMeButton")) editAboutMeProfile();
  if (event.target.closest("#changeAboutMePhotoButton")) {
    document.getElementById("aboutMePhotoInput")?.click();
  }
});

document.addEventListener("change", event => {
  if (event.target.id !== "aboutMePhotoInput") return;
  const file = event.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    alert("Please choose an image file.");
    event.target.value = "";
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    alert("Please choose an image smaller than 5 MB.");
    event.target.value = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    try {
      aboutMeProfile.photo = String(reader.result || "");
      localStorage.setItem(ABOUT_ME_STORAGE_KEY, JSON.stringify(aboutMeProfile));
      updateAboutMeDisplay();
    } catch (error) {
      console.error(error);
      alert("Could not save the profile photo. Try a smaller image.");
    }
  };
  reader.readAsDataURL(file);
});

// Initialize About Me
createAboutMeSection();
addAboutMeNavigation();
addAboutMeHeroButton();





// ==================================================
// RASEL ON THE RUN — CITY PHOTO MANAGEMENT
// City-only photos + Delete + About Me name
// ==================================================

// 1. ABOUT ME NAME: RASEL AHMMED

try {
  if (
    typeof aboutMeProfile !== "undefined" &&
    aboutMeProfile.name === "Rasel"
  ) {
    aboutMeProfile.name = "Rasel Ahmmed";

    localStorage.setItem(
      ABOUT_ME_STORAGE_KEY,
      JSON.stringify(aboutMeProfile)
    );

    updateAboutMeDisplay();
  }
} catch (error) {
  console.error("About Me name update:", error);
}


// 2. DELETE PHOTO FROM INDEXEDDB

async function deleteCityPhoto(photoId) {
  const db = await openPhotoDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      "photos",
      "readwrite"
    );

    transaction.objectStore("photos").delete(photoId);

    transaction.oncomplete = () => {
      db.close();
      resolve(true);
    };

    transaction.onerror = () => {
      const error = transaction.error;
      db.close();
      reject(error);
    };
  });
}


// 3. CITY PHOTO UPLOAD
// Photos stay ONLY inside their selected city.
// They will not be added to My Travel Memories.

choosePhotos = function (countryId, regionId, cityId) {
  const picker = document.createElement("input");

  picker.type = "file";
  picker.accept = "image/*";
  picker.multiple = true;

  picker.addEventListener("change", async () => {
    const files = Array.from(picker.files || []);

    if (!files.length) return;

    try {
      let count = 0;

      for (const file of files) {
        if (!file.type.startsWith("image/")) continue;

        await savePhoto({
          id: createId(),
          countryId,
          regionId,
          cityId,
          name: file.name,
          type: file.type,
          blob: file,
          collection: "city",
          showInMemories: false,
          uploadedAt: new Date().toISOString()
        });

        count++;
      }

      if (archiveLevel === "photos") {
        await renderSelectedCityPhotos(
          countryId,
          regionId,
          cityId
        );
      }

      alert(`${count} photo(s) saved in this city!`);

      // Intentionally do not call renderGallery().

    } catch (error) {
      console.error("City photo upload error:", error);

      alert(
        "Could not save photos. Browser storage may be full."
      );
    }
  });

  picker.click();
};


// 4. CITY GALLERY WITH DELETE BUTTON

renderSelectedCityPhotos = async function (
  countryId,
  regionId,
  cityId
) {
  const gallery = document.getElementById(
    "selectedCityGallery"
  );

  if (!gallery) return;

  try {
    const allPhotos = await getPhotos();

    if (
      archiveLevel !== "photos" ||
      selectedCityId !== cityId
    ) return;

    // Release previous image URLs.
    if (typeof cityImageURLs !== "undefined") {
      cityImageURLs.forEach(url => URL.revokeObjectURL(url));
      cityImageURLs = [];
    }

    const cityPhotos = allPhotos.filter(photo =>
      photo.countryId === countryId &&
      photo.regionId === regionId &&
      photo.cityId === cityId
    );

    if (!cityPhotos.length) {
      gallery.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon"></span>
          <h3>No Photos Yet</h3>
          <p>Upload your first memory from this city.</p>
        </div>
      `;
      return;
    }

    gallery.innerHTML = cityPhotos.map(photo => {
      const imageURL = URL.createObjectURL(photo.blob);

      if (typeof cityImageURLs !== "undefined") {
        cityImageURLs.push(imageURL);
      }

      return `
        <article class="memory-card city-photo-card">

          <img
            src="${imageURL}"
            alt="${escapeHTML(photo.name)}"
            loading="lazy"
          >

          <div class="memory-caption">

            <h3>${escapeHTML(photo.name)}</h3>

            <button
              type="button"
              class="delete-city-photo"
              data-delete-city-photo="${photo.id}">
               Delete Photo
            </button>

          </div>

        </article>
      `;
    }).join("");

  } catch (error) {
    console.error("City gallery error:", error);

    gallery.innerHTML = `
      <div class="empty-state">
        <h3>Could not load city photos.</h3>
      </div>
    `;
  }
};


// 5. DELETE BUTTON HANDLER

if (countryList) {
  countryList.addEventListener("click", async event => {
    const button = event.target.closest(
      "[data-delete-city-photo]"
    );

    if (!button) return;

    event.preventDefault();
    event.stopPropagation();

    const photoId = button.dataset.deleteCityPhoto;

    const confirmed = confirm(
      "Are you sure you want to permanently delete this photo?"
    );

    if (!confirmed) return;

    try {
      button.disabled = true;

      await deleteCityPhoto(photoId);

      await renderSelectedCityPhotos(
        selectedCountryId,
        selectedRegionId,
        selectedCityId
      );

      alert("Photo deleted successfully!");

    } catch (error) {
      console.error("Photo deletion error:", error);

      alert("Could not delete this photo.");
      button.disabled = false;
    }

  }, true);
}


// 6. FILTER CITY PHOTOS OUT OF MY TRAVEL MEMORIES

renderGallery = async function () {
  if (!memoryGallery) return;

  try {
    const photos = await getPhotos();

    if (typeof mainGalleryURLs !== "undefined") {
      mainGalleryURLs.forEach(url => URL.revokeObjectURL(url));
      mainGalleryURLs = [];
    }

    // Only show photos that have not been assigned to a city.
    const generalPhotos = photos.filter(photo =>
      !photo.cityId && photo.collection !== "city"
    );

    if (!generalPhotos.length) {
      memoryGallery.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon"></span>
          <h3>Your memories belong here</h3>
          <p>City photographs are preserved inside their own city galleries.</p>
        </div>
      `;
      return;
    }

    memoryGallery.innerHTML = generalPhotos.map(photo => {
      const imageURL = URL.createObjectURL(photo.blob);

      if (typeof mainGalleryURLs !== "undefined") {
        mainGalleryURLs.push(imageURL);
      }

      return `
        <article class="memory-card">
          <img
            src="${imageURL}"
            alt="${escapeHTML(photo.name)}"
            loading="lazy"
          >

          <div class="memory-caption">
            <h3>${escapeHTML(photo.name)}</h3>
          </div>
        </article>
      `;
    }).join("");

  } catch (error) {
    console.error("Memory gallery error:", error);
  }
};


// Refresh both galleries using the new rules.
renderGallery();

if (archiveLevel === "photos") {
  renderSelectedCityPhotos(
    selectedCountryId,
    selectedRegionId,
    selectedCityId
  );
}


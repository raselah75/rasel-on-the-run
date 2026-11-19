/* =====================================================================
   RASEL ON THE RUN — WORLD COUNTRY LIST
   Every country (UN members + a few widely used names) with its flag code,
   an approximate centre point for the globe, and its continent.
   Used by the passport "Add a stamp" form, the globe and country flags.
   Format: [name, ISO code, latitude, longitude, continent, other names]
   ===================================================================== */
(() => {
  'use strict';
  const AS = 'Asia', EU = 'Europe', AF = 'Africa', NA = 'North America', SA = 'South America', OC = 'Oceania';
  const LIST = [
    ['Afghanistan', 'AF', 33.9, 67.7, AS], ['Albania', 'AL', 41.2, 20.2, EU], ['Algeria', 'DZ', 28.0, 1.7, AF], ['Andorra', 'AD', 42.5, 1.6, EU],
    ['Angola', 'AO', -11.2, 17.9, AF], ['Antigua and Barbuda', 'AG', 17.1, -61.8, NA], ['Argentina', 'AR', -38.4, -63.6, SA], ['Armenia', 'AM', 40.1, 45.0, AS],
    ['Australia', 'AU', -25.3, 133.8, OC], ['Austria', 'AT', 47.5, 14.6, EU], ['Azerbaijan', 'AZ', 40.1, 47.6, AS], ['Bahamas', 'BS', 25.0, -77.4, NA],
    ['Bahrain', 'BH', 26.0, 50.6, AS], ['Bangladesh', 'BD', 23.7, 90.4, AS], ['Barbados', 'BB', 13.2, -59.5, NA], ['Belarus', 'BY', 53.7, 27.9, EU],
    ['Belgium', 'BE', 50.5, 4.5, EU], ['Belize', 'BZ', 17.2, -88.5, NA], ['Benin', 'BJ', 9.3, 2.3, AF], ['Bhutan', 'BT', 27.5, 90.4, AS],
    ['Bolivia', 'BO', -16.3, -63.6, SA], ['Bosnia and Herzegovina', 'BA', 43.9, 17.7, EU, 'Bosnia'], ['Botswana', 'BW', -22.3, 24.7, AF], ['Brazil', 'BR', -14.2, -51.9, SA],
    ['Brunei', 'BN', 4.5, 114.7, AS], ['Bulgaria', 'BG', 42.7, 25.5, EU], ['Burkina Faso', 'BF', 12.2, -1.6, AF], ['Burundi', 'BI', -3.4, 29.9, AF],
    ['Cabo Verde', 'CV', 16.0, -24.0, AF, 'Cape Verde'], ['Cambodia', 'KH', 12.6, 105.0, AS], ['Cameroon', 'CM', 7.4, 12.4, AF], ['Canada', 'CA', 56.1, -106.3, NA],
    ['Central African Republic', 'CF', 6.6, 20.9, AF], ['Chad', 'TD', 15.5, 18.7, AF], ['Chile', 'CL', -35.7, -71.5, SA], ['China', 'CN', 35.9, 104.2, AS],
    ['Colombia', 'CO', 4.6, -74.3, SA], ['Comoros', 'KM', -11.9, 43.9, AF], ['Congo', 'CG', -0.2, 15.8, AF, 'Republic of the Congo'], ['Costa Rica', 'CR', 9.7, -83.8, NA],
    ['Croatia', 'HR', 45.1, 15.2, EU], ['Cuba', 'CU', 21.5, -77.8, NA], ['Cyprus', 'CY', 35.1, 33.4, EU], ['Czechia', 'CZ', 49.8, 15.5, EU, 'Czech Republic'],
    ['Democratic Republic of the Congo', 'CD', -4.0, 21.8, AF, 'DR Congo'], ['Denmark', 'DK', 56.3, 9.5, EU], ['Djibouti', 'DJ', 11.8, 42.6, AF], ['Dominica', 'DM', 15.4, -61.4, NA],
    ['Dominican Republic', 'DO', 18.7, -70.2, NA], ['Ecuador', 'EC', -1.8, -78.2, SA], ['Egypt', 'EG', 26.8, 30.8, AF], ['El Salvador', 'SV', 13.8, -88.9, NA],
    ['Equatorial Guinea', 'GQ', 1.7, 10.3, AF], ['Eritrea', 'ER', 15.2, 39.8, AF], ['Estonia', 'EE', 58.6, 25.0, EU], ['Eswatini', 'SZ', -26.5, 31.5, AF, 'Swaziland'],
    ['Ethiopia', 'ET', 9.1, 40.5, AF], ['Fiji', 'FJ', -17.7, 178.1, OC], ['Finland', 'FI', 61.9, 25.7, EU], ['France', 'FR', 46.2, 2.2, EU],
    ['Gabon', 'GA', -0.8, 11.6, AF], ['Gambia', 'GM', 13.4, -15.3, AF], ['Georgia', 'GE', 42.3, 43.4, AS], ['Germany', 'DE', 51.2, 10.5, EU],
    ['Ghana', 'GH', 7.9, -1.0, AF], ['Greece', 'GR', 39.1, 21.8, EU], ['Grenada', 'GD', 12.1, -61.7, NA], ['Guatemala', 'GT', 15.8, -90.2, NA],
    ['Guinea', 'GN', 9.9, -9.7, AF], ['Guinea-Bissau', 'GW', 11.8, -15.2, AF], ['Guyana', 'GY', 4.9, -58.9, SA], ['Haiti', 'HT', 18.97, -72.3, NA],
    ['Honduras', 'HN', 15.2, -86.2, NA], ['Hong Kong', 'HK', 22.3, 114.2, AS], ['Hungary', 'HU', 47.2, 19.5, EU], ['Iceland', 'IS', 64.96, -19.0, EU],
    ['India', 'IN', 20.6, 79.0, AS], ['Indonesia', 'ID', -0.8, 113.9, AS], ['Iran', 'IR', 32.4, 53.7, AS], ['Iraq', 'IQ', 33.2, 43.7, AS],
    ['Ireland', 'IE', 53.4, -8.2, EU], ['Israel', 'IL', 31.0, 34.9, AS], ['Italy', 'IT', 41.9, 12.6, EU], ['Ivory Coast', 'CI', 7.5, -5.5, AF, "Côte d'Ivoire"],
    ['Jamaica', 'JM', 18.1, -77.3, NA], ['Japan', 'JP', 36.2, 138.3, AS], ['Jordan', 'JO', 30.6, 36.2, AS], ['Kazakhstan', 'KZ', 48.0, 66.9, AS],
    ['Kenya', 'KE', -0.02, 37.9, AF], ['Kiribati', 'KI', 1.9, -157.4, OC], ['Kosovo', 'XK', 42.6, 20.9, EU], ['Kuwait', 'KW', 29.3, 47.5, AS],
    ['Kyrgyzstan', 'KG', 41.2, 74.8, AS], ['Laos', 'LA', 19.9, 102.5, AS], ['Latvia', 'LV', 56.9, 24.6, EU], ['Lebanon', 'LB', 33.9, 35.9, AS],
    ['Lesotho', 'LS', -29.6, 28.2, AF], ['Liberia', 'LR', 6.4, -9.4, AF], ['Libya', 'LY', 26.3, 17.2, AF], ['Liechtenstein', 'LI', 47.2, 9.6, EU],
    ['Lithuania', 'LT', 55.2, 23.9, EU], ['Luxembourg', 'LU', 49.8, 6.1, EU], ['Macao', 'MO', 22.2, 113.5, AS, 'Macau'], ['Madagascar', 'MG', -18.8, 46.9, AF],
    ['Malawi', 'MW', -13.3, 34.3, AF], ['Malaysia', 'MY', 4.2, 102.0, AS], ['Maldives', 'MV', 3.2, 73.2, AS], ['Mali', 'ML', 17.6, -4.0, AF],
    ['Malta', 'MT', 35.9, 14.4, EU], ['Marshall Islands', 'MH', 7.1, 171.2, OC], ['Mauritania', 'MR', 21.0, -10.9, AF], ['Mauritius', 'MU', -20.3, 57.6, AF],
    ['Mexico', 'MX', 23.6, -102.6, NA], ['Micronesia', 'FM', 7.4, 150.6, OC], ['Moldova', 'MD', 47.4, 28.4, EU], ['Monaco', 'MC', 43.7, 7.4, EU],
    ['Mongolia', 'MN', 46.9, 103.8, AS], ['Montenegro', 'ME', 42.7, 19.4, EU], ['Morocco', 'MA', 31.8, -7.1, AF], ['Mozambique', 'MZ', -18.7, 35.5, AF],
    ['Myanmar', 'MM', 21.9, 95.96, AS, 'Burma'], ['Namibia', 'NA', -22.96, 18.5, AF], ['Nauru', 'NR', -0.5, 166.9, OC], ['Nepal', 'NP', 28.4, 84.1, AS],
    ['Netherlands', 'NL', 52.1, 5.3, EU, 'Holland'], ['New Zealand', 'NZ', -40.9, 174.9, OC], ['Nicaragua', 'NI', 12.9, -85.2, NA], ['Niger', 'NE', 17.6, 8.1, AF],
    ['Nigeria', 'NG', 9.1, 8.7, AF], ['North Korea', 'KP', 40.3, 127.5, AS], ['North Macedonia', 'MK', 41.6, 21.7, EU, 'Macedonia'], ['Norway', 'NO', 60.5, 8.5, EU],
    ['Oman', 'OM', 21.5, 55.9, AS], ['Pakistan', 'PK', 30.4, 69.3, AS], ['Palau', 'PW', 7.5, 134.6, OC], ['Palestine', 'PS', 31.9, 35.2, AS],
    ['Panama', 'PA', 8.5, -80.8, NA], ['Papua New Guinea', 'PG', -6.3, 143.96, OC], ['Paraguay', 'PY', -23.4, -58.4, SA], ['Peru', 'PE', -9.2, -75.0, SA],
    ['Philippines', 'PH', 12.9, 121.8, AS], ['Poland', 'PL', 51.9, 19.1, EU], ['Portugal', 'PT', 39.4, -8.2, EU], ['Puerto Rico', 'PR', 18.2, -66.6, NA],
    ['Qatar', 'QA', 25.4, 51.2, AS], ['Romania', 'RO', 45.9, 24.97, EU], ['Russia', 'RU', 61.5, 105.3, EU], ['Rwanda', 'RW', -1.9, 29.9, AF],
    ['Saint Kitts and Nevis', 'KN', 17.4, -62.8, NA], ['Saint Lucia', 'LC', 13.9, -60.98, NA], ['Saint Vincent and the Grenadines', 'VC', 12.98, -61.3, NA], ['Samoa', 'WS', -13.8, -172.1, OC],
    ['San Marino', 'SM', 43.9, 12.5, EU], ['Sao Tome and Principe', 'ST', 0.2, 6.6, AF], ['Saudi Arabia', 'SA', 23.9, 45.1, AS], ['Senegal', 'SN', 14.5, -14.5, AF],
    ['Serbia', 'RS', 44.0, 21.0, EU], ['Seychelles', 'SC', -4.7, 55.5, AF], ['Sierra Leone', 'SL', 8.5, -11.8, AF], ['Singapore', 'SG', 1.35, 103.8, AS],
    ['Slovakia', 'SK', 48.7, 19.7, EU], ['Slovenia', 'SI', 46.2, 14.995, EU], ['Solomon Islands', 'SB', -9.6, 160.2, OC], ['Somalia', 'SO', 5.2, 46.2, AF],
    ['South Africa', 'ZA', -30.6, 22.9, AF], ['South Korea', 'KR', 35.9, 127.8, AS, 'Korea'], ['South Sudan', 'SS', 6.9, 31.3, AF], ['Spain', 'ES', 40.5, -3.7, EU],
    ['Sri Lanka', 'LK', 7.9, 80.8, AS], ['Sudan', 'SD', 12.9, 30.2, AF], ['Suriname', 'SR', 3.9, -56.0, SA], ['Sweden', 'SE', 60.1, 18.6, EU],
    ['Switzerland', 'CH', 46.8, 8.2, EU], ['Syria', 'SY', 34.8, 39.0, AS], ['Taiwan', 'TW', 23.7, 121.0, AS], ['Tajikistan', 'TJ', 38.9, 71.3, AS],
    ['Tanzania', 'TZ', -6.4, 34.9, AF], ['Thailand', 'TH', 15.9, 100.99, AS], ['Timor-Leste', 'TL', -8.9, 125.7, AS, 'East Timor'], ['Togo', 'TG', 8.6, 0.8, AF],
    ['Tonga', 'TO', -21.2, -175.2, OC], ['Trinidad and Tobago', 'TT', 10.7, -61.2, NA], ['Tunisia', 'TN', 33.9, 9.5, AF], ['Türkiye', 'TR', 38.96, 35.2, AS, 'Turkey'],
    ['Turkmenistan', 'TM', 38.97, 59.6, AS], ['Tuvalu', 'TV', -7.1, 177.6, OC], ['Uganda', 'UG', 1.4, 32.3, AF], ['Ukraine', 'UA', 48.4, 31.2, EU],
    ['United Arab Emirates', 'AE', 23.4, 53.8, AS, 'UAE'], ['United Kingdom', 'GB', 55.4, -3.4, EU, 'UK, England, Scotland, Wales, Britain'], ['United States', 'US', 37.1, -95.7, NA, 'USA, America'], ['Uruguay', 'UY', -32.5, -55.8, SA],
    ['Uzbekistan', 'UZ', 41.4, 64.6, AS], ['Vanuatu', 'VU', -15.4, 166.96, OC], ['Vatican City', 'VA', 41.9, 12.45, EU, 'Vatican'], ['Venezuela', 'VE', 6.4, -66.6, SA],
    ['Vietnam', 'VN', 14.1, 108.3, AS], ['Yemen', 'YE', 15.6, 48.5, AS], ['Zambia', 'ZM', -13.1, 27.8, AF], ['Zimbabwe', 'ZW', -19.0, 29.2, AF]
  ];
  const flagOf = code => (/^[A-Z]{2}$/.test(code) ? String.fromCodePoint(...[...code].map(c => 0x1F1E6 + c.charCodeAt(0) - 65)) : '🏳️');
  const key = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');
  const index = new Map();
  const world = LIST.map(([name, code, lat, lng, continent, alt]) => ({ name, code, lat, lng, continent, flag: flagOf(code), alt: alt ? alt.split(/,\s*/) : [] }));
  world.forEach(c => { index.set(key(c.name), c); c.alt.forEach(a => index.set(key(a), c)); });
  window.RNR_WORLD = {
    list: world,
    find: name => index.get(key(name)) || null,
    flag: name => index.get(key(name))?.flag || ''
  };
})();

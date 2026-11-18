/* Live dual clock on the homepage: where Rasel lives (Toronto) and home (Dhaka).
   Uses the browser's built-in time-zone data, so daylight-saving changes are automatic. */
(() => {
  'use strict';
  const hero = document.getElementById('home');
  if (!hero || document.getElementById('rnrWorldClock')) return;

  const CLOCKS = [
    { label: 'Toronto', note: 'Where I live', zone: 'America/Toronto' },
    { label: 'Dhaka', note: 'Home', zone: 'Asia/Dhaka' }
  ];

  const box = document.createElement('div');
  box.id = 'rnrWorldClock';
  box.className = 'rnr-world-clock';
  box.setAttribute('aria-label', 'Current time in Toronto and Dhaka');
  box.innerHTML = CLOCKS.map((clock, index) => `
    <div class="rnr-clock" data-index="${index}">
      <span class="rnr-clock-label">${clock.label} <small>${clock.note}</small></span>
      <strong class="rnr-clock-time">--:--</strong>
      <span class="rnr-clock-date"></span>
    </div>`).join('<span class="rnr-clock-divider" aria-hidden="true"></span>');
  hero.append(box);

  const timeFormat = zone => new Intl.DateTimeFormat('en-US', { timeZone: zone, hour: 'numeric', minute: '2-digit', hour12: true });
  const dateFormat = zone => new Intl.DateTimeFormat('en-US', { timeZone: zone, weekday: 'short', day: 'numeric', month: 'short' });
  const hourIn = zone => Number(new Intl.DateTimeFormat('en-US', { timeZone: zone, hour: 'numeric', hourCycle: 'h23' }).format(new Date()));
  const locale = () => (document.documentElement.lang === 'bn' ? 'bn-BD' : 'en-US');
  let formatters = [], formattersLocale = '';
  const ensureFormatters = () => {
    if (formattersLocale === locale()) return;
    formattersLocale = locale();
    formatters = CLOCKS.map(clock => ({
      time: new Intl.DateTimeFormat(formattersLocale, { timeZone: clock.zone, hour: 'numeric', minute: '2-digit', hour12: true }),
      date: new Intl.DateTimeFormat(formattersLocale, { timeZone: clock.zone, weekday: 'short', day: 'numeric', month: 'short' })
    }));
  };

  function tick() {
    ensureFormatters();
    const now = new Date();
    box.querySelectorAll('.rnr-clock').forEach((el, index) => {
      const hour = hourIn(CLOCKS[index].zone);
      el.querySelector('.rnr-clock-time').textContent = formatters[index].time.format(now);
      el.querySelector('.rnr-clock-date').textContent = formatters[index].date.format(now);
      el.dataset.daytime = hour >= 6 && hour < 18 ? 'day' : 'night';
    });
  }
  tick();
  // Update exactly when the minute changes, then every minute.
  setTimeout(() => { tick(); setInterval(tick, 60000); }, (60 - new Date().getSeconds()) * 1000 + 50);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
  addEventListener('rnr:language', tick);
})();

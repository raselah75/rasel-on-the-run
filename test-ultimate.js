const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('./ultimate-core.js');

test('haversine distance is zero for the same point', () => {
  assert.equal(core.haversineKm({lat:43.6532,lon:-79.3832},{lat:43.6532,lon:-79.3832}),0);
});
test('haversine distance returns plausible Toronto to Montreal distance', () => {
  const km=core.haversineKm({lat:43.6532,lon:-79.3832},{lat:45.5019,lon:-73.5674});
  assert.ok(km>500 && km<550, `unexpected distance ${km}`);
});
test('trip summary totals route points and elapsed time', () => {
  const s=core.tripSummary({points:[{lat:43.6532,lon:-79.3832,time:'2026-01-01T10:00:00Z'},{lat:45.5019,lon:-73.5674,time:'2026-01-01T12:30:00Z'}]});
  assert.equal(s.points,2); assert.equal(s.durationMinutes,150); assert.ok(s.distanceKm>500);
});
test('smart organizer classifies and sorts assets', () => {
  const x=core.organizeMedia([{title:'old',type:'image/jpeg',date:'2024-01-01'},{title:'clip',type:'video/mp4',date:'2025-01-01'}]);
  assert.equal(x[0].kind,'video'); assert.equal(x[0].year,'2025');
});
test('story assistant uses only supplied facts', () => {
  const s=core.storyDraft({place:'Banff',date:'2026-06-01',mood:'Peaceful',highlights:'the sunrise'});
  assert.match(s,/Banff/); assert.match(s,/the sunrise/); assert.doesNotMatch(s,/weather was sunny/i);
});
test('explorer level is based on supplied saved records', () => {
  const s=core.achievementStats({trips:[{}],tracks:[{points:[{lat:0,lon:0},{lat:0,lon:1}]}],media:[{type:'video/mp4'}]});
  assert.equal(s.points,55); assert.equal(s.level,'Explorer');
});

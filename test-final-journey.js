const test=require('node:test');const assert=require('node:assert/strict');const c=require('./final-journey-core.js');
test('trip summary formatting',()=>assert.equal(c.tripPlanSummary({destination:'Banff',startDate:'2026-07-01',endDate:'2026-07-03',budget:500,currency:'CAD'}),'Banff · 2026-07-01 · 2026-07-03 · CAD 500'));
test('annual wrapped counts matching year only',()=>{const d={trips:[{startDate:'2026-01-01'},{startDate:'2025-01-01'}],reservations:[],heritage:[],birds:[],geology:[],coastal:[],astronomy:[],portfolio:[]};assert.equal(c.annualWrapped(d,2026).trips,1)});
test('magazine escapes user text',()=>{const h=c.magazineHTML('<script>','2026',[{title:'<img src=x>',notes:'& hello'}]);assert.ok(!h.includes('<script>'));assert.ok(h.includes('&lt;img'))});
test('wallet conversion requires explicit rate',()=>{assert.equal(c.convertAmount(100,0),null);assert.equal(c.convertAmount(100,1.35),135)});
test('trip date validation rejects end before start',()=>{assert.equal(c.validTripDates('2026-07-03','2026-07-01'),false);assert.equal(c.validTripDates('2026-07-01','2026-07-03'),true)});
test('annual recap handles empty arrays',()=>assert.equal(c.annualWrapped({},2026).trips,0));

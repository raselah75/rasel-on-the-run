const test=require('node:test');
const assert=require('node:assert/strict');
const c=require('./content-manager-core.js');

test('discovers root-array collections',()=>{assert.deepEqual(c.collectionsOf([{id:1}]),['__root__']);assert.equal(c.getCollection([{id:1}],'__root__').length,1)});
test('discovers nested array collections and keeps unrelated fields',()=>{const d={trips:[{id:'a'}],settings:{mode:'dark'}};assert.deepEqual(c.collectionsOf(d),['trips']);const n=c.replaceRecord(d,'trips',0,{id:'a',title:'Edited'});assert.equal(n.settings.mode,'dark');assert.equal(n.trips[0].title,'Edited')});
test('edits a single-object profile safely',()=>{const d={name:'Old',bio:'Hello'};assert.deepEqual(c.collectionsOf(d),['__object__']);const n=c.replaceRecord(d,'__object__',0,{name:'New',bio:'Updated'});assert.equal(n.name,'New')});
test('removes only the selected collection record',()=>{const d={trips:[{id:1},{id:2}],other:[{id:3}]};const n=c.removeRecord(d,'trips',0);assert.deepEqual(n.trips,[{id:2}]);assert.deepEqual(n.other,[{id:3}])});
test('rejects malformed or non-object record JSON',()=>{assert.throws(()=>c.safeParseRecord('{bad'));assert.throws(()=>c.safeParseRecord('[]'))});
test('record labels use available human-readable fields',()=>{assert.equal(c.displayName({destination:'Banff'},0),'Banff');assert.equal(c.displayName({},2),'Record 3')});

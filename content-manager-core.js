/* Shared pure helpers for the universal content manager. */
(function(root){'use strict';
  const clone=x=>JSON.parse(JSON.stringify(x));
  function parseStored(value){try{return JSON.parse(value)}catch{return null}}
  function collectionsOf(data){if(Array.isArray(data))return ['__root__'];if(data&&typeof data==='object'){const keys=Object.keys(data).filter(k=>Array.isArray(data[k]));return keys.length?keys:['__object__']}return []}
  function getCollection(data,key){if(key==='__root__'&&Array.isArray(data))return data;if(key==='__object__'&&data&&typeof data==='object'&&!Array.isArray(data))return [data];return data&&Array.isArray(data[key])?data[key]:[]}
  function replaceRecord(data,key,index,record){const next=clone(data);const list=getCollection(next,key);if(index<0||index>=list.length)throw new RangeError('Record no longer exists');if(key==='__object__')return record;list[index]=record;if(key==='__root__')return list;next[key]=list;return next}
  function removeRecord(data,key,index){const next=clone(data),list=getCollection(next,key);if(index<0||index>=list.length)throw new RangeError('Record no longer exists');if(key==='__object__')return {};list.splice(index,1);if(key==='__root__')return list;next[key]=list;return next}
  function displayName(record,index){if(!record||typeof record!=='object')return `Record ${index+1}`;return String(record.name||record.title||record.destination||record.place||record.label||record.city||record.country||`Record ${index+1}`)}
  function safeParseRecord(text){const value=JSON.parse(text);if(!value||typeof value!=='object'||Array.isArray(value))throw new TypeError('A record must be a JSON object');return value}
  const api={parseStored,collectionsOf,getCollection,replaceRecord,removeRecord,displayName,safeParseRecord};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.RaselContentManagerCore=api;
})(typeof globalThis!=='undefined'?globalThis:this);

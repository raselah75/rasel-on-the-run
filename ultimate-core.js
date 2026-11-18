/* Pure helpers shared by the Ultimate Explorer UI and automated tests. */
(function(root){
  'use strict';
  const haversineKm=(a,b)=>{const r=6371,to=x=>x*Math.PI/180,dl=to(b.lat-a.lat),dn=to(b.lon-a.lon),v=Math.sin(dl/2)**2+Math.cos(to(a.lat))*Math.cos(to(b.lat))*Math.sin(dn/2)**2;return 2*r*Math.asin(Math.sqrt(v));};
  function tripSummary(trip){const points=Array.isArray(trip?.points)?trip.points:[];let distance=0;for(let i=1;i<points.length;i++)distance+=haversineKm(points[i-1],points[i]);const start=points[0]?.time,end=points.at(-1)?.time;return {points:points.length,distanceKm:Number(distance.toFixed(2)),durationMinutes:start&&end?Math.max(0,Math.round((new Date(end)-new Date(start))/60000)):0,first:start||null,last:end||null};}
  function organizeMedia(items){return [...(items||[])].map(x=>({...x,kind:(x.type||x.blob?.type||'').startsWith('video/')?'video':'photo',year:(x.date||x.travelDate||x.uploadedAt||'').slice(0,4)})).sort((a,b)=>(b.date||b.travelDate||b.uploadedAt||'').localeCompare(a.date||a.travelDate||a.uploadedAt||''));}
  function storyDraft({place='',date='',mood='',highlights='',challenge='',lesson=''}){const bits=[];if(place)bits.push(`I explored ${place}${date?` on ${date}`:''}.`);if(mood)bits.push(`The day felt ${mood.toLowerCase()}.`);if(highlights)bits.push(`One moment I want to remember: ${highlights}.`);if(challenge)bits.push(`The biggest challenge was ${challenge}.`);if(lesson)bits.push(`I came away with this lesson: ${lesson}.`);return bits.join(' ')||'Add a place, a moment, or a lesson to begin your travel story.';}
  function achievementStats(data){const trips=data.trips||[],tracks=data.tracks||[],media=data.media||[];const km=tracks.reduce((s,t)=>s+(tripSummary(t).distanceKm||0),0);const points=trips.length*20+tracks.length*25+media.filter(x=>(x.type||x.blob?.type||'').startsWith('video/')).length*10;return {trips:trips.length,tracks:tracks.length,media:media.length,distanceKm:Number(km.toFixed(2)),points,level:points>=500?'Expedition Legend':points>=250?'Trailblazer':points>=100?'Adventurer':points>=30?'Explorer':'Curious Beginner'};}
  const api={haversineKm,tripSummary,organizeMedia,storyDraft,achievementStats};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.RaselUltimateCore=api;
})(typeof globalThis!=='undefined'?globalThis:this);

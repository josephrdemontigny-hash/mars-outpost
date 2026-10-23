// MARS service worker — offline play. Bump VERSION on every release.
const VERSION='mars-v62';
const CORE=['./','index.html','game.js','poster.webp','manifest.webmanifest','icons/icon-180.png','icons/icon-192.png','icons/icon-512.png','icons/maskable-512.png','icons/favicon-32.png'];
const CDN=['https://unpkg.com/three@0.160.0/build/three.module.js','https://unpkg.com/three@0.160.0/examples/jsm/environments/RoomEnvironment.js','https://unpkg.com/three@0.160.0/examples/jsm/geometries/RoundedBoxGeometry.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(async c=>{await c.addAll(CORE);await Promise.all(CDN.map(u=>c.add(new Request(u,{mode:'cors'})).catch(()=>{})));}));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('message',e=>{if(e.data==='skipWaiting')self.skipWaiting();});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
 if(u.origin===location.origin){// network-first so updates arrive; cache fallback offline
  e.respondWith(fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(VERSION).then(c=>c.put(r,cp));}return res;}).catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||(r.mode==='navigate'?caches.match('index.html'):undefined))));return;}
 if(/unpkg\.com|fonts\.(googleapis|gstatic)\.com/.test(u.host)){// versioned CDN + fonts: cache-first
  e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{if(res.ok||res.type==='opaque'){const cp=res.clone();caches.open(VERSION).then(c=>c.put(r,cp));}return res;})));}});

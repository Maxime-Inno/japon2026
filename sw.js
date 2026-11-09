// Service worker – Japon 2026 (fonctionnement hors ligne)
const V='jp26-app-v8';
const SHELL=['./','index.html','data.js','data2.js','app.js','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png'];
const CDN=['https://unpkg.com/leaflet@1.9.4/dist/leaflet.css','https://unpkg.com/leaflet@1.9.4/dist/leaflet.js','https://unpkg.com/xlsx@0.18.5/dist/xlsx.full.min.js',
'https://unpkg.com/leaflet@1.9.4/dist/images/layers.png','https://unpkg.com/leaflet@1.9.4/dist/images/layers-2x.png'];
self.addEventListener('install',e=>{e.waitUntil((async()=>{const c=await caches.open(V);await c.addAll(SHELL);
 await Promise.all(CDN.map(u=>fetch(u).then(r=>r.ok&&c.put(u,r)).catch(()=>{})));self.skipWaiting()})())});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{for(const k of await caches.keys())if(k.startsWith('jp26-app')&&k!==V)await caches.delete(k);await self.clients.claim()})())});
async function cacheFirst(req,name){const c=await caches.open(name);const hit=await c.match(req,{ignoreVary:true});if(hit)return hit;
 try{const r=await fetch(req);if(r.ok||r.type==='opaque')c.put(req,r.clone());return r}catch(e){return hit||Response.error()}}
async function networkFirst(req){const c=await caches.open(V);
 try{const r=await Promise.race([fetch(req),new Promise((_,rej)=>setTimeout(()=>rej('timeout'),3500))]);if(r.ok)c.put(req,r.clone());return r}
 catch(e){return (await c.match(req,{ignoreSearch:true}))||(await c.match('index.html'))||Response.error()}}
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET')return;
 if(u.hostname==='server.arcgisonline.com')return e.respondWith(cacheFirst(e.request,'jp26-tiles'));
 if(u.hostname==='unpkg.com')return e.respondWith(cacheFirst(e.request,V));
 if(u.origin===location.origin)return e.respondWith(networkFirst(e.request));
});

// 鹰眼 AI 手机版 App Service Worker（子路径自适应）
const CACHE='eagleeye-app-v1';
const REL=[
  './eagleeye-app.html','./eagleeye-safety.html','./manifest-eagleeye.webmanifest',
  './icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-512.png'
];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(REL.map(p=>new URL(p,self.registration.scope).href))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  if(e.request.method!=='GET')return;
  if(url.hostname.includes('cdn.')||url.hostname.includes('fonts.')){
    e.respondWith(caches.open(CACHE).then(async c=>{
      const hit=await c.match(e.request);
      const net=fetch(e.request).then(r=>{if(r.ok)c.put(e.request,r.clone());return r;}).catch(()=>hit);
      return hit||net;
    }));
    return;
  }
  e.respondWith(caches.open(CACHE).then(async c=>{
    const hit=await c.match(e.request);
    if(hit){fetch(e.request).then(r=>{if(r.ok)c.put(e.request,r);}).catch(()=>{});return hit;}
    const res=await fetch(e.request);
    if(res.ok)c.put(e.request,res.clone());
    return res;
  }));
});

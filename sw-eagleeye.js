// 鹰眼 AI App Service Worker v2：HTML 网络优先，资源缓存优先
const CACHE='eagleeye-app-v2';
const ASSETS=[
  './eagleeye-app.html','./eagleeye-safety.html','./manifest-eagleeye.webmanifest',
  './icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-512.png'
];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS.map(p=>new URL(p,self.registration.scope).href))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  if(e.request.method!=='GET')return;
  if(url.hostname.includes('cdn.')||url.hostname.includes('fonts.')||url.hostname.includes('qrserver')){
    e.respondWith(caches.open(CACHE).then(async c=>{
      const hit=await c.match(e.request);
      const net=fetch(e.request).then(r=>{if(r.ok)c.put(e.request,r.clone());return r;}).catch(()=>hit);
      return hit||net;
    }));
    return;
  }
  if(e.request.mode==='navigate'||url.pathname.endsWith('.html')){
    e.respondWith(
      fetch(e.request).then(res=>{
        const copy=res.clone();
        caches.open(CACHE).then(c=>c.put(e.request,copy));
        return res;
      }).catch(()=>caches.match(e.request).then(hit=>hit||caches.match('./eagleeye-app.html')))
    );
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

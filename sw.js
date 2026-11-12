// AEGIS Service Worker v5：HTML 永远网络优先（不再出现旧版页面），静态资源缓存优先
const CACHE='aegis-v5';
const STATIC_ASSETS=[
  './index.html','./eagleeye-safety.html','./eagleeye-app.html',
  './css/style.css','./css/upgrade.css','./css/watch.css',
  './js/main.js','./js/pwa.js','./js/three-twin.js','./js/hazard-game.js',
  './js/drill.js','./js/radar.js','./js/watch.js',
  './icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-512.png',
  './manifest.webmanifest','./manifest-eagleeye.webmanifest'
];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(STATIC_ASSETS.map(p=>new URL(p,self.registration.scope).href))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  if(e.request.method!=='GET')return;
  // CDN：stale-while-revalidate
  if(url.hostname.includes('cdn.')||url.hostname.includes('fonts.')){
    e.respondWith(caches.open(CACHE).then(async c=>{
      const hit=await c.match(e.request);
      const net=fetch(e.request).then(r=>{if(r.ok)c.put(e.request,r.clone());return r;}).catch(()=>hit);
      return hit||net;
    }));
    return;
  }
  // HTML 页面：网络优先（拿不到再回缓存），保证永远最新
  if(e.request.mode==='navigate'||url.pathname.endsWith('.html')){
    e.respondWith(
      fetch(e.request).then(res=>{
        const copy=res.clone();
        caches.open(CACHE).then(c=>c.put(e.request,copy));
        return res;
      }).catch(()=>caches.match(e.request).then(hit=>hit||caches.match('./eagleeye-safety.html')))
    );
    return;
  }
  // 静态资源：缓存优先 + 后台更新
  e.respondWith(caches.open(CACHE).then(async c=>{
    const hit=await c.match(e.request);
    if(hit){fetch(e.request).then(r=>{if(r.ok)c.put(e.request,r);}).catch(()=>{});return hit;}
    const res=await fetch(e.request);
    if(res.ok)c.put(e.request,res.clone());
    return res;
  }));
});

// AEGIS Service Worker：离线可用 + 更新策略（子路径自适应，兼容 GitHub Pages /repo/）
const CACHE = 'aegis-v3';
const REL = [
  './index.html', './watch.html', './manifest.webmanifest',
  './css/style.css', './css/upgrade.css', './css/watch.css',
  './js/main.js', './js/pwa.js', './js/three-twin.js', './js/hazard-game.js',
  './js/drill.js', './js/radar.js', './js/watch.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png'
];

self.addEventListener('install', e => {
  const urls = REL.map(p => new URL(p, self.registration.scope).href);
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(urls)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // CDN 资源：stale-while-revalidate
  if (url.hostname.includes('cdn.jsdelivr.net') || url.hostname.includes('fonts.g')) {
    e.respondWith(
      caches.open(CACHE).then(async c => {
        const cached = await c.match(e.request);
        const net = fetch(e.request).then(res => {
          if (res.ok) c.put(e.request, res.clone());
          return res;
        }).catch(() => cached);
        return cached || net;
      })
    );
    return;
  }
  // 本地资源：cache-first + 后台更新
  e.respondWith(
    caches.open(CACHE).then(async c => {
      const cached = await c.match(e.request);
      if (cached) {
        fetch(e.request).then(res => { if (res.ok) c.put(e.request, res); }).catch(() => {});
        return cached;
      }
      const res = await fetch(e.request);
      if (res.ok) c.put(e.request, res.clone());
      return res;
    })
  );
});

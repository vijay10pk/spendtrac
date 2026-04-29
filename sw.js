const CACHE_NAME = 'spendwise-v6';
const ASSETS = ['./index.html', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Never intercept external API calls — pass straight through
  if (url.includes('google.com') || url.includes('sheetdb.io') ||
      url.includes('googleapis.com') || url.includes('jsdelivr') ||
      url.includes('fonts.')) return;

  // App shell — cache first, network fallback
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        // Only cache valid same-origin responses
        if (!res || res.status !== 200 || res.type !== 'basic') return res;
        const toCache = res.clone(); // clone BEFORE using
        caches.open(CACHE_NAME).then(c => c.put(e.request, toCache));
        return res;
      });
    })
  );
});

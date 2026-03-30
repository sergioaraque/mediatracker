const CACHE = 'mediatracker-v1';

// Vite hashes asset filenames — cache-first with network fallback is safe
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Skip non-GET, cross-origin (Appwrite API), and runtime config
  if (e.request.method !== 'GET') return;
  if (url.origin !== location.origin) return;
  if (url.pathname === '/config.js') return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok) {
          const toCache = res.clone(); // clone synchronously before body is consumed
          caches.open(CACHE).then(c => c.put(e.request, toCache));
        }
        return res;
      });
    })
  );
});

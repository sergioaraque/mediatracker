const CACHE_PREFIX = 'mediatracker';
const APP_CACHE = `${CACHE_PREFIX}-app-v2`;
const RUNTIME_CACHE = `${CACHE_PREFIX}-runtime-v2`;

// Keep the active worker current immediately after deployment.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys
        .filter(k => k.startsWith(CACHE_PREFIX) && k !== APP_CACHE && k !== RUNTIME_CACHE)
        .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

async function cacheResponse(cacheName, request, response) {
  if (!response || !response.ok) return response;
  const cache = await caches.open(cacheName);
  cache.put(request, response.clone());
  return response;
}

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Skip non-GET, cross-origin (Appwrite API), and runtime config
  if (e.request.method !== 'GET') return;
  if (url.origin !== location.origin) return;
  if (url.pathname === '/config.js') return;

  const accept = e.request.headers.get('accept') || '';
  const isNavigation = e.request.mode === 'navigate' || accept.includes('text/html');
  const isAsset = ['script', 'style', 'image', 'font'].includes(e.request.destination);

  if (isNavigation) {
    e.respondWith((async () => {
      try {
        const response = await fetch(e.request);
        return await cacheResponse(APP_CACHE, e.request, response);
      } catch {
        const cached = await caches.match(e.request);
        if (cached) return cached;
        const fallback = await caches.match('/index.html');
        if (fallback) return fallback;
        throw new Error('Offline and no cached shell available');
      }
    })());
    return;
  }

  if (isAsset) {
    e.respondWith((async () => {
      const cached = await caches.match(e.request);
      if (cached) {
        e.waitUntil((async () => {
          try {
            const fresh = await fetch(e.request);
            await cacheResponse(RUNTIME_CACHE, e.request, fresh);
          } catch {}
        })());
        return cached;
      }

      try {
        const response = await fetch(e.request);
        return await cacheResponse(RUNTIME_CACHE, e.request, response);
      } catch {
        throw new Error('Asset not available offline');
      }
    })());
    return;
  }

  e.respondWith((async () => {
    const cached = await caches.match(e.request);
    if (cached) return cached;
    const response = await fetch(e.request);
    return cacheResponse(RUNTIME_CACHE, e.request, response);
  })());
});

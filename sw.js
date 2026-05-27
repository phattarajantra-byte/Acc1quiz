/**
 * Service Worker for TFRS Quiz PWA
 *
 * Strategy: cache-first for index.html and Google Fonts so the app
 * works fully offline after the first visit. Bump CACHE_VERSION
 * whenever index.html changes so the browser picks up the new copy.
 */
const CACHE_VERSION = 'tfrs-quiz-v1';
const CORE_ASSETS = [
  './',
  './index.html',
];

// On install: pre-cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// On activate: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_VERSION)
            .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// On fetch: cache-first, fall back to network, then cache the result
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cache successful responses (including fonts)
        if (response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then(cache => {
            cache.put(event.request, clone).catch(() => {});
          });
        }
        return response;
      }).catch(() => {
        // Network failed and not in cache — return a basic fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

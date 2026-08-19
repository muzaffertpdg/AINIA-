// Ainia Scene Index — service worker
// Caches only the local app shell so the index itself loads instantly and
// works offline. Deliberately does NOT touch Substack links or any other
// external requests — those pass straight through to the network as normal.

const CACHE_NAME = 'ainia-scene-index-v2';

const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './si-styles.css',
  './data.js',
  './app.js',
  './manifest.json',
  './favicon.svg',
  './favicon.ico',
  './favicon-16x16.png',
  './favicon-32x32.png',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch((err) => console.warn('Service worker: failed to cache some app shell files', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only intercept same-origin GET requests. Everything else (Substack pages,
  // Google Fonts, etc.) is left completely alone and handled by the browser.
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // data.js is the one file that actually changes often (new scenes added via
  // the editor tool). Always try the network first so new scenes show up on
  // the very next load, not one load later — only fall back to the cached
  // copy if there's genuinely no connection.
  if (url.pathname.endsWith('data.js')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Everything else (shell files that rarely change): cache-first for instant
  // load and offline support, refreshed in the background for next time.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached); // offline: fall back to whatever's cached, if anything
      return cached || networkFetch;
    })
  );
});

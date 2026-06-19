const CACHE_NAME = 'dayspring-v2';  // Bump version to bust old cache
const urlsToCache = [
  '/',
  '/index.html',
  '/logo.jpg',
  '/manifest.json',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())  // Activate immediately
  );
});

self.addEventListener('fetch', event => {
  // IMPORTANT: Don't intercept API calls (cross-origin requests)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;  // Let the browser handle API requests normally
  }
  
  // Only cache/respond for same-origin requests
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached response if available
        if (response) {
          return response;
        }
        // Otherwise, fetch from network
        return fetch(event.request);
      })
  );
});

// Clean up old caches when a new service worker activates
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)  // Delete old caches
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())  // Take control of all clients
  );
});
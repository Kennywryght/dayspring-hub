const CACHE_NAME = 'dayspring-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/logo.jpg',
  '/manifest.json',
  // Add more static assets if needed
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  // Only cache/respond for your own origin (the app shell)
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
  }
  // Otherwise, do nothing – let the browser handle the request normally.
});
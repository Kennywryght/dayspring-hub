const CACHE_NAME = 'dayspring-v4';
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
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Skip API calls (cross-origin or /api/ path)
  if (!url.origin.includes(self.location.origin) || url.pathname.includes('/api/')) {
    return;
  }
  
  // Skip Vite HMR requests
  if (url.pathname.includes('/@vite') || url.pathname.includes('/@fs')) {
    return;
  }
  
  // Navigation requests — network-first
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }
  
  // Static assets — cache-first
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names => Promise.all(
      names.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
    )).then(() => self.clients.claim())
  );
});
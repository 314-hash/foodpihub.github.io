const CACHE_NAME = 'foodpihub-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/restaurant.html',
  '/checkout.html',
  '/login.html',
  '/register.html',
  '/profile.html',
  '/wallet.html',
  '/privacy-policy.html',
  '/terms-of-service.html',
  '/css/styles.css',
  '/css/tailwind.css',
  '/js/app.js',
  '/js/restaurant.js',
  '/js/checkout.js',
  '/config.js',
  '/manifest.json',
  '/images/logo.png',
  'https://sdk.minepi.com/pi-sdk.js'
];

// Install Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
});

// Fetch Event Strategy: Cache First, then Network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached response if found
        if (response) {
          return response;
        }

        // Clone the request because it can only be used once
        const fetchRequest = event.request.clone();

        // Make network request and cache the response
        return fetch(fetchRequest).then(response => {
          // Check if response is valid
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response because it can only be used once
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
  );
});

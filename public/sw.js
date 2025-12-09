/**
 * Service Worker för offline-caching och prestandaoptimering
 * Cachar statiska resurser för snabbare laddning
 */

const CACHE_NAME = 'westeras-kungfu-v1';
const STATIC_CACHE_NAME = 'westeras-kungfu-static-v1';
const IMAGE_CACHE_NAME = 'westeras-kungfu-images-v1';

// Resurser som ska cachas vid installation
const STATIC_ASSETS = [
  '/',
  '/styles/global.css',
  '/logo.svg',
  '/favicon.svg'
];

// Install event - cachar statiska resurser
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
    })
  );
  
  self.skipWaiting();
});

// Activate event - rensar gamla caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return name !== CACHE_NAME && 
                   name !== STATIC_CACHE_NAME && 
                   name !== IMAGE_CACHE_NAME;
          })
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  
  return self.clients.claim();
});

// Fetch event - strategi för olika typer av resurser
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorera non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Ignorera externa requests (Google Maps, Facebook, etc.)
  if (url.origin !== location.origin) {
    return;
  }
  
  // Strategi för bilder: Cache First med Network Fallback
  if (request.destination === 'image') {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(request).then((networkResponse) => {
            // Cacha endast framgångsrika responses
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // Fallback till en placeholder om både cache och network misslyckas
            return new Response('', { status: 404 });
          });
        });
      })
    );
    return;
  }
  
  // Strategi för CSS/JS: Network First med Cache Fallback
  if (request.destination === 'style' || request.destination === 'script') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse.ok) {
            const responseClone = networkResponse.clone();
            caches.open(STATIC_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || new Response('', { status: 404 });
          });
        })
    );
    return;
  }
  
  // Strategi för HTML: Network First med Cache Fallback
  if (request.destination === 'document' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse.ok) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || new Response('', { status: 404 });
          });
        })
    );
    return;
  }
  
  // Standard: Network First
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});

// Message event - för att rensa cache från appen
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME);
    caches.delete(STATIC_CACHE_NAME);
    caches.delete(IMAGE_CACHE_NAME);
    event.ports[0].postMessage({ success: true });
  }
});


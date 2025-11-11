// CompanionX World 2026 - Service Worker
// PWA support with offline fallback and caching

const CACHE_VERSION = 'v1';
const CACHE_NAME = `companionx-${CACHE_VERSION}`;

// Assets to precache
const PRECACHE_URLS = [
  '/',
  '/offline',
  '/globals.css',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.webmanifest',
];

// Install event - precache critical assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Precaching app shell');
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions
  if (request.url.startsWith('chrome-extension://')) {
    return;
  }

  // API requests: network only
  if (request.url.includes('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // All other requests: network first, cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clone response for caching
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });

        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // No cache, show offline page for navigations
          if (request.mode === 'navigate') {
            return caches.match('/offline');
          }

          // Return a simple offline response
          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain',
            }),
          });
        });
      })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push received');

  let data = {};
  if (event.data) {
    data = event.data.json();
  }

  const title = data.title || 'CompanionX';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: data.url || '/',
    tag: data.tag || 'notification',
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification clicked');
  event.notification.close();

  const urlToOpen = event.notification.data || '/';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there's already a window/tab open
        for (let client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }

        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

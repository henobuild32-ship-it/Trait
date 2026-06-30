const CACHE_NAME = 'trait-pwa-v5';
const API_CACHE = 'trait-api-v5';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-1024.png',
  '/apple-touch-icon.png',
  '/favicon-16.png',
  '/favicon-32.png',
  '/trait-logo.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME && k !== API_CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

function shouldCacheApi(url) {
  const cacheablePaths = [
    '/api/transfer/history',
    '/api/support',
    '/api/notifications',
    '/api/config/exchange-rate',
    '/api/auth/profile',
  ];
  return cacheablePaths.some((p) => url.pathname.startsWith(p));
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Cache GET API responses (network-first with cache fallback)
  if (event.request.method === 'GET' && shouldCacheApi(url)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(API_CACHE).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Static assets: network-first with cache fallback
  if (event.request.method === 'GET') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request).then((r) => r || caches.match('/')))
    );
    return;
  }

  // For POST/PUT/DELETE, try network but store in IndexedDB if offline
  if (event.request.method === 'POST' || event.request.method === 'PUT' || event.request.method === 'DELETE') {
    event.respondWith(
      fetch(event.request)
        .then((response) => response)
        .catch(() => {
          return new Response(JSON.stringify({
            success: false,
            offline: true,
            message: 'Transaction enregistrée hors ligne. Elle sera synchronisée automatiquement.'
          }), {
            status: 202,
            headers: { 'Content-Type': 'application/json' },
          });
        })
    );
  }
});

// Background sync for offline transactions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncPendingTransactions());
  }
});

async function syncPendingTransactions() {
  try {
    const cache = await caches.open(API_CACHE);
    // Post a message to all clients to trigger pending transaction sync
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({ type: 'SYNC_PENDING_TRANSACTIONS' });
    });
  } catch (error) {
    console.error('Sync error:', error);
  }
}

// Listen for messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'REGISTER_BACKGROUND_SYNC') {
    self.registration.sync.register('sync-transactions').catch(() => {});
  }
});

self.addEventListener('push', (event) => {
  let data = { title: 'TRAIT', body: 'Nouvelle notification' };
  try {
    if (event.data) data = event.data.json();
  } catch {}

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'trait-notification',
    data: { url: data.url || '/' },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

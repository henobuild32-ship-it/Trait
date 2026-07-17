const CACHE = 'trait-v8';
const DYNAMIC_CACHE = 'trait-dynamic-v8';
const API_CACHE = 'trait-api-v8';
const OFFLINE_PAGE = '/offline.html';

const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/favicon-16.png',
  '/favicon-32.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE && k !== DYNAMIC_CACHE && k !== API_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

function isCacheableApi(url) {
  const paths = [
    '/api/transfer/history',
    '/api/support',
    '/api/notifications',
    '/api/config/exchange-rate',
    '/api/auth/profile',
    '/api/stats',
    '/api/bonus',
    '/api/transactions',
    '/api/users/public',
  ];
  return paths.some((p) => url.pathname.startsWith(p));
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  if (request.method === 'GET' && isCacheableApi(url)) {
    event.respondWith(apiNetworkFirst(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(navigationHandler(request));
    return;
  }

  if (request.method === 'GET' && isStaticAsset(url)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
    event.respondWith(mutationHandler(request));
    return;
  }

  event.respondWith(fetch(request).catch(() => caches.match(request)));
});

async function apiNetworkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const clone = response.clone();
      caches.open(API_CACHE).then((c) => c.put(request, clone));
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return offlineJsonResponse();
  }
}

async function navigationHandler(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const clone = response.clone();
      caches.open(DYNAMIC_CACHE).then((c) => c.put(request, clone));
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    const offlinePage = await caches.match(OFFLINE_PAGE);
    if (offlinePage) return offlinePage;
    return new Response('Hors ligne', { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        caches.open(DYNAMIC_CACHE).then((c) => c.put(request, response.clone()));
      }
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}

async function mutationHandler(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch {
    try {
      const clonedRequest = request.clone();
      const body = await clonedRequest.text();
      const headers = {};
      clonedRequest.headers.forEach((v, k) => { headers[k] = v; });

      const db = await openIndexedDB();
      const tx = db.transaction('pending', 'readwrite');
      tx.objectStore('pending').add({
        url: clonedRequest.url,
        method: clonedRequest.method,
        body: body,
        headers: JSON.stringify(headers),
        createdAt: Date.now(),
        retries: 0,
      });

      self.clients.matchAll().then((clients) => {
        clients.forEach((c) => c.postMessage({ type: 'TRANSACTION_QUEUED' }));
      });
    } catch {}

    return new Response(JSON.stringify({
      success: true,
      offline: true,
      message: 'Transaction enregistrée hors ligne. Synchronisation automatique au retour de la connexion.',
    }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

function isStaticAsset(url) {
  const { pathname } = url;
  return (
    pathname.startsWith('/_next/static/') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.ttf') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.webp') ||
    pathname.startsWith('/fonts/')
  );
}

function offlineJsonResponse() {
  return new Response(JSON.stringify({
    success: false,
    offline: true,
    message: 'Données non disponibles hors ligne. Reconnectez-vous pour actualiser.',
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('trait-offline-sw', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('pending')) {
        db.createObjectStore('pending', { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SYNC_NOW') {
    syncAllPending();
  }
});

async function syncAllPending() {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction('pending', 'readonly');
    const store = tx.objectStore('pending');
    const all = await new Promise((resolve) => {
      const r = store.getAll();
      r.onsuccess = () => resolve(r.result || []);
      r.onerror = () => resolve([]);
    });

    let synced = 0;
    let failed = 0;

    for (const item of all) {
      try {
        const headers = item.headers ? JSON.parse(item.headers) : {};
        const response = await fetch(item.url, {
          method: item.method,
          headers: { 'Content-Type': 'application/json', ...headers },
          body: item.body,
        });
        if (response.ok || response.status === 409) {
          const deleteTx = db.transaction('pending', 'readwrite');
          deleteTx.objectStore('pending').delete(item.id);
          synced++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    self.clients.matchAll().then((clients) => {
      clients.forEach((c) => {
        c.postMessage({ type: 'SYNC_COMPLETE', synced, failed });
      });
    });
  } catch {}
}

self.addEventListener('push', (event) => {
  let data = { title: 'TRAIT', body: 'Nouvelle notification', icon: '/icon-192.png', badge: '/icon-192.png' };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() }
    } catch {
      data.body = event.data.text()
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icon-192.png',
      badge: data.badge || '/icon-192.png',
      vibrate: [200, 100, 200],
      requireInteraction: true,
      data: data.data || {},
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }
      return clients.openWindow(urlToOpen)
    })
  );
});

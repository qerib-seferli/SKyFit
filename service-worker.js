// ============================================================
// SKy Fit Professional — Service Worker
// Build: 2026.08.05-v7
// ============================================================

const VERSION = '2026.08.05-v7';

const STATIC_CACHE = `skyfit-static-${VERSION}`;
const RUNTIME_CACHE = `skyfit-runtime-${VERSION}`;

const APP_SHELL = [
  './',
  './index.html',
  './login.html',
  './register.html',
  './profile.html',
  './admin.html',
  './sevimliler.html',
  './reset-password.html',
  './update-password.html',

  './manifest.json',

  './css/style.css',

  './js/config.js',
  './js/core.js',
  './js/app.js',
  './js/auth.js',
  './js/profile.js',
  './js/admin.js',
  './js/favorites.js',

  './assets/img/logo.png',
  './assets/img/hero-main.jpg',
  './assets/img/auth-background.jpg',
  './assets/img/profile-background.jpg',
  './assets/img/admin-background.jpg',
  './assets/img/gym-section-1.jpg',
  './assets/img/gym-section-2.jpg',
  './assets/img/fitness-loader.gif',
];

const NETWORK_ONLY_HOSTS = [
  'supabase.co',
  'supabase.com',
  'cdn.jsdelivr.net',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];

function isNetworkOnlyRequest(url) {
  return NETWORK_ONLY_HOSTS.some(
    (host) =>
      url.hostname === host ||
      url.hostname.endsWith(`.${host}`),
  );
}

function isDocumentRequest(request) {
  return (
    request.mode === 'navigate' ||
    request.destination === 'document'
  );
}

function isCodeRequest(request, url) {
  return (
    request.destination === 'script' ||
    request.destination === 'style' ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.json')
  );
}

function isImageRequest(request) {
  return request.destination === 'image';
}

// ============================================================
// INSTALL
// ============================================================

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);

      // Bir fayl tapılmasa bütün Service Worker install prosesi dayanmasın.
      await Promise.allSettled(
        APP_SHELL.map(async (asset) => {
          try {
            await cache.add(
              new Request(asset, {
                cache: 'reload',
              }),
            );
          } catch (error) {
            console.warn(
              '[SKy Fit SW] Cache edilə bilmədi:',
              asset,
              error,
            );
          }
        }),
      );

      await self.skipWaiting();
    })(),
  );
});

// ============================================================
// ACTIVATE
// ============================================================

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();

      await Promise.all(
        keys
          .filter(
            (key) =>
              key.startsWith('skyfit-') &&
              key !== STATIC_CACHE &&
              key !== RUNTIME_CACHE,
          )
          .map((key) => caches.delete(key)),
      );

      await self.clients.claim();
    })(),
  );
});

// ============================================================
// NETWORK-FIRST
// HTML, JS, CSS və config həmişə əvvəl internetdən alınır.
// ============================================================

async function networkFirst(request) {
  const runtimeCache =
    await caches.open(RUNTIME_CACHE);

  try {
    const response = await fetch(request, {
      cache: 'no-store',
    });

    if (
      response &&
      response.ok &&
      response.type !== 'opaque'
    ) {
      await runtimeCache.put(
        request,
        response.clone(),
      );
    }

    return response;
  } catch (error) {
    const cached =
      await runtimeCache.match(request) ||
      await caches.match(request);

    if (cached) {
      return cached;
    }

    if (isDocumentRequest(request)) {
      return (
        (await caches.match('./index.html')) ||
        Response.error()
      );
    }

    throw error;
  }
}

// ============================================================
// STALE-WHILE-REVALIDATE
// Şəkillər sürətli açılır, arxa planda yenilənir.
// ============================================================

async function staleWhileRevalidate(request) {
  const runtimeCache =
    await caches.open(RUNTIME_CACHE);

  const cached =
    await runtimeCache.match(request) ||
    await caches.match(request);

  const networkPromise = fetch(request)
    .then(async (response) => {
      if (
        response &&
        response.ok &&
        (
          response.type === 'basic' ||
          response.type === 'cors'
        )
      ) {
        await runtimeCache.put(
          request,
          response.clone(),
        );
      }

      return response;
    })
    .catch(() => null);

  return cached || networkPromise || Response.error();
}

// ============================================================
// FETCH
// ============================================================

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // Supabase/Auth/API və xarici CDN sorğularına müdaxilə etmirik.
  if (isNetworkOnlyRequest(url)) {
    return;
  }

  // Başqa domenlər yalnız normal şəbəkə ilə açılsın.
  if (url.origin !== self.location.origin) {
    return;
  }

  if (
    isDocumentRequest(request) ||
    isCodeRequest(request, url)
  ) {
    event.respondWith(
      networkFirst(request),
    );

    return;
  }

  if (isImageRequest(request)) {
    event.respondWith(
      staleWhileRevalidate(request),
    );

    return;
  }

  event.respondWith(
    networkFirst(request),
  );
});

// ============================================================
// MESAJ
// ============================================================

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data?.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys.map((key) =>
              caches.delete(key),
            ),
          ),
        ),
    );
  }
});

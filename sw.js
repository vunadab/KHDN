// ═══════════════════════════════════════════
// SERVICE WORKER — KPI KHDN · Nam A Bank
// Cache name: kpi-khdn-v2
// ═══════════════════════════════════════════
const CACHE_NAME = 'kpi-khdn-v2';

// Core files to precache
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

// ── INSTALL: precache app shell ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE.map(u => new Request(u, {cache:'reload'}))))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW] Precache partial fail:', err))
  );
});

// ── ACTIVATE: delete old caches ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── FETCH: network-first for Firebase, cache-first for assets ──
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Skip non-GET and Firebase/auth requests entirely
  if (event.request.method !== 'GET') return;
  if (url.includes('firebasedatabase.app') ||
      url.includes('firebaseapp.com') ||
      url.includes('googleapis.com/identitytoolkit') ||
      url.includes('securetoken.google.com') ||
      url.includes('chrome-extension')) return;

  // Google Fonts — cache first
  if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(res => {
          if (res.ok) caches.open(CACHE_NAME).then(c => c.put(event.request, res.clone()));
          return res;
        }).catch(() => cached);
      })
    );
    return;
  }

  // App files — network first, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then(res => {
        if (res.ok && url.startsWith(self.location.origin)) {
          caches.open(CACHE_NAME).then(c => c.put(event.request, res.clone()));
        }
        return res;
      })
      .catch(() =>
        caches.match(event.request)
          .then(cached => cached || caches.match('./index.html'))
      )
  );
});
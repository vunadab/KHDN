// ═══════════════════════════════════════════
// SERVICE WORKER — KPI KHDN · Nam A Bank
// Version: 1.0.0
// Cache: kpi-khdn-v1
// ═══════════════════════════════════════════
const CACHE = 'kpi-khdn-v1';
const ASSETS = [
  './',
  './index.html',
  'https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=DM+Mono:wght@400;500;700&display=swap',
];

// Install: cache core assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Activate: clear old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: network first, fallback to cache
self.addEventListener('fetch', e => {
  // Skip Firebase / non-GET requests
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('firebasedatabase') ||
      e.request.url.includes('firebaseauth') ||
      e.request.url.includes('googleapis.com/identitytoolkit')) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Cache successful responses for static assets
        if (res.ok && (e.request.url.includes(self.location.origin) || e.request.url.includes('fonts.googleapis'))) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then(cached => cached || caches.match('./')))
  );
});
// ── Service Worker KHDN v1 ──
// Cache name riêng — tách biệt hoàn toàn với KHCN
var CACHE_NAME = 'kpi-khdn-v1';
var ASSETS = [
  './index.html',
  './manifest-khdn.json',
  './icon-192-khdn.png',
  './icon-512-khdn.png'
];

// Install — cache assets
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS.filter(function(url) {
        return !url.includes('icon'); // icon có thể không có → bỏ qua lỗi
      }));
    }).catch(function() {})
  );
  self.skipWaiting();
});

// Activate — xóa cache cũ của KHDN (không đụng cache KHCN)
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) {
          // Chỉ xóa cache KHDN cũ — KHÔNG xóa cache KHCN
          return key.startsWith('kpi-khdn-') && key !== CACHE_NAME;
        }).map(function(key) {
          return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch — network first cho index.html, cache first cho assets
self.addEventListener('fetch', function(e) {
  var url = e.request.url;

  // index.html: luôn lấy từ network để có code mới nhất
  if (url.endsWith('index.html') || url.endsWith('/') || url.includes('/KHDN/')) {
    e.respondWith(
      fetch(e.request).then(function(res) {
        var clone = res.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, clone);
        });
        return res;
      }).catch(function() {
        return caches.match(e.request);
      })
    );
    return;
  }

  // Assets khác: cache first
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).then(function(res) {
        var clone = res.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, clone);
        });
        return res;
      });
    }).catch(function() {
      return caches.match('./index.html');
    })
  );
});
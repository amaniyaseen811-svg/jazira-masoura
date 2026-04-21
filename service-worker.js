// الجزيرة المسحورة - Service Worker
// يسمح باللعب بدون إنترنت بعد أول فتحة

const CACHE_NAME = 'jazira-v1';

const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// عند تثبيت التطبيق أول مرة
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('تخزين ملفات اللعبة للعمل بدون إنترنت');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// عند تفعيل نسخة جديدة، حذف الكاش القديم
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// عند طلب أي ملف: جرّب الكاش أولاً، ثم الإنترنت
self.addEventListener('fetch', event => {
  // نتجاهل طلبات غير GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then(networkResponse => {
            // تخزين النسخة الجديدة في الكاش
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // إذا لا إنترنت ولا كاش، نرجع الصفحة الرئيسية
            return caches.match('./index.html');
          });
      })
  );
});

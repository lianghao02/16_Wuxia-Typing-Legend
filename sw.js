const CACHE_PREFIX = 'wuxia-typing-';
const CACHE_NAME = `${CACHE_PREFIX}v2`;
const PRECACHE_ASSETS = [
    './',
    './index.html',
    './adventure.html',
    './classic.html',
    './css/adventure.css',
    './manifest.webmanifest',
    './icon-192.png',
    './icon-512.png',
    './src/adventure.js',
    './src/main.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_ASSETS);
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // 跨域請求直接略過
    if (url.origin !== self.location.origin) {
        return;
    }

    // 導航請求（HTML）：Network-First，斷網時回退到快取
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response && response.status === 200) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                    }
                    return response;
                })
                .catch(() => caches.match(event.request).then((res) => res || caches.match('./index.html')))
        );
        return;
    }

    // 遊戲資源與靜態檔案：Cache-First with Network fallback & cache update
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                // 背景靜默更新快取
                fetch(event.request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
                    }
                }).catch(() => {});
                return cachedResponse;
            }

            return fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const copy = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                }
                return networkResponse;
            });
        })
    );
});

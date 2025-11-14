/**
 * Service Worker
 * 機能: オフラインキャッシング、PWA対応
 * 作成理由: アプリケーションをオフラインでも動作可能にするため
 */

const CACHE_NAME = 'qr-dakoku-v1';
const urlsToCache = [
    './',
    './index.html',
    './settings.html',
    './css/style.css',
    './js/config.js',
    './js/token.js',
    './js/app.js',
    './js/settings.js',
    './js/sw-register.js',
    './manifest.json'
];

// インストール時: キャッシュを作成
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('キャッシュをオープン');
                return cache.addAll(urlsToCache);
            })
    );
});

// アクティベーション時: 古いキャッシュを削除
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('古いキャッシュを削除:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// フェッチ時: キャッシュファーストで応答
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // キャッシュがあればそれを返す
                if (response) {
                    return response;
                }
                
                // キャッシュがなければネットワークから取得
                return fetch(event.request).then(response => {
                    // 有効なレスポンスでない場合はそのまま返す
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    // レスポンスをクローンしてキャッシュに保存
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                    
                    return response;
                });
            })
            .catch(() => {
                // オフライン時のフォールバック（必要に応じて実装）
                console.log('オフライン、かつキャッシュなし');
            })
    );
});

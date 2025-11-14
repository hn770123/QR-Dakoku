/**
 * Service Worker登録
 * 機能: PWA対応のためのService Workerを登録
 * 作成理由: オフライン動作を可能にするため
 */

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('Service Worker登録成功:', registration.scope);
            })
            .catch(error => {
                console.log('Service Worker登録失敗:', error);
            });
    });
}

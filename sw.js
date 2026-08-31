self.addEventListener('install', (e) => {
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          console.log('Lösche alten Cache:', key);
          return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (e) => {
  // Netzwerk-First-Strategie (kein lokaler Cache für JS/HTML-Bundles)
  e.respondWith(fetch(e.request));
});
const cacheName = `nasna-shell-v10`;
const shellFiles = [
  `./`,
  `./index.html`,
  `./styles.css`,
  `./app.js?v=20260725.6`,
  `./firebase-config.js?v=20260725.6`,
  `./firestore-config.js?v=20260725.6`,
  `./dashboard.html`,
  `./dashboard.css?v=20260725.6`,
  `./dashboard.js?v=20260725.6`,
  `./organization.html`,
  `./organization.css?v=20260725.6`,
  `./organization.js?v=20260725.6`,
  `./manifest.webmanifest`,
  `./assets/brand/nasna-mark.svg`,
  `./assets/brand/nasna-logo.svg`,
  `./assets/brand/nasna-logo-ar.svg`,
  `./assets/fonts/Katibeh-NASNA.ttf`,
  `./assets/icons/icon-192.png`,
  `./assets/icons/icon-512.png`,
  `./assets/icons/icon-maskable-512.png`
];

self.addEventListener(`install`, event => {
  event.waitUntil(
    caches.open(cacheName)
      .then(cache => cache.addAll(shellFiles))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener(`activate`, event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith(`nasna-shell-`) && key !== cacheName)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener(`fetch`, event => {
  if (event.request.method !== `GET`) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const responseCopy = response.clone();
        caches.open(cacheName).then(cache => cache.put(event.request, responseCopy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

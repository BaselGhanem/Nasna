const cacheName = `nasna-shell-v16`;
const shellFiles = [
  `./`,
  `./index.html`,
  `./styles.css`,
  `./app.js?v=20260726.3`,
  `./firebase-config.js?v=20260726.3`,
  `./firestore-config.js?v=20260726.3`,
  `./dashboard.html`,
  `./dashboard.css?v=20260726.3`,
  `./dashboard.js?v=20260726.3`,
  `./organization.html`,
  `./organization.css?v=20260726.3`,
  `./organization.js?v=20260726.3`,
  `./structure.html`,
  `./structure.css?v=20260726.3`,
  `./structure.js?v=20260726.3`,
  `./architecture.html`,
  `./architecture.css?v=20260726.3`,
  `./architecture.js?v=20260726.3`,
  `./people.html`,
  `./employee.html`,
  `./team.html`,
  `./people.css?v=20260726.3`,
  `./people.js?v=20260726.3`,
  `./documents.html`,
  `./lifecycle.html`,
  `./records.css?v=20260726.3`,
  `./records.js?v=20260726.3`,
  `./requests.html`,
  `./approvals.html`,
  `./hr-operations.html`,
  `./workflow.css?v=20260726.3`,
  `./workflow-core.js?v=20260726.3`,
  `./workflow.js?v=20260726.3`,
  `./assets/templates/NASNA_Employee_Import_Template.xlsx`,
  `./assets/vendor/sheetjs/xlsx.full.min.js?v=0.18.5`,
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

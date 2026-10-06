// Minimal service worker for the TCE Admin app.
// It exists so browsers treat the admin panel as an installable app. It deliberately does NOT
// cache anything and never answers a request itself: every request goes straight to the network
// exactly as it would without a service worker, so the admin always sees live data and can never
// get stuck on an old cached version after an update.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Clear any caches an earlier version might have made, then take over open tabs.
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', () => { /* network only: intentionally no respondWith() */ });

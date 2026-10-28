
const CACHE_NAME = "flashcards-cache-v1";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./step-1-offlinedownload.jpg",
  "./step-2-offlinedownload.jpg"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(FILES_TO_CACHE)
    )
  );

  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();

      await Promise.all(
        cacheNames
          .filter(name =>
            name.startsWith("flashcards-cache-") &&
            name !== CACHE_NAME
          )
          .map(name => caches.delete(name))
      );

      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Only handle requests belonging to this app.
  if (url.origin !== self.location.origin) return;

  if (!url.pathname.startsWith(
    new URL("./", self.registration.scope).pathname
  )) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        if (response.ok && response.type === "basic") {
          const copy = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, copy);
          });
        }

        return response;
      });
    })
  );
});

// Caches the app shell, icon script, Supabase client and fonts so the app opens offline.
// Songs themselves are stored by the app in IndexedDB when you tap download.
const C = 'sono-v2';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(['./', './index.html'])));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== C).map(x => caches.delete(x)))).then(() => clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  const ok = u.origin === location.origin || /(^|\.)(unpkg\.com|jsdelivr\.net|googleapis\.com|gstatic\.com)$/.test(u.hostname)
    || u.pathname.includes('/storage/v1/object/public/music/covers/'); // cover art stays visible offline
  if (r.method !== 'GET' || !ok) return; // Supabase, LrcLib and audio go straight to the network
  e.respondWith(caches.match(r).then(hit => {
    const net = fetch(r).then(res => {
      if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(C).then(c => c.put(r, copy)); }
      return res;
    }).catch(() => hit || (r.mode === 'navigate' ? caches.match('./index.html') : Response.error()));
    return hit || net;
  }));
});

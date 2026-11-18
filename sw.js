/* Service worker: offline app shell + cached Data Dragon assets */
var APP = 'lct-app-v1', DDC = 'lct-dd-v1';
var SHELL = ['./', 'index.html', 'styles.css', 'engine.js', 'scout.js', 'trainer.js', 'app.js', 'data-champions.js', 'data-meta.js', 'manifest.webmanifest', 'icon.svg'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(APP).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== APP && k !== DDC; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (u.hostname === 'ddragon.leagueoflegends.com') {
    // versioned /cdn/ URLs are immutable -> cache first; versions.json -> network first
    if (u.pathname.indexOf('/cdn/') === 0) {
      e.respondWith(caches.open(DDC).then(function (c) {
        return c.match(e.request).then(function (hit) {
          return hit || fetch(e.request).then(function (r) { if (r.ok) c.put(e.request, r.clone()); return r; });
        });
      }));
    }
    return;
  }
  if (u.origin === location.origin) {
    e.respondWith(fetch(e.request).then(function (r) {
      var copy = r.clone(); caches.open(APP).then(function (c) { c.put(e.request, copy); }); return r;
    }).catch(function () { return caches.match(e.request).then(function (h) { return h || caches.match('index.html'); }); }));
  }
});

/*
 * 三省轩主文集 · Service Worker（sw.js）
 */
var CACHE = 'sxxzwj-v1';
var RACE_TIMEOUT = 3000;

var CORE = [
    './',
    './index.html',
    './index1.html',
    './search.html',
    './jianjie.html',
    './build.html',
    './style.css',
    './cover.css',
    './render.js',
    './build-core.js',
    './articles.js',
    './images/ckn.jpg'
];

self.addEventListener('install', function (e) {
    e.waitUntil(
        caches.open(CACHE).then(function (cache) {
            return cache.addAll(CORE.map(function (u) { return u + '?v=1'; }));
        })
    );
});

self.addEventListener('activate', function (e) {
    e.waitUntil(
        caches.keys().then(function (keys) {
            return Promise.all(keys.map(function (k) {
                if (k.indexOf('sxxzwj-') === 0 && k !== CACHE) {
                    return caches.delete(k);
                }
            }));
        }).then(function () { return self.clients.claim(); })
    );
});

self.addEventListener('fetch', function (e) {
    var req = e.request;
    if (req.method !== 'GET') return;

    var url = new URL(req.url);
    if (url.origin !== self.location.origin) return;

    var accept = req.headers.get('accept') || '';
    var isHTML = req.mode === 'navigate' || accept.indexOf('text/html') !== -1;
    var isArticleData = url.pathname.indexOf('/articles.js') !== -1;

    if (isHTML || isArticleData) {
        e.respondWith(
            Promise.race([
                fetch(req).then(function (resp) {
                    var copy = resp.clone();
                    caches.open(CACHE).then(function (c) { c.put(req, copy); });
                    return resp;
                }),
                new Promise(function (resolve) {
                    setTimeout(function () {
                        caches.match(req).then(function (cached) {
                            if (cached) resolve(cached);
                            else resolve(new Response('离线且无缓存', { status: 503 }));
                        });
                    }, RACE_TIMEOUT);
                })
            ]).catch(function () {
                return caches.match(req);
            })
        );
        return;
    }

    e.respondWith(
        caches.match(req).then(function (cached) {
            var fetchPromise = fetch(req).then(function (resp) {
                if (resp && resp.ok) {
                    var copy = resp.clone();
                    caches.open(CACHE).then(function (c) { c.put(req, copy); });
                }
                return resp;
            }).catch(function () { return cached; });

            return cached || fetchPromise;
        })
    );
});

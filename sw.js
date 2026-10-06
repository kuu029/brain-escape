// オフライン用 Service Worker。ASSETS は tools/update-sw.mjs で自動生成する（手で書かない）
const VERSION = '44c04f6146';
const CACHE = `brain-escape-${VERSION}`;
const ASSETS = [
  './',
  './css/app.css',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './index.html',
  './js/core/check.js',
  './js/core/fmt.js',
  './js/core/frac.js',
  './js/core/mathml.js',
  './js/core/poly.js',
  './js/core/rng.js',
  './js/core/router.js',
  './js/core/sound.js',
  './js/core/store.js',
  './js/core/timer.js',
  './js/core/ui.js',
  './js/game/art-manifest.js',
  './js/game/art.js',
  './js/game/content.js',
  './js/game/engine.js',
  './js/game/missions.js',
  './js/game/progress.js',
  './js/game/waves.js',
  './js/main.js',
  './js/screens/battle.js',
  './js/screens/collection.js',
  './js/screens/diagnosis.js',
  './js/screens/home.js',
  './js/screens/map.js',
  './js/screens/onboarding.js',
  './js/screens/records.js',
  './js/screens/result.js',
  './js/screens/settings.js',
  './js/screens/training.js',
  './js/ui/answer.js',
  './js/ui/board.js',
  './js/units/kit.js',
  './js/units/registry.js',
  './js/units/stage1/expressions.js',
  './js/units/stage1/fractions-decimals.js',
  './js/units/stage1/linear-equations.js',
  './js/units/stage1/signed-numbers.js',
  './js/units/stage2/expand-factor.js',
  './js/units/stage2/polynomials.js',
  './js/units/stage2/quadratic.js',
  './js/units/stage2/simultaneous.js',
  './js/units/stage2/square-roots.js',
  './js/units/stage3/placeholders.js',
  './manifest.webmanifest',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('brain-escape-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// キャッシュ優先。なければネットから取って保存（同じサイトのファイルだけ）
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match('./index.html'))),
  );
});

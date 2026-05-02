// Benefits of Pixels — 단순 캐시 우선 서비스워커.
// 정적 자산을 첫 방문 후 캐싱해서 오프라인에서도 동작.
const CACHE = 'bop-v1';
const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/posters/intre.png',
  '/posters/work01-photo.png',
  '/posters/work02-photo.png',
  '/posters/work03-photo.png',
  '/posters/work04-photo.png',
  '/posters/work05-photo.png',
  '/posters/work06-photo.png',
  '/posters/selected/Work2_01.png',
  '/posters/selected/Work2_02.png',
  '/posters/selected/Work2_03.png',
  '/posters/selected/Work2_04.png',
  '/posters/selected/Work2_05.png',
  '/posters/selected/Work2_06.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    caches.match(req).then(hit => {
      if (hit) return hit;
      return fetch(req).then(resp => {
        // 같은 출처 자원만 캐시에 추가
        const url = new URL(req.url);
        if (url.origin === location.origin && resp.ok) {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(req, clone));
        }
        return resp;
      }).catch(() => caches.match('/'));
    })
  );
});

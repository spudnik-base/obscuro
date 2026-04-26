const VERSION = 'obscuro-v1';
const SHELL = [
  './',
  'obscuro.html',
  'styles.css',
  'app.js',
  'manifest.webmanifest',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable.png',
  'apple-touch-icon.png',
  'docs/questions_bank.json',
  'docs/syllabus.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Network-first for the practice paper docx so updates propagate; cache as fallback
  if (url.pathname.endsWith('.docx')) {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // Cache-first for everything else
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(req, copy));
        return res;
      }).catch(() => cached);
    })
  );
});

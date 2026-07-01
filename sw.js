// Spoty service worker — cache leggera del guscio dell'app.
// NON intercetta i file audio (songs/*): così i "range request" per il seek
// vanno diretti in rete e la riproduzione resta fluida.
const CACHE = 'spoty-shell-v3';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;      // font/CDN: rete
  if (url.pathname.includes('/songs/')) return;     // audio: rete diretta (range)

  // songs.json: sempre fresco, con fallback offline
  if (url.pathname.endsWith('songs.json')) {
    e.respondWith(
      fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return r; })
                .catch(() => caches.match(req))
    );
    return;
  }

  // guscio + copertine: cache-first
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(r => {
      if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
      return r;
    }))
  );
});

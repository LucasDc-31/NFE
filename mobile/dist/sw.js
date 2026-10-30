// Service worker simples: deixa o app abrir mesmo com internet ruim.
// A API (/notas, /login) NUNCA passa pelo cache, para não mostrar dados fiscais desatualizados.
const VERSAO = 'nfe-v2';
const NUNCA_CACHEAR = ['/notas', '/produtos', '/login', '/health'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSAO).then((c) => c.add('/')).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((chaves) => Promise.all(chaves.filter((k) => k !== VERSAO).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  if (NUNCA_CACHEAR.some((p) => url.pathname.startsWith(p))) return;

  // Rede primeiro; se falhar, usa o que estiver em cache
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copia = res.clone();
          caches.open(VERSAO).then((c) => c.put(req.mode === 'navigate' ? '/' : req, copia));
        }
        return res;
      })
      .catch(() => caches.match(req.mode === 'navigate' ? '/' : req)),
  );
});

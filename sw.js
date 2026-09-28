// 오프라인에서도 켜지게 게임 파일을 기기에 보관해요
const C = 'sbm-v65';
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'])).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  // 온라인 서버(Supabase) 요청과 음악 파일(music 폴더 · 부분 요청)은 건드리지 않음
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.includes('/music/')) return;
  e.respondWith(fetch(e.request).then(r => { if (r.ok && r.status === 200) { const cp = r.clone(); caches.open(C).then(c => c.put(e.request, cp)); } return r; }).catch(() => caches.match(e.request).then(m => m || caches.match('./index.html'))));
});

// 오프라인에서도 켜지게 게임 파일을 기기에 보관해요 · 인터넷이 되면 항상 서버의 최신 파일을 먼저 받아요
const C = 'sbm-v300';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  // 온라인 서버(Supabase) 요청과 음악 파일(music 폴더 · 부분 요청)은 건드리지 않음
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.includes('/music/')) return;
  const page = e.request.mode === 'navigate' || u.pathname.endsWith('/') || u.pathname.endsWith('.html');
  const req = page ? new Request(u.origin + u.pathname, { cache: 'no-store', credentials: 'same-origin' }) : e.request;   // 게임 화면은 기기 캐시(10분) 건너뛰고 항상 최신
  // 4.1.1: 데이터가 느리면(밖 · 폰) 최신 파일 받다가 앱이 시작 화면에서 멈춰 있던 것 → 3초 안에 못 받으면 기기에 있는 걸 먼저 띄우고 최신은 뒤에서 받아 둠
  const key = page ? u.origin + u.pathname : e.request;
  const net = fetch(req).then(r => { if (r.ok && r.status === 200) { const cp = r.clone(); caches.open(C).then(c => c.put(key, cp)); } return r; });
  e.respondWith(caches.match(key).then(m0 => { const m = m0 || (page ? caches.match('./index.html') : null);
    return Promise.resolve(m).then(cached => {
      if (!cached) return net.catch(() => caches.match('./index.html'));
      const t = new Promise(res => setTimeout(() => res(cached), page ? 3000 : 1500));
      return Promise.race([net.catch(() => cached), t]);
    }); }));
  e.waitUntil(net.then(() => {}, () => {}));
});

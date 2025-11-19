const CACHE_NAME = 'visi-t-v3'; // ⚠️ HARUS DIUBAH (v3) agar update!
const urlsToCache = [
  '/', 
  '/index.html',
  '/detail.html',
  '/manifest.json',
  '/logo-visi-t.png',
  '/Wilayah_Adat_Papua-removebg-preview (2).png',
  
  // 🔹 Data yang statis di App Shell
  '/data/towerData.json', 

  // 🔹 Gambar tower dan diagram (PASTIKAN PATH INI BENAR)
  '/images/tower-default.jpg',
  '/images/diagram-transmisi.svg', // ✅ Dipastikan ada
  '/images/Wilayah_Adat_Papua-removebg-preview (2).png',
];

// Instalasi SW & simpan file ke cache
self.addEventListener('install', event => {
  console.log('📦 Service Worker: Instalasi...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ Menyimpan ke cache:', urlsToCache);
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('❌ Gagal meng-cache file:', error);
      })
  );
});

// Aktivasi SW & hapus cache lama
self.addEventListener('activate', event => {
  console.log('♻️ Service Worker: Aktivasi...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
                  .map(name => caches.delete(name))
      );
    })
  );
  return self.clients.claim(); 
});

// Ambil file dari cache (Network-First untuk data, Cache-First untuk aset)
self.addEventListener('fetch', event => {
  const requestURL = new URL(event.request.url);
  const isDynamicData = requestURL.pathname.endsWith('/data/towerData.json');

  if (isDynamicData) {
    // 1. Strategi NETWORK FIRST untuk data dinamis
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          console.warn('⚠️ Offline: Menggunakan data dari cache untuk towerData.json');
          return caches.match(event.request);
        })
    );
    return;
  }

  // 2. Strategi CACHE FIRST untuk aset App Shell (termasuk SVG)
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) return response;
        
        return fetch(event.request).then(networkResponse => {
          if (!networkResponse || networkResponse.status !== 200) return networkResponse;
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
          return networkResponse;
        });
      })
  );
});
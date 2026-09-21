// Service Worker for 100% Offline TOM AI PWA
const CACHE_NAME = 'tom-ai-v3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './.nojekyll',
  './404.html',
  './assets/logo.svg',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/favicon.ico',
  './css/chatgpt-theme.css',
  './css/components.css',
  './css/markdown.css',
  './css/training.css',
  './css/canvas.css',
  './css/voice-mode.css',
  './js/storage.js',
  './js/markdown-renderer.js',
  './js/charts-engine.js',
  './js/audio-effects.js',
  './js/personas.js',
  './js/speech.js',
  './js/tom-neural-core.js',
  './js/ai-engine.js',
  './js/canvas-artifacts.js',
  './js/voice-mode.js',
  './js/training-studio.js',
  './js/app.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('Cache addAll warning:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => {
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('./index.html');
        }
      });
    })
  );
});

// Service Worker for TOM AI Offline Support
const CACHE_NAME = 'tom-ai-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './assets/logo.svg',
  './css/chatgpt-theme.css',
  './css/components.css',
  './css/markdown.css',
  './css/training.css',
  './js/app.js',
  './js/ai-engine.js',
  './js/tom-neural-core.js',
  './js/training-studio.js',
  './js/markdown-renderer.js',
  './js/storage.js',
  './js/speech.js'
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
  // If fetching an external API, do network first
  if (event.request.url.includes('pollinations.ai') || event.request.url.includes('api.openai.com') || event.request.url.includes('groq.com')) {
    return;
  }
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => {
        // Fallback for html
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('./index.html');
        }
      });
    })
  );
});

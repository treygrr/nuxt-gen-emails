// Empty service worker to prevent 404 errors
self.addEventListener('install', () => {
  self.skipWaiting()
})

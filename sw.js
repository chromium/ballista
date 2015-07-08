// Service Worker

// The files we want to cache
var urlsToCache = [
  '/',
  '/index.js'
];

// Set the callback for the install step
self.addEventListener('install', function(event) {
  // Perform install steps
  console.log('install');
});

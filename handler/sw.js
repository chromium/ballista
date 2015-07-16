// Service Worker
"use strict";

// The name of the cache in the client-side cache database.
var CACHE_NAME = 'my-site-cache-v1';

// The files we want to cache
var urlsToCache = [
  '/',
  '/index.js'
];

// Version number: 1
// (Increment this when the script changes, to force a reload.)
importScripts('webactions-polyfill.js');

// Reads a blob as text. Returns a promise, which supplies the text.
function readBlobAsText(blob) {
  return new Promise((resolve, reject) => {
    var reader = new FileReader();

    reader.addEventListener('load', () => resolve(reader.result));
    reader.addEventListener('abort', () => reject(new Error("aborted")));
    reader.addEventListener('error', () => reject(reader.error));

    reader.readAsText(blob);
  });
}

// Set the callback for the install step
self.addEventListener('install', event => {
  // Perform install steps
  console.log('install');

  event.waitUntil(caches.open(CACHE_NAME).then(cache => {
    console.log('Opened cache');
    return cache.addAll(urlsToCache);
  }));
});

self.addEventListener('activate', event => {
  console.log('activate');
});

self.addEventListener('fetch', event => {
  console.log('fetch: ' + event.request.url);
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          console.log('cache hit: ' + event.request.url);
          return response;
        }

        console.log('cache miss: ' + event.request.url);
        return fetch(event.request.url);
      }
    )
  );
});

// Loads a file into the text field in the app's UI.
function loadFileIntoTextField(file) {
  readBlobAsText(file).then(text => console.log('File text:', text));
}

self.addEventListener('action', event => {
  if (event.verb == 'edit') {
    if (event.data.file === undefined) {
      console.log('Did not contain file.');
      return;
    }

    loadFileIntoTextField(event.data.file);
  } else {
    console.log('Received unknown action:', event.verb);
  }
});

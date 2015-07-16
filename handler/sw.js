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

// Set the callback for the install step
self.addEventListener('install', event => {
  // Perform install steps
  console.log('install');

  /*
  event.waitUntil(caches.open(CACHE_NAME).then(cache => {
    console.log('Opened cache');
    return cache.addAll(urlsToCache);
  }));
  */
});

self.addEventListener('activate', event => {
  console.log('activate');
});

self.addEventListener('fetch', event => {
  console.log('fetch: ' + event.request.url);
  /*
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
  */
});

// The most recently received File object.
var mostRecentFile = null;

// Opens a new window and loads the file up. Returns the Client object
// associated with the window, in a promise.
function openFileInNewWindow(file) {
  return new Promise((resolve, reject) => {
    // TODO(mgiuca): Unfortunately, this is not allowed here because it is not
    // in direct response to a user gesture. I have temporarily hacked Chromium
    // to allow this (an unmodified browser will fail here).
    clients.openWindow('/').then(client => {
      mostRecentFile = file;
      resolve(client);
    }, err => reject(err));
  });
}

self.addEventListener('message', event => {
  var data = event.data;
  var type = data.type;

  if (type == 'startup') {
    // A client is starting up. Assume this is the most recently opened one and
    // send it the most recent file.
    // TODO(mgiuca): I'm really not happy with this approach but it seems we
    // have no choice, as the incoming message has no Client object (and
    // therefore, we are unable to figure out which File was originally intended
    // for it).
    if (mostRecentFile === null)
      throw new Error('No file has been received.');

    var message = {type: 'loadFile', file: mostRecentFile};
    event.ports[0].postMessage(message);
    mostRecentFile = null;
  } else {
    console.log('Got unknown message:', data);
  }
});

self.addEventListener('action', event => {
  if (event.verb == 'edit') {
    if (event.data.file === undefined) {
      console.log('Did not contain file.');
      return;
    }

    openFileInNewWindow(event.data.file);

    // Immediately send an update (temp).
    var contents = "Updated contents.";
    event.action.close({
      file: new File([contents], event.data.file.name,
                     {type: event.data.file.type})
    });
  } else {
    console.log('Received unknown action:', event.verb);
  }
});

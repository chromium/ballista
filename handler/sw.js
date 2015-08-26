// Copyright 2015 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
importScripts('polyfill/ballista-polyfill.js');

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

// Finds the most recently opened top-level client belonging to this service
// worker. Returns a promise. Rejects the promise if none found.
function findLastTopLevelClient() {
  return new Promise((resolve, reject) => {
    clients.matchAll().then(allClients => {
      for (var i = allClients.length - 1; i >= 0; i--) {
        if (allClients[i].frameType == 'top-level') {
          resolve(allClients[i]);
          return;
        }
      }
      reject(new Error('No available clients; please open a tab.'));
    });
  });
}

// Opens a new window and loads the file up. Returns the Client object
// associated with the window, in a promise.
function openFileInNewWindow(file, actionId) {
  return new Promise((resolve, reject) => {
    // TODO(mgiuca): We'd like to use clients.openWindow() to open a new client
    // here. Unfortunately, this is not allowed here because it is not in direct
    // response to a user gesture. Hopefully, the final API will allow it, but
    // for the polyfill, we just need to take control of an existing client.
    findLastTopLevelClient().then(client => {
      var message = {type: 'loadFile', file: file, actionId: actionId};
      client.postMessage(message);
      resolve(client);
    }, err => reject(err));
  });
}

self.addEventListener('message', event => {
  var data = event.data;
  var type = data.type;
  var actionId = data.actionId;

  if (type == 'update') {
    var file = data.file;
    navigator.actions.update(actionId, {file: file});
  } else {
    console.log('Got unknown message:', data);
  }
});

navigator.actions.addEventListener('handle', event => {
  if (event.options.verb == 'open') {
    if (event.data.file === undefined) {
      console.log('Did not contain file.');
      return;
    }

    // TODO(mgiuca): This can fail, but the current Ballista API provides no way
    // for a handler to designate failure when handling an 'action' event.
    openFileInNewWindow(event.data.file, event.action.id);
  } else {
    console.log('Received unknown action:', event.options.verb);
  }
});

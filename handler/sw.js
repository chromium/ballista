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
importScripts('polyfill/webactions-polyfill.js');

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

// Map from client ID to Client.
var clientIdToClientMap = new Map;

// Map from client ID to Action.
var clientIdToActionMap = new Map;

// Map from client ID to File. Entries are removed from this map once the file
// has been sent to the client.
var clientIdToFileMap = new Map;

var nextClientId = 0;

// Opens a new window and loads the file up. Returns the Client object
// associated with the window, in a promise.
function openFileInNewWindow(file, clientId) {
  return new Promise((resolve, reject) => {
    clientIdToFileMap.set(clientId, file);

    var url = '/#clientid=' + clientId;

    // TODO(mgiuca): Unfortunately, this is not allowed here because it is not
    // in direct response to a user gesture. I have temporarily hacked Chromium
    // to allow this (an unmodified browser will fail here).
    clients.openWindow(url).then(client => {
      clientIdToClientMap.set(clientId, client);
      // TODO(mgiuca): I'd like to simply post the File object to the client
      // here, but the postMessage can get lost if the client is not yet
      // initialized. File a bug about this.
      resolve(client);
    }, err => reject(err));
  });
}

self.addEventListener('message', event => {
  var data = event.data;
  var type = data.type;
  var clientId = data.clientId;

  if (type == 'startup') {
    // A client is starting up. Assume this is the most recently opened one and
    // send it the most recent file.
    if (!clientIdToFileMap.has(clientId) || !clientIdToClientMap.has(clientId))
      throw new Error('Unknown clientId: ' + clientId);

    var file = clientIdToFileMap.get(clientId);
    var client = clientIdToClientMap.get(clientId);
    var message = {type: 'loadFile', file: file};
    client.postMessage(message);
    clientIdToFileMap.delete(clientId);
  } else if (type == 'update') {
    if (!clientIdToActionMap.has(clientId))
      throw new Error('Unknown clientId: ' + clientId);
    var action = clientIdToActionMap.get(clientId);

    var file = data.file;
    action.update({file: file});
  } else {
    console.log('Got unknown message:', data);
  }
});

self.addEventListener('action', event => {
  if (event.verb == 'open') {
    if (event.data.file === undefined) {
      console.log('Did not contain file.');
      return;
    }

    // Associate a unique client ID with a client. This is a hack because the
    // messages we get back from the client do not include a 'source' (in Chrome
    // 45) and therefore there is no way to know which client it is without an
    // out-of-band ID.
    // TODO(mgiuca): File a bug about this.
    var clientId = nextClientId++;

    clientIdToActionMap.set(clientId, event.action);

    openFileInNewWindow(event.data.file, clientId);
  } else {
    console.log('Received unknown action:', event.verb);
  }
});

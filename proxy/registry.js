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

// This library provides access to the Handler registration database.

"use strict";

(function() {

// Promise-based wrappers around indexedDB.

// Takes an IDBRequest object (the result of calling some indexedDB function).
// Returns a promise that resolves with the request's result, or rejects with
// the request's DOMError.
function promisify(request) {
  return new Promise((resolve, reject) => {
    request.onerror = e => reject(request.error);
    request.onsuccess = e => resolve(request.result);
  });
}

// Opens an indexeddb database. |upgradefunction| is called with the IDBDatabase
// and old version as arguments, if an upgrade is needed (it should return a
// promise). Returns a promise that resolves with the IDBDatabase object.
function openDatabase(name, version, upgradefunction) {
  var request = window.indexedDB.open(name, version);
  return new Promise((resolve, reject) => {
    request.onerror = e => reject(request.error);
    request.onblocked = e => reject(
        new DOMError('The database cannot be upgraded because it is in use.'));
    request.onsuccess = e => resolve(request.result);
    request.onupgradeneeded = e => {
      upgradefunction(request.result, e.oldVersion)
          .then(unused => resolve(request.result), error => reject(error));
    }
  });
}

// Takes an IDBTransaction object and waits for the transaction to complete.
// Returns a promise that resolves (with no argument) when the transaction
// completes.
function transactionWait(transaction) {
  return new Promise((resolve, reject) => {
    transaction.onerror = e => reject(transaction.error);
    transaction.oncomplete = e => resolve();
  });
}

function storeAdd(objectStore, value, key) {
  return promisify(objectStore.add(value, key));
}

function storePut(objectStore, value, key) {
  return promisify(objectStore.put(value, key));
}

function storeDelete(objectStore, key) {
  return promisify(objectStore.delete(key));
}

function storeGet(objectStore, key) {
  return promisify(objectStore.get(key));
}

// Handler registration database code.

// Class representing a Handler entry in the database. |name| and |url| are
// strings (|url| is the primary key). |verbs| is a list of strings.
function Handler(name, url, verbs) {
  this.name = name;
  this.url = url;
  this.verbs = verbs;
}

// Convert an Object into a Handler with the same fields.
function handlerFromObject(object) {
  if (object == undefined)
    return object;

  var handler = new Handler();
  for (var k in object)
    handler[k] = object[k];
  return handler;
}

function onUpgradeNeeded(db, oldVersion) {
  // Migration code.
  if (oldVersion < 2)
    db.deleteObjectStore('handlers');

  // The 'handlers' store maps arbitrary ints onto Handler objects.
  var objectStore = db.createObjectStore('handlers', {keyPath: 'url'});
  return new Promise((resolve, reject) => resolve());
}

function openRegistryDatabase() {
  return openDatabase('TestRegistry', 2, onUpgradeNeeded);
}

// Adds a new handler to the database. Returns a promise that resolves once the
// transaction is complete.
function addHandler(db, handler) {
  var transaction = db.transaction(['handlers'], 'readwrite');
  var store = transaction.objectStore('handlers');
  return new Promise((resolve, reject) => {
    storeAdd(store, handler).then(undefined, error => reject(error));
    transactionWait(transaction)
        .then(unused => resolve(), error => reject(error));
  });
}

// Deletes a handler from the database. Returns a promise that resolves once the
// transaction is complete.
function deleteHandlerForUrl(db, url) {
  var transaction = db.transaction(['handlers'], 'readwrite');
  var store = transaction.objectStore('handlers');
  return new Promise((resolve, reject) => {
    storeDelete(store, url).then(undefined, error => reject(error));
    transactionWait(transaction)
        .then(unused => resolve(), error => reject(error));
  });
}

// Gets all handlers in the database. Returns a promise that resolves with an
// array of Handlers.
function getAllHandlers(db) {
  var transaction = db.transaction(['handlers']);
  var store = transaction.objectStore('handlers');
  var handlers = [];
  return new Promise((resolve, reject) => {
    store.openCursor().onsuccess = e => {
      var cursor = e.target.result;
      if (cursor) {
        handlers.push(handlerFromObject(cursor.value));
        cursor.continue();
      } else {
        resolve(handlers);
      }
    };
  });
}

// Gets a handler for a specific URL. Returns a promise that resolves with the
// Handler, or undefined if it is not found.
function getHandlerForUrl(db, url) {
  var transaction = db.transaction(['handlers']);
  var store = transaction.objectStore('handlers');
  return new Promise((resolve, reject) => {
    storeGet(store, url)
        .then(handler => resolve(handlerFromObject(handler)),
              error => reject(error));
  });
}

// Gets a handler for a specific URL. Returns a promise that resolves with the
// Handler, or undefined if it is not found.
function getHandlersForVerb(db, verb) {
  var transaction = db.transaction(['handlers']);
  var store = transaction.objectStore('handlers');
  var handlers = [];
  return new Promise((resolve, reject) => {
    // TODO(mgiuca): Index handlers by verb, to avoid a full database search.
    store.openCursor().onsuccess = e => {
      var cursor = e.target.result;
      if (cursor) {
        var verbs = cursor.value.verbs;
        if (verbs && verbs.indexOf(verb) >= 0)
          handlers.push(handlerFromObject(cursor.value));
        cursor.continue();
      } else {
        resolve(handlers);
      }
    };
  });
}

})();

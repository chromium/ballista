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
// as an argument, if an upgrade is needed (it should return a promise). Returns
// a promise that resolves with the IDBDatabase object.
function openDatabase(name, version, upgradefunction) {
  var request = window.indexedDB.open(name, version);
  return new Promise((resolve, reject) => {
    request.onerror = e => reject(request.error);
    request.onblocked = e => reject(
        new DOMError('The database cannot be upgraded because it is in use.'));
    request.onsuccess = e => resolve(request.result);
    request.onupgradeneeded = e => {
      upgradefunction(request.result)
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

function onUpgradeNeeded(db) {
  // The 'handlers' store maps arbitrary ints onto Handler objects.
  var objectStore = db.createObjectStore('handlers', {autoIncrement: true});
  return new Promise((resolve, reject) => resolve());
}

function openRegistryDatabase() {
  return openDatabase('TestRegistry', 1, onUpgradeNeeded);
}

// Adds a new handler to the database.
function addHandler(db, handler) {
  var transaction = db.transaction(['handlers'], 'readwrite');
  var store = transaction.objectStore('handlers');
  storeAdd(store, handler);
  return transactionWait(transaction);
}

function getAllHandlers(db) {
  var transaction = db.transaction(['handlers']);
  var store = transaction.objectStore('handlers');
  var handlers = [];
  return new Promise((resolve, reject) => {
    store.openCursor().onsuccess = e => {
      var cursor = e.target.result;
      if (cursor) {
        handlers.push(cursor.value);
        cursor.continue();
      } else {
        resolve(handlers);
      }
    };
  });
}

})();

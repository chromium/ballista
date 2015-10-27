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

// Foreground page
"use strict";

// To communicate back to the host (handler site).
var hostPort = null;

// Details about the handler being registered.
var handler = null;

function arraysEqual(x, y) {
  if (x.length != y.length)
    return false;

  for (var i = 0; i < x.length; i++) {
    if (x[i] != y[i])
      return false;
  }

  return true;
}

// Sorts an array, non-destructively.
function sorted(arr) {
  var copy = arr.slice();
  copy.sort();
  return copy;
}

// Determines if two handlers are "equal" (for the purpose of re-registering a
// handler).
function handlersEqual(x, y) {
  return x.name == y.name && arraysEqual(sorted(x.verbs), sorted(y.verbs));
}

// Takes an object with the fields of a handler, and converts it into a new
// Handler object. This sanitizes the object received from the host (which is
// untrusted). Throws an error if the object contains missing or invalid fields.
function processHandler(handler) {
  if (typeof handler != 'object')
    throw new Error('handler is not an object');

  if (typeof handler.name != 'string' || handler.name == '')
    throw new Error('handler.name is missing or invalid');

  if (typeof handler.url != 'string' || handler.url.indexOf('://') < 0)
    throw new Error('handler.url is missing or invalid');

  if (typeof handler.verbs != 'object' || handler.verbs.length == undefined ||
      handler.verbs.length == 0)
    throw new Error('handler.verbs is missing or invalid');

  var verbs = [];
  for (var i = 0; i < handler.verbs.length; i++) {
    var verb = handler.verbs[i];
    if (typeof verb != 'string' || verb == '')
      throw new Error('handler.verbs is missing or invalid');

    verbs.push(verb);
  }

  return new Handler(handler.name, handler.url, verbs);
}

// Determines whether a handler is already registered in the database. This does
// an exact match -- doesn't just check the URL. If any details have changed,
// returns false (because the handler needs to be re-registered). Returns a
// promise that is resolved with a Boolean.
function alreadyRegistered(handler) {
  return openRegistryDatabase().then(db => {
    return db.getHandlerForUrl(handler.url)
        .then(existing => {
          if (existing == undefined)
            return false;

          return handlersEqual(existing, handler);
        });
  });
}

// Creates a human-readable (English) string from a list of strings. Inserts
// commas between items, with "and" between the last two items.
function listToFriendlyString(items) {
  if (items.length >= 2) {
    var last = items[items.length - 1];
    var secondLast = items[items.length - 2];
    items = items.slice(0, items.length - 2);
    items.push(`${secondLast} and ${last}`);
  }
  return items.join(', ');
}

// Fills in the text fields.
function populateUI() {
  var siteName = document.getElementById('site_name');
  var siteUrl = document.getElementById('site_url');
  var verb = document.getElementById('verb');

  siteName.textContent = handler.name;
  siteUrl.textContent = handler.url;
  verb.textContent = listToFriendlyString(handler.verbs);

  document.getElementById('registrar').style.display = 'block';
}

// Registers this handler in the database.
function register() {
  openRegistryDatabase().then(db => {
    db.registerHandler(handler)
        .then(
            () => {
              db.close();
              closeDialog();
            },
            error => {
              db.close();
              closeDialog();
              throw error;
            });
  });
}

window.onmessage = function(e) {
  hostPort = e.data.port;
  var unsanitizedHandler = e.data.handler;
  try {
    handler = processHandler(unsanitizedHandler);
  } catch (error) {
    closeDialog();
    throw error;
  }

  alreadyRegistered(handler).then(isRegistered => {
    if (isRegistered) {
      console.debug(
          `Ballista proxy: Not registering handler for ${handler.url}; ` +
          'already registered.');
      closeDialog();
      return;
    }

    populateUI();
  });
};

function closeDialog() {
  if (hostPort == null)
    throw Error('Cannot close dialog; never received a port from host.');

  hostPort.postMessage({close: true});
}

function registerButtonClick() {
  register();
}

function cancelButtonClick() {
  closeDialog();
}

function onLoad() {
  document.getElementById('register')
      .addEventListener('click', registerButtonClick);
  document.getElementById('cancel')
      .addEventListener('click', cancelButtonClick);
}

window.addEventListener('load', onLoad, false);

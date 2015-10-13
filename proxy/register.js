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

// Creates a human-readable (English) string from a list of strings. Inserts
// commas between items, with "and" between the last two items.
function listToFriendlyString(items) {
  if (items.length >= 2) {
    var last = items[items.length - 1];
    var secondLast = items[items.length - 2];
    items = items.slice(0, items.length - 2);
    items.push(secondLast + ' and ' + last);
  }
  return items.join(', ');
}

// Fills in the text fields.
function populateUI() {
  var siteName = document.getElementById('site_name');
  var siteUrl = document.getElementById('site_url');
  var verb = document.getElementById('verb');

  siteName.innerText = handler.name;
  siteUrl.innerText = handler.url;
  verb.innerText = listToFriendlyString(handler.verbs);
}

// Registers this handler in the database.
function register() {
  console.log('TODO: Register this handler:', handler);
}

window.onmessage = function(e) {
  hostPort = e.data.port;
  handler = e.data.handler;
  populateUI();
};

function closeDialog() {
  if (hostPort == null)
    throw Error('Cannot close dialog; never received a port from host.');

  hostPort.postMessage({close: true});
}

function registerButtonClick() {
  register();
  closeDialog();
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

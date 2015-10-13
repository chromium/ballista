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

var hostPort = null;

// Fills in the text fields.
function populateUI() {
}

// Registers this handler in the database.
function register() {
  console.log('TODO: Register this handler.');
}

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

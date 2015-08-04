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

var filename = null;
var mimetype = null;

var clientId = null;

function onLoad() {

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      // Registration was successful
      console.log('ServiceWorker registration successful with scope: ',
                  registration.scope);
    }).catch(err => {
      // registration failed :(
      console.log('ServiceWorker registration failed: ', err);
    });
  }

  document.getElementById('save_button')
      .addEventListener('click', saveButtonClick);
}

function onMessage(event) {
  var data = event.data;
  var type = data.type;
  if (type == 'loadFile') {
    var file = data.file;
    updateUIFromFile(file);
    filename = file.name;
    mimetype = file.type;
    clientId = data.clientId;
  } else {
    console.log('Got unknown message:', data);
  }
}

// Updates |contents_textfield| with the contents of |file|, asynchronously.
function updateUIFromFile(file) {
  return new Promise((resolve, reject) => {
    var contents_textfield = document.getElementById('contents_textfield');
    var filename_textfield = document.getElementById('filename_textfield');
    readBlobAsText(file).then(text => {
      contents_textfield.value = text;
      filename_textfield.value = file.name;
      resolve();
    }, err => reject(err));
  });
}

function saveButtonClick() {
  var contents_textfield = document.getElementById('contents_textfield');
  var contents = contents_textfield.value;
  var file = new File([contents], filename, {type: mimetype});

  var message = {type: 'update', clientId: clientId, file: file};
  navigator.serviceWorker.controller.postMessage(message);
}

window.addEventListener('load', onLoad, false);
navigator.serviceWorker.addEventListener('message', onMessage);

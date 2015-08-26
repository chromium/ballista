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

// Sets whether the file is open in the external editor.
function setOpenState(isOpen) {
  var status_p = document.getElementById('status_p');
  var status_line;
  status_line =
      isOpen ? 'File is open in external editor.' : 'File is not being edited.';
  status_p.innerHTML = status_line;
}

// Updates |contents_textfield| with the contents of |file|, asynchronously.
function updateTextFromFile(file) {
  return new Promise((resolve, reject) => {
    var contents_textfield = document.getElementById('contents_textfield');
    readBlobAsText(file).then(text => {
      contents_textfield.value = text;
      resolve();
    }, err => reject(err));
  });
}

function editButtonClick() {
  var contents_textfield = document.getElementById('contents_textfield');
  var contents = contents_textfield.value;
  var filename = document.getElementById('filename_textfield').value;
  var file = new File([contents], filename, {type: "text/plain"});

  var channel = new MessageChannel();
  channel.port1.onmessage = event => {
    var data = event.data;
    var type = data.type;

    if (type == 'update') {
      if (data.openState !== undefined)
        setOpenState(data.openState);

      if (data.file !== undefined)
        updateTextFromFile(data.file);
    }
  }
  navigator.serviceWorker.controller.postMessage(
      {type: 'open', file: file, port: channel.port2}, [channel.port2]);
}

// For testing/debugging purposes: send an "update" event to an action with a
// dummy file contents.
function debugCloseAction(action) {
  var evt = new Event('update');
  evt.data = {};
  var contents = 'Updated file contents.';
  evt.data.file = new File([contents], '');
  evt.done = true;

  action.dispatchEvent(evt);
}

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

  document.getElementById('edit_button')
      .addEventListener('click', editButtonClick);
}

window.addEventListener('load', onLoad, false);

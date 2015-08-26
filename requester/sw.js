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

importScripts('common/common.js');
importScripts('polyfill/ballista-polyfill.js');

// Opens |file| for editing in an external editor.
function editFile(file, port) {
  navigator.actions.performAction("open", {file: file})
      .then(action => {
    console.log('Action started:', action);
    port.postMessage({type: 'update', openState: true});

    action.addEventListener('update', event => {
      // Can be called multiple times for a single action.
      // |event.data.file| is a new File with updated text.
      port.postMessage(
          {type: 'update', openState: !event.isClosed, file: event.data.file});

      if (event.isClosed)
        console.log('Action completed:', action);
      else
        console.log('Action updated:', action);
    });
  });
}

self.addEventListener('message', event => {
  var data = event.data;
  var type = data.type;

  if (type == 'open')
    editFile(data.file, data.port);
});

// Tell the polyfill which handler to use. This isn't part of the final API,
// just a temporary requirement of the polyfill.
navigator.actions.polyfillHandlerUrl = 'http://localhost:8080/test';

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

// TODO(mgiuca): Let the user register and choose from registered handlers,
// rather than hard-coding these URLs.
// List of [title, url] pairs.
var kHandlerList = [
  ['Ballista Handler Demo', 'http://localhost:8081/test'],
  ['Some Other App', 'https://example.com/foo'],
]

// Copied from polyfill/ballista-polyfill.js.
var kProxyUrlSuffix = '?actions-handler-proxy';

var handlers = [];
for (var i = 0; i < kHandlerList.length; i++) {
  var handlerItem = kHandlerList[i];
  handlers.push({title: handlerItem[0], url: handlerItem[1]});
}

// Establishes a connection with the handler (by embedding a page from the
// handler's domain in an iframe), and posts a MessagePort object to it.
// Asynchronous; no return value.
function sendPortToHandler(url, port) {
  var iframe = document.querySelector('#handler_iframe');
  iframe.onload = function(event) {
    iframe.contentWindow.postMessage({port: port}, '*', [port]);
  };

  iframe.setAttribute('src', url + kProxyUrlSuffix);
}

window.onmessage = function(e) {
  var port = e.data.port;

  // For now, just forward the port on to the hard-coded handler.
  // TODO(mgiuca): Let the user choose from registered handlers.
  var handler = handlers[0];
  sendPortToHandler(handler.url, port);
};

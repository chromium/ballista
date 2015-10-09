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

var handlers;

// A MessagePort back to the requester that initiated this action.
var requesterPort = null;

function createRadioButton(name, index, title, checked) {
  var label = document.createElement('label');
  var input = document.createElement('input');
  input.type = 'radio';
  input.setAttribute('class', 'mdl-radio__button');
  input.name = name;
  input.value = index;
  var id = name + '_' + index;
  input.id = id;
  if (checked)
    input.checked = true;

  var span = document.createElement('span');
  span.setAttribute('class', 'mdl-radio__label');
  span.appendChild(document.createTextNode(title));

  label.setAttribute('class', 'mdl-radio mdl-js-radio mdl-js-ripple-effect');
  label.setAttribute('for', id);
  label.appendChild(input);
  label.appendChild(span);

  componentHandler.upgradeElement(label);
  return label;
}

// Populates the global |handlers| variable, and also creates the radio buttons
// in the DOM tree for the handlers.
function populateHandlers() {
  handlers = [];
  for (var i = 0; i < kHandlerList.length; i++) {
    var handlerItem = kHandlerList[i];
    handlers.push({title: handlerItem[0], url: handlerItem[1]});
  }

  var choices = document.querySelector('#choices');
  while (choices.firstChild)
    choices.removeChild(choices.firstChild);
  for (var i = 0; i < handlers.length; i++) {
    var handler = handlers[i];
    var p = document.createElement('p');
    p.appendChild(createRadioButton('handler', i, handler.title, i == 0));
    choices.appendChild(p);
  }
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
  requesterPort = e.data.port;
  populateHandlers();
};

function selectedHandler() {
  var selectedNode = document.querySelector('input[name = "handler"]:checked');
  if (selectedNode == undefined)
    return null;

  return Number(selectedNode.value);
}

// Opens this action in the chosen handler. Automatically closes the dialog.
function openHandler(handlerId) {
  if (requesterPort == null)
    throw Error('Cannot open handler; never received a port from requester.');

  if (handlerId == null)
    throw Error('No handler selected.');

  var handler = handlers[handlerId];
  sendPortToHandler(handler.url, requesterPort);
}

function openButtonClick() {
  var handlerId = selectedHandler();
  openHandler(handlerId);
}

function cancelButtonClick() {
  if (requesterPort == null)
    throw Error('Cannot close dialog; never received a port from requester.');

  requesterPort.postMessage({connected: false});
}

function onLoad() {
  document.getElementById('open').addEventListener('click', openButtonClick);
  document.getElementById('cancel')
      .addEventListener('click', cancelButtonClick);
}

window.addEventListener('load', onLoad, false);

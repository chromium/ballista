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

// Ballista polyfill.
// Author: Matt Giuca <mgiuca@chromium.org>
//
// Implements a (partial) Ballista API for demonstration purposes. Note: This
// API, by design, does things that aren't possible in a polyfill, so this will
// be broken without specific browser hacks. All work-in-progress; don't get too
// excited about it.
"use strict";

(function() {

// Portions are copied (and heavily modified) from tha navigator-connect
// polyfill by mkruisselbrink and reillyeon:
// https://github.com/mkruisselbrink/navigator-connect

// The URL of the proxy app, which provides the handler chooser and routes
// actions through to the chosen handler.
// TODO(mgiuca): Move this to a fixed public location.
var kProxyUrl = 'http://localhost:8080/choose';

var kProxyUrlSuffix = '?actions-handler-proxy';

// DOM element for the <div> containing the chooser UI (hosted by the proxy
// site) in an iframe. Only non-null while choosing is taking place.
var chooserDiv = null;

// The handler's service worker provides a special proxy page that will be
// embedded in an iframe in the requester (by connectToHandler).
//
// This page proxies messages between the requester foreground page and the
// handler service worker.
function onFetch(event) {
  var targetUrl = event.request.url;
  // Detect whether kProxyUrlSuffix appears in the query string.
  var proxySuffixIndex = targetUrl.indexOf(kProxyUrlSuffix);
  if (proxySuffixIndex === -1 ||
      (proxySuffixIndex + kProxyUrlSuffix.length != targetUrl.length &&
       targetUrl[proxySuffixIndex + kProxyUrlSuffix.length] != '&')) {
    // Not a navigator-connect attempt
    return;
  }
  // In the real world this should not reply to all fetches.
  event.respondWith(fetch('polyfill/proxy-iframe.html'));
  event.stopImmediatePropagation();
}

function onMessage(event) {
  if (typeof event != 'object')
    return;

  var data = event.data;

  if (data === undefined)
    return;

  if (data.type == 'connect') {
    data.port.postMessage({connected: true});
    data.port.onmessage = e => {
      onMessageReceived(e.data, data.port);
    }
    event.stopImmediatePropagation();
    return;
  } else if (data.type == 'sendPortToProxy') {
    sendPortToProxy(data.port);
  } else if (data.type == 'closeChooser') {
    closeChooser();
  }
}

var findLastTopLevelClient = undefined;

// Listen for 'fetch' and 'message', if in a service worker.
if (self.WorkerNavigator !== undefined) {
  self.addEventListener('fetch', onFetch);
  self.addEventListener('message', onMessage);

  // Finds the most recently opened top-level client belonging to this service
  // worker. Returns a promise. Rejects the promise if none found.
  findLastTopLevelClient = () => {
    return clients.matchAll().then(allClients => {
      for (var i = allClients.length - 1; i >= 0; i--) {
        if (allClients[i].frameType == 'top-level') {
          return allClients[i];
        }
      }
      throw new Error('No available clients; please open a tab.');
    });
  }
} else {
  // Receive messages from the service worker.
  navigator.serviceWorker.addEventListener('message', onMessage);
}

// Establishes a connection with the polyfill handler (by embedding a page from
// the handler's domain in an iframe), and posts a MessagePort object to it.
// Asynchronous; no return value.
function sendPortToProxy(port) {
  if (self.document === undefined) {
    // We are in a service worker. No way to create an iframe here (needed to
    // establish a connection to handler service worker), so connect to a random
    // foreground page and establish a connection there (it does not need to be
    // the same foreground page that initiated the action, as long as it is
    // running this polyfill code). If there is no open requester foreground
    // page, this will fail. This *should not* happen in the real API, but there
    // is no way around this in the polyfill.
    findLastTopLevelClient().then(client => {
      client.postMessage({type: 'sendPortToProxy', port: port}, [port]);
    });
    return;
  }

  chooserDiv = document.createElement('div');
  chooserDiv.style.zIndex = 100;
  chooserDiv.style.position = 'absolute';
  chooserDiv.style.left = '200px';
  chooserDiv.style.top = '200px';
  chooserDiv.style.width = '640px';
  chooserDiv.style.height = '480px';

  var iframe = document.createElement('iframe');
  iframe.onload = function(event) {
    iframe.contentWindow.postMessage({port: port}, '*', [port]);
  };

  iframe.setAttribute('src', kProxyUrl);
  iframe.style.width = '100%';
  iframe.style.height = '100%';

  chooserDiv.appendChild(iframe);
  document.body.appendChild(chooserDiv);
}

// Destroy the chooser div.
function closeChooser() {
  if (self.document === undefined) {
    // We are in a service worker. Tell the foreground page to destroy the
    // chooser.
    findLastTopLevelClient().then(client => {
      client.postMessage({type: 'closeChooser'});
    });
    return;
  }

  document.body.removeChild(chooserDiv);
}

// Prompts the user for a handler app and establish a connection with the chosen
// handler. Returns (in a promise) a MessagePort on succesful connection to the
// handler.
function connectToHandler() {
  return new Promise(function(resolve, reject) {
    var channel = new MessageChannel();
    channel.port1.onmessage = e => {
      closeChooser();

      if (e.data.connected) {
        channel.port1.onmessage = null;
        resolve(channel.port1);
      } else if (e.data.connected == false) {
        // Fail silently. (This happens if the user cancels the dialog.)
      } else {
        reject(new Error("Received unexpected response from handler."));
      }
    };
    sendPortToProxy(channel.port2);
  });
};

// Polyfill Cache.addAll.
// Not necessary in Chrome 45 with --enable-experimental-web-platform-features.
if (Cache.prototype.addAll === undefined) {
  Cache.prototype.addAll = function(urls) {
    return Promise.all(urls.map(url => this.add(url)));
  }
}

// TODO(mgiuca): Rewrite prototype-based "classes" using actual ES6 classes.
// This is blocked on Firefox implementing the "super" keyword.
// See: https://bugzilla.mozilla.org/show_bug.cgi?id=1066239

// A base class that implements the EventTarget interface.
function CustomEventTarget() {
  // Map from event type to list of listeners.
  this._listeners = {};
}

CustomEventTarget.prototype.addEventListener = function(type, listener,
                                                        useCapture) {
  var listeners = this._listeners;
  var listeners_of_type = listeners[type];
  if (listeners_of_type === undefined) {
    listeners[type] = listeners_of_type = [];
  }

  for (var i = 0; i < listeners_of_type.length; i++) {
    if (listeners_of_type[i] === listener) return;
  }

  listeners_of_type.push(listener);
};

CustomEventTarget.prototype.removeEventListener = function(type, listener,
                                                           useCapture) {
  var listeners = this._listeners;
  var listeners_of_type = listeners[type];
  if (listeners_of_type === undefined) {
    listeners[type] = listeners_of_type = [];
  }

  for (var i = 0; i < listeners_of_type.length; i++) {
    if (listeners_of_type[i] === listener) {
      listeners_of_type.splice(i, 1);

      if (listeners_of_type.length == 0) delete listeners[type];

      return;
    }
  }
};

CustomEventTarget.prototype.dispatchEvent = function(evt) {
  var listeners = this._listeners;
  var listeners_of_type = listeners[evt.type];
  if (listeners_of_type === undefined) {
    listeners[evt.type] = listeners_of_type = [];
  }

  for (var i = 0; i < listeners_of_type.length; i++) {
    var listener = listeners_of_type[i];
    if (listener.handleEvent !== undefined) {
      listener.handleEvent(evt);
    } else {
      listener.call(evt.target, evt);
    }
  }
};

// An Action is an object representing a web action in flight.
// Each Action has an integer |id|, which is unique among all actions from the
// requester that created it (different requesters can have actions of the same
// ID). This id is exposed to the client.
function Action(id) {
  this.id = id;
}

// A map from action IDs to MessagePort objects. Handler only.
var actionMap = new Map;

// The next action ID to use.
var nextActionId = 0;

var newHandleEvent = null;
var newUpdateEvent = null;

// Polyfill navigator.actions.
if (navigator.actions === undefined) {
  var NavigatorActions = function() {
    CustomEventTarget.call(this);
  };
  NavigatorActions.prototype = Object.create(CustomEventTarget.prototype);
  var actions = new NavigatorActions();
  navigator.actions = actions;

  var event_or_extendable_event = Event;

  // HandleEvent is only available when the global scope is a
  // ServiceWorkerGlobalScope.
  if (self.ExtendableEvent !== undefined) {
    newHandleEvent = function(id, options, data) {
      var event = new ExtendableEvent('handle');
      event.id = id;
      event.options = options;
      event.data = data;
      event.reject = err => {
        // TODO(mgiuca): Cause the promise to be rejected.
        throw err;
      }
      return event;
    }

    event_or_extendable_event = ExtendableEvent;
  }

  // UpdateEvent is an ExtendableEvent when the global scope is a
  // ServiceWorkerGlobalScope; otherwise it is just an Event.
  newUpdateEvent = function(id, data, done) {
    var event = new event_or_extendable_event('update');
    event.id = id;
    event.data = data;
    event.done = done;
    return event;
  }

  // Performs an action with a given |options| and |data|. |options| is either
  // a verb (string) or a dictionary of various fields used to identify which
  // handlers can be used. |data| is an arbitrary object to be passed to the
  // handler.
  //
  // Returns a Promise<Action> with an action object allowing further
  // interaction with the handler. Fails with AbortError if a connection could
  // not be made.
  actions.performAction = function(options, data) {
    return connectToHandler().then(port => {
      var id = nextActionId++;
      if (typeof options == 'string')
        options = {verb: options};
      var action = new Action(id);

      // Send the options and data payload to the handler.
      var message = {type: 'action', options: options, data: data, id: id};
      port.postMessage(message);
      port.onmessage = m => onMessageReceived(m.data, null);

      return action;
    });
  };

  // Sends an updated version of the data payload associated with an action back
  // to the requester. This may be called multiple times per action, but should
  // send a complete copy of the data on each call (this is not a stream
  // protocol). |id| is the id of the action.
  actions.update = function(id, data, done) {
    if (!actionMap.has(id))
      throw new Error('No such action id: ' + id);

    var port = actionMap.get(id);
    var message = {type: 'update', data: data, id: id, done: done == true};
    port.postMessage(message);
  };
}

// Called when a message is received (on both the handler and requester).
// |port| is a MessagePort on the handler; null on the requester.
function onMessageReceived(data, port) {
  if (data.type == 'action') {
    if (newHandleEvent === null) {
      throw new Error(
          'navigator.actions requests must go to a service worker.');
    }

    actionMap.set(data.id, port);

    // Forward the event as a 'handle' event to the global object.
    var handleEvent = newHandleEvent(data.id, data.options, data.data);
    actions.dispatchEvent(handleEvent);
  } else if (data.type == 'update') {
    // Forward the event as an 'update' event to navigator.actions.
    var updateEvent = newUpdateEvent(data.id, data.data, data.done);
    actions.dispatchEvent(updateEvent);
  } else {
    console.log('Received unknown message:', data);
  }
}

// Registers a handler with the proxy server.
function registerHandler(name, url, verbs) {
  console.log('registerHandler:', name, url, verbs);
}

// Parses the webapp manifest, and if there are any action handlers, prompts the
// user to register with the proxy server.
function performHandlerRegistration() {
  var links = document.querySelectorAll('link[rel=manifest]');
  for (var i = 0; i < links.length; i++) {
    var manifestUrl = links[i].href;
    fetch(manifestUrl).then(response => {
      if (!response.ok)
        return;

      response.json().then(json => {
        if (json.actions == undefined || json.actions.length == 0)
          return;

        // We have a manifest with action handlers. Attempt to register this
        // handler with the proxy server.
        var name = json.name || document.title;
        var url = json.scope || document.location.href;
        var verbs = [];
        for (var verb in json.actions)
          verbs.push(verb);
        registerHandler(name, url, verbs);
      });
    });
  }
}

addEventListener('load', performHandlerRegistration, false);

})();

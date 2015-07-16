/**
 * Web Actions polyfill.
 * Author: Matt Giuca <mgiuca@chromium.org>
 *
 * Implements a (partial) Web Actions API for demonstration purposes. Note: This
 * API, by design, does things that aren't possible in a polyfill, so this will
 * be broken without specific browser hacks. All work-in-progress; don't get too
 * excited about it.
 *
 * Note: The requester needs to set navigator.webActions.polyfillHandlerUrl to a
 * valid handler URL before calling performAction. This is a temporary
 * requirement of the polyfill and won't be part of the final API.
 */
"use strict";

(function() {

// Polyfill Cache.addAll.
// Not necessary in Chrome 45 with --enable-experimental-web-platform-features.
if (Cache.prototype.addAll === undefined) {
  Cache.prototype.addAll = function(urls) {
    return Promise.all(urls.map(url => this.add(url)));
  }
}

// A base class that implements the EventTarget interface.
class CustomEventTarget {
  constructor() {
    // Map from event type to list of listeners.
    this._listeners = {};
  }

  addEventListener(type, listener, useCapture) {
    var listeners = this._listeners;
    var listeners_of_type = listeners[type];
    if (listeners_of_type === undefined) {
      listeners[type] = listeners_of_type = [];
    }

    for (var i = 0; i < listeners_of_type.length; i++) {
      if (listeners_of_type[i] === listener)
        return;
    }

    listeners_of_type.push(listener);
  }

  removeEventListener(type, listener, useCapture) {
    var listeners = this._listeners;
    var listeners_of_type = listeners[type];
    if (listeners_of_type === undefined) {
      listeners[type] = listeners_of_type = [];
    }

    for (var i = 0; i < listeners_of_type.length; i++) {
      if (listeners_of_type[i] === listener) {
        listeners_of_type.splice(i, 1);

        if (listeners_of_type.length == 0)
          delete listeners[type];

        return;
      }
    }
  }

  dispatchEvent(evt) {
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
  }
}

// Polyfill Navigator.webActions.
// The prototype of |navigator| is Navigator in normal pages, WorkerNavigator in
// Web Workers. Support either case.
var navigator_proto =
    (self.WorkerNavigator !== undefined ? WorkerNavigator : Navigator)
        .prototype;
if (navigator_proto.webActions === undefined) {
  var webActions = {};
  navigator_proto.webActions = webActions;

  // The URL of the handler to send requests to. The final API will have the
  // user agent let the user choose a handler from a registered list. For now,
  // we just let the client specify its URL by setting this variable.
  webActions.polyfillHandlerUrl = null;

  // An Action is an object representing a web action in flight.
  webActions.Action = class extends CustomEventTarget {
    constructor(verb, data, port) {
      super();
      this.verb = verb;
      this.data = data;
      this.port = port;
    }
  };

  // Performs an action with a given |verb| and |data|. Returns a
  // Promise<Action> with an action object allowing further interaction with the
  // handler. Fails with AbortError if a connection could not be made.
  webActions.performAction = function(verb, data) {
    // Get the URL of the handler to connect to. For now, this is just a fixed
    // URL set by the client.
    var handlerUrl = webActions.polyfillHandlerUrl;
    if (handlerUrl === null) {
      throw new Error(
          'You need to set navigator.webActions.polyfillHandlerUrl ' +
          '(temporary requirement of the polyfill only).');
    }

    return new Promise((resolve, reject) => {
      // Connect to the handler.
      navigator.services.connect(handlerUrl)
          .then(port => {
            var action = new webActions.Action(verb, data, port);

            // Send the verb and data payload to the handler.
            var message = {'type': 'request', 'verb': verb, 'data': data};
            port.postMessage(message);

            resolve(action);
          }, err => reject(err))
    });
  };
}

// XXX: The 'connect' event on navigator.services is the currently specified way
// for the host to receive a connection, but in Chrome 45 it receives
// 'crossoriginconnect' instead (see below).
navigator.services.addEventListener('connect', event => {
  console.log('navigator.services: Received connect event for ' +
              event.targetURL + ' from ' + event.origin);
  event.respondWith({accept: true, name: 'the_connecter'})
      .then(port => port.postMessage('You are connected!'));
});

// XXX: The 'message' event on navigator.services is the specified way to
// receive messages on both ends. In Chrome 45, only the client receives
// messages with this event. The host receives 'crossoriginmessage' instead (see
// below).
navigator.services.addEventListener('message', event => {
  console.log('navigator.services: Received message event:', event);
});

// XXX In Chrome 45, the host's global object receives 'crossoriginconnect' and
// 'crossoriginmessage' events, instead of the above. (This is from an older
// version of the spec.)
self.addEventListener('crossoriginconnect', event => {
  console.log('global: Received crossoriginconnection on self:', event);
  event.acceptConnection(true);
  var client = event.client;
  client.postMessage('You are connected!');
});

self.addEventListener('crossoriginmessage', event => {
  console.log('global: Received crossoriginmessage event:', event);
});

})();

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

(function() {

// Polyfill Cache.addAll.
// Not necessary in Chrome 45 with --enable-experimental-web-platform-features.
if (Cache.prototype.addAll === undefined) {
  Cache.prototype.addAll = function(urls) {
    return Promise.all(urls.map(function(url) {
      return this.add(url);
    }.bind(this)));
  }
}

// A base class that implements the EventTarget interface.
function CustomEventTarget() {
  // Map from event type to list of listeners.
  this._listeners = {};
}
CustomEventTarget.prototype = Object.create(EventTarget.prototype);

CustomEventTarget.prototype.addEventListener = function(type, listener,
                                                        useCapture) {
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

      if (listeners_of_type.length == 0)
        delete listeners[type];

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
  // Inherit from EventTarget.
  webActions.Action = function(verb, options) {
    CustomEventTarget.call(this);
    this.verb = verb;
    this.options = options;
  };
  webActions.Action.prototype = Object.create(CustomEventTarget.prototype);

  // Performs an action with a given |verb| and |options|.
  webActions.performAction = function(verb, options) {
    var handlerUrl = webActions.polyfillHandlerUrl;

    if (handlerUrl === null) {
      throw new Error(
          'You need to set navigator.webActions.polyfillHandlerUrl ' +
          '(temporary requirement of the polyfill only).');
    }

    return new Promise(function(resolve, reject) {
      console.log("webActions.performAction:", verb, options);

      navigator.services.connect(handlerUrl)
          .then(port => {
            console.log('Successful connection:', port);

            navigator.services.addEventListener(
                'message',
                event => {console.log('Received message:', event.data)});

            var action = new webActions.Action(verb, options);
            resolve(action);
          }, err => reject(err))
    });
  };
}

})();

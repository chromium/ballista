/**
 * Web Actions polyfill.
 * Author: Matt Giuca <mgiuca@chromium.org>
 *
 * Implements a (partial) Web Actions API for demonstration purposes. Note: This
 * API, by design, does things that aren't possible in a polyfill, so this will
 * be broken without specific browser hacks. All work-in-progress; don't get too
 * excited about it.
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

})();

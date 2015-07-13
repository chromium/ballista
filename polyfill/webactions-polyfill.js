/**
 * Web Actions polyfill.
 * Author: Matt Giuca <mgiuca@chromium.org>
 *
 * Implements a (partial) Web Actions API for demonstration purposes. Note: This
 * API, by design, does things that aren't possible in a polyfill, so this will
 * be broken without specific browser hacks. All work-in-progress; don't get too
 * excited about it.
 */

// Polyfill Cache.addAll.
if (Cache.prototype.addAll === undefined) {
  Cache.prototype.addAll = function(urls) {
    return Promise.all(urls.map(function(url) {
      return this.add(url);
    }.bind(this)));
  }
}

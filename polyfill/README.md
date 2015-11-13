# Ballista polyfill

**Author:** Matt Giuca <<mgiuca@chromium.org>>

This partial polyfill lets you try out Ballista right now, with some (serious)
limitations, in supported browsers. By design, the API does things that aren't
possible in a polyfill, so we can't support everything.

## Supported browsers

The polyfill requires a web browser with support for [Service
Workers](http://www.w3.org/TR/service-workers/) and [Arrow
functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions).
This includes newer versions of Google Chrome / Chromium and Mozilla Firefox.
(Tested on Chrome 46 and Firefox 42.)

## Limitations of the polyfill

* No registration of handlers (the web app manifest is not used). Instead, the
  requester must explicitly nominate the URL of the handler.
* If the requester API (`navigator.actions.performAction`) is used from a
  service worker, a foreground page on that domain must be open (but it does not
  need to remain open to receive updates).
* Not able to send actions to native applications.
* Not possible to use `clients.openWindow` from the `'action'` event handler
  (when the handler's service worker receives an action). The polyfill will
  automatically open the handler in a new tab for you.

## Usage instructions

1. Add `ballista-polyfill.js` to your requester or handler JavaScript context
   (as a `<script>` in HTML for foreground pages, and using `importScripts` from
   service workers).
2. Build your requester or handler using the API as described in the
   [explainer](../docs/explainer.md).

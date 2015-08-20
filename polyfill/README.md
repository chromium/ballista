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
* Cannot use requester API (`navigator.actions.performAction`) from a service
  worker (must be used from a foreground page).
* No handler picking UI. Each requester is tied to a single handler.
* Not possible to use `clients.openWindow` from the `'action'` event handler
  (when the handler's service worker receives an action). This means your apps
  need to handle the action in an existing tab, rather than opening a new tab.

## Usage instructions

1. Add `ballista-polyfill.js` to your requester or handler JavaScript context
   (as a `<script>` in HTML for foreground pages, and using `importScripts` from
   service workers).
2. In the requester, set `navigator.actions.polyfillHandlerUrl` to a valid
   handler URL before calling performAction. This is a temporary requirement of
   the polyfill and won't be part of the final API. (It means you need to build
   your requester with a specific handler in mind, rather than allowing the user
   to pick one.)
3. Build your requester or handler using the API as described in the
   [explainer](../docs/explainer.md).

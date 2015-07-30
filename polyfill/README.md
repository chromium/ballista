# Web Actions polyfill

**Author:** Matt Giuca <<mgiuca@chromium.org>>

This partial polyfill lets you try out Web Actions right now, with some
(serious) limitations, in supported browsers. By design, the API does things
that aren't possible in a polyfill, so we can't support everything.

## Supported browsers

The polyfill currently requires Google Chrome / Chromium 45 (no earlier, no
later). This is because it relies on the
[navigator.connect](https://mkruisselbrink.github.io/navigator-connect/) API
which is currently
[Chrome-only](https://www.chromestatus.com/feature/5709330426888192).

You must turn on the
[#enable-experimental-web-platform-features](chrome://flags/#enable-experimental-web-platform-features)
flag in Chrome (required to use `navigator.connect`).

> **TODO:** Update to use the new API from Chrome 46.0.2459.0 onwards.
> Alternatively, we could probably use the `navigator.connect` polyfill so that
> it will work on different browsers.

## Limitations of the polyfill

* No registration of handlers (the web app manifest is not used). Instead, the
  requester must explicitly nominate the URL of the handler.
* No handler picking UI. Each requester is tied to a single handler.
* Not possible to use `clients.openWindow` from the `'action'` event handler
  (when the handler's service worker receives an action). This means your apps
  need to handle the action in an existing tab, rather than opening a new tab.

## Usage instructions

1. Add `webactions-polyfill.js` to your requester or handler JavaScript context
   (as a `<script>` in HTML for foreground pages, and using `importScripts` from
   service workers).
2. In the requester, set `navigator.actions.polyfillHandlerUrl` to a valid
   handler URL before calling performAction. This is a temporary requirement of
   the polyfill and won't be part of the final API. (It means you need to build
   your requester with a specific handler in mind, rather than allowing the user
   to pick one.)
3. Build your requester or handler using the API as described in the
   [explainer](../docs/explainer.md).

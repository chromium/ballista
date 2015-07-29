# Web Actions sample requester

**Author:** Matt Giuca <<mgiuca@chromium.org>>

This is a simple web app with a text file, that allows you to open the text file
in an external editor using Web Actions. As it uses the Web Actions polyfill, it
currently only works in conjunction with the app in the `handler` directory.

This app currently requires Google Chrome / Chromium 45 (no earlier, no later).
This is because it relies on the
[navigator.connect](https://mkruisselbrink.github.io/navigator-connect/) API
which is currently
[Chrome-only](https://www.chromestatus.com/feature/5709330426888192).

You must turn on the
[#enable-experimental-web-platform-features](chrome://flags/#enable-experimental-web-platform-features)
flag in Chrome (required to use `navigator.connect`).

> **TODO:** Update to use the new API from Chrome 46.0.2459.0 onwards.
> Alternatively, we could probably use the `navigator.connect` polyfill so that
> it will work on different browsers.

## Usage instructions

1. Serve the handler on `localhost:8000` (the requester expects the app to be
   running on this origin). One way of doing this is to `cd` to the `handler`
   directory and run `python -m SimpleHTTPServer 8000`.
2. Serve the requester from a web server. One way of doing this is to `cd` to
   the `requester` directory and run `python -m SimpleHTTPServer 8001`.
3. Open the [handler](http://localhost:8000) in a supported browser. This will
   register its service worker. You need to keep the handler app open (due to
   limitations of the polyfill).
4. Open the [requester](http://localhost:8001) in another tab.
5. From the requester, click "Edit". This opens the file in the handler's tab.
6. Edit the text in the handler, then click "Save".
7. The new text will be visible in the requester.

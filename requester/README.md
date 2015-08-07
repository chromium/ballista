# Web Actions sample requester

**Author:** Matt Giuca <<mgiuca@chromium.org>>

This is a simple web app with a text file, that allows you to open the text file
in an external editor using Web Actions. As it uses the Web Actions polyfill, it
currently only works in conjunction with the app in the `handler` directory.

The app requires a web browser with support for [Service
Workers](http://www.w3.org/TR/service-workers/) and [Arrow
functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions).
This includes newer versions of Google Chrome / Chromium and Mozilla Firefox.
(Tested on Chrome 46 and Firefox 42.)

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

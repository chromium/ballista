# Ballista Editor Demo

**Author:** Matt Giuca <<mgiuca@chromium.org>>

Live at:
[handler-dot-chromium-ballista.appspot.com](https://handler-dot-chromium-ballista.appspot.com)

This is a simple web-based text editor that registers as a Ballista handler for
text files. As it uses the Ballista polyfill, it works with any requester app
using the same polyfill (like [Ballista Cloud
Demo](https://requester-dot-chromium-ballista.appspot.com)).

The app requires a web browser with support for [Service
Workers](http://www.w3.org/TR/service-workers/) and [Arrow
functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions).
This includes newer versions of Google Chrome / Chromium and Mozilla Firefox.
(Tested on Chrome 46 and Firefox 42.)

## Usage instructions

The demo runs on [Google App Engine](https://cloud.google.com/appengine/docs).
You can try it out locally using the App Engine dev appserver.

1. Download and install the [App Engine Python
   SDK](https://cloud.google.com/appengine/downloads).
2. `cd` to the `ballista` directory.
3. Run the dev appserver: `dev_appserver.py handler.yaml`.
4. Open the [handler](http://localhost:8080) in a supported browser. You will be
   prompted to register this site as an action handler. Click "OK". Close the
   page.
5. You can view and delete handler registrations in the [polyfill control
   panel](https://chromium-ballista.appspot.com).
6. Open a requester app. For this example, we'll use [Ballista Cloud
   Demo](https://requester-dot-chromium-ballista.appspot.com).
7. From the requester, click "Open". Select "Ballista Editor Demo". This opens
   a new tab with the handler.
8. Edit the text in the handler, then click "Save".
9. The new text will be visible in the requester.

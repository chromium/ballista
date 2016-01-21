# Ballista Cloud Demo

**Author:** Matt Giuca <<mgiuca@chromium.org>>

Live at:
[requester-dot-chromium-ballista.appspot.com](https://requester-dot-chromium-ballista.appspot.com)

This is a simple web app with a list of files, that lets you open the text file
in an external editor using Ballista. As it uses the Ballista polyfill, it
works with any handler app using the same polyfill (like [Ballista Editor
Demo](https://handler-dot-chromium-ballista.appspot.com)).

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
3. Run the dev appserver: `dev_appserver.py requester.yaml`.
4. Register at least one action handler. For this example, we'll use [Ballista
   Editor Demo](https://handler-dot-chromium-ballista.appspot.com). Go there and
   register it. You can view and delete handler registrations in the [polyfill
   control panel](https://chromium-ballista.appspot.com).
5. Open the [requester](http://localhost:8080).
6. From the requester, click "Open". Select "Ballista Editor Demo". This opens
   a new tab with the handler.
7. Edit the text in the handler, then click "Save".
8. The new text will be visible in the requester.

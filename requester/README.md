# Ballista sample requester

**Author:** Matt Giuca <<mgiuca@chromium.org>>

This is a simple web app with a text file, that allows you to open the text file
in an external editor using Ballista. As it uses the Ballista polyfill, it
currently only works in conjunction with the app in the `handler` directory.

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
3. Run the dev appserver: `dev_appserver.py proxy.yaml handler.yaml
   requester.yaml`.
4. Open the [handler](http://localhost:8081) in a supported browser. You will be
   prompted to register this site as an action handler. Click "OK".
5. You can view and delete handler registrations in the [polyfill control
   panel](http://localhost:8000).
6. Open the [requester](http://localhost:8082) in another tab.
7. From the requester, click "Open". Select "Ballista Handler Demo". This opens
   the file in the handler's tab.
8. Edit the text in the handler, then click "Save".
9. The new text will be visible in the requester.

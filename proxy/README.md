# Ballista polyfill proxy

**Author:** Matt Giuca <<mgiuca@chromium.org>>

This is the proxy site that facilitates connections between the requester and
handler (for the purpose of making the polyfill work; this site won't be
required in a browser that actually implements Ballista).

## Usage instructions

1. Download and install the [App Engine Python
   SDK](https://cloud.google.com/appengine/downloads).
2. `cd` to the `ballista` directory.
3. Run the dev appserver: `dev_appserver.py proxy.yaml`.

The proxy is now running at [http://localhost:8080](http://localhost:8080).
Visiting that site allows you to view, add and remove handler registrations.

To test the polyfill against your local version of the proxy, update
`polyfill/ballista-polyfill.js`, changing `kProxySite` to
`"http://localhost:8080"`.

## Details

The proxy is an implementation detail which neither users nor developers need to
deal with directly (aside from accessing the above control panel). The polyfill
will automatically talk to the proxy.

The reason we have a proxy site is to provide a common origin for all requesters
and handlers to talk to (while we are using the polyfill). Handler registrations
are stored in an IndexedDB in the client, associated with the proxy domain (the
proxy is just a collection of static files; no data is sent to the server).

As a developer using the Ballista API, you should generally *not* run your own
proxy site. That would defeat the whole point of the proxy, which is to have a
single origin for all clients to talk to. You only need to run the proxy site if
you are planning to modify it.

The handler registration flow is as follows:

1. Upon loading a page which a) imports the polyfill, and b) has a manifest, the
   polyfill automatically parses the manifest, and then loads the proxy site
   (/register) in an IFrame.
2. The polyfill posts a message to the proxy with details about the handler
   (from the manifest). The proxy displays this information to the user.
3. If the user clicks "OK", the details of the handler are added into the
   proxy's IndexedDB, and stored locally on the client.

The requester "performAction" flow is as follows:

1. The requester calls `performAction` (a function in the polyfill).
2. The polyfill loads the proxy site (/choose) in an IFrame.
3. The polyfill posts a message to the proxy with details about the action (its
   `options` dictionary) along with a
   [MessagePort](https://developer.mozilla.org/en-US/docs/Web/API/MessagePort)
   object.
4. The proxy looks up its IndexedDB, filtering handlers based on the `options`
   dictionary. It displays the list of viable handlers to the user.
5. If the user picks a handler, the proxy loads the handler's URL in an IFrame
   (nested within its own IFrame).
6. The proxy posts the MessagePort to the handler.
7. The polyfill (in the handler) receives the MessagePort, and sends a
   confirmation message back to the requester.
8. The polyfill (in the requester) closes the IFrame containing the proxy.

Now the handler and requester are connected directly via a MessageChannel, and
there is no further mediation required from the proxy.

Again, you don't need to know any of this to use the API. This is all taken care
of by the interactions between the polyfill and proxy site.

## Why didn't we just use registerProtocolHandler?

As detailed
[here](https://blog.mozilla.org/webdev/2010/07/26/registerprotocolhandler-enhancing-the-federated-web/)
and
[here](http://www.backalleycoder.com/2015/10/13/app-to-app-interaction-apis/),
you can achieve a similar thing using
[registerProtocolHandler](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/registerProtocolHandler)
and IFrames. Why did we make this complicated proxy?

* Using RPH would force us to use the native RPH registration, picking and
  management UI, which differs from browser to browser, is of fairly poor
  quality (in Chrome and Firefox --- for example, in Chrome, you must choose a
  default handler and cannot choose on a case-by-case basis), and exposes the
  protocol name to the user. This way we can experiment with our own UI.
* RPH does not let you do interesting filters (such as filtering on MIME types,
  wildcards, etc).
* There are bugs involving use of RPH within IFrames (such as [this Firefox
  bug](https://bugzilla.mozilla.org/show_bug.cgi?id=1196151)).

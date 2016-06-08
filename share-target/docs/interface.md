# Web Share Target API Interface

**Date**: 2016-05-30

This document is a rough spec (i.e., *not* a formal web standard draft) of the
Web Share Target API. This API allows websites to register to receive shared
content from either the [Web Share API](../../share/docs/interface.md), or
system events (e.g., shares from native apps).

This API requires the user agent to support both [service
workers](https://www.w3.org/TR/service-workers/) and [web app
manifests](https://www.w3.org/TR/appmanifest/). The [Web Share
API](../../share/docs/interface.md) is not required, but recommended.

Examples of using the Share Target API for sharing can be seen in the
[explainer document](explainer.md).

**Note**: The Web Share Target API is a proposal of the [Ballista
project](../../README.md), which aims to explore website-to-website and
website-to-native interoperability.

## App manifest

The first thing a handler needs to do is declare its share handling capabilities
in its [web app manifest](https://www.w3.org/TR/appmanifest/):

```WebIDL
partial dictionary Manifest {
  boolean supports_share;
};
```

The `"supports_share"` member of the manifest, if `true`, indicates that the app
can receive share events from requesters, or the system. The declarative nature
of the manifest allows search services to index and present web applications
that handle shares.

Handlers declaring `supports_share` in their manifest will **not** be
automatically registered; the user must explicitly authorize the registration.
How this takes place is still under consideration (see [User
Flow](explainer.md#user-flow), but will ultimately be at the discretion of the
user agent (the user may be automatically prompted, or may have to explicitly
request registration).

**For consideration**: We may wish to provide a method for websites to
explicitly request to prompt the user for handler registration. There would
still be a requirement to declare `supports_share` in the manifest. For now, we
have omitted such a method from the design to keep control in the hands of user
agents. It is easier to add such a method later than remove it.

## Event handlers

Handlers **must** have a registered [service
worker](https://www.w3.org/TR/service-workers/).

When the user picks a registered web app as the target of a share, the
handler's service worker starts up (if it is not already running), and a
`"share"` event is fired at the global object.

```WebIDL
partial interface WorkerGlobalScope {
  attribute EventHandler onshare;
};

interface ShareEvent : ExtendableEvent {
  readonly attribute ShareData data;

  void reject(DOMException error);
};

dictionary ShareData {
  DOMString? title;
  DOMString? text;
  DOMString? url;
};
```

The `onshare` handler (with corresponding event type `"share"`) takes a
`ShareEvent`. The `data` field provides data from the sending application.

How the handler deals with the data object is at the handler's discretion, and
will generally depend on the type of app. Here are some suggestions:

* An email client might draft a new email, using `title` as the subject of an
  email, with `text` and `url` concatenated together as the body.
* A social networking app might draft a new post, ignoring `title`, using `text`
  as the body of the message and adding `url` as a link. If `text` is missing,
  it might use `url` in the body as well. If `url` is missing, it might scan
  `text` looking for a URL and add that as a link.
* A text messaging app might draft a new message, ignoring `title` and using
  `text` and `url` concatenated together. It might truncate the text or replace
  `url` with a short link to fit into the message size.

A share fails if:

* The handler had no registered service worker.
* There was an error during service worker initialization.
* There is no event handler for `share` events.
* The event handler explicitly calls the event's `reject` method (either in the
  event handler, or in the promise passed to the event's
  [`waitUntil`](https://www.w3.org/TR/service-workers/#wait-until-method)
  method).
* The promise passed to `waitUntil` is rejected.

Once the event completes without failing, the share automatically succeeds, and
the requester's promise is resolved. The end of the event's lifetime marks the
end of the share, and there is no further communication in either direction.

The Share Target API is defined entirely within the service worker. If the
handler needs to provide UI (which should be the common case), the service
worker must create a foreground page and send the appropriate data between the
worker and foreground page, out of band. The `share` event handler is [allowed
to show a
popup](https://html.spec.whatwg.org/multipage/browsers.html#allowed-to-show-a-popup),
which means it can call the
[`clients.openWindow`](https://www.w3.org/TR/service-workers/#clients-openwindow-method)
method.

## Where do shares come from?

Share events can be sent from a variety of places:

* Built-in trigger (e.g., user picks "Share" from a browser's menu, to share the
  URL in the address bar).
* A native application.
* A web application using the [Web Share API](../../share/docs/interface.md).

There will usually be a picker that lets the user select a target app. This
could be the native system app picker, or a user-agent-supplied picker. The apps
could include other system apps and actions alongside the web app handlers.

If an event comes from a web app, the `data` field of the event should be a
clone of the `data` parameter to `navigator.share`. If the event comes from some
other source, the user agent may construct the `data` object as appropriate.

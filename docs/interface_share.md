# Ballista Share Interface

**Date**: 2016-04-29

This document is a rough spec (i.e., *not* a formal web standard draft) of the
Ballista one-directional API. To avoid complexity, we avoid discussing the
bidirectional parts of the Ballista project here.

Examples of using the one-directional API for sharing can be seen in the
[explainer document](explainer.md).

## Requester API

The `navigator.actions` interface (available from both foreground pages and
workers) is where our API surface lives.

```WebIDL
partial interface Navigator {
  readonly attribute Actions actions;
};

partial interface WorkerNavigator {
  readonly attribute Actions actions;
};
```

### performAction

The `navigator.actions` interface provides the `performAction` method which
initiates a request.

```WebIDL
interface Actions {
  Promise<Action> performAction((ActionOptions or DOMString) options,
                                object data);
};

dictionary ActionOptions {
  DOMString verb;
};

dictionary Action {};
```

The `performAction` method takes two arguments:
* `options` provides metadata about the action which is used by the user agent
  to decide how to behave (what apps to show, how the UI is presented, whether
  to expect a response, etc). Currently just has `verb` (the only non-optional
  field) but we will expand this with more options in the future. If this is a
  string `x`, that is short-hand for `{verb: x}`.
* `data` is the object that will be delivered to the handler. It contains the
  data being shared between applications. Its fields depend on the verb (see
  below for details on the `share` verb).

`performAction` always shows some form of UI, to give the user a choice of
application and get their approval to invoke and send data to a potentially
native application (which carries a security risk). UX mocks are shown
[here](user_flow.md).

`performAction` returns (asynchronously, via a promise) an `Action` object. This
object currently contains no fields, but we will extend it later. It is not
possible for the requester to learn the identity of the chosen application.

`performAction`'s promise may be rejected in the following cases (it is possible
to distinguish between these four failure modes, but again, not learn the
identity of the chosen application):

* The action was invalid (e.g., an unknown verb or inappropriate fields for the
  given verb).
* There were no apps available to handle that specific action.
* The user cancelled the action instead of picking an app.
* The data could not be delivered to the target app (e.g., service worker could
  not start, had no event handler, or the chosen native app could not be
  launched), or the target app explicitly rejected the action.

### canPerformAction

`navigator.actions` also provides a method for determining whether there are any
applications that can handle a particular action:

```WebIDL
partial interface Actions {
  boolean canPerformAction((ActionOptions or DOMString) options);
};
```

Returns `true` if there are one or more applications that could handle the
action described by `options` (i.e., if `options` was passed to `performAction`,
would any applications be presented to the user?). May give false positives, but
not false negatives (on some systems, it may not be possible to determine in
advance whether any native applications support the action, in which case
`canPerformAction` should return `true`; `false` means that `performAction` will
definitely fail). This can be used by websites to hide or disable the sharing
UI, to avoid presenting a button that just fails when users press it.

**TODO(mgiuca)**: This may have to be asynchronous, so that the implementation
can query the file system without blocking.

**For consideration**: `canPerformAction` may present a fingerprinting issue, by
providing several bits of entropy about the identity of the device. (For
example, an attacker may passively run `canPerformAction` on all available verbs
with many different options sets, and the set of resulting bits will in some way
reflect the set of web and native applications registered/installed on the
device.) I suspect this entropy is minimal as most devices of a given operating
system would have a similar set of capabilities, but it may allow identification
of, e.g., users with native editors of obscure MIME types. Further analysis is
warranted.

### Verbs

The *verb* is a string that determines what handlers are available (handlers
explicitly register for certain verbs), as well as what fields are expected in
the `options` and `data` objects, and how the interaction will take place (e.g.,
whether it will be one-way or bidirectional). Each verb is its own
mini-protocol.

To avoid a) proliferation of overly specialized verbs, and b) mismatched
expectations about what a particular verb means, we will limit the set of verbs
to those defined in the standard. We will leave the set of verbs open for new
additions in the future, but not allow individual handlers or requesters to
invent their own verbs ad-hoc. User agents are expected to reject actions with
unexpected verbs, and enforce that the correct options and data are supplied for
the given verb.

In this document, we define only a single verb, `"share"`, but we expect several
other verbs to be defined in the initial standard.

### Built-in and native app handlers (web-to-native)

The user agent may choose to provide handlers that do not correspond to
registered web applications. When the user selects these "fake" handlers, the
user agent itself performs the duties of the handler. This can include:

* Providing a built-in service (such as "copy to clipboard").
* Forwarding the action to the native app picking system (e.g., [Android
  intents](http://developer.android.com/training/sharing/send.html), [iOS share
  sheets](https://developer.apple.com/library/ios/documentation/UIKit/Reference/UIActivityViewController_Class/index.html),
  [Windows Share contracts](https://msdn.microsoft.com/en-us/windows/uwp/app-to-app/share-data)).
* Forwarding the action directy on to a native system application.

In any case, the user agent is responsible for marshalling data to/from the
required formats and generally ensuring that the built-in or native handler
behaves like a web handler.

## Handler API

Handlers **must** have a registered [service
worker](https://www.w3.org/TR/service-workers/) and a [web app
manifest](https://www.w3.org/TR/appmanifest/).

### App manifest

The first thing a handler needs to do is declare its action handling
capabilities in the app manifest:

```WebIDL
partial dictionary Manifest {
  ManifestAction[]? actions;
};

dictionary ManifestAction {
  DOMString verb;
};
```

The `"actions"` member of the manifest contains a list of objects, one per verb
the application can handle. For the share verb, there is no additional metadata
required, so the following is sufficient:

```JSON
"actions": [
  {
    "verb": "share"
  }
]
```

For more complex verbs, other metadata may be provided, such as which MIME types
will be accepted.

The declarative nature of the manifest allows web applications to be indexed by
their action handling capabilities, allowing search services that, say, find all
web applications that handle "share" actions.

Handlers declaring actions in their manifest will **not** be automatically
registered; the user must explicitly authorize the registration. How this takes
place is still under consideration (see [User
Flow](user_flow.md#registering-a-website-as-a-handler-on-mobile), but will
ultimately be at the discretion of the user agent (the user may be automatically
prompted, or may have to explicitly request registration).

**For consideration**: We may wish to provide a method for websites to
explicitly request to prompt the user for handler registration. This would
*only* allow sites to register for verbs they have declared in the manifest. For
now, we have omitted such a method from the design to keep control in the hands
of user agents. It is easier to add such a method later than remove it.

### Event handlers

When the user picks a registered web app as the target of an action, the
handler's service worker starts up (if it is not already running), and a
`"handle"` event is fired at the `navigator.actions` object.

```WebIDL
partial interface Actions {
  attribute EventHandler onhandle;
};
Actions implements EventTarget;

interface HandleEvent : ExtendableEvent {
  readonly attribute ActionOptions options;
  readonly attribute object data;

  void reject(DOMException error);
};
```

The `onhandle` handler (with corresponding event type `"handle"`) takes a
`HandleEvent`. The `options` and `data` fields are clones of the `options` and
`data` parameters passed to the `performAction` method by the requester.

If the `reject` method is called, the action fails and the requester's promise
is rejected. This must be called within the lifetime of the event (either in the
event handler, or in the promise passed to the event's
[`waitUntil`](https://www.w3.org/TR/service-workers/#wait-until-method) method).
The action also fails if the promise passed to `waitUntil` is rejected. Once the
event completes without failing, the action automatically succeeds, and the
requester's promise is resolved.

For one-way actions (like `"share"`), the end of the event's lifetime marks the
end of the action, and there is no further communication in either direction.

The handler-side API is defined entirely within the service worker. If the
handler needs to provide UI (which should be the common case), the service
worker must create a foreground page and send the appropriate data between the
worker and foreground page, out of band. The `handle` event handler is [allowed
to show a
popup](https://html.spec.whatwg.org/multipage/browsers.html#allowed-to-show-a-popup),
which means it can call the
[`clients.openWindow`](https://www.w3.org/TR/service-workers/#clients-openwindow-method)
method.

### System-generated actions (native-to-web)

Actions do not need to come from web requesters. The user agent may trigger an
action from some external stimulus, such as the user opening a file, or choosing
a web app as the target of a system intent. As in the web-to-native case, the
user agent is responsible for simulating the requester side of the connection
and marshalling data into the correct format.

For example, the user agent may register web handlers into the operating
system's native application pickers. When the user picks a web handler, the user
agent creates an `options` and `data` object and invokes the web handler, as if
it had been triggered by a web requester.

## The "share" verb

When an action is sent using the `"share"` verb, the following extra rules
apply:

* It must be a one-way action (no response after the initial promise completes).
* No additional `options` are recognised.
* The `data` object may have any of (and should have at least one of) the
  following optional fields:
  * `title` (string): The title of the document being shared. May be ignored by
    the handler.
  * `text` (string): Arbitrary text that forms the body of the message being
    shared.
  * `url` (string): A URL or URI referring to a resource being shared.

We may later expand this to allow image data or file blobs.

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

When a user agent is acting as a requester or handler on behalf of a native
system application, it must understand the above requirements and convert
to/from the appropriate system data structures. For example, on Android, when a
web requester is used to send a system intent to a native application, the user
agent may create an
[Intent](http://developer.android.com/reference/android/content/Intent.html)
object with `ACTION_SEND`, setting the `EXTRA_SUBJECT` to `title`. Since Android
intents do not have a URL field, `EXTRA_TEXT` would be set to `text` and `url`
concatenated together.

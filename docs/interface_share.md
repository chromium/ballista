# Web Share Interface

**Date**: 2016-05-30

This document is a rough spec (i.e., *not* a formal web standard draft) of the
Web Share API. The basic Share API only allows share requests to be sent (this
API does not provide the capability to receive share requests). For a follow-up
plan to have websites receive share requests from the system, or other websites,
see the [Share Target API](interface_share_target.md).

Examples of using the Share API for sharing can be seen in the
[explainer document](../share/docs/explainer.md).

**Note**: The Web Share API is the first concrete proposal of the [Ballista
project](../README.md), which aims to explore website-to-website and
website-to-native interoperability.

## navigator.share

The `navigator.share` function (available from both foreground pages and
workers) is the main method of the interface:

```WebIDL
partial interface Navigator {
  Promise<void> share(ShareData data);
};

partial interface WorkerNavigator {
  Promise<void> share(ShareData data);
};

dictionary ShareData {
  DOMString? title;
  DOMString? text;
  DOMString? url;
};
```

The `share` method takes one argument: the object that will be delivered to the
handler. It contains the data being shared between applications.

The `data` object may have any of (and should have at least one of) the
following optional fields:

* `title` (string): The title of the document being shared. May be ignored by
  the handler.
* `text` (string): Arbitrary text that forms the body of the message being
  shared.
* `url` (string): A URL or URI referring to a resource being shared.

**TODO**: Expand this to allow image data and/or file blobs.

`share` always shows some form of UI, to give the user a choice of application
and get their approval to invoke and send data to a potentially native
application (which carries a security risk). UX mocks are shown
[here](../share/docs/explainer.md#user-flow).

`share`'s promise is resolved if the user chooses a target application,
and that application accepts the data without error. The promise may be rejected
in the following cases (it is possible to distinguish between these four failure
modes, but not learn the identity of the chosen application):

* The share was invalid (e.g., inappropriate fields in the `data` parameter).
* There were no apps available to handle sharing.
* The user cancelled the picker dialog instead of picking an app.
* The data could not be delivered to the target app (e.g., the chosen app could
  not be launched), or the target app explicitly rejected the share event.

## navigator.canShare

`navigator` also provides a method for determining whether there are any
applications that can handle sharing:

```WebIDL
partial interface Navigator {
  boolean canShare();
};
```

Returns `true` if there are one or more applications that could handle a share
event (i.e., if `share` was called, would any applications be presented to the
user?). May give false positives, but not false negatives (on some systems, it
may not be possible to determine in advance whether any native applications
support sharing, in which case `canShare` should return `true`; `false` means
that `share` will definitely fail). This can be used by websites to hide or
disable the sharing UI, to avoid presenting a button that just fails when users
press it.

**TODO(mgiuca)**: This may have to be asynchronous, so that the implementation
can query the file system without blocking.

## Share handlers

The list of share targets or handlers can be populated from a variety of
sources, depending on the user agent and underlying OS:

* Built-in service (e.g., "copy to clipboard").
* Native applications.
* Web applications registered using the [Web Share Target
  API](interface_share_target.md).

The user agent can support any or all of the above (for example, on some
platforms, there is no system for native apps to receive share data; some user
agents may not support the Share Target API).

The user agent may either present its own picker UI and then forward the share
data to the chosen app, or simply forward the share data to the system's native
app picking system (e.g., Android, iOS and Windows 10 all [support this concept
natively](native.md)) and let the OS do the work.

When forwarding to a website using the Share Target API, the `ShareData` object
is simply cloned. When forwarding to a native app, the user agent should do its
best to map the fields onto the equivalent concepts. For example, on Android,
when a share is sent to a native application, the user agent may create an
[Intent](http://developer.android.com/reference/android/content/Intent.html)
object with `ACTION_SEND`, setting the `EXTRA_SUBJECT` to `title`. Since Android
intents do not have a URL field, `EXTRA_TEXT` would be set to `text` and `url`
concatenated together.

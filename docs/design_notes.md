# Ballista Design Notes

**Date**: 2016-01-21

In this document, I'll go over some of the design decisions in the current
Ballista [API proposal](explainer.md), and go over how we address some common
problems with similar APIs.

**Why is the requester's foreground page only allowed to perform one-directional
actions?**

If a foreground page could perform a bidirectional action, and the user closed
the foreground page before closing the handler, updates from the handler could
be lost. More details on that below.

We could allow this, but we decided to forbid it, in order to encourage best
practises for developers.

**What if the requester's tab closes while it is waiting for a response?**

If we want to handle long-term editing sessions, we have to handle this case. If
your requester is a cloud file store, and your editor is a text editor, if the
user closes the cloud store's foreground tab, they should still be able to save
their work to the cloud.

If the JavaScript context in the requester's foreground page is waiting for a
response (maybe a promise being resolved, or an event), then once the foreground
page is closed, updates will simply be lost. That's why, for bidirectional
actions, we require that the request comes from a service worker, so we can
receive updates in the background, even after the foreground tab closes.

**OK, but what if the requester's service worker gets killed?**

Service workers can be killed at any time, and when that happens, the JavaScript
context (all the global variables, objects, any unresolved promises, registered
events, etc) is destroyed.

We have carefully designed the API so that the requester state is resilient to
service worker death. The service worker can be killed while an action is in
flight, and when an update event occurs, the user agent restarts the requester's
worker, and delivers the update event.

More details on that in the follow-up questions.

**Why are updates delivered as events, rather than by resolving a promise?**

Firstly, because promises can only be resolved once, and we want to be able to
deliver multiple updates.

Secondly, because of the service worker killing problem discussed above.
Promises can't live beyond the lifetime of the worker. Neither do event
registrations, of course, but the events are re-registered when the worker
restarts.

**Why do update events have an int ID? Why not make it nicely object oriented?**

Our original design was to represent every action with a neat `Action` object.
Update events would be delivered directly to the `Action` (rather than to a
global object), which allowed you to write this beautiful code in the
requester's service worker:

```js
navigator.actions.performAction('open', {file: file})
    .then(action => {
      action.addEventListener(
        'update', event => storeFileInCloud(filename, event.data.file));
    });
```

Unfortunately, we realised that those event listeners, and the `Action` objects
themselves, would be destroyed when the service worker is killed. In order to
keep listening for updates even while stopped, all of the state would have to be
serializable.

So we ditched the `Action` object and used an opaque integer ID to represent
actions. The requester can keep track of these IDs across service worker
restarts. Of course, this still requires some effort on the developer's part:
you need to keep a map from action IDs to relevant metadata (e.g., the file's ID
in the server's database) in some persistent store, like IndexedDB. But that is
a standard necessity when writing a service worker.

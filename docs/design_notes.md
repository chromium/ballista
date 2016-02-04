# Ballista Design Notes

**Date**: 2016-01-21

In this document, I'll go over some of the design decisions in the current
Ballista [API proposal](explainer.md), and go over how we address some common
problems with similar APIs.

As the explainer sets out, nothing is set in stone. This doc just covers our
current thinking.

## Alternative proposals

**How is this different from other web interoperability systems?**

This is an important question, so I put it in the
[explainer](explainer.md#how-is-this-different-from-other-web-interoperability-systems).
I'll go into more detail on some of those in the following questions.

**Why not build on Mozilla's Web Activities?**

[Web
Activities](https://developer.mozilla.org/en-US/docs/Web/API/Web_Activities) is
a Firefox-only API for sending and receiving messages between user-selectable
apps. (If you are familiar with Android, this is the Firefox OS version of
the intents system.)

This sounds promising. Although it is not currently on a standards track, we
could have built our proposal around Web Activities. The main problem is
architectural: we want to use service workers (which were invented after Web
Activities) to solve some important problems (see [Resilience in the face of
death](#resilience-in-the-face-of-death)). That made our API fundamentally
incompatible with Web Activities, and since Web Activities is not standard, we
decided to just start from scratch.

**Why not just use intent:// URIs?**

On Android, both Chrome and Firefox let web applications fire Android system
intents by opening a URI with the ["intent://"
scheme](https://developer.chrome.com/multidevice/android/intents). This only
lets us create requesters (not handlers), and only fire one-directional actions.
But let's talk about this feature specifically for the Share use case. The main
thing it has going for it is it works right now! But how well does it solve the
Share use case, and how can we build on it?

So firstly, this is Android-only, and not a web standard, and that's similar to
Web Activities for Firefox. Could we generalize it and standardize? In its
current form, I think it's a bit too tightly coupled with Android; for example,
it directly uses Android intent names and package names (like
`com.google.zxing.client.android`). Also, it has some abilities that I consider
outside the scope of Ballista, like being able to directly launch a specific
native application. These sort of things don't belong in a web standard because
they rely too much on the host operating system.

OK, but what if we start from scratch, but take inspiration from intent:// URIs.
What if we invent an action:// URI that isn't Android-specific, as Paul Kinlan
suggests
[here](https://paul.kinlan.me/every-browser-should-support-intent-urls/). That
sounds better, but I worry it will be limited to one-way actions with a small
amount of data. Yes, we could find ways to establish a message channel between
the handler and requester, but a) I can't imagine what that would look like on
the side of the requester opening a URI, and b) a message channel is too general
(it requires all participating sites to agree upon and implement a protocol).

The way I see it, if we're going to start from scratch, we may as well design an
API out of JavaScript functions that matches the way it will be used, instead of
trying to cram a two-way communications framework into a URI.

## The development process

**This proposal has too many parts. Can we just simplify/specialize on a
particular use case?**

The best way to get nothing done is to try and solve all the problems at the
same time. Many people have expressed concern that our proposal is too broad in
scope. In particular:

* That if we try to solve many different use cases, we'll have an overly broad
  API, and overly broad UI, and we'll have to fight all the battles at once.
* That if we try to make a general-purpose ("any verb you like") system, there
  will be fragmentation and not enough agreement about what a particular verb
  means ("I sent you a "tweet" action, but you only accept "share" actions.").

So yes, we do want to start by addressing just a couple of important use cases:
Share and Edit. We want to at least start with a closed set of verbs. But we're
starting with two cases, not one, because we also don't want an over-constrained
system that can't be extended later. For example, by considering the Edit case,
we were able to design around the long-term bidirectional scenario, which we
wouldn't have been able to extend into had we only considered Share.

Ultimately, we may want to make a "V1" spec that only includes the simpler Share
use case, but I think it's helpful for discussions to consider both cases in
depth.

## Resilience in the face of death

**Why is the requester's foreground page only allowed to perform one-directional
actions?**

If a foreground page could perform a bidirectional action, and the user closed
the foreground page before closing the handler, updates from the handler could
be lost. See the following question for more details.

We could allow this, but we decided to forbid it, in order to encourage best
practices for developers.

**What if the requester's tab closes while it is waiting for a response?**

If we want to handle long-term editing sessions, we have to handle this case.
Say the requester is a cloud file store, and the editor is a text editor: if the
user closes the cloud store's foreground tab, they should still be able to save
their work to the cloud.

If the JavaScript context in the requester's foreground page is waiting for a
response (maybe a promise being resolved, or an event), then once the foreground
page is closed, updates will simply be lost. That's why, for bidirectional
actions, we require that the request comes from a service worker, so we can
receive updates in the background, even after the foreground tab closes.

**What if the requester's service worker gets killed?**

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

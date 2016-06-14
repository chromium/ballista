# Ballista Explained

**Date**: 2015-09-25

**Ballista** is a project to explore inter-website communication; specifically,
communication between one website and another site of the user's choosing.
Imagine being able to:

* Click a "share" button, then choose which social network or other web/native
  app to share it with, based on which apps *you* have installed (not a
  pre-defined list chosen by the site you're on).
* Click an "edit" button on a photo or document in a cloud drive or web IDE,
  then choose a web/native app to edit it with.
* Click an "attach" button in a webmail app, then pick a photo or file from a
  cloud photo collection or drive, instead of your local disk.
* Register a web editor as the default editor for certain file types in the
  native file browser.

We want to enable all of these use cases, and more like them. And, we want to be
able to integrate with native apps where it makes sense (for example, using a
native app to edit a document directly from the web). Essentially, we want to
create an **interoperability system for the web**.

We've come up with a basic API as a first cut at solving this problem. That API
is detailed below, and a polyfill is provided in this repository. But it's early
days, and we expect it to evolve over time. We're less interested in pushing
this particular API than we are in restarting the conversation in this problem
space.

Ballista is all about helping web applications become first-class apps on
desktop and mobile, interoperating with native apps and the underlying local
file system, as well as with each other.

See also:
* [Design Notes](design_notes.md), an informal Q&A about the design.

## Spun-off proposals

We are planning to present each piece of Ballista as a separate standards
proposal.

* [Web Share API](https://github.com/mgiuca/web-share).
* [Web Share Target API](https://github.com/mgiuca/web-share-target).

## How is this different from other web interoperability systems?

There have been several past attempts at doing this, notably [Web
Intents](http://webintents.org), which is no longer under development, and
Mozilla's [Web
Activities](https://developer.mozilla.org/en-US/docs/Web/API/Web_Activities),
which is proprietary to Firefox OS and Firefox for Android.

Indeed, this proposal covers the bulk of the use cases of Web Intents and Web
Activities, but a few things are different now:

* The web platform has gotten some new features since 2013 that solve some of
  the issues of Web Intents: [Service
  Workers](http://slightlyoff.github.io/ServiceWorker/spec/service_worker/) give
  us a place for handlers to receive events without opening a foreground page,
  and for requesters to receive responses to even if the user has closed their
  tabs. [Web App Manifests](https://w3c.github.io/manifest/) give us a place to
  declaratively specify handlers.
* Ballista is designed to interoperate with native apps on mobile and desktop,
  which solves the bootstrapping problem. Ballista is also designed to address
  the use case of a handler sending multiple updates back.
* There is now a push for building [installable app-like
  websites](https://w3c.github.io/manifest/#installable-web-applications).
  Installable apps should be registerable as file handlers.

OK, what about some less ambitious approaches?

* [intent:// URLs](https://developer.chrome.com/multidevice/android/intents):
  Works today, but it's specific to Android, and only allows us to
  send intents to native apps.
* [registerProtocolHandler](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/registerProtocolHandler)
  and registerContentHandler: Can be [used for this
  purpose](https://blog.mozilla.org/webdev/2010/07/26/registerprotocolhandler-enhancing-the-federated-web/),
  but it's a hack. We'd rather design an API that properly solves these use
  cases.

## Overview

The rest of this document outlines our current thinking about the shape of the
Ballista API.

Websites can use Ballista in two different ways:

* As a **Requester**: Websites can request an "action" be handled by another
  site or app of the user's choosing. For example, a site can send a file to be
  edited externally.
* As a **Handler**: Websites can request to be registered as action handlers.
  For example, a site registered as a handler may be called upon to edit a file
  from another site or native file system.

A site / app can be either a requester or a handler, or both.

> **Note**: The native integration would be an implementation detail of
> browsers, not part of the standard. In essence, a browser could act as a
> special requester or register itself as a special handler and act as a proxy
> to the underlying OS; this would be allowed by the spec but not required.

* A basic action is **one-way**: the requester sends a *single message* (with
  optional payload) to an appropriate handler of the user's choice. It receives
  confirmation that the action was sent, but doesn't expect a response from the
  handler.
* Actions can also be **bidirectional**: after the initial action, the handler
  can send *updates* back to the requester. The handler can send multiple
  updates; each is a newer version of the object being edited (it is not a data
  stream).

## Sample code

### Sharing (requester)

See [Web Share
explainer](https://github.com/mgiuca/web-share/blob/master/docs/explainer.md).

### Share handler

See [Web Share Target
explainer](https://github.com/mgiuca/web-share-target/blob/master/docs/explainer.md).

### Edit a file (requester)

A web-based cloud drive can add an "edit" button to let the user edit a file
with any registered editor for that file type.

#### foreground.js

```js
editButton.addEventListener('click', () => {
  navigator.serviceWorker.controller.postMessage(
      {type: 'open', filename: selectedFilename});
});
```

#### serviceworker.js

```js
self.addEventListener('message', event => {
  if (event.data.type != 'open')
    return;

  var filename = event.data.filename;
  getFileFromCloud(filename).then(file => {
    // |file| is a File object.
    navigator.actions.performAction(
        {verb: 'open', bidirectional: true, type: file.type}, {file: file})
        .then(action => {
      var onUpdate = event => {
        // Only respond to updates to the current action.
        if (event.id != action.id)
          return;

        // Can be called multiple times for a single action.
        // |event.data.file| is a new File object with updated text.
        storeFileInCloud(filename, event.data.file);
        if (event.done)
          navigator.actions.removeEventListener('update', onUpdate);
      };
      navigator.actions.addEventListener('update', onUpdate);
    });
  });
});
```

#### User experience

1. The user selects a file and clicks the "edit" button. The browser shows a
   list of registered edit handlers for this file type, and the user can pick
   one.
2. The file opens in the external editor (which may be a native application, or
   another browser tab). (For native editors, the file is stored in a temp
   directory.)
3. The user clicks "save" in the external editor. This fires the "update" event
   to the requester's service worker, which in this case writes the updated file
   to the cloud.

### Text editor (handler)

Here's how to register a website as a handler for editing text files. As above,
we need a web app manifest and a service worker.

#### manifest.webmanifest

```JSON
{
  "name": "WebEditor",
  "short_name": "Editor",
  "icons": [...],
  "actions": [
    {
      "verb": "open",
      "bidirectional": true,
      "types": ["text/*"]
    }
  ]
}
```

> **Note:** `"bidirectional"` means that the handler can send updates back to
> the requester.

#### serviceworker.js

```js
navigator.actions.addEventListener('handle', event => {
  if (event.options.verb == 'open') {
    if (event.data.file === undefined) {
      event.reject(new Error('Did not contain file.'));
      return;
    }

    // This function in our service worker opens a new browser tab and
    // returns a handle (in a promise) that receives a "save" event when the
    // user clicks a button in the tab's foreground page.
    openFileInNewWindow(event.data.file)
        .then(client => {
          var id = event.id;
          client.addEventListener('save', event => {
            navigator.actions.update(id, {file: new File([event.newText], ...)});
          });
        });
  }
});
```

#### User experience

1. When the user is on your site, the browser provides a button to register the
   app as an editor for text files.
2. The user clicks this button. The app is registered and appears in the list of
   text file editors that the browser shows to the user. It is also registered
   as a file association for `*.txt` files in the host OS.
3. When the user opens a text file from another website, the browser lets them
   pick your app. Or, the user can right-click on a text file in their local
   file browser and choose to open it with your app. Either way, this pops open
   your app in a new browser tab.
4. When the user clicks "Save" in your app, the updated file is passed back to
   the requester website, or written back to disk.

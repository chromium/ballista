# Ballista Explained

**Date**: 2015-09-25

Ballista is a proposed JavaScript web API to allow inter-website communication,
as well as communication between websites and native apps on mobile and desktop.

Websites can use Ballista in two different ways:

* As a **Requester**: Websites can request an "action" be handled by another
  site or app of the user's choosing. For example, a site can send a file to be
  edited externally.
* As a **Handler**: Websites can request to be registered as action handlers.
  For example, a site registered as a handler may be called upon to edit a file
  from another site or native file system.

Typically, a site / app will be either a requester *or* a handler, but it can be
both.

Here are some things you can do with Ballista:

* A file storage provider (a cloud drive or a web-based IDE), as a
  **requester**, can add an "edit" button that opens a file in an external
  editor of the user's choosing; it could be a native app or a website that
  implements the handler interface. When the user saves the file in the external
  editor, it gets automatically synced back to the requester. No more
  download/open/edit/save/upload workflows!
* A web-based editing application (an image editor or text editor, for example)
  can register as a **handler** for certain file types. Not only will it be
  available for web requesters, it could also be registered in the host OS's
  file type registry. This means you can have a web app registered as the
  default handler for local files of a given type.
* A **requester** can implement a generic "share" button that sends a URL to an
  app of the user's choosing; again, this could be a native app (on Android, at
  least), or a handler website. This could replace the currently growing wall of
  service-specific share buttons seen on many sites.
* A social networking website can register as a **handler** for the share verb.
  This allows the user to choose that site as a target when choosing to "share"
  from a native Android app, or from a requester site.

Ballista is all about helping web applications become first-class apps on
desktop and mobile, interoperating with native apps and the underlying local
file system, as well as with each other.

## How is this different from Web Intents?

You may be thinking that we've already tried this with [Web
Intents](http://webintents.org), which is no longer under development. Indeed,
this proposal covers the bulk of the use cases of Web Intents (and that's the
point – we think Web Intents was a great idea!), but a few things are different
now:

* The web platform has gotten some new features since 2013 that solve some of
  the issues of Web Intents: [Service
  Workers](http://slightlyoff.github.io/ServiceWorker/spec/service_worker/) give
  us a place for handlers to receive events without opening a foreground page,
  and [Web App Manifests](https://w3c.github.io/manifest/) give us a place to
  declaratively specify handlers.
* Ballista is designed to interoperate with native apps on mobile and desktop,
  which solves the bootstrapping problem.
* There is now a push for building [installable app-like
  websites](https://w3c.github.io/manifest/#installable-web-applications).
  Installable apps should be registerable as file handlers.

## Sample code

### Sharing (requester)

To let the user share the current page's URL with an app or website of their
choosing, just attach this JavaScript code to a "share" button.

> **Note:** Only one-way actions can be requested from a foreground page.

#### foreground.js

    shareButton.addEventListener('click', () => {
      navigator.actions.performAction('share', {url: window.location.href})
          .then(action => console.log(action));
    });

#### User experience

1. The user clicks the "share" button. The browser shows a list of registered
   share handlers, and the user can pick one.

### Share handler

Here's how to register a website to appear in the list of apps that can handle a
"share" intent on Android, or a "share" action from another website.

You need both a [web app manifest](https://w3c.github.io/manifest/) and a
[service
worker](http://slightlyoff.github.io/ServiceWorker/spec/service_worker/),
so that your site can be contacted even when the user does not have it open in
any tabs.

#### manifest.webmanifest

    {
      "name": "Includinator",
      "short_name": "Includinator",
      "icons": [...],
      "actions": {
        "share": {}
      }
    }

#### serviceworker.js

    self.addEventListener('action', event => {
      if (event.verb == 'share') {
        if (event.data.url === undefined)
          throw new Error('Did not contain URL.');

        includinate(event.data.url);
      }
    });

#### User experience

1. When the user is on your site, the browser provides a button to register the
   app as a "share handler".
2. The user clicks this button. The app is registered and appears in the list of
   share handlers that the browser shows to the user.

### Edit a file (requester)

A web-based cloud drive can add an "edit" button to let the user edit a file
with any registered editor for that file type.

#### foreground.js

    editButton.addEventListener('click', () => {
      navigator.serviceWorker.controller.postMessage(
          {type: 'open', filename: selectedFilename});
    });

#### serviceworker.js

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

    {
      "name": "WebEditor",
      "short_name": "Editor",
      "icons": [...],
      "actions": {
        "open": {
          "bidirectional": true,
          "types": ["text/*"]
        }
      }
    }

**Note:** `"bidirectional"` means that the handler can send updates back to the
requester.

#### serviceworker.js

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

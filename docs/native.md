# Ballista Native Integration Survey

**Date**: 2016-04-28

This document is an informal and incomplete survey of various operating systems'
native actions-like systems, for exploring how a user agent might automatically
map the [Ballista API](explainer.md) into the native system.

*Note:* I (mgiuca@chromium.org) am not very familiar with these details. I
gathered this information from reading the online documentation and
experimenting with apps, and have not had experience programming against these
APIs. I would appreciate being informed of any errors.

## Share verb

See [Share API Native Integration Survey](../share/docs/native.md) and [Share
Target API Native Integration Survey](../share-target/docs/native.md).

## Edit verb

### Windows (Desktop), Mac, Linux (Desktop), Chrome OS

The ideal implementation for the "edit" verb on traditional desktop platforms
would be tied into the [file
associations](https://en.wikipedia.org/wiki/File_association) system that has
been ubiquitous since the early days of desktop computing.

* Web-to-native: When a web requester sends an edit action, native apps
  associated with that file type are presented in the action picker. If one is
  chosen, the file to be edited is saved to a temporary file on disk, and the
  native application is launched with that file as an argument. The user agent
  watches the file for changes; upon seeing a change, an `update` event is fired
  with the updated file contents.
  * A problem with this approach is that it is not generally possible for the
    user agent to tell when the user has closed the file in the native
    application, so the web requester can't be informed when the action is
    closed.
* Native-to-web: The user agent registers web handlers into the native file
  association system (with a command line that launches the user agent with
  special arguments). When the user opens the file, the user agent is launched
  with the filename, and can deliver it to the web handler in an event. When the
  handler responds with updates, the user agent can overwrite the file on disk.
  * Windows presents significant trouble here because it does not allow an app
    (i.e. the user agent) to register as multiple handlers, nor does it allow
    the app to control its name/icon in the Open With menu. This can be worked
    around by creating a shim .exe file for each web handler (some of the
    Ballista team previously worked on [this precise
    feature](https://bugs.chromium.org/p/chromium/issues/detail?id=130455) for
    Chrome Apps but it never shipped... eventually it evolved into the Ballista
    project).
  * I don't remember if we had the same trouble on Mac. Linux Desktop
    environments are generally fine with this, though.
  * On Chrome OS, the Chrome team could implement this functionality directly
    into the File Browser app.

### Android

* I haven't researched this deeply. Android's
  [`ACTION_EDIT`](http://developer.android.com/reference/android/content/Intent.html#ACTION_EDIT)
  allows the user to select an app to edit a document corresponding to a URL
  (which points at a file on the file system). It seems like we could implement
  a similar mechanism to the desktop version described above (create a temporary
  file, send its URL in an `ACTION_EDIT` intent).
* Android's [Document Provider
  API](http://developer.android.com/guide/topics/providers/document-provider.html)
  supports the reverse process (letting the user pick a document to edit).

### iOS

* I haven't researched this deeply, but it looks like there is a way for App
  Extensions to edit documents. As before, there is no way to dynamically
  register an App Extension.

### Others

* No known file editing mechanism on Windows Mobile.

## Summary

Throughout this survey there is a recurring theme: web-to-native is generally
easy because there is usually a way to package up an action and send it to
native apps. Native-to-web is usually hard or impossible for one reason:
operating systems don't like letting one application dynamically register
multiple handlers for things (with the notable exception of Android M+). There
are usually work-arounds but it is hard to make web applications receive actions
like first class apps.

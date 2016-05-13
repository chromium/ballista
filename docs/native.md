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

### Android

* Android supports one-way and two-way modal intents (you can optionally get a
  single response back, but the handler is a modal activity that must close
  before the response is returned to the requester). Share would only use
  one-way intents.
* Web-to-native: [Pretty
  straightforward](http://developer.android.com/training/sharing/send.html).
  Send an
  [`ACTION_SEND`](http://developer.android.com/reference/android/content/Intent.html#ACTION_SEND)
  intent. Use the system intent picker to choose a target app.
* Native-to-web: Intent targets can be added dynamically on Android M+ using the
  [Direct Share
  API](http://developer.android.com/about/versions/marshmallow/android-6.0.html#direct-share).
  (This is what allows the Messenger app to add individual contacts as share
  intent targets.)
  This allows the user agent to add websites to the system intent picker (to
  receive intents from native apps). The intent would be delivered to the user
  agent's app, which would then figure out the appropriate web handler, marshal
  the intent data into a web object, and pass it to the event handler.
  * There may be a limit on the number of sites that can be added this way.

### iOS

* No generic actions model, but does support "share" as a special case. The
  dialog for picking a share receiver is the "Share sheet".
* Unclear whether it allows two-way communication, or what the data format of
  the share object is, but it at least allows sharing of text, URLs and images.
* Web-to-native: The [UIActivityViewController
  class](https://developer.apple.com/library/ios/documentation/UIKit/Reference/UIActivityViewController_Class/index.html)
  triggers the share dialog and you can pass a number of data items to it. The
  docs are very hard to understand; this [StackOverflow
  answer](http://stackoverflow.com/a/13499204/368821) explains it succinctly.
  You can share an array of items that implement the
  [UIActivityItemSource](https://developer.apple.com/library/ios/documentation/UIKit/Reference/UIActivityItemSource_protocol/index.html)
  protocol.
* Native-to-web: In order to have an app appear in the Share sheet, you need to
  create an [app extension](https://developer.apple.com/app-extensions/). There
  is no way to dynamically create app extensions (extensions are created as
  [Xcode
  targets](https://developer.apple.com/library/ios/documentation/General/Conceptual/ExtensibilityPG/index.html)
  and reviewed by the [App Store review
  process](https://developer.apple.com/app-store/review/guidelines/#extensions)).
  The best that a user agent can probably do here is create a single share
  target for the whole agent (e.g., "Websites") and then if content is shared to
  that target, present a secondary picker of registered web handlers.

### Windows (Universal Windows Platform)

* [Universal Windows Platform (UWP)](https://msdn.microsoft.com/en-us/windows/uwp/get-started/whats-a-uwp) is supported on Windows 10 mobile, desktop, Xbox, etc.
  * UWP APIs are not available to normal Win32 .exe applications. This will only
    be available for user agents that are UWP apps (e.g., Microsoft Edge is,
    Google Chrome isn't).
  * Windows 8, 8.1 have similar share APIs but unclear whether compatible with
    the Windows 10 ones.
* No generic actions model, but does support the "Share contract" as a special
  case. UX: Shows a modal share target picker on the right hand side of the
  screen (at least on desktop Windows 10).
* Web-to-native: [Share
  API](https://msdn.microsoft.com/en-us/windows/uwp/app-to-app/share-data):
  Create a DataRequest object and put data into it (multiple data types can be
  placed into the request object). Can optionally negotiate with the receiver
  about which data to send (Ballista implementations would likely ignore this
  and just put all the data from the requester into the object).
* Native-to-web: [Receive
  API](https://msdn.microsoft.com/en-us/windows/uwp/app-to-app/receive-data):
  Registration is in the Windows [app package
  manifest](https://msdn.microsoft.com/en-au/library/windows/apps/br211474.aspx).
  It is unlikely that you could dynamically register web handlers into this list
  (the same problem and work-around as with iOS).

### Others

* No known native share mechanism on Windows (<=7), Mac, Linux (Desktop), Chrome
  OS.

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

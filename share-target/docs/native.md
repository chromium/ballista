# Web Share Target API: Native Integration Survey

**Date**: 2016-06-06

This document is an informal and incomplete survey of various operating systems'
share systems, for exploring how a user agent might automatically map the [Share
Target API](explainer.md) into the native system. See also: [Share API Native
Integration Survey](../../share/docs/native.md).

*Note:* I (mgiuca@chromium.org) am not very familiar with these details. I
gathered this information from reading the online documentation and
experimenting with apps, and have not had experience programming against these
APIs. I would appreciate being informed of any errors.

## Android

* Apps can send *intents* to the system which can be delivered to an app of the
  user's choice.
* Intent targets can be added dynamically on Android M+ using the [Direct Share
  API](http://developer.android.com/about/versions/marshmallow/android-6.0.html#direct-share).
  (This is what allows the Messenger app to add individual contacts as share
  intent targets.)
  This allows the user agent to add websites to the system intent picker (to
  receive intents from native apps). The intent would be delivered to the user
  agent's app, which would then figure out the appropriate web handler, marshal
  the intent data into a web object, and pass it to the event handler.
  * There may be a limit on the number of sites that can be added this way.

## iOS

* Apps can send a share event to the system. The dialog for picking a share
  receiver is the "Share sheet".
* In order to have an app appear in the Share sheet, you need to create an [app
  extension](https://developer.apple.com/app-extensions/). There is no way to
  dynamically create app extensions (extensions are created as [Xcode
  targets](https://developer.apple.com/library/ios/documentation/General/Conceptual/ExtensibilityPG/index.html)
  and reviewed by the [App Store review
  process](https://developer.apple.com/app-store/review/guidelines/#extensions)).
  The best that a user agent can probably do here is create a single share
  target for the whole agent (e.g., "Websites") and then if content is shared to
  that target, present a secondary picker of registered web handlers.

## Windows (Universal Windows Platform)

* [Universal Windows Platform
  (UWP)](https://msdn.microsoft.com/en-us/windows/uwp/get-started/whats-a-uwp)
  is supported on Windows 10 mobile, desktop, Xbox, etc.
  * UWP APIs are not available to normal Win32 .exe applications. This will only
    be available for user agents that are UWP apps (e.g., Microsoft Edge is,
    Google Chrome isn't).
  * Windows 8, 8.1 have similar share APIs but unclear whether compatible with
    the Windows 10 ones.
* UWP apps can initiate a "Share contract" to share to another UWP app. UX:
  Shows a modal share target picker on the right hand side of the screen (at
  least on desktop Windows 10).
* [Receive
  API](https://msdn.microsoft.com/en-us/windows/uwp/app-to-app/receive-data):
  Registration is in the Windows [app package
  manifest](https://msdn.microsoft.com/en-au/library/windows/apps/br211474.aspx).
  It is unlikely that you could dynamically register web handlers into this list
  (the same problem and work-around as with iOS).

## Others

* No known native share mechanism on Windows (<=7), Mac, Linux (Desktop), Chrome
  OS.

## Summary

Unlike the web-to-native sharing (in the [Share
API](../../share/docs/explainer.md), which is generally pretty straightforward
to route into a system share, native-to-web is usually hard or impossible for
one reason: operating systems don't like letting one application dynamically
register multiple handlers for things (with the notable exception of Android
M+). There are usually work-arounds but it is hard to make web applications
receive actions like first class apps.

On these platforms, implementations have two non-ideal options:

1. Declare the browser itself as a system share target, then have users pick the
   browser, and display a sub-picker within the browser for web apps, or
2. Only support web-to-web sharing (showing a picker within the browser when a
   website uses the [Share API](../../share/docs/explainer.md).

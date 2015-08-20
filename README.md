# Ballista

**Date**: 2015-07-29

Ballista is a proposal for a standard web API, revisiting of the concepts behind
[Web Intents](http://webintents.org): allowing websites to open files and share
data with other applications (native and web), and also allowing websites to
register as handlers for files and data from other applications.

The codename "[Ballista](https://en.wikipedia.org/wiki/Ballista)" is about
launching things at other things; we hope to settle on a proper name over the
course of the standardization process. The current API lives in
`navigator.actions`, but we aren't particularly attached to that name.

## How does it work?
There are two parts to Ballista:

* **Requester**: Websites can request an "action" be handled by another site or
  app of the user's choosing. For example, a site can send a file to be edited
  externally.
* **Handler**: Websites can request to be registered as action handlers. For
  example, a site registered as a handler may be called upon to edit a file from
  another site or native file system.

This combines the desktop concept of file associations with the mobile concept
of intents. A handler could appear in the "open with" menu in a traditional
desktop operating system, or in the intent picker on Android. A requester can
use a native app to edit a document, or fire an intent at a native app on
Android. And web requesters can also fire actions at web handlers.

## Resources

* For a detailed overview, see [Ballista Explained](docs/explainer.md).
* In the `polyfill` directory, there is a partial polyfill. This doesn't allow
  websites to register as handlers, but is sufficient to set up a bidirectional
  action flow between two participating sites.
* In the `handler` and `requester` directories are sample apps that work
  together.

See the `README.md` file in each directory for details. Many caveats apply.

## Who is behind Ballista?

The Google Chrome team, including:

* Ben Wells <<benwells@chromium.org>>
* Matt Giuca <<mgiuca@chromium.org>>
* Sam McNally <<sammc@chromium.org>>

This is not an official Google product (experimental or otherwise), it is just
code that happens to be owned by Google.

Copyright 2015 Google Inc. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

> <http://www.apache.org/licenses/LICENSE-2.0>

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

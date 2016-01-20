# Ballista

**Date**: 2015-09-25

![A ballista](docs/images/ballista-300.png)

**Ballista** is a project to explore inter-website and web/native communication;
specifically, communication between one website and another site or native app
of the user's choosing. We want the user to be able to *share* or *edit*
documents in another website or app that the first website has never even heard
of, *choose* documents from another website, or register a website as a *native
file handler*. We're attempting to solve similar problems to the intents system
on Android, but also address other use cases like document editing. Essentially,
we want to create an **interoperability system for the web**.

Our [explainer document](docs/explainer.md) dives deeper into the problem space
and outlines an API that we think solves this problem. But this is less about
proposing an API, and more about starting a conversation, so take a look, and
let us know what you think (contact details below).

## Demo

We have a prototype that works in Chrome and Firefox. Try this:

1. Go to
   [handler-dot-chromium-ballista.appspot.com](https://handler-dot-chromium-ballista.appspot.com)
   (Ballista Editor Demo), and click "OK" to register it as an action handler.
2. Go to
   [requester-dot-chromium-ballista.appspot.com](https://requester-dot-chromium-ballista.appspot.com)
   (Ballista Cloud Demo), and open a file with "Ballista Editor Demo".

These two apps don't know about each other, yet the editor can edit files from
the cloud app. Using our polyfill, you can write a web app that interoperates
with our demo apps in the same way.

You can view and manage app registrations at
[chromium-ballista.appspot.com](https://chromium-ballista.appspot.com). In the
final product, the registration, picking and management UI would be part of the
browser.

## Resources

* For a detailed overview, see [Ballista Explained](docs/explainer.md).
* In the [`polyfill`](polyfill) directory, there is a polyfill that you can use
  to write a requester that can fire actions at any handler, or a handler that
  can receive actions from any requester.
* The [`handler`](handler) and [`requester`](requester) directories contain the
  source code for the demo apps described above.

See the `README.md` file in each directory for details. Many caveats apply.

## Who is behind Ballista?

The Google Chrome team, including:

* Matt Giuca <<mgiuca@chromium.org>>
* Sam McNally <<sammc@chromium.org>>
* Ben Wells <<benwells@chromium.org>>

This is not an official Google product (experimental or otherwise), it is just
code that happens to be owned by Google.

Copyright 2016 Google Inc. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

> <http://www.apache.org/licenses/LICENSE-2.0>

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

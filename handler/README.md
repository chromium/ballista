# Web Actions sample handler

**Author:** Matt Giuca <<mgiuca@chromium.org>>

This is a simple web-based text editor that registers as a Web Actions handler
for text files. It is designed to be used in conjunction with the app in the
`requester` directory.

This app currently requires Google Chrome / Chromium 45 (no earlier, no later).
This is because it relies on the
[navigator.connect](https://mkruisselbrink.github.io/navigator-connect/) API
which is currently
[Chrome-only](https://www.chromestatus.com/feature/5709330426888192).

You must turn on the
[#enable-experimental-web-platform-features](chrome://flags/#enable-experimental-web-platform-features)
flag in Chrome (required to use `navigator.connect`).

> **TODO:** Update to use the new API from Chrome 46.0.2459.0 onwards.
> Alternatively, we could probably use the `navigator.connect` polyfill so that
> it will work on different browsers.

## Usage instructions

See [requester/README.md](../requester/README.md).

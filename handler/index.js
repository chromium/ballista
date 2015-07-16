// Foreground page
"use strict";

function onLoad() {

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      // Registration was successful
      console.log('ServiceWorker registration successful with scope: ',
                  registration.scope);
    }).catch(err => {
      // registration failed :(
      console.log('ServiceWorker registration failed: ', err);
    });

    var messageChannel = new MessageChannel();
    // Note: You need to use 'onmessage'; addEventListener does not work here in
    // Chrome 45. TODO(mgiuca): File a bug.
    messageChannel.port1.onmessage = onMessage;
    var message = {type: 'startup'};
    navigator.serviceWorker.controller.postMessage(message,
                                                   [messageChannel.port2]);
  }
}

function onMessage(event) {
  var data = event.data;
  var type = data.type;
  if (type == 'loadFile') {
    var file = data.file;
    console.log('Got file:', file);
  } else {
    console.log('Got unknown message:', data);
  }
}

window.addEventListener('load', onLoad, false);

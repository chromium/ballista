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
    updateUIFromFile(file);
  } else {
    console.log('Got unknown message:', data);
  }
}

// Updates |contents_textfield| with the contents of |file|, asynchronously.
function updateUIFromFile(file) {
  return new Promise((resolve, reject) => {
    var contents_textfield = document.getElementById('contents_textfield');
    var filename_textfield = document.getElementById('filename_textfield');
    readBlobAsText(file).then(text => {
      contents_textfield.value = text;
      filename_textfield.value = file.name;
      resolve();
    }, err => reject(err));
  });
}

window.addEventListener('load', onLoad, false);

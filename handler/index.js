// Foreground page
"use strict";

var filename = null;
var mimetype = null;

var clientId = null;

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

    // Get this client ID from the URL.
    var match = document.location.hash.match(/clientid=(\d)/);
    if (match !== null)
      clientId = Number(match[1]);

    var message = {type: 'startup', clientId: clientId};
    navigator.serviceWorker.controller.postMessage(message);
  }

  document.getElementById('save_button')
      .addEventListener('click', saveButtonClick);
}

function onMessage(event) {
  var data = event.data;
  var type = data.type;
  if (type == 'loadFile') {
    var file = data.file;
    updateUIFromFile(file);
    filename = file.name;
    mimetype = file.type;
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

function saveButtonClick() {
  var contents_textfield = document.getElementById('contents_textfield');
  var contents = contents_textfield.value;
  var file = new File([contents], filename, {type: mimetype});

  var message = {type: 'update', clientId: clientId, file: file};
  navigator.serviceWorker.controller.postMessage(message);
}

window.addEventListener('load', onLoad, false);
navigator.serviceWorker.addEventListener('message', onMessage);

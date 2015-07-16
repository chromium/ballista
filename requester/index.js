// Foreground page
//
// Not using a service worker. This means if the page closes,
// the data is lost. We can also use a service worker to handle updates
// even if the tab is closed.
"use strict";

// Sets whether the file is open in the external editor.
function setOpenState(isOpen) {
  var status_p = document.getElementById('status_p');
  var status_line;
  status_line =
      isOpen ? 'File is open in external editor.' : 'File is not being edited.';
  status_p.innerHTML = status_line;
}

// Reads a blob as text. Returns a promise, which supplies the text.
function readBlobAsText(blob) {
  return new Promise((resolve, reject) => {
    var reader = new FileReader();

    reader.addEventListener('load', () => resolve(reader.result));
    reader.addEventListener('abort', () => reject(new Error("aborted")));
    reader.addEventListener('error', () => reject(reader.error));

    reader.readAsText(blob);
  });
}

// Updates |contents_textfield| with the contents of |file|, asynchronously.
function updateTextFromFile(file) {
  return new Promise((resolve, reject) => {
    var contents_textfield = document.getElementById('contents_textfield');
    readBlobAsText(file).then(text => {
      contents_textfield.value = text;
      resolve();
    }, err => reject(err));
  });
}

function editButtonClick() {
  var contents_textfield = document.getElementById('contents_textfield');
  var contents = contents_textfield.value;
  var filename = document.getElementById('filename_textfield').value;
  var file = new File([contents], filename, {type: "text/plain"});

  navigator.webActions.performAction(
      "edit", {file: file}).then(action => {
    console.log('Action started:', action);
    setOpenState(true);

    action.addEventListener('update', event => {
      // Can be called multiple times for a single action.
      // |event.data.file| is a new File with updated text.
      updateTextFromFile(event.data.file).then(() => {
        if (event.isClosed) {
          console.log('Action completed:', action);
          // Update the UI.
          setOpenState(false);
        } else {
          console.log('Action updated:', action);
        }
      });
    });
  });
}

// For testing/debugging purposes: send an "update" event to an action with a
// dummy file contents.
function debugCloseAction(action) {
  var evt = new Event('update');
  evt.data = {};
  var contents = 'Updated file contents.';
  evt.data.file = new File([contents], '');
  evt.isClosed = true;

  action.dispatchEvent(evt);
}

function onLoad() {
  document.getElementById('edit_button')
      .addEventListener('click', editButtonClick);

  // Tell the polyfill which handler to use. This isn't part of the final API,
  // just a temporary requirement of the polyfill.
  navigator.webActions.polyfillHandlerUrl = 'http://localhost:8000/test';
}

window.addEventListener('load', onLoad, false);

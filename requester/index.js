// Foreground page
//
// Not using a service worker. This means if the page closes,
// the data is lost. We can also use a service worker to handle updates
// even if the tab is closed.

// Sets whether the file is open in the external editor.
function setOpenState(isOpen) {
  if (isOpen) {
    console.log('File is open in external editor');
  } else {
    console.log('File is closed in external editor');
  }
}

// Updates |contents_textfield| with the contents of |file|, asynchronously.
function updateTextFromFile(file) {
  var contents_textfield = document.getElementById('contents_textfield');
  var reader = new FileReader();
  reader.addEventListener('load', function() {
    contents_textfield.value = reader.result;
  });
  reader.readAsText(file);
}

function editButtonClick() {
  var contents_textfield = document.getElementById('contents_textfield');
  var contents = contents_textfield.value;
  var filename = document.getElementById('filename_textfield').value;
  var file = new File([contents], filename, {type: "text/plain"});

  navigator.webActions.performAction(
      "edit", {file: file}).then(function(action) {
    console.log('Action started:', action);
    setOpenState(true);

    action.addEventListener('update', function(event) {
      // Can be called multiple times for a single action.
      // |event.data.file| is a new File with updated text.
      updateTextFromFile(event.data.file);

      if (event.isClosed) {
        console.log('Action completed:', action);
        // Update the UI.
        setOpenState(false);
      } else {
        console.log('Action updated:', action);
      }
    });
  });
}

function onLoad() {
  document.getElementById('edit_button')
      .addEventListener('click', editButtonClick);
}

window.addEventListener('load', onLoad, false);

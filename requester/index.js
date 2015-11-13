// Copyright 2015 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Foreground page
"use strict";

var files = [
  {name: 'one.txt'},
  {name: 'two.txt'},
];

// Returns the selected filenames.
function selectedFiles() {
  var files = [];
  var trs = document.querySelectorAll('#file_table tbody tr');
  for (var i = 0; i < trs.length; i++) {
    var tr = trs[i];
    if (tr.querySelector('input[type = "checkbox"]').checked) {
      var fileBox = tr.querySelector('input[type = "text"]');
      files.push(fileBox.value);
    }
  }
  return files;
}

function selectionChanged() {
  var selected = selectedFiles().length > 0;
  var deleteButton = document.getElementById('delete_files');
  if (selected)
    deleteButton.removeAttribute('disabled');
  else
    deleteButton.setAttribute('disabled', '');
}

function generateTableRows() {
  var table = document.getElementById('file_table');
  var tbody = table.querySelector('tbody');
  while (tbody.firstChild)
    tbody.removeChild(tbody.firstChild);

  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    var tr = document.createElement('tr');

    var td1 = document.createElement('td');
    td1.setAttribute('class', 'mdl-data-table__cell--non-numeric');
    var textField = document.createElement('div');
    textField.setAttribute(
        'class', 'mdl-textfield mdl-js-textfield compact-mdl-textfield');
    var textFieldInput = document.createElement('input');
    textFieldInput.setAttribute('class', 'mdl-textfield__input');
    textFieldInput.setAttribute('type', 'text');
    textFieldInput.value = file.name;
    textField.appendChild(textFieldInput);
    componentHandler.upgradeElement(textField);
    td1.appendChild(textField);
    tr.appendChild(td1);

    var td2 = document.createElement('td');
    td2.setAttribute('class', 'mdl-data-table__cell--non-numeric');
    var button = document.createElement('button');
    button.setAttribute('class', 'mdl-button mdl-js-button mdl-button--raised mdl-button--colored mdl-js-ripple-effect edit-button');
    button.appendChild(document.createTextNode('Open'));
    componentHandler.upgradeElement(button);
    td2.appendChild(button);
    tr.appendChild(td2);

    tbody.appendChild(tr);
  }
  reUpgradeTable(table, selectionChanged);
}

// Sets whether the file is open in the external editor.
function setOpenState(isOpen) {
  var status_p = document.getElementById('status_p');
  var status_line;
  status_line =
      isOpen ? 'File is open in external editor.' : 'File is not being edited.';
  status_p.innerHTML = status_line;
}

// Updates |contents_textfield| with the contents of |file|, asynchronously.
function updateTextFromFile(file) {
  var contents_textfield = document.getElementById('contents_textfield');
  return readBlobAsText(file)
      .then(text => {
        contents_textfield.value = text;
      });
}

function editButtonClick() {
  var contents_textfield = document.getElementById('contents_textfield');
  var contents = contents_textfield.value;
  var filename = document.getElementById('filename_textfield').value;
  var file = new File([contents], filename, {type: "text/plain"});

  var channel = new MessageChannel();
  channel.port1.onmessage = event => {
    var data = event.data;
    var type = data.type;

    if (type == 'update') {
      if (data.openState !== undefined)
        setOpenState(data.openState);

      if (data.file !== undefined)
        updateTextFromFile(data.file);
    }
  }
  navigator.serviceWorker.controller.postMessage(
      {type: 'open', file: file, port: channel.port2}, [channel.port2]);
}

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
  }

  document.getElementById('edit_button')
      .addEventListener('click', editButtonClick);

  generateTableRows();
}

window.addEventListener('load', onLoad, false);

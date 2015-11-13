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

var files = [];

var newFileIndex = 0;

// Returns the indices of the selected files.
function selectedFiles() {
  var selected = [];
  var trs = document.querySelectorAll('#file_table tbody tr');
  for (var i = 0; i < trs.length; i++) {
    var tr = trs[i];
    if (tr.querySelector('input[type = "checkbox"]').checked) {
      var fileBox = tr.querySelector('input[type = "text"]');
      selected.push(i);
    }
  }
  return selected;
}

function selectionChanged() {
  var selected = selectedFiles();

  var deleteButton = document.getElementById('delete_files');
  if (selected.length > 0)
    deleteButton.removeAttribute('disabled');
  else
    deleteButton.setAttribute('disabled', '');

  var contents_textfield = document.getElementById('contents_textfield');
  if (selected.length == 1) {
    // Display a preview of the file's contents.
    contents_textfield.value = files[selected[0]].contents;
    contents_textfield.style.display = 'block';
  } else {
    contents_textfield.style.display = 'none';
  }
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
    textFieldInput.ballistaIndex = i;
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

    textFieldInput.addEventListener('change', onFilenameChanged);
  }
  reUpgradeTable(table, selectionChanged);
}

function createNewFile() {
  var filename = `New File ${++newFileIndex}.txt`;
  files.push({name: filename, contents: ''});
  generateTableRows();
}

function deleteSelectedFiles() {
  var selected = selectedFiles();
  selected.reverse();
  selected.forEach(i => files.splice(i, 1));
  generateTableRows();
}

function onFilenameChanged(e) {
  var index = e.target.ballistaIndex;
  var file = files[index];
  file.name = e.target.value;
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

  document.getElementById('delete_files')
      .addEventListener('click', deleteSelectedFiles);

  document.getElementById('new_file')
      .addEventListener('click', createNewFile);

  generateTableRows();
}

window.addEventListener('load', onLoad, false);

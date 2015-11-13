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
  {name: 'file.txt', contents: 'You can edit this file using Ballista!\n'},
];

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

function selectFiles(indices) {
  var selected = [];
  var trs = document.querySelectorAll('#file_table tbody tr');
  for (var i = 0; i < trs.length; i++) {
    var tr = trs[i];
    var checkbox = tr.querySelector('input[type = "checkbox"]')
                       .parentNode.MaterialCheckbox;
    if (indices.indexOf(i) != -1)
      checkbox.check();
    else
      checkbox.uncheck();
  }

  selectionChanged();
}

function selectionChanged() {
  var selected = selectedFiles();

  var deleteButton = document.getElementById('delete_files');
  if (selected.length > 0)
    deleteButton.removeAttribute('disabled');
  else
    deleteButton.setAttribute('disabled', '');

  var contents_textfield = document.getElementById('contents_textfield');
  var preview_label = document.getElementById('preview_label');
  var preview_box = document.getElementById('preview_box');
  if (selected.length == 1) {
    // Display a preview of the file's contents.
    contents_textfield.value = files[selected[0]].contents;
    preview_label.style.display = 'block';
    preview_box.style.display = 'block';
  } else {
    preview_label.style.display = 'none';
    preview_box.style.display = 'none';
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
    button.addEventListener('click', editButtonClick.bind(undefined, i));
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

// Updates the local file |index| with the contents of |blob|, asynchronously.
function updateFileFromBlob(index, blob) {
  return readBlobAsText(blob)
      .then(text => {
        files[index].contents = text;
        // Refresh the contents textfield if selected.
        selectionChanged();
      });
}

function editButtonClick(index) {
  var file = files[index];
  var blob = new File([file.contents], file.name, {type: "text/plain"});

  var channel = new MessageChannel();
  channel.port1.onmessage = event => {
    var data = event.data;
    var type = data.type;

    if (type == 'update') {
      if (data.file !== undefined)
        updateFileFromBlob(index, data.file);
    }
  }
  navigator.serviceWorker.controller.postMessage(
      {type: 'open', file: blob, port: channel.port2}, [channel.port2]);

  // Select the opened file.
  selectFiles([index]);
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

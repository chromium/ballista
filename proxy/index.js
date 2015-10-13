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

// Returns the URLs of the selected rows.
function selectedUrls() {
  var urls = [];
  var trs = document.querySelectorAll('#handler_table tbody tr');
  for (var i = 0; i < trs.length; i++) {
    var tr = trs[i];
    if (tr.querySelector('input').checked) {
      var urlCell = tr.querySelectorAll('td')[2];
      urls.push(urlCell.innerText);
    }
  }
  return urls;
}

function selectionChanged() {
  var selected = selectedUrls().length > 0;
  var deleteButton = document.getElementById('delete_handlers');
  if (selected)
    deleteButton.removeAttribute('disabled');
  else
    deleteButton.setAttribute('disabled', '');
}

// Creates a <tr> element for a table with simple text in each cell. |cells| is
// an array of strings.
function createTableRow(cells) {
  var tr = document.createElement('tr');
  for (var i = 0; i < cells.length; i++) {
    var td = document.createElement('td');
    td.setAttribute('class', 'mdl-data-table__cell--non-numeric');
    td.appendChild(document.createTextNode(cells[i]));
    tr.appendChild(td);
  }
  return tr;
}

// Call this to re-run the MDL upgrade step on the table (to regenerate the
// checkboxes). This should be called whenever the table is changed.
function reUpgradeTable() {
  // Delete all the checkbox cells.
  var trs = document.querySelectorAll('#handler_table tr');
  for (var i = 0; i < trs.length; i++) {
    var tr = trs[i];
    var firstCell = tr.querySelector('th,td');
    if (firstCell.querySelector('input') != null)
      tr.removeChild(firstCell);
  }

  // Force MDL to regenerate the checkbox cells. (The removal of data-upgraded
  // is required due to
  // https://github.com/google/material-design-lite/issues/984; this is a
  // proposed work-around.)
  var table = document.getElementById('handler_table');
  table.removeAttribute('data-upgraded');
  componentHandler.upgradeElement(table);

  // Add event handlers to the checkboxes.
  for (var i = 0; i < trs.length; i++) {
    var tr = trs[i];
    var firstCell = tr.querySelector('th,td');
    var checkbox = firstCell.querySelector('input');
    if (checkbox != null)
      checkbox.addEventListener('change', selectionChanged);
  }
}

function generateTableRows() {
  var tbody = document.querySelector('#handler_table tbody');
  while (tbody.firstChild)
    tbody.removeChild(tbody.firstChild);

  openRegistryDatabase().then(db => {
    getAllHandlers(db).then(handlers => {
      for (var i = 0; i < handlers.length; i++) {
        var handler = handlers[i];
        var cells = [handler.name, handler.url, handler.verbs.join(', ')];
        var tr = createTableRow(cells);
        tbody.appendChild(tr);
      }
      db.close();
      reUpgradeTable();
    });
  });
}

function deleteHandlersClick() {
  openRegistryDatabase().then(db => {
    deleteHandlerForUrls(db, selectedUrls()).then(unused => db.close());
    generateTableRows();
  });
}

function newHandlerClick() {
  var name = document.getElementById('new_handler_name').value;
  var url = document.getElementById('new_handler_url').value;
  var verbs = document.getElementById('new_handler_verbs').value;
  console.log("New handler:", name, url, verbs);
}

function onLoad() {
  document.getElementById('delete_handlers')
      .addEventListener('click', deleteHandlersClick);
  document.getElementById('new_handler')
      .addEventListener('click', newHandlerClick);
  generateTableRows();
}

window.addEventListener('load', onLoad, false);

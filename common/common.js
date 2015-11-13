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

"use strict";

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

// Call this to re-run the MDL upgrade step on a table (to regenerate the
// checkboxes). This should be called whenever |table| is changed.
function reUpgradeTable(table) {
  // Delete all the checkbox cells.
  var trs = table.querySelectorAll('tr');
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

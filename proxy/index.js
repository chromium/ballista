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

function newHandlerClick() {
  var name = document.getElementById('new_handler_name').value;
  var url = document.getElementById('new_handler_url').value;
  var verbs = document.getElementById('new_handler_verbs').value;
  console.log("New handler:", name, url, verbs);
}

function onLoad() {
  document.getElementById('new_handler')
      .addEventListener('click', newHandlerClick);
}

window.addEventListener('load', onLoad, false);

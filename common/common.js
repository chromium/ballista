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

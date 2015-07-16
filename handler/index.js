// Foreground page
"use strict";

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

    navigator.serviceWorker.addEventListener('message', event => {
      console.log('message:', event);
    });
  }
}

window.addEventListener('load', onLoad, false);

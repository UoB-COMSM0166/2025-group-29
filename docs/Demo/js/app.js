// js/app.js
import { initRouter } from './router.js';
import { initBackground } from './background.js';
import { showPrivacyConsent } from './privacy.js';

function startApp() {
  initBackground(document.getElementById('canvas-container'));
}

document.addEventListener('DOMContentLoaded', () => {
  startApp();
  window.addEventListener('introFinished', () => {
    showPrivacyConsent(agreed => {
      if (agreed) {
        initRouter();
      } else {
        window.close();
      }
    });
  }, { once: true });
});
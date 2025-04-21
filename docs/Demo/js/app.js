import { initRouter } from './router.js';
import { initBackground } from './background.js';

document.addEventListener('DOMContentLoaded', () => {
  initRouter();
  initBackground(document.getElementById('canvas-container'));
});
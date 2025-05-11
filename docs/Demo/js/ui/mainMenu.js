// js/ui/mainMenu.js
import { advanceTo } from '../router.js';

export const MainMenu = {
  el: null,
  show() {
    this.el = document.createElement('div');
    this.el.className = 'menuContainer';
    this.el.innerHTML = `
      <button class="menuButton" id="newBtn">Start New Game</button>
      <button class="menuButton" id="loadBtn">Load Game</button>
      <button class="menuButton" id="exitBtn">Exit Game</button>
    `;
    document.body.appendChild(this.el);
    document.getElementById('newBtn').onclick  = () => advanceTo('SAVE_MENU');
    document.getElementById('loadBtn').onclick = () => advanceTo('LOAD_MENU');
    document.getElementById('exitBtn').onclick = () => advanceTo('EXIT_CONFIRM');
  },
  hide() {
    this.el.remove();
  }
};
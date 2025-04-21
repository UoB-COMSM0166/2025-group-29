import { switchTo } from '../router.js';

export const ExitConfirm = {
  el: null,
  show() {
    this.el = document.createElement('div');
    this.el.className = 'menuContainer';
    this.el.innerHTML = `
      <h2>Are you sure you want to exit?</h2>
      <button class="menuButton" id="yesExit">Yes</button>
      <button class="menuButton" id="noExit">No</button>
    `;
    document.body.appendChild(this.el);
    document.getElementById('yesExit').onclick = () => window.close();
    document.getElementById('noExit').onclick  = () => switchTo('MAIN_MENU');
  },
  hide() {
    this.el.remove();
  }
};
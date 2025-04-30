// js/ui/escMenu.js
import { switchTo } from '../router.js';

export const EscMenu = {
  el: null,

  /**
   * 弹出 Esc 菜单
   * @param {Object} options
   * @param {Function} options.onResume 点击 Resume 的回调
   */
  show({ onResume }) {
    this.el = document.createElement('div');
    this.el.className = 'menuContainer';
    this.el.innerHTML = `
      <h2>Paused</h2>
      <button class="menuButton" id="resumeBtn">Resume Game</button>
      <button class="menuButton" id="saveBtn">Save Game</button>
      <button class="menuButton" id="loadBtn">Load Game</button>
      <button class="menuButton" id="exitBtn">Exit to Main Menu</button>
    `;
    document.body.appendChild(this.el);

    document.getElementById('resumeBtn').onclick = () => {
      this.hide();
      if (onResume) onResume();
    };
    document.getElementById('saveBtn').onclick = () => {
      this.hide();
      switchTo('SAVE_MENU');
    };
    document.getElementById('loadBtn').onclick = () => {
      this.hide();
      switchTo('LOAD_MENU');
    };
    document.getElementById('exitBtn').onclick = () => {
      window.location.href = 'index.html';
    };
  },

  hide() {
    if (this.el) this.el.remove();
  }
};
// js/ui/exitConfirm.js
import { switchTo } from '../router.js';

export const ExitConfirm = {
  el: null,
  show() {
    this.el = document.createElement('div');
    this.el.className = 'menuContainer';
    this.el.innerHTML = `
      <h2>Exit to Main Menu?</h2>
      <button class="menuButton" id="yesExit">Yes</button>
      <button class="menuButton" id="noExit">No</button>
    `;
    document.body.appendChild(this.el);

    // 点击 Yes 时刷新当前页面
    document.getElementById('yesExit').onclick = () => {
      window.location.reload();
    };

    // 点击 No 时回到主菜单
    document.getElementById('noExit').onclick  = () => switchTo('MAIN_MENU');
  },
  hide() {
    this.el?.remove();
  }
};
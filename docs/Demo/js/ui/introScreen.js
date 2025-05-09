// js/ui/introScreen.js
import { advanceTo } from '../router.js';

export const IntroScreen = {
  el: null,
  show() {
    this.el = document.createElement('div');
    this.el.id = 'introScreen';
    this.el.innerHTML = `
      <img id="titleImage" src="assets/media/titled-3.png" alt="Title Image" />
      <div id="continueText">Press any key or click to continue</div>
    `;
    document.body.appendChild(this.el);

    // 绑定键盘和鼠标事件
    window.addEventListener('keydown', this._onInput);
    window.addEventListener('mousedown', this._onInput);
  },
  hide() {
    // 清除监听
    window.removeEventListener('keydown', this._onInput);
    window.removeEventListener('mousedown', this._onInput);
    this.el.remove();
  },

  /**
   * 当用户按键或点击时触发。
   * 如果 #introOverlay 还存在，则忽略；否则进入主菜单。
   */
  _onInput(event) {
    if (document.getElementById('introOverlay')) {
      return; // 仍在播放引导，先等它消失
    }
    advanceTo('MAIN_MENU');
  }
};
import { advanceTo } from '../router.js';

export const IntroScreen = {
  el: null,
  show() {
    this.el = document.createElement('div');
    this.el.id = 'introScreen';
    this.el.innerHTML = `
      <img id="titleImage" src="assets/media/titled-3.png" alt="Title Image" />
      <div id="continueText">Press any key to continue</div>
    `;
    document.body.appendChild(this.el);
    window.addEventListener('keydown', this.onKey);
  },
  hide() {
    window.removeEventListener('keydown', this.onKey);
    this.el.remove();
  },
  onKey() {
    // 按任意键，先飞一小段，然后进主菜单
    advanceTo('MAIN_MENU');
  }
};
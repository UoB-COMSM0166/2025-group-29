// js/ui/introScreen.js
import { advanceTo } from '../router.js';

export const IntroScreen = {
  el: null,
  show() {
    this.el = document.createElement('div');
    this.el.id = 'introScreen';
    this.el.innerHTML = `
      <img id="titleImage"
           src="assets/media/titled-3.png"
           style="box-shadow:none!important;filter:none!important;"
           alt="Title Image" />
      <div id="continueText">Press any key or click to continue</div>
    `;
    document.body.appendChild(this.el);

    window.addEventListener('keydown', this._onInput);
    window.addEventListener('mousedown', this._onInput);
  },
  hide() {
    window.removeEventListener('keydown', this._onInput);
    window.removeEventListener('mousedown', this._onInput);
    this.el.remove();
  },
  _onInput() {
    if (document.getElementById('introOverlay')) return; // wait until overlay fades
    advanceTo('MAIN_MENU');
  }
};
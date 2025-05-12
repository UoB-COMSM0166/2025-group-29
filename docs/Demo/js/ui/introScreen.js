// js/ui/introScreen.js
import { advanceTo } from '../router.js';

export const IntroScreen = {
  el: null,

  show () {
    this.el = document.createElement('div');
    this.el.id = 'introScreen';
    this.el.innerHTML = `
      <img id="titleImage" src="assets/media/titled-3.png" alt="Title Image" />
      <div id="continueText">Press any key or click to continue</div>
    `;
    document.body.appendChild(this.el);

    const img = this.el.querySelector('#titleImage');
    if (img) {
      /* kill glow: stop animation, clear filter & shadow */
      img.style.animation  = 'none';
      img.style.filter     = 'none';
      img.style.boxShadow  = 'none';
    }

    window.addEventListener('keydown', this._onInput);
    window.addEventListener('mousedown', this._onInput);
  },

  hide () {
    window.removeEventListener('keydown', this._onInput);
    window.removeEventListener('mousedown', this._onInput);
    this.el.remove();
  },

  _onInput () {
    if (document.getElementById('introOverlay')) return;
    advanceTo('MAIN_MENU');
  }
};
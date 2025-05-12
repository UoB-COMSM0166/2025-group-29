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

    // add listeners for keyboard and mouse input
    window.addEventListener('keydown', this._onInput);
    window.addEventListener('mousedown', this._onInput);
  },
  hide() {
    // remove input event listeners and intro screen element
    window.removeEventListener('keydown', this._onInput);
    window.removeEventListener('mousedown', this._onInput);
    this.el.remove();
  },

  /**
   * this method is called when user presses key or clicks
   * if intro overlay element is still present, do nothing
   * otherwise navigate to main menu
   */
  _onInput(event) {
    if (document.getElementById('introOverlay')) {
      return; // waiting for intro overlay to disappear
    }
    advanceTo('MAIN_MENU');
  }
};
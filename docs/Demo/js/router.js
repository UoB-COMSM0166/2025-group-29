// js/router.js
import { startFlight } from './background.js';
import { IntroScreen }   from './ui/introScreen.js';
import { MainMenu }      from './ui/mainMenu.js';
import { LoadMenu }      from './ui/loadMenu.js';
import { SaveMenu }      from './ui/saveMenu.js';
import { ExitConfirm }   from './ui/exitConfirm.js';

const modules = {
  INTRO:        IntroScreen,
  MAIN_MENU:    MainMenu,
  LOAD_MENU:    LoadMenu,
  SAVE_MENU:    SaveMenu,
  EXIT_CONFIRM: ExitConfirm
};

let currentState = null;

/**
 * I initialize the router. If the URL contains ?directMain=1,
 * I skip intro and privacy and go straight to MAIN_MENU.
 */
export function initRouter() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('directMain')) {
    switchTo('MAIN_MENU');
  } else {
    switchTo('INTRO');
  }
}

/**
 * I switch from the current state to the given state module.
 */
export function switchTo(state) {
  if (currentState) modules[currentState].hide();
  currentState = state;
  modules[state].show();
}

/**
 * I advance to the next state by flying the background first.
 */
export function advanceTo(state) {
  const handler = () => {
    window.removeEventListener('flightComplete', handler);
    switchTo(state);
  };
  window.addEventListener('flightComplete', handler);
  startFlight();
}
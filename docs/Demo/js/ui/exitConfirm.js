import { switchTo } from '../router.js'

const MAIN_URL = 'index.html?directMain=1'
function goToMainMenu () { window.location.href = MAIN_URL }

export const ExitConfirm = {
  el: null,
  show () {
    this.el = document.createElement('div')
    this.el.className = 'menuContainer'
    this.el.innerHTML = `
      <h2>Exit to Main Menu?</h2>
      <button class="menuButton" id="yesExit">Yes</button>
      <button class="menuButton" id="noExit">No</button>
    `
    document.body.appendChild(this.el)
    document.getElementById('yesExit').onclick = () => goToMainMenu()
    document.getElementById('noExit').onclick = () => switchTo('MAIN_MENU')
  },
  hide () { this.el?.remove() }
}
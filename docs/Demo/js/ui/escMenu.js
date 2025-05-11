import { switchTo } from '../router.js'

const MAIN_URL = 'index.html?directMain=1'
function goToMainMenu () { window.location.href = MAIN_URL }

export const EscMenu = {
  el: null,
  show ({ onResume } = {}) {
    this.el = document.createElement('div')
    this.el.className = 'menuContainer'
    this.el.innerHTML = `
      <h2>Paused</h2>
      <button class="menuButton" id="resumeBtn">Resume</button>
      <button class="menuButton" id="saveBtn">Save</button>
      <button class="menuButton" id="loadBtn">Load</button>
      <button class="menuButton" id="exitBtn">Exit</button>
    `
    document.body.appendChild(this.el)
    document.getElementById('resumeBtn').onclick = () => {
      this.hide()
      onResume?.()
    }
    document.getElementById('saveBtn').onclick = () => {
      this.hide()
      switchTo('SAVE_MENU')
    }
    document.getElementById('loadBtn').onclick = () => {
      this.hide()
      switchTo('LOAD_MENU')
    }
    document.getElementById('exitBtn').onclick = () => goToMainMenu()
  },
  hide () { this.el?.remove() }
}
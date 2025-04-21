import { advanceTo } from '../router.js';

export const SaveMenu = {
  el: null,
  show() {
    this.el = document.createElement('div');
    this.el.className = 'menuContainer';
    this.el.innerHTML = `
      <h2>Create New Save</h2>
      <div class="optionsArea">
        <p>Save Name:</p>
        <input type="text" id="saveNameInput" placeholder="Enter save name" />
      </div>
      <div class="optionsArea">
        <p>Difficulty:</p>
        <label><input type="radio" name="difficulty" value="easy" checked> Easy</label>
        <label><input type="radio" name="difficulty" value="hard"> Hard</label>
      </div>
      <button class="menuButton" id="confirmSave">Save</button>
      <button class="menuButton" id="backFromSave">Back</button>
    `;
    document.body.appendChild(this.el);

    document.getElementById('confirmSave').onclick = () => {
      const name = document.getElementById('saveNameInput').value.trim();
      if (!name) {
        alert('Please enter a save name.');
        return;
      }
      const difficulty = document.querySelector('input[name="difficulty"]:checked').value;
      const saveData = {
        name,
        creationTime: new Date().toLocaleString(),
        currentLevel: 1,   // TODO: 用实际关卡数据替换
        difficulty
      };
      localStorage.setItem(`save_${name}`, JSON.stringify(saveData));
      advanceTo('MAIN_MENU');
    };

    document.getElementById('backFromSave').onclick = () => advanceTo('MAIN_MENU');
  },
  hide() {
    this.el.remove();
  }
};
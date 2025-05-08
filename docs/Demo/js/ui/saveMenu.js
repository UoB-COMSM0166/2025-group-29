// js/ui/saveMenu.js
import { supabase } from '../supabase.js';
import { switchTo } from '../router.js';

export const SaveMenu = {
  el: null,
  show() {
    this.el = document.createElement('div');
    this.el.className = 'menuContainer';
    this.el.innerHTML = `
      <h2>Create New Save</h2>
      <div class="optionsArea">
        <p>Save Name:</p>
        <input
          type="text"
          id="saveNameInput"
          placeholder="Enter save name"
          style="width: 100%; font-size: 1.2em; padding: 0.5em;"
        />
      </div>
      <div class="optionsArea">
        <p>Mode:</p>
        <label><input type="radio" name="mode" value="easy" checked> Easy</label>
        <label><input type="radio" name="mode" value="hard"> Hard</label>
      </div>
      <button class="menuButton" id="confirmSave">Save & Play</button>
      <button class="menuButton" id="backFromSave">Back</button>
    `;
    document.body.appendChild(this.el);

    // 插入新存档，初始化 skills 为空数组
    document.getElementById('confirmSave').onclick = async () => {
      const name = document.getElementById('saveNameInput').value.trim();
      if (!name) return alert('Please enter a save name.');
      const mode = document.querySelector('input[name="mode"]:checked').value;
      const { data, error } = await supabase
        .from('saves')
        .insert([{ name, current_level: 1, mode, skills: [],cumulative_score: 0}])
        .select();
      if (error) return alert('Save failed: ' + error.message);
      const saveId = data[0].id;
      window.location.href = `game.html?saveId=${saveId}`;
    };

    // 返回主菜单
    document.getElementById('backFromSave').onclick = () => switchTo('MAIN_MENU');
  },

  hide() {
    if (this.el) this.el.remove();
  }
};

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
        <input type="text" id="saveNameInput" placeholder="Enter save name" />
      </div>
      <div class="optionsArea">
        <p>Mode:</p>
        <label><input type="radio" name="mode" value="easy" checked> Easy</label>
        <label><input type="radio" name="mode" value="hard"> Hard</label>
      </div>
      <button class="menuButton" id="confirmSave">Save & Play</button>
      <button class="menuButton" id="deleteSave">Delete Save</button>
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
        .insert([{
          name,
          current_level: 1,
          mode,
          skills: []      // 初始化为空数组
        }])
        .select();
      if (error) return alert('Save failed: ' + error.message);
      const saveId = data[0].id;
      window.location.href = `game.html?saveId=${saveId}`;
    };

    // 按名称删除
    document.getElementById('deleteSave').onclick = async () => {
      const name = document.getElementById('saveNameInput').value.trim();
      if (!name) return alert('Enter the save name to delete.');
      const { error } = await supabase.from('saves').delete().eq('name', name);
      if (error) return alert('Delete failed: ' + error.message);
      alert(`Save '${name}' deleted.`);
      document.getElementById('saveNameInput').value = '';
    };

    document.getElementById('backFromSave').onclick = () => switchTo('MAIN_MENU');
  },
  hide() {
    if (this.el) this.el.remove();
  }
};
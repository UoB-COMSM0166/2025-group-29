import { advanceTo, switchTo } from '../router.js';

export const LoadMenu = {
  el: null,
  show() {
    this.el = document.createElement('div');
    this.el.className = 'loadContainer';

    // 收集所有以 save_ 开头的存档
    const saves = Object.keys(localStorage)
      .filter(key => key.startsWith('save_'))
      .map(key => JSON.parse(localStorage.getItem(key)));

    // 构造表格行
    const rows = saves.length
      ? saves.map(s => {
          const created = new Date(s.creationTime);
          const diffMs  = Date.now() - created.getTime();
          const h = Math.floor(diffMs / 3600000);
          const m = Math.floor((diffMs % 3600000) / 60000);
          const playTime = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
          return `
            <tr data-key="save_${s.name}">
              <td>${s.creationTime}</td>
              <td>${s.name}</td>
              <td>${s.currentLevel}</td>
              <td>${playTime}</td>
              <td>${s.difficulty}</td>
            </tr>
          `;
        }).join('')
      : `<tr><td colspan="5">(no saves found)</td></tr>`;

    this.el.innerHTML = `
      <h2>Load Game</h2>
      <div class="tableContainer">
        <table class="loadTable">
          <thead>
            <tr>
              <th>Created</th>
              <th>Save Name</th>
              <th>Level</th>
              <th>Playtime</th>
              <th>Difficulty</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
      <button class="menuButton" id="backFromLoad">Back</button>
    `;
    document.body.appendChild(this.el);

    // 点击任意行加载存档
    this.el.querySelectorAll('tbody tr[data-key]').forEach(tr => {
      tr.addEventListener('click', () => {
        const key  = tr.getAttribute('data-key');
        const data = JSON.parse(localStorage.getItem(key));
        console.log('Loaded save:', data);
        // TODO: 在此根据 data 恢复游戏状态
        advanceTo('MAIN_MENU');
      });
    });

    document.getElementById('backFromLoad').onclick = () => switchTo('MAIN_MENU');
  },
  hide() {
    this.el.remove();
  }
};
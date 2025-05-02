// js/ui/loadMenu.js
import { supabase } from '../supabase.js';
import { switchTo } from '../router.js';

export const LoadMenu = {
  el: null,
  show: async function() {
    this.el = document.createElement('div');
    this.el.className = 'loadContainer';

    let { data: saves, error } = await supabase
      .from('saves')
      .select('*')
      .order('creation_time', { ascending: false });
    if (error) {
      alert('Load failed: ' + error.message);
      saves = [];
    }

    const rows = saves.length
      ? saves.map(s => {
          const created = new Date(s.creation_time);
          const diffMs = Date.now() - created.getTime();
          const h = Math.floor(diffMs/3600000);
          const m = Math.floor((diffMs%3600000)/60000);
          const playTime = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
          return `
            <tr data-id="${s.id}">
              <td>${created.toLocaleString()}</td>
              <td>${s.name}</td>
              <td>${s.current_level}</td>
              <td>${playTime}</td>
              <td>${s.mode}</td>
              <td>
                <button class="menuButton deleteBtn" data-id="${s.id}">Delete</button>
              </td>
            </tr>`;
        }).join('')
      : `<tr><td colspan="6">(no saves found)</td></tr>`;

    this.el.innerHTML = `
      <h2>Load Game</h2>
      <div class="tableContainer">
        <table class="loadTable">
          <thead>
            <tr>
              <th>Created</th><th>Name</th><th>Level</th>
              <th>Playtime</th><th>Mode</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <button class="menuButton" id="backFromLoad">Back</button>
    `;
    document.body.appendChild(this.el);

    // 加载存档
    this.el.querySelectorAll('tbody tr[data-id]').forEach(tr => {
      tr.addEventListener('click', () => {
        const id = tr.getAttribute('data-id');
        window.location.href = `game.html?saveId=${id}`;
      });
    });

    // 删除存档
    this.el.querySelectorAll('.deleteBtn').forEach(btn => {
      btn.addEventListener('click', async e => {
        e.stopPropagation();
        if (!confirm('Delete this save?')) return;
        const id = btn.getAttribute('data-id');
        const { error } = await supabase.from('saves').delete().eq('id', id);
        if (error) return alert('Delete failed: ' + error.message);
        this.hide();
        this.show();
      });
    });

    document.getElementById('backFromLoad').onclick = () => switchTo('MAIN_MENU');
  },
  hide() {
    if (this.el) this.el.remove();
  }
};
// js/ui/loadMenu.js
import { supabase } from '../supabase.js';
import { switchTo } from '../router.js';

export const LoadMenu = {
  el: null,
  show: async function() {
    this.el = document.createElement('div');
    this.el.className = 'loadContainer';

    // 从数据库读取存档，并多取 skills 和 cumulative_score 列
    let { data: saves, error } = await supabase
      .from('saves')
      .select(`
        id,
        name,
        current_level,
        mode,
        creation_time,
        skills,
        cumulative_score
      `)
      .order('creation_time', { ascending: false });
    if (error) {
      alert('Load failed: ' + error.message);
      saves = [];
    }

    // 构造表格行
    const rows = saves.length
      ? saves.map(s => {
          const created   = new Date(s.creation_time).toLocaleString();
          const skillsStr = (s.skills || []).join(', ');
          const cumScore  = s.cumulative_score ?? 0;

          return `
            <tr data-id="${s.id}">
              <td>${created}</td>
              <td>${s.name}</td>
              <td>${s.current_level}</td>
              <td>${s.mode}</td>
              <td>${skillsStr}</td>
              <td>${cumScore}</td>
              <td>
                <button class="menuButton deleteBtn" data-id="${s.id}">
                  Delete
                </button>
              </td>
            </tr>
          `;
        }).join('')
      : `<tr><td colspan="7">(no saves found)</td></tr>`;

    // 渲染整个界面
    this.el.innerHTML = `
      <h2>Load Game</h2>
      <div class="tableContainer">
        <table class="loadTable">
          <thead>
            <tr>
              <th>Created</th>
              <th>Name</th>
              <th>Level</th>
              <th>Mode</th>
              <th>Skills</th>
              <th>Total Score</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <button class="menuButton" id="backFromLoad">Back</button>
    `;
    document.body.appendChild(this.el);

    // 点击行加载存档
    this.el.querySelectorAll('tbody tr[data-id]').forEach(tr => {
      tr.addEventListener('click', () => {
        const id = tr.getAttribute('data-id');
        window.location.href = `game.html?saveId=${id}`;
      });
    });

    // 删除按钮逻辑
    this.el.querySelectorAll('.deleteBtn').forEach(btn => {
      btn.addEventListener('click', async e => {
        e.stopPropagation();
        if (!confirm('Delete this save?')) return;
        const id = btn.getAttribute('data-id');
        const { error } = await supabase
          .from('saves')
          .delete()
          .eq('id', id);
        if (error) {
          alert('Delete failed: ' + error.message);
        } else {
          this.hide();
          this.show();
        }
      });
    });

    // 返回主菜单
    document.getElementById('backFromLoad').onclick = () => switchTo('MAIN_MENU');
  },
  hide() {
    if (this.el) this.el.remove();
  }
};
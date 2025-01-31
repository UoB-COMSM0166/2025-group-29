const SUPABASE_URL = 'https://rvehrbiucrilpuvvkjbs.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2ZWhyYml1Y3JpbHB1dnZramJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgyNzk5NTAsImV4cCI6MjA1Mzg1NTk1MH0.YKMde10eNdODGFjTSkhEFQD95LH7ChGcIVd_25g4odE';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', async () => {
  await fetchTasks();
  document.getElementById('add-todo-btn').addEventListener('click', async () => {
    const input = document.getElementById('todo-input');
    const title = input.value.trim();
    if (title) {
      await addTask(title, 'todo');
      input.value = '';
      await fetchTasks();
    }
  });
  initDragEvents();
});

async function fetchTasks() {
  const { data, error } = await supabase.from('kanban_tasks').select('*');
  if (error) console.error('Fetch error:', error);
  renderTasks(data || []);
}

function renderTasks(tasks) {
  clearColumns();
  tasks.forEach(({ id, columns }) => {
    if (!columns) return;
    const el = document.createElement('div');
    el.className = 'task';
    el.draggable = true;
    el.textContent = columns.title;
    el.dataset.id = id;
    const col = columns.status || 'todo';
    if (col === 'in-progress') document.getElementById('in-progress-tasks').appendChild(el);
    else if (col === 'parked') document.getElementById('parked-tasks').appendChild(el);
    else if (col === 'done') document.getElementById('done-tasks').appendChild(el);
    else document.getElementById('todo-tasks').appendChild(el);
    el.addEventListener('dragstart', e => {
      el.classList.add('dragging');
      e.dataTransfer.setData('text/plain', id);
    });
    el.addEventListener('dragend', () => el.classList.remove('dragging'));
  });
}

function clearColumns() {
  ['todo-tasks', 'in-progress-tasks', 'parked-tasks', 'done-tasks'].forEach(id => {
    document.getElementById(id).innerHTML = '';
  });
}

async function addTask(title, status) {
  const { error } = await supabase.from('kanban_tasks').insert([{ columns: { title, status } }]);
  if (error) console.error('Insert error:', error);
}

async function updateTaskStatus(id, newStatus) {
  const { data, error: fetchErr } = await supabase
    .from('kanban_tasks')
    .select('columns')
    .eq('id', id)
    .single();
  if (fetchErr) {
    console.error('Select error:', fetchErr);
    return;
  }
  const updated = { ...data.columns, status: newStatus };
  const { error: updateErr } = await supabase
    .from('kanban_tasks')
    .update({ columns: updated })
    .eq('id', id);
  if (updateErr) console.error('Update error:', updateErr);
}

function initDragEvents() {
  document.querySelectorAll('.column').forEach(col => {
    col.addEventListener('dragover', e => {
      e.preventDefault();
      const dragging = document.querySelector('.dragging');
      col.querySelector('.tasks').appendChild(dragging);
    });
    col.addEventListener('drop', async e => {
      e.preventDefault();
      const taskId = e.dataTransfer.getData('text/plain');
      let newStatus = 'todo';
      if (col.id === 'in-progress-column') newStatus = 'in-progress';
      else if (col.id === 'parked-column') newStatus = 'parked';
      else if (col.id === 'done-column') newStatus = 'done';
      await updateTaskStatus(taskId, newStatus);
      await fetchTasks();
    });
  });
}
const SUPABASE_URL = 'https://rvehrbiucrilpuvvkjbs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2ZWhyYml1Y3JpbHB1dnZramJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgyNzk5NTAsImV4cCI6MjA1Mzg1NTk1MH0.YKMde10eNdODGFjTSkhEFQD95LH7ChGcIVd_25g4odE';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('usernameSubmit').addEventListener('click', async () => {
    currentUser = document.getElementById('usernameSelect').value;
    document.getElementById('usernameModal').style.display = 'none';
    initializeBoard();
  });
});

function formatUKDate(dateInput) {
  // Accepts a Date object or a string in "YYYY-MM-DD" format and returns "DD/MM/YYYY"
  if (typeof dateInput === 'object') {
    const d = dateInput;
    const day = ('0' + d.getDate()).slice(-2);
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } else if (typeof dateInput === 'string') {
    const parts = dateInput.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }
  return dateInput;
}

async function initializeBoard() {
  // Set default deadline value to today in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('deadline-input').value = today;

  await fetchTasks();
  document.getElementById('add-todo-btn').addEventListener('click', async () => {
    const input = document.getElementById('todo-input');
    const deadlineInput = document.getElementById('deadline-input');
    const title = input.value.trim();
    let deadline = deadlineInput.value;
    if (!deadline) {
      deadline = formatUKDate(new Date());
    } else {
      deadline = formatUKDate(deadline);
    }
    if (title) {
      await addTask(title, 'todo', deadline);
      input.value = '';
      deadlineInput.value = today;
      await fetchTasks();
    }
  });
  initDragEvents();
}

async function fetchTasks() {
  const { data, error } = await supabaseClient.from('Kanban').select('*');
  if (error) console.error('Fetch error:', error);
  renderTasks(data || []);
}

function renderTasks(tasks) {
  clearColumns();
  tasks.forEach(({ id, columns }) => {
    if (!columns || !columns.title) return;
    const el = document.createElement('div');
    el.className = 'task';
    el.draggable = true;
    const deadlineFormatted = columns.deadline ? formatUKDate(columns.deadline) : '';
    el.innerHTML = `<div>${columns.title}</div><div class="task-info">${columns.author} | ${deadlineFormatted}</div>`;
    el.dataset.id = id;
    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
    delBtn.className = 'delete-btn';
    delBtn.addEventListener('click', async () => {
      await deleteTask(id);
      await fetchTasks();
    });
    el.appendChild(delBtn);
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

async function addTask(title, status, deadline) {
  const { error } = await supabaseClient.from('Kanban').insert([{ columns: { title, status, author: currentUser, deadline } }]);
  if (error) console.error('Insert error:', error);
}

async function updateTaskStatus(id, newStatus) {
  const { data, error: fetchErr } = await supabaseClient
    .from('Kanban')
    .select('columns')
    .eq('id', id)
    .single();
  if (fetchErr) {
    console.error('Select error:', fetchErr);
    return;
  }
  const updated = { ...data.columns, status: newStatus };
  const { error: updateErr } = await supabaseClient
    .from('Kanban')
    .update({ columns: updated })
    .eq('id', id);
  if (updateErr) console.error('Update error:', updateErr);
}

async function deleteTask(id) {
  const { error } = await supabaseClient.from('Kanban').delete().eq('id', id);
  if (error) console.error('Delete error:', error);
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
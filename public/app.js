const api = '/api/tasks';
const tasksEl = document.getElementById('tasks');
const form = document.getElementById('task-form');

async function loadTasks() {
  const res = await fetch(api);
  const tasks = await res.json();
  render(tasks);
}

function render(tasks) {
  tasksEl.innerHTML = '';
  tasks.forEach((t) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <strong>${escapeHtml(t.title)}</strong>
      <p>${escapeHtml(t.description || '')}</p>
      <small>${escapeHtml(t.status)}</small>
      <div class="actions">
        <button data-id="${t.id}" class="toggle">${t.status === 'done' ? 'Przywróć' : 'Zakończ'}</button>
        <button data-id="${t.id}" class="delete">Usuń</button>
      </div>
    `;
    tasksEl.appendChild(li);
  });
}

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'
}[c])); }

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('title').value.trim();
  const description = document.getElementById('description').value.trim();
  if (!title) return;
  await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, description }) });
  form.reset();
  await loadTasks();
});

tasksEl.addEventListener('click', async (e) => {
  const id = e.target.dataset.id;
  if (!id) return;
  if (e.target.classList.contains('delete')) {
    await fetch(`${api}/${id}`, { method: 'DELETE' });
    return loadTasks();
  }
  if (e.target.classList.contains('toggle')) {
    // fetch current task to toggle status
    const res = await fetch(api);
    const tasks = await res.json();
    const t = tasks.find(x => x.id == id);
    if (!t) return;
    const newStatus = t.status === 'done' ? 'todo' : 'done';
    await fetch(`${api}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: t.title, description: t.description, status: newStatus }) });
    return loadTasks();
  }
});

// real-time updates
const socket = io();
socket.on('tasks-updated', () => loadTasks());

loadTasks();

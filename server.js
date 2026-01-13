const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const cors = require('cors');
const { initDB } = require('./db');

const app = express();
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const db = initDB();

function broadcastUpdate() {
  io.emit('tasks-updated');
}

app.get('/api/tasks', (req, res) => {
  db.all('SELECT * FROM tasks ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/tasks', (req, res) => {
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  const stmt = db.prepare('INSERT INTO tasks (title, description, status) VALUES (?,?,?)');
  stmt.run(title, description || '', 'todo', function (err) {
    if (err) return res.status(500).json({ error: err.message });
    const id = this.lastID;
    stmt.finalize(() => {
      broadcastUpdate();
      res.status(201).json({ id, title, description, status: 'todo' });
    });
  });
});

app.put('/api/tasks/:id', (req, res) => {
  const id = req.params.id;
  const { title, description, status } = req.body;
  db.run(
    'UPDATE tasks SET title = ?, description = ?, status = ? WHERE id = ?',
    [title, description, status, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
      broadcastUpdate();
      res.json({ id: Number(id), title, description, status });
    }
  );
});

app.delete('/api/tasks/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM tasks WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
    broadcastUpdate();
    res.json({ deleted: id });
  });
});

io.on('connection', (socket) => {
  // client can listen for 'tasks-updated'
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

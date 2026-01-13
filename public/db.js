const sqlite3 = require('sqlite3').verbose();

function initDB() {
  const db = new sqlite3.Database('./tasks.db', (err) => {
    if (err) console.error('DB open error', err);
  });

  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL
      )
    `);
  });

  return db;
}

module.exports = { initDB };

const path = require("path");
const Database = require("better-sqlite3");

// Single file DB — this is the entire "database server" for this project.
// Path can be overridden via env var so Render/Railway can point it at a
// persistent disk mount if one is configured.
const DB_PATH = process.env.DB_PATH || path.join(__dirname, "..", "data", "data.sqlite");

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

// Core tables (original schema) plus additive columns for new features.
db.exec(`
  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Open',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id TEXT NOT NULL,
    note_text TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (ticket_id) REFERENCES tickets (ticket_id)
  );

  CREATE TABLE IF NOT EXISTS activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    message TEXT NOT NULL,
    author TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (ticket_id) REFERENCES tickets (ticket_id)
  );
`);

function ensureColumn(table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);
  if (!cols.includes(column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

// Additive columns — never rewrite the original tables.
ensureColumn("tickets", "priority", "TEXT NOT NULL DEFAULT 'Medium'");
ensureColumn("tickets", "assignee", "TEXT");
ensureColumn("tickets", "first_response_due", "TEXT");
ensureColumn("tickets", "resolve_due", "TEXT");
ensureColumn("tickets", "first_responded_at", "TEXT");
ensureColumn("tickets", "resolved_at", "TEXT");
ensureColumn("notes", "note_type", "TEXT NOT NULL DEFAULT 'customer'");
ensureColumn("notes", "author", "TEXT");

// Backfill SLA windows for tickets created before these columns existed.
const missingSla = db
  .prepare("SELECT ticket_id, created_at FROM tickets WHERE first_response_due IS NULL")
  .all();
const setSla = db.prepare(
  "UPDATE tickets SET first_response_due = ?, resolve_due = ? WHERE ticket_id = ?"
);
for (const t of missingSla) {
  const created = new Date(t.created_at).getTime();
  setSla.run(
    new Date(created + 4 * 60 * 60 * 1000).toISOString(),
    new Date(created + 24 * 60 * 60 * 1000).toISOString(),
    t.ticket_id
  );
}

db.prepare(
  `UPDATE tickets SET resolved_at = updated_at
   WHERE status = 'Closed' AND resolved_at IS NULL`
).run();

db.prepare(
  `UPDATE tickets SET first_responded_at = created_at
   WHERE status != 'Open' AND first_responded_at IS NULL`
).run();

module.exports = db;

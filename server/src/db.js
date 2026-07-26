const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

// Single file DB — this is the entire "database server" for this project.
// 
// persistent disk mount if one is configured.
const DB_PATH = process.env.DB_PATH || path.join(__dirname, "..", "data", "data.sqlite");

// Git doesn't track empty folders, so the "data" directory itself may not
// exist yet on a fresh clone/deploy (only files inside it get committed).
// Create it up front so better-sqlite3 has somewhere to put the file.
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

// Expanded schema — tickets, notes, and activity — covering the fields
// meta.js and the richer version of tickets.js rely on (priority, assignee,
// SLA due dates, response/resolution timestamps, note authorship, and an
// activity/audit log per ticket).
db.exec(`
  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Open',
    priority TEXT NOT NULL DEFAULT 'Medium',
    assignee TEXT,
    first_response_due TEXT,
    resolve_due TEXT,
    first_responded_at TEXT,
    resolved_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id TEXT NOT NULL,
    note_text TEXT NOT NULL,
    note_type TEXT NOT NULL DEFAULT 'customer',
    author TEXT,
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

module.exports = db;

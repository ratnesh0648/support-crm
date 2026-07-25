const express = require("express");
const db = require("../db");
const {
  VALID_STATUSES,
  VALID_PRIORITIES,
  VALID_NOTE_TYPES,
  AGENTS,
  SLA_FIRST_RESPONSE_HOURS,
  SLA_RESOLVE_HOURS,
} = require("../constants");

const router = express.Router();

const PRIORITY_ORDER = { Urgent: 0, High: 1, Medium: 2, Low: 3 };

function nowISO() {
  return new Date().toISOString();
}

function addHours(iso, hours) {
  return new Date(new Date(iso).getTime() + hours * 60 * 60 * 1000).toISOString();
}

function nextTicketId() {
  const row = db.prepare("SELECT ticket_id FROM tickets ORDER BY id DESC LIMIT 1").get();
  let nextNumber = 1;
  if (row) {
    const match = row.ticket_id.match(/(\d+)$/);
    if (match) nextNumber = parseInt(match[1], 10) + 1;
  }
  return `TKT-${String(nextNumber).padStart(3, "0")}`;
}

function getNotesFor(ticketId) {
  return db
    .prepare(
      `SELECT id, note_text, note_type, author, created_at
       FROM notes WHERE ticket_id = ? ORDER BY id ASC`
    )
    .all(ticketId);
}

function getActivityFor(ticketId) {
  return db
    .prepare(
      `SELECT id, event_type, message, author, created_at
       FROM activity WHERE ticket_id = ? ORDER BY id ASC`
    )
    .all(ticketId);
}

function logActivity(ticketId, event_type, message, author = null) {
  db.prepare(
    `INSERT INTO activity (ticket_id, event_type, message, author, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(ticketId, event_type, message, author, nowISO());
}

function agentName(idOrName) {
  if (!idOrName) return null;
  const found = AGENTS.find((a) => a.id === idOrName || a.name === idOrName);
  return found ? found.name : idOrName;
}

/**
 * POST /api/tickets
 * Body: { customer_name, customer_email, subject, description, priority?, assignee? }
 */
router.post("/", (req, res) => {
  const {
    customer_name,
    customer_email,
    subject,
    description,
    priority = "Medium",
    assignee = null,
  } = req.body || {};

  if (!customer_name || !customer_email || !subject || !description) {
    return res.status(400).json({
      error: "customer_name, customer_email, subject, and description are all required",
    });
  }

  if (priority && !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({
      error: `priority must be one of ${VALID_PRIORITIES.join(", ")}`,
    });
  }

  const ticket_id = nextTicketId();
  const created_at = nowISO();
  const first_response_due = addHours(created_at, SLA_FIRST_RESPONSE_HOURS);
  const resolve_due = addHours(created_at, SLA_RESOLVE_HOURS);
  const assigneeName = agentName(assignee);

  db.prepare(
    `INSERT INTO tickets (
       ticket_id, customer_name, customer_email, subject, description, status,
       priority, assignee, first_response_due, resolve_due, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, 'Open', ?, ?, ?, ?, ?, ?)`
  ).run(
    ticket_id,
    customer_name,
    customer_email,
    subject,
    description,
    priority,
    assigneeName,
    first_response_due,
    resolve_due,
    created_at,
    created_at
  );

  logActivity(ticket_id, "created", `Ticket created with priority ${priority}`);
  if (assigneeName) {
    logActivity(ticket_id, "assigned", `Assigned to ${assigneeName}`);
  }

  res.status(201).json({ ticket_id, created_at });
});

/**
 * GET /api/tickets?status=&search=&priority=&assignee=&mine=
 * sort=priority|newest (default newest)
 */
router.get("/", (req, res) => {
  const { status, search, priority, assignee, mine, sort } = req.query;

  let query = `
    SELECT ticket_id, customer_name, customer_email, subject, status, priority, assignee,
           first_response_due, resolve_due, first_responded_at, resolved_at,
           created_at, updated_at
    FROM tickets`;
  const conditions = [];
  const params = [];

  if (status && VALID_STATUSES.includes(status)) {
    conditions.push("status = ?");
    params.push(status);
  }

  if (priority && VALID_PRIORITIES.includes(priority)) {
    conditions.push("priority = ?");
    params.push(priority);
  }

  if (assignee) {
    conditions.push("assignee = ?");
    params.push(agentName(assignee) || assignee);
  }

  if (mine) {
    conditions.push("assignee = ?");
    params.push(agentName(mine) || mine);
  }

  if (search) {
    conditions.push(
      `(customer_name LIKE ? OR customer_email LIKE ? OR ticket_id LIKE ?
        OR subject LIKE ? OR description LIKE ? OR assignee LIKE ?)`
    );
    const like = `%${search}%`;
    params.push(like, like, like, like, like, like);
  }

  if (conditions.length) {
    query += " WHERE " + conditions.join(" AND ");
  }

  const tickets = db.prepare(query).all(...params);

  if (sort === "priority") {
    tickets.sort((a, b) => {
      const pa = PRIORITY_ORDER[a.priority] ?? 9;
      const pb = PRIORITY_ORDER[b.priority] ?? 9;
      if (pa !== pb) return pa - pb;
      return new Date(b.created_at) - new Date(a.created_at);
    });
  } else {
    tickets.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  res.json(tickets);
});

/**
 * GET /api/tickets/:ticket_id
 */
router.get("/:ticket_id", (req, res) => {
  const ticket = db.prepare("SELECT * FROM tickets WHERE ticket_id = ?").get(req.params.ticket_id);
  if (!ticket) return res.status(404).json({ error: "Ticket not found" });

  ticket.notes = getNotesFor(ticket.ticket_id);
  ticket.activity = getActivityFor(ticket.ticket_id);
  res.json(ticket);
});

/**
 * PUT /api/tickets/:ticket_id
 * Body: { status?, notes?, note_type?, priority?, assignee?, author? }
 * "notes" remains a single new comment to append (backward compatible).
 */
router.put("/:ticket_id", (req, res) => {
  const { ticket_id } = req.params;
  const { status, notes, note_type, priority, assignee, author } = req.body || {};

  const ticket = db.prepare("SELECT * FROM tickets WHERE ticket_id = ?").get(ticket_id);
  if (!ticket) return res.status(404).json({ error: "Ticket not found" });

  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of ${VALID_STATUSES.join(", ")}` });
  }
  if (priority && !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({
      error: `priority must be one of ${VALID_PRIORITIES.join(", ")}`,
    });
  }
  if (note_type && !VALID_NOTE_TYPES.includes(note_type)) {
    return res.status(400).json({
      error: `note_type must be one of ${VALID_NOTE_TYPES.join(", ")}`,
    });
  }

  const updated_at = nowISO();
  const actor = agentName(author) || author || null;
  let touched = false;

  if (status && status !== ticket.status) {
    db.prepare("UPDATE tickets SET status = ?, updated_at = ? WHERE ticket_id = ?").run(
      status,
      updated_at,
      ticket_id
    );
    logActivity(ticket_id, "status", `Status changed from ${ticket.status} to ${status}`, actor);
    touched = true;

    if (!ticket.first_responded_at && status !== "Open") {
      db.prepare("UPDATE tickets SET first_responded_at = ? WHERE ticket_id = ?").run(
        updated_at,
        ticket_id
      );
    }

    if (status === "Closed") {
      db.prepare("UPDATE tickets SET resolved_at = ? WHERE ticket_id = ?").run(updated_at, ticket_id);
    } else if (ticket.status === "Closed") {
      db.prepare("UPDATE tickets SET resolved_at = NULL WHERE ticket_id = ?").run(ticket_id);
    }
  }

  if (priority && priority !== ticket.priority) {
    db.prepare("UPDATE tickets SET priority = ?, updated_at = ? WHERE ticket_id = ?").run(
      priority,
      updated_at,
      ticket_id
    );
    logActivity(ticket_id, "priority", `Priority changed to ${priority}`, actor);
    touched = true;
  }

  if (assignee !== undefined) {
    const nextAssignee = assignee ? agentName(assignee) : null;
    if (nextAssignee !== ticket.assignee) {
      db.prepare("UPDATE tickets SET assignee = ?, updated_at = ? WHERE ticket_id = ?").run(
        nextAssignee,
        updated_at,
        ticket_id
      );
      logActivity(
        ticket_id,
        "assigned",
        nextAssignee ? `Assigned to ${nextAssignee}` : "Unassigned",
        actor
      );
      touched = true;
    }
  }

  if (notes && notes.trim()) {
    const type = note_type && VALID_NOTE_TYPES.includes(note_type) ? note_type : "customer";
    db.prepare(
      `INSERT INTO notes (ticket_id, note_text, note_type, author, created_at)
       VALUES (?, ?, ?, ?, ?)`
    ).run(ticket_id, notes.trim(), type, actor, updated_at);

    db.prepare("UPDATE tickets SET updated_at = ? WHERE ticket_id = ?").run(updated_at, ticket_id);

    const label = type === "internal" ? "Internal note added" : "Customer reply sent";
    logActivity(ticket_id, type === "internal" ? "internal_note" : "reply", label, actor);

    if (!ticket.first_responded_at && type === "customer") {
      db.prepare("UPDATE tickets SET first_responded_at = ? WHERE ticket_id = ?").run(
        updated_at,
        ticket_id
      );
    }
    touched = true;
  }

  if (!touched) {
    return res.status(400).json({
      error: "Provide at least one of status, notes, priority, or assignee",
    });
  }

  res.json({ success: true, updated_at });
});

module.exports = router;

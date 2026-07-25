const express = require("express");
const db = require("../db");
const {
  AGENTS,
  VALID_STATUSES,
  VALID_PRIORITIES,
  REPLY_TEMPLATES,
  SLA_FIRST_RESPONSE_HOURS,
  SLA_RESOLVE_HOURS,
} = require("../constants");

const router = express.Router();

function nowISO() {
  return new Date().toISOString();
}

function addHours(iso, hours) {
  return new Date(new Date(iso).getTime() + hours * 60 * 60 * 1000).toISOString();
}

function startOfDayISO(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}

/**
 * GET /api/meta/agents
 * GET /api/meta/templates
 * GET /api/meta/stats
 * POST /api/meta/auth  { agent_id }
 * POST /api/meta/seed
 */
router.get("/agents", (_req, res) => {
  res.json(AGENTS);
});

router.get("/templates", (_req, res) => {
  res.json(REPLY_TEMPLATES);
});

router.post("/auth", (req, res) => {
  const { agent_id } = req.body || {};
  const agent = AGENTS.find((a) => a.id === agent_id);
  if (!agent) return res.status(400).json({ error: "Unknown agent" });
  res.json({ ok: true, agent });
});

router.get("/stats", (_req, res) => {
  const byStatus = {};
  for (const s of VALID_STATUSES) {
    byStatus[s] = db.prepare("SELECT COUNT(*) AS c FROM tickets WHERE status = ?").get(s).c;
  }

  const byPriority = {};
  for (const p of VALID_PRIORITIES) {
    byPriority[p] = db.prepare("SELECT COUNT(*) AS c FROM tickets WHERE priority = ?").get(p).c;
  }

  const today = startOfDayISO();
  const createdToday = db
    .prepare("SELECT COUNT(*) AS c FROM tickets WHERE created_at >= ?")
    .get(today).c;

  const unassigned = db
    .prepare("SELECT COUNT(*) AS c FROM tickets WHERE assignee IS NULL AND status != 'Closed'")
    .get().c;

  const openTickets = db
    .prepare(
      `SELECT first_response_due, resolve_due, first_responded_at, resolved_at, status, created_at
       FROM tickets WHERE status != 'Closed'`
    )
    .all();

  const now = Date.now();
  let slaBreached = 0;
  let slaAtRisk = 0;
  for (const t of openTickets) {
    const responseDue = t.first_response_due ? new Date(t.first_response_due).getTime() : null;
    const resolveDue = t.resolve_due ? new Date(t.resolve_due).getTime() : null;
    const responseOk = t.first_responded_at || !responseDue;
    const resolveOk = !resolveDue;

    if ((!responseOk && responseDue < now) || (resolveDue && resolveDue < now)) {
      slaBreached += 1;
    } else if (
      (!responseOk && responseDue - now < 60 * 60 * 1000) ||
      (resolveDue && resolveDue - now < 2 * 60 * 60 * 1000)
    ) {
      slaAtRisk += 1;
    }
  }

  // Avg hours to close (closed tickets with resolved_at)
  const closed = db
    .prepare(
      `SELECT created_at, resolved_at FROM tickets
       WHERE status = 'Closed' AND resolved_at IS NOT NULL`
    )
    .all();
  let avgCloseHours = null;
  if (closed.length) {
    const totalMs = closed.reduce(
      (sum, t) => sum + (new Date(t.resolved_at) - new Date(t.created_at)),
      0
    );
    avgCloseHours = Math.round((totalMs / closed.length / (1000 * 60 * 60)) * 10) / 10;
  }

  // Tickets created per day (last 7 days)
  const byDay = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - i);
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    const count = db
      .prepare("SELECT COUNT(*) AS c FROM tickets WHERE created_at >= ? AND created_at < ?")
      .get(day.toISOString(), next.toISOString()).c;
    byDay.push({
      date: day.toISOString().slice(0, 10),
      label: day.toLocaleDateString(undefined, { weekday: "short" }),
      count,
    });
  }

  res.json({
    byStatus,
    byPriority,
    createdToday,
    unassigned,
    slaBreached,
    slaAtRisk,
    avgCloseHours,
    byDay,
    total: Object.values(byStatus).reduce((a, b) => a + b, 0),
    sla: {
      firstResponseHours: SLA_FIRST_RESPONSE_HOURS,
      resolveHours: SLA_RESOLVE_HOURS,
    },
  });
});

router.post("/seed", (req, res) => {
  const force = Boolean(req.body?.force);
  const existing = db.prepare("SELECT COUNT(*) AS c FROM tickets").get().c;
  if (existing > 0 && !force) {
    return res.status(409).json({
      error: "Tickets already exist. Pass { force: true } to add demo tickets anyway.",
      existing,
    });
  }

  const subjects = {
    Open: [
      "Cannot reset password",
      "Billing page blank",
      "Mobile app crashes on launch",
      "Wrong timezone on invoices",
      "Unable to upload attachment",
    ],
    "In Progress": [
      "SSO login fails intermittently",
      "Webhook deliveries retrying forever",
      "API rate limit too aggressive",
      "Dark mode contrast issue",
      "Duplicate charges on renewal",
    ],
    Closed: [
      "Forgot password email fixed",
      "Typo on pricing page",
      "Missing FAQ article restored",
      "Spam filter false positive",
      "Broken help center link",
    ],
  };

  const people = [
    ["Aisha Khan", "aisha.khan@example.com"],
    ["Ben Carter", "ben.carter@example.com"],
    ["Chloe Ng", "chloe.ng@example.com"],
    ["Diego Ruiz", "diego.ruiz@example.com"],
    ["Emma Walsh", "emma.walsh@example.com"],
  ];

  const priorities = ["Low", "Medium", "High", "Urgent", "Medium"];
  let created = 0;
  const insert = db.prepare(
    `INSERT INTO tickets (
       ticket_id, customer_name, customer_email, subject, description, status,
       priority, assignee, first_response_due, resolve_due, first_responded_at,
       resolved_at, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertActivity = db.prepare(
    `INSERT INTO activity (ticket_id, event_type, message, author, created_at)
     VALUES (?, ?, ?, ?, ?)`
  );
  const insertNote = db.prepare(
    `INSERT INTO notes (ticket_id, note_text, note_type, author, created_at)
     VALUES (?, ?, ?, ?, ?)`
  );

  const last = db.prepare("SELECT ticket_id FROM tickets ORDER BY id DESC LIMIT 1").get();
  let n = 1;
  if (last) {
    const m = last.ticket_id.match(/(\d+)$/);
    if (m) n = parseInt(m[1], 10) + 1;
  }

  const tx = db.transaction(() => {
    for (const status of VALID_STATUSES) {
      subjects[status].forEach((subject, i) => {
        const ticket_id = `TKT-${String(n++).padStart(3, "0")}`;
        const created_at = new Date(Date.now() - (20 - created) * 3 * 60 * 60 * 1000).toISOString();
        const updated_at = created_at;
        const priority = priorities[i % priorities.length];
        const assignee = AGENTS[i % AGENTS.length].name;
        const first_response_due = addHours(created_at, SLA_FIRST_RESPONSE_HOURS);
        const resolve_due = addHours(created_at, SLA_RESOLVE_HOURS);
        const first_responded_at =
          status === "Open" ? null : addHours(created_at, 1 + (i % 3));
        const resolved_at = status === "Closed" ? addHours(created_at, 6 + i) : null;
        const [name, email] = people[i % people.length];

        insert.run(
          ticket_id,
          name,
          email,
          subject,
          `Demo ticket: ${subject}`,
          status,
          priority,
          assignee,
          first_response_due,
          resolve_due,
          first_responded_at,
          resolved_at,
          created_at,
          updated_at
        );
        insertActivity.run(ticket_id, "created", `Ticket created with priority ${priority}`, null, created_at);
        insertActivity.run(ticket_id, "assigned", `Assigned to ${assignee}`, null, created_at);
        if (status !== "Open") {
          insertActivity.run(
            ticket_id,
            "status",
            `Status changed from Open to ${status}`,
            assignee,
            first_responded_at
          );
          insertNote.run(
            ticket_id,
            "Thanks — we're looking into this and will update you shortly.",
            "customer",
            assignee,
            first_responded_at
          );
        }
        if (status === "Closed") {
          insertNote.run(
            ticket_id,
            "This should now be fixed on your end. Please reply if anything still looks off.",
            "customer",
            assignee,
            resolved_at
          );
          insertActivity.run(ticket_id, "status", "Status changed to Closed", assignee, resolved_at);
        }
        created += 1;
      });
    }
  });

  tx();
  res.status(201).json({ created, message: `Added ${created} demo tickets` });
});

module.exports = router;

# Support CRM

A customer support ticketing system: create tickets, search and filter them, view
ticket details, update status, and add notes/comments.

## Stack

- **Backend:** Node.js + Express + SQLite (via `better-sqlite3`)
- **Frontend:** React (Vite) + Tailwind CSS
- **Deploy targets:** Render (API), Vercel or Render (static frontend)

## Project structure

```
support-crm/
├── server/                 # Express API
│   ├── src/
│   │   ├── index.js        # app entry point, middleware, route mounting
│   │   ├── db.js           # SQLite connection + schema (tickets, notes)
│   │   └── routes/
│   │       └── tickets.js  # all /api/tickets endpoints
│   ├── data/                # data.sqlite lives here at runtime (gitignored)
│   ├── .env.example
│   └── package.json
└── client/                 # React frontend
    ├── src/
    │   ├── App.jsx          # view routing (list / new / detail) + list state
    │   ├── api.js            # fetch wrapper for the backend
    │   └── components/
    │       ├── TicketList.jsx
    │       ├── TicketForm.jsx
    │       ├── TicketDetail.jsx
    │       └── StatusBadge.jsx
    ├── .env.example
    └── package.json
```

## Database schema

Two tables, per spec — nothing more:

```sql
CREATE TABLE tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id TEXT UNIQUE NOT NULL,   -- e.g. TKT-001
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Open',   -- Open | In Progress | Closed
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id TEXT NOT NULL REFERENCES tickets(ticket_id),
  note_text TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```

`ticket_id` (e.g. `TKT-001`) is the human-facing ID used in the API and UI;
`id` is just the internal primary key.

## API

| Method | Path                  | Body                                                      | Notes |
|--------|-----------------------|------------------------------------------------------------|-------|
| POST   | `/api/tickets`        | `{ customer_name, customer_email, subject, description }` | Returns `{ ticket_id, created_at }` |
| GET    | `/api/tickets`        | query: `?status=Open&search=jane`                          | Both optional, combinable |
| GET    | `/api/tickets/:ticket_id` | —                                                      | Includes `notes: []` |
| PUT    | `/api/tickets/:ticket_id` | `{ status?, notes? }`                                 | `status` changes the ticket's status; `notes` appends **one new comment** (not the full list). Send either, both, or neither field. |

`GET /api/health` is a plain liveness check, useful for confirming a deploy is up.

## Running locally

You need two terminals — one for the API, one for the frontend.

**API:**
```bash
cd server
cp .env.example .env
npm install
npm start          # http://localhost:4000
```

**Frontend:**
```bash
cd client
cp .env.example .env    # VITE_API_URL=http://localhost:4000
npm install
npm run dev              # http://localhost:5173
```

Open `http://localhost:5173`. The SQLite file is created automatically at
`server/data/data.sqlite` on first run — no manual DB setup needed.

## Deployment

**API → Render (Web Service)**
1. Push this repo to GitHub.
2. On Render: New → Web Service → point at the repo, set root directory to `server`.
3. Build command: `npm install`. Start command: `npm start`.
4. Add an environment variable if needed (`PORT` is set by Render automatically).
5. ⚠️ Render's free-tier disk is **not persistent** across deploys — the SQLite
   file will reset on redeploy. For this assessment that's an acceptable
   tradeoff; for real production use you'd either add a Render persistent
   disk mounted at a fixed path (set `DB_PATH` to that path) or move to a
   hosted Postgres instance.

**Frontend → Vercel (or Render static site)**
1. New project → point at the repo, root directory `client`.
2. Build command: `npm run build`. Output directory: `dist`.
3. Set environment variable `VITE_API_URL` to your deployed API's URL
   (e.g. `https://your-api.onrender.com`).

## Design decisions worth knowing for a code walkthrough

- **`better-sqlite3` over `sqlite3`** — synchronous API, so route handlers read
  top-to-bottom without callback/promise wrapping. Fine for this write volume;
  a busier system would want a real client/server DB.
- **Ticket IDs derived from the last row, not row count** — so deleting a
  ticket (not currently exposed, but easy to add) can't cause a collision.
- **`PUT` does double duty** (status change and/or adding a note) rather than
  being two separate endpoints, matching the spec's `{ status, notes }` body
  exactly. Adding a note also bumps `updated_at`, since a new comment is itself
  an update to the ticket.
- **Search is server-side** (`LIKE` across name/email/id/subject/description)
  rather than filtering an already-fetched list client-side, so it scales past
  whatever fits in one page load.
- **No router library on the frontend** — the app is three views (list, new,
  detail) switched via a single piece of state in `App.jsx`. `react-router`
  would be overkill at this size and would just be one more thing to explain
  in a walkthrough without adding real value yet.

## Possible next steps

- Pagination on the ticket list once volume grows.
- Assignee field + basic auth so tickets can be routed to a specific agent.
- Optimistic UI updates on status change instead of a full refetch.
- Swap SQLite for Postgres if deployed somewhere without persistent disk.

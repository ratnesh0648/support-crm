import { useEffect, useState } from "react";
import { getTicket, updateTicket, getAgents, getTemplates } from "../api";
import StatusBadge from "./StatusBadge";
import PriorityBadge from "./PriorityBadge";
import SlaClocks from "./SlaClocks";
import { STATUSES, PRIORITIES, formatDateLong } from "../lib";

export default function TicketDetail({ ticketId, onBack, agent, onToast }) {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusSaving, setStatusSaving] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteType, setNoteType] = useState("customer");
  const [noteSaving, setNoteSaving] = useState(false);
  const [agents, setAgents] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [metaSaving, setMetaSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getTicket(ticketId);
      setTicket(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    getAgents().then(setAgents).catch(() => {});
    getTemplates().then(setTemplates).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  async function handleStatusChange(newStatus) {
    if (!ticket || newStatus === ticket.status) return;
    const prev = ticket.status;
    setTicket((t) => ({ ...t, status: newStatus }));
    setStatusSaving(true);
    onToast?.(`Moved to ${newStatus}`);
    try {
      await updateTicket(ticketId, { status: newStatus, author: agent?.name });
      await load();
    } catch (err) {
      setTicket((t) => ({ ...t, status: prev }));
      setError(err.message);
      onToast?.(null);
    } finally {
      setStatusSaving(false);
    }
  }

  async function handleMetaChange(field, value) {
    setMetaSaving(true);
    try {
      await updateTicket(ticketId, { [field]: value || null, author: agent?.name });
      onToast?.(field === "priority" ? `Priority → ${value}` : value ? `Assigned to ${value}` : "Unassigned");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setMetaSaving(false);
    }
  }

  async function handleAddNote(e) {
    e.preventDefault();
    if (!noteText.trim()) return;
    setNoteSaving(true);
    try {
      await updateTicket(ticketId, {
        notes: noteText.trim(),
        note_type: noteType,
        author: agent?.name,
      });
      setNoteText("");
      onToast?.(noteType === "internal" ? "Internal note added" : "Reply sent");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setNoteSaving(false);
    }
  }

  const timeline = buildTimeline(ticket);

  return (
    <div className="max-w-2xl">
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-slate-500 hover:text-slate-700 mb-4 inline-flex items-center gap-1"
      >
        ← Back to all tickets
      </button>

      {loading && <p className="text-slate-500 text-sm">Loading ticket…</p>}

      {error && (
        <div className="rounded-lg bg-rose-50 text-rose-700 text-sm px-4 py-3 mb-4 ring-1 ring-inset ring-rose-200">
          {error}
        </div>
      )}

      {ticket && (
        <>
          <div className="flex items-start justify-between gap-4 mb-1">
            <h1 className="text-2xl font-semibold text-slate-900">{ticket.subject}</h1>
            <span className="font-mono text-sm text-slate-400 whitespace-nowrap pt-1">
              {ticket.ticket_id}
            </span>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            {ticket.customer_name} · {ticket.customer_email} · opened {formatDateLong(ticket.created_at)}
          </p>

          <SlaClocks ticket={ticket} />

          <div className="rounded-xl border border-slate-200 bg-white p-5 mb-6">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
              Description
            </h2>
            <p className="text-slate-700 whitespace-pre-wrap">{ticket.description}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-400 mb-1">Status</p>
              <div className="flex items-center gap-2">
                <StatusBadge status={ticket.status} />
                <select
                  value={ticket.status}
                  disabled={statusSaving}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="ml-auto rounded-lg border border-slate-300 px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-400 mb-1">Priority</p>
              <div className="flex items-center gap-2">
                <PriorityBadge priority={ticket.priority} />
                <select
                  value={ticket.priority || "Medium"}
                  disabled={metaSaving}
                  onChange={(e) => handleMetaChange("priority", e.target.value)}
                  className="ml-auto rounded-lg border border-slate-300 px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-400 mb-1">Assignee</p>
              <select
                value={ticket.assignee || ""}
                disabled={metaSaving}
                onChange={(e) => handleMetaChange("assignee", e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <option value="">Unassigned</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.name}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
              Activity timeline
            </h2>
            <div className="relative space-y-0 border-l border-slate-200 ml-2">
              {timeline.length === 0 && (
                <p className="text-sm text-slate-400 pl-4">No activity yet.</p>
              )}
              {timeline.map((item) => (
                <div key={item.key} className="relative pl-5 pb-4">
                  <span
                    className={`absolute -left-1.5 top-1.5 h-3 w-3 rounded-full ring-2 ring-white ${item.dot}`}
                  />
                  <p className="text-sm text-slate-700">{item.message}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {item.author ? `${item.author} · ` : ""}
                    {formatDateLong(item.created_at)}
                    {item.badge && (
                      <span className="ml-2 inline-flex rounded bg-slate-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-500">
                        {item.badge}
                      </span>
                    )}
                  </p>
                  {item.body && (
                    <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap rounded-lg bg-slate-50 border border-slate-100 p-2">
                      {item.body}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
              Reply composer
            </h2>

            {!agent && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                Sign in as an agent (top right) so replies are attributed to you.
              </p>
            )}

            <div className="flex flex-wrap gap-2 mb-3">
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setNoteText(t.text)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 hover:border-indigo-300 hover:text-indigo-700 transition-colors"
                >
                  {t.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleAddNote} className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNoteType("customer")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    noteType === "customer"
                      ? "bg-indigo-600 text-white"
                      : "bg-white border border-slate-300 text-slate-600"
                  }`}
                >
                  Customer reply
                </button>
                <button
                  type="button"
                  onClick={() => setNoteType("internal")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    noteType === "internal"
                      ? "bg-slate-800 text-white"
                      : "bg-white border border-slate-300 text-slate-600"
                  }`}
                >
                  Internal note
                </button>
              </div>
              <textarea
                rows={4}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder={
                  noteType === "internal"
                    ? "Private note for the team (customer won't see this)…"
                    : "Write a reply to the customer…"
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={noteSaving || !noteText.trim()}
                className="self-start rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
              >
                {noteSaving
                  ? "Sending…"
                  : noteType === "internal"
                    ? "Add internal note"
                    : "Send reply"}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

function buildTimeline(ticket) {
  if (!ticket) return [];
  const items = [];

  for (const a of ticket.activity || []) {
    items.push({
      key: `a-${a.id}`,
      message: a.message,
      author: a.author,
      created_at: a.created_at,
      badge: a.event_type,
      body: null,
      dot:
        a.event_type === "status"
          ? "bg-amber-400"
          : a.event_type === "assigned"
            ? "bg-indigo-400"
            : a.event_type === "internal_note"
              ? "bg-slate-500"
              : "bg-emerald-400",
    });
  }

  // If older tickets have notes but sparse activity, still show notes.
  for (const n of ticket.notes || []) {
    const already = (ticket.activity || []).some(
      (a) =>
        a.created_at === n.created_at &&
        (a.event_type === "reply" || a.event_type === "internal_note")
    );
    if (!already) {
      items.push({
        key: `n-${n.id}`,
        message: n.note_type === "internal" ? "Internal note" : "Customer reply",
        author: n.author,
        created_at: n.created_at,
        badge: n.note_type || "customer",
        body: n.note_text,
        dot: n.note_type === "internal" ? "bg-slate-500" : "bg-emerald-400",
      });
    } else {
      // Attach note body to matching activity by time
      const match = items.find(
        (it) =>
          it.created_at === n.created_at &&
          (it.badge === "reply" || it.badge === "internal_note") &&
          !it.body
      );
      if (match) match.body = n.note_text;
    }
  }

  items.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  return items;
}

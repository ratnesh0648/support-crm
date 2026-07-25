import { useEffect, useState } from "react";
import { createTicket, getAgents } from "../api";
import { PRIORITIES } from "../lib";

const EMPTY = {
  customer_name: "",
  customer_email: "",
  subject: "",
  description: "",
  priority: "Medium",
  assignee: "",
};

export default function TicketForm({ onCreated, onCancel, agent }) {
  const [form, setForm] = useState({
    ...EMPTY,
    assignee: agent?.name || "",
  });
  const [agents, setAgents] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getAgents().then(setAgents).catch(() => {});
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        assignee: form.assignee || null,
      };
      const { ticket_id } = await createTicket(payload);
      onCreated(ticket_id);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold text-slate-900 mb-1">New ticket</h1>
      <p className="text-sm text-slate-500 mb-6">
        A ticket ID, SLA clocks, and timestamp are generated automatically once you submit.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Customer name</label>
            <input
              required
              value={form.customer_name}
              onChange={(e) => update("customer_name", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Jane Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Customer email</label>
            <input
              required
              type="email"
              value={form.customer_email}
              onChange={(e) => update("customer_email", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="jane@example.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
          <input
            required
            value={form.subject}
            onChange={(e) => update("subject", e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Short summary of the issue"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea
            required
            rows={5}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="What's going wrong? Steps to reproduce, error messages, etc."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
            <select
              value={form.priority}
              onChange={(e) => update("priority", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Assignee</label>
            <select
              value={form.assignee}
              onChange={(e) => update("assignee", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

        {error && (
          <div className="rounded-lg bg-rose-50 text-rose-700 text-sm px-4 py-3 ring-1 ring-inset ring-rose-200">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Creating…" : "Create ticket"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

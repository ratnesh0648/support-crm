import StatusBadge from "./StatusBadge";
import PriorityBadge from "./PriorityBadge";
import DashboardStats from "./DashboardStats";
import AnalyticsChart from "./AnalyticsChart";
import { STATUSES, PRIORITIES, formatDate } from "../lib";

export default function TicketList({
  tickets,
  loading,
  error,
  search,
  onSearchChange,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
  assignee,
  onAssigneeChange,
  mineOnly,
  onMineOnlyChange,
  sort,
  onSortChange,
  agents,
  agent,
  stats,
  statsLoading,
  onSelect,
  onNewTicket,
  onSeed,
  seeding,
  searchInputRef,
}) {
  const empty = !loading && tickets.length === 0;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Support tickets</h1>
          <p className="text-sm text-slate-500 mt-1">
            {loading ? "Loading…" : `${tickets.length} ticket${tickets.length === 1 ? "" : "s"}`}
            <span className="hidden sm:inline text-slate-400">
              {" "}
              · shortcuts: <kbd className="font-mono text-[11px] bg-slate-100 px-1 rounded">N</kbd> new ·{" "}
              <kbd className="font-mono text-[11px] bg-slate-100 px-1 rounded">/</kbd> search ·{" "}
              <kbd className="font-mono text-[11px] bg-slate-100 px-1 rounded">O</kbd>/
              <kbd className="font-mono text-[11px] bg-slate-100 px-1 rounded">I</kbd>/
              <kbd className="font-mono text-[11px] bg-slate-100 px-1 rounded">C</kbd> status
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSeed}
            disabled={seeding}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            {seeding ? "Seeding…" : "Load demo data"}
          </button>
          <button
            type="button"
            onClick={onNewTicket}
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
          >
            + New ticket
          </button>
        </div>
      </div>

      <DashboardStats
        stats={stats}
        loading={statsLoading}
        onFilterStatus={onStatusChange}
      />
      <AnalyticsChart stats={stats} />

      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name, email, ticket ID, subject, or assignee…"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={priority}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <select
            value={assignee}
            onChange={(e) => onAssigneeChange(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All agents</option>
            {(agents || []).map((a) => (
              <option key={a.id} value={a.name}>
                {a.name}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="newest">Newest first</option>
            <option value="priority">Priority first</option>
          </select>
          <label className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={mineOnly}
              disabled={!agent}
              onChange={(e) => onMineOnlyChange(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            My tickets
          </label>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 text-rose-700 text-sm px-4 py-3 mb-4 ring-1 ring-inset ring-rose-200">
          Couldn't load tickets: {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-slate-500">
              <th className="px-4 py-3 font-medium">Ticket ID</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Subject</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Assignee</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {empty && (
              <tr>
                <td colSpan={7} className="px-4 py-14 text-center">
                  <div className="mx-auto max-w-sm">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 text-lg font-bold">
                      S
                    </div>
                    <p className="text-slate-700 font-medium">No tickets yet</p>
                    <p className="text-sm text-slate-400 mt-1 mb-4">
                      Clear filters, create a ticket, or load demo data to explore the board.
                    </p>
                    <div className="flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={onNewTicket}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
                      >
                        New ticket
                      </button>
                      <button
                        type="button"
                        onClick={onSeed}
                        disabled={seeding}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Load demo data
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            )}
            {tickets.map((t) => (
              <tr
                key={t.ticket_id}
                onClick={() => onSelect(t.ticket_id)}
                className="cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <td className="px-4 py-3 font-mono text-slate-700">{t.ticket_id}</td>
                <td className="px-4 py-3 text-slate-800">{t.customer_name}</td>
                <td className="px-4 py-3 text-slate-600 max-w-[12rem] truncate">{t.subject}</td>
                <td className="px-4 py-3">
                  <PriorityBadge priority={t.priority} />
                </td>
                <td className="px-4 py-3 text-slate-600">{t.assignee || "—"}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={t.status} />
                </td>
                <td className="px-4 py-3 text-slate-500">{formatDate(t.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

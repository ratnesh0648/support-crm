export default function DashboardStats({ stats, loading, onFilterStatus }) {
  if (loading && !stats) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-white border border-slate-200 animate-pulse" />
        ))}
      </div>
    );
  }
  if (!stats) return null;

  const cards = [
    {
      label: "Open",
      value: stats.byStatus?.Open ?? 0,
      hint: "needs attention",
      onClick: () => onFilterStatus?.("Open"),
    },
    {
      label: "In Progress",
      value: stats.byStatus?.["In Progress"] ?? 0,
      hint: "being worked",
      onClick: () => onFilterStatus?.("In Progress"),
    },
    {
      label: "Closed",
      value: stats.byStatus?.Closed ?? 0,
      hint: "resolved",
      onClick: () => onFilterStatus?.("Closed"),
    },
    {
      label: "Today",
      value: stats.createdToday ?? 0,
      hint: "created today",
      onClick: null,
    },
  ];

  return (
    <div className="mb-6 space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={c.onClick || undefined}
            disabled={!c.onClick}
            className={`text-left rounded-xl border border-slate-200 bg-white px-4 py-3 transition-colors ${
              c.onClick ? "hover:border-indigo-300 hover:bg-indigo-50/40 cursor-pointer" : "cursor-default"
            }`}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{c.label}</p>
            <p className="text-2xl font-semibold text-slate-900 mt-1">{c.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{c.hint}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-slate-600">
        <span className="rounded-lg bg-white border border-slate-200 px-3 py-1.5">
          Unassigned open: <strong>{stats.unassigned}</strong>
        </span>
        <span
          className={`rounded-lg border px-3 py-1.5 ${
            stats.slaBreached
              ? "bg-rose-50 border-rose-200 text-rose-700"
              : "bg-white border-slate-200"
          }`}
        >
          SLA breached: <strong>{stats.slaBreached}</strong>
        </span>
        <span
          className={`rounded-lg border px-3 py-1.5 ${
            stats.slaAtRisk
              ? "bg-amber-50 border-amber-200 text-amber-800"
              : "bg-white border-slate-200"
          }`}
        >
          SLA at risk: <strong>{stats.slaAtRisk}</strong>
        </span>
        {stats.avgCloseHours != null && (
          <span className="rounded-lg bg-white border border-slate-200 px-3 py-1.5">
            Avg close: <strong>{stats.avgCloseHours}h</strong>
          </span>
        )}
      </div>
    </div>
  );
}

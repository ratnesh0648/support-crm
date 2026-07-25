export default function AnalyticsChart({ stats }) {
  if (!stats?.byDay?.length) return null;
  const max = Math.max(1, ...stats.byDay.map((d) => d.count));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 mb-6">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-800">Tickets created — last 7 days</h2>
        <p className="text-xs text-slate-400">{stats.total} total</p>
      </div>
      <div className="flex items-end gap-2 h-28">
        {stats.byDay.map((d) => (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
            <span className="text-[10px] text-slate-500">{d.count || ""}</span>
            <div
              className="w-full rounded-t-md bg-indigo-500/80 min-h-[4px] transition-all"
              style={{ height: `${Math.max(4, (d.count / max) * 100)}%` }}
              title={`${d.date}: ${d.count}`}
            />
            <span className="text-[10px] text-slate-400">{d.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {Object.entries(stats.byPriority || {}).map(([p, c]) => (
          <span key={p} className="text-xs rounded-md bg-slate-50 border border-slate-200 px-2 py-1 text-slate-600">
            {p}: <strong className="text-slate-800">{c}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

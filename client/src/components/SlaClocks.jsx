import { slaState } from "../lib";

const TONE = {
  ok: "bg-emerald-50 text-emerald-800 border-emerald-200",
  warn: "bg-amber-50 text-amber-800 border-amber-200",
  breach: "bg-rose-50 text-rose-800 border-rose-200",
  done: "bg-slate-50 text-slate-600 border-slate-200",
};

export default function SlaClocks({ ticket }) {
  const first = slaState(ticket.first_response_due, ticket.first_responded_at);
  const resolve = slaState(
    ticket.resolve_due,
    ticket.status === "Closed" ? ticket.resolved_at || ticket.updated_at : null
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
      <div className={`rounded-xl border px-4 py-3 ${TONE[first.tone]}`}>
        <p className="text-xs font-semibold uppercase tracking-wide opacity-70">First response (4h)</p>
        <p className="text-sm font-medium mt-1">{first.label}</p>
      </div>
      <div className={`rounded-xl border px-4 py-3 ${TONE[resolve.tone]}`}>
        <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Resolve (24h)</p>
        <p className="text-sm font-medium mt-1">{resolve.label}</p>
      </div>
    </div>
  );
}

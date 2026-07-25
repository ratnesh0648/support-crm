const STYLES = {
  Open: "bg-blue-50 text-blue-700 ring-blue-600/20",
  "In Progress": "bg-amber-50 text-amber-700 ring-amber-600/20",
  Closed: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

export default function StatusBadge({ status }) {
  const style = STYLES[status] || STYLES.Open;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}
    >
      {status}
    </span>
  );
}

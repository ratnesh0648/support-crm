const STYLES = {
  Low: "bg-slate-50 text-slate-600 ring-slate-400/30",
  Medium: "bg-sky-50 text-sky-700 ring-sky-600/20",
  High: "bg-orange-50 text-orange-700 ring-orange-600/20",
  Urgent: "bg-rose-50 text-rose-700 ring-rose-600/20",
};

export default function PriorityBadge({ priority }) {
  const style = STYLES[priority] || STYLES.Medium;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}
    >
      {priority || "Medium"}
    </span>
  );
}

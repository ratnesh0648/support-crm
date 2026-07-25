export const STATUSES = ["Open", "In Progress", "Closed"];
export const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

export const AGENT_STORAGE_KEY = "support-crm-agent";

export function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateLong(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function loadAgent() {
  try {
    const raw = localStorage.getItem(AGENT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveAgent(agent) {
  if (!agent) localStorage.removeItem(AGENT_STORAGE_KEY);
  else localStorage.setItem(AGENT_STORAGE_KEY, JSON.stringify(agent));
}

/** Returns { label, tone: 'ok'|'warn'|'breach'|'done' } for SLA clocks */
export function slaState(dueIso, doneIso, now = Date.now()) {
  if (doneIso) return { label: "Met", tone: "done", msLeft: 0 };
  if (!dueIso) return { label: "—", tone: "ok", msLeft: 0 };
  const due = new Date(dueIso).getTime();
  const msLeft = due - now;
  if (msLeft < 0) {
    return { label: `Overdue ${formatDuration(-msLeft)}`, tone: "breach", msLeft };
  }
  if (msLeft < 60 * 60 * 1000) {
    return { label: `${formatDuration(msLeft)} left`, tone: "warn", msLeft };
  }
  return { label: `${formatDuration(msLeft)} left`, tone: "ok", msLeft };
}

function formatDuration(ms) {
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  if (hrs < 48) return rem ? `${hrs}h ${rem}m` : `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

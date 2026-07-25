const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with status ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

export function createTicket(data) {
  return request("/tickets", { method: "POST", body: JSON.stringify(data) });
}

export function listTickets({ status, search, priority, assignee, mine, sort } = {}) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (search) params.set("search", search);
  if (priority) params.set("priority", priority);
  if (assignee) params.set("assignee", assignee);
  if (mine) params.set("mine", mine);
  if (sort) params.set("sort", sort);
  const qs = params.toString();
  return request(`/tickets${qs ? `?${qs}` : ""}`);
}

export function getTicket(ticketId) {
  return request(`/tickets/${ticketId}`);
}

export function updateTicket(ticketId, data) {
  return request(`/tickets/${ticketId}`, { method: "PUT", body: JSON.stringify(data) });
}

export function getStats() {
  return request("/meta/stats");
}

export function getAgents() {
  return request("/meta/agents");
}

export function getTemplates() {
  return request("/meta/templates");
}

export function loginAgent(agent_id) {
  return request("/meta/auth", { method: "POST", body: JSON.stringify({ agent_id }) });
}

export function seedDemo(force = false) {
  return request("/meta/seed", { method: "POST", body: JSON.stringify({ force }) });
}

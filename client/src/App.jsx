import { useEffect, useRef, useState } from "react";
import { listTickets, getStats, getAgents, seedDemo } from "./api";
import { loadAgent, saveAgent } from "./lib";
import TicketList from "./components/TicketList";
import TicketForm from "./components/TicketForm";
import TicketDetail from "./components/TicketDetail";
import AgentBar from "./components/AgentBar";
import Toast from "./components/Toast";

// view is one of: { name: "list" } | { name: "new" } | { name: "detail", ticketId }
export default function App() {
  const [view, setView] = useState({ name: "list" });
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [assignee, setAssignee] = useState("");
  const [mineOnly, setMineOnly] = useState(false);
  const [sort, setSort] = useState("newest");
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [agents, setAgents] = useState([]);
  const [agent, setAgent] = useState(() => loadAgent());
  const [seeding, setSeeding] = useState(false);
  const [toast, setToast] = useState(null);
  const searchInputRef = useRef(null);
  const toastTimer = useRef(null);

  function showToast(message) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    if (message) {
      toastTimer.current = setTimeout(() => setToast(null), 2500);
    }
  }

  async function refreshStats() {
    setStatsLoading(true);
    try {
      setStats(await getStats());
    } catch {
      /* non-fatal */
    } finally {
      setStatsLoading(false);
    }
  }

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const data = await listTickets({
        status,
        search,
        priority,
        assignee: mineOnly ? undefined : assignee,
        mine: mineOnly && agent ? agent.name : undefined,
        sort,
      });
      setTickets(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getAgents().then(setAgents).catch(() => {});
    refreshStats();
  }, []);

  // Debounce search so we're not hitting the API on every keystroke.
  useEffect(() => {
    const handle = setTimeout(() => {
      refresh();
      refreshStats();
    }, 250);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, priority, assignee, mineOnly, sort, agent]);

  // Keyboard shortcuts (list view)
  useEffect(() => {
    function onKey(e) {
      const tag = e.target?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.target?.isContentEditable;
      if (typing && e.key !== "Escape") return;

      if (e.key === "/" && !typing) {
        e.preventDefault();
        setView({ name: "list" });
        setTimeout(() => searchInputRef.current?.focus(), 0);
        return;
      }
      if (e.key === "n" || e.key === "N") {
        if (typing) return;
        e.preventDefault();
        setView({ name: "new" });
        return;
      }
      if (view.name !== "list" || typing) return;
      if (e.key === "o" || e.key === "O") setStatus((s) => (s === "Open" ? "" : "Open"));
      if (e.key === "i" || e.key === "I") setStatus((s) => (s === "In Progress" ? "" : "In Progress"));
      if (e.key === "c" || e.key === "C") setStatus((s) => (s === "Closed" ? "" : "Closed"));
      if (e.key === "Escape") {
        setSearch("");
        setStatus("");
        setPriority("");
        setAssignee("");
        setMineOnly(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view.name]);

  async function handleSeed() {
    setSeeding(true);
    try {
      const result = await seedDemo(true);
      showToast(result.message || "Demo data loaded");
      await refresh();
      await refreshStats();
    } catch (err) {
      showToast(err.message);
    } finally {
      setSeeding(false);
    }
  }

  function handleLogin(next) {
    saveAgent(next);
    setAgent(next);
    showToast(`Signed in as ${next.name}`);
  }

  function handleLogout() {
    saveAgent(null);
    setAgent(null);
    setMineOnly(false);
    showToast("Signed out");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setView({ name: "list" })}
            className="flex items-center gap-2"
          >
            <div className="h-7 w-7 rounded-md bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">
              S
            </div>
            <span className="font-semibold text-slate-900">Support CRM</span>
          </button>
          <AgentBar agent={agent} onLogin={handleLogin} onLogout={handleLogout} />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {view.name === "list" && (
          <TicketList
            tickets={tickets}
            loading={loading}
            error={error}
            search={search}
            onSearchChange={setSearch}
            status={status}
            onStatusChange={setStatus}
            priority={priority}
            onPriorityChange={setPriority}
            assignee={assignee}
            onAssigneeChange={setAssignee}
            mineOnly={mineOnly}
            onMineOnlyChange={setMineOnly}
            sort={sort}
            onSortChange={setSort}
            agents={agents}
            agent={agent}
            stats={stats}
            statsLoading={statsLoading}
            onSelect={(ticketId) => setView({ name: "detail", ticketId })}
            onNewTicket={() => setView({ name: "new" })}
            onSeed={handleSeed}
            seeding={seeding}
            searchInputRef={searchInputRef}
          />
        )}

        {view.name === "new" && (
          <TicketForm
            agent={agent}
            onCreated={(ticketId) => {
              refresh();
              refreshStats();
              setView({ name: "detail", ticketId });
            }}
            onCancel={() => setView({ name: "list" })}
          />
        )}

        {view.name === "detail" && (
          <TicketDetail
            ticketId={view.ticketId}
            agent={agent}
            onToast={showToast}
            onBack={() => {
              refresh();
              refreshStats();
              setView({ name: "list" });
            }}
          />
        )}
      </main>

      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}

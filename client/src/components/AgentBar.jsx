import { useEffect, useState } from "react";
import { getAgents, loginAgent } from "../api";

export default function AgentBar({ agent, onLogin, onLogout }) {
  const [agents, setAgents] = useState([]);
  const [open, setOpen] = useState(false);
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    getAgents().then(setAgents).catch(() => {});
  }, []);

  async function pick(agent_id) {
    setPicking(true);
    try {
      const { agent: next } = await loginAgent(agent_id);
      onLogin(next);
      setOpen(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setPicking(false);
    }
  }

  return (
    <div className="relative ml-auto">
      {agent ? (
        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-800 leading-tight">{agent.name}</p>
            <p className="text-[11px] text-slate-400">{agent.role}</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            Sign out
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
        >
          Agent sign in
        </button>
      )}

      {open && !agent && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-lg z-20 p-2">
          <p className="px-2 py-1 text-[11px] uppercase tracking-wide text-slate-400">Pick an agent</p>
          {agents.map((a) => (
            <button
              key={a.id}
              type="button"
              disabled={picking}
              onClick={() => pick(a.id)}
              className="w-full text-left rounded-lg px-2 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
            >
              <span className="font-medium text-slate-800">{a.name}</span>
              <span className="block text-[11px] text-slate-400">{a.role}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Toast({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-5 right-5 z-50 animate-[fadeIn_0.2s_ease-out]">
      <div className="flex items-center gap-3 rounded-lg bg-slate-900 text-white px-4 py-3 text-sm shadow-lg">
        <span>{message}</span>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white text-xs"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

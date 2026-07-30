import { useEffect, useState, useRef, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useSearch } from "../../hooks/use-search";
import type { SearchResult } from "../../types";

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { query, setQuery, results, isLoading } = useSearch();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((p) => !p);
      }
    };
    window.addEventListener("keydown", handler as any);
    return () => window.removeEventListener("keydown", handler as any);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    setSelectedIdx(0);
  }, [results]);

  const visit = (result: SearchResult) => {
    setOpen(false);
    setQuery("");
    if (result.type === "problem") {
      const p = result.data as any;
      navigate(`/problems?id=${p.id}`);
    } else if (result.type === "list") {
      const l = result.data as any;
      navigate(`/lists?id=${l.id}`);
    }
  };

  const handleKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx((i) => Math.min(i + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && results[selectedIdx]) { visit(results[selectedIdx]); }
    if (e.key === "Escape") { setOpen(false); setQuery(""); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60" onClick={() => { setOpen(false); setQuery(""); }}>
      <div className="w-full max-w-lg rounded-xl bg-surface-900 shadow-2xl border border-surface-700 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-surface-800 px-4 py-3">
          <svg className="h-5 w-5 text-surface-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search problems, lists, notes..."
            className="flex-1 bg-transparent text-white placeholder-surface-500 outline-none text-sm"
          />
          <kbd className="hidden sm:inline-flex text-xs text-surface-500 border border-surface-700 rounded px-1.5 py-0.5">ESC</kbd>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {!query && (
            <p className="px-4 py-8 text-center text-sm text-surface-500">Type to search...</p>
          )}

          {isLoading && (
            <div className="space-y-2 px-4 py-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-surface-800" />
              ))}
            </div>
          )}

          {!isLoading && query && results.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-surface-500">No results found.</p>
          )}

          {results.map((result, i) => (
            <button
              key={i}
              onClick={() => visit(result)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${i === selectedIdx ? "bg-surface-800" : "hover:bg-surface-800/50"}`}
            >
              <span className={`rounded px-1.5 py-0.5 text-xs font-medium capitalize ${result.type === "problem" ? "text-blue-400 bg-blue-500/10" : result.type === "list" ? "text-green-400 bg-green-500/10" : "text-yellow-400 bg-yellow-500/10"}`}>
                {result.type}
              </span>
              {result.type === "note" ? (
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{(result.data as any).problem_title}</p>
                  <p className="text-xs text-surface-500 truncate">{(result.data as any).notes_snippet}</p>
                </div>
              ) : (
                <p className="flex-1 text-sm text-white truncate">{(result.data as any).title || (result.data as any).name}</p>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState, useRef, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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

  const typeColors: Record<string, string> = {
    problem: "text-blue-400 bg-blue-500/10",
    list: "text-rose-600 bg-rose-100",
    note: "text-yellow-400 bg-yellow-500/10",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60 "
      onClick={() => { setOpen(false); setQuery(""); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="w-full max-w-lg glass-card  overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-surface-300/50 px-4 py-3.5">
          <svg className="h-5 w-5 text-surface-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search problems, lists, notes..."
            className="flex-1 bg-transparent text-surface-900 placeholder-surface-500 outline-none text-sm"
          />
          <kbd className="hidden sm:inline-flex text-xs text-surface-500 border border-surface-300/50 px-1.5 py-0.5 bg-surface-200/50">ESC</kbd>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {!query && (
            <p className="px-4 py-8 text-center text-sm text-surface-500">Type to search...</p>
          )}

          {isLoading && (
            <div className="space-y-2 px-4 py-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse bg-surface-200/50" />
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
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                i === selectedIdx ? "bg-surface-300/50" : "hover:bg-surface-200/50"
              }`}
            >
              <span className={`px-1.5 py-0.5 text-xs font-medium capitalize ${typeColors[result.type]}`}>
                {result.type}
              </span>
              {result.type === "note" ? (
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-surface-900 truncate">{(result.data as any).problem_title}</p>
                  <p className="text-xs text-surface-500 truncate">{(result.data as any).notes_snippet}</p>
                </div>
              ) : (
                <p className="flex-1 text-sm text-surface-900 truncate">{(result.data as any).title || (result.data as any).name}</p>
              )}
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

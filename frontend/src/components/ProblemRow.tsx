import { useState } from "react";
import { motion } from "framer-motion";
import Checkbox from "./Checkbox";
import DifficultyBadge from "./DifficultyBadge";
import { companyColor } from "../lib/companies";
import { platformColor } from "../lib/platforms";
import type { Problem } from "../types";

const rowItem = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

const STATUS_OPTIONS = ["todo", "solving", "solved", "skipped"] as const;

const STATUS_COLORS: Record<string, string> = {
  todo: "text-surface-500/60",
  solving: "text-blue-400",
  solved: "text-green-400",
  skipped: "text-surface-500",
};

interface Props {
  problem: Problem;
  solved: boolean;
  onSolve: (problemId: string, toSolved: boolean) => void;
  onStatusChange?: (problemId: string, status: string) => void;
  onAddToList?: (problem: Problem) => void;
  disabled?: boolean;
  status?: string;
}

export default function ProblemRow({ problem, solved, onSolve, onStatusChange, onAddToList, disabled, status }: Props) {
  const [statusOpen, setStatusOpen] = useState(false);
  const currentStatus = status ?? (solved ? "solved" : "todo");

  return (
    <motion.div
      variants={rowItem}
      className="glass-hover px-4 py-3 flex items-center gap-3"
    >
      <Checkbox
        checked={solved}
        onChange={() => onSolve(problem.id, !solved)}
        disabled={disabled}
      />

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span
            className="text-sm font-medium text-rose-400 break-words transition-colors hover:text-rose-300 cursor-pointer"
            title={problem.platform_url ?? problem.title}
            onClick={() => {
              if (problem.platform_url) {
                window.open(problem.platform_url, "_blank", "noopener,noreferrer");
              }
            }}
          >
            {problem.title}
          </span>
          {problem.company_tags.length > 0 && (
            <div className="flex min-w-0 max-w-full items-center gap-x-1.5 overflow-x-auto whitespace-nowrap no-scrollbar">
              <span className="shrink-0 text-surface-500/40">·</span>
              {problem.company_tags.map((c, i) => (
                <span key={c} className="flex shrink-0 items-center gap-x-1.5">
                  {i > 0 && <span className="text-surface-500/40">·</span>}
                  <span className={`text-[11px] ${companyColor(c)}`}>{c}</span>
                </span>
              ))}
            </div>
          )}
        </div>
        {problem.topic_tags.length > 0 && (
          <div className="mt-1 flex items-center gap-x-1.5 overflow-x-auto whitespace-nowrap no-scrollbar">
            {problem.topic_tags.map((tag, i) => (
              <span key={tag} className="flex shrink-0 items-center gap-x-1.5">
                {i > 0 && <span className="text-surface-500/40">·</span>}
                <span className="text-xs text-surface-400">{tag}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-x-4">
        {onStatusChange && (
          <div className="relative">
            <button
              onClick={() => setStatusOpen((o) => !o)}
              disabled={disabled}
              className={`flex items-center gap-1 text-[11px] font-medium transition-colors hover:underline cursor-pointer disabled:opacity-40 ${STATUS_COLORS[currentStatus] ?? "text-surface-500"}`}
            >
              {currentStatus}
              <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            {statusOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setStatusOpen(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 w-28 py-1 glass-card border border-surface-300/40">
                  {STATUS_OPTIONS.map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        onStatusChange(problem.id, option);
                        setStatusOpen(false);
                      }}
                      className={`flex w-full items-center justify-between px-3 py-1.5 text-xs transition-colors hover:bg-surface-200 ${option === currentStatus ? "font-semibold text-surface-900" : "text-surface-400 hover:text-surface-900"}`}
                    >
                      {option}
                      {option === currentStatus && (
                        <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {onAddToList && (
          <button
            onClick={() => onAddToList(problem)}
            className="flex items-center gap-1 text-[11px] font-medium text-surface-500 transition-colors hover:text-rose-400 cursor-pointer"
            title="Add to another sheet"
          >
            <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            list
          </button>
        )}

        <DifficultyBadge difficulty={problem.difficulty} />
        <span className={`text-[10px] font-medium uppercase tracking-wide ${platformColor(problem.platform)}`}>
          {problem.platform}
        </span>
      </div>
    </motion.div>
  );
}

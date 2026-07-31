import type { ReactNode } from "react";
import type { ProblemList } from "../../types";
import type { ListProgress } from "../../hooks/use-lists";

interface Props {
  list: ProblemList;
  progress?: Pick<ListProgress, "total" | "solved" | "inProgress" | "difficulty">;
  detailed?: boolean;
  onClick?: () => void;
  actions?: ReactNode;
}

const difficultyDot: Record<string, string> = {
  easy: "bg-green-500",
  medium: "bg-yellow-500",
  hard: "bg-red-500",
};

export default function ListProgressCard({ list, progress, detailed = false, onClick, actions }: Props) {
  const total = progress?.total ?? 0;
  const solved = progress?.solved ?? 0;
  const inProgress = progress?.inProgress ?? 0;
  const difficulty = progress?.difficulty;
  const pct = total > 0 ? Math.round((solved / total) * 100) : 0;

  return (
    <div
      onClick={onClick}
      className={`glass-card p-5 flex flex-col hover:bg-surface-200 transition-all duration-200 ${
        detailed ? "h-56" : ""
      } ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-surface-900 truncate">{list.name}</p>
            <span className="shrink-0 rounded-full bg-surface-200/70 border border-surface-300/50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-surface-400">
              {list.is_global ? "global" : "mine"}
            </span>
          </div>
          {list.description && (
            <p className={`text-xs text-surface-500 mt-0.5 ${detailed ? "line-clamp-2" : "truncate"}`}>{list.description}</p>
          )}
        </div>
        <span className={`shrink-0 font-bold text-surface-400 ${detailed ? "text-lg" : "text-sm"}`}>{pct}%</span>
      </div>

      {detailed && difficulty && (
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
          {(["easy", "medium", "hard"] as const).map((d) => (
            <span key={d} className="inline-flex items-center gap-1 text-[11px] text-surface-500 capitalize">
              <span className={`h-1.5 w-1.5 rounded-full ${difficultyDot[d]}`} />
              {d} {difficulty[d]}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto pt-4">
        <div className="flex items-center justify-between text-xs text-surface-500 mb-1.5">
          <span>{solved} / {total} solved</span>
          {inProgress > 0 && <span>{inProgress} in progress</span>}
        </div>
        <div className="h-1.5 bg-surface-200/70 border border-surface-300/50">
          <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        {detailed && (
          <div className="mt-2 text-xs text-surface-500">
            {list.problem_count} problem{list.problem_count !== 1 ? "s" : ""} total
          </div>
        )}      </div>

      {actions && (
        <div className="mt-3" onClick={(e) => e.stopPropagation()}>
          {actions}
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { useProblems, usePlatforms } from "../hooks/use-problems";
import { useSetProblemStatus } from "../hooks/use-user-problems";
import SolveLogPopup from "../features/solve-log/SolveLogPopup";
import type { Problem } from "../types";

const difficulties = ["easy", "medium", "hard"] as const;

const difficultyColor: Record<string, string> = {
  easy: "text-green-400 bg-green-500/10",
  medium: "text-yellow-400 bg-yellow-500/10",
  hard: "text-red-400 bg-red-500/10",
};

const statusColors: Record<string, string> = {
  todo: "text-surface-500 bg-surface-800",
  solving: "text-blue-400 bg-blue-500/10",
  solved: "text-green-400 bg-green-500/10",
  skipped: "text-surface-500 bg-surface-800 line-through",
};

const statusLabels: Record<string, string> = {
  todo: "Todo",
  solving: "Solving",
  solved: "Solved",
  skipped: "Skipped",
};

type ProblemStatus = "todo" | "solving" | "solved" | "skipped";

const nextStatuses: Record<string, ProblemStatus[]> = {
  todo: ["solving", "skipped"],
  solving: ["solved", "skipped", "todo"],
  solved: [],
  skipped: ["todo"],
};

interface ProblemRowProps {
  problem: Problem;
  status: ProblemStatus;
  onStatusChange: (problemId: string, status: ProblemStatus) => void;
  disabled: boolean;
}

function ProblemRow({ problem, status, onStatusChange, disabled }: ProblemRowProps) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-surface-800 px-4 py-3 hover:bg-surface-800/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white truncate">{problem.title}</span>
          <span className="text-xs text-surface-500">#{problem.slug}</span>
        </div>
        <div className="mt-1 flex flex-wrap gap-2">
          {problem.topic_tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-surface-800 px-2 py-0.5 text-xs text-surface-400">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${difficultyColor[problem.difficulty]}`}>
        {problem.difficulty}
      </span>

      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[status]}`}>
        {statusLabels[status]}
      </span>

      <div className="flex gap-1">
        {nextStatuses[status].map((ns) => (
          <button
            key={ns}
            onClick={() => onStatusChange(problem.id, ns)}
            disabled={disabled}
            className="rounded-md bg-surface-800 px-2 py-1 text-xs text-surface-400 hover:bg-surface-700 hover:text-white transition-colors disabled:opacity-40 capitalize"
          >
            {ns === "solved" ? "✓" : ns === "skipped" ? "—" : "→"}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Problems() {
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [page, setPage] = useState(1);

  const [statusMap, setStatusMap] = useState<Record<string, ProblemStatus>>({});
  const [solveLogProblem, setSolveLogProblem] = useState<{ id: string; title: string } | null>(null);

  const { data, isLoading, error } = useProblems({ q: query || undefined, platform: platform || undefined, difficulty: difficulty || undefined, page, per_page: 20 });
  const { data: platforms } = usePlatforms();
  const setStatus = useSetProblemStatus();

  const handleStatusChange = (problemId: string, newStatus: ProblemStatus) => {
    setStatus.mutate(
      { problemId, status: newStatus },
      {
        onSuccess: (res) => {
          setStatusMap((prev) => ({ ...prev, [problemId]: newStatus }));
          if (res.solve_log_required) {
            const problem = (data?.items ?? []).find((p) => p.id === problemId);
            if (problem) setSolveLogProblem({ id: problemId, title: problem.title });
          }
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Problems</h1>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          placeholder="Search problems..."
          className="min-w-0 flex-1 rounded-lg bg-surface-800 px-4 py-2 text-white placeholder-surface-500 outline-none ring-1 ring-surface-700 focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={platform}
          onChange={(e) => { setPlatform(e.target.value); setPage(1); }}
          className="rounded-lg bg-surface-800 px-3 py-2 text-white outline-none ring-1 ring-surface-700 focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All platforms</option>
          {platforms?.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        <select
          value={difficulty}
          onChange={(e) => { setDifficulty(e.target.value); setPage(1); }}
          className="rounded-lg bg-surface-800 px-3 py-2 text-white outline-none ring-1 ring-surface-700 focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All difficulties</option>
          {difficulties.map((d) => (
            <option key={d} value={d} className="capitalize">{d}</option>
          ))}
        </select>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-surface-800" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {(error as Error).message}
        </div>
      )}

      {data && (
        <>
          <div className="space-y-2">
            {data.items.map((problem) => (
              <ProblemRow
                key={problem.id}
                problem={problem}
                status={statusMap[problem.id] ?? "todo"}
                onStatusChange={handleStatusChange}
                disabled={setStatus.isPending}
              />
            ))}
          </div>

          {data.items.length === 0 && (
            <p className="text-center text-surface-500 py-12">No problems found.</p>
          )}

          <div className="flex items-center justify-between text-sm text-surface-400">
            <span>{data.total} problem{data.total !== 1 ? "s" : ""}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg bg-surface-800 px-3 py-1.5 text-white hover:bg-surface-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-surface-500">Page {data.page} of {Math.max(1, Math.ceil(data.total / data.per_page))}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil(data.total / data.per_page)}
                className="rounded-lg bg-surface-800 px-3 py-1.5 text-white hover:bg-surface-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {solveLogProblem && (
        <SolveLogPopup
          problemId={solveLogProblem.id}
          problemTitle={solveLogProblem.title}
          onClose={() => setSolveLogProblem(null)}
        />
      )}
    </div>
  );
}

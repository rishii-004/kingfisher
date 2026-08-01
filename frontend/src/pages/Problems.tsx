import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useProblems, usePlatforms, useCompanies } from "../hooks/use-problems";
import { useSetProblemStatus } from "../hooks/use-user-problems";
import { useLists, useAddProblemToList, useListContainsProblem, useCreateListFromFilter } from "../hooks/use-lists";
import { TOPICS } from "../lib/topics";
import { companyColor } from "../lib/companies";
import { platformColor } from "../lib/platforms";
import { toast } from "../lib/toast";
import SolveLogPopup from "../features/solve-log/SolveLogPopup";
import Select from "../components/Select";
import ProblemRow from "../components/ProblemRow";
import { SkeletonBar } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";
import ErrorAlert from "../components/ErrorAlert";
import PageHeader from "../components/PageHeader";
import Pagination from "../components/Pagination";
import type { Problem } from "../types";

const difficulties = ["easy", "medium", "hard"] as const;

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

export default function Problems() {
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [topic, setTopic] = useState("");
  const [company, setCompany] = useState("");
  const [page, setPage] = useState(1);

  const [statusMap, setStatusMap] = useState<Record<string, string>>({});
  const [solveLogProblem, setSolveLogProblem] = useState<{ id: string; title: string } | null>(null);
  const [addToListProblem, setAddToListProblem] = useState<Problem | null>(null);
  const [showCreateFromFilter, setShowCreateFromFilter] = useState(false);

  const activeFilters = { q: query, platform, difficulty, topic, company };
  const hasActiveFilters = Object.values(activeFilters).some((v) => v !== "");

  const { data, isLoading, error } = useProblems({
    q: query || undefined,
    platform: platform || undefined,
    difficulty: difficulty || undefined,
    topic: topic || undefined,
    company: company || undefined,
    page,
    per_page: 20,
  });
  const { data: platforms } = usePlatforms();
  const { data: companies } = useCompanies();
  const { data: customLists } = useLists("custom");
  const { data: membership } = useListContainsProblem(addToListProblem?.id ?? null);
  const setStatus = useSetProblemStatus();
  const addToList = useAddProblemToList();

  const handleSolve = (problemId: string, toSolved: boolean) => {
    setStatusMap((prev) => ({ ...prev, [problemId]: toSolved ? "solved" : "todo" }));
    setStatus.mutate(
      { problemId, status: toSolved ? "solved" : "todo" },
      {
        onSuccess: (res) => {
          if (toSolved && res.solve_log_required) {
            const problem = (data?.items ?? []).find((p) => p.id === problemId);
            if (problem) setSolveLogProblem({ id: problemId, title: problem.title });
          }
        },
      },
    );
  };

  const handleStatusChange = (problemId: string, newStatus: string) => {
    setStatusMap((prev) => ({ ...prev, [problemId]: newStatus }));
    setStatus.mutate(
      { problemId, status: newStatus as "todo" | "solving" | "solved" | "skipped" },
      {
        onSuccess: (res) => {
          if (newStatus === "solved" && res.solve_log_required) {
            const problem = (data?.items ?? []).find((p) => p.id === problemId);
            if (problem) setSolveLogProblem({ id: problemId, title: problem.title });
          }
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Problems" description="Browse and track your problems" />

      <div className="max-w-sm">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search problems..."
            className="bg-surface-200/30 w-full pl-9 pr-3 py-2 text-sm text-surface-800 outline-none placeholder:text-surface-500"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select
          value={platform}
          onChange={(v) => { setPlatform(v); setPage(1); }}
          placeholder="Platform"
          bordered={false}
          options={[
            { value: "", label: "All platforms" },
            ...(platforms?.map((p) => ({ value: p.value, label: p.label, labelClass: platformColor(p.value) })) ?? []),
          ]}
        />
        <Select
          value={difficulty}
          onChange={(v) => { setDifficulty(v); setPage(1); }}
          placeholder="Difficulty"
          bordered={false}
          options={[
            { value: "", label: "All difficulties" },
            ...difficulties.map((d) => ({ value: d, label: d.charAt(0).toUpperCase() + d.slice(1) })),
          ]}
        />
        <Select
          value={topic}
          onChange={(v) => { setTopic(v); setPage(1); }}
          placeholder="Topic"
          bordered={false}
          options={[
            { value: "", label: "All topics" },
            ...TOPICS.map((t) => ({ value: t, label: t })),
          ]}
        />
        <Select
          value={company}
          onChange={(v) => { setCompany(v); setPage(1); }}
          placeholder="Company"
          bordered={false}
          options={[
            { value: "", label: "All companies" },
            ...(companies ?? []).map((c) => ({ value: c, label: c, labelClass: companyColor(c) })),
          ]}
        />

        {hasActiveFilters && data && (
          <button
            type="button"
            onClick={() => setShowCreateFromFilter(true)}
            className="btn-primary ml-auto text-sm"
          >
            Create list from these filters ({data.total})
          </button>
        )}
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonBar key={i} />
          ))}
        </div>
      )}

      {error && <ErrorAlert message={(error as Error).message} />}

      {data && (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-1"
        >
          {data.items.length === 0 ? (
            <EmptyState message="No problems found." />
          ) : (
            data.items.map((problem) => (
              <ProblemRow
                key={problem.id}
                problem={problem}
                solved={statusMap[problem.id] === "solved"}
                onSolve={handleSolve}
                onStatusChange={handleStatusChange}
                onAddToList={setAddToListProblem}
                status={statusMap[problem.id] ?? "todo"}
                disabled={setStatus.isPending}
              />
            ))
          )}

          <Pagination
            page={page}
            total={data.total}
            perPage={data.per_page}
            onPageChange={setPage}
          />
        </motion.div>
      )}

      {solveLogProblem && (
        <SolveLogPopup
          problemId={solveLogProblem.id}
          problemTitle={solveLogProblem.title}
          onClose={() => setSolveLogProblem(null)}
        />
      )}

      {addToListProblem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setAddToListProblem(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md glass-card p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-1 text-lg font-semibold text-surface-900">Add to a sheet</h2>
            <p className="mb-4 truncate text-sm text-surface-400">{addToListProblem.title}</p>
            <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
              {(customLists?.items ?? []).length === 0 ? (
                <EmptyState message="No custom sheets yet. Create one on the Sheets page." />
              ) : (
                (customLists?.items ?? []).map((list) => (
                  <button
                    key={list.id}
                    onClick={() =>
                      addToList.mutate(
                        { listId: list.id, problemId: addToListProblem.id },
                        {
                          onSuccess: () => {
                            setAddToListProblem(null);
                            toast.success(`Added to "${list.name}"`);
                          },
                          onError: (err) => toast.error((err as Error).message),
                        },
                      )
                    }
                    disabled={addToList.isPending || membership?.get(list.id)}
                    className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors disabled:opacity-40 ${
                      membership?.get(list.id)
                        ? "text-surface-500"
                        : "text-surface-400 hover:bg-surface-200 hover:text-surface-900"
                    }`}
                  >
                    <span className="truncate">{list.name}</span>
                    <span className="shrink-0 text-xs text-surface-500">
                      {membership?.get(list.id) ? "Already added" : `${list.problem_count} problems`}
                    </span>
                  </button>
                ))
              )}
            </div>
            <div className="mt-5 flex justify-end">
              <button type="button" onClick={() => setAddToListProblem(null)} className="btn-ghost text-sm">Cancel</button>
            </div>
          </motion.div>
        </div>
      )}

      {showCreateFromFilter && data && (
        <CreateListFromFiltersModal
          filters={activeFilters}
          total={data.total}
          onClose={() => setShowCreateFromFilter(false)}
        />
      )}
    </div>
  );
}

interface ActiveFilters {
  q: string;
  platform: string;
  difficulty: string;
  topic: string;
  company: string;
}

function suggestListName(filters: ActiveFilters): string {
  const parts = [
    filters.company,
    filters.topic,
    filters.difficulty && filters.difficulty.charAt(0).toUpperCase() + filters.difficulty.slice(1),
    filters.platform,
    filters.q,
  ].filter(Boolean);
  return parts.join(" · ");
}

function CreateListFromFiltersModal({
  filters,
  total,
  onClose,
}: {
  filters: ActiveFilters;
  total: number;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [name, setName] = useState(suggestListName(filters));
  const [confirmText, setConfirmText] = useState("");
  const createFromFilter = useCreateListFromFilter();

  const canSubmit = name.trim().length > 0 && confirmText.trim().toLowerCase() === "create";

  const handleCreate = () => {
    if (!canSubmit) return;
    createFromFilter.mutate(
      {
        name: name.trim(),
        q: filters.q || undefined,
        platform: filters.platform || undefined,
        difficulty: filters.difficulty || undefined,
        topic: filters.topic || undefined,
        company: filters.company || undefined,
      },
      {
        onSuccess: (list) => {
          toast.success(`Created "${list.name}" with ${list.problem_count} problems`);
          onClose();
          navigate("/sheets");
        },
        onError: (err) => toast.error((err as Error).message),
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md glass-card p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 text-lg font-semibold text-surface-900">Create list from filters</h2>
        <p className="mb-4 text-sm text-surface-400">
          Creates a new sheet with all {total} matching problem{total === 1 ? "" : "s"}.
        </p>

        <label className="mb-1.5 block text-sm font-medium text-surface-300">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          className="input-glass w-full px-4 py-2.5 text-sm mb-4"
        />

        <label className="mb-1.5 block text-sm font-medium text-surface-300">
          Type <span className="font-mono text-surface-900">create</span> to confirm
        </label>
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="create"
          className="input-glass w-full px-4 py-2.5 text-sm"
        />

        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-ghost text-sm">Cancel</button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!canSubmit || createFromFilter.isPending}
            className="btn-primary text-sm"
          >
            {createFromFilter.isPending ? "Creating..." : "Create List"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

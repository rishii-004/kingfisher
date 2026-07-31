import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLists, useListProgress, useList, useCreateList, useDeleteList, useForkList, useResetListProgress, useAddProblemToList, useListContainsProblem, type ListProgress } from "../hooks/use-lists";
import { useUserProblems, useSetProblemStatus } from "../hooks/use-user-problems";
import { useAuth } from "../hooks/use-auth";
import { TOPICS } from "../lib/topics";
import api from "../lib/api";
import { toast } from "../lib/toast";
import SolveLogPopup from "../features/solve-log/SolveLogPopup";
import ListProgressCard from "../features/lists/ListProgressCard";
import GhostButton from "../components/GhostButton";
import ProblemRow from "../components/ProblemRow";
import type { Problem, ProblemList, ProblemListDetail } from "../types";
import { SkeletonBar, SkeletonCard } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import Select from "../components/Select";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const cardItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

type Tab = "global" | "custom";

const DIFFICULTIES = ["easy", "medium", "hard"] as const;

function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function extractTitleFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const match = u.pathname.match(/\/problems\/([^/]+)/);
    if (match) return slugToTitle(match[1]);
  } catch {}
  return "";
}

function AddProblemModal({ listId, onClose }: { listId: string; onClose: () => void }) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [status, setStatus] = useState<"idle" | "adding" | "done">("idle");
  const [message, setMessage] = useState("");

  const handleUrlChange = (value: string) => {
    setUrl(value);
    setMessage("");
    const extracted = extractTitleFromUrl(value);
    if (extracted) setTitle(extracted);
  };

  const handleAdd = async () => {
    if (!url.trim() || !title.trim()) return;
    setStatus("adding");
    setMessage("");
    try {
      const mod = await import("../lib/api");
      const api = mod.default;

      // 1. Check if URL already exists in global problems
      const searchRes = await api.get("/problems", { params: { q: url.trim(), per_page: 50 } });
      const existing = searchRes.data?.data?.items?.find(
        (p: any) => p.platform_url === url.trim(),
      );

      let problemId: string;
      if (existing) {
        problemId = existing.id;
      } else {
        // 2. Create new problem in global pool
        const createRes = await api.post("/admin/problems", {
          title: title.trim(),
          slug: title.trim().toLowerCase().replace(/\s+/g, "-"),
          platform: "leetcode",
          platform_url: url.trim(),
          difficulty,
          topic_tags: topic ? [topic] : [],
          company_tags: [],
        });
        problemId = createRes.data.data.id;
      }

      // 3. Add to list
      const addRes = await api.post(`/lists/${listId}/problems`, { problem_id: problemId });
      if (addRes.data?.data) {
        if (addRes.data.data?.error) {
          throw addRes.data.data.error;
        }
        setStatus("done");
        setTimeout(onClose, 600);
      } else {
        throw new Error("Failed to add problem to list");
      }
    } catch (err: any) {
      setStatus("idle");
      if (err?.code === "DUPLICATE" || err?.message?.includes?.("already in list")) {
        setMessage("This problem is already in the sheet.");
      } else {
        setMessage("Something went wrong. Try again.");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg glass-card p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-5 text-lg font-semibold text-surface-900">Add problem</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-surface-300">URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://leetcode.com/problems/two-sum/"
              className="input-glass w-full px-4 py-2.5 text-sm"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-surface-300">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Two Sum"
              className="input-glass w-full px-4 py-2.5 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-300">Topic</label>
              <Select
                value={topic}
                onChange={setTopic}
                placeholder="Select topic"
                options={[
                  { value: "", label: "None" },
                  ...TOPICS.map((t) => ({ value: t, label: t })),
                ]}
                className="w-full"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-300">Difficulty</label>
              <Select
                value={difficulty}
                onChange={setDifficulty}
                options={DIFFICULTIES.map((d) => ({ value: d, label: d.charAt(0).toUpperCase() + d.slice(1) }))}
                className="w-full"
              />
            </div>
          </div>
        </div>
        {message && (
          <p className="mt-4 text-sm text-surface-400 text-center">{message}</p>
        )}
        <div className="flex justify-end gap-3 mt-6 pt-2">
          <button onClick={onClose} className="btn-ghost text-sm">Cancel</button>
          <button
            onClick={handleAdd}
            disabled={!url.trim() || !title.trim() || status === "adding" || status === "done"}
            className="btn-primary text-sm"
          >
            {status === "adding" ? "Adding..." : status === "done" ? "Added!" : "Add to sheet"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ListDetailView({ listId, onBack, onResetProgress }: { listId: string; onBack: () => void; onResetProgress: (list: ProblemListDetail) => void }) {
  const { data: listData, isLoading: listLoading } = useList(listId);
  const { data: userProblemsData } = useUserProblems({ per_page: 100 });
  const setStatus = useSetProblemStatus();
  const addToList = useAddProblemToList();
  const { data: customLists } = useLists("custom");
  const [showAdd, setShowAdd] = useState(false);
  const [solveLogProblem, setSolveLogProblem] = useState<{ id: string; title: string } | null>(null);
  const [addToListProblem, setAddToListProblem] = useState<Problem | null>(null);
  const { data: membership } = useListContainsProblem(addToListProblem?.id ?? null);

  const handleSolve = (problemId: string, toSolved: boolean) => {
    setStatus.mutate(
      { problemId, status: toSolved ? "solved" : "todo" },
      {
        onSuccess: (res) => {
          if (toSolved && res.solve_log_required) {
            const problem = listData?.problems.find((p) => p.id === problemId);
            if (problem) setSolveLogProblem({ id: problemId, title: problem.title });
          }
        },
      },
    );
  };

  const handleStatusChange = (problemId: string, newStatus: string) => {
    setStatus.mutate(
      { problemId, status: newStatus as "todo" | "solving" | "solved" | "skipped" },
      {
        onSuccess: (res) => {
          if (newStatus === "solved" && res.solve_log_required) {
            const problem = listData?.problems.find((p) => p.id === problemId);
            if (problem) setSolveLogProblem({ id: problemId, title: problem.title });
          }
        },
      },
    );
  };

  if (listLoading) {
    return (
      <div className="space-y-4">
        <SkeletonBar className="h-8 w-48" />
        <SkeletonBar className="h-4 w-72" />
        <SkeletonBar className="h-2 w-full mt-4" />
        <div className="space-y-2 mt-6">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonBar key={i} className="h-[52px]" />)}
        </div>
      </div>
    );
  }

  if (!listData) return null;

  const statusMap: Record<string, string> = {};
  if (userProblemsData) {
    for (const up of userProblemsData.items) {
      statusMap[up.problem_id] = up.status;
    }
  }

  const total = listData.problems.length;
  const solved = listData.problems.filter((p) => statusMap[p.id] === "solved").length;
  const progressPct = total > 0 ? Math.round((solved / total) * 100) : 0;

  const grouped: Record<string, ProblemListDetail["problems"]> = {};
  for (const p of listData.problems) {
    const topic = p.topic_tags[0] || "Other";
    if (!grouped[topic]) grouped[topic] = [];
    grouped[topic].push(p);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <button
          onClick={onBack}
          className="mt-1 flex items-center gap-1 text-sm text-surface-400 hover:text-surface-900 transition-colors"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back
        </button>
      </div>

      <div className="flex items-start justify-between">
        <PageHeader title={listData.name} description={listData.description ?? undefined} />
        <span className="text-sm text-surface-400 shrink-0 mt-1">{listData.problems.length} problems</span>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-surface-400 font-medium">{solved}/{total} solved</span>
          <div className="flex items-center gap-3">
            <span className="text-surface-500">{progressPct}%</span>
            <GhostButton onClick={() => onResetProgress(listData)} className="!px-2 !py-0.5">
              Reset
            </GhostButton>
          </div>
        </div>
        <div className="h-2 bg-surface-200/70 border border-surface-300/50">
          <div
            className="h-full bg-rose-500 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Add problem button */}
      <div className="flex justify-end">
        <GhostButton onClick={() => setShowAdd(true)} className="!px-3 !py-1.5 !text-xs">
          + Add problem
        </GhostButton>
      </div>

      {Object.keys(grouped).length === 0 && (
        <EmptyState message="No problems in this sheet yet. Add some!" />
      )}

      {Object.entries(grouped).map(([topic, problems]) => {
        const topicSolved = problems.filter((p) => statusMap[p.id] === "solved").length;
        return (
          <div key={topic}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-surface-500 uppercase tracking-widest">{topic}</h3>
              <span className="text-xs text-surface-500">{topicSolved}/{problems.length}</span>
            </div>
            <div className="space-y-1">
              {problems.map((problem) => (
                <ProblemRow
                  key={problem.id}
                  problem={problem}
                  solved={statusMap[problem.id] === "solved"}
                  onSolve={handleSolve}
                  onStatusChange={handleStatusChange}
                  onAddToList={setAddToListProblem}
                  disabled={setStatus.isPending}
                  status={statusMap[problem.id] ?? "todo"}
                />
              ))}
            </div>
          </div>
        );
      })}

      {showAdd && <AddProblemModal listId={listId} onClose={() => setShowAdd(false)} />}

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
            <h2 className="mb-1 text-lg font-semibold text-surface-900">Add to another sheet</h2>
            <p className="mb-4 truncate text-sm text-surface-400">{addToListProblem.title}</p>
            <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
              {(customLists?.items ?? []).filter((l) => l.id !== listId).length === 0 ? (
                <EmptyState message="No other custom sheets available." />
              ) : (
                (customLists?.items ?? []).filter((l) => l.id !== listId).map((list) => (
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
    </div>
  );
}

export default function Lists() {
  const [tab, setTab] = useState<Tab>("global");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<ProblemList | null>(null);
  const [confirmMode, setConfirmMode] = useState<"choose" | "reset" | "delete">("choose");
  const [password, setPassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const { user } = useAuth();

  const { data: globalLists, isLoading: loadingGlobal } = useLists("global");
  const { data: customLists, isLoading: loadingCustom } = useLists("custom");
  const { data: listProgress } = useListProgress();

  const progressMap = useMemo(() => {
    const map = new Map<string, ListProgress>();
    for (const entry of listProgress ?? []) map.set(entry.list.id, entry);
    return map;
  }, [listProgress]);

  const createList = useCreateList();
  const deleteList = useDeleteList();
  const forkList = useForkList();
  const resetList = useResetListProgress();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createList.mutate({ name: newName.trim(), description: newDesc.trim() || undefined }, {
      onSuccess: () => {
        setShowCreate(false);
        setNewName("");
        setNewDesc("");
      },
    });
  };

  const openDelete = (list: ProblemList) => {
    setConfirmTarget(list);
    setConfirmMode("choose");
    setPassword("");
    setDeleteError("");
  };

  const openReset = (list: ProblemListDetail) => {
    setConfirmTarget(list);
    setConfirmMode("reset");
    setPassword("");
    setDeleteError("");
  };

  const handlePasswordConfirm = async () => {
    if (!confirmTarget || !password.trim() || !user) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const { data } = await api.post("/auth/login", { email: user.email, password });
      if (data.error) throw new Error(data.error.message);
      const onSuccess = () => {
        setConfirmTarget(null);
        setPassword("");
      };
      if (confirmMode === "delete") {
        deleteList.mutate(confirmTarget.id, { onSuccess });
      } else {
        resetList.mutate(confirmTarget.id, { onSuccess });
      }
    } catch {
      setDeleteError("Incorrect password");
    } finally {
      setDeleting(false);
    }
  };

  const confirmModal = confirmTarget && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setConfirmTarget(null)}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md glass-card p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {confirmMode === "choose" ? (
          <>
            <h2 className="mb-2 text-lg font-semibold text-surface-900">Reset or delete sheet?</h2>
            <p className="mb-6 text-sm text-surface-400">
              What would you like to do with "{confirmTarget.name}"?
            </p>
            <div className="space-y-2.5">
              <button
                onClick={() => setConfirmMode("reset")}
                className="flex w-full items-center justify-between gap-3 border border-surface-300/40 px-4 py-3 text-left text-sm transition-colors hover:border-surface-300 hover:bg-surface-200/50"
              >
                <span>
                  <span className="block font-semibold text-surface-900">Reset progress</span>
                  <span className="block text-xs text-surface-500">Mark all problems as not started, clear solve logs &amp; reviews</span>
                </span>
                <span className="text-xs font-semibold uppercase tracking-wide text-surface-400">Reset</span>
              </button>
              <button
                onClick={() => setConfirmMode("delete")}
                className="flex w-full items-center justify-between gap-3 border border-rose-500/20 px-4 py-3 text-left text-sm transition-colors hover:border-rose-500/40 hover:bg-rose-500/5"
              >
                <span>
                  <span className="block font-semibold text-rose-400">Delete sheet</span>
                  <span className="block text-xs text-surface-500">Permanently remove this sheet</span>
                </span>
                <span className="text-xs font-semibold uppercase tracking-wide text-rose-400">Delete</span>
              </button>
            </div>
            <div className="mt-6 flex justify-end">
              <button type="button" onClick={() => setConfirmTarget(null)} className="btn-ghost text-sm">Cancel</button>
            </div>
          </>
        ) : (
          <>
            <h2 className="mb-2 text-lg font-semibold text-surface-900">
              {confirmMode === "delete" ? "Delete sheet" : "Reset progress"}
            </h2>
            <p className="mb-5 text-sm text-surface-400">
              {confirmMode === "delete"
                ? `This will permanently delete "${confirmTarget.name}". This action cannot be undone. Enter your password to confirm.`
                : `This will mark all problems in "${confirmTarget.name}" as not started and clear their solve logs & reviews. Enter your password to confirm.`}
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handlePasswordConfirm();
              }}
              className="space-y-4"
            >
              <div>
                <label className="mb-1.5 block text-sm font-medium text-surface-300" htmlFor="confirm-password">Password</label>
                <input
                  id="confirm-password"
                  type="password"
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-glass w-full px-4 py-2.5 text-sm"
                  placeholder="Enter your password"
                />
                {deleteError && <p className="mt-1.5 text-xs font-medium text-rose-400">{deleteError}</p>}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setConfirmMode("choose")} className="btn-ghost text-sm">Back</button>
                <GhostButton type="submit" disabled={deleting || !password.trim()}>
                  {deleting
                    ? confirmMode === "delete" ? "Deleting..." : "Resetting..."
                    : confirmMode === "delete" ? "Delete" : "Reset"}
                </GhostButton>
              </div>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );

  if (selectedListId) {
    return (
      <div className="space-y-6">
        <ListDetailView
          listId={selectedListId}
          onBack={() => setSelectedListId(null)}
          onResetProgress={openReset}
        />
        {confirmModal}
      </div>
    );
  }

  const lists = tab === "global" ? globalLists : customLists;
  const isLoading = tab === "global" ? loadingGlobal : loadingCustom;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Sheets" description="Manage problem sheets" />
        {tab === "custom" && (
          <button onClick={() => setShowCreate(true)} className="btn-primary">New sheet</button>
        )}
      </div>

      <div className="flex gap-1 bg-surface-200/50 p-1 w-fit">
        <button
          onClick={() => setTab("global")}
          className={`px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
            tab === "global" ? "bg-rose-500/10 text-rose-500" : "text-surface-400 hover:text-surface-900"
          }`}
        >
          Global
        </button>
        <button
          onClick={() => setTab("custom")}
          className={`px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
            tab === "custom" ? "bg-rose-500/10 text-rose-500" : "text-surface-400 hover:text-surface-900"
          }`}
        >
          My sheets
        </button>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} className="h-56" />)}
        </div>
      )}

      {lists && (
        <>
          {lists.items.length === 0 ? (
            <EmptyState message={tab === "global" ? "No global sheets yet." : "You haven't created any sheets yet."} />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                variants={container}
                initial="hidden"
                animate="show"
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              >
                {lists.items.map((list) => {
                  const progress = progressMap.get(list.id);
                  return (
                    <motion.div key={list.id} variants={cardItem}>
                      <ListProgressCard
                        list={list}
                        progress={progress}
                        detailed
                        onClick={() => setSelectedListId(list.id)}
                        actions={
                          <div className="flex gap-2">
                            {tab === "global" && (
                              <GhostButton onClick={() => forkList.mutate(list.id)}>
                                Fork
                              </GhostButton>
                            )}
                            {tab === "custom" && (
                              <GhostButton onClick={() => openDelete(list)}>
                                Delete
                              </GhostButton>
                            )}
                          </div>
                        }
                      />
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          )}
        </>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowCreate(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md glass-card p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-5 text-lg font-semibold text-surface-900">Create sheet</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-surface-300" htmlFor="name">Name</label>
                <input id="name" required value={newName} onChange={(e) => setNewName(e.target.value)} className="input-glass w-full px-4 py-2.5 text-sm" placeholder="My DP Sheet" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-surface-300" htmlFor="desc">Description (optional)</label>
                <textarea id="desc" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={3} className="input-glass w-full px-4 py-2.5 text-sm resize-none" placeholder="Must-solve DP problems..." />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-ghost text-sm">Cancel</button>
                <button type="submit" disabled={createList.isPending} className="btn-primary text-sm">
                  {createList.isPending ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {confirmModal}
    </div>
  );
}

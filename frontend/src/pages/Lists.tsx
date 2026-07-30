import { useState } from "react";
import { useLists, useCreateList, useDeleteList, useForkList } from "../hooks/use-lists";
import type { ProblemList } from "../types";

type Tab = "global" | "custom";

function ListCard({ list, onFork, onDelete }: { list: ProblemList; onFork?: () => void; onDelete?: () => void }) {
  return (
    <div className="rounded-xl border border-surface-800 bg-surface-900 p-5 hover:border-surface-700 transition-colors">
      <div className="mb-1 flex items-start justify-between">
        <h3 className="font-semibold text-white">{list.name}</h3>
        <span className="text-xs text-surface-500">{list.problem_count} problem{list.problem_count !== 1 ? "s" : ""}</span>
      </div>
      {list.description && (
        <p className="mb-4 text-sm text-surface-400 line-clamp-2">{list.description}</p>
      )}
      <div className="flex gap-2">
        {onFork && (
          <button onClick={onFork} className="rounded-lg bg-surface-800 px-3 py-1.5 text-xs font-medium text-surface-300 hover:bg-surface-700 hover:text-white transition-colors">
            Fork
          </button>
        )}
        {onDelete && (
          <button onClick={onDelete} className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors">
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

export default function Lists() {
  const [tab, setTab] = useState<Tab>("global");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const { data: globalLists, isLoading: loadingGlobal } = useLists("global");
  const { data: customLists, isLoading: loadingCustom } = useLists("custom");

  const createList = useCreateList();
  const deleteList = useDeleteList();
  const forkList = useForkList();

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

  const lists = tab === "global" ? globalLists : customLists;
  const isLoading = tab === "global" ? loadingGlobal : loadingCustom;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Lists</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          New list
        </button>
      </div>

      <div className="flex gap-1 rounded-lg bg-surface-900 p-1 w-fit">
        <button
          onClick={() => setTab("global")}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${tab === "global" ? "bg-surface-800 text-white" : "text-surface-400 hover:text-white"}`}
        >
          Global
        </button>
        <button
          onClick={() => setTab("custom")}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${tab === "custom" ? "bg-surface-800 text-white" : "text-surface-400 hover:text-white"}`}
        >
          My lists
        </button>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-surface-800" />
          ))}
        </div>
      )}

      {lists && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lists.items.map((list) => (
            <ListCard
              key={list.id}
              list={list}
              onFork={tab === "global" ? () => forkList.mutate(list.id) : undefined}
              onDelete={tab === "custom" ? () => deleteList.mutate(list.id) : undefined}
            />
          ))}
        </div>
      )}

      {lists?.items.length === 0 && (
        <p className="text-center text-surface-500 py-12">
          {tab === "global" ? "No global lists yet." : "You haven't created any lists yet."}
        </p>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md rounded-xl bg-surface-900 p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-semibold text-white">Create list</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-surface-400" htmlFor="name">Name</label>
                <input
                  id="name"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-lg bg-surface-800 px-4 py-2 text-white placeholder-surface-500 outline-none ring-1 ring-surface-700 focus:ring-2 focus:ring-blue-500"
                  placeholder="My DP List"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-surface-400" htmlFor="desc">Description (optional)</label>
                <textarea
                  id="desc"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg bg-surface-800 px-4 py-2 text-white placeholder-surface-500 outline-none ring-1 ring-surface-700 focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Must-solve DP problems..."
                />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreate(false)} className="rounded-lg px-4 py-2 text-sm text-surface-400 hover:text-white transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={createList.isPending} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {createList.isPending ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

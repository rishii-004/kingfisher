import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { toast } from "../lib/toast";
import { useAuth } from "../hooks/use-auth";
import type { ApiResponse, PaginatedResponse, Problem, ProblemList, User } from "../types";

type Tab = "problems" | "lists" | "users";

// --- Problem Management ---

function ProblemForm({ onDone }: { onDone: () => void }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [platform, setPlatform] = useState("leetcode");
  const [url, setUrl] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [topics, setTopics] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ApiResponse<Problem>>("/admin/problems", {
        title, slug, platform, platform_url: url, difficulty,
        topic_tags: topics.split(",").map((s) => s.trim()).filter(Boolean),
        company_tags: [],
      });
      if (data.error) throw new Error(data.error.message);
      return data.data!;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-problems"] }); toast.success("Problem created"); onDone(); },
    onError: (err) => toast.error((err as Error).message),
  });

  return (
    <form onSubmit={(e: FormEvent) => { e.preventDefault(); create.mutate(); }} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-surface-400">Title</label>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg bg-surface-800 px-3 py-2 text-white outline-none ring-1 ring-surface-700 focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-surface-400">Slug</label>
          <input required value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full rounded-lg bg-surface-800 px-3 py-2 text-white outline-none ring-1 ring-surface-700 focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-surface-400">Platform</label>
          <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full rounded-lg bg-surface-800 px-3 py-2 text-white outline-none ring-1 ring-surface-700 focus:ring-2 focus:ring-blue-500">
            <option value="leetcode">LeetCode</option>
            <option value="gfg">GeeksforGeeks</option>
            <option value="neetcode">NeetCode</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-surface-400">Difficulty</label>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full rounded-lg bg-surface-800 px-3 py-2 text-white outline-none ring-1 ring-surface-700 focus:ring-2 focus:ring-blue-500">
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm text-surface-400">URL</label>
          <input value={url} onChange={(e) => setUrl(e.target.value)} className="w-full rounded-lg bg-surface-800 px-3 py-2 text-white outline-none ring-1 ring-surface-700 focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm text-surface-400">Topic tags (comma separated)</label>
          <input value={topics} onChange={(e) => setTopics(e.target.value)} placeholder="Arrays & Hashing, Two Pointers" className="w-full rounded-lg bg-surface-800 px-3 py-2 text-white placeholder-surface-500 outline-none ring-1 ring-surface-700 focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onDone} className="rounded-lg px-4 py-2 text-sm text-surface-400 hover:text-white transition-colors">Cancel</button>
        <button type="submit" disabled={create.isPending} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50">
          {create.isPending ? "Creating..." : "Create"}
        </button>
      </div>
    </form>
  );
}

function ProblemsSection() {
  const [showForm, setShowForm] = useState(false);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-problems"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PaginatedResponse<Problem>>>("/admin/problems?per_page=50");
      if (data.error) throw new Error(data.error.message);
      return data.data!;
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/admin/problems/${id}`); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-problems"] }); toast.success("Problem deleted"); },
    onError: (err) => toast.error((err as Error).message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white">Problems</h3>
        <button onClick={() => setShowForm(!showForm)} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors">
          {showForm ? "Cancel" : "Add Problem"}
        </button>
      </div>
      {showForm && <ProblemForm onDone={() => setShowForm(false)} />}
      {isLoading && <div className="h-32 animate-pulse rounded-lg bg-surface-800" />}
      {data && (
        <div className="space-y-2">
          {data.items.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-lg border border-surface-800 px-4 py-2.5 text-sm">
              <span className="flex-1 text-white truncate">{p.title}</span>
              <span className="text-xs text-surface-500 capitalize">{p.platform}</span>
              <span className={`text-xs capitalize ${p.difficulty === "easy" ? "text-green-400" : p.difficulty === "medium" ? "text-yellow-400" : "text-red-400"}`}>{p.difficulty}</span>
              <button onClick={() => del.mutate(p.id)} className="text-red-400 hover:text-red-300 text-xs">Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- List Management ---

function ListForm({ onDone }: { onDone: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ApiResponse<ProblemList>>("/admin/lists", { name, description: desc || undefined });
      if (data.error) throw new Error(data.error.message);
      return data.data!;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-lists"] }); toast.success("List created"); onDone(); },
    onError: (err) => toast.error((err as Error).message),
  });

  return (
    <form onSubmit={(e: FormEvent) => { e.preventDefault(); create.mutate(); }} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm text-surface-400">Name</label>
        <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg bg-surface-800 px-3 py-2 text-white outline-none ring-1 ring-surface-700 focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="mb-1 block text-sm text-surface-400">Description</label>
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} className="w-full rounded-lg bg-surface-800 px-3 py-2 text-white outline-none ring-1 ring-surface-700 focus:ring-2 focus:ring-blue-500 resize-none" />
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onDone} className="rounded-lg px-4 py-2 text-sm text-surface-400 hover:text-white transition-colors">Cancel</button>
        <button type="submit" disabled={create.isPending} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50">
          {create.isPending ? "Creating..." : "Create"}
        </button>
      </div>
    </form>
  );
}

function ListsSection() {
  const [showForm, setShowForm] = useState(false);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-lists"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PaginatedResponse<ProblemList>>>("/admin/lists?per_page=50");
      if (data.error) throw new Error(data.error.message);
      return data.data!;
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/admin/lists/${id}`); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-lists"] }); toast.success("List deleted"); },
    onError: (err) => toast.error((err as Error).message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white">Global Lists</h3>
        <button onClick={() => setShowForm(!showForm)} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors">
          {showForm ? "Cancel" : "Add List"}
        </button>
      </div>
      {showForm && <ListForm onDone={() => setShowForm(false)} />}
      {isLoading && <div className="h-32 animate-pulse rounded-lg bg-surface-800" />}
      {data && (
        <div className="space-y-2">
          {data.items.map((l) => (
            <div key={l.id} className="flex items-center gap-3 rounded-lg border border-surface-800 px-4 py-2.5 text-sm">
              <span className="flex-1 text-white truncate">{l.name}</span>
              <span className="text-xs text-surface-500">{l.problem_count} problems</span>
              <button onClick={() => del.mutate(l.id)} className="text-red-400 hover:text-red-300 text-xs">Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- User Management ---

function UsersSection() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", q],
    queryFn: async () => {
      const params = q ? `?q=${encodeURIComponent(q)}` : "";
      const { data } = await api.get<ApiResponse<PaginatedResponse<User>>>(`/admin/users${params}`);
      if (data.error) throw new Error(data.error.message);
      return data.data!;
    },
  });

  const toggleAdmin = useMutation({
    mutationFn: async (id: string) => { await api.patch(`/admin/users/${id}/toggle-admin`); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("Admin role toggled"); },
    onError: (err) => toast.error((err as Error).message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/admin/users/${id}`); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("User deleted"); },
    onError: (err) => toast.error((err as Error).message),
  });

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-white">Users</h3>
      <input
        value={q} onChange={(e) => setQ(e.target.value)}
        placeholder="Search users..."
        className="w-full rounded-lg bg-surface-800 px-3 py-2 text-white placeholder-surface-500 outline-none ring-1 ring-surface-700 focus:ring-2 focus:ring-blue-500"
      />
      {isLoading && <div className="h-32 animate-pulse rounded-lg bg-surface-800" />}
      {data && (
        <div className="space-y-2">
          {data.items.map((u) => (
            <div key={u.id} className="flex items-center gap-3 rounded-lg border border-surface-800 px-4 py-2.5 text-sm">
              <div className="flex-1 min-w-0">
                <span className="text-white truncate block">{u.username}</span>
                <span className="text-xs text-surface-500">{u.email}</span>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs ${u.is_admin ? "bg-blue-500/10 text-blue-400" : "bg-surface-800 text-surface-500"}`}>
                {u.is_admin ? "Admin" : "User"}
              </span>
              <button onClick={() => toggleAdmin.mutate(u.id)} className="text-xs text-surface-400 hover:text-white transition-colors">
                Toggle
              </button>
              <button onClick={() => del.mutate(u.id)} className="text-xs text-red-400 hover:text-red-300 transition-colors">
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Admin Page ---

export default function Admin() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("problems");

  if (!user?.is_admin) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-surface-500">You do not have admin access.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Admin</h1>

      <div className="flex gap-1 rounded-lg bg-surface-900 p-1 w-fit">
        {(["problems", "lists", "users"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-colors ${tab === t ? "bg-surface-800 text-white" : "text-surface-400 hover:text-white"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-surface-800 bg-surface-900 p-5">
        {tab === "problems" && <ProblemsSection />}
        {tab === "lists" && <ListsSection />}
        {tab === "users" && <UsersSection />}
      </div>
    </div>
  );
}

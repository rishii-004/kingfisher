import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import api from "../lib/api";
import { toast } from "../lib/toast";
import { useAuth } from "../hooks/use-auth";
import type { ApiResponse, PaginatedResponse, Problem, ProblemList, User } from "../types";

type Tab = "problems" | "lists" | "users";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

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
          <label className="mb-1.5 block text-sm font-medium text-surface-300">Title</label>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className="input-glass w-full px-4 py-2.5 text-sm" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-surface-300">Slug</label>
          <input required value={slug} onChange={(e) => setSlug(e.target.value)} className="input-glass w-full px-4 py-2.5 text-sm" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-surface-300">Platform</label>
          <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="input-glass w-full px-4 py-2.5 text-sm">
            <option value="leetcode">LeetCode</option>
            <option value="gfg">GeeksforGeeks</option>
            <option value="neetcode">NeetCode</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-surface-300">Difficulty</label>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="input-glass w-full px-4 py-2.5 text-sm">
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-surface-300">URL</label>
          <input value={url} onChange={(e) => setUrl(e.target.value)} className="input-glass w-full px-4 py-2.5 text-sm" />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-surface-300">Topic tags (comma separated)</label>
          <input value={topics} onChange={(e) => setTopics(e.target.value)} placeholder="Arrays & Hashing, Two Pointers" className="input-glass w-full px-4 py-2.5 text-sm" />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onDone} className="btn-ghost text-sm">Cancel</button>
        <button type="submit" disabled={create.isPending} className="btn-primary text-sm">
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
        <h3 className="font-semibold text-surface-900">Problems</h3>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-xs py-1.5 px-3">
          {showForm ? "Cancel" : "Add Problem"}
        </button>
      </div>
      {showForm && <ProblemForm onDone={() => setShowForm(false)} />}
      {isLoading && <div className="h-32 animate-pulse bg-surface-200/50" />}
      {data && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-2">
          {data.items.map((p) => (
            <motion.div key={p.id} variants={item} className="glass-hover px-5 py-3">
              <div className="flex items-center gap-3 text-sm">
                <span className="flex-1 text-surface-900 truncate">{p.title}</span>
                <span className="text-xs text-surface-400 capitalize">{p.platform}</span>
                <span className={`text-xs font-medium capitalize ${p.difficulty === "easy" ? "text-green-400" : p.difficulty === "medium" ? "text-yellow-400" : "text-red-400"}`}>{p.difficulty}</span>
                <button onClick={() => del.mutate(p.id)} className="btn-danger text-xs py-1 px-2">Delete</button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-lists"] }); toast.success("Sheet created"); onDone(); },
    onError: (err) => toast.error((err as Error).message),
  });

  return (
    <form onSubmit={(e: FormEvent) => { e.preventDefault(); create.mutate(); }} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-surface-300">Name</label>
        <input required value={name} onChange={(e) => setName(e.target.value)} className="input-glass w-full px-4 py-2.5 text-sm" />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-surface-300">Description</label>
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} className="input-glass w-full px-4 py-2.5 text-sm resize-none" />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onDone} className="btn-ghost text-sm">Cancel</button>
        <button type="submit" disabled={create.isPending} className="btn-primary text-sm">
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-lists"] }); toast.success("Sheet deleted"); },
    onError: (err) => toast.error((err as Error).message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-surface-900">Global Sheets</h3>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-xs py-1.5 px-3">
          {showForm ? "Cancel" : "Add Sheet"}
        </button>
      </div>
      {showForm && <ListForm onDone={() => setShowForm(false)} />}
      {isLoading && <div className="h-32 animate-pulse bg-surface-200/50" />}
      {data && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-2">
          {data.items.map((l) => (
            <motion.div key={l.id} variants={item} className="glass-hover px-5 py-3">
              <div className="flex items-center gap-3 text-sm">
                <span className="flex-1 text-surface-900 truncate">{l.name}</span>
                <span className="text-xs text-surface-400">{l.problem_count} problems</span>
                <button onClick={() => del.mutate(l.id)} className="btn-danger text-xs py-1 px-2">Delete</button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

function MaxListsControl({ user }: { user: User }) {
  const qc = useQueryClient();
  const [value, setValue] = useState(String(user.max_lists));

  const update = useMutation({
    mutationFn: async (maxLists: number) => {
      const { data } = await api.patch<ApiResponse<User>>(`/admin/users/${user.id}/max-lists`, { max_lists: maxLists });
      if (data.error) throw new Error(data.error.message);
      return data.data!;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("List limit updated"); },
    onError: (err) => { toast.error((err as Error).message); setValue(String(user.max_lists)); },
  });

  if (user.is_admin) {
    return <span className="text-xs text-surface-500 w-24 text-center">Unlimited</span>;
  }

  const submit = () => {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0) { setValue(String(user.max_lists)); return; }
    if (parsed !== user.max_lists) update.mutate(parsed);
  };

  return (
    <input
      type="number"
      min={0}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={submit}
      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
      disabled={update.isPending}
      className="input-glass w-24 px-2 py-1 text-xs text-center"
      title="Max custom lists"
    />
  );
}

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
      <h3 className="font-semibold text-surface-900">Users</h3>
      <div className="relative">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Search users..."
          className="input-glass w-full pl-10 pr-4 py-2.5 text-sm"
        />
      </div>
      {isLoading && <div className="h-32 animate-pulse bg-surface-200/50" />}
      {data && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-2">
          {data.items.map((u) => (
            <motion.div key={u.id} variants={item} className="glass-hover px-5 py-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="flex-1 min-w-0">
                  <span className="text-surface-900 truncate block font-medium">{u.username}</span>
                  <span className="text-xs text-surface-500">{u.email}</span>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  u.is_admin ? "bg-rose-100 text-rose-600" : "bg-surface-200/70 text-surface-400"
                }`}>
                  {u.is_admin ? "Admin" : "User"}
                </span>
                <MaxListsControl user={u} />
                <button onClick={() => toggleAdmin.mutate(u.id)} className="btn-secondary text-xs py-1 px-2">
                  Toggle
                </button>
                <button onClick={() => del.mutate(u.id)} className="btn-danger text-xs py-1 px-2">
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

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
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Admin</h1>
        <p className="text-sm text-surface-400 mt-0.5">Manage problems, sheets, and users</p>
      </div>

      <div className="flex gap-1 bg-surface-200/50 p-1 w-fit border border-surface-300/50">
        {(["problems", "lists", "users"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm font-medium transition-all ${
              tab === t ? "bg-surface-200 text-surface-900" : "text-surface-400 hover:text-surface-900"
            }`}
          >
            {t === "lists" ? "Sheets" : t === "users" ? "Users" : "Problems"}
          </button>
        ))}
      </div>

      <motion.div
        key={tab}
        variants={container}
        initial="hidden"
        animate="show"
        className="glass-card p-5"
      >
        {tab === "problems" && <ProblemsSection />}
        {tab === "lists" && <ListsSection />}
        {tab === "users" && <UsersSection />}
      </motion.div>
    </div>
  );
}

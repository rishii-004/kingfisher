import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/use-auth";
import { useExportData, useImportData } from "../hooks/use-portability";
import { toast } from "../lib/toast";
import { getGlowColor, getThemeKey, glowOptions, setGlowColor, setThemeKey, themeOptions } from "../lib/theme-glow";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function Settings() {
  const { user } = useAuth();
  const exportData = useExportData();
  const importData = useImportData();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [glow, setGlow] = useState<string>(() => getGlowColor());
  const [themeKey, setTheme] = useState<string>(() => getThemeKey());

  const handleExport = () => {
    exportData.mutate(undefined, {
      onSuccess: () => toast.success("Data exported successfully"),
      onError: (err) => toast.error((err as Error).message),
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      importData.mutate(data, {
        onSuccess: (result) => {
          toast.success(`Imported ${result.imported.user_problems} problems, ${result.imported.solve_logs} logs, ${result.imported.reviews} reviews, ${result.imported.custom_lists} lists`);
        },
        onError: (err) => toast.error((err as Error).message),
        onSettled: () => setImporting(false),
      });
    } catch {
      toast.error("Invalid JSON file");
      setImporting(false);
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-surface-900">Settings</h1>
        <p className="text-sm text-surface-400 mt-0.5">Manage your account and data</p>
      </motion.div>

      <motion.div variants={item} className="glass-card p-6">
        <h2 className="mb-5 text-lg font-semibold text-surface-900">Profile</h2>
        {user && (
          <dl className="space-y-3.5 text-sm">
            <div className="flex justify-between items-center py-1">
              <dt className="text-surface-400">Username</dt>
              <dd className="text-surface-900 font-medium">{user.username}</dd>
            </div>
            <div className="flex justify-between items-center py-1">
              <dt className="text-surface-400">Email</dt>
              <dd className="text-surface-900 font-medium">{user.email}</dd>
            </div>
            <div className="flex justify-between items-center py-1">
              <dt className="text-surface-400">Role</dt>
              <dd>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  user.is_admin ? "bg-rose-100 text-rose-600" : "bg-surface-200/70 text-surface-400"
                }`}>
                  {user.is_admin ? "Admin" : "User"}
                </span>
              </dd>
            </div>
            <div className="flex justify-between items-center py-1">
              <dt className="text-surface-400">Joined</dt>
              <dd className="text-surface-300">{new Date(user.created_at).toLocaleDateString()}</dd>
            </div>
          </dl>
        )}
      </motion.div>

      <motion.div variants={item} className="glass-card p-6">
        <h2 className="mb-5 text-lg font-semibold text-surface-900">Appearance</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <p className="mb-4 text-sm text-surface-400">Background glow color</p>
            <div className="flex flex-wrap gap-3">
              {glowOptions.map((c) => (
                <button
                  key={c.name}
                  onClick={() => {
                    setGlow(c.value);
                    setGlowColor(c.value);
                  }}
                  className={`border p-2.5 text-left transition-colors ${
                    glow === c.value
                      ? "border-surface-300 bg-surface-200"
                      : "border-surface-300/40 hover:border-surface-300/80"
                  }`}
                >
                  <div
                    className="h-14 w-24 border border-surface-300/40 bg-surface-50"
                    style={{
                      backgroundImage: `radial-gradient(ellipse 100% 70% at 50% 0%, ${c.value}, transparent 60%)`,
                    }}
                  />
                  <p className="mt-2 text-xs text-surface-500">{c.name}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-4 text-sm text-surface-400">Theme</p>
            <div className="flex flex-wrap gap-3">
              {themeOptions.map((t) => (
                <button
                  key={t.key}
                  onClick={() => {
                    setTheme(t.key);
                    setThemeKey(t.key);
                  }}
                  className={`border p-2.5 text-left transition-colors ${
                    themeKey === t.key
                      ? "border-surface-300 bg-surface-200"
                      : "border-surface-300/40 hover:border-surface-300/80"
                  }`}
                >
                  <div
                    className="h-14 w-24 border border-surface-300/40"
                    style={{ backgroundColor: t.vars["--color-surface-50"] }}
                  />
                  <p className="mt-2 text-xs text-surface-500">{t.name}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={item} className="glass-card p-6">
        <h2 className="mb-5 text-lg font-semibold text-surface-900">Data</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExport}
            disabled={exportData.isPending}
            className="btn-primary"
          >
            {exportData.isPending ? "Exporting..." : "Export Data"}
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="btn-secondary"
          >
            {importing ? "Importing..." : "Import Data"}
          </button>
          <input ref={fileRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />
        </div>
        <p className="mt-3 text-xs text-surface-500">Export your data as JSON, or import a previous export to restore it.</p>
      </motion.div>
    </motion.div>
  );
}

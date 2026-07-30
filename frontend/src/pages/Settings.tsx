import { useRef, useState } from "react";
import { useAuth } from "../hooks/use-auth";
import { useExportData, useImportData } from "../hooks/use-portability";
import { toast } from "../lib/toast";

export default function Settings() {
  const { user } = useAuth();
  const exportData = useExportData();
  const importData = useImportData();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

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
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      <section className="rounded-xl border border-surface-800 bg-surface-900 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Profile</h2>
        {user && (
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-surface-400">Username</dt>
              <dd className="text-white">{user.username}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-surface-400">Email</dt>
              <dd className="text-white">{user.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-surface-400">Role</dt>
              <dd className="text-white">{user.is_admin ? "Admin" : "User"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-surface-400">Joined</dt>
              <dd className="text-white">{new Date(user.created_at).toLocaleDateString()}</dd>
            </div>
          </dl>
        )}
      </section>

      <section className="rounded-xl border border-surface-800 bg-surface-900 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Data</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExport}
            disabled={exportData.isPending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {exportData.isPending ? "Exporting..." : "Export Data"}
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="rounded-lg bg-surface-800 px-4 py-2 text-sm font-medium text-surface-300 hover:bg-surface-700 hover:text-white transition-colors disabled:opacity-50"
          >
            {importing ? "Importing..." : "Import Data"}
          </button>
          <input ref={fileRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />
        </div>
        <p className="mt-3 text-xs text-surface-500">Export your data as JSON, or import a previous export to restore it.</p>
      </section>
    </div>
  );
}

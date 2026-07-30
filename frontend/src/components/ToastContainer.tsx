import { useEffect, useState } from "react";
import { toast } from "../lib/toast";

interface ToastItem {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

export default function ToastContainer() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unsub = toast.subscribe(setItems);
    return unsub;
  }, []);

  if (items.length === 0) return null;

  const colors = {
    success: "border-green-500/30 bg-green-500/10 text-green-300",
    error: "border-red-500/30 bg-red-500/10 text-red-300",
    info: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  };

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 max-w-sm">
      {items.map((item) => (
        <div
          key={item.id}
          className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${colors[item.type]}`}
        >
          <span className="flex-1">{item.message}</span>
          <button onClick={() => toast.dismiss(item.id)} className="text-current opacity-60 hover:opacity-100 transition-opacity">
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

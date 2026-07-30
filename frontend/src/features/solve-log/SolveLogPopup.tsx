import { useState, type FormEvent } from "react";
import { useCreateSolveLog } from "../../hooks/use-solve-log";
import MistakeTagSelect from "./MistakeTagSelect";
import type { MistakeTag } from "../../types";

interface Props {
  problemId: string;
  problemTitle: string;
  onClose: () => void;
}

const timeOptions = [
  { value: "<15m", label: "Less than 15 min" },
  { value: "15-30m", label: "15–30 min" },
  { value: "30-60m", label: "30–60 min" },
  { value: "1h+", label: "1 hour+" },
] as const;

export default function SolveLogPopup({ problemId, problemTitle, onClose }: Props) {
  const [notes, setNotes] = useState("");
  const [mistakeTags, setMistakeTags] = useState<MistakeTag[]>([]);
  const [timeSpent, setTimeSpent] = useState<"<15m" | "15-30m" | "30-60m" | "1h+">("<15m");
  const [scheduleReview, setScheduleReview] = useState(true);

  const createSolveLog = useCreateSolveLog();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    createSolveLog.mutate(
      { problemId, notes, mistake_tags: mistakeTags, time_spent: timeSpent },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl bg-surface-900 p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-white">Solved!</h2>
          <p className="text-sm text-surface-400 mt-1">{problemTitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-surface-300">What went wrong?</label>
            <MistakeTagSelect selected={mistakeTags} onChange={setMistakeTags} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-surface-300" htmlFor="notes">Notes (markdown)</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              className="w-full rounded-lg bg-surface-800 px-4 py-2 text-white placeholder-surface-500 outline-none ring-1 ring-surface-700 focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
              placeholder="## Intuition

Used a hashmap for O(n) lookup..."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-surface-300" htmlFor="time">Time spent</label>
            <select
              id="time"
              value={timeSpent}
              onChange={(e) => setTimeSpent(e.target.value as typeof timeSpent)}
              className="w-full rounded-lg bg-surface-800 px-4 py-2 text-white outline-none ring-1 ring-surface-700 focus:ring-2 focus:ring-blue-500"
            >
              {timeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={scheduleReview}
              onChange={(e) => setScheduleReview(e.target.checked)}
              className="h-4 w-4 rounded border-surface-700 bg-surface-800 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-surface-300">Schedule review (1 week)</span>
          </label>

          {createSolveLog.error && (
            <div className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
              {(createSolveLog.error as Error).message}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-surface-400 hover:text-white transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={createSolveLog.isPending}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {createSolveLog.isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

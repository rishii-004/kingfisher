import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { useCreateSolveLog } from "../../hooks/use-solve-log";
import MistakeTagSelect from "./MistakeTagSelect";
import Select from "../../components/Select";
import Checkbox from "../../components/Checkbox";
import type { MistakeTag } from "../../types";

interface Props {
  problemId: string;
  problemTitle: string;
  onClose: () => void;
}

const timeOptions = [
  { value: "<15m", label: "Less than 15 min" },
  { value: "15-30m", label: "15\u201330 min" },
  { value: "30-60m", label: "30\u201360 min" },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 " onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-lg glass-card-accent p-6 "
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5">
          <div className="flex items-center gap-3 mb-1">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/20 text-rose-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </span>
            <h2 className="text-lg font-semibold text-surface-900">Solved!</h2>
          </div>
          <p className="text-sm text-surface-400 ml-11">{problemTitle}</p>
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
              className="input-glass w-full px-4 py-2.5 text-sm font-mono resize-none"
              placeholder="## Intuition

Used a hashmap for O(n) lookup..."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-surface-300" htmlFor="time">Time spent</label>
            <Select
              value={timeSpent}
              onChange={(v) => setTimeSpent(v as typeof timeSpent)}
              options={timeOptions.map((o) => ({ value: o.value, label: o.label }))}
              className="w-full"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer group">
            <Checkbox checked={scheduleReview} onChange={() => setScheduleReview(!scheduleReview)} />
            <span className="text-sm text-surface-300 group-hover:text-surface-900 transition-colors">Schedule review (1 week)</span>
          </label>

          {createSolveLog.error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm text-red-400"
            >
              {(createSolveLog.error as Error).message}
            </motion.div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost text-sm">Cancel</button>
            <button
              type="submit"
              disabled={createSolveLog.isPending}
              className="btn-primary"
            >
              {createSolveLog.isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

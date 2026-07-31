import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useListProgress } from "../../hooks/use-lists";
import ListProgressCard from "./ListProgressCard";

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const grid = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

export default function ListProgress() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useListProgress();

  const active = (data ?? []).filter((p) => p.total > 0 && (p.solved > 0 || p.inProgress > 0));

  return (
    <motion.div variants={item} className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-surface-500 uppercase tracking-wider">Sheets in progress</h2>
        <Link
          to="/sheets"
          className="flex items-center gap-1 text-xs font-medium text-rose-400 hover:text-rose-300 transition-colors"
        >
          View all
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-[110px] animate-pulse bg-surface-200/50" />
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {(error as Error).message}
        </div>
      )}

      {data && active.length === 0 && (
        <Link to="/sheets" className="glass-card block px-5 py-8 text-center hover:bg-surface-200 transition-colors">
          <p className="text-sm text-surface-500">No sheets in progress yet. Browse sheets to get started.</p>
        </Link>
      )}

      {data && active.length > 0 && (
        <motion.div
          variants={grid}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {active.map(({ list, ...progress }) => (
            <motion.div key={list.id} variants={item}>
              <ListProgressCard list={list} progress={progress} onClick={() => navigate("/sheets")} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

import { type ReactNode } from "react";
import { motion } from "framer-motion";
import ReviewQueue from "../features/review/ReviewQueue";
import ListProgress from "../features/lists/ListProgress";
import DifficultyBadge from "../components/DifficultyBadge";
import { useUserProblems } from "../hooks/use-user-problems";
import { useReviewCount } from "../hooks/use-reviews";
import { useTimeSpentToday, formatDuration } from "../hooks/use-time-spent";

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

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function HourglassIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 22h14" />
      <path d="M5 2h14" />
      <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
      <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.828V2" />
    </svg>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: ReactNode;
  sub: string;
  icon: ReactNode;
  accent: string;
}) {
  return (
    <div className="glass-card flex min-w-[150px] flex-1 items-center gap-3.5 px-4 py-3.5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-surface-100" style={{ color: accent }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-surface-500">{label}</p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-surface-900 tabular-nums">{value}</span>
          <span className="truncate text-[11px] text-surface-500">{sub}</span>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: solved } = useUserProblems({ status: "solved", per_page: 1 });
  const { data: solving } = useUserProblems({ status: "solving", per_page: 1 });
  const { data: todo } = useUserProblems({ status: "todo", per_page: 1 });
  const { data: recent } = useUserProblems({ status: "solved", per_page: 5 });
  const { data: reviewCount } = useReviewCount();
  const timeSpent = useTimeSpentToday();

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      {/* Header */}
      <motion.div variants={item}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-surface-900">Dashboard</h1>
            <p className="text-sm text-surface-500 mt-0.5">Your problem-solving overview</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-3 px-4 py-2.5 bg-surface-100">
              <div className="flex h-8 w-8 items-center justify-center">
                <HourglassIcon className="h-4 w-4 text-purple-400" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-bold text-surface-900">{formatDuration(timeSpent)}</span>
                <span className="text-xs text-surface-500">time today</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats row */}
      <motion.div variants={item} className="flex flex-wrap gap-3">
        <StatCard
          label="Solved"
          value={solved?.total ?? "—"}
          sub="problems"
          accent="#10b981"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          }
        />
        <StatCard
          label="In Progress"
          value={solving?.total ?? "—"}
          sub="attempting"
          accent="#f59e0b"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5 14.25 2.25 12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
            </svg>
          }
        />
        <StatCard
          label="Planned"
          value={todo?.total ?? "—"}
          sub="in queue"
          accent="#38bdf8"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
            </svg>
          }
        />
        <StatCard
          label="Due Today"
          value={reviewCount ?? "—"}
          sub="to review"
          accent="#f43f5e"
          icon={<ClockIcon className="h-5 w-5" />}
        />
      </motion.div>

      {/* Main content 2-col */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div variants={item} className="glass-card p-5">
          <ReviewQueue preview />
        </motion.div>

        <motion.div variants={item} className="glass-card p-5">
          <h2 className="text-sm font-medium text-surface-500 uppercase tracking-wider mb-3">Recent Activity</h2>
          {recent ? (
            <div className="h-[260px] space-y-1.5 overflow-y-auto">
              {recent.items.length === 0 && (
                <p className="text-sm text-surface-500 py-4 text-center">No problems solved yet.</p>
              )}
              {recent.items.map((up) => (
                <div key={up.problem_id} className="flex items-center justify-between px-4 py-2.5 hover:bg-surface-200 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-rose-400 truncate">{up.problem.title}</p>
                    <p className="text-xs text-surface-500 mt-0.5">
                      Solved {up.solved_at ? new Date(up.solved_at).toLocaleDateString() : ""}
                    </p>
                  </div>
                  <div className="ml-3 shrink-0">
                    <DifficultyBadge difficulty={up.problem.difficulty} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[260px] space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[44px] animate-pulse bg-surface-200" />
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* List progress */}
      <ListProgress />
    </motion.div>
  );
}

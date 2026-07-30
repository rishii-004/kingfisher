import DueTodayBanner from "../features/review/DueTodayBanner";
import ReviewQueue from "../features/review/ReviewQueue";
import { useUserProblems } from "../hooks/use-user-problems";

export default function Dashboard() {
  const { data: recent } = useUserProblems({ status: "solved", per_page: 5 });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
      </div>

      <DueTodayBanner />

      <div className="grid gap-8 lg:grid-cols-2">
        <ReviewQueue />

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
          {recent ? (
            <div className="space-y-2">
              {recent.items.length === 0 && (
                <p className="text-sm text-surface-500">No problems solved yet. Start solving!</p>
              )}
              {recent.items.map((up) => (
                <div key={up.problem_id} className="rounded-lg border border-surface-800 px-4 py-3">
                  <p className="text-sm font-medium text-white">{up.problem.title}</p>
                  <p className="text-xs text-surface-500 mt-0.5">
                    Solved {up.solved_at ? new Date(up.solved_at).toLocaleDateString() : ""}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-surface-800" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

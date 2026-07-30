import { useReviewCount } from "../../hooks/use-reviews";

export default function DueTodayBanner() {
  const { data: count, isLoading } = useReviewCount();

  if (isLoading) {
    return <div className="h-16 animate-pulse rounded-xl bg-surface-800" />;
  }

  if (!count || count === 0) {
    return (
      <div className="rounded-xl border border-surface-800 bg-surface-900/50 px-6 py-4">
        <p className="text-sm text-surface-400">No reviews due. Great work!</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-white">{count} review{count !== 1 ? "s" : ""} due today</p>
          <p className="text-sm text-surface-400">Keep up the spaced repetition!</p>
        </div>
        <span className="text-3xl">📋</span>
      </div>
    </div>
  );
}

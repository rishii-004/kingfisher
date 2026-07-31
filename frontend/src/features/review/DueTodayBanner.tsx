import { useReviewCount } from "../../hooks/use-reviews";

export default function DueTodayBanner() {
  const { data: count, isLoading } = useReviewCount();

  if (isLoading) {
    return <div className="h-16 animate-pulse bg-surface-200/50" />;
  }

  if (!count || count === 0) {
    return (
      <div className="glass-card px-6 py-4">
        <p className="text-sm text-surface-400">No reviews due. Great work!</p>
      </div>
    );
  }

  return (
    <div className="glass-card-accent px-6 py-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-surface-900">{count} review{count !== 1 ? "s" : ""} due today</p>
          <p className="text-sm text-surface-400 mt-0.5">Keep up with your spaced repetition!</p>
        </div>
        <svg className="h-6 w-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    </div>
  );
}

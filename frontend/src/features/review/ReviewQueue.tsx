import { useState } from "react";
import { useDueReviews, useCompleteReview } from "../../hooks/use-reviews";
import type { Review } from "../../types";

const difficultyColor: Record<string, string> = {
  easy: "text-green-400 bg-green-500/10",
  medium: "text-yellow-400 bg-yellow-500/10",
  hard: "text-red-400 bg-red-500/10",
};

function ReviewItem({ review, onComplete, disabled }: { review: Review; onComplete: () => void; disabled: boolean }) {
  const stageLabels = ["1 week", "2 weeks", "1 month", "3 months"];

  return (
    <div className="flex items-center gap-4 rounded-lg border border-surface-800 px-4 py-3 hover:bg-surface-800/50 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{review.problem.title}</p>
        <div className="mt-1 flex gap-3 text-xs text-surface-500">
          <span className="capitalize">{review.problem.platform}</span>
          <span>Stage {review.review_stage + 1} — {stageLabels[review.review_stage] ?? "Done"}</span>
        </div>
      </div>

      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${difficultyColor[review.problem.difficulty]}`}>
        {review.problem.difficulty}
      </span>

      <button
        onClick={onComplete}
        disabled={disabled}
        className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-50"
      >
        Complete
      </button>
    </div>
  );
}

export default function ReviewQueue() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useDueReviews(page);
  const completeReview = useCompleteReview();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Review Queue</h2>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-surface-800" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {(error as Error).message}
        </div>
      )}

      {data && (
        <>
          <div className="space-y-2">
            {data.items.map((review) => (
              <ReviewItem
                key={review.id}
                review={review}
                onComplete={() => completeReview.mutate(review.id)}
                disabled={completeReview.isPending}
              />
            ))}
          </div>

          {data.items.length === 0 && (
            <p className="text-center text-surface-500 py-8">No reviews due right now.</p>
          )}

          {data.total > data.per_page && (
            <div className="flex items-center justify-between text-sm text-surface-400 pt-2">
              <span>{data.total} total</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-lg bg-surface-800 px-3 py-1.5 text-white hover:bg-surface-700 transition-colors disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= Math.ceil(data.total / data.per_page)}
                  className="rounded-lg bg-surface-800 px-3 py-1.5 text-white hover:bg-surface-700 transition-colors disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

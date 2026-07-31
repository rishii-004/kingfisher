import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useDueReviews, useCompleteReview } from "../../hooks/use-reviews";
import DifficultyBadge from "../../components/DifficultyBadge";
import GhostButton from "../../components/GhostButton";
import type { Review } from "../../types";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

function ReviewItem({ review, onComplete, disabled }: { review: Review; onComplete: () => void; disabled: boolean }) {
  const stageLabels = ["1 week", "2 weeks", "1 month", "3 months"];

  return (
    <motion.div
      variants={item}
      className="glass-hover px-4 py-3"
    >
      <div className="flex items-center gap-3">
        <div
          className="flex-1 min-w-0 cursor-pointer"
          title={review.problem.platform_url ?? review.problem.title}
          onClick={() => {
            if (review.problem.platform_url) {
              window.open(review.problem.platform_url, "_blank", "noopener,noreferrer");
            }
          }}
        >
          <p className="text-sm font-medium text-rose-400 truncate transition-colors hover:text-rose-300">{review.problem.title}</p>
          <div className="mt-0.5 flex gap-3 text-xs text-surface-500">
            <span className="capitalize">{review.problem.platform}</span>
            <span>Stage {review.review_stage + 1} &mdash; {stageLabels[review.review_stage] ?? "Done"}</span>
          </div>
        </div>

        <DifficultyBadge difficulty={review.problem.difficulty} />

        <GhostButton onClick={onComplete} disabled={disabled}>
          Complete
        </GhostButton>
      </div>
    </motion.div>
  );
}

export default function ReviewQueue({ preview = false }: { preview?: boolean }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useDueReviews(page, preview ? 5 : 20);
  const completeReview = useCompleteReview();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-surface-500 uppercase tracking-wider">Review Queue</h2>
        {preview && data && data.total > 0 && (
          <Link
            to="/review"
            className="flex items-center gap-1 text-xs font-medium text-rose-400 hover:text-rose-300 transition-colors"
          >
            View all
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        )}
      </div>

      {isLoading && (
        <div className={`space-y-2 ${preview ? "h-[260px] overflow-y-auto" : ""}`}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-[52px] animate-pulse bg-surface-200/50" />
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {(error as Error).message}
        </div>
      )}

      {data && (
        <>
          <div className={preview ? "h-[260px] overflow-y-auto" : ""}>
            {data.items.length === 0 ? (
              <div className="glass-card px-5 py-8 text-center">
                <p className="text-sm text-surface-500">No reviews due right now.</p>
              </div>
            ) : (
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-2"
              >
                {data.items.map((review) => (
                  <ReviewItem
                    key={review.id}
                    review={review}
                    onComplete={() => completeReview.mutate(review.id)}
                    disabled={completeReview.isPending}
                  />
                ))}
              </motion.div>
            )}
          </div>

          {!preview && data.total > data.per_page && (
            <div className="flex items-center justify-between text-sm text-surface-500 pt-1">
              <span>{data.total} total</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="btn-secondary py-1.5 px-3 text-xs"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= Math.ceil(data.total / data.per_page)}
                  className="btn-secondary py-1.5 px-3 text-xs"
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

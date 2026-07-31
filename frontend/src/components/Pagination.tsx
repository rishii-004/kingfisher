interface Props {
  page: number;
  total: number;
  perPage: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, total, perPage, onPageChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="flex items-center justify-between text-sm text-surface-500 mt-4 pt-2">
      <span>{total} item{total !== 1 ? "s" : ""}</span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="px-3 py-1.5 text-xs font-medium text-surface-400 transition-colors hover:bg-surface-200 hover:text-surface-900 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          previous
        </button>
        <span className="text-surface-500">page {page} of {totalPages}</span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 text-xs font-medium text-surface-400 transition-colors hover:bg-surface-200 hover:text-surface-900 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          next
        </button>
      </div>
    </div>
  );
}

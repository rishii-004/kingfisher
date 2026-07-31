interface Props {
  className?: string;
}

export function SkeletonBar({ className }: Props) {
  return <div className={`animate-pulse bg-surface-200/50 ${className ?? "h-[52px]"}`} />;
}

export function SkeletonCard({ className }: Props) {
  return <div className={`animate-pulse bg-surface-200/50 ${className ?? "h-32"}`} />;
}

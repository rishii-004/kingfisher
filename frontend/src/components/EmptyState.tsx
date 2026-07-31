interface Props {
  message?: string;
  className?: string;
}

export default function EmptyState({ message = "No items found.", className }: Props) {
  return (
    <div className={`glass-card px-5 py-12 text-center ${className ?? ""}`}>
      <p className="text-surface-500">{message}</p>
    </div>
  );
}

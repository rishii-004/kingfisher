interface Props {
  message: string;
  className?: string;
}

export default function ErrorAlert({ message, className }: Props) {
  return (
    <div className={`bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400 ${className ?? ""}`}>
      {message}
    </div>
  );
}

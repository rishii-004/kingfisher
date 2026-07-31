const dotColor: Record<string, string> = {
  easy: "bg-green-500",
  medium: "bg-yellow-500",
  hard: "bg-red-500",
};

export default function DifficultyBadge({ difficulty }: { difficulty: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 shrink-0">
      <span className={`h-2 w-2 rounded-full ${dotColor[difficulty] ?? "bg-surface-500"}`} />
      <span className="text-xs font-medium capitalize text-surface-400">{difficulty}</span>
    </span>
  );
}

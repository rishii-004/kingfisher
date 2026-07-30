import { useHeatmapData, useRadarData, useDifficultyBreakdown, useTimeTrends } from "../hooks/use-analytics";

function HeatmapChart() {
  const { data, isLoading } = useHeatmapData();

  if (isLoading) return <div className="h-48 animate-pulse rounded-xl bg-surface-800" />;
  if (!data) return null;

  const weeks: { week: string; days: { day: string; count: number }[] }[] = [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  let currentWeek: { day: string; count: number }[] = [];

  data.forEach((entry, i) => {
    const dow = new Date(entry.date).getDay();
    currentWeek.push({ day: dayNames[dow], count: entry.count });
    if (dow === 6 || i === data.length - 1) {
      while (currentWeek.length < 7) currentWeek.unshift({ day: dayNames[currentWeek.length], count: 0 });
      weeks.push({ week: `W${Math.floor(i / 7)}`, days: currentWeek });
      currentWeek = [];
    }
  });

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const getIntensity = (count: number) => {
    if (count === 0) return "bg-surface-800";
    const pct = count / maxCount;
    if (pct <= 0.25) return "bg-green-900";
    if (pct <= 0.5) return "bg-green-700";
    if (pct <= 0.75) return "bg-green-500";
    return "bg-green-400";
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-surface-400">Contribution Heatmap</h3>
      <div className="overflow-x-auto">
        <div className="flex gap-0.5" style={{ minWidth: weeks.length * 14 }}>
          {weeks.map((w) => (
            <div key={w.week} className="flex flex-col gap-0.5">
              {w.days.map((d) => (
                <div key={d.day} className={`h-3 w-3 rounded-sm ${getIntensity(d.count)}`} title={`${d.count} solves`} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RadarChart() {
  const { data, isLoading } = useRadarData();

  if (isLoading) return <div className="h-64 animate-pulse rounded-xl bg-surface-800" />;
  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data.map((d) => d.solved), 1);

  const centerX = 160, centerY = 160, radius = 120;
  const angleStep = (2 * Math.PI) / data.length;

  const points = data.map((d, i) => {
    const angle = -Math.PI / 2 + i * angleStep;
    const r = (d.solved / maxVal) * radius;
    return { ...d, x: centerX + r * Math.cos(angle), y: centerY + r * Math.sin(angle) };
  });

  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-surface-400">Skill Radar</h3>
      <svg viewBox="0 0 320 320" className="w-full max-w-xs mx-auto">
        {gridLevels.map((level) => {
          const r = radius * level;
          const gridPoints = data.map((_, i) => {
            const angle = -Math.PI / 2 + i * angleStep;
            return `${centerX + r * Math.cos(angle)},${centerY + r * Math.sin(angle)}`;
          }).join(" ");
          return <polygon key={level} points={gridPoints} fill="none" stroke="rgb(51 65 85)" strokeWidth={1} />;
        })}

        {data.map((_, i) => {
          const angle = -Math.PI / 2 + i * angleStep;
          const x2 = centerX + radius * Math.cos(angle);
          const y2 = centerY + radius * Math.sin(angle);
          return <line key={i} x1={centerX} y1={centerY} x2={x2} y2={y2} stroke="rgb(51 65 85)" strokeWidth={1} />;
        })}

        <polygon
          points={points.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="rgba(59, 130, 246, 0.15)"
          stroke="rgb(59, 130, 246)"
          strokeWidth={2}
        />

        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={4} fill="rgb(59, 130, 246)" />
        ))}

        {data.map((d, i) => {
          const angle = -Math.PI / 2 + i * angleStep;
          const labelR = radius + 20;
          const lx = centerX + labelR * Math.cos(angle);
          const ly = centerY + labelR * Math.sin(angle);
          return (
            <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" className="fill-surface-400 text-[10px]">
              {d.topic.split(" ")[0]}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function DifficultyChart() {
  const { data, isLoading } = useDifficultyBreakdown();

  if (isLoading) return <div className="h-32 animate-pulse rounded-xl bg-surface-800" />;
  if (!data) return null;

  const total = data.easy + data.medium + data.hard;
  if (total === 0) return <p className="text-sm text-surface-500">No data</p>;

  const items = [
    { label: "Easy", count: data.easy, color: "bg-green-500" },
    { label: "Medium", count: data.medium, color: "bg-yellow-500" },
    { label: "Hard", count: data.hard, color: "bg-red-500" },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-surface-400">Difficulty Breakdown</h3>
      <div className="flex h-3 rounded-full overflow-hidden">
        {items.map((item) =>
          item.count > 0 ? <div key={item.label} className={item.color} style={{ width: `${(item.count / total) * 100}%` }} /> : null
        )}
      </div>
      <div className="flex gap-4 text-xs text-surface-400">
        {items.map((item) => (
          <span key={item.label} className="flex items-center gap-1.5">
            <span className={`inline-block h-2 w-2 rounded-full ${item.color}`} />
            {item.label}: {item.count}
          </span>
        ))}
      </div>
    </div>
  );
}

function TimeChart() {
  const { data, isLoading } = useTimeTrends();

  if (isLoading) return <div className="h-32 animate-pulse rounded-xl bg-surface-800" />;
  if (!data) return null;

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  const bucketLabels: Record<string, string> = {
    "<15m": "< 15 min",
    "15-30m": "15–30 min",
    "30-60m": "30–60 min",
    "1h+": "1 hour+",
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-surface-400">Time Spent</h3>
      <div className="space-y-2">
        {data.map((entry) => (
          <div key={entry.bucket} className="flex items-center gap-3">
            <span className="w-20 text-xs text-surface-400 text-right">{bucketLabels[entry.bucket] || entry.bucket}</span>
            <div className="flex-1 h-5 rounded-md bg-surface-800 overflow-hidden">
              <div
                className="h-full rounded-md bg-blue-600 transition-all"
                style={{ width: `${(entry.count / maxCount) * 100}%` }}
              />
            </div>
            <span className="w-8 text-xs text-surface-500 text-right">{entry.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Analytics() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Analytics</h1>

      <HeatmapChart />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-surface-800 bg-surface-900 p-5">
          <RadarChart />
        </div>
        <div className="space-y-6">
          <div className="rounded-xl border border-surface-800 bg-surface-900 p-5">
            <DifficultyChart />
          </div>
          <div className="rounded-xl border border-surface-800 bg-surface-900 p-5">
            <TimeChart />
          </div>
        </div>
      </div>
    </div>
  );
}

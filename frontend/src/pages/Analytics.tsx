import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  useHeatmapData, useDifficultyBreakdown, useTimeSpentWeek,
  useWeeklyPattern, useTopicMastery,
  useReviewPipeline, useCompanyMastery,
} from "../hooks/use-analytics";
import type { TopicMastery } from "../types";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

/* ---------- Heatmap (full skeleton, GitHub-style) ---------- */
function HeatmapChart() {
  const year = new Date().getFullYear();
  const { data, isLoading } = useHeatmapData(year);

  if (isLoading) return <div className="h-36 animate-pulse bg-surface-200" />;
  if (!data) return null;

  const countMap = new Map(data.map((d) => [d.date, d.count]));
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  const level = (count: number) => {
    if (count === 0) return 0;
    const pct = count / maxCount;
    if (pct <= 0.25) return 1;
    if (pct <= 0.5) return 2;
    if (pct <= 0.75) return 3;
    return 4;
  };

  const cellBg = (lvl: number) => {
    if (lvl === 0) return "bg-surface-200/40";
    if (lvl === 1) return "bg-green-500";
    if (lvl === 2) return "bg-amber-500";
    if (lvl === 3) return "bg-orange-500";
    return "bg-red-600";
  };

  const pad = (n: number) => String(n).padStart(2, "0");

  const grid: { date: string; count: number; lvl: number }[][] = Array.from({ length: 7 }, () => []);
  let weekCol = -1;

  for (let m = 0; m < 12; m++) {
    const daysInMonth = new Date(Date.UTC(year, m + 1, 0)).getUTCDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${pad(m + 1)}-${pad(d)}`;
      const date = new Date(Date.UTC(year, m, d));
      const dow = date.getUTCDay();
      const count = countMap.get(dateStr) ?? 0;

      if (dow === 0) weekCol++;
      if (weekCol < 0) weekCol = 0;

      while (grid[dow].length <= weekCol) {
        for (let r = 0; r < 7; r++) {
          while (grid[r].length <= weekCol) grid[r].push({ date: "", count: 0, lvl: 0 });
        }
      }

      grid[dow][weekCol] = { date: dateStr, count, lvl: level(count) };
    }
  }

  const totalWeeks = Math.max(...grid.map((row) => row.length), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-surface-500">Activity</h3>
        <div className="flex items-center gap-1 text-xs text-surface-500">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((l) => (
            <div key={l} className={`h-3 w-3 ${cellBg(l)}`} />
          ))}
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div
          className="grid gap-[2px]"
          style={{
            gridTemplateColumns: `repeat(${totalWeeks}, 11px)`,
            gridTemplateRows: `repeat(7, 11px)`,
          }}
        >
          {grid.map((row, ri) =>
            row.map((cell, ci) => (
              <div
                key={`c-${ri}-${ci}`}
                className="group relative"
                style={{ gridColumn: ci + 1, gridRow: ri + 1 }}
              >
                <div className={`h-[11px] w-[11px] ${cellBg(cell.lvl)}`} />
                {cell.date && (
                  <div className="pointer-events-none absolute bottom-[13px] left-1/2 z-50 -translate-x-1/2 whitespace-nowrap border border-surface-300/50 bg-surface-900 px-2 py-1 text-xs opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="text-surface-300">{cell.date}</span> —{' '}
                    <span className="font-medium text-surface-100">{cell.count}</span> problems
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Radar (topic metrics, mirrors the bar chart) ---------- */
const RADAR_METRICS = [
  { key: "all", label: "All", color: "#a78bfa" },
  { key: "mastery", label: "Mastery", color: "#f43f5e" },
  { key: "reviews", label: "Reviews", color: "#38bdf8" },
  { key: "mistakes", label: "Mistakes", color: "#f59e0b" },
] as const;
type RadarMetric = (typeof RADAR_METRICS)[number]["key"];
const BASE_METRICS = RADAR_METRICS.filter((m) => m.key !== "all");

function RadarChart({ selected }: { selected: Set<string> | null }) {
  const { data, isLoading } = useTopicMastery();
  const [metric, setMetric] = useState<RadarMetric>("all");

  if (isLoading) return <div className="h-64 animate-pulse bg-surface-200" />;
  if (!data || data.length === 0) return null;

  const topics = selected ?? new Set(data.map((d) => d.topic));
  const active = data.filter((d) => topics.has(d.topic));

  const centerX = 160, centerY = 160, radius = 120;
  const angleStep = (2 * Math.PI) / active.length;
  const gridLevels = [0.25, 0.5, 0.75, 1];

  const metricValue = (key: RadarMetric, d: TopicMastery): number => {
    if (key === "reviews") return d.reviews_completed;
    if (key === "mistakes") return d.mistakes;
    return d.total > 0 ? d.solved / d.total : 0;
  };
  const metricMax = (key: RadarMetric) => Math.max(...active.map((d) => metricValue(key, d)), 1);

  const current = RADAR_METRICS.find((m) => m.key === metric)!;
  const polygons = metric === "all"
    ? BASE_METRICS.map((m) => ({
        key: m.key,
        color: m.color,
        points: active.map((d, i) => {
          const angle = -Math.PI / 2 + i * angleStep;
          const r = (metricValue(m.key, d) / metricMax(m.key)) * radius;
          return { x: centerX + r * Math.cos(angle), y: centerY + r * Math.sin(angle) };
        }),
      }))
    : [{
        key: current.key,
        color: current.color,
        points: active.map((d, i) => {
          const angle = -Math.PI / 2 + i * angleStep;
          const r = (metricValue(current.key, d) / metricMax(current.key)) * radius;
          return { x: centerX + r * Math.cos(angle), y: centerY + r * Math.sin(angle) };
        }),
      }];

  const labelOf = (d: TopicMastery): string => {
    if (metric === "reviews") return `${d.reviews_completed} review${d.reviews_completed !== 1 ? "s" : ""}`;
    if (metric === "mistakes") return `${d.mistakes} mistake${d.mistakes !== 1 ? "s" : ""}`;
    return `${d.solved}/${d.total} (${Math.round(metricValue("mastery", d) * 100)}%)`;
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-surface-500">Metrics</h3>
        <div className="flex gap-1">
          {RADAR_METRICS.map((m) => (
            <button
              key={m.key}
              onClick={() => setMetric(m.key)}
              className={`border px-2.5 py-1 text-xs transition-colors ${
                metric === m.key
                  ? "border-current bg-rose-500/10"
                  : "bg-surface-100 text-surface-500 border-surface-300/40 hover:text-surface-300"
              }`}
              style={metric === m.key ? { color: m.color } : undefined}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <svg viewBox="0 0 320 320" className="w-full max-w-xs mx-auto overflow-visible">
        {gridLevels.map((level) => {
          const r = radius * level;
          const gridPoints = active.map((_, i) => {
            const angle = -Math.PI / 2 + i * angleStep;
            return `${centerX + r * Math.cos(angle)},${centerY + r * Math.sin(angle)}`;
          }).join(" ");
          return <polygon key={level} points={gridPoints} fill="none" stroke="rgb(68 64 60)" strokeWidth={1} />;
        })}

        {active.map((_, i) => {
          const angle = -Math.PI / 2 + i * angleStep;
          const x2 = centerX + radius * Math.cos(angle);
          const y2 = centerY + radius * Math.sin(angle);
          return <line key={i} x1={centerX} y1={centerY} x2={x2} y2={y2} stroke="rgb(68 64 60)" strokeWidth={1} />;
        })}

        {polygons.map((poly) => (
          <g key={poly.key}>
            <polygon
              points={poly.points.map((p) => `${p.x},${p.y}`).join(" ")}
              fill={`${poly.color}1f`}
              stroke={poly.color}
              strokeWidth={2}
            />
            {poly.points.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={metric === "all" ? 2.5 : 4} fill={poly.color} />
            ))}
          </g>
        ))}

        {active.map((d, i) => {
          const angle = -Math.PI / 2 + i * angleStep;
          const labelR = radius + 22;
          const lx = centerX + labelR * Math.cos(angle);
          const ly = centerY + labelR * Math.sin(angle);
          const words = d.topic.split(" ");
          const short = words.length > 1 ? words[0] : d.topic;
          return (
            <g key={i}>
              <text x={lx} y={ly - 5} textAnchor="middle" dominantBaseline="middle" className="fill-surface-500 text-[10px] font-medium">
                {short}
              </text>
              <text x={lx} y={ly + 7} textAnchor="middle" dominantBaseline="middle" className="fill-surface-400 text-[9px] tabular-nums">
                {labelOf(d)}
              </text>
            </g>
          );
        })}
      </svg>

      {metric === "all" && (
        <div className="flex items-center justify-center gap-4 text-xs text-surface-500">
          {BASE_METRICS.map((m) => (
            <span key={m.key} className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: m.color }} />
              {m.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Topic Mastery (bullet bars, toggleable) ---------- */
function TopicMasteryChart({ selected, onToggle }: { selected: Set<string> | null; onToggle: (name: string, all: string[]) => void }) {
  const { data, isLoading } = useTopicMastery();

  if (isLoading) return <div className="h-48 animate-pulse bg-surface-200" />;
  if (!data || data.length === 0) return null;

  const palette = ["#f43f5e", "#f59e0b", "#34d399", "#38bdf8", "#a78bfa", "#fb923c", "#2dd4bf"];
  const topics = selected ?? new Set(data.map((t) => t.topic));
  const active = data.filter((t) => topics.has(t.topic));
  const totalSolved = active.reduce((s, t) => s + t.solved, 0);
  const totalAvailable = active.reduce((s, t) => s + t.total, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-surface-500">Topic Mastery</h3>
        <div className="flex flex-wrap gap-1.5">
          {data.map((t) => {
            const on = topics.has(t.topic);
            return (
              <button
                key={t.topic}
                onClick={() => onToggle(t.topic, data.map((x) => x.topic))}
                className={`px-2.5 py-1 text-xs transition-colors ${
                  on
                    ? "bg-rose-500/15 text-rose-400 border border-rose-500/40"
                    : "bg-surface-100 text-surface-500 border border-surface-300/40 hover:text-surface-300"
                }`}
              >
                {t.topic}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        {active.map((t, i) => {
          const pct = t.total > 0 ? (t.solved / t.total) * 100 : 0;
          return (
            <div key={t.topic} className="flex items-center gap-3">
              <span className="w-28 text-xs text-surface-400 shrink-0 truncate" title={t.topic}>{t.topic}</span>
              <div className="relative flex-1 h-4 bg-surface-200 overflow-hidden">
                <div
                  className="h-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: palette[i % palette.length] }}
                />
              </div>
              <span className="w-24 text-xs text-surface-500 shrink-0 tabular-nums text-right">
                <span className="text-surface-900 font-medium">{t.solved}</span>/{t.total}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between border-t border-surface-300/40 pt-3 text-xs text-surface-500">
        <span>Across {active.length} selected topics</span>
        <span>
          <span className="text-base font-bold text-surface-900">{totalSolved}</span>
          <span className="text-surface-500"> / {totalAvailable} problems</span>
        </span>
      </div>
    </div>
  );
}

/* ---------- Company prep (radial bars, weakest-first) ---------- */
const CURATED_KEY = "kf:company:curated";
const OFF_KEY = "kf:company:off";

const COMPANY_PALETTE = [
  "#f43f5e", "#38bdf8", "#f59e0b", "#34d399", "#a78bfa",
  "#f472b6", "#22d3ee", "#a3e635", "#fb923c", "#818cf8",
  "#facc15", "#2dd4bf", "#e879f9", "#60a5fa", "#fbbf24",
];

function CompanyChart() {
  const { data, isLoading } = useCompanyMastery();
  const [curated, setCurated] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(CURATED_KEY);
      if (saved) {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr) && arr.length > 0) return arr;
      }
    } catch { /* ignore */ }
    return [];
  });
  const [off, setOff] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(OFF_KEY);
      if (saved) {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr)) return new Set(arr);
      }
    } catch { /* ignore */ }
    return new Set();
  });
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (curated.length === 0 && data && data.length > 0) {
      setCurated(data.map((c) => c.company));
    }
  }, [data, curated.length]);

  useEffect(() => {
    localStorage.setItem(CURATED_KEY, JSON.stringify(curated));
  }, [curated]);

  useEffect(() => {
    localStorage.setItem(OFF_KEY, JSON.stringify([...off]));
  }, [off]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (isLoading) return <div className="h-64 animate-pulse bg-surface-200" />;
  if (!data || data.length === 0) return null;

  const byName = new Map(data.map((c) => [c.company, c]));
  const colorOf = (name: string) => {
    const idx = curated.indexOf(name);
    if (idx === -1) return "#f43f5e";
    if (idx < COMPANY_PALETTE.length) return COMPANY_PALETTE[idx];
    return `hsl(${(idx * 47) % 360}, 75%, 60%)`;
  };
  const active = curated
    .filter((name) => !off.has(name))
    .map((name) => byName.get(name) ?? { company: name, solved: 0, total: 0 });
  const available = data.filter((c) => !curated.includes(c.company));
  const matches = available.filter((c) => c.company.toLowerCase().includes(query.toLowerCase()));

  const toggle = (name: string) => {
    const next = new Set(off);
    if (next.has(name)) {
      next.delete(name);
    } else {
      const visibleCount = curated.filter((n) => !next.has(n)).length;
      if (visibleCount <= 1) return;
      next.add(name);
    }
    setOff(next);
  };

  const remove = (name: string) => {
    if (curated.length <= 1) return;
    setCurated((prev) => prev.filter((n) => n !== name));
    setOff((prev) => {
      const next = new Set(prev);
      next.delete(name);
      return next;
    });
  };

  const addCompany = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const match = data.find((c) => c.company.toLowerCase() === trimmed.toLowerCase());
    if (!match) return;
    if (curated.includes(match.company)) return;
    setCurated((prev) => [...prev, match.company]);
    setOff((prev) => {
      const next = new Set(prev);
      next.delete(match.company);
      return next;
    });
    setOpen(false);
    setQuery("");
  };

  const sorted = [...active].sort((a, b) => (a.total > 0 ? a.solved / a.total : 0) - (b.total > 0 ? b.solved / b.total : 0));

  const CX = 180, CY = 180, INNER = 26, BAR_MAX = 92, BAR_W = 13;
  const totalSolved = sorted.reduce((s, c) => s + c.solved, 0);
  const avg = Math.round(
    (sorted.reduce((s, c) => s + (c.total > 0 ? c.solved / c.total : 0), 0) / Math.max(sorted.length, 1)) * 100,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-surface-500">Company Prep</h3>
        <div className="flex flex-wrap items-center gap-1.5">
          {curated.map((name) => {
            const on = !off.has(name);
            return (
              <div
                key={name}
                className={`flex items-center text-xs transition-colors ${
                  on
                    ? "bg-rose-500/15 text-rose-400 border border-rose-500/40"
                    : "bg-surface-100 text-surface-500 border border-surface-300/40 hover:text-surface-300"
                }`}
              >
                <button onClick={() => toggle(name)} className="flex items-center gap-1.5 px-2.5 py-1">
                  <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: colorOf(name) }} />
                  {name}
                </button>
                <button
                  onClick={() => remove(name)}
                  title={`Remove ${name}`}
                  className="pr-2 text-surface-500 hover:text-rose-400"
                >
                  ×
                </button>
              </div>
            );
          })}

          <div ref={dropRef} className="relative">
            <button
              onClick={() => {
                setOpen((o) => !o);
                setQuery("");
              }}
              className="px-2.5 py-1 text-xs bg-surface-100 text-surface-500 border border-dashed border-surface-300/40 hover:text-surface-300"
            >
              + Add
            </button>

            {open && (
              <div className="absolute right-0 z-30 mt-2 w-56 overflow-hidden bg-surface-200 border border-surface-300 shadow-lg">
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && matches.length > 0) addCompany(matches[0].company);
                  }}
                  placeholder="Search companies..."
                  className="w-full bg-surface-100 border-b border-surface-300 px-3 py-2 text-xs text-rose-400 placeholder:text-surface-500 outline-none focus:border-rose-500/50"
                />
                <div className="no-scrollbar max-h-48 overflow-y-auto">
                  {matches.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-rose-400/70">No matches</div>
                  ) : (
                    matches.map((c) => (
                      <button
                        key={c.company}
                        onClick={() => addCompany(c.company)}
                        className="flex w-full items-center justify-between px-3 py-2 text-xs text-rose-400 hover:bg-surface-300/25 hover:text-rose-300"
                      >
                        <span>{c.company}</span>
                        <span className="text-[10px] text-rose-400/60 tabular-nums">
                          {c.total > 0 ? `${Math.round((c.solved / c.total) * 100)}%` : "0%"}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <svg viewBox="0 0 360 360" className="w-full max-w-sm mx-auto overflow-visible">
        {[0.25, 0.5, 0.75, 1].map((l) => (
          <circle key={l} cx={CX} cy={CY} r={INNER + BAR_MAX * l} fill="none" stroke="rgb(68 64 60)" strokeWidth={1} strokeDasharray="2 3" />
        ))}

        {sorted.map((c, i) => {
          const angle = (i / sorted.length) * 360 - 90;
          const pct = c.total > 0 ? c.solved / c.total : 0;
          const len = Math.max(pct * BAR_MAX, 3);
          return (
            <g key={c.company} transform={`rotate(${angle} ${CX} ${CY})`}>
              <title>{`${c.company}: ${c.solved}/${c.total} (${Math.round(pct * 100)}%)`}</title>
              <rect x={CX - BAR_W / 2} y={CY + INNER} width={BAR_W} height={BAR_MAX} rx={BAR_W / 2} fill="rgb(56 58 60)" />
              <rect x={CX - BAR_W / 2} y={CY + INNER + BAR_MAX - len} width={BAR_W} height={len} rx={BAR_W / 2} fill={colorOf(c.company)} />
            </g>
          );
        })}

        {sorted.map((c, i) => {
          const angleRad = (i / sorted.length) * 2 * Math.PI;
          const pct = c.total > 0 ? c.solved / c.total : 0;
          const lx = CX + (INNER + BAR_MAX + 20) * Math.cos(angleRad);
          const ly = CY + (INNER + BAR_MAX + 20) * Math.sin(angleRad);
          const label = sorted.length <= 6 ? c.company : (c.company.includes(" ") ? c.company.split(" ")[0] : c.company);
          const anchor = Math.cos(angleRad) > 0.3 ? "start" : Math.cos(angleRad) < -0.3 ? "end" : "middle";
          return (
            <g key={c.company}>
              <text x={lx} y={ly - 4} textAnchor={anchor} dominantBaseline="middle" fill={colorOf(c.company)} className="text-[10px] font-medium">
                {label}
              </text>
              <text x={lx} y={ly + 7} textAnchor={anchor} dominantBaseline="middle" fill={colorOf(c.company)} className="text-[9px] tabular-nums">
                {Math.round(pct * 100)}%
              </text>
            </g>
          );
        })}
      </svg>

      <div className="flex items-center justify-center gap-4 text-xs text-surface-500">
        <span>Avg prep</span>
        <span className="text-base font-bold text-surface-900">{avg}%</span>
        <span className="text-surface-500">{totalSolved} solved</span>
      </div>
    </div>
  );
}

/* ---------- Total Solved (bullseye target rings) ---------- */
function TotalSolvedChart() {
  const { data, isLoading } = useDifficultyBreakdown();

  if (isLoading) return <div className="h-40 animate-pulse bg-surface-200" />;
  if (!data) return null;

  const rings = [
    { label: "Easy", solved: data.easy, total: data.easy_total, color: "#22c55e" },
    { label: "Medium", solved: data.medium, total: data.medium_total, color: "#eab308" },
    { label: "Hard", solved: data.hard, total: data.hard_total, color: "#ef4444" },
  ];

  const grandTotal = rings.reduce((s, r) => s + r.solved, 0);
  const grandAll = rings.reduce((s, r) => s + r.total, 0);
  const CX = 110, CY = 110;
  const ringSpec = [
    { r: 32, w: 16 },
    { r: 58, w: 16 },
    { r: 84, w: 16 },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-surface-500">Total Solved</h3>
      <div className="flex items-center gap-6">
        <svg viewBox="0 0 220 220" className="h-44 w-44 shrink-0">
          {rings.map((ring, i) => {
            const { r, w } = ringSpec[i];
            const pct = ring.total > 0 ? (ring.solved / ring.total) * 100 : 0;
            return (
              <g key={ring.label}>
                <circle cx={CX} cy={CY} r={r} fill="none" stroke="rgb(56 58 60)" strokeWidth={w} />
                <circle
                  cx={CX}
                  cy={CY}
                  r={r}
                  fill="none"
                  stroke={ring.color}
                  strokeWidth={w}
                  strokeLinecap="round"
                  pathLength={100}
                  strokeDasharray={`${pct} ${100 - pct}`}
                  transform={`rotate(-90 ${CX} ${CY})`}
                  opacity={0.9}
                />
              </g>
            );
          })}
        </svg>
        <div className="space-y-2 text-xs">
          <div className="mb-1 flex items-baseline gap-1.5 border-b border-surface-300/40 pb-2">
            <span className="text-2xl font-bold text-surface-900 tabular-nums">{grandTotal}</span>
            <span className="text-surface-500">
              <span className="tabular-nums">{grandAll}</span> total
            </span>
          </div>
          {rings.map((ring) => (
            <div key={ring.label} className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: ring.color }} />
              <span className="w-12 text-surface-400">{ring.label}</span>
              <span className="text-surface-900 font-medium tabular-nums">
                {ring.solved}/{ring.total}
              </span>
              <span className="text-surface-500">
                ({Math.round(ring.total > 0 ? (ring.solved / ring.total) * 100 : 0)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Time Spent (last 7 days) ---------- */
function TimeChart() {
  const { data, isLoading } = useTimeSpentWeek();

  if (isLoading) return <div className="h-32 animate-pulse bg-surface-200" />;
  if (!data || data.length === 0) return null;

  const totalMinutes = data.reduce((s, d) => s + d.minutes, 0);
  const maxMinutes = Math.max(...data.map((d) => d.minutes), 1);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-surface-500">Time Spent · Last 7 Days</h3>
      <div className="flex h-32 items-end gap-2">
        {data.map((d) => {
          const hPct = (d.minutes / maxMinutes) * 100;
          const isToday = today === d.date;
          return (
            <div key={d.date} className="flex h-full flex-1 flex-col items-center justify-end min-w-0">
              <span className={`mb-1 text-[10px] tabular-nums ${isToday ? "text-violet-300 font-medium" : "text-surface-500"}`}>
                {d.minutes}m
              </span>
              <div className="flex w-full flex-1 items-end justify-center">
                <div
                  className={`w-3.5 rounded-sm transition-all duration-500 ${
                    isToday
                      ? "bg-gradient-to-t from-violet-600 to-fuchsia-400"
                      : "bg-gradient-to-t from-violet-600/40 to-fuchsia-400/40"
                  }`}
                  style={{ height: `${hPct}%` }}
                />
              </div>
              <span className={`mt-1 text-[10px] ${isToday ? "text-violet-300 font-medium" : "text-surface-500"}`}>{d.day}</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between border-t border-surface-300/40 pt-2.5 text-xs text-surface-500">
        <span>Total</span>
        <span className="text-base font-bold text-surface-900 tabular-nums">{totalMinutes}m</span>
      </div>
    </div>
  );
}

/* ---------- Weekly Pattern (week ring) ---------- */
function WeeklyPatternChart() {
  const { data, isLoading } = useWeeklyPattern();

  if (isLoading) return <div className="h-32 animate-pulse bg-surface-200" />;
  if (!data) return null;

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const total = data.reduce((s, d) => s + d.count, 0);
  const CX = 90, CY = 90, R = 62;
  const SEG_DEG = 360 / data.length;
  const GAP = 5;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-surface-500">Weekly Rhythm</h3>
      <div className="flex items-center gap-5">
        <svg viewBox="0 0 180 180" className="h-40 w-40 shrink-0">
          {data.map((d, i) => {
            const segLen = Math.max(((SEG_DEG - GAP) / 360) * 100, 3);
            const thickness = 6 + (d.count / maxCount) * 16;
            const opacity = d.count > 0 ? 0.35 + (d.count / maxCount) * 0.65 : 0.12;
            return (
              <circle
                key={d.day}
                cx={CX}
                cy={CY}
                r={R}
                fill="none"
                stroke="#f43f5e"
                strokeWidth={thickness}
                strokeLinecap="butt"
                pathLength={100}
                strokeDasharray={`${segLen} ${100 - segLen}`}
                transform={`rotate(${i * SEG_DEG + GAP / 2} ${CX} ${CY})`}
                opacity={opacity}
              />
            );
          })}
          <text x={CX} y={CY - 2} textAnchor="middle" className="fill-surface-900 text-lg font-bold tabular-nums">{total}</text>
          <text x={CX} y={CY + 12} textAnchor="middle" className="fill-surface-500 text-[9px] uppercase tracking-wider">solves</text>
        </svg>
        <div className="space-y-1 text-xs">
          {data.map((d) => (
            <div key={d.day} className="flex items-center justify-between gap-5">
              <span className="text-surface-500">{d.day}</span>
              <span className="text-surface-900 font-medium tabular-nums">{d.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Review Pipeline (funnel) ---------- */
function ReviewPipelineChart() {
  const { data, isLoading } = useReviewPipeline();

  if (isLoading) return <div className="h-32 animate-pulse bg-surface-200" />;
  if (!data) return null;

  const items = [
    { label: "Overdue", count: data.overdue, color: "#e11d48" },
    { label: "Due today", count: data.due_today, color: "#f97316" },
    { label: "This week", count: data.due_this_week, color: "#eab308" },
    { label: "Next week", count: data.due_next_week, color: "#10b981" },
    { label: "Later", count: data.due_later, color: "#71717a" },
  ];

  const maxCount = Math.max(...items.map((i) => i.count), 1);
  const maxW = 200;
  const stageH = 32;
  const gap = 8;
  const startY = 12;
  const width = (c: number) => Math.max(28, (c / maxCount) * maxW);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-surface-500">Review Pipeline</h3>
      <svg viewBox="0 0 320 220" className="w-full max-w-sm mx-auto">
        {items.map((item, i) => {
          const y0 = startY + i * (stageH + gap);
          const w0 = width(item.count);
          const y1 = i < items.length - 1 ? startY + (i + 1) * (stageH + gap) : y0 + stageH;
          const w1 = i < items.length - 1 ? width(items[i + 1].count) : w0;
          const points = `${160 - w0},${y0} ${160 + w0},${y0} ${160 + w1},${y1} ${160 - w1},${y1}`;
          return (
            <g key={item.label}>
              <polygon points={points} fill={item.color} opacity={0.85} />
              <text x={160} y={(y0 + y1) / 2 + 4} textAnchor="middle" className="fill-surface-950 text-xs font-bold tabular-nums">
                {item.count}
              </text>
            </g>
          );
        })}
        {items.map((item, i) => {
          const y0 = startY + i * (stageH + gap);
          const y1 = i < items.length - 1 ? startY + (i + 1) * (stageH + gap) : y0 + stageH;
          const mid = (y0 + y1) / 2;
          return (
            <text key={item.label} x={56} y={mid + 3} textAnchor="end" className="fill-surface-500 text-[10px]">
              {item.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

/* ---------- Page ---------- */
export default function Analytics() {
  const [selectedTopics, setSelectedTopics] = useState<Set<string> | null>(null);

  const toggleTopic = (name: string, all: string[]) => {
    setSelectedTopics((prev) => {
      const cur = prev ?? new Set(all);
      const next = new Set(cur);
      if (next.has(name)) {
        if (next.size === 1) return cur;
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-xl font-bold text-surface-900">Analytics</h1>
        <p className="text-sm text-surface-500 mt-0.5">Track your progress and patterns</p>
      </motion.div>

      {/* Top row: Total Solved + Time Spent (last 7 days) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <motion.div variants={item} className="glass-card transition-all duration-300 hover:-translate-y-0.5 hover:bg-surface-200/40 p-5 min-h-[220px]">
          <TotalSolvedChart />
        </motion.div>
        <motion.div variants={item} className="glass-card transition-all duration-300 hover:-translate-y-0.5 hover:bg-surface-200/40 p-5 min-h-[220px]">
          <TimeChart />
        </motion.div>
      </div>

      {/* Heatmap (full width) */}
      <motion.div variants={item} className="glass-card transition-all duration-300 hover:-translate-y-0.5 hover:bg-surface-200/40 p-5">
        <HeatmapChart />
      </motion.div>

      {/* Bento: everything below the heatmap */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
        <motion.div variants={item} className="glass-card transition-all duration-300 hover:-translate-y-0.5 hover:bg-surface-200/40 p-6 min-h-[300px]">
          <div className="flex h-full flex-col justify-center">
            <RadarChart selected={selectedTopics} />
          </div>
        </motion.div>
        <motion.div variants={item} className="glass-card transition-all duration-300 hover:-translate-y-0.5 hover:bg-surface-200/40 p-6 md:col-span-2 min-h-[300px]">
          <div className="flex h-full flex-col justify-center">
            <TopicMasteryChart selected={selectedTopics} onToggle={toggleTopic} />
          </div>
        </motion.div>
        <motion.div variants={item} className="glass-card transition-all duration-300 hover:-translate-y-0.5 hover:bg-surface-200/40 p-6 md:col-span-3 min-h-[300px]">
          <div className="flex h-full flex-col justify-center">
            <CompanyChart />
          </div>
        </motion.div>
        <motion.div variants={item} className="glass-card transition-all duration-300 hover:-translate-y-0.5 hover:bg-surface-200/40 p-6 min-h-[300px]">
          <div className="flex h-full flex-col justify-center">
            <WeeklyPatternChart />
          </div>
        </motion.div>
        <motion.div variants={item} className="glass-card transition-all duration-300 hover:-translate-y-0.5 hover:bg-surface-200/40 p-6 md:col-span-2 min-h-[300px]">
          <div className="flex h-full flex-col justify-center">
            <ReviewPipelineChart />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

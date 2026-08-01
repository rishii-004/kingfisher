import { useEffect, useState } from "react";
import type { TimeSpentDay } from "../types";

const STORAGE_KEY = "kf_time_spent";
const TICK_MS = 30_000;
const HISTORY_DAYS = 7;
// A flush should cover roughly one tick; capped well above that so a
// suspended laptop or long-backgrounded tab waking up doesn't report the
// entire wall-clock gap as active time.
const MAX_FLUSH_SECONDS = 60;

// All of this is local-only by design: "time spent" only ever needs to
// answer "today" and "the last 7 days", both of which fit trivially in
// localStorage. No backend table, no sync — see docs/TIME_TRACKING.md.
type TimeSpentByDate = Record<string, number>;

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function lastNDayKeys(n: number, from = new Date()): string[] {
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(from);
    d.setDate(d.getDate() - i);
    keys.push(todayKey(d));
  }
  return keys;
}

function readAll(): TimeSpentByDate {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: TimeSpentByDate = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "number" && Number.isFinite(value)) out[key] = value;
    }
    return out;
  } catch {
    return {};
  }
}

function writeAll(data: TimeSpentByDate) {
  // Only ever keep the last HISTORY_DAYS entries — nothing older is ever
  // read, so there's no reason to let this grow unbounded.
  const keep = new Set(lastNDayKeys(HISTORY_DAYS));
  const pruned: TimeSpentByDate = {};
  for (const [key, value] of Object.entries(data)) {
    if (keep.has(key)) pruned[key] = value;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
  } catch {
    /* ignore quota / privacy errors */
  }
}

function accumulate(elapsedMs: number) {
  if (elapsedMs <= 0) return;
  const delta = Math.min(Math.round(elapsedMs / 1000), MAX_FLUSH_SECONDS);
  const key = todayKey();
  const data = readAll();
  data[key] = (data[key] ?? 0) + delta;
  writeAll(data);
}

export function useTimeSpentTracker() {
  useEffect(() => {
    let last = Date.now();
    const flush = () => {
      const now = Date.now();
      accumulate(now - last);
      last = now;
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    const id = setInterval(flush, TICK_MS);
    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(id);
      window.removeEventListener("beforeunload", flush);
      document.removeEventListener("visibilitychange", onVisibility);
      flush();
    };
  }, []);
}

export function useTimeSpentToday(): number {
  const [seconds, setSeconds] = useState(() => readAll()[todayKey()] ?? 0);

  useEffect(() => {
    const id = setInterval(() => {
      const next = readAll()[todayKey()] ?? 0;
      setSeconds((prev) => (prev === next ? prev : next));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return seconds;
}

function computeWeek(): TimeSpentDay[] {
  const data = readAll();
  return lastNDayKeys(HISTORY_DAYS).map((key) => {
    const [y, m, d] = key.split("-").map(Number);
    const day = WEEKDAY_LABELS[new Date(y, m - 1, d).getDay()];
    return { date: key, day, minutes: Math.round((data[key] ?? 0) / 60) };
  });
}

export function useTimeSpentWeek(): TimeSpentDay[] {
  const [days, setDays] = useState(computeWeek);

  useEffect(() => {
    const id = setInterval(() => {
      setDays((prev) => {
        const next = computeWeek();
        return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
      });
    }, 5_000);
    return () => clearInterval(id);
  }, []);

  return days;
}

export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.round((totalSeconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

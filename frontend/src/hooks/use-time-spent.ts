import { useEffect, useState } from "react";

const STORAGE_KEY = "kf_time_spent";
const TICK_MS = 30_000;

interface TimeSpentRecord {
  date: string;
  seconds: number;
}

function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function readRecord(): TimeSpentRecord {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: todayKey(), seconds: 0 };
    const parsed = JSON.parse(raw) as TimeSpentRecord;
    return { date: parsed.date, seconds: Number(parsed.seconds) || 0 };
  } catch {
    return { date: todayKey(), seconds: 0 };
  }
}

function accumulate(elapsedMs: number) {
  if (elapsedMs <= 0) return;
  const now = todayKey();
  const record = readRecord();
  const seconds = (record.date === now ? record.seconds : 0) + Math.round(elapsedMs / 1000);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: now, seconds }));
  } catch {
    /* ignore quota / privacy errors */
  }
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

export function useTimeSpentToday() {
  const [seconds, setSeconds] = useState(() => {
    const record = readRecord();
    return record.date === todayKey() ? record.seconds : 0;
  });

  useEffect(() => {
    const id = setInterval(() => {
      const record = readRecord();
      const next = record.date === todayKey() ? record.seconds : 0;
      setSeconds((prev) => (prev === next ? prev : next));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return seconds;
}

export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.round((totalSeconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

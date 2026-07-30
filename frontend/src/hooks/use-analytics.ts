import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import type { ApiResponse, DifficultyBreakdown, HeatmapEntry, RadarEntry, TimeTrendEntry } from "../types";

export function useHeatmapData(year = 2026) {
  return useQuery({
    queryKey: ["analytics", "heatmap", year],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<HeatmapEntry[]>>(`/analytics/heatmap?year=${year}`);
      if (data.error) throw new Error(data.error.message);
      return data.data!;
    },
  });
}

export function useRadarData() {
  return useQuery({
    queryKey: ["analytics", "radar"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<RadarEntry[]>>("/analytics/radar");
      if (data.error) throw new Error(data.error.message);
      return data.data!;
    },
  });
}

export function useDifficultyBreakdown() {
  return useQuery({
    queryKey: ["analytics", "difficulty"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<DifficultyBreakdown>>("/analytics/difficulty");
      if (data.error) throw new Error(data.error.message);
      return data.data!;
    },
  });
}

export function useTimeTrends() {
  return useQuery({
    queryKey: ["analytics", "time-trends"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<TimeTrendEntry[]>>("/analytics/time-trends");
      if (data.error) throw new Error(data.error.message);
      return data.data!;
    },
  });
}

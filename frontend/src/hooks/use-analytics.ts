import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import type {
  ApiResponse, CompanyMastery, ConsistencyData, DifficultyBreakdown, HeatmapEntry,
  MistakeBreakdown, RadarEntry, ReviewPipeline,
  TopicMastery, WeeklyPattern,
} from "../types";

export function useHeatmapData(year = new Date().getFullYear()) {
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

export function useCompanyMastery() {
  return useQuery({
    queryKey: ["analytics", "company"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CompanyMastery[]>>("/analytics/company");
      if (data.error) throw new Error(data.error.message);
      return data.data!;
    },
  });
}

export function useWeeklyPattern() {
  return useQuery({
    queryKey: ["analytics", "weekly-pattern"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<WeeklyPattern[]>>("/analytics/weekly-pattern");
      if (data.error) throw new Error(data.error.message);
      return data.data!;
    },
  });
}

export function useTopicMastery() {
  return useQuery({
    queryKey: ["analytics", "topic-mastery"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<TopicMastery[]>>("/analytics/topic-mastery");
      if (data.error) throw new Error(data.error.message);
      return data.data!;
    },
  });
}

export function useMistakeBreakdown() {
  return useQuery({
    queryKey: ["analytics", "mistakes"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<MistakeBreakdown[]>>("/analytics/mistakes");
      if (data.error) throw new Error(data.error.message);
      return data.data!;
    },
  });
}

export function useReviewPipeline() {
  return useQuery({
    queryKey: ["analytics", "review-pipeline"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ReviewPipeline>>("/analytics/review-pipeline");
      if (data.error) throw new Error(data.error.message);
      return data.data!;
    },
  });
}

export function useConsistencyData() {
  return useQuery({
    queryKey: ["analytics", "consistency"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ConsistencyData>>("/analytics/consistency");
      if (data.error) throw new Error(data.error.message);
      return data.data!;
    },
  });
}

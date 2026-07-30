import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import type { ApiResponse, PaginatedResponse, Platform, Problem } from "../types";

interface ProblemFilters {
  q?: string;
  page?: number;
  per_page?: number;
  platform?: string;
  difficulty?: string;
  topic?: string;
  company?: string;
  list_id?: string;
}

export function useProblems(filters: ProblemFilters = {}) {
  return useQuery({
    queryKey: ["problems", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== "") params.set(k, String(v));
      });
      const { data } = await api.get<ApiResponse<PaginatedResponse<Problem>>>(`/problems?${params}`);
      if (data.error) throw new Error(data.error.message);
      return data.data!;
    },
  });
}

export function useProblem(id: string) {
  return useQuery({
    queryKey: ["problem", id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Problem>>(`/problems/${id}`);
      if (data.error) throw new Error(data.error.message);
      return data.data!;
    },
    enabled: !!id,
  });
}

export function usePlatforms() {
  return useQuery({
    queryKey: ["platforms"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{ platforms: Platform[] }>>("/problems/platforms");
      if (data.error) throw new Error(data.error.message);
      return data.data!.platforms;
    },
    staleTime: Infinity,
  });
}

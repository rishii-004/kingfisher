import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import type { ApiResponse, PaginatedResponse, StatusUpdateResponse, UserProblem } from "../types";

export function useUserProblems(filters?: { status?: string; list_id?: string; page?: number; per_page?: number }) {
  return useQuery({
    queryKey: ["user-problems", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters ?? {}).forEach(([k, v]) => {
        if (v !== undefined && v !== "") params.set(k, String(v));
      });
      const { data } = await api.get<ApiResponse<PaginatedResponse<UserProblem>>>(`/user/problems?${params}`);
      if (data.error) throw new Error(data.error.message);
      return data.data!;
    },
  });
}

export function useUserProblem(problemId: string) {
  return useQuery({
    queryKey: ["user-problem", problemId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<UserProblem>>(`/user/problems/${problemId}`);
      if (data.error) throw new Error(data.error.message);
      return data.data!;
    },
    enabled: !!problemId,
  });
}

export function useSetProblemStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { problemId: string; status: "todo" | "solving" | "solved" | "skipped" }) => {
      const { data } = await api.put<ApiResponse<StatusUpdateResponse>>(`/user/problems/${input.problemId}/status`, { status: input.status });
      if (data.error) throw new Error(data.error.message);
      return data.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-problems"] });
      qc.invalidateQueries({ queryKey: ["user-problem"] });
      qc.invalidateQueries({ queryKey: ["lists"] });
    },
  });
}

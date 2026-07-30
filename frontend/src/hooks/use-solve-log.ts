import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import type { ApiResponse, MistakeTag, SolveLog } from "../types";

interface SolveLogInput {
  mistake_tags: MistakeTag[];
  notes: string;
  time_spent: "<15m" | "15-30m" | "30-60m" | "1h+";
}

export function useSolveLog(problemId: string) {
  return useQuery({
    queryKey: ["solve-log", problemId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<SolveLog>>(`/user/problems/${problemId}/solve-log`);
      if (data.error) throw new Error(data.error.message);
      return data.data!;
    },
    enabled: !!problemId,
  });
}

export function useCreateSolveLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { problemId: string } & SolveLogInput) => {
      const { problemId, ...body } = input;
      const { data } = await api.post<ApiResponse<SolveLog>>(`/user/problems/${problemId}/solve-log`, body);
      if (data.error) throw new Error(data.error.message);
      return data.data!;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["solve-log", vars.problemId] });
    },
  });
}

export function useUpdateSolveLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { problemId: string } & SolveLogInput) => {
      const { problemId, ...body } = input;
      const { data } = await api.put<ApiResponse<SolveLog>>(`/user/problems/${problemId}/solve-log`, body);
      if (data.error) throw new Error(data.error.message);
      return data.data!;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["solve-log", vars.problemId] });
    },
  });
}

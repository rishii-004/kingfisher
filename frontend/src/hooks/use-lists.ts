import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import type { ApiResponse, PaginatedResponse, ProblemList, ProblemListDetail } from "../types";

export function useLists(type?: "global" | "custom") {
  return useQuery({
    queryKey: ["lists", type],
    queryFn: async () => {
      const params = type ? `?type=${type}` : "";
      const { data } = await api.get<ApiResponse<PaginatedResponse<ProblemList>>>(`/lists${params}`);
      if (data.error) throw new Error(data.error.message);
      return data.data!;
    },
  });
}

export function useList(id: string) {
  return useQuery({
    queryKey: ["list", id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ProblemListDetail>>(`/lists/${id}`);
      if (data.error) throw new Error(data.error.message);
      return data.data!;
    },
    enabled: !!id,
  });
}

export function useCreateList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; description?: string }) => {
      const { data } = await api.post<ApiResponse<ProblemList>>("/lists", input);
      if (data.error) throw new Error(data.error.message);
      return data.data!;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lists"] }),
  });
}

export function useUpdateList(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name?: string; description?: string }) => {
      const { data } = await api.put<ApiResponse<ProblemList>>(`/lists/${id}`, input);
      if (data.error) throw new Error(data.error.message);
      return data.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lists"] });
      qc.invalidateQueries({ queryKey: ["list", id] });
    },
  });
}

export function useDeleteList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<ApiResponse<null>>(`/lists/${id}`);
      if (data?.error) throw new Error(data.error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lists"] }),
  });
}

export function useForkList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<ApiResponse<ProblemList>>(`/lists/${id}/fork`);
      if (data.error) throw new Error(data.error.message);
      return data.data!;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lists"] }),
  });
}

export function useAddProblemToList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { listId: string; problemId: string; order?: number }) => {
      const { data } = await api.post<ApiResponse<{ list_id: string; problem_id: string; order: number }>>(
        `/lists/${input.listId}/problems`,
        { problem_id: input.problemId, order: input.order }
      );
      if (data.error) throw new Error(data.error.message);
      return data.data!;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["list", vars.listId] }),
  });
}

export function useRemoveProblemFromList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { listId: string; problemId: string }) => {
      const { data } = await api.delete<ApiResponse<null>>(`/lists/${input.listId}/problems/${input.problemId}`);
      if (data?.error) throw new Error(data.error.message);
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["list", vars.listId] }),
  });
}

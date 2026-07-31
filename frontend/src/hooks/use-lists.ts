import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import type { ApiResponse, PaginatedResponse, ProblemList, ProblemListDetail, UserProblem } from "../types";

export interface ListDifficultyProgress {
  easy: number;
  medium: number;
  hard: number;
}

export interface ListProgress {
  list: ProblemList;
  total: number;
  solved: number;
  inProgress: number;
  difficulty: ListDifficultyProgress;
}

export function useListProgress() {
  return useQuery({
    queryKey: ["lists", "progress"],
    queryFn: async () => {
      const [listsRes, userRes] = await Promise.all([
        api.get<ApiResponse<PaginatedResponse<ProblemList>>>("/lists?per_page=100"),
        api.get<ApiResponse<PaginatedResponse<UserProblem>>>("/user/problems?per_page=100"),
      ]);
      if (listsRes.data.error) throw new Error(listsRes.data.error.message);
      if (userRes.data.error) throw new Error(userRes.data.error.message);

      const statusMap: Record<string, string> = {};
      for (const up of userRes.data.data!.items) statusMap[up.problem_id] = up.status;

      const progress = await Promise.all(
        listsRes.data.data!.items.map(async (list) => {
          const { data } = await api.get<ApiResponse<ProblemListDetail>>(`/lists/${list.id}`);
          const problems = data.error ? [] : (data.data?.problems ?? []);
          const difficulty: ListDifficultyProgress = { easy: 0, medium: 0, hard: 0 };
          for (const p of problems) {
            if (statusMap[p.id] === "solved") difficulty[p.difficulty] += 1;
          }
          return {
            list,
            total: problems.length,
            solved: problems.filter((p) => statusMap[p.id] === "solved").length,
            inProgress: problems.filter((p) => statusMap[p.id] === "solving").length,
            difficulty,
          };
        }),
      );

      return progress.sort((a, b) => a.list.name.localeCompare(b.list.name));
    },
  });
}

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

export function useListContainsProblem(problemId: string | null) {
  const { data: customLists } = useLists("custom");
  const listIds = (customLists?.items ?? []).map((l) => l.id);
  const key = listIds.join(",");
  return useQuery({
    queryKey: ["list-membership", problemId, key],
    queryFn: async () => {
      const entries = await Promise.all(
        listIds.map(async (id) => {
          const { data } = await api.get<ApiResponse<ProblemListDetail>>(`/lists/${id}`);
          const contains = !data.error && data.data!.problems.some((p) => p.id === problemId);
          return [id, contains] as const;
        }),
      );
      return new Map(entries);
    },
    enabled: !!problemId && listIds.length > 0,
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

export function useResetListProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<ApiResponse<null>>(`/lists/${id}/reset`);
      if (data?.error) throw new Error(data.error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lists"] });
      qc.invalidateQueries({ queryKey: ["user-problems"] });
      qc.invalidateQueries({ queryKey: ["user-problem"] });
      qc.invalidateQueries({ queryKey: ["reviews"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

interface AddProblemToListInput {
  listId: string;
  order?: number;
  // Either problemId (add an existing problem)...
  problemId?: string;
  // ...or enough fields to create a new one inline.
  title?: string;
  slug?: string;
  platform?: string;
  platform_url?: string;
  difficulty?: string;
  topic_tags?: string[];
  company_tags?: string[];
}

export function useAddProblemToList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddProblemToListInput) => {
      const { listId, problemId, ...newProblemFields } = input;
      const { data } = await api.post<ApiResponse<{ list_id: string; problem_id: string; order: number }>>(
        `/lists/${listId}/problems`,
        problemId ? { problem_id: problemId, order: input.order } : newProblemFields,
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

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import type { ApiResponse, PaginatedResponse, Review } from "../types";

export function useDueReviews(page = 1, perPage = 20) {
  return useQuery({
    queryKey: ["reviews", "due", page, perPage],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PaginatedResponse<Review>>>(`/reviews/due?page=${page}&per_page=${perPage}`);
      if (data.error) throw new Error(data.error.message);
      return data.data!;
    },
  });
}

export function useReviewCount() {
  return useQuery({
    queryKey: ["reviews", "count"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{ count: number }>>("/reviews/count");
      if (data.error) throw new Error(data.error.message);
      return data.data!.count;
    },
    refetchInterval: 60_000,
  });
}

export function useCompleteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (reviewId: string) => {
      const { data } = await api.post<ApiResponse<Review>>(`/reviews/${reviewId}/complete`);
      if (data.error) throw new Error(data.error.message);
      return data.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
}

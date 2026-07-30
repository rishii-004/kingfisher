import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import type { ApiResponse, SearchResult } from "../types";

export function useSearch() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    timerRef.current = setTimeout(() => setDebounced(query), 250);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  const results = useQuery({
    queryKey: ["search", debounced],
    queryFn: async () => {
      if (!debounced.trim()) return [];
      const { data } = await api.get<ApiResponse<{ results: SearchResult[] }>>(`/user/search?q=${encodeURIComponent(debounced)}`);
      if (data.error) throw new Error(data.error.message);
      return data.data!.results;
    },
    enabled: debounced.trim().length > 0,
  });

  return { query, setQuery, results: results.data ?? [], isLoading: results.isLoading };
}

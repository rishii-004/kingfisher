import { useMutation } from "@tanstack/react-query";
import api from "../lib/api";
import type { ApiResponse } from "../types";

export function useExportData() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.get<ApiResponse<any>>("/user/export");
      if (data.error) throw new Error(data.error.message);
      return data.data!;
    },
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kingfisher-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });
}

export function useImportData() {
  return useMutation({
    mutationFn: async (importData: any) => {
      const { data } = await api.post<ApiResponse<any>>("/user/import", importData);
      if (data.error) throw new Error(data.error.message);
      return data.data!;
    },
  });
}

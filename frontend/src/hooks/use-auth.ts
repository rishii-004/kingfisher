import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api, { getErrorMessage } from "../lib/api";
import { authStore } from "../stores/auth-store";
import type { ApiResponse, User } from "../types";

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

export function useAuth() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isAuthenticated = authStore.isAuthenticated();

  // The cached user (role, quota, ...) is only as fresh as the last
  // login/register response. Refetch it on mount so changes made
  // server-side (e.g. an admin promoting this account) show up without
  // requiring a re-login, and keep the localStorage snapshot in sync so
  // the next page load starts from the latest known value too.
  const me = useQuery({
    queryKey: ["auth-me"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<User>>("/auth/me");
      if (data.error) throw new Error(data.error.message);
      authStore.setUser(data.data!);
      return data.data!;
    },
    enabled: isAuthenticated,
    initialData: authStore.getUser() ?? undefined,
    staleTime: 0,
  });
  const user = me.data ?? authStore.getUser();

  const login = useMutation({
    mutationFn: async (input: LoginInput) => {
      try {
        const { data } = await api.post<ApiResponse<AuthResponse>>("/auth/login", input);
        if (data.error) throw new Error(data.error.message);
        return data.data!;
      } catch (err) {
        throw new Error(getErrorMessage(err, "Invalid email or password."));
      }
    },
    onSuccess: (res) => {
      authStore.setAuth(res.access_token, res.refresh_token, res.user);
      qc.setQueryData(["auth-me"], res.user);
      navigate("/", { replace: true });
    },
  });

  const register = useMutation({
    mutationFn: async (input: RegisterInput) => {
      try {
        const { data } = await api.post<ApiResponse<AuthResponse>>("/auth/register", input);
        if (data.error) throw new Error(data.error.message);
        return data.data!;
      } catch (err) {
        throw new Error(getErrorMessage(err, "Could not create account."));
      }
    },
    onSuccess: (res) => {
      authStore.setAuth(res.access_token, res.refresh_token, res.user);
      qc.setQueryData(["auth-me"], res.user);
      navigate("/", { replace: true });
    },
  });

  const logout = () => {
    authStore.clearAuth();
    qc.removeQueries({ queryKey: ["auth-me"] });
    navigate("/login", { replace: true });
  };

  return { user, isAuthenticated, login, register, logout };
}

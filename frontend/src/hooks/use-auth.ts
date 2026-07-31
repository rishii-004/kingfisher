import { useMutation } from "@tanstack/react-query";
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
  const user = authStore.getUser();
  const isAuthenticated = authStore.isAuthenticated();

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
      navigate("/", { replace: true });
    },
  });

  const logout = () => {
    authStore.clearAuth();
    navigate("/login", { replace: true });
  };

  return { user, isAuthenticated, login, register, logout };
}

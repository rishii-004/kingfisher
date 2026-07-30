import { Navigate, Outlet } from "react-router-dom";
import { authStore } from "../stores/auth-store";

export default function ProtectedRoute() {
  if (!authStore.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

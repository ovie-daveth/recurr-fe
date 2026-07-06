import type { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";
import { authStore } from "../../lib/auth-store";

export function ProtectedRoute({ children }: PropsWithChildren) {
  const accessToken = authStore((state) => state.accessToken);
  if (!accessToken) return <Navigate to="/auth/login" replace />;
  return children;
}

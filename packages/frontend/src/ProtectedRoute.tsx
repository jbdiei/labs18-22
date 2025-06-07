// frontend/src/ProtectedRoute.tsx
import React from "react";
import { Navigate } from "react-router";

interface IProtectedRouteProps {
  authToken: string;
  children: React.ReactNode;
}

export function ProtectedRoute({ authToken, children }: IProtectedRouteProps) {
  if (!authToken) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

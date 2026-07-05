import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUserStore } from '../store/userStore';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { token, user, hasHydrated } = useUserStore();
  const location = useLocation();

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3F1EC] text-[#1A1A1A] font-black">
        正在恢复登录状态...
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}

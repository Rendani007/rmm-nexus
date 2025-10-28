import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from './useAuthStore';
import { profile } from '@/api/auth';

export const AuthGuard = () => {
  const { user, token, setAuth, clearAuth } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      if (!user) {
        try {
          const data = await profile();
          setAuth(data.user, data.tenant, token);
        } catch (error) {
          clearAuth();
        }
      }
      setLoading(false);
    };

    loadProfile();
  }, [token, user, setAuth, clearAuth]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

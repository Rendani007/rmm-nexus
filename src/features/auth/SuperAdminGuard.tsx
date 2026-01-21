import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from './useAuthStore';

export const SuperAdminGuard = () => {
    const { user, isAuthenticated } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!user?.is_super_admin) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

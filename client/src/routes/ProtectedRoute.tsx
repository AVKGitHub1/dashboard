import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <div className="app-shell flex items-center justify-center text-slate-400">Loading…</div>;
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <Outlet />;
}

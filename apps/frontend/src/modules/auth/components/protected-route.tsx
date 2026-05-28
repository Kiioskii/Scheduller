import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '../hooks/use-auth';
import { AuthLoading } from './auth-loading';

export function ProtectedRoute() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <AuthLoading />;
  }

  if (!session) {
    return <Navigate to="/signin" replace />;
  }

  return <Outlet />;
}

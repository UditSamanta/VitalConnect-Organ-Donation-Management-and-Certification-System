import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, role }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role && user?.role !== role) {
    // Redirect to correct dashboard
    const dashRoutes = { donor: '/donor/dashboard', hospital: '/hospital/dashboard', admin: '/admin/dashboard' };
    return <Navigate to={dashRoutes[user?.role] || '/'} replace />;
  }
  return children;
}

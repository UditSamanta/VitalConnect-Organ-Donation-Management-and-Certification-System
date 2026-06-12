import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import DonorDashboard from './pages/DonorDashboard';
import HospitalDashboard from './pages/HospitalDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Certificate from './pages/Certificate';

function RedirectIfAuth({ children }) {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated) {
    const routes = { donor: '/donor/dashboard', hospital: '/hospital/dashboard', admin: '/admin/dashboard' };
    return <Navigate to={routes[user?.role] || '/'} replace />;
  }
  return children;
}

function AppRoutes() {
  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<RedirectIfAuth><Login /></RedirectIfAuth>} />
          <Route path="/register" element={<RedirectIfAuth><Register /></RedirectIfAuth>} />

          {/* Donor routes */}
          <Route path="/donor/dashboard" element={<ProtectedRoute role="donor"><DonorDashboard /></ProtectedRoute>} />
          <Route path="/donor/profile" element={<ProtectedRoute role="donor"><DonorDashboard /></ProtectedRoute>} />
          <Route path="/certificate/:id" element={<ProtectedRoute><Certificate /></ProtectedRoute>} />
          <Route path="/certificate" element={<ProtectedRoute role="donor"><Certificate /></ProtectedRoute>} />

          {/* Hospital routes */}
          <Route path="/hospital/dashboard" element={<ProtectedRoute role="hospital"><HospitalDashboard /></ProtectedRoute>} />

          {/* Admin routes */}
          <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid rgba(71,85,105,0.5)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </Router>
  );
}

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactElement;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-navy-950 text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-gold border-t-transparent rounded-full animate-spin"></div>
          <p className="font-mono text-xs text-slate-400 uppercase tracking-widest">Loading Session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page and keep track of original location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

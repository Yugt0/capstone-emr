import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredPage }) => {
  const { isAuthenticated, hasAccess, loading, user, getAccessiblePages } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has access to the required page
  if (requiredPage && !hasAccess(requiredPage)) {
    console.log('🚫 ProtectedRoute: Access denied for page:', requiredPage);
    console.log('🚫 Current user:', user);
    console.log('🚫 User role:', user?.role);
    console.log('🚫 Available pages for this role:', getAccessiblePages());
    
    // For doctors and admins, redirect to dashboard instead of showing unauthorized page
    if (user?.role?.toLowerCase().includes('doctor') || user?.role?.toLowerCase().includes('admin')) {
      console.log('🔄 Redirecting user to dashboard instead of unauthorized page');
      return <Navigate to="/" replace />;
    }
    
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute; 
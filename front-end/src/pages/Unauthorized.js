import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Login.css';

export default function Unauthorized() {
  const { getRoleDisplayName } = useAuth();

  return (
    <div className="login-page">
      <div className="login-background">
        <div className="background-overlay"></div>
      </div>
      
      <header className="login-header">
        <div className="header-content">
          <h1>Sala, Cabuyao, Laguna</h1>
          <h2>City Health Office 1</h2>
        </div>
      </header>

      <main className="login-main">
        <div className="login-container">
          <div className="login-card">
            <div className="logo-section">
              <img
                src="images/sala-health_office-logo.png"
                alt="Sala Health Office Logo"
                className="logo"
              />
              <h3 className="system-title">Access Denied</h3>
              <p className="system-subtitle">You don't have permission to access this page</p>
            </div>

            <div className="text-center p-4">
              <div className="alert alert-warning" role="alert">
                <h4 className="alert-heading">Unauthorized Access</h4>
                <p>
                  Sorry, you don't have permission to access this page with your current role: 
                  <strong> {getRoleDisplayName()}</strong>
                </p>
                <hr />
                <p className="mb-0">
                  Please contact your administrator if you believe this is an error.
                </p>
              </div>

              <div className="mt-4">
                <Link to="/" className="btn btn-primary me-2">
                  Go to Dashboard
                </Link>
                <Link to="/login" className="btn btn-outline-secondary">
                  Switch Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 
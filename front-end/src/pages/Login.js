import "../styles/Login.css";
import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });

  function togglePassword() {
    setShowPassword((prev) => !prev);
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle login logic here
    console.log("Login attempt:", formData);
  };

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
              <h3 className="system-title">Electronic Medical Records</h3>
              <p className="system-subtitle">Secure Healthcare Management System</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <h2 className="login-title">Sign In</h2>
              
              <div className="form-group">
                <label htmlFor="username" className="form-label">Username</label>
                <div className="input-wrapper">
                  <img src="images/user.png" alt="User Icon" className="input-icon" />
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Enter your username"
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <div className="input-wrapper">
                  <img src="images/lock.png" alt="Lock Icon" className="input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    className="form-input"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={togglePassword}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <img
                      src={showPassword ? "images/view.png" : "images/eye.png"}
                      alt={showPassword ? "Hide password" : "Show password"}
                      className="toggle-icon"
                    />
                  </button>
                </div>
              </div>

              <button type="submit" className="login-button">
                <span>Sign In</span>
                <div className="button-loader"></div>
              </button>
            </form>

            <div className="login-footer">
              <p className="register-text">
                Don't have an account?
              </p>
              <Link to="/register" className="register-link">Register here</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

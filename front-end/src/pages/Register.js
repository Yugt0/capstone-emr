import "../styles/Login.css";
import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    password: "",
    confirmPassword: ""
  });

  function togglePassword() {
    setShowPassword((prev) => !prev);
  }

  function toggleConfirmPassword() {
    setShowConfirmPassword((prev) => !prev);
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
    // Handle registration logic here
    console.log("Registration attempt:", formData);
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
              <h2 className="login-title">Create Account</h2>
              
              <div className="form-group">
                <label htmlFor="fullName" className="form-label">Full Name</label>
                <div className="input-wrapper">
                  <img src="images/user.png" alt="User Icon" className="input-icon" />
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className="form-input"
                    required
                  />
                </div>
              </div>

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
                    placeholder="Choose a username"
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
                    placeholder="Create a strong password"
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

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                <div className="input-wrapper">
                  <img src="images/lock.png" alt="Lock Icon" className="input-icon" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your password"
                    className="form-input"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={toggleConfirmPassword}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    <img
                      src={showConfirmPassword ? "images/view.png" : "images/eye.png"}
                      alt={showConfirmPassword ? "Hide password" : "Show password"}
                      className="toggle-icon"
                    />
                  </button>
                </div>
              </div>

              <div className="form-options">
                <label className="checkbox-wrapper">
                  <input type="checkbox" className="checkbox" required />
                  I agree to the Terms of Service and Privacy Policy
                </label>
              </div>

              <button type="submit" className="login-button">
                <span>Create Account</span>
                <div className="button-loader"></div>
              </button>
            </form>

            <div className="login-footer">
              <p className="register-text">
                Already have an account?
              </p>
              <Link to="/" className="register-link">Sign in here</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

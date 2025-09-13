import "../styles/Login.css";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "encoder"
  });

  const navigate = useNavigate();

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Validate password confirmation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          username: formData.username,
          email: formData.email,
          password: formData.password,
          password_confirmation: formData.confirmPassword,
          role: formData.role
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Registration successful! You can now login.");
        setFormData({
          fullName: "",
          username: "",
          email: "",
          password: "",
          confirmPassword: "",
          role: "encoder"
        });
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(data.message || "Registration failed");
        if (data.errors) {
          const errorMessages = Object.values(data.errors).flat();
          setError(errorMessages.join(', '));
        }
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
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
                <label htmlFor="email" className="form-label">Email</label>
                <div className="input-wrapper">
                  <img src="images/user.png" alt="Email Icon" className="input-icon" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="role" className="form-label">Role</label>
                <div className="input-wrapper">
                  <img src="images/user.png" alt="Role Icon" className="input-icon" />
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  >
                    <option value="encoder">Encoder</option>
                    <option value="nursing_attendant">Nursing Attendant</option>
                    <option value="midwife">Midwife</option>
                    <option value="doctor">Doctor</option>
                    <option value="cold_chain_manager">Cold Chain Manager</option>
                  </select>
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

              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              {success && (
                <div className="alert alert-success" role="alert">
                  {success}
                </div>
              )}

              <button type="submit" className="login-button" disabled={loading}>
                <span>{loading ? "Creating Account..." : "Create Account"}</span>
                {loading && <div className="button-loader"></div>}
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

import "../styles/Login.css";
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [isLocked, setIsLocked] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the page user was trying to access before login
  const from = location.state?.from?.pathname || "/";

  // Countdown timer for locked account
  useEffect(() => {
    let interval;
    if (isLocked && remainingTime > 0) {
      interval = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            setIsLocked(false);
            setError("");
            return 0;
          }
          return prev - 1;
        });
      }, 1000); // Update every second
    }
    return () => clearInterval(interval);
  }, [isLocked, remainingTime]);

  // Format time remaining as minutes:seconds
  const formatTimeRemaining = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch('http://127.0.0.1:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Reset security states on successful login
        setRemainingAttempts(3);
        setIsLocked(false);
        setRemainingTime(0);
        login(data.user, data.token);
        navigate(from, { replace: true });
      } else {
        // Handle different error responses
        if (data.locked) {
          setIsLocked(true);
          // Convert backend time to seconds (assuming backend sends time in minutes)
          const timeInMinutes = data.remaining_time || 10;
          setRemainingTime(Math.floor(timeInMinutes * 60)); // Convert to seconds
          setError(data.message || "Account locked due to multiple failed attempts.");
        } else if (data.remaining_attempts !== undefined) {
          setRemainingAttempts(data.remaining_attempts);
          setIsLocked(false);
          setError(`${data.message} (${data.remaining_attempts} attempts remaining)`);
        } else {
          setError(data.message || "Invalid username or password");
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
                    disabled={isLocked}
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
                    disabled={isLocked}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={togglePassword}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    disabled={isLocked}
                  >
                    <img
                      src={showPassword ? "images/view.png" : "images/eye.png"}
                      alt={showPassword ? "Hide password" : "Show password"}
                      className="toggle-icon"
                    />
                  </button>
                </div>
              </div>

              {error && (
                <div className={`alert ${isLocked ? 'alert-warning' : 'alert-danger'}`} role="alert">
                  {error}
                  {isLocked && remainingTime > 0 && (
                    <div className="mt-2">
                      <strong>Time remaining: {formatTimeRemaining(remainingTime)}</strong>
                    </div>
                  )}
                </div>
              )}

              {!isLocked && remainingAttempts < 3 && (
                <div className="alert alert-info" role="alert">
                  <strong>Security Notice:</strong> {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining before account lockout.
                </div>
              )}

              <button 
                type="submit" 
                className="login-button" 
                disabled={loading || isLocked}
              >
                <span>
                  {loading ? "Signing In..." : 
                   isLocked ? "Account Locked" : "Sign In"}
                </span>
                {loading && <div className="button-loader"></div>}
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

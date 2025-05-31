import "../styles/Login.css";
import React, { useState } from "react";

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function togglePassword() {
    setShowPassword((prev) => !prev);
  }
  function toggleConfirmPassword() {
    setShowConfirmPassword((prev) => !prev);
  }

  return (
    <>
      <main>
        <header class="header-login">
          <h1>Sala, Cabuyao, Laguna</h1>
          <h1>City Health Office 1</h1>
        </header>
        <div class="container">
          <img
            src="images/sala-health_office-logo.png"
            alt="Sala Health Office Logo"
          />
          <h2>Register</h2>
          <div class="input-container">
            <img src="images/user.png" alt="User Icon" />
            <input type="text" placeholder="Full Name" />
          </div>
          <div class="input-container">
            <img src="images/user.png" alt="User Icon" />
            <input type="text" placeholder="User Name" />
          </div>
          <div class="input-container">
            <img src="images/lock.png" alt="Lock Icon" />
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              placeholder="Password"
            />
            <span class="toggle-password" onClick={togglePassword}>
              <img
                src={showPassword ? "images/view.png" : "images/eye.png"}
                alt="view-password-icon"
                id="password-icon"
              />
            </span>
          </div>
          <div class="input-container">
            <img src="images/lock.png" alt="Lock Icon" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="password"
              placeholder="Confirm Password"
            />
            <span class="toggle-password" onClick={toggleConfirmPassword}>
              <img
                src={showConfirmPassword ? "images/view.png" : "images/eye.png"}
                alt="view-password-icon"
                id="password-icon"
              />
            </span>
          </div>
          <button class="btn">Register</button>
          <a href="/" class="login-link">
            Already have an account? Login
          </a>
        </div>
      </main>
    </>
  );
}

import "../styles/Login.css";
import React, { useState } from "react";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);

  function togglePassword() {
    setShowPassword((prev) => !prev);
  }

  return (
    <>
    <main>
    <header class="header-register">
        <h1>Sala, Cabuyao, Laguna</h1>
        <h1>City Health Office 1</h1>
      </header>
      <div class="container">
        <img
          src="images/sala-health_office-logo.png"
          alt="Sala Health Office Logo"
        />
        <h2>LOG IN</h2>
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
        <button class="btn">Log in</button>
        <a href="register" class="login-link">
          Dont have an account? Register
        </a>
      </div>
    </main>
    </>
  );
}

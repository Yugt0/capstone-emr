import "./styles/Header.css";
import { useAuth } from "./contexts/AuthContext";
import { useState, useEffect, useRef } from "react";

function Header() {
  const { user, getRoleDisplayName, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  // Get user's display name (full_name if available, otherwise name)
  const getUserDisplayName = () => {
    if (!user) return "Guest";
    return user.full_name || user.name || user.username || "User";
  };

  // Get user's role display name
  const getUserRole = () => {
    if (!user) return "Guest";
    return getRoleDisplayName();
  };

  // Handle logout
  const handleLogout = () => {
    setShowUserMenu(false);
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
    }
  };

  // Toggle user menu
  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  return (
    <header className="header">
      <div className="welcome-message">
        <h2>Welcome, {getUserDisplayName()}</h2>
      </div>
      <div className="account-settings" ref={userMenuRef}>
        <div className="user-profile" onClick={toggleUserMenu}>
          <img
            src="images/user.png"
            alt="profile icon"
            className="account-image"
          />
          <div className="account-name">
            <p className="name">{getUserDisplayName()}</p>
            <p className="role">{getUserRole()}</p>
          </div>
        </div>
        
        <img
          src="images/notifications.png"
          alt="notifications icon"
          className="icon notification-icon"
        />
        
        {/* User Menu Dropdown */}
        {showUserMenu && (
          <div className="user-menu">
            <div className="user-menu-item">
              <span>Profile</span>
            </div>
            <div className="user-menu-item">
              <span>Settings</span>
            </div>
            <div className="user-menu-divider"></div>
            <div className="user-menu-item logout-item" onClick={handleLogout}>
              <span>Logout</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;

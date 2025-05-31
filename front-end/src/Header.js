import "./styles/Header.css";

function Header() {
  return (
    <header className="header">
      <div className="welcome-message">
        <h2>Welcome, John Cedric Blanco</h2>
      </div>
      <div className="account-settings">
        <img
          src="images/attendance.png"
          alt="profile icon"
          className="account-image"
        />
        <div className="account-name">
          <p className="name">Cedric Blanco</p>
          <p className="role">Admin</p>
        </div>
        <img
          src="images/notifications.png"
          alt="notifications icon"
          className="icon notification-icon"
        />
        <img
          src="images/settings.png"
          alt="settings icon"
          className="icon settings-icon"
        />
      </div>
    </header>
  );
}

export default Header;

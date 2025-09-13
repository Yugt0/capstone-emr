import "./styles/Sidebar.css";
import { Link, useMatch, useResolvedPath } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";

function Sidebar() {
  const { hasAccess, logout, getRoleDisplayName } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      <div className="sidebar">
        <img
          src="images/sala-health_office-logo.png"
          alt="jil logo"
          id="company-logo"
        />
        
        {/* User Role Display */}
        <div className="user-role-display">
          <span className="role-text">{getRoleDisplayName()}</span>
        </div>

        <ul className="menu-links">
          {hasAccess('dashboard') && (
            <CustomLink to="/">
              <img src="images/data-analysis.png" alt="" className="icon" />
              <CustomText to="/">Dashboard</CustomText>
            </CustomLink>
          )}
          
          {hasAccess('patientlist') && (
            <CustomLink to="/patientlist">
              <img
                src="images/health-report.png"
                alt="Dashboard-logo"
                className="icon"
              />
              <CustomText to="/patientlist">Patient List</CustomText>
            </CustomLink>
          )}
          
          {hasAccess('patient-vaccine-tracker') && (
            <CustomLink to="/patient-vaccine-tracker">
              <img
                src="images/vaccination.png"
                alt="Dashboard-logo"
                className="icon"
              />
              <CustomText to="/patient-vaccine-tracker">Vaccine Tracker</CustomText>
            </CustomLink>
          )}
          
          {hasAccess('vaccinelist') && (
            <CustomLink to="/vaccinelist">
              <img
                src="images/vaccine.png"
                alt="Dashboard-logo"
                className="icon"
              />
              <CustomText to="/vaccinelist">Vaccine List</CustomText>
            </CustomLink>
          )}
          
          {hasAccess('contraceptive-list') && (
            <CustomLink to="/contraceptive-list">
              <img
                src="images/contraceptive-pills.png"
                alt="Contraceptive List"
                className="icon"
              />
              <CustomText to="/contraceptive-list">Contraceptive List</CustomText>
            </CustomLink>
          )}
          
          {hasAccess('family-planning-list') && (
            <CustomLink to="/family-planning-list">
              <img
                src="images/contraceptive-pills.png"
                alt="Dashboard-logo"
                className="icon"
              />
              <CustomText to="/family-planning-list">Family Planning List</CustomText>
            </CustomLink>
          )}

          {hasAccess('doctor-patient-list') && (
            <CustomLink to="/doctor-patient-list">
              <img
                src="images/health-report.png"
                alt="Doctor Patient List"
                className="icon"
              />
              <CustomText to="/doctor-patient-list">Doctor Patient List</CustomText>
            </CustomLink>
          )}

          {hasAccess('audit-log') && (
            <CustomLink to="/audit-log">
              <img
                src="images/report.png"
                alt="Audit Log"
                className="icon"
              />
              <CustomText to="/audit-log">Audit Log</CustomText>
            </CustomLink>
          )}

          {/* Logout Button */}
          <li className="nav-link logout-link">
            <button onClick={handleLogout} className="link logout-button">
              <img src="images/settings.png" alt="Logout" className="icon" />
              <span className="text">Logout</span>
            </button>
          </li>
        </ul>
      </div>
    </>
  );
}

function CustomLink({ to, children, ...props }) {
  const resolvedPath = useResolvedPath(to);
  const match = useMatch({ path: resolvedPath.pathname, end: true });
  return (
    <li to={to} class={match ? "nav-link-active" : "nav-link"} {...props}>
      <Link to={to} {...props} class="link">
        {children}
      </Link>
    </li>
  );
}

function CustomText({ to, children, ...props }) {
  const resolvedPath = useResolvedPath(to);
  const match = useMatch({ path: resolvedPath.pathname, end: true });
  return (
    <span to={to} class={match ? "text-active" : "text"} {...props}>
      {children}
    </span>
  );
}

export default Sidebar;

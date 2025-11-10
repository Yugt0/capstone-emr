import "./styles/Sidebar.css";
import { Link, useMatch, useResolvedPath } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";

function Sidebar() {
  const { 
    hasAccess, 
    logout, 
    getRoleDisplayName, 
    sidebarCollapsed, 
    toggleSidebar,
    mobileSidebarOpen,
    closeMobileSidebar,
    isMobile
  } = useAuth();

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
    }
  };

  return (
    <>
      <div className={`
        sidebar 
        ${sidebarCollapsed ? 'collapsed' : ''} 
        ${isMobile ? 'mobile-sidebar' : ''}
        ${isMobile && mobileSidebarOpen ? 'open' : ''}
      `}>
        {/* Toggle Button */}
        {!isMobile && (
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            <div className={`arrow-icon ${sidebarCollapsed ? 'right' : 'left'}`}>
              <span></span>
            </div>
          </button>
        )}
        
        {/* Mobile Close Button */}
        {isMobile && (
          <button 
            className="mobile-close-button"
            onClick={closeMobileSidebar}
          >
            <svg className="close-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        <img
          src="images/City Health Office Logo.jpg"
          alt="city health office logo"
          id="company-logo"
          className={`${sidebarCollapsed ? 'collapsed' : ''} ${isMobile ? 'mt-16' : ''}`}
        />
        
        {/* User Role Display */}
        {(!sidebarCollapsed || isMobile) && (
          <div className="user-role-display">
            <span className="role-text">{getRoleDisplayName()}</span>
          </div>
        )}

        <ul className="menu-links">
          {hasAccess('dashboard') && (
            <CustomLink to="/" onClick={isMobile ? closeMobileSidebar : undefined}>
              <img src="images/data-analysis.png" alt="" className="icon" />
              {(!sidebarCollapsed || isMobile) && <CustomText to="/">Dashboard</CustomText>}
            </CustomLink>
          )}
          
          {hasAccess('patientlist') && (
            <CustomLink to="/patientlist" onClick={isMobile ? closeMobileSidebar : undefined}>
              <img
                src="images/health-report.png"
                alt="Dashboard-logo"
                className="icon"
              />
              {(!sidebarCollapsed || isMobile) && <CustomText to="/patientlist">Patient List</CustomText>}
            </CustomLink>
          )}
          
          {hasAccess('patient-vaccine-tracker') && (
            <CustomLink to="/patient-vaccine-tracker" onClick={isMobile ? closeMobileSidebar : undefined}>
              <img
                src="images/vaccination.png"
                alt="Dashboard-logo"
                className="icon"
              />
              {(!sidebarCollapsed || isMobile) && <CustomText to="/patient-vaccine-tracker">Vaccine Tracker</CustomText>}
            </CustomLink>
          )}
          
          {hasAccess('vaccinelist') && (
            <CustomLink to="/vaccinelist" onClick={isMobile ? closeMobileSidebar : undefined}>
              <img
                src="images/vaccine.png"
                alt="Dashboard-logo"
                className="icon"
              />
              {(!sidebarCollapsed || isMobile) && <CustomText to="/vaccinelist">Vaccine List</CustomText>}
            </CustomLink>
          )}
          
          {hasAccess('contraceptive-list') && (
            <CustomLink to="/contraceptive-list" onClick={isMobile ? closeMobileSidebar : undefined}>
              <img
                src="images/contraceptive-pills.png"
                alt="Contraceptive List"
                className="icon"
              />
              {(!sidebarCollapsed || isMobile) && <CustomText to="/contraceptive-list">Contraceptive List</CustomText>}
            </CustomLink>
          )}

          {hasAccess('disease-analytics') && (
            <CustomLink to="/disease-analytics" onClick={isMobile ? closeMobileSidebar : undefined}>
              <img
                src="images/chart.png"
                alt="Disease Analytics"
                className="icon"
              />
              {(!sidebarCollapsed || isMobile) && <CustomText to="/disease-analytics">Disease Analytics</CustomText>}
            </CustomLink>
          )}

          {hasAccess('doctor-patient-list') && (
            <CustomLink to="/doctor-patient-list" onClick={isMobile ? closeMobileSidebar : undefined}>
              <img
                src="images/health-report.png"
                alt="Doctor Patient List"
                className="icon"
              />
              {(!sidebarCollapsed || isMobile) && <CustomText to="/doctor-patient-list">Doctor Patient List</CustomText>}
            </CustomLink>
          )}

          {hasAccess('missing-data') && (
            <CustomLink to="/missing-data" onClick={isMobile ? closeMobileSidebar : undefined}>
              <img
                src="images/data.png"
                alt="Missing Data"
                className="icon"
              />
              {(!sidebarCollapsed || isMobile) && <CustomText to="/missing-data">Missing Data</CustomText>}
            </CustomLink>
          )}

          {hasAccess('audit-log') && (
            <CustomLink to="/audit-log" onClick={isMobile ? closeMobileSidebar : undefined}>
              <img
                src="images/report.png"
                alt="Audit Log"
                className="icon"
              />
              {(!sidebarCollapsed || isMobile) && <CustomText to="/audit-log">Audit Log</CustomText>}
            </CustomLink>
          )}

          {hasAccess('backup') && (
            <CustomLink to="/backup" onClick={isMobile ? closeMobileSidebar : undefined}>
              <img
                src="images/database.png"
                alt="Backup System"
                className="icon"
              />
              {(!sidebarCollapsed || isMobile) && <CustomText to="/backup">Backup System</CustomText>}
            </CustomLink>
          )}

          {hasAccess('user-management') && (
            <CustomLink to="/user-management" onClick={isMobile ? closeMobileSidebar : undefined}>
              <img
                src="images/hospital.png"
                alt="User Management"
                className="icon"
              />
              {(!sidebarCollapsed || isMobile) && <CustomText to="/user-management">User Management</CustomText>}
            </CustomLink>
          )}

          {hasAccess('register') && (
            <CustomLink to="/register" onClick={isMobile ? closeMobileSidebar : undefined}>
              <img
                src="images/registration.png"
                alt="User Registration"
                className="icon"
              />
              {(!sidebarCollapsed || isMobile) && <CustomText to="/register">User Registration</CustomText>}
            </CustomLink>
          )}

          {/* Logout Button */}
          <li className="nav-link logout-link">
            <button onClick={handleLogout} className="link logout-button">
              <img src="images/settings.png" alt="Logout" className="icon" />
              {(!sidebarCollapsed || isMobile) && <span className="text">Logout</span>}
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
    <li to={to} className={match ? "nav-link-active" : "nav-link"} {...props}>
      <Link to={to} {...props} className="link">
        {children}
      </Link>
    </li>
  );
}

function CustomText({ to, children, ...props }) {
  const resolvedPath = useResolvedPath(to);
  const match = useMatch({ path: resolvedPath.pathname, end: true });
  return (
    <span to={to} className={match ? "text-active" : "text"} {...props}>
      {children}
    </span>
  );
}

export default Sidebar;

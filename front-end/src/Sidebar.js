import "./styles/Sidebar.css";
import { Link, useMatch, useResolvedPath } from "react-router-dom";

function Sidebar() {
  return (
    <>
      <div class="sidebar">
        <img
          src="images/sala-health_office-logo.png"
          alt="jil logo"
          id="company-logo"
        />
        <ul class="menu-links">
          <CustomLink to="/">
            <img src="images/data-analysis.png" alt="" class="icon" />
            <CustomText to="/">Dashboard</CustomText>
          </CustomLink>
          <CustomLink to="/patientlist">
            <img
              src="images/health-report.png"
              alt="Dashboard-logo"
              class="icon"
            />
            <CustomText to="/patientlist">Patient List</CustomText>
          </CustomLink>
          <CustomLink to="/patient-vaccine-tracker">
          <img
              src="images/vaccination.png"
              alt="Dashboard-logo"
              class="icon"
            />
            <CustomText to="/patient-vaccine-tracker">Vaccine Tracker</CustomText>
          </CustomLink>
          <CustomLink to="/vaccinelist">
          <img
              src="images/vaccine.png"
              alt="Dashboard-logo"
              class="icon"
            />
            <CustomText to="/vaccinelist">Vaccine List</CustomText>
          </CustomLink>
          <CustomLink to="/family-planning-list">
            <img
              src="images/contraceptive-pills.png"
              alt="Dashboard-logo"
              class="icon"
            />
            <CustomText to="/family-planning-list">Family Planning List</CustomText>
          </CustomLink>
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

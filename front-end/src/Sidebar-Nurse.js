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

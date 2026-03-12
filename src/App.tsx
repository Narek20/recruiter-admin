import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { logout } from "./lib/auth";

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <p className="sidebar-eyebrow">Recruiter OS</p>
          <h2>Admin Panel</h2>
          <p className="sidebar-copy">Manage schools, majors, relationships, and imports.</p>
        </div>

        <nav>
          <Link className={location.pathname === "/" ? "active" : ""} to="/">
            Dashboard
          </Link>
          <Link className={location.pathname === "/schools" ? "active" : ""} to="/schools">
            Schools
          </Link>
          <Link className={location.pathname === "/majors" ? "active" : ""} to="/majors">
            Majors
          </Link>
          <Link
            className={location.pathname === "/school-majors" ? "active" : ""}
            to="/school-majors"
          >
            School Majors
          </Link>
          <Link className={location.pathname === "/imports" ? "active" : ""} to="/imports">
            Imports
          </Link>
        </nav>

        <button onClick={handleLogout}>Logout</button>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <p className="topbar-eyebrow">Data Operations</p>
            <h1 className="topbar-title">Recruiter Admin</h1>
          </div>
          <div className="topbar-meta">
            <span className="status-pill status-pill-live">MongoDB Ready</span>
            <span className="status-pill">Admin Session</span>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}

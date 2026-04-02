import { useAuth } from "../context/AuthContext";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!isAuthenticated) return null;

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/events" className="navbar-brand">
          <span className="brand-icon">🏔️</span>
          <div>
            <span className="brand-name">NIT Srinagar</span>
            <span className="brand-sub">Campus Events</span>
          </div>
        </Link>

        <div className="navbar-links">
          <Link
            to="/events"
            className={`nav-link ${isActive("/events") ? "active" : ""}`}
          >
            📅 Events
          </Link>
          <Link
            to="/dashboard"
            className={`nav-link ${isActive("/dashboard") ? "active" : ""}`}
          >
            🏠 Dashboard
          </Link>
          {user?.role === "admin" && (
            <Link
              to="/admin"
              className={`nav-link nav-admin ${isActive("/admin") ? "active" : ""}`}
            >
              ⚙️ Admin
            </Link>
          )}
        </div>

        <div className="navbar-user">
          <span className="user-badge">
            {user?.role === "admin" && <span className="role-badge">ADMIN</span>}
            {user?.username}
          </span>
          <button className="btn btn-outline btn-sm" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}

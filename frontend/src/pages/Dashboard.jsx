import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user, token } = useAuth();
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  useEffect(() => {
    fetchUpcoming();
  }, []);

  const fetchUpcoming = async () => {
    try {
      const res = await axios.get("/api/events", {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Show next 3 upcoming events
      const now = new Date();
      const upcoming = res.data
        .filter((e) => new Date(e.event_date) >= now)
        .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
        .slice(0, 3);
      setUpcomingEvents(upcoming);
    } catch (err) {
      console.error("Failed to fetch events:", err);
    }
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="dashboard-container">
      {/* Welcome Section */}
      <div className="dashboard-welcome">
        <div className="welcome-text">
          <h1>👋 Welcome, {user?.username || "User"}!</h1>
          <p>{dateStr}</p>
        </div>
        <div className="welcome-stats">
          <div className="mini-stat">
            <span className="mini-stat-label">Role</span>
            <span className="mini-stat-value" style={{ color: user?.role === "admin" ? "#38ef7d" : "#667eea" }}>
              {user?.role === "admin" ? "🛡️ Admin" : "👤 User"}
            </span>
          </div>
          <div className="mini-stat">
            <span className="mini-stat-label">Email</span>
            <span className="mini-stat-value">{user?.email}</span>
          </div>
        </div>
      </div>

      {/* Upcoming Events Preview */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>📅 Upcoming Events</h2>
          <Link to="/events" className="see-all-link">See all →</Link>
        </div>
        {upcomingEvents.length === 0 ? (
          <div className="stat-card" style={{ textAlign: "center", padding: "2rem" }}>
            <p style={{ color: "var(--text-secondary)" }}>No upcoming events. Stay tuned!</p>
          </div>
        ) : (
          <div className="dashboard-content">
            {upcomingEvents.map((event) => (
              <Link to={`/events/${event.id}`} key={event.id} className="stat-card" style={{ textDecoration: "none" }}>
                <div className="stat-icon">
                  {event.category === "Tech" ? "💻" :
                   event.category === "Cultural" ? "🎭" :
                   event.category === "Sports" ? "⚽" :
                   event.category === "Workshop" ? "🔧" : "📌"}
                </div>
                <h3>{event.category}</h3>
                <div className="stat-value" style={{ fontSize: "1.1rem" }}>{event.title}</div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginTop: "0.5rem" }}>
                  📍 {event.location} • {new Date(event.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

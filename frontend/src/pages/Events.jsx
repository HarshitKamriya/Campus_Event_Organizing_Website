import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const CATEGORIES = ["All", "Tech", "Cultural", "Sports", "Workshop", "Seminar", "General"];

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const { token } = useAuth();

  useEffect(() => {
    fetchEvents();
  }, [activeCategory]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = activeCategory !== "All" ? { category: activeCategory } : {};
      const res = await axios.get("/api/events", {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setEvents(res.data);
    } catch (err) {
      console.error("Failed to fetch events:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  const getCategoryColor = (cat) => {
    const colors = {
      Tech: "#667eea",
      Cultural: "#f093fb",
      Sports: "#38ef7d",
      Workshop: "#ffeaa7",
      Seminar: "#74b9ff",
      General: "#a29bfe",
    };
    return colors[cat] || "#a29bfe";
  };

  return (
    <div className="events-page">
      <div className="events-header">
        <h1>🏔️ Campus Events</h1>
        <p>Discover what's happening at NIT Srinagar</p>
      </div>

      {/* Category Filter */}
      <div className="category-filters">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`category-btn ${activeCategory === cat ? "active" : ""}`}
            onClick={() => setActiveCategory(cat)}
            style={
              activeCategory === cat && cat !== "All"
                ? { borderColor: getCategoryColor(cat), color: getCategoryColor(cat) }
                : {}
            }
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="events-loading">
          <div className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      ) : events.length === 0 ? (
        <div className="events-empty">
          <div className="empty-icon">📭</div>
          <h3>No events found</h3>
          <p>
            {activeCategory !== "All"
              ? `No ${activeCategory} events at the moment. Try a different category.`
              : "No events posted yet. Check back soon!"}
          </p>
        </div>
      ) : (
        <div className="events-grid">
          {events.map((event) => (
            <Link
              to={`/events/${event.id}`}
              key={event.id}
              className="event-card"
            >
              <div className="event-card-top">
                <span
                  className="event-category-badge"
                  style={{ background: getCategoryColor(event.category) + "22", color: getCategoryColor(event.category) }}
                >
                  {event.category}
                </span>
                <span className="event-date-badge">
                  {formatDate(event.event_date)}
                </span>
              </div>
              <h3 className="event-card-title">{event.title}</h3>
              <p className="event-card-desc">
                {event.description.length > 120
                  ? event.description.slice(0, 120) + "…"
                  : event.description}
              </p>
              <div className="event-card-footer">
                <span>📍 {event.location}</span>
                <span>🕐 {formatTime(event.event_date)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

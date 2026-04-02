import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

export default function EventDetail() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const res = await axios.get(`/api/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvent(res.data);
    } catch (err) {
      console.error("Failed to fetch event:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="page-container">
        <div className="glass-card" style={{ textAlign: "center" }}>
          <h2>Event Not Found</h2>
          <p style={{ color: "var(--text-secondary)", margin: "1rem 0" }}>
            This event may have been removed or doesn't exist.
          </p>
          <Link to="/events" className="btn btn-primary" style={{ marginTop: "1rem" }}>
            ← Back to Events
          </Link>
        </div>
      </div>
    );
  }

  const eventDate = new Date(event.event_date);
  const dateStr = eventDate.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = eventDate.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const getCategoryColor = (cat) => {
    const colors = {
      Tech: "#667eea", Cultural: "#f093fb", Sports: "#38ef7d",
      Workshop: "#ffeaa7", Seminar: "#74b9ff", General: "#a29bfe",
    };
    return colors[cat] || "#a29bfe";
  };

  return (
    <div className="event-detail-page">
      <div className="event-detail-card">
        <button className="back-link" onClick={() => navigate("/events")}>
          ← Back to Events
        </button>

        <div className="event-detail-header">
          <span
            className="event-category-badge"
            style={{
              background: getCategoryColor(event.category) + "22",
              color: getCategoryColor(event.category),
              fontSize: "0.85rem",
              padding: "0.4rem 1rem",
            }}
          >
            {event.category}
          </span>
          <h1>{event.title}</h1>
        </div>

        <div className="event-detail-meta">
          <div className="meta-item">
            <span className="meta-icon">📅</span>
            <div>
              <span className="meta-label">Date</span>
              <span className="meta-value">{dateStr}</span>
            </div>
          </div>
          <div className="meta-item">
            <span className="meta-icon">🕐</span>
            <div>
              <span className="meta-label">Time</span>
              <span className="meta-value">{timeStr}</span>
            </div>
          </div>
          <div className="meta-item">
            <span className="meta-icon">📍</span>
            <div>
              <span className="meta-label">Location</span>
              <span className="meta-value">{event.location}</span>
            </div>
          </div>
          <div className="meta-item">
            <span className="meta-icon">👤</span>
            <div>
              <span className="meta-label">Posted by</span>
              <span className="meta-value">{event.author || "Admin"}</span>
            </div>
          </div>
        </div>

        <div className="event-detail-body">
          <h3>About this Event</h3>
          <p>{event.description}</p>
        </div>
      </div>
    </div>
  );
}

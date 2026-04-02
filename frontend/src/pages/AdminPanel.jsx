import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const CATEGORIES = ["General", "Tech", "Cultural", "Sports", "Workshop", "Seminar"];

const emptyForm = {
  title: "",
  description: "",
  event_date: "",
  location: "",
  category: "General",
};

export default function AdminPanel() {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { token, user } = useAuth();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await axios.get("/api/events", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvents(res.data);
    } catch (err) {
      console.error("Failed to fetch events:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.title || !form.description || !form.event_date || !form.location) {
      setError("All fields are required.");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await axios.put(`/api/events/${editingId}`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess("Event updated successfully!");
      } else {
        await axios.post("/api/events", form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess("Event created successfully!");
      }
      setForm(emptyForm);
      setEditingId(null);
      fetchEvents();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save event.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (event) => {
    setEditingId(event.id);
    setForm({
      title: event.title,
      description: event.description,
      event_date: event.event_date.slice(0, 16), // format for datetime-local
      location: event.location,
      category: event.category,
    });
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await axios.delete(`/api/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess("Event deleted.");
      fetchEvents();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete event.");
    }
  };

  const handleCancel = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setSuccess("");
  };

  if (user?.role !== "admin") {
    return (
      <div className="page-container">
        <div className="glass-card" style={{ textAlign: "center" }}>
          <h2>🔒 Admin Access Required</h2>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>⚙️ Admin Panel</h1>
        <p>Create and manage campus events</p>
      </div>

      {/* Event Form */}
      <div className="admin-form-card glass-card">
        <h2>{editingId ? "✏️ Edit Event" : "➕ Create New Event"}</h2>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} id="event-form">
          <div className="form-group">
            <label className="form-label" htmlFor="event-title">Title</label>
            <input
              id="event-title"
              className="form-input"
              name="title"
              placeholder="e.g. TechFest 2026"
              value={form.title}
              onChange={handleChange}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="event-date">Date & Time</label>
              <input
                id="event-date"
                className="form-input"
                type="datetime-local"
                name="event_date"
                value={form.event_date}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="event-category">Category</label>
              <select
                id="event-category"
                className="form-input"
                name="category"
                value={form.category}
                onChange={handleChange}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="event-location">Location</label>
            <input
              id="event-location"
              className="form-input"
              name="location"
              placeholder="e.g. Auditorium, Main Campus"
              value={form.location}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="event-description">Description</label>
            <textarea
              id="event-description"
              className="form-input form-textarea"
              name="description"
              placeholder="Describe the event in detail..."
              rows={4}
              value={form.description}
              onChange={handleChange}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving && <span className="spinner" />}
              {editingId ? "Update Event" : "Create Event"}
            </button>
            {editingId && (
              <button type="button" className="btn btn-outline" onClick={handleCancel}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Admin Events List */}
      <div className="admin-events-section">
        <h2>📋 All Events ({events.length})</h2>
        {loading ? (
          <div className="events-loading">
            <div className="spinner" style={{ width: 32, height: 32 }} />
          </div>
        ) : events.length === 0 ? (
          <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "2rem" }}>
            No events yet. Create your first event above!
          </p>
        ) : (
          <div className="admin-events-list">
            {events.map((event) => (
              <div key={event.id} className="admin-event-row">
                <div className="admin-event-info">
                  <h4>{event.title}</h4>
                  <span className="admin-event-meta">
                    {event.category} • {new Date(event.event_date).toLocaleDateString("en-IN")} • {event.location}
                  </span>
                </div>
                <div className="admin-event-actions">
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => handleEdit(event)}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(event.id)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

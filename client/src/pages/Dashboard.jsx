import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

/*
  Dashboard.jsx - Event Types Management Page
  
  Displays all event types in a list. Each card shows:
  - Title, duration, and public booking link
  - Edit and Delete actions
  - Color indicator on the left side
  
  This is the main landing page of the admin panel.
*/

// Colors for event type cards (cycles through these)
const COLORS = [
  "#2563eb",
  "#7c3aed",
  "#059669",
  "#d97706",
  "#dc2626",
  "#0891b2",
];

function Dashboard() {
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch event types on page load or when returning to this page
  useEffect(() => {
    fetchEventTypes();
  }, [location]);

  async function fetchEventTypes() {
    try {
      const res = await fetch("/api/event-types");
      const data = await res.json();
      // Ensure data is an array
      if (Array.isArray(data)) {
        setEventTypes(data);
      } else {
        console.error("API returned non-array data:", data);
        setEventTypes([]);
      }
    } catch (err) {
      console.error("Failed to fetch event types:", err);
      setEventTypes([]);
    } finally {
      setLoading(false);
    }
  }

  // Delete an event type after user confirms
  async function handleDelete(id, title) {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      await fetch(`/api/event-types/${id}`, { method: "DELETE" });
      // Remove from local state (no need to refetch)
      setEventTypes((prev) => prev.filter((et) => et.id !== id));
    } catch (err) {
      console.error("Failed to delete event type:", err);
    }
  }

  // Copy public booking link to clipboard
  function copyLink(slug) {
    const url = `${window.location.origin}/book/${slug}`;
    navigator.clipboard.writeText(url);
    alert("Booking link copied to clipboard!");
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2>Event Types</h2>
          <p>Create events to share so people can book you.</p>
        </div>
        <Link to="/event-types/new" className="btn btn-primary">
          + New Event Type
        </Link>
      </div>

      {/* Event Types List */}
      {eventTypes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <h3>No event types yet</h3>
          <p>Create your first event type to get started.</p>
        </div>
      ) : (
        <div className="event-type-list">
          {eventTypes.map((et, index) => (
            <div key={et.id} className="event-type-card">
              <div className="event-type-info">
                {/* Color bar on the left */}
                <div
                  className="event-type-color"
                  style={{ background: COLORS[index % COLORS.length] }}
                />
                <div className="event-type-details">
                  <h3>{et.title}</h3>
                  <div className="event-meta">
                    <span>🕐 {et.duration} min</span>
                    <span>/{et.slug}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="event-type-actions">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => copyLink(et.slug)}
                  title="Copy booking link"
                >
                  🔗 Copy Link
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => window.open(`/book/${et.slug}`, "_blank")}
                  title="Preview booking page"
                >
                  👁 Preview
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => navigate(`/event-types/${et.id}/edit`)}
                >
                  ✏️ Edit
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(et.id, et.title)}
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;

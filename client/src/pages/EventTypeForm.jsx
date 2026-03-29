import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

/*
  EventTypeForm.jsx - Create / Edit Event Type
  
  Handles both creating a new event type and editing an existing one.
  - If the URL has an :id param, we're in edit mode (fetch existing data).
  - Otherwise, we're creating a new event type.
  
  Fields: title, slug, description, duration, location
*/
function EventTypeForm() {
  const navigate = useNavigate();
  const { id } = useParams(); // Will be undefined for "new"
  const isEditing = Boolean(id);

  // Form state
  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    duration: 30,
    location: "Google Meet",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // If editing, fetch existing event type data
  useEffect(() => {
    if (isEditing) {
      fetchEventType();
    }
  }, [id]);

  async function fetchEventType() {
    try {
      // We need to fetch all and find by ID since our API uses slugs for GET
      const res = await fetch("/api/event-types");
      const events = await res.json();
      const event = events.find((e) => e.id === Number(id));
      if (event) {
        setForm({
          title: event.title,
          slug: event.slug,
          description: event.description || "",
          duration: event.duration,
          location: event.location || "Google Meet",
        });
      }
    } catch (err) {
      console.error("Failed to fetch event type:", err);
    }
  }

  // Auto-generate slug from title (only when creating new)
  function handleTitleChange(e) {
    const title = e.target.value;
    setForm((prev) => ({
      ...prev,
      title,
      // Auto-generate slug only if user hasn't manually edited it
      slug: isEditing
        ? prev.slug
        : title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, ""),
    }));
  }

  // Handle form field changes
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  // Submit the form (create or update)
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = isEditing ? `/api/event-types/${id}` : "/api/event-types";
      const method = isEditing ? "PUT" : "POST";

      // Ensure duration is a number
      const submitData = {
        ...form,
        duration: Number(form.duration),
      };

      console.log("Submitting form data:", submitData);

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      console.log("Response status:", res.status, res.statusText);

      const data = await res.json();

      console.log("Response data:", data);

      if (!res.ok) {
        console.error("API error:", data.error);
        setError(data.error || "Something went wrong");
        return;
      }

      console.log("Successfully saved event type, navigating to dashboard");
      // Go back to dashboard on success
      navigate("/");
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to save event type: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{isEditing ? "Edit Event Type" : "New Event Type"}</h2>
          <p>
            {isEditing
              ? "Update your event type details."
              : "Create a new event type for people to book."}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit} style={{ maxWidth: 560 }}>
            {/* Error message */}
            {error && (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#dc2626",
                  padding: "10px 14px",
                  borderRadius: 6,
                  fontSize: 14,
                  marginBottom: 20,
                }}
              >
                {error}
              </div>
            )}

            {/* Title */}
            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                id="title"
                name="title"
                type="text"
                placeholder="e.g. 30 Minute Meeting"
                value={form.title}
                onChange={handleTitleChange}
                required
              />
            </div>

            {/* URL Slug */}
            <div className="form-group">
              <label htmlFor="slug">URL Slug *</label>
              <input
                id="slug"
                name="slug"
                type="text"
                placeholder="e.g. 30-min-meeting"
                value={form.slug}
                onChange={handleChange}
                required
              />
              <div className="form-hint">
                Your booking link: {window.location.origin}/book/
                {form.slug || "your-slug"}
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                placeholder="A brief description of this event type..."
                value={form.description}
                onChange={handleChange}
              />
            </div>

            {/* Duration & Location (side by side) */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="duration">Duration (minutes) *</label>
                <select
                  id="duration"
                  name="duration"
                  value={form.duration}
                  onChange={handleChange}
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                  <option value={90}>90 minutes</option>
                  <option value={120}>120 minutes</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="location">Location</label>
                <select
                  id="location"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                >
                  <option value="Google Meet">Google Meet</option>
                  <option value="Zoom">Zoom</option>
                  <option value="Microsoft Teams">Microsoft Teams</option>
                  <option value="Phone Call">Phone Call</option>
                  <option value="In Person">In Person</option>
                </select>
              </div>
            </div>

            {/* Form actions */}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading
                  ? "Saving..."
                  : isEditing
                    ? "Update Event Type"
                    : "Create Event Type"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate("/")}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EventTypeForm;

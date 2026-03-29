import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

/*
  BookingConfirmation.jsx - Booking Confirmation Page
  
  Shown after a successful booking. Displays:
  - Success checkmark
  - Event title and host name
  - Date, time, duration, and location
  - Booker's name and email
  - Link to go back to the booking page
*/
function BookingConfirmation() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBooking() {
      try {
        const res = await fetch(`/api/bookings/${id}`);
        const data = await res.json();
        setBooking(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchBooking();
  }, [id]);

  // Format date like "Monday, March 30, 2026"
  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  // Format time "14:00" → "2:00 PM"
  function formatTime(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
  }

  if (loading) {
    return (
      <div className="confirmation-container">
        <div className="loading"><div className="spinner"></div></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="confirmation-container">
        <div className="confirmation-card">
          <h2>Booking Not Found</h2>
          <p style={{ color: '#6b7280', marginTop: 8 }}>This booking does not exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="confirmation-container">
      <div className="confirmation-card">
        {/* Success Icon */}
        <div className="check-icon">✓</div>

        <h2>Booking Confirmed!</h2>
        <p className="conf-subtitle">
          You are scheduled with {booking.host_name}. A confirmation has been sent to your email.
        </p>

        {/* Booking Details */}
        <div className="confirmation-details">
          <div className="detail-row">
            <span className="detail-icon">📋</span>
            <div>
              <div className="detail-label">What</div>
              <div className="detail-value">{booking.event_title}</div>
            </div>
          </div>

          <div className="detail-row">
            <span className="detail-icon">📅</span>
            <div>
              <div className="detail-label">When</div>
              <div className="detail-value">
                {formatDate(booking.date)}<br />
                {formatTime(booking.start_time)} – {formatTime(booking.end_time)}
              </div>
            </div>
          </div>

          <div className="detail-row">
            <span className="detail-icon">👤</span>
            <div>
              <div className="detail-label">Who</div>
              <div className="detail-value">
                {booking.booker_name} ({booking.booker_email})
              </div>
            </div>
          </div>

          <div className="detail-row">
            <span className="detail-icon">📍</span>
            <div>
              <div className="detail-label">Where</div>
              <div className="detail-value">{booking.location || 'Google Meet'}</div>
            </div>
          </div>

          <div className="detail-row">
            <span className="detail-icon">⏱</span>
            <div>
              <div className="detail-label">Duration</div>
              <div className="detail-value">{booking.duration} minutes</div>
            </div>
          </div>
        </div>

        {/* Action links */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link to={`/book/${booking.event_slug}`} className="btn btn-secondary">
            Schedule Another
          </Link>
          <Link to="/" className="btn btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default BookingConfirmation;

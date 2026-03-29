import { useState, useEffect } from 'react';

/*
  Bookings.jsx - Bookings Dashboard
  
  Shows all bookings organized by tabs:
  - Upcoming: future bookings that are confirmed
  - Past: bookings from past dates
  - Cancelled: bookings with status 'cancelled'
  
  Admin can cancel individual bookings from this page.
*/

function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    fetchBookings();
  }, []);

  async function fetchBookings() {
    try {
      const res = await fetch('/api/bookings');
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  }

  // Cancel a booking
  async function handleCancel(id) {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const res = await fetch(`/api/bookings/${id}/cancel`, { method: 'PATCH' });
      if (res.ok) {
        // Update local state
        setBookings(prev =>
          prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b)
        );
      }
    } catch (err) {
      console.error('Failed to cancel booking:', err);
    }
  }

  // Filter bookings by tab
  const today = new Date().toISOString().split('T')[0];

  const filtered = bookings.filter(booking => {
    if (activeTab === 'upcoming') {
      return booking.date >= today && booking.status === 'confirmed';
    } else if (activeTab === 'past') {
      return booking.date < today && booking.status === 'confirmed';
    } else {
      return booking.status === 'cancelled';
    }
  });

  // Format a date string like "Mon, Mar 30, 2026"
  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  // Format time like "10:00 AM"
  function formatTime(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
  }

  // Get month abbreviation and day number for the badge
  function getDateParts(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const day = d.getDate();
    return { month, day };
  }

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Bookings</h2>
          <p>View and manage all your scheduled bookings.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bookings-tabs">
        <button
          className={activeTab === 'upcoming' ? 'active' : ''}
          onClick={() => setActiveTab('upcoming')}
        >
          Upcoming
        </button>
        <button
          className={activeTab === 'past' ? 'active' : ''}
          onClick={() => setActiveTab('past')}
        >
          Past
        </button>
        <button
          className={activeTab === 'cancelled' ? 'active' : ''}
          onClick={() => setActiveTab('cancelled')}
        >
          Cancelled
        </button>
      </div>

      {/* Bookings List */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No {activeTab} bookings</h3>
          <p>
            {activeTab === 'upcoming'
              ? "You don't have any upcoming bookings."
              : activeTab === 'past'
              ? "No past bookings found."
              : "No cancelled bookings."}
          </p>
        </div>
      ) : (
        <div>
          {filtered.map((booking) => {
            const { month, day } = getDateParts(booking.date);
            return (
              <div key={booking.id} className="booking-list-item">
                <div className="booking-info">
                  {/* Date badge */}
                  <div className="booking-date-badge">
                    <span className="month">{month}</span>
                    <span className="day">{day}</span>
                  </div>

                  <div className="booking-details">
                    <h4>{booking.event_title} with {booking.booker_name}</h4>
                    <div className="booking-meta">
                      {formatDate(booking.date)} • {formatTime(booking.start_time)} – {formatTime(booking.end_time)}
                      &nbsp;• {booking.booker_email}
                    </div>
                  </div>
                </div>

                <div className="booking-actions">
                  <span className={`status-badge ${booking.status}`}>
                    {booking.status}
                  </span>
                  {booking.status === 'confirmed' && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleCancel(booking.id)}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Bookings;

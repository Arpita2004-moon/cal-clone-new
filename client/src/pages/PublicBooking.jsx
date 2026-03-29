import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

/*
  PublicBooking.jsx - Public Booking Page
  
  This is the page external users see when they visit a booking link like /book/30-min-meeting.
  
  Flow:
  1. User sees event details on the left and a calendar on the right
  2. User selects a date from the calendar
  3. Available time slots appear for that date
  4. User selects a time slot
  5. A booking form appears for name and email
  6. On submit, booking is created and user is redirected to confirmation
*/

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function PublicBooking() {
  const { slug } = useParams();
  const navigate = useNavigate();

  // State
  const [eventType, setEventType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Fetch event type info
  useEffect(() => {
    async function fetchEvent() {
      try {
        const res = await fetch(`/api/event-types/${slug}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        setEventType(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [slug]);

  // Fetch available time slots when a date is selected
  useEffect(() => {
    if (!selectedDate) return;

    async function fetchSlots() {
      setSlotsLoading(true);
      try {
        const dateStr = formatDateStr(selectedDate);
        const res = await fetch(`/api/availability/${dateStr}?eventSlug=${slug}`);
        const data = await res.json();
        setTimeSlots(data);
      } catch (err) {
        console.error(err);
        setTimeSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    }
    fetchSlots();
    setSelectedSlot(null);
    setShowForm(false);
  }, [selectedDate]);

  // ── Calendar helpers ──

  // Get all days to display in the calendar grid for a given month
  function getCalendarDays(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];

    // Empty cells before the first day
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Actual days
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(new Date(year, month, d));
    }

    return days;
  }

  function goToPrevMonth() {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }

  function goToNextMonth() {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }

  // Check if a date is in the past
  function isPastDate(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }

  // Check if two dates are the same day
  function isSameDay(d1, d2) {
    if (!d1 || !d2) return false;
    return d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();
  }

  // Check if date is today
  function isToday(date) {
    return isSameDay(date, new Date());
  }

  // Format date to "YYYY-MM-DD" for API calls
  function formatDateStr(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Format time "14:00" → "2:00 PM"
  function formatTime(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
  }

  // Format selected date nicely
  function formatSelectedDate(date) {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  // Handle time slot selection
  function handleSlotClick(slot) {
    setSelectedSlot(slot);
    setShowForm(true);
  }

  // Submit the booking
  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type_id: eventType.id,
          booker_name: formData.name,
          booker_email: formData.email,
          date: formatDateStr(selectedDate),
          start_time: selectedSlot.start_time,
          end_time: selectedSlot.end_time,
          notes: formData.notes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Failed to book');
        return;
      }

      // Redirect to confirmation page
      navigate(`/booking-confirmed/${data.id}`);
    } catch (err) {
      alert('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render ──

  if (loading) {
    return (
      <div className="booking-layout">
        <div className="loading"><div className="spinner"></div></div>
      </div>
    );
  }

  if (!eventType) {
    return (
      <div className="booking-layout">
        <div className="confirmation-card">
          <h2>Event Not Found</h2>
          <p style={{ color: '#6b7280', marginTop: 8 }}>This booking link is invalid or has been removed.</p>
        </div>
      </div>
    );
  }

  const calendarDays = getCalendarDays(currentMonth);

  return (
    <div className="booking-layout">
      <div className="booking-container">
        {/* ── Left Sidebar: Event Details ── */}
        <div className="booking-sidebar">
          <div className="host-name">{eventType.user_name}</div>
          <div className="event-title">{eventType.title}</div>

          <div className="event-detail">
            <span className="detail-icon">🕐</span>
            {eventType.duration} min
          </div>
          <div className="event-detail">
            <span className="detail-icon">📍</span>
            {eventType.location || 'Google Meet'}
          </div>
          {selectedDate && (
            <div className="event-detail">
              <span className="detail-icon">📅</span>
              {formatSelectedDate(selectedDate)}
            </div>
          )}
          {selectedSlot && (
            <div className="event-detail">
              <span className="detail-icon">⏰</span>
              {formatTime(selectedSlot.start_time)} – {formatTime(selectedSlot.end_time)}
            </div>
          )}

          {eventType.description && (
            <div className="event-description">{eventType.description}</div>
          )}
        </div>

        {/* ── Right Side: Calendar + Slots + Form ── */}
        <div className="booking-main">
          {!showForm ? (
            <>
              {/* Step 1: Select a date */}
              <h3>Select a Date & Time</h3>

              <div style={{ display: 'flex', gap: 24 }}>
                {/* Calendar */}
                <div className="calendar" style={{ flex: 1 }}>
                  <div className="calendar-header">
                    <h4>{MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h4>
                    <div className="cal-nav">
                      <button onClick={goToPrevMonth}>‹</button>
                      <button onClick={goToNextMonth}>›</button>
                    </div>
                  </div>

                  <div className="calendar-grid">
                    {DAY_LABELS.map(day => (
                      <div key={day} className="day-label">{day}</div>
                    ))}

                    {calendarDays.map((day, i) => {
                      if (!day) {
                        return <div key={`empty-${i}`} className="day-cell empty" />;
                      }

                      const past = isPastDate(day);
                      const selected = isSameDay(day, selectedDate);
                      const todayClass = isToday(day);

                      return (
                        <div
                          key={day.toISOString()}
                          className={`day-cell 
                            ${past ? 'disabled' : ''} 
                            ${selected ? 'selected' : ''} 
                            ${todayClass && !selected ? 'today' : ''}
                          `}
                          onClick={() => !past && setSelectedDate(day)}
                        >
                          {day.getDate()}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Time Slots (show when a date is selected) */}
                {selectedDate && (
                  <div style={{ width: 200, flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#374151' }}>
                      {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>

                    {slotsLoading ? (
                      <div className="loading"><div className="spinner"></div></div>
                    ) : timeSlots.length === 0 ? (
                      <div style={{ fontSize: 14, color: '#9ca3af', textAlign: 'center', padding: '20px 0' }}>
                        No available slots
                      </div>
                    ) : (
                      <div className="time-slots">
                        {timeSlots.map((slot) => (
                          <button
                            key={slot.start_time}
                            className={`time-slot-btn ${selectedSlot?.start_time === slot.start_time ? 'selected' : ''}`}
                            onClick={() => handleSlotClick(slot)}
                          >
                            {formatTime(slot.start_time)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Step 2: Booking Form */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowForm(false)}
                >
                  ← Back
                </button>
                <h3 style={{ margin: 0 }}>Enter Your Details</h3>
              </div>

              <form className="booking-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="booker-name">Your Name *</label>
                  <input
                    id="booker-name"
                    type="text"
                    placeholder="John Smith"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="booker-email">Email Address *</label>
                  <input
                    id="booker-email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="booker-notes">Additional Notes</label>
                  <textarea
                    id="booker-notes"
                    placeholder="Share anything that will help prepare for our meeting..."
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={submitting}
                  style={{ width: '100%' }}
                >
                  {submitting ? 'Confirming...' : 'Confirm Booking'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PublicBooking;

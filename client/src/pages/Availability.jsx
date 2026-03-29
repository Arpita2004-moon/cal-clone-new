import { useState, useEffect } from 'react';

/*
  Availability.jsx - Weekly Availability Settings
  
  Lets the user configure which days of the week they're available
  and what hours they're available on each day.
  
  - Toggle each day on/off
  - Set start and end time for each day
  - Save updates all days at once via PUT /api/availability
*/

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function Availability() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Fetch current availability on mount
  useEffect(() => {
    fetchAvailability();
  }, []);

  async function fetchAvailability() {
    try {
      const res = await fetch('/api/availability');
      const data = await res.json();

      // Build a full 7-day schedule (fill in missing days with defaults)
      const schedule = DAY_NAMES.map((_, dayIndex) => {
        const existing = data.find(s => s.day_of_week === dayIndex);
        return existing || {
          day_of_week: dayIndex,
          start_time: '09:00',
          end_time: '17:00',
          is_active: 0,
        };
      });
      setSlots(schedule);
    } catch (err) {
      console.error('Failed to fetch availability:', err);
    } finally {
      setLoading(false);
    }
  }

  // Toggle a day on or off
  function toggleDay(dayIndex) {
    setSlots(prev => prev.map(slot =>
      slot.day_of_week === dayIndex
        ? { ...slot, is_active: slot.is_active ? 0 : 1 }
        : slot
    ));
  }

  // Update the start or end time for a day
  function updateTime(dayIndex, field, value) {
    setSlots(prev => prev.map(slot =>
      slot.day_of_week === dayIndex
        ? { ...slot, [field]: value }
        : slot
    ));
  }

  // Save the entire schedule
  async function handleSave() {
    setSaving(true);
    try {
      await fetch('/api/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save availability:', err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Availability</h2>
          <p>Set the times when you are available for bookings.</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Success toast */}
      {saved && <div className="toast success">✅ Availability saved successfully!</div>}

      {/* Availability Grid */}
      <div className="availability-grid">
        {slots.map((slot) => (
          <div
            key={slot.day_of_week}
            className={`availability-row ${!slot.is_active ? 'inactive' : ''}`}
          >
            {/* Day name and toggle */}
            <div className="day-toggle">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={Boolean(slot.is_active)}
                  onChange={() => toggleDay(slot.day_of_week)}
                />
                <span className="toggle-slider"></span>
              </label>
              <label onClick={() => toggleDay(slot.day_of_week)}>
                {DAY_NAMES[slot.day_of_week]}
              </label>
            </div>

            {/* Time inputs (only active when day is toggled on) */}
            {slot.is_active ? (
              <div className="time-inputs">
                <input
                  type="time"
                  value={slot.start_time}
                  onChange={(e) => updateTime(slot.day_of_week, 'start_time', e.target.value)}
                />
                <span>–</span>
                <input
                  type="time"
                  value={slot.end_time}
                  onChange={(e) => updateTime(slot.day_of_week, 'end_time', e.target.value)}
                />
              </div>
            ) : (
              <div style={{ fontSize: 14, color: '#9ca3af' }}>Unavailable</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Availability;

const express = require('express');
const router = express.Router();
const { queryAll, queryOne, execute, runSQL } = require('../db');

// ─── GET /api/availability ───────────────────────────────────────
// Fetch all availability slots for the default user
router.get('/', (req, res) => {
  try {
    const slots = queryAll(
      'SELECT * FROM availability WHERE user_id = 1 ORDER BY day_of_week ASC'
    );
    res.json(slots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/availability ───────────────────────────────────────
// Update the entire availability schedule (replaces all slots)
router.put('/', (req, res) => {
  try {
    const { slots } = req.body;

    if (!Array.isArray(slots)) {
      return res.status(400).json({ error: 'slots must be an array' });
    }

    // Delete existing slots
    execute('DELETE FROM availability WHERE user_id = 1');

    // Insert new slots
    for (const slot of slots) {
      execute(
        `INSERT INTO availability (user_id, day_of_week, start_time, end_time, is_active)
         VALUES (1, ?, ?, ?, ?)`,
        [slot.day_of_week, slot.start_time, slot.end_time, slot.is_active ? 1 : 0]
      );
    }

    // Return the updated slots
    const updated = queryAll(
      'SELECT * FROM availability WHERE user_id = 1 ORDER BY day_of_week ASC'
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/availability/:date ─────────────────────────────────
// Get available time slots for a specific date
router.get('/:date', (req, res) => {
  try {
    const { date } = req.params;
    const { eventSlug } = req.query;

    // Parse the date to find the day of week (0=Sunday, 6=Saturday)
    const dateObj = new Date(date + 'T00:00:00');
    const dayOfWeek = dateObj.getDay();

    // Get availability for this day
    const availability = queryOne(
      'SELECT * FROM availability WHERE user_id = 1 AND day_of_week = ? AND is_active = 1',
      [dayOfWeek]
    );

    if (!availability) {
      return res.json([]); // No availability for this day
    }

    // Get the event type to know the duration
    const eventType = queryOne('SELECT * FROM event_types WHERE slug = ?', [eventSlug]);
    if (!eventType) {
      return res.status(404).json({ error: 'Event type not found' });
    }

    // Get existing confirmed bookings for this date
    const existingBookings = queryAll(
      "SELECT start_time, end_time FROM bookings WHERE date = ? AND status = 'confirmed'",
      [date]
    );

    // Generate time slots based on availability and duration
    const slots = [];
    const [startHour, startMin] = availability.start_time.split(':').map(Number);
    const [endHour, endMin] = availability.end_time.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const duration = eventType.duration;

    for (let time = startMinutes; time + duration <= endMinutes; time += 30) {
      const slotStart = `${String(Math.floor(time / 60)).padStart(2, '0')}:${String(time % 60).padStart(2, '0')}`;
      const slotEndMin = time + duration;
      const slotEnd = `${String(Math.floor(slotEndMin / 60)).padStart(2, '0')}:${String(slotEndMin % 60).padStart(2, '0')}`;

      // Check if this slot conflicts with any existing booking
      const isBooked = existingBookings.some((booking) => {
        const bookingStart = timeToMinutes(booking.start_time);
        const bookingEnd = timeToMinutes(booking.end_time);
        return time < bookingEnd && slotEndMin > bookingStart;
      });

      if (!isBooked) {
        slots.push({ start_time: slotStart, end_time: slotEnd });
      }
    }

    res.json(slots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper: convert "HH:MM" string to total minutes
function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

module.exports = router;

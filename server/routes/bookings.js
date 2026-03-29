const express = require('express');
const router = express.Router();
const db = require('../db');

// ─── GET /api/bookings ──────────────────────────────────────────
// Fetch all bookings (upcoming and past), with event type details
router.get('/', (req, res) => {
  try {
    const bookings = db.prepare(`
      SELECT b.*, et.title as event_title, et.duration, et.slug as event_slug
      FROM bookings b
      JOIN event_types et ON b.event_type_id = et.id
      ORDER BY b.date DESC, b.start_time DESC
    `).all();
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/bookings/:id ───────────────────────────────────────
// Fetch a single booking by ID (used for confirmation page)
router.get('/:id', (req, res) => {
  try {
    const booking = db.prepare(`
      SELECT b.*, et.title as event_title, et.duration, et.slug as event_slug,
             et.location, u.name as host_name, u.email as host_email
      FROM bookings b
      JOIN event_types et ON b.event_type_id = et.id
      JOIN users u ON et.user_id = u.id
      WHERE b.id = ?
    `).get(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/bookings ─────────────────────────────────────────
// Create a new booking (from public booking page)
router.post('/', (req, res) => {
  try {
    const { event_type_id, booker_name, booker_email, date, start_time, end_time, notes } = req.body;

    // Validate required fields
    if (!event_type_id || !booker_name || !booker_email || !date || !start_time || !end_time) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check for double booking - make sure the time slot isn't already taken
    const conflict = db.prepare(`
      SELECT id FROM bookings 
      WHERE date = ? AND status = 'confirmed'
      AND (
        (start_time < ? AND end_time > ?)
        OR (start_time < ? AND end_time > ?)
        OR (start_time >= ? AND end_time <= ?)
      )
    `).get(date, end_time, start_time, end_time, start_time, start_time, end_time);

    if (conflict) {
      return res.status(409).json({ error: 'This time slot is already booked' });
    }

    const result = db.prepare(`
      INSERT INTO bookings (event_type_id, booker_name, booker_email, date, start_time, end_time, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(event_type_id, booker_name, booker_email, date, start_time, end_time, notes || null);

    const newBooking = db.prepare(`
      SELECT b.*, et.title as event_title, et.duration, et.location,
             u.name as host_name
      FROM bookings b
      JOIN event_types et ON b.event_type_id = et.id
      JOIN users u ON et.user_id = u.id
      WHERE b.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(newBooking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/bookings/:id/cancel ──────────────────────────────
// Cancel a booking
router.patch('/:id/cancel', (req, res) => {
  try {
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Booking is already cancelled' });
    }

    db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run('cancelled', req.params.id);

    const updated = db.prepare(`
      SELECT b.*, et.title as event_title, et.duration
      FROM bookings b
      JOIN event_types et ON b.event_type_id = et.id
      WHERE b.id = ?
    `).get(req.params.id);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

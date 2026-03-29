const express = require('express');
const router = express.Router();
const { queryAll, queryOne, execute } = require('../db');

// ─── GET /api/event-types ────────────────────────────────────────
// Fetch all event types for the default user
router.get('/', (req, res) => {
  try {
    const events = queryAll(`
      SELECT et.*, u.name as user_name 
      FROM event_types et
      JOIN users u ON et.user_id = u.id
      ORDER BY et.created_at DESC
    `);
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/event-types/:slug ──────────────────────────────────
// Fetch a single event type by its slug (used for public booking page)
router.get('/:slug', (req, res) => {
  try {
    const event = queryOne(`
      SELECT et.*, u.name as user_name, u.email as user_email, u.timezone as user_timezone
      FROM event_types et
      JOIN users u ON et.user_id = u.id
      WHERE et.slug = ?
    `, [req.params.slug]);

    if (!event) {
      return res.status(404).json({ error: 'Event type not found' });
    }
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/event-types ───────────────────────────────────────
// Create a new event type
router.post('/', (req, res) => {
  try {
    const { title, description, duration, slug, location } = req.body;

    // Validate required fields
    if (!title || !duration || !slug) {
      return res.status(400).json({ error: 'Title, duration, and slug are required' });
    }

    // Check if slug already exists
    const existing = queryOne('SELECT id FROM event_types WHERE slug = ?', [slug]);
    if (existing) {
      return res.status(400).json({ error: 'An event type with this URL slug already exists' });
    }

    // Use default user (id = 1)
    const result = execute(
      `INSERT INTO event_types (user_id, title, description, duration, slug, location)
       VALUES (1, ?, ?, ?, ?, ?)`,
      [title, description || '', duration, slug, location || 'Google Meet']
    );

    const newEvent = queryOne('SELECT * FROM event_types WHERE id = ?', [result.lastId]);
    res.status(201).json(newEvent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/event-types/:id ────────────────────────────────────
// Update an existing event type
router.put('/:id', (req, res) => {
  try {
    const { title, description, duration, slug, location, is_active } = req.body;
    const { id } = req.params;

    // Check if event type exists
    const existing = queryOne('SELECT * FROM event_types WHERE id = ?', [Number(id)]);
    if (!existing) {
      return res.status(404).json({ error: 'Event type not found' });
    }

    // Check slug uniqueness (if slug is being changed)
    if (slug && slug !== existing.slug) {
      const slugExists = queryOne('SELECT id FROM event_types WHERE slug = ? AND id != ?', [slug, Number(id)]);
      if (slugExists) {
        return res.status(400).json({ error: 'An event type with this URL slug already exists' });
      }
    }

    execute(
      `UPDATE event_types 
       SET title = ?, description = ?, duration = ?, slug = ?, location = ?, is_active = ?
       WHERE id = ?`,
      [
        title || existing.title,
        description !== undefined ? description : existing.description,
        duration || existing.duration,
        slug || existing.slug,
        location || existing.location,
        is_active !== undefined ? is_active : existing.is_active,
        Number(id),
      ]
    );

    const updated = queryOne('SELECT * FROM event_types WHERE id = ?', [Number(id)]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/event-types/:id ─────────────────────────────────
// Delete an event type
router.delete('/:id', (req, res) => {
  try {
    const existing = queryOne('SELECT * FROM event_types WHERE id = ?', [Number(req.params.id)]);
    if (!existing) {
      return res.status(404).json({ error: 'Event type not found' });
    }

    execute('DELETE FROM event_types WHERE id = ?', [Number(req.params.id)]);
    res.json({ message: 'Event type deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

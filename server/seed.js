const db = require('./db');

// ─── Seed Script ─────────────────────────────────────────────────
// Populates the database with sample data for development/demo

function seed() {
  // Clear existing data (order matters due to foreign keys)
  db.exec(`
    DELETE FROM bookings;
    DELETE FROM availability;
    DELETE FROM event_types;
    DELETE FROM users;
  `);

  // ── Insert default user ──
  const insertUser = db.prepare(
    `INSERT INTO users (name, email, timezone) VALUES (?, ?, ?)`
  );
  const userResult = insertUser.run('John Doe', 'john@example.com', 'Asia/Kolkata');
  const userId = userResult.lastInsertRowid;

  // ── Insert sample event types ──
  const insertEvent = db.prepare(
    `INSERT INTO event_types (user_id, title, description, duration, slug, location)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  const event1 = insertEvent.run(
    userId,
    '15 Minute Meeting',
    'A quick 15-minute introductory call to discuss your needs.',
    15,
    '15-min-meeting',
    'Google Meet'
  );

  const event2 = insertEvent.run(
    userId,
    '30 Minute Meeting',
    'A standard 30-minute meeting for detailed discussions.',
    30,
    '30-min-meeting',
    'Google Meet'
  );

  const event3 = insertEvent.run(
    userId,
    '60 Minute Consultation',
    'An in-depth 60-minute consultation session for complex topics.',
    60,
    '60-min-consultation',
    'Zoom'
  );

  // ── Insert availability (Mon-Fri, 9 AM to 5 PM) ──
  const insertAvail = db.prepare(
    `INSERT INTO availability (user_id, day_of_week, start_time, end_time, is_active)
     VALUES (?, ?, ?, ?, ?)`
  );

  // day_of_week: 0=Sunday, 1=Monday, ..., 6=Saturday
  for (let day = 1; day <= 5; day++) {
    insertAvail.run(userId, day, '09:00', '17:00', 1);
  }
  // Weekend - inactive
  insertAvail.run(userId, 0, '09:00', '17:00', 0); // Sunday
  insertAvail.run(userId, 6, '09:00', '17:00', 0); // Saturday

  // ── Insert sample bookings ──
  const insertBooking = db.prepare(
    `INSERT INTO bookings (event_type_id, booker_name, booker_email, date, start_time, end_time, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );

  // A few upcoming bookings
  insertBooking.run(
    event2.lastInsertRowid,
    'Alice Smith',
    'alice@example.com',
    '2026-03-30',
    '10:00',
    '10:30',
    'confirmed',
    'Want to discuss project timeline'
  );

  insertBooking.run(
    event1.lastInsertRowid,
    'Bob Johnson',
    'bob@example.com',
    '2026-03-31',
    '14:00',
    '14:15',
    'confirmed',
    null
  );

  insertBooking.run(
    event3.lastInsertRowid,
    'Carol Williams',
    'carol@example.com',
    '2026-04-01',
    '11:00',
    '12:00',
    'confirmed',
    'Deep dive into architecture'
  );

  // A past booking
  insertBooking.run(
    event2.lastInsertRowid,
    'Dave Brown',
    'dave@example.com',
    '2026-03-25',
    '09:00',
    '09:30',
    'confirmed',
    null
  );

  // A cancelled booking
  insertBooking.run(
    event1.lastInsertRowid,
    'Eve Davis',
    'eve@example.com',
    '2026-03-26',
    '15:00',
    '15:15',
    'cancelled',
    'Had a conflict'
  );

  console.log('✅ Database seeded successfully!');
  console.log(`   - 1 user created`);
  console.log(`   - 3 event types created`);
  console.log(`   - 7 availability slots created`);
  console.log(`   - 5 bookings created`);
}

seed();

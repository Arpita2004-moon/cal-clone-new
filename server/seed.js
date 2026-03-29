const { initDB, runSQL, execute, queryOne } = require('./db');

async function seed() {
  try {
    const db = await initDB();
    
    // Clear existing data (order matters due to foreign keys)
    console.log('Cleaning existing data...');
    runSQL(`
      DELETE FROM bookings;
      DELETE FROM availability;
      DELETE FROM event_types;
      DELETE FROM users;
    `);

    // ── Insert default user ──
    const userRes = execute(
      `INSERT INTO users (name, email, timezone) VALUES (?, ?, ?)`,
      ['John Doe', 'john@example.com', 'Asia/Kolkata']
    );
    const userId = userRes.lastId;

    // ── Insert sample event types ──
    console.log('Inserting sample event types...');
    const event1 = execute(
      `INSERT INTO event_types (user_id, title, description, duration, slug, location)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, '15 Minute Meeting', 'A quick 15-minute introductory call to discuss your needs.', 15, '15-min-meeting', 'Google Meet']
    );

    const event2 = execute(
      `INSERT INTO event_types (user_id, title, description, duration, slug, location)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, '30 Minute Meeting', 'A standard 30-minute meeting for detailed discussions.', 30, '30-min-meeting', 'Google Meet']
    );

    const event3 = execute(
      `INSERT INTO event_types (user_id, title, description, duration, slug, location)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, '60 Minute Consultation', 'An in-depth 60-minute consultation session for complex topics.', 60, '60-min-consultation', 'Zoom']
    );

    // ── Insert availability (Mon-Fri, 9 AM to 5 PM) ──
    console.log('Inserting availability...');
    for (let day = 1; day <= 5; day++) {
      execute(
        `INSERT INTO availability (user_id, day_of_week, start_time, end_time, is_active)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, day, '09:00', '17:00', 1]
      );
    }
    // Weekend - inactive
    execute(`INSERT INTO availability (user_id, day_of_week, start_time, end_time, is_active) VALUES (?, 0, '09:00', '17:00', 0)`, [userId]);
    execute(`INSERT INTO availability (user_id, day_of_week, start_time, end_time, is_active) VALUES (?, 6, '09:00', '17:00', 0)`, [userId]);

    // ── Insert sample bookings ──
    console.log('Inserting sample bookings...');
    execute(
      `INSERT INTO bookings (event_type_id, booker_name, booker_email, date, start_time, end_time, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [event2.lastId, 'Alice Smith', 'alice@example.com', '2026-03-30', '10:00', '10:30', 'confirmed', 'Want to discuss project timeline']
    );

    execute(
      `INSERT INTO bookings (event_type_id, booker_name, booker_email, date, start_time, end_time, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [event1.lastId, 'Bob Johnson', 'bob@example.com', '2026-03-31', '14:00', '14:15', 'confirmed', null]
    );

    execute(
      `INSERT INTO bookings (event_type_id, booker_name, booker_email, date, start_time, end_time, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [event3.lastId, 'Carol Williams', 'carol@example.com', '2026-04-01', '11:00', '12:00', 'confirmed', 'Deep dive into architecture']
    );

    console.log('✅ Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seed();


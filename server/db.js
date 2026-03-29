const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const usePostgres = !!process.env.DATABASE_URL;
let db = null;
let pool = null;

if (usePostgres) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  console.log('📡 Using Postgres database');
} else {
  console.log('📂 Using SQLite database');
}

const DB_PATH = path.join(__dirname, 'scheduling.db');

async function initDB() {
  if (usePostgres) {
    // Tables for Postgres (slightly different syntax than SQLite)
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS event_types (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          description TEXT,
          duration INTEGER NOT NULL DEFAULT 30,
          slug TEXT NOT NULL UNIQUE,
          location TEXT DEFAULT 'Google Meet',
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS availability (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
          start_time TEXT NOT NULL,
          end_time TEXT NOT NULL,
          is_active BOOLEAN NOT NULL DEFAULT TRUE
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS bookings (
          id SERIAL PRIMARY KEY,
          event_type_id INTEGER NOT NULL REFERENCES event_types(id) ON DELETE CASCADE,
          booker_name TEXT NOT NULL,
          booker_email TEXT NOT NULL,
          date TEXT NOT NULL,
          start_time TEXT NOT NULL,
          end_time TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'confirmed' CHECK(status IN ('confirmed','cancelled')),
          notes TEXT,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Postgres tables initialized');
    } finally {
      client.release();
    }
  } else {
    // Standard SQLite initialization
    const SQL = await initSqlJs();
    try {
      if (fs.existsSync(DB_PATH)) {
        const fileBuffer = fs.readFileSync(DB_PATH);
        db = new SQL.Database(fileBuffer);
      } else {
        db = new SQL.Database();
      }
    } catch (err) {
      db = new SQL.Database();
    }
    db.run('PRAGMA foreign_keys = ON');

    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS event_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        duration INTEGER NOT NULL DEFAULT 30,
        slug TEXT NOT NULL UNIQUE,
        location TEXT DEFAULT 'Google Meet',
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS availability (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type_id INTEGER NOT NULL,
        booker_name TEXT NOT NULL,
        booker_email TEXT NOT NULL,
        date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'confirmed' CHECK(status IN ('confirmed','cancelled')),
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_type_id) REFERENCES event_types(id) ON DELETE CASCADE
      )
    `);
    saveDB();
    console.log('✅ SQLite database initialized');
  }
}

function saveDB() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

// Convert SQLite '?' to Postgres '$n'
function sqliteToPostgres(sql) {
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
}

async function queryAll(sql, params = []) {
  if (usePostgres) {
    const res = await pool.query(sqliteToPostgres(sql), params);
    return res.rows;
  } else {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }
}

async function queryOne(sql, params = []) {
  const rows = await queryAll(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

async function execute(sql, params = []) {
  if (usePostgres) {
    // Add RETURNING id if it's an insert to mimic last_insert_rowid
    let finalSql = sqliteToPostgres(sql);
    if (finalSql.trim().toLowerCase().startsWith('insert')) {
      finalSql += ' RETURNING id';
    }
    const res = await pool.query(finalSql, params);
    return { changes: res.rowCount, lastId: res.rows[0]?.id || 0 };
  } else {
    db.run(sql, params);
    const lastId = db.exec('SELECT last_insert_rowid()')[0]?.values[0][0] || 0;
    const changes = db.getRowsModified();
    saveDB();
    return { changes, lastId };
  }
}

async function runSQL(sql) {
  if (usePostgres) {
    await pool.query(sql);
  } else {
    db.run(sql);
    saveDB();
  }
}

module.exports = { initDB, queryAll, queryOne, execute, runSQL, saveDB };


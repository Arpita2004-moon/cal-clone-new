const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { initDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ──────────────────────────────────────────────────
app.use(cors());                         // Allow cross-origin requests from React dev server
app.use(express.json());                 // Parse JSON request bodies

// ─── API Routes ─────────────────────────────────────────────────
const eventTypesRouter = require('./routes/eventTypes');
const availabilityRouter = require('./routes/availability');
const bookingsRouter = require('./routes/bookings');

app.use('/api/event-types', eventTypesRouter);
app.use('/api/availability', availabilityRouter);
app.use('/api/bookings', bookingsRouter);

// ─── Health Check ───────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// ─── Serve React build in production ────────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// ─── Start Server ───────────────────────────────────────────────
async function start() {
  try {
    await initDB();
    // Only listen if we're not in a serverless environment (detected by some common vars)
    if (process.env.NODE_ENV !== 'production' || process.env.RENDER || !process.env.VERCEL) {
      app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
      });
    }
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    // Don't exit if on Vercel
    if (!process.env.VERCEL) process.exit(1);
  }
}

start();

module.exports = app;


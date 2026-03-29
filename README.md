# CalSync - Advanced Scheduling and Booking Platform

CalSync is a full-stack scheduling application designed to streamline the process of managing event types, setting availability, and facilitating public bookings. It provides a robust administrative interface for event management and a seamless booking experience for end-users, similar to platforms like Cal.com.

## Technology Stack

### Frontend
- React.js (Vite)
- React Router DOM
- CSS3 (Vanilla)

### Backend
- Node.js
- Express.js
- SQLite (Local development)
- PostgreSQL (Production deployment via Neon)

### Deployment & Infrastructure
- Vercel (Frontend Hosting)
- Render (Backend Hosting)
- Neon (Managed PostgreSQL Database)

## Key Features

1. **Event Type Management**: Create, edit, and delete various event types with customizable titles, descriptions, durations, and locations.
2. **Weekly Availability**: Define granular availability slots for each day of the week to control when bookings can occur.
3. **Public Booking System**: A dedicated public-facing page where users can view available slots and book appointments in real-time.
4. **Booking Management**: A centralized dashboard to track, view, and manage all confirmed and cancelled appointments.
5. **Cross-Database Compatibility**: Intelligent database abstraction layer that supports SQLite for local speed and PostgreSQL for production reliability.

## Project Structure

```text
cal-clone_Ap/
├── api/                    # Vercel serverless entry point
├── client/                 # Frontend React application
│   ├── public/             # Static assets
│   ├── src/                
│   │   ├── pages/          # Individual application views
│   │   ├── config.js       # Production API configuration
│   │   └── main.jsx        # Application entry point
│   ├── package.json        
│   └── vite.config.js      
├── server/                 # Backend Node.js/Express application
│   ├── routes/             # API route handlers (Event types, Availability, Bookings)
│   ├── db.js               # Database abstraction layer (Postgres/SQLite)
│   ├── index.js            # Express application setup
│   ├── seed.js             # Database seeding script
│   └── package.json        
├── vercel.json             # Vercel deployment configuration
└── package.json            # Root configuration and build scripts
```

## API Specification

### Event Types
- `GET /api/event-types`: Retrieve all configured event types.
- `GET /api/event-types/:id`: Retrieve details of a specific event type.
- `POST /api/event-types`: Create a new event type.
- `PUT /api/event-types/:id`: Update an existing event type.
- `DELETE /api/event-types/:id`: Remove an event type.

### Availability
- `GET /api/availability`: Retrieve current weekly availability settings.
- `PUT /api/availability`: Update weekly availability slots.
- `GET /api/availability/:date`: Fetch available time slots for a specific date.

### Bookings
- `GET /api/bookings`: Retrieve all bookings.
- `POST /api/bookings`: Create a new booking appointment.

## Database Schema

### Users
- `id`: Serial/Primary Key
- `name`: User's full name
- `email`: Unique email address
- `timezone`: Default timezone (e.g., Asia/Kolkata)

### Event Types
- `id`: Serial/Primary Key
- `user_id`: Reference to Users
- `title`: Event name
- `duration`: Meeting length in minutes
- `slug`: Unique URL identifier
- `location`: Meeting medium (e.g., Google Meet)

### Availability
- `user_id`: Reference to Users
- `day_of_week`: Integer (0-6)
- `start_time`: e.g., "09:00"
- `end_time`: e.g., "17:00"

## Installation and Setup

### Local Development
1. Clone the repository.
2. Install dependencies for all components:
   ```bash
   npm install
   npm run client:install
   npm run server:install
   ```
3. Initialize and seed the local database:
   ```bash
   node server/seed.js
   ```
4. Start both client and server in development mode:
   ```bash
   npm run dev
   ```

### Production Configuration
1. **Environment Variables**: Set `DATABASE_URL` in the production environment to point to your PostgreSQL instance.
2. **API Base URL**: Update `client/src/config.js` with the production server's absolute URL.
3. **Build Script**: Use `npm run build` at the root to compile the frontend assets.

## Project Attribution

This project was developed as a Software Development Engineer (SDE) Intern project for **Scaler AI**.

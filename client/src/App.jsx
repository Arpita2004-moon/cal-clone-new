import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import EventTypeForm from './pages/EventTypeForm';
import Availability from './pages/Availability';
import Bookings from './pages/Bookings';
import PublicBooking from './pages/PublicBooking';
import BookingConfirmation from './pages/BookingConfirmation';

/*
  App.jsx - Main routing component
  
  Routes:
  - /                    → Dashboard (list event types)
  - /event-types/new     → Create new event type
  - /event-types/:id/edit → Edit existing event type
  - /availability        → Set availability schedule
  - /bookings            → View all bookings
  - /book/:slug          → Public booking page (no sidebar)
  - /booking-confirmed/:id → Booking confirmation (no sidebar)
*/
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Admin pages (with sidebar layout) */}
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/event-types/new" element={<EventTypeForm />} />
          <Route path="/event-types/:id/edit" element={<EventTypeForm />} />
          <Route path="/availability" element={<Availability />} />
          <Route path="/bookings" element={<Bookings />} />
        </Route>

        {/* Public pages (no sidebar) */}
        <Route path="/book/:slug" element={<PublicBooking />} />
        <Route path="/booking-confirmed/:id" element={<BookingConfirmation />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

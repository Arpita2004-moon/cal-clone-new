import { Outlet, NavLink } from 'react-router-dom';

/*
  Layout.jsx - Sidebar layout wrapper for admin pages
  
  Contains:
  - Sidebar with navigation links
  - User info section at bottom
  - Main content area (renders child route via <Outlet />)
*/
function Layout() {
  return (
    <div className="app-layout">
      {/* ── Sidebar Navigation ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>
            <span className="logo-icon">📅</span> CalSync
          </h1>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
            <span className="nav-icon">📋</span>
            Event Types
          </NavLink>
          <NavLink to="/bookings" className={({ isActive }) => isActive ? 'active' : ''}>
            <span className="nav-icon">📆</span>
            Bookings
          </NavLink>
          <NavLink to="/availability" className={({ isActive }) => isActive ? 'active' : ''}>
            <span className="nav-icon">🕐</span>
            Availability
          </NavLink>
        </nav>

        {/* ── User Info (default user) ── */}
        <div className="sidebar-user">
          <div className="avatar">JD</div>
          <div className="user-info">
            <div className="user-name">John Doe</div>
            <div className="user-email">john@example.com</div>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;

import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/", label: "Chat" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/compare", label: "Compare" },
];

function AppShell() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/" className="brand" aria-label="InvestIQ home">
          <span className="brand-mark">IQ</span>
          <span>
            <strong>InvestIQ</strong>
            <small>AI Investment Research Assistant</small>
          </span>
        </NavLink>

        <nav className="main-nav" aria-label="Primary navigation">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="page-shell">
        <Outlet />
      </main>
    </div>
  );
}

export default AppShell;

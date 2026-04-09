import { NavLink, Outlet, useLocation } from "react-router-dom";

const links = [
  { to: "/", label: "Chat" },
  { to: "/learn", label: "Learn", highlight: true, badge: "Start here" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/compare", label: "Compare" },
];

function AppShell() {
  const location = useLocation();
  const showLearnCallout = location.pathname !== "/learn";

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
                [
                  "nav-link",
                  isActive ? "active" : "",
                  link.highlight ? "nav-link-highlight" : "",
                ]
                  .filter(Boolean)
                  .join(" ")
              }
            >
              <span>{link.label}</span>
              {link.badge ? (
                <span className="nav-link-badge">{link.badge}</span>
              ) : null}
            </NavLink>
          ))}
        </nav>
      </header>

      {showLearnCallout ? (
        <div className="topbar-callout-wrap">
          <div className="topbar-callout">
            <strong>New to investing?</strong>
            <span>
              Start with the Learn tab for simple explanations of SPY, QQQ, and
              AAPL before you explore chat answers and comparisons.
            </span>
            <NavLink to="/learn" className="topbar-callout-link">
              Open Learn
            </NavLink>
          </div>
        </div>
      ) : null}

      <main className="page-shell">
        <Outlet />
      </main>

      <footer className="app-footer">
        <div className="app-footer-inner">
          <p>Built by Ramya Jeldy</p>
          <p>Copyright © 2026 InvestIQ. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default AppShell;

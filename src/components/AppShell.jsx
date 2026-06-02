import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function LogoMark({ variant = "default" }) {
  return (
    <img
      className={`brand-mark ${variant === "dashboard" ? "brand-mark-dashboard" : ""}`}
      src="/splitcircle-logo.png"
      alt=""
      aria-hidden="true"
    />
  );
}

export function AppHeader() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isDashboard = location.pathname === "/dashboard";

  return (
    <header className="app-header">
      <div className="shell-inner">
        <Link to="/dashboard" className="brand">
          <LogoMark variant={isDashboard ? "dashboard" : "default"} />
          <div>
            <div className="brand-name">SplitCircle</div>
            <div className="brand-tagline">Shared money, simplified</div>
          </div>
        </Link>

        <div className="header-actions">
          <Link className="profile-chip" to="/dashboard" title="Profile">
            <span className="profile-avatar">{auth?.user?.name?.[0]?.toUpperCase() || "S"}</span>
            <span className="profile-text">
              <strong>{auth?.user?.name || "Profile"}</strong>
              <span className="muted">{auth?.user?.email || "Manage account"}</span>
            </span>
          </Link>
          <button
            className="btn secondary"
            type="button"
            onClick={() => {
              auth.logout();
              navigate("/");
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

export function AppFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="shell-inner">
        <div className="footer-copy">© {year} SplitCircle. All rights reserved.</div>
      </div>
    </footer>
  );
}

export default function AppShell({ children }) {
  return (
    <div className="page-shell">
      <AppHeader />
      <main className="app-main">{children}</main>
      <AppFooter />
    </div>
  );
}

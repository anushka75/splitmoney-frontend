import React from "react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchDashboard } from "../api/services";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const [data, setData] = useState({});
  const auth = useAuth();

  useEffect(() => {
    fetchDashboard()
      .then((response) => {
        setData(response || {});
      })
      .catch(() => setData({}));
  }, []);

  const stats = data?.stats ?? data ?? {};

  return (
    <div className="layout stack">
      <div className="row card" style={{ padding: 20 }}>
        <div>
          <div className="pill">Dashboard</div>
          <h1 style={{ marginBottom: 4 }}>Hi {auth?.user?.name || "there"}</h1>
          <p className="muted">Track shared balances and keep every group settled.</p>
        </div>
        <div className="row">
          <Link className="btn secondary" to="/groups">Groups</Link>
        </div>
      </div>
      <div className="grid grid-2">
        <div className="card" style={{ padding: 20 }}>
          <h3>Total balance</h3>
          <p style={{ fontSize: 36, margin: 0 }}>{stats.total_expenses ?? "0.00"}</p>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <h3>Open groups</h3>
          <p style={{ fontSize: 36, margin: 0 }}>{stats.total_groups ?? 0}</p>
        </div>
      </div>
      <div className="card" style={{ padding: 20 }}>
        <h3>Recent activity</h3>
        <p className="muted">Connect this section to your backend activity feed or expense stream.</p>
      </div>
    </div>
  );
}

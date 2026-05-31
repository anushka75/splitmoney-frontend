import React from "react";
export default function Expenses() {
  return (
    <div className="app-shell layout">
      <div className="card" style={{ padding: 20 }}>
        <h1>Expenses</h1>
        <p className="muted">Use the group details page to add expenses and expand this view if your backend exposes a global expenses endpoint.</p>
      </div>
    </div>
  );
}

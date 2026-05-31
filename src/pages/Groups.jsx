import React from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createGroup, deleteGroup, fetchGroups } from "../api/services";

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchGroups().then(setGroups).catch(() => setGroups([]));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const created = await createGroup({ name });
    setGroups((prev) => [created, ...prev]);
    setName("");
  };

  const removeGroup = async (groupId) => {
    const confirmed = window.confirm("Delete this group? This cannot be undone.");
    if (!confirmed) return;
    try {
      await deleteGroup(groupId);
      setGroups((prev) => prev.filter((group) => String(group.id) !== String(groupId)));
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete group");
    }
  };

  return (
    <div className="app-shell layout stack">
      <div className="card" style={{ padding: 20 }}>
        <div className="row" style={{ alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ marginBottom: 6 }}>Groups</h1>
            <p className="muted" style={{ marginBottom: 0 }}>Create and manage your shared groups.</p>
          </div>
          <Link className="btn secondary" to="/dashboard">Back to dashboard</Link>
        </div>
        <form className="row" onSubmit={submit} style={{ marginTop: 16 }}>
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="New group name" />
          <button className="btn" type="submit">Create</button>
        </form>
        {error ? <p style={{ color: "#fca5a5" }}>{error}</p> : null}
      </div>
      <div className="grid grid-2">
        {groups.map((group) => (
          <div className="card stack" key={group.id} style={{ padding: 20 }}>
            <Link to={`/groups/${group.id}`}>
              <h3>{group.name}</h3>
            </Link>
            <p className="muted">{group.memberCount ?? 0} members</p>
            <div className="row" style={{ justifyContent: "flex-start", gap: 12 }}>
              <Link className="btn secondary" to={`/groups/${group.id}`}>Open</Link>
              <button className="btn secondary" type="button" onClick={() => removeGroup(group.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

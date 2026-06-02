import React from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createGroup, deleteGroup, fetchGroups } from "../api/services";
import { getApiErrorMessage } from "../api/error";

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [pendingDeleteGroup, setPendingDeleteGroup] = useState(null);

  useEffect(() => {
    fetchGroups().then(setGroups).catch(() => setGroups([]));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const created = await createGroup({ name });
      setGroups((prev) => [created, ...prev]);
      setName("");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to create group"));
    }
  };

  const removeGroup = async (groupId) => {
    try {
      await deleteGroup(groupId);
      setGroups((prev) => prev.filter((group) => String(group.id) !== String(groupId)));
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to delete group"));
    }
  };

  return (
    <div className="layout stack">
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
              <button className="btn secondary" type="button" onClick={() => setPendingDeleteGroup(group)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      {pendingDeleteGroup ? (
        <div className="members-modal-overlay" role="dialog" aria-modal="true" onClick={() => setPendingDeleteGroup(null)}>
          <div className="card members-modal stack" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Delete this group?</h3>
            <p className="muted" style={{ marginBottom: 0 }}>
              This cannot be undone. The group and its data will be removed.
            </p>
            <div className="row" style={{ justifyContent: "flex-end", gap: 12, flexWrap: "wrap" }}>
              <button className="btn secondary" type="button" onClick={() => setPendingDeleteGroup(null)}>
                Cancel
              </button>
              <button
                className="btn"
                type="button"
                onClick={async () => {
                  const groupId = pendingDeleteGroup.id;
                  try {
                    await removeGroup(groupId);
                    setPendingDeleteGroup(null);
                  } catch {
                    setPendingDeleteGroup(null);
                  }
                }}
              >
                Delete group
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

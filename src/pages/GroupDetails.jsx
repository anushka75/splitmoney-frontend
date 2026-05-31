import React from "react";
import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { addExpense, addGroupMember, deleteGroup, fetchExpenses, fetchGroup, fetchGroupMembers } from "../api/services";
import { useAuth } from "../context/AuthContext";

export default function GroupDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [members, setMembers] = useState([]);
  const [memberForm, setMemberForm] = useState({ name: "", email: "" });
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    amount: "",
    paid_by: "",
    split_type: "equal",
    participantIds: [],
  });
  const [error, setError] = useState("");
  const [memberError, setMemberError] = useState("");
  const [actionError, setActionError] = useState("");

  const normalizeMember = (member) => ({
    id: member?.id ?? member?.user_id ?? member?.userId ?? member?.member_id ?? "",
    name: member?.name ?? member?.full_name ?? member?.username ?? member?.email ?? `User ${member?.id ?? member?.user_id ?? ""}`,
    email: member?.email ?? "",
    raw: member,
  });

  useEffect(() => {
    fetchGroup(id)
      .then(setGroup)
      .catch(() => {
        setGroup(null);
      });
    fetchGroupMembers(id)
      .then((data) => {
        const rawMembers = Array.isArray(data) ? data : Array.isArray(data?.members) ? data.members : [];
        setMembers(rawMembers.map(normalizeMember).filter((member) => member.id !== ""));
      })
      .catch(() => setMembers([]));
    fetchExpenses(id).then(setExpenses).catch(() => setExpenses([]));
  }, [id]);

  const refreshMembers = async () => {
    try {
      const data = await fetchGroupMembers(id);
      const rawMembers = Array.isArray(data) ? data : Array.isArray(data?.members) ? data.members : [];
      setMembers(rawMembers.map(normalizeMember).filter((member) => member.id !== ""));
    } catch {
      setMembers([]);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    const singleMember = members.length === 1 ? members[0] : null;
    const selectedIds =
      singleMember != null
        ? [String(singleMember.id)]
        : form.participantIds;

    const selectedParticipants = members
      .filter((member) => selectedIds.includes(String(member.id)))
      .map((member) => ({
        user_id: Number(member.id),
        name: member.name,
        email: member.email || undefined,
        ratio: singleMember ? 100 : null,
      }));

    const payload = {
      group_id: Number(id),
      amount: Number(form.amount),
      title: form.title,
      description: form.description || null,
      paid_by: Number(singleMember ? singleMember.id : form.paid_by),
      split_type: singleMember ? "equal" : form.split_type,
      created_by: auth?.user?.id ?? auth?.user?.user_id ?? null,
      participants: selectedParticipants,
    };

    const created = await addExpense(id, payload);
    setExpenses((prev) => [created, ...prev]);
    setForm({
      title: "",
      description: "",
      amount: "",
      paid_by: "",
      split_type: "equal",
      participantIds: [],
    });
  };

  const addMember = async (e) => {
    e.preventDefault();
    setMemberError("");
    try {
      await addGroupMember(id, {
        name: memberForm.name || null,
        email: memberForm.email || null,
      });
      setMemberForm({ name: "", email: "" });
      await refreshMembers();
    } catch (err) {
      setMemberError(err?.response?.data?.message || "Failed to add member");
    }
  };

  const removeGroup = async () => {
    setActionError("");
    const confirmed = window.confirm("Delete this group? This cannot be undone.");
    if (!confirmed) return;
    try {
      await deleteGroup(id);
      navigate("/groups");
    } catch (err) {
      setActionError(err?.response?.data?.message || "Failed to delete group");
    }
  };

  return (
    <div className="app-shell layout stack">
      <Link to="/groups" className="muted">Back to groups</Link>
      <div className="card" style={{ padding: 20 }}>
        <div className="row" style={{ alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ marginBottom: 6 }}>{group?.name || "Group details"}</h1>
            <p className="muted" style={{ marginBottom: 0 }}>Add expenses and share costs.</p>
          </div>
          <div className="row" style={{ justifyContent: "flex-end", gap: 12, flexWrap: "wrap" }}>
            <button className="btn secondary" type="button" onClick={() => setShowMembersModal(true)}>
              Members
            </button>
            <button className="btn secondary" type="button" onClick={removeGroup}>Delete group</button>
          </div>
        </div>
        {actionError ? <p style={{ color: "#fca5a5" }}>{actionError}</p> : null}
      </div>
      <form className="card stack" onSubmit={submit} style={{ padding: 20 }}>
        <h3>Add expense</h3>
        <input className="field" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input className="field" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input className="field" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        {members.length <= 1 ? (
          <div className="card" style={{ padding: 12, background: "rgba(148,163,184,.06)" }}>
            <strong>Single member group</strong>
            <p className="muted" style={{ marginBottom: 0 }}>
              Split is automatically set to 100% for the only member in this group.
            </p>
          </div>
        ) : (
          <>
            <label className="muted">Paid by</label>
            <select className="field" value={form.paid_by} onChange={(e) => setForm({ ...form, paid_by: e.target.value })}>
              <option value="">Select who paid</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}{member.email ? ` (${member.email})` : ""}
                </option>
              ))}
            </select>
            <select className="field" value={form.split_type} onChange={(e) => setForm({ ...form, split_type: e.target.value })}>
              <option value="equal">equal</option>
              <option value="exact">exact</option>
              <option value="percentage">percentage</option>
              <option value="shares">shares</option>
            </select>
            <div className="stack" style={{ gap: 8 }}>
              <label className="muted">Split among</label>
              {members.length === 0 ? (
                <p className="muted">No group members found in the group response.</p>
              ) : (
                members.map((member) => (
                  <label key={member.id} className="row" style={{ justifyContent: "flex-start", gap: 10 }}>
                    <input
                      type="checkbox"
                      checked={form.participantIds.includes(String(member.id))}
                      onChange={(e) => {
                        setForm((prev) => ({
                          ...prev,
                          participantIds: e.target.checked
                            ? [...prev.participantIds, String(member.id)]
                            : prev.participantIds.filter((participantId) => participantId !== String(member.id)),
                        }));
                      }}
                    />
                    <span>
                      {member.name}
                      {member.email ? ` (${member.email})` : ""}
                    </span>
                  </label>
                ))
              )}
            </div>
          </>
        )}
        {error ? <p style={{ color: "#fca5a5" }}>{error}</p> : null}
        <button className="btn" type="submit">Save expense</button>
      </form>
      <div className="card stack" style={{ padding: 20 }}>
        <h3>Expenses</h3>
        {expenses.length === 0 ? (
          <p className="muted">No expenses added yet.</p>
        ) : (
          expenses.map((expense) => (
            <div key={expense.id} className="row" style={{ padding: "12px 0", borderBottom: "1px solid rgba(148,163,184,.12)" }}>
              <div>
                <strong>{expense.description}</strong>
                <div className="muted">{expense.createdAt || expense.date || ""}</div>
              </div>
              <strong>{expense.amount}</strong>
            </div>
          ))
        )}
      </div>
      {showMembersModal ? (
        <div className="members-modal-overlay" role="dialog" aria-modal="true" onClick={() => setShowMembersModal(false)}>
          <div className="card members-modal stack" onClick={(e) => e.stopPropagation()}>
            <div className="row" style={{ alignItems: "flex-start" }}>
              <div>
                <h3 style={{ marginTop: 0 }}>Group members</h3>
                <p className="muted" style={{ marginBottom: 0 }}>See who is already in the group and add more people here.</p>
              </div>
              <button className="btn secondary" type="button" onClick={() => setShowMembersModal(false)}>Close</button>
            </div>
            <div className="stack" style={{ gap: 8 }}>
              {members.length === 0 ? (
                <p className="muted">No members found yet.</p>
              ) : (
                members.map((member) => (
                  <div key={member.id} className="row" style={{ padding: "10px 0", borderBottom: "1px solid rgba(148,163,184,.12)" }}>
                    <div>
                      <strong>{member.name}</strong>
                      {member.email ? <div className="muted">{member.email}</div> : null}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="card stack" style={{ padding: 16 }}>
              <h4 style={{ margin: 0 }}>Add member</h4>
              <form className="stack" onSubmit={addMember}>
                <input
                  className="field"
                  placeholder="Name"
                  value={memberForm.name}
                  onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                />
                <input
                  className="field"
                  placeholder="Email"
                  value={memberForm.email}
                  onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                />
                {memberError ? <p style={{ color: "#fca5a5" }}>{memberError}</p> : null}
                <button className="btn" type="submit">Add member</button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

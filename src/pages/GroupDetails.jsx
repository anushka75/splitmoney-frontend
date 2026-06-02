import React from "react";
import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { addExpense, addGroupMember, deleteGroup, fetchExpenses, fetchGroup, fetchGroupMembers, inviteGroupMember, leaveGroup } from "../api/services";
import { useAuth } from "../context/AuthContext";
import { getApiErrorMessage } from "../api/error";

export default function GroupDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [members, setMembers] = useState([]);
  const [memberForm, setMemberForm] = useState({ name: "", email: "" });
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [inviteMode, setInviteMode] = useState("email");
  const [showExpenseModal, setShowExpenseModal] = useState(false);
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
  const [confirmAction, setConfirmAction] = useState(null);

  const normalizeMember = (member) => ({
    id: member?.user_id ?? member?.userId ?? member?.id ?? member?.member_id ?? "",
    name: member?.name ?? member?.full_name ?? member?.username ?? member?.email ?? `User ${member?.user_id ?? member?.id ?? ""}`,
    email: member?.email ?? "",
  });

  const dedupeMembers = (rawMembers) => {
    const seen = new Set();
    return rawMembers
      .map(normalizeMember)
      .filter((member) => {
        if (member.id === "" || seen.has(String(member.id))) return false;
        seen.add(String(member.id));
        return true;
      });
  };

  const readGroupMembers = (data) => {
    const rawMembers = Array.isArray(data) ? data : Array.isArray(data?.members) ? data.members : [];
    return dedupeMembers(rawMembers);
  };

  useEffect(() => {
    fetchGroup(id)
      .then(setGroup)
      .catch(() => {
        setGroup(null);
      });
    fetchGroupMembers(id)
      .then((data) => setMembers(readGroupMembers(data)))
      .catch(() => setMembers([]));
    fetchExpenses(id).then(setExpenses).catch(() => setExpenses([]));
  }, [id]);

  const refreshMembers = async () => {
    try {
      const data = await fetchGroupMembers(id);
      setMembers(readGroupMembers(data));
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

    try {
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
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to save expense"));
    }
  };

  const addMember = async (e) => {
    e.preventDefault();
    setMemberError("");
    try {
      if (inviteMode === "email") {
        await inviteGroupMember(id, {
          email: memberForm.email || null,
        });
      } else {
        await addGroupMember(id, {
          name: memberForm.name || memberForm.email || null,
          email: memberForm.email || null,
        });
      }
      setMemberForm({ name: "", email: "" });
      await refreshMembers();
    } catch (err) {
      setMemberError(getApiErrorMessage(err, "Failed to invite member"));
    }
  };

  const runAction = async (action) => {
    setActionError("");
    setConfirmAction(null);
    try {
      if (action === "delete") {
        await deleteGroup(id);
      } else {
        await leaveGroup(id);
      }
      navigate("/groups");
    } catch (err) {
      setActionError(getApiErrorMessage(err, action === "delete" ? "Failed to delete group" : "Failed to leave group"));
    }
  };

  const groupedExpenses = expenses.reduce((acc, expense) => {
    const rawDate = expense?.createdAt || expense?.date || expense?.created_at || expense?.expense_date || "";
    const parsed = rawDate ? new Date(rawDate) : null;
    const key = parsed && !Number.isNaN(parsed.getTime())
      ? parsed.toLocaleString(undefined, { month: "long", year: "numeric" })
      : "Unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(expense);
    return acc;
  }, {});

  return (
    <div className="layout stack">
      <Link to="/groups" className="muted">Back to groups</Link>
      <div className="card" style={{ padding: 20 }}>
        <div className="row" style={{ alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ marginBottom: 6 }}>{group?.name || "Group details"}</h1>
            <p className="muted" style={{ marginBottom: 0 }}>Add expenses and share costs.</p>
          </div>
          <div className="row" style={{ justifyContent: "flex-end", gap: 12, flexWrap: "wrap" }}>
            <button className="btn secondary" type="button" onClick={() => setShowMembersModal(true)}>
              {members.length} Members
            </button>
            <button className="btn secondary" type="button" onClick={() => setConfirmAction("leave")}>Leave group</button>
            <button className="btn secondary" type="button" onClick={() => setConfirmAction("delete")}>Delete group</button>
          </div>
        </div>
        {actionError ? <p style={{ color: "#fca5a5" }}>{actionError}</p> : null}
      </div>
      <div className="card stack" style={{ padding: 20 }}>
        <h3 style={{ marginBottom: 0 }}>Expenses</h3>
        {expenses.length === 0 ? (
          <p className="muted">No expenses added yet.</p>
        ) : (
          Object.entries(groupedExpenses).map(([month, monthExpenses]) => (
            <div key={month} className="stack" style={{ gap: 10 }}>
              <h4 style={{ marginBottom: 0, marginTop: 8 }}>{month}</h4>
              {monthExpenses.map((expense) => {
                const rawDate = expense?.createdAt || expense?.date || expense?.created_at || expense?.expense_date || "";
                const displayDate = rawDate ? new Date(rawDate) : null;
                const dateLabel = displayDate && !Number.isNaN(displayDate.getTime())
                  ? displayDate.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
                  : rawDate;
                return (
                  <div key={expense.id} className="card" style={{ padding: 16 }}>
                    <div className="row" style={{ alignItems: "flex-start" }}>
                      <div>
                        <strong>{expense.title || expense.description || "Expense"}</strong>
                        <div className="muted">{dateLabel}</div>
                      </div>
                      <strong>{expense.amount}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
      <button className="fab" type="button" onClick={() => setShowExpenseModal(true)}>+ Add expense</button>
      {showMembersModal ? (
        <div className="members-modal-overlay" role="dialog" aria-modal="true" onClick={() => setShowMembersModal(false)}>
          <div className="card members-modal stack" onClick={(e) => e.stopPropagation()}>
            <div className="row" style={{ alignItems: "flex-start" }}>
              <div>
                <h3 style={{ marginTop: 0 }}>Group members</h3>
                <p className="muted" style={{ marginBottom: 0 }}>See who is already in the group and invite more people by email or name.</p>
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
              <div className="row" style={{ justifyContent: "flex-start", gap: 12, flexWrap: "wrap" }}>
                <button className={`btn ${inviteMode === "email" ? "" : "secondary"}`} type="button" onClick={() => setInviteMode("email")}>
                  Invite by email
                </button>
                <button className={`btn ${inviteMode === "name" ? "" : "secondary"}`} type="button" onClick={() => setInviteMode("name")}>
                  Add by name
                </button>
              </div>
              <form className="stack" onSubmit={addMember}>
                {inviteMode === "email" ? (
                  <input
                    className="field"
                    placeholder="Email"
                    type="email"
                    value={memberForm.email}
                    onChange={(e) => setMemberForm((prev) => ({ ...prev, email: e.target.value }))}
                  />
                ) : (
                  <>
                    <input
                      className="field"
                      placeholder="Name"
                      value={memberForm.name}
                      onChange={(e) => setMemberForm((prev) => ({ ...prev, name: e.target.value }))}
                    />
                    <input
                      className="field"
                      placeholder="Email (optional)"
                      type="email"
                      value={memberForm.email}
                      onChange={(e) => setMemberForm((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </>
                )}
                {memberError ? <p style={{ color: "#fca5a5" }}>{memberError}</p> : null}
                <button className="btn" type="submit">Invite user</button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
      {showExpenseModal ? (
        <div className="members-modal-overlay" role="dialog" aria-modal="true" onClick={() => setShowExpenseModal(false)}>
          <div className="card members-modal stack" onClick={(e) => e.stopPropagation()}>
            <div className="row" style={{ alignItems: "flex-start" }}>
              <div>
                <h3 style={{ marginTop: 0 }}>Add expense</h3>
                <p className="muted" style={{ marginBottom: 0 }}>Add a new expense for this group.</p>
              </div>
              <button className="btn secondary" type="button" onClick={() => setShowExpenseModal(false)}>Close</button>
            </div>
            <form className="stack" onSubmit={submit}>
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
          </div>
        </div>
      ) : null}
      {confirmAction ? (
        <div className="members-modal-overlay" role="dialog" aria-modal="true" onClick={() => setConfirmAction(null)}>
          <div className="card members-modal stack" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>
              {confirmAction === "delete" ? "Delete this group?" : "Leave this group?"}
            </h3>
            <p className="muted" style={{ marginBottom: 0 }}>
              {confirmAction === "delete"
                ? "This cannot be undone. The group and its data will be removed."
                : "You will no longer be a member of this group."}
            </p>
            <div className="row" style={{ justifyContent: "flex-end", gap: 12, flexWrap: "wrap" }}>
              <button className="btn secondary" type="button" onClick={() => setConfirmAction(null)}>
                Cancel
              </button>
              <button className="btn" type="button" onClick={() => runAction(confirmAction)}>
                {confirmAction === "delete" ? "Delete group" : "Leave group"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

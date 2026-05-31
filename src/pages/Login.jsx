import React from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await auth.login(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="app-shell layout" style={{ display: "grid", placeItems: "center" }}>
      <form className="card stack" onSubmit={submit} style={{ width: "min(440px, 100%)", padding: 24 }}>
        <div>
          <h1>Welcome back</h1>
          <p className="muted">Sign in to manage groups, expenses, and settlements.</p>
        </div>
        <input className="field" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="field" placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {error ? <p style={{ color: "#fca5a5" }}>{error}</p> : null}
        <button className="btn" type="submit">Login</button>
        <p className="muted">No account? <Link to="/signup">Create one</Link></p>
      </form>
    </div>
  );
}

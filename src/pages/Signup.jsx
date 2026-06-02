import React from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getApiErrorMessage } from "../api/error";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", password: "" });
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await auth.signup(form);
      auth.logout();
      navigate("/");
    } catch (err) {
      setError(getApiErrorMessage(err, "Signup failed"));
    }
  };

  return (
    <div className="layout" style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
      <form className="card stack" onSubmit={submit} style={{ width: "min(440px, 100%)", padding: 24 }}>
        <h1>Create account</h1>
        <input className="field" placeholder="First Name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
        <input className="field" placeholder="Last Name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
        <input className="field" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="field" placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {error ? <p style={{ color: "#fca5a5" }}>{error}</p> : null}
        <button className="btn" type="submit">Sign up</button>
        <p className="muted">Already have an account? <Link to="/">Login</Link></p>
      </form>
    </div>
  );
}

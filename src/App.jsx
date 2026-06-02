
import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Groups from "./pages/Groups";
import GroupDetails from "./pages/GroupDetails";
import Expenses from "./pages/Expenses";
import { useAuth } from "./context/AuthContext";
import AppShell from "./components/AppShell";

function ProtectedRoute({ children }) {
  const auth = useAuth();
  if (auth?.loading) return <div className="app-shell"><p>Loading...</p></div>;
  if (!auth?.user) return <Navigate to="/" replace />;
  return <AppShell>{children}</AppShell>;
}

export default function App(){
 return <Routes>
  <Route path="/" element={<Login/>}/>
  <Route path="/signup" element={<Signup/>}/>
  <Route path="/dashboard" element={<ProtectedRoute><Dashboard/></ProtectedRoute>}/>
  <Route path="/groups" element={<ProtectedRoute><Groups/></ProtectedRoute>}/>
  <Route path="/groups/:id" element={<ProtectedRoute><GroupDetails/></ProtectedRoute>}/>
  <Route path="/expenses" element={<ProtectedRoute><Expenses/></ProtectedRoute>}/>
 </Routes>
}

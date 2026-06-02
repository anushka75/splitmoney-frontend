import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getMe, loginUser, signupUser } from "../api/services";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const hydrateUser = async (data) => {
    if (data?.user) return data.user;
    try {
      const me = await getMe();
      return me?.user ?? me ?? null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("splitmoney_token");
    if (!token) {
      setLoading(false);
      return;
    }
    getMe()
      .then((me) => setUser(me?.user ?? me ?? null))
      .catch(() => localStorage.removeItem("splitmoney_token"))
      .finally(() => setLoading(false));
  }, []);

  const auth = useMemo(() => ({
    user,
    loading,
    async login(credentials) {
      const data = await loginUser(credentials);
      if (data?.access_token) localStorage.setItem("splitmoney_token", data.access_token);
      const hydrated = await hydrateUser(data);
      setUser(hydrated);
      return data;
    },
    async signup(details) {
      const data = await signupUser(details);
      if (data?.access_token) localStorage.setItem("splitmoney_token", data.access_token);
      setUser(await hydrateUser(data));
      return data;
    },
    logout() {
      localStorage.removeItem("splitmoney_token");
      setUser(null);
    },
  }), [user, loading]);

  return React.createElement(AuthContext.Provider, { value: auth }, children);
}

export function useAuth() {
  return useContext(AuthContext);
}

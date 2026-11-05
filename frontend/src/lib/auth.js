import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, TOKEN_KEY } from "./api";

const AuthContext = createContext(null);
const IDLE_MS = 30 * 60 * 1000;
export const ROLE_RANK = { kontributor: 1, editor: 2, admin: 3 };
export const ROLE_LABEL = { admin: "Administrator", editor: "Editor", kontributor: "Kontributor" };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setReady(true);
      return;
    }
    api.get("/auth/me").then((r) => setUser(r.data)).catch(logout).finally(() => setReady(true));
  }, [logout]);

  useEffect(() => {
    if (!user) return undefined;
    let timer = setTimeout(logout, IDLE_MS);
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(logout, IDLE_MS);
    };
    const evs = ["mousemove", "keydown", "click", "touchstart"];
    evs.forEach((e) => window.addEventListener(e, reset));
    return () => {
      clearTimeout(timer);
      evs.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [user, logout]);

  const login = async (username, password) => {
    const r = await api.post("/auth/login", { username, password });
    localStorage.setItem(TOKEN_KEY, r.data.token);
    setUser(r.data.user);
    return r.data.user;
  };

  const can = (role) => user && ROLE_RANK[user.role] >= ROLE_RANK[role];

  return <AuthContext.Provider value={{ user, setUser, ready, login, logout, can }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

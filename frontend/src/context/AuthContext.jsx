import { createContext, useContext, useState, useEffect } from "react";
import { yiiApi } from "../api/client";

const AuthContext = createContext(null);

function getStoredAuth() {
  try {
    const raw = sessionStorage.getItem("simrs_auth");
    if (!raw) return null;

    const auth = JSON.parse(raw);

    if (Date.now() >= auth.expiresAt) {
      sessionStorage.removeItem("simrs_auth");
      sessionStorage.removeItem("simrs_token");
      return null;
    }

    return auth;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(getStoredAuth);

  useEffect(() => {
    if (!auth) return;

    const remaining = auth.expiresAt - Date.now();

    if (remaining <= 0) {
      sessionStorage.removeItem("simrs_auth");
      sessionStorage.removeItem("simrs_token");
      return;
    }

    const timer = setTimeout(() => {
      sessionStorage.removeItem("simrs_auth");
      sessionStorage.removeItem("simrs_token");
      setAuth(null);
    }, remaining);

    return () => clearTimeout(timer);
  }, [auth]);

  async function login(username, password) {
    const response = await yiiApi.post("/auth/login", {
      username,
      password,
    });

    const result = response.data.data;

    if (!result?.access_token || !result?.user) {
      throw new Error("Respons login tidak valid.");
    }

    const expiresAt = Date.now() + Number(result.expires_in || 3600) * 1000;

    const newAuth = {
      user: result.user,
      expiresAt,
    };

    sessionStorage.setItem("simrs_token", result.access_token);
    sessionStorage.setItem("simrs_auth", JSON.stringify(newAuth));

    setAuth(newAuth);
  }

  function logout() {
    sessionStorage.removeItem("simrs_token");
    sessionStorage.removeItem("simrs_auth");
    setAuth(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user: auth?.user || null,
        isAuthenticated: Boolean(auth),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth harus digunakan dalam AuthProvider.");
  }

  return context;
}

// ============================================================
// Auth Context — Global Authentication State
// ============================================================
// This context provides auth state and actions to the entire app.
// It uses useReducer for predictable state transitions and
// persists the JWT in localStorage so the user stays logged in
// across page refreshes.
//
// KEY JWT HANDLING NOTES:
// - The token is stored in localStorage for simplicity.
//   For production apps handling sensitive data, consider
//   HttpOnly cookies (set by the server) which are immune
//   to XSS attacks since JavaScript cannot read them.
// - We decode the JWT payload (base64) to extract user info
//   without making an extra API call. The signature is still
//   verified by the backend on every protected request.
// ============================================================

import { createContext, useContext, useReducer, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext(null);

// API base URL — in dev, Vite proxy forwards /api to localhost:5000
const API_URL = "/api/auth";

// ── Reducer ────────────────────────────────────────────────
const initialState = {
  token: null,
  user: null,
  isAuthenticated: false,
  loading: true, // true while checking localStorage on mount
};

function authReducer(state, action) {
  switch (action.type) {
    case "LOGIN_SUCCESS":
    case "REGISTER_SUCCESS":
      return {
        ...state,
        token: action.payload.token,
        user: action.payload.user,
        isAuthenticated: true,
        loading: false,
      };
    case "LOGOUT":
      return {
        ...state,
        token: null,
        user: null,
        isAuthenticated: false,
        loading: false,
      };
    case "AUTH_LOADED":
      return {
        ...state,
        token: action.payload.token,
        user: action.payload.user,
        isAuthenticated: true,
        loading: false,
      };
    case "AUTH_ERROR":
      return {
        ...state,
        token: null,
        user: null,
        isAuthenticated: false,
        loading: false,
      };
    default:
      return state;
  }
}

// ── Helper: decode JWT payload ─────────────────────────────
// JWTs are structured as header.payload.signature, each part
// Base64-encoded. We only need the payload (middle part) to
// read user info. This does NOT verify the token — the backend
// does that on every protected request.
function decodeToken(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

// ── Provider Component ─────────────────────────────────────
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // On mount, check if a token exists in localStorage
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = decodeToken(token);
      // Check if token is expired (exp is in seconds, Date.now() in ms)
      if (decoded && decoded.exp * 1000 > Date.now()) {
        dispatch({
          type: "AUTH_LOADED",
          payload: {
            token,
            user: {
              id: decoded.id,
              email: decoded.email,
              username: decoded.username,
              role: decoded.role,
            },
          },
        });
      } else {
        // Token expired or invalid — clean up
        localStorage.removeItem("token");
        dispatch({ type: "AUTH_ERROR" });
      }
    } else {
      dispatch({ type: "AUTH_ERROR" });
    }
  }, []);

  // ── Login ────────────────────────────────────────────────
  const login = async (email, password) => {
    const res = await axios.post(`${API_URL}/login`, { email, password });
    localStorage.setItem("token", res.data.token);
    dispatch({
      type: "LOGIN_SUCCESS",
      payload: { token: res.data.token, user: res.data.user },
    });
    return res.data;
  };

  // ── Register ─────────────────────────────────────────────
  const register = async (username, email, password) => {
    const res = await axios.post(`${API_URL}/register`, {
      username,
      email,
      password,
    });
    localStorage.setItem("token", res.data.token);
    dispatch({
      type: "REGISTER_SUCCESS",
      payload: { token: res.data.token, user: res.data.user },
    });
    return res.data;
  };

  // ── Logout ───────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem("token");
    dispatch({ type: "LOGOUT" });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for consuming auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

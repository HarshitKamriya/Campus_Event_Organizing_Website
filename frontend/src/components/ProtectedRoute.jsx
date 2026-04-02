// ============================================================
// ProtectedRoute — Guards private pages
// ============================================================
// Wraps any route that requires authentication. If the user
// doesn't have a valid token, they're redirected to /login.
// While the auth state is loading (checking localStorage),
// we show nothing to avoid a flash of the login page.
// ============================================================

import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  // Still checking localStorage — don't redirect yet
  if (loading) {
    return (
      <div className="page-container">
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  // Not authenticated — redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated — render the protected content
  return children;
}

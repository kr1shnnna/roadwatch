import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

const Unauthorized = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-rw-background px-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-rw-text">
          Unauthorized
        </h1>

        <p className="mt-2 text-rw-muted">
          You don't have permission to access this page.
        </p>

        <a
          href="/"
          className="mt-6 inline-block rounded-xl bg-rw-primary px-5 py-3 font-semibold text-white transition hover:bg-rw-primary-dark"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
};

// Temporary placeholder until we build the real dashboard.
const CitizenDashboard = () => {
  return (
    <div className="min-h-screen bg-rw-background p-8">
      <h1 className="text-3xl font-bold text-rw-text">
        Citizen Dashboard
      </h1>
    </div>
  );
};

// Temporary placeholder until we build the real dashboard.
const OfficerDashboard = () => {
  return (
    <div className="min-h-screen bg-rw-background p-8">
      <h1 className="text-3xl font-bold text-rw-text">
        Officer Dashboard
      </h1>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public homepage */}
          <Route
            path="/"
            element={<Home />}
          />

          {/* Public authentication pages */}
          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

          {/* Citizen-only route */}
          <Route
            path="/citizen"
            element={
              <ProtectedRoute allowedRoles={["citizen"]}>
                <CitizenDashboard />
              </ProtectedRoute>
            }
          />

          {/* Officer-only route */}
          <Route
            path="/officer"
            element={
              <ProtectedRoute allowedRoles={["officer"]}>
                <OfficerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Unauthorized access */}
          <Route
            path="/unauthorized"
            element={<Unauthorized />}
          />

          {/* Unknown URLs */}
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
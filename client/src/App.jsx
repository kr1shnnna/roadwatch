
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import CitizenLayout from "./layouts/CitizenLayout";
import CitizenDashboard from "./pages/citizen/CitizenDashboard";
import CitizenComingSoon from "./pages/citizen/CitizenComingSoon";
import ReportProblem from "./pages/citizen/ReportProblem";

// Unauthorized access page
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

        <Link
          to="/"
          className="mt-6 inline-block rounded-xl bg-rw-primary px-5 py-3 font-semibold text-white transition hover:bg-rw-primary-dark"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
};

// Temporary officer dashboard
const OfficerDashboard = () => {
  return (
    <div className="min-h-screen bg-rw-background p-8">
      <h1 className="text-3xl font-bold text-rw-text">
        Officer Dashboard
      </h1>

      <p className="mt-2 text-rw-muted">
        The officer workspace will be built in a later phase.
      </p>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ================= PUBLIC ROUTES ================= */}

          <Route path="/" element={<Home />} />

          <Route path="/login" element={<Login />} />

          <Route path="/register" element={<Register />} />

          {/* ================= CITIZEN ROUTES ================= */}

          <Route
            path="/citizen"
            element={
              <ProtectedRoute allowedRoles={["citizen"]}>
                <CitizenLayout />
              </ProtectedRoute>
            }
          >
            {/* /citizen */}
            <Route index element={<CitizenDashboard />} />

            {/* /citizen/reports */}
            <Route
              path="reports"
              element={
                <CitizenComingSoon
                  title="My Reports"
                  description="View your reports, filter them by status, and follow each issue through to resolution."
                />
              }
            />

            {/* /citizen/report */}
            <Route
              path="report"
              element={<ReportProblem />}
            />

            {/* /citizen/notifications */}
            <Route
              path="notifications"
              element={
                <CitizenComingSoon
                  title="Notifications"
                  description="View updates when your reports are assigned, resolved, confirmed, or reopened."
                />
              }
            />

            {/* /citizen/profile */}
            <Route
              path="profile"
              element={
                <CitizenComingSoon
                  title="My Profile"
                  description="Manage your account details and profile settings here."
                />
              }
            />
          </Route>

          {/* ================= OFFICER ROUTE ================= */}

          <Route
            path="/officer"
            element={
              <ProtectedRoute allowedRoles={["officer"]}>
                <OfficerDashboard />
              </ProtectedRoute>
            }
          />

          {/* ================= OTHER ROUTES ================= */}

          <Route
            path="/unauthorized"
            element={<Unauthorized />}
          />

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

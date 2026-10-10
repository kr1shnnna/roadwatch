
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { Wrench } from "lucide-react";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import CitizenLayout from "./layouts/CitizenLayout";
import CitizenDashboard from "./pages/citizen/CitizenDashboard";
import ReportProblem from "./pages/citizen/ReportProblem";
import MyReports from "./pages/citizen/MyReports";
import Notifications from "./pages/citizen/Notifications";
import Profile from "./pages/citizen/Profile";

import OfficerLayout from "./layouts/OfficerLayout";
import OfficerDashboard from "./pages/officer/OfficerDashboard";
import AssignedReports from "./pages/officer/AssignedReports";
import InProgressReports from "./pages/officer/InProgressReports";
import ResolvedReports from "./pages/officer/ResolvedReports";

// Unauthorized access page
const Unauthorized = () => (
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

// Temporary officer pages until their functionality is implemented
const OfficerComingSoon = ({ title, description }) => (
  <div className="rounded-2xl border border-rw-border bg-white px-6 py-14 text-center shadow-sm sm:py-16">
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rw-primary-light text-rw-primary">
      <Wrench size={26} />
    </div>

    <h2 className="mt-5 text-2xl font-bold text-rw-navy">
      {title}
    </h2>

    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-rw-muted">
      {description}
    </p>
  </div>
);

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
            <Route index element={<CitizenDashboard />} />

            <Route
              path="reports"
              element={<MyReports />}
            />

            <Route
              path="report"
              element={<ReportProblem />}
            />

            <Route
              path="notifications"
              element={<Notifications />}
            />

            <Route
              path="profile"
              element={<Profile />}
            />
          </Route>

          {/* ================= OFFICER ROUTES ================= */}

          <Route
            path="/officer"
            element={
              <ProtectedRoute allowedRoles={["officer"]}>
                <OfficerLayout />
              </ProtectedRoute>
            }
          >
            {/* /officer */}
            <Route
              index
              element={<OfficerDashboard />}
            />

            {/* /officer/assignments */}
            <Route
              path="assignments"
              element={
              
                <AssignedReports />
              }
            />

            {/* /officer/in-progress */}
            <Route
              path="in-progress"
              element={
              
                <InProgressReports />
              }
            />

            {/* /officer/resolved */}
            <Route
              path="resolved"
              element={
               
                <ResolvedReports />
              }
            />

            {/* /officer/notifications */}
            <Route
              path="notifications"
              element={
                <OfficerComingSoon
                  title="Notifications"
                  description="Keep track of new assignments and important report updates."
                />
              }
            />

            {/* /officer/profile */}
            <Route
              path="profile"
              element={
                <OfficerComingSoon
                  title="My Profile"
                  description="View your account details and officer information."
                />
              }
            />
          </Route>

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

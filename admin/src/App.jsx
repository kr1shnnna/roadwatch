
import {
  BrowserRouter,
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import { AdminAuthProvider, useAdminAuth } from "./context/AdminAuthContext";
import AdminLayout from "./layouts/AdminLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";
import ReportDetails from "./pages/ReportDetails";
import UnassignedReports from "./pages/UnassignedReports";

const RequireAdmin = () => {
  const { user, loading, isAdmin } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-rw-background px-5">
        <p className="text-sm font-medium text-slate-500">
          Checking administrator session...
        </p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  return <Outlet />;
};

const LoginRoute = () => {
  const { loading, isAdmin } = useAdminAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-rw-background">
        <p className="text-sm text-slate-500">
          Checking administrator session...
        </p>
      </div>
    );
  }

  if (isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Login />;
};

const AdminPlaceholder = ({ title, description }) => (
  <section className="rounded-2xl border border-rw-border bg-white px-6 py-14 text-center shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-widest text-orange-700">
      RoadWatch administration
    </p>

    <h2 className="mt-3 text-xl font-bold text-rw-navy">
      {title}
    </h2>

    <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
      {description}
    </p>

    <Link
      to="/"
      className="mt-6 inline-flex rounded-xl bg-rw-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rw-navy-light"
    >
      Back to dashboard
    </Link>
  </section>
);

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<LoginRoute />} />

    <Route element={<RequireAdmin />}>
      <Route element={<AdminLayout />}>
        <Route index element={<Dashboard />} />

        <Route
          path="reports/unassigned"
          element={
           
            <UnassignedReports />
          }
        />

        <Route
          path="reports/:id"
          element={
           
            <ReportDetails />
          }
        />

        <Route
          path="reports"
          element={
           
            <Reports />
          }
        />

        <Route
          path="officers"
          element={
            <AdminPlaceholder
              title="Officer Management"
              description="Manage officer accounts, department membership, service areas, and account status."
            />
          }
        />

        <Route
          path="departments"
          element={
            <AdminPlaceholder
              title="Department Management"
              description="Review departments, their supported categories, and their active status."
            />
          }
        />

        <Route
          path="service-areas"
          element={
            <AdminPlaceholder
              title="Service Area Management"
              description="Manage service-area records, geographic boundaries, and officer assignments."
            />
          }
        />

        <Route
          path="analytics"
          element={
            <AdminPlaceholder
              title="Analytics"
              description="Review report trends, officer performance, department performance, and service-area workload."
            />
          }
        />

        <Route
          path="audit-logs"
          element={
            <AdminPlaceholder
              title="Audit Logs"
              description="Review administrative actions and recorded operational changes."
            />
          }
        />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Route>
    </Route>
  </Routes>
);

const App = () => (
  <AdminAuthProvider>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </AdminAuthProvider>
);

export default App;


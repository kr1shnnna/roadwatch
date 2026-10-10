
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
import Officers from "./pages/Officers";
import Departments from "./pages/Departments";
import ServiceAreas from "./pages/ServiceAreas";
import Analytics from "./pages/Analytics";
import AuditLogs from "./pages/AuditLogs";

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
          
            <Officers />
          }
        />

        <Route
          path="departments"
          element={
          
            <Departments />
          }
        />

        <Route
          path="service-areas"
          element={
          
            <ServiceAreas />
          }
        />

        <Route
          path="analytics"
          element={
            
            <Analytics />
          }
        />

        <Route
          path="audit-logs"
          element={
           
            <AuditLogs />
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


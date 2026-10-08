import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import { getDashboardPath } from "./utils/redirectByRole";

const Unauthorized = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-rw-background">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-rw-text">
          Unauthorized
        </h1>

        <p className="mt-2 text-rw-muted">
          You don't have permission to access this page.
        </p>
      </div>
    </div>
  );
};

const CitizenDashboard = () => {
  return (
    <div className="min-h-screen bg-rw-background p-8">
      <h1 className="text-3xl font-bold text-rw-text">
        Citizen Dashboard
      </h1>
    </div>
  );
};

const OfficerDashboard = () => {
  return (
    <div className="min-h-screen bg-rw-background p-8">
      <h1 className="text-3xl font-bold text-rw-text">
        Officer Dashboard
      </h1>
    </div>
  );
};

const RootRedirect = () => {
  const token = localStorage.getItem(
    "roadwatch_token"
  );

  const storedUser = localStorage.getItem(
    "roadwatch_user"
  );

  if (!token || !storedUser) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  try {
    const user = JSON.parse(storedUser);

    return (
      <Navigate
        to={getDashboardPath(user.role)}
        replace
      />
    );
  } catch {
    localStorage.removeItem("roadwatch_token");
    localStorage.removeItem("roadwatch_user");

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          <Route
            path="/"
            element={<RootRedirect />}
          />

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

          <Route
            path="/citizen"
            element={
              <ProtectedRoute
                allowedRoles={["citizen"]}
              >
                <CitizenDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/officer"
            element={
              <ProtectedRoute
                allowedRoles={["officer"]}
              >
                <OfficerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/unauthorized"
            element={<Unauthorized />}
          />

          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

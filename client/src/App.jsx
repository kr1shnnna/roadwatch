import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { getDashboardPath } from "./utils/redirectByRole";

const Login = () => (
  <div className="min-h-screen flex items-center justify-center">
    Login Page
  </div>
);

const Unauthorized = () => (
  <div className="min-h-screen flex items-center justify-center">
    <h1 className="text-2xl font-bold">
      Unauthorized
    </h1>
  </div>
);

const CitizenDashboard = () => (
  <div className="p-8">
    Citizen Dashboard
  </div>
);

const OfficerDashboard = () => (
  <div className="p-8">
    Officer Dashboard
  </div>
);

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
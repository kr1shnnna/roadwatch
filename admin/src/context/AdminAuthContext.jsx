
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../services/api";

const AdminAuthContext = createContext(null);

const TOKEN_KEY = "token";
const USER_KEY = "roadwatch_user";

const ADMIN_ROLES = ["authority_admin", "super_admin"];

const readStoredUser = () => {
  try {
    const storedUser = localStorage.getItem(USER_KEY);
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
};

export const AdminAuthProvider = ({ children }) => {
  const [token, setToken] = useState(() =>
    localStorage.getItem(TOKEN_KEY),
  );

  const [user, setUser] = useState(readStoredUser);

  const [loading, setLoading] = useState(
    () => Boolean(localStorage.getItem(TOKEN_KEY)),
  );

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);

      if (!storedToken) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me");
        const currentUser = response.data?.user;

        if (!currentUser) {
          throw new Error("Account details were not returned.");
        }

        if (
          !ADMIN_ROLES.includes(currentUser.role) ||
          currentUser.isActive === false
        ) {
          clearSession();
          return;
        }

        if (!cancelled) {
          setToken(storedToken);
          setUser(currentUser);
          localStorage.setItem(
            USER_KEY,
            JSON.stringify(currentUser),
          );
        }
      } catch (error) {
        if (
          error.response?.status === 401 ||
          error.response?.status === 403
        ) {
          clearSession();
        } else if (!cancelled) {
          // Keep the saved identity while the API is unreachable.
          // Protected pages will still show their own API errors.
          setUser(readStoredUser());
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  const login = async (email, password) => {
    const response = await api.post("/auth/login", {
      email: email.trim().toLowerCase(),
      password,
    });

    const { token: receivedToken, user: loggedInUser } =
      response.data || {};

    if (!receivedToken || !loggedInUser) {
      throw new Error("The server returned an incomplete login response.");
    }

    if (!ADMIN_ROLES.includes(loggedInUser.role)) {
      throw new Error(
        "This account does not have administrator access.",
      );
    }

    localStorage.setItem(TOKEN_KEY, receivedToken);
    localStorage.setItem(
      USER_KEY,
      JSON.stringify(loggedInUser),
    );

    setToken(receivedToken);
    setUser(loggedInUser);

    return loggedInUser;
  };

  const logout = () => {
    clearSession();
  };

  const updateUser = (updatedUser) => {
    setUser((currentUser) => {
      const nextUser = {
        ...currentUser,
        ...updatedUser,
      };

      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));

      return nextUser;
    });
  };

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        updateUser,
        isAdmin: ADMIN_ROLES.includes(user?.role),
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);

  if (!context) {
    throw new Error(
      "useAdminAuth must be used inside AdminAuthProvider.",
    );
  }

  return context;
};


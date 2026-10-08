import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(
      "roadwatch_token"
    );

    const storedUser = localStorage.getItem(
      "roadwatch_user"
    );

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error(
          "Failed to restore user session:",
          error
        );

        localStorage.removeItem(
          "roadwatch_token"
        );

        localStorage.removeItem(
          "roadwatch_user"
        );
      }
    }

    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await api.post(
      "/auth/login",
      {
        email,
        password,
      }
    );

    const { token, user } = response.data;

    localStorage.setItem(
      "roadwatch_token",
      token
    );

    localStorage.setItem(
      "roadwatch_user",
      JSON.stringify(user)
    );

    setUser(user);

    return response.data;
  };

  const logout = () => {
    localStorage.removeItem(
      "roadwatch_token"
    );

    localStorage.removeItem(
      "roadwatch_user"
    );

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
};

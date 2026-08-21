import { createContext, useContext, useState, useEffect } from "react";
import { getRedirectPath, isAdmin, isSurveyStaff, isTechnicianStaff, isCustomer } from "../util/roleUtils";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    const handleAuthLogout = () => {
      setUser(null);
    };

    window.addEventListener("auth:logout", handleAuthLogout);
    return () => {
      window.removeEventListener("auth:logout", handleAuthLogout);
    };
  }, []);

  const login = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    if (userData.token) {
      localStorage.setItem("token", userData.token);
    }
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
  };

  const updateUser = (newUserData) => {
    const updated = { ...user, ...newUserData };
    localStorage.setItem("user", JSON.stringify(updated));
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        role: user?.role,
        isAdmin: isAdmin(user),
        isSurveyStaff: isSurveyStaff(user),
        isTechnicianStaff: isTechnicianStaff(user),
        isCustomer: isCustomer(user),
        getRedirectPath: () => getRedirectPath(user),
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

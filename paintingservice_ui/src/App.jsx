import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";

import AdminRoutes from "./routes/AdminRoutes";
import SurveyRoutes from "./routes/SurveyRoutes";
import TechnicianRoutes from "./routes/TechnicianRoutes";
import CustomerRoutes from "./routes/CustomerRoutes";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider, useToast } from "./context/ToastContext";

function AppRoutes() {
  const { user, login, logout, getRedirectPath, isAdmin, isSurveyStaff, isTechnicianStaff, isCustomer } = useAuth();
  const { showToast } = useToast();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to={getRedirectPath()} replace />
          ) : (
            <Login onLogin={login} showToast={showToast} />
          )
        }
      />

      <Route
        path="/register"
        element={
          user ? (
            <Navigate to={getRedirectPath()} replace />
          ) : (
            <Register showToast={showToast} />
          )
        }
      />

      <Route path="/" element={<Navigate to="/home" replace />} />

      <Route
        path="/home"
        element={<Home user={user} onLogout={logout} showToast={showToast} />}
      />

      <Route
        path="/customer/*"
        element={
          user && isCustomer ? (
            <CustomerRoutes
              user={user}
              onLogout={logout}
              showToast={showToast}
            />
          ) : user ? (
            <Navigate to={getRedirectPath()} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/admin/*"
        element={
          user ? (
            isAdmin ? (
              <AdminRoutes
                user={user}
                onLogout={logout}
                showToast={showToast}
              />
            ) : (
              <Navigate to={getRedirectPath()} replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/staff/survey/*"
        element={
          user ? (
            isSurveyStaff ? (
              <SurveyRoutes
                user={user}
                onLogout={logout}
                showToast={showToast}
              />
            ) : (
              <Navigate to={getRedirectPath()} replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/staff/technician/*"
        element={
          user ? (
            isTechnicianStaff ? (
              <TechnicianRoutes
                user={user}
                onLogout={logout}
                showToast={showToast}
              />
            ) : (
              <Navigate to={getRedirectPath()} replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;

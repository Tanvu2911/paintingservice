import { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import BookingDetail from "./pages/customer/BookingDetail";
import VNPayCallback from "./pages/customer/VNPayCallback";
import Toast from "./components/Toast";

import AdminRoutes from "./routes/AdminRoutes";
import SurveyRoutes from "./routes/SurveyRoutes";
import TechnicianRoutes from "./routes/TechnicianRoutes";
import CustomerRoutes from "./routes/CustomerRoutes";
import {
  getRedirectPath,
  isAdmin,
  isSurveyStaff,
  isTechnicianStaff,
  isCustomer,
} from "./util/roleUtils";

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
  };

  const closeToast = () => {
    setToast((prev) => ({ ...prev, show: false }));
  };

  const handleLogin = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <Router>
      {toast.show && (
        <Toast message={toast.message} type={toast.type} onClose={closeToast} />
      )}

      <Routes>
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to={getRedirectPath(user)} replace />
            ) : (
              <Login onLogin={handleLogin} showToast={showToast} />
            )
          }
        />

        <Route
          path="/register"
          element={
            user ? (
              <Navigate to={getRedirectPath(user)} replace />
            ) : (
              <Register showToast={showToast} />
            )
          }
        />

        <Route path="/" element={<Navigate to="/home" replace />} />

        <Route
          path="/home"
          element={
            <Home user={user} onLogout={handleLogout} showToast={showToast} />
          }
        />

        <Route
          path="/customer/payment-callback"
          element={<VNPayCallback />}
        />

        <Route
          path="/customer/bookings/:id"
          element={
            user && isCustomer(user) ? (
              <BookingDetail user={user} showToast={showToast} />
            ) : user ? (
              <Navigate to={getRedirectPath(user)} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/customer/*"
          element={
            user && isCustomer(user) ? (
              <CustomerRoutes
                user={user}
                onLogout={handleLogout}
                showToast={showToast}
              />
            ) : user ? (
              <Navigate to={getRedirectPath(user)} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/admin/*"
          element={
            user ? (
              isAdmin(user) ? (
                <AdminRoutes
                  user={user}
                  onLogout={handleLogout}
                  showToast={showToast}
                />
              ) : (
                <Navigate to={getRedirectPath(user)} replace />
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
              isSurveyStaff(user) ? (
                <SurveyRoutes
                  user={user}
                  onLogout={handleLogout}
                  showToast={showToast}
                />
              ) : (
                <Navigate to={getRedirectPath(user)} replace />
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
              isTechnicianStaff(user) ? (
                <TechnicianRoutes
                  user={user}
                  onLogout={handleLogout}
                  showToast={showToast}
                />
              ) : (
                <Navigate to={getRedirectPath(user)} replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import PageLoadingFallback from "./components/common/PageLoadingFallback";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider, useToast } from "./context/ToastContext";

// Lazy-loaded routes và pages chính
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Home = lazy(() => import("./pages/Home"));

const AdminRoutes = lazy(() => import("./routes/AdminRoutes"));
const SurveyRoutes = lazy(() => import("./routes/SurveyRoutes"));
const TechnicianRoutes = lazy(() => import("./routes/TechnicianRoutes"));
const CustomerRoutes = lazy(() => import("./routes/CustomerRoutes"));
const VNPayCallback = lazy(() => import("./pages/customer/VNPayCallback"));

function AppRoutes() {
  const { user, login, logout, getRedirectPath, isAdmin, isSurveyStaff, isTechnicianStaff, isCustomer } = useAuth();
  const { showToast } = useToast();

  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <Routes>
      {/* Route phản hồi thanh toán VNPay độc lập - công khai, không bị chặn bởi Auth/Role guard */}
      <Route path="/customer/payment-callback" element={<VNPayCallback />} />
      <Route path="/payment-callback" element={<VNPayCallback />} />

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
    </Suspense>
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

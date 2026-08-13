// import { useState } from "react";
// import {
//   BrowserRouter as Router,
//   Routes,
//   Route,
//   Navigate,
// } from "react-router-dom";

// import Login from "./pages/Login";
// import Register from "./pages/Register";
// import Home from "./pages/Home";
// import Toast from "./components/Toast";

// // Import các file Router điều hướng
// import AdminRoutes from "./routes/AdminRoutes";
// import SurveyRoutes from "./routes/SurveyRoutes";
// import TechnicianRoutes from "./routes/TechnicianRoutes";

// function App() {
//   const [user, setUser] = useState(() => {
//     const savedUser = localStorage.getItem("user");
//     return savedUser ? JSON.parse(savedUser) : null;
//   });

//   const [toast, setToast] = useState({
//     show: false,
//     message: "",
//     type: "success",
//   });

//   const showToast = (message, type = "success") => {
//     setToast({
//       show: true,
//       message,
//       type,
//     });
//   };

//   const closeToast = () => {
//     setToast((prev) => ({
//       ...prev,
//       show: false,
//     }));
//   };

//   const handleLogin = (userData) => {
//     localStorage.setItem("user", JSON.stringify(userData));
//     setUser(userData);
//   };

//   const handleLogout = () => {
//     localStorage.removeItem("user");
//     localStorage.removeItem("token");
//     setUser(null);
//   };

//   // Helper lấy StaffType của user
//   const getStaffType = (currentUser) => {
//     const rawStaffType =
//       currentUser?.staffType ||
//       currentUser?.staffProfile?.staffType ||
//       currentUser?.user?.staffType ||
//       currentUser?.user?.staffProfile?.staffType;

//     return (typeof rawStaffType === "object" ? rawStaffType?.name : rawStaffType)?.toUpperCase();
//   };

//   // Điều hướng thông minh dựa vào cả Role và StaffType
//   const getRedirectPath = (currentUser) => {
//     if (!currentUser) return "/home";

//     const rawRole = currentUser?.role;
//     const role = (typeof rawRole === "object" ? rawRole?.name : rawRole)?.toUpperCase();

//     if (role === "ROLE_ADMIN" || role === "ADMIN") {
//       return "/admin/dashboard";
//     }

//     if (role === "ROLE_STAFF" || role === "STAFF" || role === "NHANVIEN") {
//       const staffType = getStaffType(currentUser);

//       if (staffType === "WORKER" || staffType === "TECHNICIAN") {
//         return "/staff/technician/dashboard";
//       }
//       return "/staff/survey/dashboard"; // Mặc định là Khảo sát viên (SUPERVISOR)
//     }

//     return "/home";
//   };

//   // Kiểm tra quyền Admin
//   const isAdmin = () => {
//     const role = user?.role?.toUpperCase();
//     return role === "ROLE_ADMIN" || role === "ADMIN";
//   };

//   // Kiểm tra quyền Staff chung
//   const isStaff = () => {
//     const role = user?.role?.toUpperCase();
//     return (
//       role === "ROLE_STAFF" ||
//       role === "STAFF" ||
//       role === "NHANVIEN"
//     );
//   };

//   // Kiểm tra riêng quyền Khảo sát (SUPERVISOR)
//   const isSurveyStaff = () => {
//     if (!isStaff()) return false;
//     const staffType = getStaffType(user);
//     return staffType !== "WORKER" && staffType !== "TECHNICIAN"; // Nếu không phải thợ thì cho vào survey
//   };

//   // Kiểm tra riêng quyền Thợ thi công (WORKER / TECHNICIAN)
//   const isTechnicianStaff = () => {
//     if (!isStaff()) return false;
//     const staffType = getStaffType(user);
//     return staffType === "WORKER" || staffType === "TECHNICIAN";
//   };

//   return (
//     <Router>
//       {toast.show && (
//         <Toast
//           message={toast.message}
//           type={toast.type}
//           onClose={closeToast}
//         />
//       )}

//       <Routes>
//         {/* ================= PUBLIC ROUTES ================= */}

//         <Route
//           path="/login"
//           element={
//             user ? (
//               <Navigate
//                 to={getRedirectPath(user)}
//                 replace
//               />
//             ) : (
//               <Login onLogin={handleLogin} />
//             )
//           }
//         />

//         <Route
//           path="/register"
//           element={
//             user ? (
//               <Navigate
//                 to={getRedirectPath(user)}
//                 replace
//               />
//             ) : (
//               <Register />
//             )
//           }
//         />

//         {/* ================= ROOT ================= */}

//         <Route
//           path="/"
//           element={
//             user ? (
//               <Navigate
//                 to={getRedirectPath(user)}
//                 replace
//               />
//             ) : (
//               <Navigate to="/login" replace />
//             )
//           }
//         />

//         {/* ================= HOME ================= */}

//         <Route
//           path="/home"
//           element={
//             user ? (
//               <Home
//                 user={user}
//                 onLogout={handleLogout}
//                 showToast={showToast}
//               />
//             ) : (
//               <Navigate to="/login" replace />
//             )
//           }
//         />

//         {/* ================= ADMIN ================= */}

//         <Route
//           path="/admin/*"
//           element={
//             user ? (
//               isAdmin() ? (
//                 <AdminRoutes
//                   user={user}
//                   onLogout={handleLogout}
//                   showToast={showToast}
//                 />
//               ) : (
//                 <Navigate
//                   to={getRedirectPath(user)}
//                   replace
//                 />
//               )
//             ) : (
//               <Navigate to="/login" replace />
//             )
//           }
//         />

//         {/* ================= STAFF / SURVEY (SUPERVISOR) ================= */}

//         <Route
//           path="/staff/survey/*"
//           element={
//             user ? (
//               isSurveyStaff() ? (
//                 <SurveyRoutes
//                   user={user}
//                   onLogout={handleLogout}
//                   showToast={showToast}
//                 />
//               ) : (
//                 <Navigate
//                   to={getRedirectPath(user)}
//                   replace
//                 />
//               )
//             ) : (
//               <Navigate to="/login" replace />
//             )
//           }
//         />

//         {/* ================= STAFF / TECHNICIAN (WORKER) ================= */}

//         <Route
//           path="/staff/technician/*"
//           element={
//             user ? (
//               isTechnicianStaff() ? (
//                 <TechnicianRoutes
//                   user={user}
//                   onLogout={handleLogout}
//                   showToast={showToast}
//                 />
//               ) : (
//                 <Navigate
//                   to={getRedirectPath(user)}
//                   replace
//                 />
//               )
//             ) : (
//               <Navigate to="/login" replace />
//             )
//           }
//         />

//         {/* ================= NOT FOUND ================= */}

//         <Route
//           path="*"
//           element={<Navigate to="/" replace />}
//         />
//       </Routes>
//     </Router>
//   );
// }

// export default App;


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
import Toast from "./components/Toast";

import AdminRoutes from "./routes/AdminRoutes";
import SurveyRoutes from "./routes/SurveyRoutes";
import TechnicianRoutes from "./routes/TechnicianRoutes";

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
    setToast({
      show: true,
      message,
      type,
    });
  };

  const closeToast = () => {
    setToast((prev) => ({
      ...prev,
      show: false,
    }));
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

  const getStaffType = (currentUser) => {
    const rawStaffType =
      currentUser?.staffType ||
      currentUser?.staffProfile?.staffType ||
      currentUser?.user?.staffType ||
      currentUser?.user?.staffProfile?.staffType;

    return (
      typeof rawStaffType === "object" ? rawStaffType?.name : rawStaffType
    )?.toUpperCase();
  };

  const getRedirectPath = (currentUser) => {
    if (!currentUser) return "/home";

    const rawRole = currentUser?.role;
    const role = (
      typeof rawRole === "object" ? rawRole?.name : rawRole
    )?.toUpperCase();

    if (role === "ROLE_ADMIN" || role === "ADMIN") {
      return "/admin/dashboard";
    }

    if (role === "ROLE_STAFF" || role === "STAFF" || role === "NHANVIEN") {
      const staffType = getStaffType(currentUser);

      if (staffType === "WORKER" || staffType === "TECHNICIAN") {
        return "/staff/technician/dashboard";
      }
      return "/staff/survey/dashboard";
    }

    return "/home";
  };

  const isAdmin = () => {
    const role =
      typeof user?.role === "object"
        ? user?.role?.name?.toUpperCase()
        : user?.role?.toUpperCase();
    return role === "ROLE_ADMIN" || role === "ADMIN";
  };

  const isStaff = () => {
    const role =
      typeof user?.role === "object"
        ? user?.role?.name?.toUpperCase()
        : user?.role?.toUpperCase();
    return (
      role === "ROLE_STAFF" || role === "STAFF" || role === "NHANVIEN"
    );
  };

  const isSurveyStaff = () => {
    if (!isStaff()) return false;
    const staffType = getStaffType(user);
    return staffType !== "WORKER" && staffType !== "TECHNICIAN";
  };

  const isTechnicianStaff = () => {
    if (!isStaff()) return false;
    const staffType = getStaffType(user);
    return staffType === "WORKER" || staffType === "TECHNICIAN";
  };

  return (
    <Router>
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}

      <Routes>
        {/* ================= PUBLIC ROUTES ================= */}

        <Route
          path="/login"
          element={
            user ? (
              <Navigate to={getRedirectPath(user)} replace />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />

        <Route
          path="/register"
          element={
            user ? (
              <Navigate to={getRedirectPath(user)} replace />
            ) : (
              <Register />
            )
          }
        />

        {/* ================= ROOT ================= */}

        <Route
          path="/"
          element={
            user ? (
              <Navigate to={getRedirectPath(user)} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* ================= HOME ================= */}

        <Route
          path="/home"
          element={
            user ? (
              <Home
                user={user}
                onLogout={handleLogout}
                showToast={showToast}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* ================= CUSTOMER - CHI TIẾT ĐƠN ================= */}

        <Route
          path="/customer/bookings/:id"
          element={
            user ? (
              <BookingDetail user={user} showToast={showToast} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* ================= ADMIN ================= */}

        <Route
          path="/admin/*"
          element={
            user ? (
              isAdmin() ? (
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

        {/* ================= STAFF / SURVEY ================= */}

        <Route
          path="/staff/survey/*"
          element={
            user ? (
              isSurveyStaff() ? (
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

        {/* ================= STAFF / TECHNICIAN ================= */}

        <Route
          path="/staff/technician/*"
          element={
            user ? (
              isTechnicianStaff() ? (
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

        {/* ================= NOT FOUND ================= */}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AxiosConfig from "../util/AxiosConfig";

import HomeNavbar from "../components/home/HomeNavbar";
import ConfirmDialog from "../components/common/ConfirmDialog";
import HeroSection from "../components/home/HeroSection";
import ServicesSection from "../components/home/ServicesSection";
import WorkflowSection from "../components/home/WorkflowSection";
import TechnicianSection from "../components/home/TechnicianSection";
import CommitmentsSection from "../components/home/CommitmentsSection";
import TestimonialsSection from "../components/home/TestimonialsSection";
import BrandPartnersSection from "../components/home/BrandPartnersSection";
import HomeFooter from "../components/home/HomeFooter";

export default function Home({ user, onLogout, showToast }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [technicians, setTechnicians] = useState([]);
  const [loadingTechnicians, setLoadingTechnicians] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const confirmLogout = () => {
    onLogout();
    showToast?.("Đăng xuất thành công!", "success");
    navigate("/login");
  };

  // Tải danh sách dịch vụ và đội thợ từ backend API
  useEffect(() => {
    setLoadingServices(true);
    AxiosConfig.get("/services")
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setServices(res.data);
        }
      })
      .catch((err) => {
        console.error("Lỗi khi tải dịch vụ:", err);
      })
      .finally(() => {
        setLoadingServices(false);
      });

    setLoadingTechnicians(true);
    AxiosConfig.get("/staff?staffType=WORKER")
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        setTechnicians(list);
      })
      .catch((err) => {
        console.error("Lỗi khi tải thợ thi công:", err);
      })
      .finally(() => {
        setLoadingTechnicians(false);
      });

    if (user) {
      AxiosConfig.get("/notifications/me")
        .then((res) => setNotifications(Array.isArray(res.data) ? res.data : []))
        .catch(() => { });
    }
  }, [user]);

  const handleMarkRead = async () => {
    if (notifications.some((n) => !n.isRead)) {
      try {
        await AxiosConfig.put("/notifications/me/read");
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleMarkSingleRead = async (id) => {
    try {
      await AxiosConfig.put(`/notifications/me/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAll = async () => {
    if (!notifications.length) return;
    if (!window.confirm("Bạn có chắc chắn muốn xóa tất cả thông báo?")) return;
    try {
      await AxiosConfig.delete("/notifications/me");
      setNotifications([]);
      showToast?.("Đã xóa tất cả thông báo");
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteOne = async (id) => {
    try {
      await AxiosConfig.delete(`/notifications/me/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  // Chuyển hướng khi bấm chọn dịch vụ ngoài Home
  const handleSelectService = (srv) => {
    if (user) {
      navigate("/customer/booking", {
        state: {
          serviceId: srv.id,
          serviceName: srv.name,
        },
      });
    } else {
      navigate("/login", {
        state: {
          redirectTo: "/customer/booking",
          serviceId: srv.id,
          serviceName: srv.name,
        },
      });
    }
  };

  const handleBookingCTA = () => {
    if (user) {
      navigate("/customer/booking");
    } else {
      navigate("/login", {
        state: { redirectTo: "/customer/booking" },
      });
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 antialiased font-sans">
      {/* 1. Navbar */}
      <HomeNavbar
        user={user}
        onLogout={() => setShowLogoutConfirm(true)}
        notifications={notifications}
        onMarkRead={handleMarkRead}
        onMarkAllRead={handleMarkRead}
        onMarkSingleRead={handleMarkSingleRead}
        onDeleteAll={handleDeleteAll}
        onDeleteOne={handleDeleteOne}
        onBookingCTA={handleBookingCTA}
      />

      {/* 2. Hero Section */}
      <HeroSection onBookingCTA={handleBookingCTA} />

      {/* 3. Danh sách dịch vụ */}
      <ServicesSection
        services={services}
        loadingServices={loadingServices}
        onSelectService={handleSelectService}
      />

      {/* 4. Quy trình làm việc 4 bước */}
      <WorkflowSection onBookingCTA={handleBookingCTA} />

      {/* 4.1 Đội ngũ thợ lành nghề */}
      <TechnicianSection
        technicians={technicians}
        loading={loadingTechnicians}
      />

      {/* 5. Cam kết vàng */}
      <CommitmentsSection onBookingCTA={handleBookingCTA} />

      {/* 6. Đánh giá khách hàng */}
      <TestimonialsSection />

      {/* 7. Hãng sơn đối tác */}
      <BrandPartnersSection />

      {/* 8. Footer */}
      <HomeFooter />

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
        title="Đăng xuất"
        message="Bạn có chắc muốn đăng xuất khỏi hệ thống?"
        confirmColor="bg-emerald-600 hover:bg-emerald-700"
      />
    </div>
  );
}
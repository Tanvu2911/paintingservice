import { useState, useEffect } from "react";
import { Star, MessageSquareQuote, CheckCircle, Clock } from "lucide-react";
import AxiosConfig from "../../util/AxiosConfig";

// Fallback mẫu khi cơ sở dữ liệu chưa có bài đánh giá nào
const DEFAULT_TESTIMONIALS = [
  {
    id: "f1",
    customerUsername: "Anh Hoàng Minh",
    rating: 5,
    comment:
      "Rất ấn tượng với sự chuyên nghiệp của đội ngũ. Che chắn bàn ghế rất kỹ càng, thi công xong dọn dẹp sạch bóng. Màu sơn chuẩn như bản thiết kế 3D.",
    serviceName: "Sơn cải tạo căn hộ 95m²",
    createdAt: "2026-08-15T10:30:00",
  },
  {
    id: "f2",
    customerUsername: "Chị Thu Thảo",
    rating: 5,
    comment:
      "Quy trình báo giá và hợp đồng rất rõ ràng, không có chuyện phát sinh tiền vật tư. Có bảo hành điện tử chính hãng nên tôi rất an tâm.",
    serviceName: "Sơn nhà phố trọn gói",
    createdAt: "2026-08-10T14:20:00",
  },
  {
    id: "f3",
    customerUsername: "Anh Quốc Bảo",
    rating: 5,
    comment:
      "Đội thợ làm việc có tâm, tỉ mỉ từng góc tường và hỗ trợ làm cả ban đêm để kịp tiến độ khai trương. Rất đáng tiền và sẽ tiếp tục ủng hộ!",
    serviceName: "Sơn hiệu ứng bê tông & chống thấm",
    createdAt: "2026-08-05T09:15:00",
  },
];

// Hàm tạo màu avatar ngẫu nhiên theo tên
const AVATAR_GRADIENTS = [
  "from-emerald-500 to-teal-600",
  "from-blue-500 to-indigo-600",
  "from-amber-500 to-orange-600",
  "from-purple-500 to-pink-600",
  "from-rose-500 to-red-600",
];

function getAvatarColor(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index];
}

function getInitials(name = "K") {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export default function TestimonialsSection() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    AxiosConfig.get("/reviews")
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          // Lọc các đánh giá hợp lệ, sắp xếp theo rating cao nhất (5 sao) rồi đến ngày mới nhất
          const validReviews = res.data
            .filter((r) => r.rating && r.comment && r.comment.trim() !== "")
            .sort((a, b) => {
              if ((b.rating || 0) !== (a.rating || 0)) {
                return (b.rating || 0) - (a.rating || 0);
              }
              return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            })
            .slice(0, 3); // Lấy đúng 3 đánh giá tốt nhất

          if (validReviews.length > 0) {
            setReviews(validReviews);
          } else {
            setReviews(DEFAULT_TESTIMONIALS.slice(0, 3));
          }
        } else {
          setReviews(DEFAULT_TESTIMONIALS.slice(0, 3));
        }
      })
      .catch((err) => {
        console.warn("Không thể tải đánh giá từ API, sử dụng dữ liệu mặc định:", err);
        setReviews(DEFAULT_TESTIMONIALS);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <section id="testimonials" className="bg-white py-20 px-4 sm:px-6 lg:px-8 border-y border-slate-200">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Khách Hàng Nói Gì
          </span>
          <h3 className="text-3xl font-black text-slate-900 tracking-tight mt-3">
            Đánh Giá &amp; Cảm Nhận Thực Tế
          </h3>
          <p className="text-sm text-slate-500 mt-2">
            Tổng hợp phản hồi chân thực từ những khách hàng đã nghiệm thu công trình sơn sửa nhà.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-slate-50 rounded-3xl p-6 border border-slate-200 animate-pulse space-y-4"
              >
                <div className="h-4 bg-amber-100 rounded w-1/3" />
                <div className="h-4 bg-slate-200 rounded w-full" />
                <div className="h-4 bg-slate-200 rounded w-5/6" />
                <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                  <div className="w-10 h-10 bg-slate-200 rounded-full" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 bg-slate-200 rounded w-1/2" />
                    <div className="h-2.5 bg-slate-100 rounded w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((r) => {
              const customerName = r.customerUsername || "Khách hàng";
              const avatarGradient = getAvatarColor(customerName);
              const initials = getInitials(customerName);
              const displayDate = formatDate(r.createdAt);

              return (
                <div
                  key={r.id}
                  className="bg-slate-50/90 rounded-3xl p-6 border border-slate-200 flex flex-col justify-between hover:shadow-md hover:border-emerald-300 transition-all duration-200 relative group"
                >
                  <MessageSquareQuote className="w-8 h-8 text-emerald-100 absolute top-5 right-5 -z-0 pointer-events-none group-hover:text-emerald-200 transition-colors" />

                  <div className="relative z-10">
                    {/* Stars */}
                    <div className="flex items-center gap-1 text-amber-400 text-sm mb-3">
                      {[...Array(r.rating || 5)].map((_, idx) => (
                        <Star key={idx} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                      <span className="text-xs font-bold text-slate-700 ml-1.5">
                        {r.rating || 5}.0
                      </span>
                    </div>

                    {/* Comment */}
                    <p className="text-xs text-slate-700 leading-relaxed italic mb-6 line-clamp-4">
                      &ldquo;{r.comment}&rdquo;
                    </p>
                  </div>

                  {/* Customer Info */}
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-200/80 relative z-10">
                    <div
                      className={`w-10 h-10 rounded-full bg-gradient-to-tr ${avatarGradient} text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0`}
                    >
                      {initials}
                    </div>
                    <div className="overflow-hidden flex-1">
                      <div className="flex items-center gap-1.5">
                        <h5 className="font-bold text-slate-900 text-xs truncate">
                          {customerName}
                        </h5>
                        <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" title="Đã nghiệm thu công trình" />
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded truncate max-w-[140px]">
                          {r.serviceName || "Dịch vụ sơn nhà"}
                        </span>
                        {displayDate && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-0.5 shrink-0">
                            <Clock className="w-2.5 h-2.5" />
                            {displayDate}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

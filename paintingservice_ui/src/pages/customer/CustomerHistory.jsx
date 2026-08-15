import { useOutletContext } from "react-router-dom";
import BookingHistoryPage from "../../components/history/BookingHistoryPage";

export default function CustomerHistory() {
  const { showToast } = useOutletContext();

  return (
    <BookingHistoryPage
      role="customer"
      title="Lịch sử yêu cầu"
      subtitle="Theo dõi các yêu cầu đã hoàn thành"
      showToast={showToast}
      detailPath="/customer/bookings/:id"
      emptyMessage="Bạn chưa có yêu cầu nào đã hoàn thành."
      statusFilter={["COMPLETED"]} // Thuộc tính này giờ đã hoạt động!
    />
  );
}
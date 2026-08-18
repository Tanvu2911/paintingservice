import { useOutletContext } from "react-router-dom";
import BookingHistoryPage from "../../components/history/BookingHistoryPage";

export default function CustomerHistory() {
  const { showToast } = useOutletContext();

  return (
    <BookingHistoryPage
      role="customer"
      title="Lịch sử đơn đã hoàn thành"
      subtitle="Danh sách các công trình sơn nhà đã hoàn tất thi công và nghiệm thu"
      showToast={showToast}
      detailPath="/customer/bookings/:id"
      emptyMessage="Bạn chưa có công trình nào đã hoàn thành."
      statusFilter={["COMPLETED"]}
    />
  );
}
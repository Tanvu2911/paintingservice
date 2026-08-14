import { useOutletContext } from "react-router-dom";
import BookingHistoryPage from "../../../components/history/BookingHistoryPage";

export default function TechnicianHistory() {
  const { showToast } = useOutletContext();
  return (
    <BookingHistoryPage
      role="technician"
      title="Lịch sử Thi công"
      subtitle="Danh sách công trình đã và đang thực hiện"
      showToast={showToast}
      showCustomerFilter
      emptyMessage="Chưa có lịch sử thi công nào."
    />
  );
}

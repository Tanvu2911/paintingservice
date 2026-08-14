import { useOutletContext } from "react-router-dom";
import BookingHistoryPage from "../../../components/history/BookingHistoryPage";

export default function SurveyHistory() {
  const { showToast } = useOutletContext();
  return (
    <BookingHistoryPage
      role="survey"
      title="Lịch sử Khảo sát"
      subtitle="Lọc theo thời gian, trạng thái, kỹ thuật viên và khách hàng"
      showToast={showToast}
      showTechnicianFilter
      showCustomerFilter
      emptyMessage="Chưa có lịch sử khảo sát nào."
    />
  );
}

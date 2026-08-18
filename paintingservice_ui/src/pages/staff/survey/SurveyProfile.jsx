import { useOutletContext } from "react-router-dom";
import ProfileForm from "../../../components/common/ProfileForm";

export default function SurveyProfile() {
  const { user, showToast } = useOutletContext();
  return <ProfileForm user={user} showToast={showToast} roleLabel="Nhân viên giám sát / Khảo sát" isStaff={true} />;
}

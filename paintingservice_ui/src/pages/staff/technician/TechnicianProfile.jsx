import { useOutletContext } from "react-router-dom";
import ProfileForm from "../../../components/common/ProfileForm";

export default function TechnicianProfile() {
  const { user, showToast } = useOutletContext();
  return (
    <ProfileForm user={user} showToast={showToast} roleLabel="Kỹ thuật viên thi công" isStaff={true} />
  );
}

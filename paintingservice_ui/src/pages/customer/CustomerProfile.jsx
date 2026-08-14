import { useOutletContext } from "react-router-dom";
import ProfileForm from "../../components/common/ProfileForm";

export default function CustomerProfile() {
  const { user, showToast } = useOutletContext();
  return <ProfileForm user={user} showToast={showToast} roleLabel="Khách hàng" />;
}

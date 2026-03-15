import ProfileEditor from "../../_components/ProfileEditor";
import { getAuthUserFromCookies } from "@/lib/auth";

export default async function BuyerProfilePage() {
  const user = await getAuthUserFromCookies();

  const initialProfileData = user
    ? {
        name: user.name || "",
        email: user.email || "",
        userType: user.userType || "",
        gstNumber: user.gstNumber || "",
        panNumber: user.panNumber || "",
        udhyamNumber: user.userType === "Seller" ? (user.udhyamNumber || "") : "",
        contactNumber: user.contactNumber || "",
        profileImage: user.profileImage || "",
      }
    : undefined;

  return <ProfileEditor dashboardPath="/buyer/dashboard" heading="Buyer Profile" initialProfileData={initialProfileData} showLogout={true} />;
}

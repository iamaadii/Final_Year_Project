import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";
import { getAuthUserFromCookies, resolveRedirectPath } from "@/lib/auth";

export default async function SellerSettingsPage() {
  const user = await getAuthUserFromCookies();

  if (!user) {
    redirect("/login");
  }

  if (user.userType !== "Seller") {
    redirect(resolveRedirectPath(user.userType || ""));
  }

  const initialBankRows = Array.isArray(user.bankAccounts)
    ? user.bankAccounts.map((row) => ({
        bank: String(row?.bank || ""),
        account: String(row?.account || ""),
        accountHolderName: String(row?.accountHolderName || ""),
        status: String(row?.status || ""),
        logoText: String(row?.logoText || ""),
        logoSrc: String(row?.logoSrc || ""),
      }))
    : [];
  const initialTeamRows = Array.isArray(user.teamMembers)
    ? user.teamMembers.map((row) => ({
        name: String(row?.name || ""),
        subtitle: String(row?.subtitle || ""),
        email: String(row?.email || ""),
        role: String(row?.role || ""),
        status: String(row?.status || ""),
      }))
    : [];
  const initialVerificationData = {
    gstNumber: user.gstNumber || "",
    panNumber: user.panNumber || "",
    udhyamNumber: user.udhyamNumber || "",
  };

  return (
    <SettingsClient
      initialBankRows={initialBankRows}
      initialTeamRows={initialTeamRows}
      initialVerificationData={initialVerificationData}
    />
  );
}

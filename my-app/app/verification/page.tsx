import { redirect } from "next/navigation";
import { getAuthUserFromCookies, resolveRedirectPath } from "@/lib/auth";
import VerificationForm from "./VerificationForm";

export default async function VerificationPage() {
  const user = await getAuthUserFromCookies();

  if (!user) {
    redirect("/register");
  }

  if (user.isVerified) {
    redirect(resolveRedirectPath(user.userType));
  }

  return <VerificationForm userType={user.userType || ""} />;
}

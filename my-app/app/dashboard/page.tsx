import { redirect } from "next/navigation";
import { getAuthUserFromCookies, resolveRedirectPath } from "@/lib/auth";

export default async function DashboardRedirectPage() {
  const user = await getAuthUserFromCookies();

  if (!user) {
    redirect("/login");
  }

  if (!user.isVerified) {
    redirect("/verification");
  }

  redirect(resolveRedirectPath(user.userType || ""));
}

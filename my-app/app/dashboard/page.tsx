import { redirect } from "next/navigation";
import { getAuthUserFromCookies, resolveRedirectPath } from "@/lib/auth";

// Section 0.4 decision: removed orphan /api/dashboard route because no UI consumer exists.
// Dashboard pages use role-specific APIs directly and keep least-privilege data access.

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

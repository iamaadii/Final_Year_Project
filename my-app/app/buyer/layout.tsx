import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getAuthUserFromCookies, resolveRedirectPath } from "@/lib/auth";

export default async function BuyerLayout({ children }: { children: ReactNode }) {
  const user = await getAuthUserFromCookies();

  if (!user) {
    redirect("/login");
  }

  if (!user.isVerified) {
    redirect("/verification");
  }

  if (user.userType !== "Buyer") {
    redirect(resolveRedirectPath(user.userType || ""));
  }

  return <>{children}</>;
}

import { ReactNode } from "react";
import { redirect } from "next/navigation";
import BuyerRouteFrame from "./_components/BuyerRouteFrame";
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

  const initialProfile = {
    name: user.name || "User",
    profileImage: user.profileImage || "",
  };

  return <BuyerRouteFrame initialProfile={initialProfile}>{children}</BuyerRouteFrame>;
}

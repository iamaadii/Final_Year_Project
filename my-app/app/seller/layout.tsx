import { ReactNode } from "react";
import { redirect } from "next/navigation";
import SellerRouteFrame from "./_components/SellerRouteFrame";
import { getAuthUserFromCookies, resolveRedirectPath } from "@/lib/auth";

export default async function SellerLayout({ children }: { children: ReactNode }) {
  const user = await getAuthUserFromCookies();

  if (!user) {
    redirect("/login");
  }

  if (!user.isVerified) {
    redirect("/verification");
  }

  if (user.userType !== "Seller") {
    redirect(resolveRedirectPath(user.userType || ""));
  }

  const initialProfile = {
    name: user.name || "User",
    profileImage: user.profileImage || "",
  };

  return <SellerRouteFrame initialProfile={initialProfile}>{children}</SellerRouteFrame>;
}

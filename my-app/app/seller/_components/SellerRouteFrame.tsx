"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import SellerShellClient from "./SellerShellClient";

type SellerRouteFrameProps = {
  children: ReactNode;
  initialProfile: {
    name: string;
    profileImage: string;
  };
};

export default function SellerRouteFrame({ children, initialProfile }: SellerRouteFrameProps) {
  const pathname = usePathname().toLowerCase();

  const isStandalone =
    pathname.startsWith("/seller/profile") || pathname.startsWith("/seller/notifications");

  if (isStandalone) {
    return <>{children}</>;
  }

  return <SellerShellClient initialProfile={initialProfile}>{children}</SellerShellClient>;
}

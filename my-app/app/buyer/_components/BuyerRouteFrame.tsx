"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import BuyerShellClient from "./BuyerShellClient";

type BuyerRouteFrameProps = {
  children: ReactNode;
  initialProfile: {
    name: string;
    profileImage: string;
  };
};

export default function BuyerRouteFrame({ children, initialProfile }: BuyerRouteFrameProps) {
  const pathname = usePathname().toLowerCase();

  const isStandalone =
    pathname.startsWith("/buyer/profile") || pathname.startsWith("/buyer/notifications");

  if (isStandalone) {
    return <>{children}</>;
  }

  return <BuyerShellClient initialProfile={initialProfile}>{children}</BuyerShellClient>;
}

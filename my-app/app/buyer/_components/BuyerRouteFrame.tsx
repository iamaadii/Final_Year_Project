"use client";

import { useEffect, useState } from "react";
import BuyerShellClient from "./BuyerShellClient";

type BuyerRouteFrameProps = {
  children: React.ReactNode;
};

export default function BuyerRouteFrame({ children }: BuyerRouteFrameProps) {
  const [profile, setProfile] = useState<{ name: string; profileImage: string }>();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("profileAvatar");
      if (stored) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setProfile(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  return <BuyerShellClient initialProfile={profile}>{children}</BuyerShellClient>;
}

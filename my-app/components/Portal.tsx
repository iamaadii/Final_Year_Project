"use client";

import { useEffect, useState, ReactNode } from "react";
import { createPortal } from "react-dom";

type PortalProps = {
  children: ReactNode;
};

export function Portal({ children }: PortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Optional: Prevent scrolling on the body while modal is open
    // document.body.style.overflow = "hidden";
    // return () => { document.body.style.overflow = "auto"; };
  }, []);

  if (!mounted) return null;

  return createPortal(children, document.body);
}

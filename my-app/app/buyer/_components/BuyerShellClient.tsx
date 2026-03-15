"use client";

import Link from "next/link";
import Image from "next/image";
import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";
import HeaderProfileAvatar from "../../_components/HeaderProfileAvatar";
import NotificationBell from "../../_components/NotificationBell";

type BuyerShellClientProps = {
  children: ReactNode;
  initialProfile?: {
    name: string;
    profileImage: string;
  };
};

function resolveActive(pathname: string): string {
  const lower = pathname.toLowerCase();
  if (lower.startsWith("/buyer/ap-hub")) return "AP Hub";
  if (lower.startsWith("/buyer/compliance")) return "Compliance";
  if (lower.startsWith("/buyer/yield-engine")) return "Yield Engine";
  if (lower.startsWith("/buyer/treasury")) return "Treasury";
  if (lower.startsWith("/buyer/vendors")) return "Vendors";
  if (lower.startsWith("/buyer/reports")) return "Reports";
  if (lower.startsWith("/buyer/audit-hub")) return "Audit Hub";
  if (lower.startsWith("/buyer/settings")) return "Settings";
  return "Dashboard";
}

export default function BuyerShellClient({ children, initialProfile }: BuyerShellClientProps) {
  const pathname = usePathname();
  const active = resolveActive(pathname);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const navItems: Array<{ label: string; href: string; icon: ReactNode }> = [
    {
      label: "Dashboard",
      href: "/buyer/dashboard",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
          <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
          <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
          <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      ),
    },
    {
      label: "AP Hub",
      href: "/buyer/ap-hub",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path d="M7 3.5H14.5L19 8V20.5H7V3.5Z" stroke="currentColor" strokeWidth="1.6" />
          <path d="M14 3.5V8H18.5" stroke="currentColor" strokeWidth="1.6" />
          <path d="M10 12H16M10 15H16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      label: "Compliance",
      href: "/buyer/compliance",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path d="M12 2L3 7V12C3 17.5 7 21.5 12 22C17 21.5 21 17.5 21 12V7L12 2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      label: "Yield Engine",
      href: "/buyer/yield-engine",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      label: "Vendors",
      href: "/buyer/vendors",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path d="M17 20h5V10l-10-8L2 10v10h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M7 20v-6a2 2 0 012-2h6a2 2 0 012 2v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      label: "Reports",
      href: "/buyer/reports",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path d="M5 20.5H19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <rect x="6.5" y="11.5" width="2.5" height="7" rx="1" stroke="currentColor" strokeWidth="1.6" />
          <rect x="10.75" y="8.5" width="2.5" height="10" rx="1" stroke="currentColor" strokeWidth="1.6" />
          <rect x="15" y="5.5" width="2.5" height="13" rx="1" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      ),
    },
    {
      label: "Audit Hub",
      href: "/buyer/audit-hub",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.6" />
          <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.6" />
          <path d="M9 15l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      label: "Settings",
      href: "/buyer/settings",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M19 12C19 11.4 18.9 10.9 18.7 10.4L20.2 9.2L18.8 6.8L16.9 7.5C16.1 6.8 15.1 6.3 14 6.1L13.7 4H10.9L10.6 6.1C9.5 6.3 8.5 6.8 7.7 7.5L5.8 6.8L4.4 9.2L5.9 10.4C5.7 10.9 5.6 11.4 5.6 12C5.6 12.6 5.7 13.1 5.9 13.6L4.4 14.8L5.8 17.2L7.7 16.5C8.5 17.2 9.5 17.7 10.6 17.9L10.9 20H13.7L14 17.9C15.1 17.7 16.1 17.2 16.9 16.5L18.8 17.2L20.2 14.8L18.7 13.6C18.9 13.1 19 12.6 19 12Z"
            stroke="currentColor"
            strokeWidth="1.2"
          />
        </svg>
      ),
    },
  ];

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#f7f4ef] lg:h-screen lg:overflow-hidden">
      <div className="w-full">
        {isMobileNavOpen ? (
          <div
            className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
            onClick={() => setIsMobileNavOpen(false)}
            aria-hidden="true"
          />
        ) : null}

        <aside
          className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-white/95 p-4 shadow-xl transition-transform duration-200 lg:hidden ${
            isMobileNavOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          aria-hidden={!isMobileNavOpen}
        >
          <div className="mb-6 flex items-center justify-between">
            <h2 className="flex items-center gap-3 text-xl font-bold text-slate-800">
              <Link href="/" onClick={() => setIsMobileNavOpen(false)} aria-label="Go to homepage">
                <Image
                  src="/favicon-192.png"
                  alt="NEXUS THREE logo"
                  width={48}
                  height={48}
                  className="h-9 w-9 sm:h-10 sm:w-10 xl:h-12 xl:w-12"
                />
              </Link>
              <span className="text-base leading-none sm:text-lg xl:text-xl">NEXUS THREE</span>
            </h2>
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(false)}
              className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600"
            >
              Close
            </button>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setIsMobileNavOpen(false)}
                className={`block rounded-xl px-3 py-2.5 text-sm font-medium ${
                  item.label === active
                    ? "bg-[#0f1b2d] text-white shadow-sm"
                    : "text-slate-600 hover:bg-white"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <span className="opacity-80">{item.icon}</span>
                  <span>{item.label}</span>
                </span>
              </Link>
            ))}
          </nav>
        </aside>

        <div className="w-full lg:pl-[240px]">
          <aside className="hidden fixed inset-y-0 left-0 z-20 w-[240px] overflow-y-auto border-r border-slate-200 bg-white/95 p-4 lg:block">
            <h2 className="mb-6 flex items-center gap-3 text-xl font-bold text-slate-800">
              <Link href="/" aria-label="Go to homepage">
                <Image
                  src="/favicon-192.png"
                  alt="NEXUS THREE logo"
                  width={48}
                  height={48}
                  className="h-9 w-9 sm:h-10 sm:w-10 xl:h-12 xl:w-12"
                />
              </Link>
              <span className="text-base leading-none sm:text-lg xl:text-xl">NEXUS THREE</span>
            </h2>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`block rounded-xl px-3 py-2.5 text-sm font-medium ${
                    item.label === active
                      ? "bg-[#0f1b2d] text-white shadow-sm"
                      : "text-slate-600 hover:bg-white"
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <span className="opacity-80">{item.icon}</span>
                    <span>{item.label}</span>
                  </span>
                </Link>
              ))}
            </nav>
          </aside>

          <section className="min-w-0 lg:flex lg:h-screen lg:flex-col">
            <div className="fixed left-0 right-0 top-0 z-30 w-full border-b border-slate-200 bg-white/90 px-3 py-2 shadow-sm backdrop-blur lg:left-[240px] lg:right-auto lg:w-[calc(100%-240px)] lg:px-6">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsMobileNavOpen(true)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 lg:hidden"
                  aria-label="Open navigation menu"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                    <path d="M4 7H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M4 12H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M4 17H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </button>

                <div className="ml-auto flex items-center gap-4">
                  <NotificationBell href="/buyer/notifications" storageKey="buyerNotifications" />
                  <div className="h-8 w-px bg-slate-200" />
                  <HeaderProfileAvatar href="/buyer/profile" initialProfile={initialProfile} />
                </div>
              </div>
            </div>

            <div className="buyer-dashboard-scroll min-w-0 px-3 pb-3 pt-20 sm:px-4 sm:pb-4 sm:pt-24 lg:h-full lg:overflow-y-auto lg:px-6 lg:pb-6 lg:pt-24">
              {children}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

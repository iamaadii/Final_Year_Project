"use client";

import Link from "next/link";
import Image from "next/image";
import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";
import HeaderProfileAvatar from "../../_components/HeaderProfileAvatar";
import SellerNotificationBell from "../../_components/SellerNotificationBell";

type SellerShellClientProps = {
  children: ReactNode;
  initialProfile: {
    name: string;
    profileImage: string;
  };
};

function resolveActive(pathname: string): "Dashboard" | "Invoices" | "Cash Flow" | "Settings" | "Reports" {
  const lower = pathname.toLowerCase();
  if (lower.startsWith("/seller/invoices")) return "Invoices";
  if (lower.startsWith("/seller/cashflow")) return "Cash Flow";
  if (lower.startsWith("/seller/settings")) return "Settings";
  if (lower.startsWith("/seller/reports")) return "Reports";
  return "Dashboard";
}

export default function SellerShellClient({ children, initialProfile }: SellerShellClientProps) {
  const pathname = usePathname();
  const active = resolveActive(pathname);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const navItems: Array<{ label: typeof active; href: string; icon: ReactNode }> = [
    {
      label: "Dashboard",
      href: "/seller/dashboard",
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
      label: "Invoices",
      href: "/seller/Invoices",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path d="M7 3.5H14.5L19 8V20.5H7V3.5Z" stroke="currentColor" strokeWidth="1.6" />
          <path d="M14 3.5V8H18.5" stroke="currentColor" strokeWidth="1.6" />
          <path d="M10 12H16M10 15H16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      label: "Cash Flow",
      href: "/seller/CashFlow",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path d="M4 17.5L9 12.5L12.5 16L19.5 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M16 9H19.5V12.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      label: "Settings",
      href: "/seller/Settings",
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
    {
      label: "Reports",
      href: "/seller/Reports",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path d="M5 20.5H19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <rect x="6.5" y="11.5" width="2.5" height="7" rx="1" stroke="currentColor" strokeWidth="1.6" />
          <rect x="10.75" y="8.5" width="2.5" height="10" rx="1" stroke="currentColor" strokeWidth="1.6" />
          <rect x="15" y="5.5" width="2.5" height="13" rx="1" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      ),
    },
  ];

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#eef3f8] lg:h-screen lg:overflow-hidden">
      <div className="w-full">
        {isMobileNavOpen ? (
          <div
            className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
            onClick={() => setIsMobileNavOpen(false)}
            aria-hidden="true"
          />
        ) : null}

        <aside
          className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-white p-4 shadow-xl transition-transform duration-200 lg:hidden ${
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
                  item.label === active ? "bg-blue-100 text-blue-800" : "text-slate-600 hover:bg-slate-100"
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
          <aside className="hidden fixed inset-y-0 left-0 z-20 w-[240px] overflow-y-auto border-r border-slate-200 bg-white p-4 lg:block">
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
                  className={`block rounded-xl px-3 py-2.5 text-sm font-medium ${item.label === active ? "bg-blue-100 text-blue-800" : "text-slate-600 hover:bg-slate-100"}`}
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
            <div className="fixed left-0 right-0 top-0 z-30 w-full border-b border-slate-200 bg-white/95 px-3 py-2 shadow-sm backdrop-blur lg:left-[240px] lg:right-auto lg:w-[calc(100%-240px)] lg:px-6">
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

                <div className="ml-auto flex items-center gap-3">
                  <SellerNotificationBell />
                  <HeaderProfileAvatar href="/seller/profile" initialProfile={initialProfile} />
                </div>
              </div>
            </div>

            <div className="seller-dashboard-scroll min-w-0 px-3 pb-3 pt-20 sm:px-4 sm:pb-4 sm:pt-24 lg:h-full lg:overflow-y-auto lg:px-6 lg:pb-6 lg:pt-24">
              {children}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}



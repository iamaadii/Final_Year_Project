"use client";

import Link from "next/link";
import Image from "next/image";
import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, HandCoins, ShieldCheck, Landmark, UsersRound, BarChart3, Settings, ClipboardList } from "lucide-react";
import HeaderProfileAvatar from "../../_components/HeaderProfileAvatar";
import NotificationBell from "../../_components/NotificationBell";
import ThemeToggle from "../../_components/ThemeToggle";

type SellerShellClientProps = {
  children: ReactNode;
  initialProfile: {
    name: string;
    profileImage: string;
  };
};

function resolveActive(pathname: string): string {
  const lower = pathname.toLowerCase();
  
  if (lower.startsWith("/seller/invoices")) return "Invoices";
  if (lower.startsWith("/seller/receivables")) return "Receivables";
  if (lower.startsWith("/seller/payment-tracker")) return "Payment Tracker";
  if (lower.startsWith("/seller/compliance")) return "Compliance";
  if (lower.startsWith("/seller/treasury-offers")) return "Treasury Offers";
  if (lower.startsWith("/seller/buyers")) return "Buyers";
  if (lower.startsWith("/seller/reports")) return "Reports";
  if (lower.startsWith("/seller/settings")) return "Settings";
  
  return "Dashboard";
}

export default function SellerShellClient({ children, initialProfile }: SellerShellClientProps) {
  const pathname = usePathname();
  const active = resolveActive(pathname);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const navItems: Array<{ label: string; href: string; icon: ReactNode }> = [
    {
      label: "Dashboard",
      href: "/seller/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" strokeWidth={1.9} />,
    },
    {
      label: "Invoices",
      href: "/seller/invoices",
      icon: <FileText className="h-5 w-5" strokeWidth={1.9} />,
    },
    {
      label: "Receivables",
      href: "/seller/receivables",
      icon: <HandCoins className="h-5 w-5" strokeWidth={1.9} />,
    },
    {
      label: "Payment Tracker",
      href: "/seller/payment-tracker",
      icon: <ClipboardList className="h-5 w-5" strokeWidth={1.9} />,
    },
    {
      label: "Compliance",
      href: "/seller/compliance",
      icon: <ShieldCheck className="h-5 w-5" strokeWidth={1.9} />,
    },
    {
      label: "Treasury Offers",
      href: "/seller/treasury-offers",
      icon: <Landmark className="h-5 w-5" strokeWidth={1.9} />,
    },
    {
      label: "Buyers",
      href: "/seller/buyers",
      icon: <UsersRound className="h-5 w-5" strokeWidth={1.9} />,
    },
    {
      label: "Reports",
      href: "/seller/reports",
      icon: <BarChart3 className="h-5 w-5" strokeWidth={1.9} />,
    },
    {
      label: "Settings",
      href: "/seller/settings",
      icon: <Settings className="h-5 w-5" strokeWidth={1.9} />,
    },
  ];

  return (
    <main className="min-h-[100dvh] w-full overflow-x-hidden bg-[#f7f4ef] lg:h-[100dvh] lg:overflow-hidden">
      <div className="w-full">
        {isMobileNavOpen ? (
          <div
            className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
            onClick={() => setIsMobileNavOpen(false)}
            aria-hidden="true"
          />
        ) : null}

        <aside
          className={`fixed inset-y-0 left-0 z-50 w-[248px] bg-white/95 p-4 shadow-xl transition-transform duration-200 lg:hidden flex flex-col ${
            isMobileNavOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          aria-hidden={!isMobileNavOpen}
        >
          <div className="mb-6 flex items-center justify-between shrink-0">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Portal Menu</p>
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(false)}
              className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
          <nav className="space-y-1 flex-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setIsMobileNavOpen(false)}
                className={`block rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  item.label === active
                    ? "bg-[#0f1b2d] text-white shadow-sm"
                    : "text-slate-600 hover:bg-white"
                }`}
              >
                <span className="inline-flex items-center gap-3 w-full">
                  <span className={`opacity-80 ${item.label === active ? "text-white" : ""}`}>{item.icon}</span>
                  <span>{item.label}</span>
                </span>
              </Link>
            ))}
          </nav>
        </aside>

        <div className="w-full lg:pl-[248px]">
          <aside className="hidden fixed inset-y-0 left-0 z-20 w-[248px] border-r border-slate-200 bg-white/95 p-4 shadow-sm lg:flex lg:flex-col">
            <p className="mb-6 mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Seller Portal</p>
            <nav className="space-y-1.5 flex-1 overflow-y-auto pr-2">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`block rounded-xl px-3 py-2.5 text-[0.9rem] font-medium transition-colors ${
                    item.label === active
                      ? "bg-[#0f1b2d] text-white font-semibold border border-[#0f1b2d] shadow-sm"
                      : "text-slate-600 hover:bg-white border border-transparent"
                  }`}
                >
                  <span className="inline-flex items-center gap-3 w-full">
                    <span className={`opacity-90 ${item.label === active ? "text-white" : ""}`}>{item.icon}</span>
                    <span>{item.label}</span>
                  </span>
                </Link>
              ))}
            </nav>
          </aside>

          <section className="min-w-0 lg:flex lg:h-screen lg:flex-col">
            <div className="fixed left-0 right-0 top-0 z-30 w-full border-b border-slate-200 bg-white/90 px-3 py-2 shadow-sm backdrop-blur lg:left-[248px] lg:w-[calc(100%-248px)] lg:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setIsMobileNavOpen(true)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 lg:hidden"
                    aria-label="Open navigation menu"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                      <path d="M4 7H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      <path d="M4 12H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      <path d="M4 17H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </button>
                  <Link
                    href="/seller/dashboard"
                    aria-label="Go to seller dashboard"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5"
                  >
                    <Image
                      src="/favicon-192.png"
                      alt="NEXUS THREE logo"
                      width={32}
                      height={32}
                      className="h-8 w-8"
                    />
                    <span className="hidden text-xs font-bold tracking-[0.18em] text-slate-700 sm:inline">NEXUS THREE</span>
                  </Link>
                </div>

                <div className="flex items-center gap-4">
                  <ThemeToggle />
                  <NotificationBell href="/seller/notifications" storageKey="sellerNotifications" />
                  <div className="h-8 w-px bg-slate-200" />
                  <HeaderProfileAvatar href="/seller/profile" initialProfile={initialProfile} />
                </div>
              </div>
            </div>

            <div className="app-shell-scroll min-w-0 px-3 pb-4 pt-[4.75rem] sm:px-4 sm:pb-5 sm:pt-[5.25rem] lg:h-full lg:overflow-y-auto lg:px-6 lg:pb-6 lg:pt-[5.25rem]">
              <div key={pathname} className="portal-module-transition mx-auto w-full max-w-[1280px]">
                {children}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

import Link from "next/link";
import Image from "next/image";
import { ReactNode } from "react";
import HeaderProfileAvatar from "../../_components/HeaderProfileAvatar";
import SellerNotificationBell from "../../_components/SellerNotificationBell";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import dbConnect from "../../../lib/db";
import User from "../../../models/User";

type SellerShellProps = {
  active: "Dashboard" | "Invoices" | "Cash Flow" | "Settings" | "Reports";
  children: ReactNode;
};

const navItems: Array<{
  label: SellerShellProps["active"];
  href: string;
  icon: ReactNode;
}> = [
  {
    label: "Dashboard",
    href: "/seller/dashboard",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
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
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
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
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
        <path d="M4 17.5L9 12.5L12.5 16L19.5 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M16 9H19.5V12.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/seller/Settings",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
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
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
        <path d="M5 20.5H19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <rect x="6.5" y="11.5" width="2.5" height="7" rx="1" stroke="currentColor" strokeWidth="1.6" />
        <rect x="10.75" y="8.5" width="2.5" height="10" rx="1" stroke="currentColor" strokeWidth="1.6" />
        <rect x="15" y="5.5" width="2.5" height="13" rx="1" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
];

export default async function SellerShell({ active, children }: SellerShellProps) {
  let initialProfile = { name: "User", profileImage: "" };
  const secret = process.env.JWT_SECRET;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (secret && token) {
    try {
      const payload = jwt.verify(token, secret) as { id?: string };
      if (payload?.id) {
        await dbConnect();
        const user = await User.findById(payload.id).select("name profileImage").lean() as {
          name?: string;
          profileImage?: string;
        } | null;
        if (user) {
          initialProfile = {
            name: user.name || "User",
            profileImage: user.profileImage || "",
          };
        }
      }
    } catch {
      // Keep default avatar fallback.
    }
  }

  return (
    <main className="min-h-screen bg-[#eef3f8] p-3 sm:p-4 lg:p-6">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl bg-white p-2 shadow-sm lg:hidden">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-xs font-medium ${item.label === active ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-600"}`}
            >
              <span className="inline-flex items-center gap-2">
                <span className="opacity-80">{item.icon}</span>
                <span>{item.label}</span>
              </span>
            </Link>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[230px_1fr]">
          <aside className="hidden rounded-2xl bg-white p-4 shadow-sm lg:block">
            <h2 className="mb-6 flex items-center gap-3 text-xl font-bold text-slate-800">
              <Image src="/favicon-192.png" alt="NEXUS THREE logo" width={48} height={48} className="h-9 w-9 sm:h-10 sm:w-10 xl:h-12 xl:w-12" />
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

          <section className="space-y-4">
            <header className="rounded-2xl bg-white p-3 shadow-sm sm:p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <input
                  type="text"
                  placeholder="Search"
                  className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
                />
                <div className="flex items-center gap-3">
                  <SellerNotificationBell />
                  <HeaderProfileAvatar href="/seller/profile" initialProfile={initialProfile} />
                </div>
              </div>
            </header>

            {children}
          </section>
        </div>
      </div>
    </main>
  );
}



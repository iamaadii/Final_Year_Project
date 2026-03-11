import Link from "next/link";
import Image from "next/image";
import { ReactNode } from "react";
import HeaderProfileAvatar from "../../_components/HeaderProfileAvatar";

type BuyerShellProps = {
  active: "Dashboard" | "Invoices" | "Cash Flow" | "Settings" | "Reports";
  children: ReactNode;
};

const navItems: Array<{
  label: BuyerShellProps["active"];
  href: string;
}> = [
  { label: "Dashboard", href: "/buyer/dashboard" },
  { label: "Invoices", href: "/buyer/invoices" },
  { label: "Cash Flow", href: "/buyer/cashflow" },
  { label: "Settings", href: "/buyer/settings" },
  { label: "Reports", href: "/buyer/reports" },
];

export default function BuyerShell({ active, children }: BuyerShellProps) {

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
              {item.label}
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
                  {item.label}
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
                  <Link
                    href="/buyer/dashboard/go/notifications"
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"
                    title="Notifications"
                  >
                    <Image src="/notification.svg" alt="" width={24} height={24} aria-hidden="true" className="h-6 w-6" />
                  </Link>
                  <HeaderProfileAvatar href="/buyer/profile" />
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





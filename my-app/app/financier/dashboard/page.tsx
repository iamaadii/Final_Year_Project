import Link from "next/link";

export default function FinancierDashboardPage() {

  return (
    <main className="min-h-screen bg-[#eef3f8] px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-5xl rounded-2xl bg-white p-6 shadow sm:p-8">
        <h1 className="text-3xl font-bold text-slate-900">Financier Dashboard</h1>
        <p className="mt-2 text-slate-600">
          Welcome to your financier workspace. Evaluate risk, review invoice pools,
          and manage liquidity offers.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/financier/dashboard/opportunities" className="rounded-xl border border-slate-200 p-4 hover:bg-slate-50">
            <p className="font-semibold text-slate-800">Funding Opportunities</p>
            <p className="mt-1 text-sm text-slate-500">Browse eligible receivables</p>
          </Link>
          <Link href="/financier/dashboard/offers" className="rounded-xl border border-slate-200 p-4 hover:bg-slate-50">
            <p className="font-semibold text-slate-800">Issued Offers</p>
            <p className="mt-1 text-sm text-slate-500">Track offer acceptance status</p>
          </Link>
          <Link href="/financier/dashboard/settings" className="rounded-xl border border-slate-200 p-4 hover:bg-slate-50">
            <p className="font-semibold text-slate-800">Settings</p>
            <p className="mt-1 text-sm text-slate-500">Manage financier profile</p>
          </Link>
        </div>
      </div>
    </main>
  );
}


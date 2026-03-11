import Link from "next/link";

export default function BuyerDashboardPage() {

  return (
    <main className="min-h-screen bg-[#eef3f8] px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-5xl rounded-2xl bg-white p-6 shadow sm:p-8">
        <h1 className="text-3xl font-bold text-slate-900">Buyer Dashboard</h1>
        <p className="mt-2 text-slate-600">
          Welcome to your buyer workspace. Review incoming invoices, approvals, and payment terms.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/buyer/invoices" className="rounded-xl border border-slate-200 p-4 hover:bg-slate-50">
            <p className="font-semibold text-slate-800">Invoices to Review</p>
            <p className="mt-1 text-sm text-slate-500">View supplier invoice submissions</p>
          </Link>
          <Link href="/buyer/reports" className="rounded-xl border border-slate-200 p-4 hover:bg-slate-50">
            <p className="font-semibold text-slate-800">Approvals</p>
            <p className="mt-1 text-sm text-slate-500">Manage approval queues</p>
          </Link>
          <Link href="/buyer/settings" className="rounded-xl border border-slate-200 p-4 hover:bg-slate-50">
            <p className="font-semibold text-slate-800">Settings</p>
            <p className="mt-1 text-sm text-slate-500">Manage buyer profile</p>
          </Link>
        </div>
      </div>
    </main>
  );
}


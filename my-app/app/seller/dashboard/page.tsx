import Link from "next/link";

const forecastData = [
  { label: "Next 30 Days", standard: 150, accelerated: 60 },
  { label: "Next 60 Days", standard: 120, accelerated: 60 },
  { label: "Next 90 Days", standard: 150, accelerated: 60 },
];

export default function SellerDashboardPage() {

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Operational Summary</h1>
        <p className="mt-1 text-sm font-medium text-slate-500">Financial KPI Strip</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Link href="/seller/dashboard/go/kpi/receivables" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-700">Total Outstanding Receivables</p>
            <p className="mt-1 text-4xl font-semibold text-slate-900">$1,450,000</p>
            <p className="mt-1 text-sm text-slate-500">Total Outstanding Receivables</p>
          </Link>
          <Link href="/seller/dashboard/go/kpi/discounting" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-700">Value Ready for Discounting</p>
            <p className="mt-1 text-4xl font-semibold text-slate-900">$580,000</p>
            <p className="mt-1 text-sm text-slate-500">Value Ready for Discounting</p>
          </Link>
          <Link href="/seller/dashboard/go/kpi/liquidity" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:col-span-2 xl:col-span-1">
            <p className="text-sm font-semibold text-slate-700">Total Liquidity Realized</p>
            <p className="mt-1 text-4xl font-semibold text-slate-900">$3,200,000</p>
            <p className="mt-1 text-sm text-slate-500">Total Liquidity Realized</p>
          </Link>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[2fr_1fr]">
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900">Cash Flow Forecast Chart</h3>
            <div className="mt-2 flex items-center gap-4 text-sm text-slate-600">
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-sky-200" /> Standard Maturity Dates
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-cyan-500" /> Accelerated Dates
              </span>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4">
              {forecastData.map((item) => (
                <div key={item.label} className="text-center">
                  <div className="mx-auto flex h-44 items-end justify-center gap-3">
                    <div className="w-10 rounded-t bg-sky-200" style={{ height: `${item.standard}px` }}>
                      <span className="-mt-6 block text-xs font-semibold text-slate-700">
                        ${item.standard}k
                      </span>
                    </div>
                    <div className="w-10 rounded-t bg-cyan-500" style={{ height: `${item.accelerated}px` }}>
                      <span className="-mt-6 block text-xs font-semibold text-slate-700">
                        ${item.accelerated}k
                      </span>
                    </div>
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-700">{item.label}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900">Urgent Action Items</h3>
            <div className="mt-3 space-y-3">
              <Link href="/seller/dashboard/go/action/rejected-invoices" className="block rounded-xl border border-slate-200 p-3 hover:bg-slate-50">
                <p className="text-sm font-semibold text-slate-800">
                  3 Invoices Rejected by Buyer
                </p>
                <p className="mt-1 text-xs text-slate-500">Fix and resubmit to proceed</p>
              </Link>
              <Link href="/seller/dashboard/go/action/early-payment-offers" className="block rounded-xl border border-slate-200 p-3 hover:bg-slate-50">
                <p className="text-sm font-semibold text-slate-800">
                  2 New Early Payment Offers Received
                </p>
                <p className="mt-1 text-xs text-slate-500">Review and accept best option</p>
              </Link>
            </div>

            <div className="mt-4 space-y-2">
              <Link href="/seller/dashboard/go/upload-invoice" className="block w-full rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-center text-sm font-semibold text-emerald-700">
                Upload Invoice
              </Link>
              <Link href="/seller/dashboard/go/fetch-e-invoice" className="block w-full rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-center text-sm font-semibold text-cyan-700">
                Fetch e-Invoice
              </Link>
              <Link href="/seller/dashboard/go/propose-discount" className="block w-full rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-center text-sm font-semibold text-blue-700">
                Propose Discount
              </Link>
            </div>
          </article>
        </div>

        <div className="mt-5">
          <Link
            href="/verification"
            className="inline-flex rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Update Verification Details
          </Link>
        </div>
      </div>
  );
}


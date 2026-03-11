const cashFlowItems = [
  { period: "This Week", inflow: "$120,000", outflow: "$65,000", net: "$55,000" },
  { period: "This Month", inflow: "$480,000", outflow: "$290,000", net: "$190,000" },
  { period: "This Quarter", inflow: "$1,220,000", outflow: "$760,000", net: "$460,000" },
];

export default function SellerCashFlowPage() {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Cash Flow</h1>
        <p className="mt-1 text-sm font-medium text-slate-500">
          Monitor liquidity movement and upcoming cash positions.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <article className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Projected Inflow</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">$950,000</p>
          </article>
          <article className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Projected Outflow</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">$610,000</p>
          </article>
          <article className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Net Position</p>
            <p className="mt-2 text-3xl font-bold text-emerald-700">$340,000</p>
          </article>
        </div>

        <div className="mt-4 w-full overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[520px] text-left sm:min-w-[600px]">
            <thead className="bg-slate-50 text-sm text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Period</th>
                <th className="px-4 py-3 font-semibold">Inflow</th>
                <th className="px-4 py-3 font-semibold">Outflow</th>
                <th className="px-4 py-3 font-semibold">Net</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {cashFlowItems.map((row) => (
                <tr key={row.period} className="border-t border-slate-200">
                  <td className="px-4 py-3 font-medium text-slate-800">{row.period}</td>
                  <td className="px-4 py-3 text-slate-700">{row.inflow}</td>
                  <td className="px-4 py-3 text-slate-700">{row.outflow}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-700">{row.net}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
  );
}


import Link from "next/link";

function toTitle(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function DashboardRedirectPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const breadcrumb = slug.map(toTitle).join(" / ");

  return (
    <main className="min-h-screen bg-[#eef3f8] px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-3xl rounded-2xl bg-white p-6 shadow sm:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Dashboard Route</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">{breadcrumb}</h1>
        <p className="mt-4 text-slate-600">
          You were redirected successfully from a clickable dashboard item.
        </p>
        <div className="mt-8">
          <Link
            href="/dashboard"
            className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

import Link from "next/link";

function toTitle(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function MenuFeaturePage({
  params,
}: {
  params: Promise<{ section: string; feature: string }>;
}) {
  const { section, feature } = await params;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:px-6">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-700">
          {toTitle(section)}
        </p>
        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">{toTitle(feature)}</h1>
        <p className="mt-4 text-slate-600">
          This is the default page for <strong>{toTitle(feature)}</strong> under{" "}
          <strong>{toTitle(section)}</strong>.
        </p>

        <div className="mt-8">
          <Link
            href="/"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}

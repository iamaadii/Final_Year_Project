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
    <main className="min-h-screen bg-[#050607] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-md sm:p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">
          {toTitle(section)}
        </p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{toTitle(feature)}</h1>
        <p className="mt-4 text-zinc-300">
          This is the default page for <strong>{toTitle(feature)}</strong> under{" "}
          <strong>{toTitle(section)}</strong>.
        </p>

        <div className="mt-8">
          <Link
            href="/"
            className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}

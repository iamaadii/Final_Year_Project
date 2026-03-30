"use client";

import { FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setAnimateIn(false);
    const id = window.setTimeout(() => setAnimateIn(true), 40);
    return () => window.clearTimeout(id);
  }, [pathname]);

  useEffect(() => {
    const redirect = new URLSearchParams(window.location.search).get("redirect");
    setRedirectPath(redirect);
  }, [pathname]);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password,
          redirectTo: redirectPath || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error?.message || "We could not sign you in. Please try again.");
        return;
      }

      setSuccess("Login successful");
      setIsTransitioning(true);
      setTimeout(() => {
        router.push(data?.data?.redirectTo || "/buyer/dashboard");
      }, 700);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f4ef] px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#e0f2f1,transparent_52%),radial-gradient(circle_at_bottom,#f2e8da,transparent_45%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,27,45,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,27,45,0.06)_1px,transparent_1px)] bg-[size:5rem_5rem] opacity-60" />
      <div className="absolute left-10 top-20 h-40 w-40 rounded-full bg-[#d9f0ef] blur-3xl" />
      <div className="absolute right-10 top-10 h-56 w-56 rounded-full bg-[#f6ead7] blur-3xl" />

      <form
        onSubmit={handleLogin}
        className={`relative z-10 w-full max-w-md rounded-3xl border border-white/80 bg-white/90 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.12)] transition-all duration-700 sm:p-8 ${
          isTransitioning
            ? "-translate-y-2 scale-95 opacity-0"
            : animateIn
              ? "translate-y-0 scale-100 opacity-100"
              : "translate-y-4 scale-95 opacity-0"
        }`}
      >
        <div className="flex flex-col items-center text-center">
          <Image
            src="/favicon-192.png"
            alt="Nexus Three logo"
            width={60}
            height={60}
            className="h-14 w-14 rounded-2xl bg-white/80 p-1 shadow-sm"
          />
          <p className="mt-4 text-xs uppercase tracking-[0.3em] text-slate-500">Nexus Three</p>
          <h2 className="mt-2 text-[clamp(1.6rem,3vw,2.1rem)] font-semibold text-[#0f1b2d]">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Sign in to manage MSME and enterprise finance workflows.
          </p>
        </div>

        {error && <p className="mt-5 text-center text-sm text-rose-600">{error}</p>}
        {success && <p className="mt-5 text-center text-sm text-emerald-600">{success}</p>}

        <div className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Work email</label>
            <input
              type="email"
              placeholder="you@company.com"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-[#0f1b2d] focus:outline-none focus:ring-2 focus:ring-[#0f1b2d]/10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Password</label>
            <div className="relative mt-2">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-20 text-sm text-slate-900 placeholder-slate-400 focus:border-[#0f1b2d] focus:outline-none focus:ring-2 focus:ring-[#0f1b2d]/10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 px-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#1b5b6a]"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm">
          <Link href="/forgot-password" className="font-medium text-[#1b5b6a] hover:underline">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-full bg-[#0f1b2d] px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#142338] disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <p className="mt-6 text-center text-sm text-slate-600">
          New to Nexus Three?{" "}
          <Link href="/register" className="font-semibold text-[#1b5b6a] hover:underline">
            Create account
          </Link>
        </p>
      </form>
    </div>
  );
}

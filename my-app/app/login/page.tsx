"use client";

import { FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message || "We couldn't sign you in. Please try again.");
        return;
      }

      setSuccess("Login successful");
      setIsTransitioning(true);
      setTimeout(() => {
        router.push(data.redirectTo || "/buyer/dashboard");
      }, 700);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 relative overflow-hidden"
    >
      {/* Light subtle grid background similar to homepage */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-50" />

      <form
        onSubmit={handleLogin}
        className={`relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl transition-all duration-700 sm:p-8 ${
          isTransitioning
            ? "-translate-y-2 scale-95 opacity-0"
            : animateIn
              ? "translate-y-0 scale-100 opacity-100"
              : "translate-y-4 scale-95 opacity-0"
        }`}
      >
        <h2
          className={`text-center text-[clamp(1.5rem,3vw,2rem)] font-bold text-slate-900 transition-all delay-100 duration-700 ${
            animateIn ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
          }`}
        >
          Welcome back
        </h2>
        <p
          className={`mb-6 mt-1 text-center text-[clamp(0.9rem,2vw,1rem)] text-slate-500 transition-all delay-150 duration-700 ${
            animateIn ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
          }`}
        >
          Sign in to continue to your dashboard
        </p>

        {error && (
          <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
        )}
        {success && (
          <p className="text-green-600 text-sm mb-4 text-center animate-pulse">
            {success}
          </p>
        )}

        <input
          type="email"
          placeholder="Email"
          className={`mb-4 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-[clamp(0.95rem,2vw,1rem)] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white`}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <div className="relative mb-5">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className={`w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-20 text-[clamp(0.95rem,2vw,1rem)] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className={`absolute inset-y-0 right-0 px-3 text-sm font-semibold tracking-wide text-blue-600 hover:text-blue-700`}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        <div className="mb-4 text-right">
          <Link href="/forgotPassword" className="text-sm text-blue-500 hover:underline">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-1 w-full rounded-lg bg-blue-600 px-3 py-2.5 text-[clamp(0.95rem,2vw,1rem)] font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow disabled:opacity-50"
        >
          {loading ? "Please wait..." : "Sign in"}
        </button>

        <p className="text-sm text-center mt-5 text-slate-600">
          Don&apos;t have an account yet?{" "}
          <Link href="/register" className="text-blue-500 hover:underline">
            Create one
          </Link>
        </p>
      </form>
    </div>
  );
}


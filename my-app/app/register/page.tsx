"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const userTypeRef = useRef<HTMLDivElement | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState("");
  const [isUserTypeOpen, setIsUserTypeOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const userTypeOptions = [
    { value: "Buyer", label: "Buyer (Large Enterprises)" },
    { value: "Seller", label: "Seller (MSME)" },
    { value: "Financier", label: "Financier" },
  ] as const;
  const userTypeTone: Record<(typeof userTypeOptions)[number]["value"], string> = {
    Buyer: "bg-sky-500",
    Seller: "bg-emerald-500",
    Financier: "bg-amber-400",
  };

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!userTypeRef.current) return;
      if (!userTypeRef.current.contains(event.target as Node)) {
        setIsUserTypeOpen(false);
      }
    };

    window.addEventListener("mousedown", onClickOutside);
    return () => window.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setAnimateIn(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!userType) {
      setError("Please select account type");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, userType }),
      });

      const raw = await res.text();
      let data: { message?: string } = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = {};
      }

      if (!res.ok) {
        const fallback = raw && !raw.trim().startsWith("<")
          ? raw
          : `Request failed (${res.status}). Please try again.`;
        setError(data.message || fallback);
        return;
      }

      setSuccess("Registration successful. Redirecting to verification...");
      setTimeout(() => {
        router.replace("/verification");
      }, 1500);
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
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-50" />
      <form
        onSubmit={handleRegister}
        className={`relative z-10 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl transition-all duration-700 sm:p-8 ${
          animateIn ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-95 opacity-0"
        }`}
      >
        <h2 className={`text-center text-[clamp(1.5rem,3vw,2rem)] font-bold text-slate-900 transition-all delay-100 duration-700 ${
          animateIn ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}>Create your account</h2>
        <p className={`mb-6 mt-1 text-center text-[clamp(0.9rem,2vw,1rem)] text-slate-500 transition-all delay-150 duration-700 ${
          animateIn ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}>
          Join and continue to your dashboard
        </p>
        {error && (
          <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
        )}
        {success && (
          <p className="text-green-600 text-sm mb-4 text-center">{success}</p>
        )}

        <div ref={userTypeRef} className="relative mb-4">
          <button
            type="button"
            onClick={() => setIsUserTypeOpen((prev) => !prev)}
            className="flex w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-left text-[clamp(0.95rem,2vw,1rem)] text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            aria-haspopup="listbox"
            aria-expanded={isUserTypeOpen}
          >
            <span className={userType ? "text-slate-900" : "text-slate-400"}>
              {userTypeOptions.find((option) => option.value === userType)?.label || "Select type"}
            </span>
            <svg
              className={`h-4 w-4 text-slate-400 transition-transform ${isUserTypeOpen ? "rotate-180" : ""}`}
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {isUserTypeOpen ? (
            <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
              {userTypeOptions.map((option) => {
                const isActive = userType === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setUserType(option.value);
                      setIsUserTypeOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition ${
                      isActive
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                    role="option"
                    aria-selected={isActive}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${userTypeTone[option.value]}`} />
                    {option.label}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <input
          type="text"
          placeholder="Full Name"
          className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-[clamp(0.95rem,2vw,1rem)] text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
        />

        <input
          type="email"
          placeholder="Email"
          className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-[clamp(0.95rem,2vw,1rem)] text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <div className="relative mb-5">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-20 text-[clamp(0.95rem,2vw,1rem)] text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$"
            title="Minimum 8 characters with uppercase, lowercase, number and special character"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-0 px-3 text-sm font-semibold tracking-wide text-blue-600 hover:text-blue-700"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-1 w-full rounded-lg bg-blue-600 px-3 py-2.5 font-medium text-[clamp(0.95rem,2vw,1rem)] text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>

        <p className="text-sm text-center mt-5 text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-500 hover:underline">Sign in</Link>
        </p>
      </form>
    </div>
  );
}



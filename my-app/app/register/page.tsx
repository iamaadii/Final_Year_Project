"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const roleOptions = [
  {
    value: "Buyer",
    label: "Enterprise Buyer",
    description: "Automate AP, compliance, and treasury operations.",
  },
  {
    value: "Seller",
    label: "MSME Supplier",
    description: "Track receivables, compliance, and payment predictions.",
  },
] as const;

type RoleValue = (typeof roleOptions)[number]["value"];

const JOB_TITLES = [
  "Chief Financial Officer (CFO)",
  "Finance Manager",
  "Accountant",
  "Tax Consultant",
  "Business Owner",
  "Managing Director",
  "Operations Manager",
  "Chartered Accountant (CA)",
  "Credit Manager",
  "Treasury Lead",
  "Procurement Head",
  "AP/AR Clerk",
  "Company Secretary",
  "Financial Controller",
];

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [designation, setDesignation] = useState("");
  const [showJobDropdown, setShowJobDropdown] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState<RoleValue>("Buyer");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setAnimateIn(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, userType, companyName, designation, dpdpConsent: true }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error?.message || `Request failed (${res.status}). Please try again.`);
        return;
      }

      setSuccess("Registration successful. Redirecting to verification...");
      setTimeout(() => {
        router.replace("/verification");
      }, 1200);
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
        onSubmit={handleRegister}
        className={`relative z-10 w-full max-w-lg rounded-3xl border border-white/80 bg-white/90 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.12)] transition-all duration-700 sm:p-8 ${
          animateIn ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-95 opacity-0"
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
            Create your account
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Choose your role and continue to verification.
          </p>
        </div>

        {error && <p className="mt-5 text-center text-sm text-rose-600">{error}</p>}
        {success && <p className="mt-5 text-center text-sm text-emerald-600">{success}</p>}

        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Select role</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {roleOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setUserType(option.value)}
                className={`rounded-2xl border px-4 py-3 text-left transition ${
                  userType === option.value
                    ? "border-[#0f1b2d] bg-[#0f1b2d] text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-[#1b5b6a]"
                }`}
              >
                <p className="text-sm font-semibold">{option.label}</p>
                <p className={`mt-1 text-xs ${userType === option.value ? "text-white/80" : "text-slate-500"}`}>
                  {option.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Company name</label>
              <input
                type="text"
                placeholder="Business entity name"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-[#0f1b2d] focus:outline-none focus:ring-2 focus:ring-[#0f1b2d]/10"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </div>
            <div className="relative">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Job Title</label>
              <input
                type="text"
                placeholder="e.g. CFO, Accountant"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-[#0f1b2d] focus:outline-none focus:ring-2 focus:ring-[#0f1b2d]/10"
                value={designation}
                onFocus={() => setShowJobDropdown(true)}
                onChange={(e) => {
                  setDesignation(e.target.value);
                  setShowJobDropdown(true);
                }}
              />
              {showJobDropdown && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl animate-in fade-in slide-in-from-top-1">
                  <div className="sticky top-0 bg-slate-50 p-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Suggestions
                  </div>
                  {JOB_TITLES.filter((t) => t.toLowerCase().includes(designation.toLowerCase())).length > 0 ? (
                    JOB_TITLES.filter((t) => t.toLowerCase().includes(designation.toLowerCase())).map((title) => (
                      <button
                        key={title}
                        type="button"
                        className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-[#e0f2f1] hover:text-[#1b5b6a] transition-colors"
                        onClick={() => {
                          setDesignation(title);
                          setShowJobDropdown(false);
                        }}
                      >
                        {title}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-xs text-slate-400 italic">No matches found. Typing custom...</div>
                  )}
                </div>
              )}
              {showJobDropdown && (
                <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowJobDropdown(false)} />
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Administrator name</label>
            <input
              type="text"
              placeholder="Your full name"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-[#0f1b2d] focus:outline-none focus:ring-2 focus:ring-[#0f1b2d]/10"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>

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
                placeholder="Minimum 8 characters"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-20 text-sm text-slate-900 placeholder-slate-400 focus:border-[#0f1b2d] focus:outline-none focus:ring-2 focus:ring-[#0f1b2d]/10"
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
                className="absolute inset-y-0 right-0 px-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#1b5b6a]"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          
          <div className="flex items-start gap-3 mt-2">
            <input
              type="checkbox"
              id="dpdpConsent"
              required
              className="mt-1 h-4 w-4 rounded border-slate-300 text-[#0f1b2d] focus:ring-[#0f1b2d]"
            />
            <label htmlFor="dpdpConsent" className="text-xs text-slate-600">
              I consent to the collection and processing of my personal data in accordance with the <strong>DPDP Act 2023</strong>. I understand I can withdraw consent at any time from my privacy settings.
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-full bg-[#0f1b2d] px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#142338] disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[#1b5b6a] hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}

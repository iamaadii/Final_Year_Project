"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type VerificationFormProps = {
  userType: string;
};

export default function VerificationForm({ userType }: VerificationFormProps) {
  const router = useRouter();
  const [gstNumber, setGstNumber] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [udhyamNumber, setUdhyamNumber] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setAnimateIn(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (userType === "Seller" && !udhyamNumber.trim()) {
      setError("Udyam number is required for MSME supplier accounts");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gstNumber, panNumber, udhyamNumber, contactNumber }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message || "Could not save verification details");
        return;
      }

      setSuccess("Verification details saved. Redirecting...");
      setIsTransitioning(true);
      setTimeout(() => {
        router.replace(data.redirectTo || "/buyer/dashboard");
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
        onSubmit={handleSubmit}
        className={`relative z-10 w-full max-w-lg rounded-3xl border border-white/80 bg-white/90 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.12)] transition-all duration-700 sm:p-8 ${
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
            Business verification
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Complete your statutory details to activate the platform.
          </p>
        </div>

        {error && <p className="mt-5 text-center text-sm text-rose-600">{error}</p>}
        {success && <p className="mt-5 text-center text-sm text-emerald-600">{success}</p>}

        <div className="mt-6 grid gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">PAN Number</label>
            <input
              type="text"
              placeholder="ABCDE1234F"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm uppercase text-slate-900 placeholder-slate-400 focus:border-[#0f1b2d] focus:outline-none focus:ring-2 focus:ring-[#0f1b2d]/10"
              value={panNumber}
              onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
              pattern="^[A-Z]{5}[0-9]{4}[A-Z]{1}$"
              title="PAN format: ABCDE1234F"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">GST Number</label>
            <input
              type="text"
              placeholder="22AAAAA0000A1Z5"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm uppercase text-slate-900 placeholder-slate-400 focus:border-[#0f1b2d] focus:outline-none focus:ring-2 focus:ring-[#0f1b2d]/10"
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
              pattern="^[0-9]{2}[A-Za-z]{5}[0-9]{4}[A-Za-z][1-9A-Za-z]Z[0-9A-Za-z]$"
              title="GSTIN must be 15 characters (example: 22AAAAA0000A1Z5)"
              required
            />
          </div>

          {userType === "Seller" && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Udyam Number</label>
              <input
                type="text"
                placeholder="UDYAM-MH-12-1234567"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm uppercase text-slate-900 placeholder-slate-400 focus:border-[#0f1b2d] focus:outline-none focus:ring-2 focus:ring-[#0f1b2d]/10"
                value={udhyamNumber}
                onChange={(e) => setUdhyamNumber(e.target.value.toUpperCase())}
                pattern="^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$"
                title="Udyam format: UDYAM-MH-12-1234567"
                required
              />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Contact Number</label>
            <div className="mt-2 flex items-stretch rounded-xl border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-[#0f1b2d]/10">
              <div className="flex items-center gap-2 border-r border-slate-200 px-3 text-sm text-slate-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/india-flag.svg" alt="India" className="h-4 w-6 rounded-[2px]" />
                <span className="font-medium">+91</span>
              </div>
              <input
                type="tel"
                placeholder="10-digit mobile"
                className="w-full bg-transparent px-3 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                pattern="^[6-9][0-9]{9}$"
                title="Enter a valid 10-digit mobile number"
                required
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-full bg-[#0f1b2d] px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#142338] disabled:opacity-60"
        >
          {loading ? "Saving..." : "Submit verification"}
        </button>
      </form>
    </div>
  );
}

"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
      setError("Udyam number is required for seller accounts");
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
    <div
      className="flex min-h-screen items-center justify-center bg-cover bg-center bg-no-repeat px-4 py-8"
      style={{
        backgroundImage:
          "radial-gradient(circle at 25% 20%, rgba(59,130,246,0.2) 0%, transparent 38%), radial-gradient(circle at 78% 30%, rgba(16,185,129,0.13) 0%, transparent 35%), radial-gradient(circle at 50% 80%, rgba(249,115,22,0.11) 0%, transparent 44%), linear-gradient(135deg, #020617 0%, #0f172a 55%, #030712 100%)",
      }}
    >
      <form
        onSubmit={handleSubmit}
        className={`w-full max-w-md rounded-xl border border-white/15 bg-black/55 p-6 shadow-2xl backdrop-blur-md transition-all duration-700 sm:p-8 ${
          isTransitioning
            ? "-translate-y-2 scale-95 opacity-0"
            : animateIn
              ? "translate-y-0 scale-100 opacity-100"
              : "translate-y-4 scale-95 opacity-0"
        }`}
      >
        <h2 className={`text-center text-[clamp(1.5rem,3vw,2rem)] font-bold text-white transition-all delay-100 duration-700 ${
          animateIn ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}>Verification</h2>
        <p className={`mb-6 mt-1 text-center text-[clamp(0.9rem,2vw,1rem)] text-zinc-300 transition-all delay-150 duration-700 ${
          animateIn ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}>
          Please complete your business details
        </p>

        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        {success && <p className="text-green-600 text-sm mb-4 text-center">{success}</p>}

        <input
          type="text"
          placeholder="PAN Number"
          className={`mb-4 w-full rounded-lg border border-white/20 px-3 py-2.5 text-[clamp(0.95rem,2vw,1rem)] ${
            panNumber
              ? "bg-white text-slate-900 placeholder-slate-500"
              : "bg-white/10 text-white placeholder-zinc-300"
          }`}
          value={panNumber}
          onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
          pattern="^[A-Z]{5}[0-9]{4}[A-Z]{1}$"
          title="PAN format: ABCDE1234F"
          required
        />

        <input
          type="text"
          placeholder="GST Number"
          className={`mb-4 w-full rounded-lg border border-white/20 px-3 py-2.5 text-[clamp(0.95rem,2vw,1rem)] ${
            gstNumber
              ? "bg-white text-slate-900 placeholder-slate-500"
              : "bg-white/10 text-white placeholder-zinc-300"
          }`}
          value={gstNumber}
          onChange={(e) => setGstNumber(e.target.value)}
          pattern="^[0-9]{2}[A-Za-z]{5}[0-9]{4}[A-Za-z][1-9A-Za-z]Z[0-9A-Za-z]$"
          title="GSTIN must be 15 characters (example: 22AAAAA0000A1Z5)"
          required
        />

        {userType === "Seller" && (
          <input
            type="text"
            placeholder="Udyam Number"
            className={`mb-4 w-full rounded-lg border border-white/20 px-3 py-2.5 text-[clamp(0.95rem,2vw,1rem)] ${
              udhyamNumber
                ? "bg-white text-slate-900 placeholder-slate-500"
                : "bg-white/10 text-white placeholder-zinc-300"
            }`}
            value={udhyamNumber}
            onChange={(e) => setUdhyamNumber(e.target.value.toUpperCase())}
            pattern="^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$"
            title="Udyam format: UDYAM-MH-12-1234567"
            required
          />
        )}

        <div
          className={`mb-5 flex items-stretch rounded-lg border border-white/20 ${
            contactNumber ? "bg-white" : "bg-white/10"
          }`}
        >
          <div className="flex items-center gap-2 border-r border-white/20 px-3 text-[clamp(0.95rem,2vw,1rem)] text-zinc-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/india-flag.svg" alt="India" className="h-4 w-6 rounded-[2px]" />
            <span className="font-medium mr-2">+91</span>
          </div>
          <input
            type="tel"
            placeholder="Contact Number"
            className={`w-full bg-transparent px-3 py-2.5 text-[clamp(0.95rem,2vw,1rem)] outline-none ${
              contactNumber ? "text-slate-900 placeholder-slate-500" : "text-white placeholder-zinc-300"
            }`}
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
            pattern="^[6-9][0-9]{9}$"
            title="Enter a valid 10-digit mobile number"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-indigo-500 px-3 py-2.5 text-[clamp(0.95rem,2vw,1rem)] text-white hover:bg-indigo-600 disabled:bg-indigo-300"
        >
          {loading ? "Saving..." : "Submit verification"}
        </button>
      </form>
    </div>
  );
}



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
      className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-50" />

      <form
        onSubmit={handleSubmit}
        className={`relative z-10 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl transition-all duration-700 sm:p-8 ${
          isTransitioning
            ? "-translate-y-2 scale-95 opacity-0"
            : animateIn
              ? "translate-y-0 scale-100 opacity-100"
              : "translate-y-4 scale-95 opacity-0"
        }`}
      >
        <h2 className={`text-center text-[clamp(1.5rem,3vw,2rem)] font-bold text-slate-900 transition-all delay-100 duration-700 ${
          animateIn ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}>Verification</h2>
        <p className={`mb-6 mt-1 text-center text-[clamp(0.9rem,2vw,1rem)] text-slate-500 transition-all delay-150 duration-700 ${
          animateIn ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}>
          Please complete your business details
        </p>

        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        {success && <p className="text-green-600 text-sm mb-4 text-center">{success}</p>}

        <input
          type="text"
          placeholder="PAN Number"
          className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-[clamp(0.95rem,2vw,1rem)] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white uppercase"
          value={panNumber}
          onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
          pattern="^[A-Z]{5}[0-9]{4}[A-Z]{1}$"
          title="PAN format: ABCDE1234F"
          required
        />

        <input
          type="text"
          placeholder="GST Number"
          className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-[clamp(0.95rem,2vw,1rem)] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white uppercase"
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
            className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-[clamp(0.95rem,2vw,1rem)] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white uppercase"
            value={udhyamNumber}
            onChange={(e) => setUdhyamNumber(e.target.value.toUpperCase())}
            pattern="^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$"
            title="Udyam format: UDYAM-MH-12-1234567"
            required
          />
        )}

        <div
          className={`mb-5 flex items-stretch rounded-lg border focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent bg-white ${
            contactNumber ? "border-slate-300" : "border-slate-300"
          }`}
        >
          <div className="flex items-center gap-2 border-r border-slate-200 px-3 text-[clamp(0.95rem,2vw,1rem)] text-slate-700">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/india-flag.svg" alt="India" className="h-4 w-6 rounded-[2px]" />
            <span className="font-medium mr-2">+91</span>
          </div>
          <input
            type="tel"
            placeholder="Contact Number"
            className="w-full bg-transparent px-3 py-2.5 text-[clamp(0.95rem,2vw,1rem)] text-slate-900 placeholder-slate-400 outline-none"
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
          className="w-full rounded-lg bg-blue-600 px-3 py-2.5 text-[clamp(0.95rem,2vw,1rem)] font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow disabled:opacity-50"
        >
          {loading ? "Saving..." : "Submit verification"}
        </button>
      </form>
    </div>
  );
}



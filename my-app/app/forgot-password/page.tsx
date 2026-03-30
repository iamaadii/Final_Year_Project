"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setAnimateIn(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  const sendOtp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/forgot-password/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error?.message || "Could not send OTP");
        return;
      }

      setSuccess(data?.data?.message || "OTP sent to your registered email.");
      setStep("otp");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/forgot-password/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error?.message || "Invalid OTP");
        return;
      }

      const token = data?.data?.resetToken;
      if (!token) {
        setError("Reset session missing. Please try again.");
        return;
      }

      router.push(`/reset-password?token=${encodeURIComponent(token)}`);
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
        onSubmit={step === "email" ? sendOtp : verifyOtp}
        className={`relative z-10 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl transition-all duration-700 sm:p-8 ${
          animateIn ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-95 opacity-0"
        }`}
      >
        <h2 className={`text-center text-[clamp(1.5rem,3vw,2rem)] font-bold text-slate-900 transition-all delay-100 duration-700 ${
          animateIn ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}>Forgot password</h2>
        <p className={`mb-6 mt-1 text-center text-[clamp(0.9rem,2vw,1rem)] text-slate-500 transition-all delay-150 duration-700 ${
          animateIn ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}>
          {step === "email"
            ? "Enter your registered email to receive OTP"
            : "Enter the 6-digit OTP sent to your email"}
        </p>

        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        {success && <p className="text-green-600 text-sm mb-4 text-center">{success}</p>}

        <input
          type="email"
          placeholder="Email"
          className={`mb-4 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-[clamp(0.95rem,2vw,1rem)] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white`}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={step === "otp"}
        />

        {step === "otp" && (
          <input
            type="text"
            placeholder="6-digit OTP"
            className={`mb-5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-[clamp(0.95rem,2vw,1rem)] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white`}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
            required
          />
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#0f1b2d] px-3 py-2.5 text-[clamp(0.95rem,2vw,1rem)] font-medium text-white shadow-sm transition-all hover:bg-[#142338] hover:shadow disabled:opacity-50"
        >
          {loading
            ? "Please wait..."
            : step === "email"
              ? "Send OTP"
              : "Verify OTP"}
        </button>

        <p className="text-sm text-center mt-5 text-slate-600">
          Back to{" "}
          <Link href="/login" className="text-[#1b5b6a] hover:underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}



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
        setError(data.message || "Could not send OTP");
        return;
      }

      setSuccess("OTP sent to your registered email.");
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
        setError(data.message || "Invalid OTP");
        return;
      }

      router.push(`/resetPassword?token=${encodeURIComponent(data.resetToken)}`);
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
          "radial-gradient(circle at 20% 18%, rgba(56,189,248,0.2) 0%, transparent 38%), radial-gradient(circle at 82% 22%, rgba(99,102,241,0.16) 0%, transparent 36%), radial-gradient(circle at 52% 78%, rgba(34,197,94,0.1) 0%, transparent 43%), linear-gradient(135deg, #020617 0%, #0f172a 58%, #030712 100%)",
      }}
    >
      <form
        onSubmit={step === "email" ? sendOtp : verifyOtp}
        className={`w-full max-w-md rounded-xl border border-white/15 bg-black/55 p-6 shadow-2xl backdrop-blur-md transition-all duration-700 sm:p-8 ${
          animateIn ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-95 opacity-0"
        }`}
      >
        <h2 className={`text-center text-[clamp(1.5rem,3vw,2rem)] font-bold text-white transition-all delay-100 duration-700 ${
          animateIn ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}>Forgot password</h2>
        <p className={`mb-6 mt-1 text-center text-[clamp(0.9rem,2vw,1rem)] text-zinc-300 transition-all delay-150 duration-700 ${
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
          className={`mb-4 w-full rounded-lg border border-white/20 px-3 py-2.5 text-[clamp(0.95rem,2vw,1rem)] ${
            email
              ? "bg-white text-slate-900 placeholder-slate-500"
              : "bg-white/10 text-white placeholder-zinc-300"
          }`}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={step === "otp"}
        />

        {step === "otp" && (
          <input
            type="text"
            placeholder="6-digit OTP"
            className={`mb-5 w-full rounded-lg border border-white/20 px-3 py-2.5 text-[clamp(0.95rem,2vw,1rem)] ${
              otp
                ? "bg-white text-slate-900 placeholder-slate-500"
                : "bg-white/10 text-white placeholder-zinc-300"
            }`}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
            required
          />
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-500 px-3 py-2.5 text-[clamp(0.95rem,2vw,1rem)] text-white hover:bg-blue-600 disabled:bg-blue-300"
        >
          {loading
            ? "Please wait..."
            : step === "email"
              ? "Send OTP"
              : "Verify OTP"}
        </button>

        <p className="text-sm text-center mt-4 text-zinc-200">
          Back to{" "}
          <Link href="/login" className="text-blue-500 hover:underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}


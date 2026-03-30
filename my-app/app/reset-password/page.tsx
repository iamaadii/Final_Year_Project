"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetToken = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!resetToken) {
      setError("Reset session missing. Please restart forgot password flow.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken, newPassword, confirmPassword }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error?.message || "Could not reset password");
        return;
      }

      setSuccess(data?.data?.message || "Password updated successfully. Redirecting to login...");
      setTimeout(() => {
        router.replace("/login");
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
        onSubmit={handleReset}
        className="relative z-10 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8"
      >
        <h2 className="text-center text-[clamp(1.5rem,3vw,2rem)] font-bold text-slate-900">Reset password</h2>
        <p className="mb-6 mt-1 text-center text-[clamp(0.9rem,2vw,1rem)] text-slate-500">
          Enter your new password twice to confirm
        </p>

        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        {success && <p className="text-green-600 text-sm mb-4 text-center">{success}</p>}

        <input
          type="password"
          placeholder="New Password"
          className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-[clamp(0.95rem,2vw,1rem)] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          minLength={6}
          required
          autoComplete="new-password"
        />

        <input
          type="password"
          placeholder="Confirm New Password"
          className="mb-5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-[clamp(0.95rem,2vw,1rem)] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          minLength={6}
          required
          autoComplete="new-password"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#0f1b2d] px-3 py-2.5 text-[clamp(0.95rem,2vw,1rem)] font-medium text-white shadow-sm transition-all hover:bg-[#142338] hover:shadow disabled:opacity-50"
        >
          {loading ? "Updating..." : "Update password"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}


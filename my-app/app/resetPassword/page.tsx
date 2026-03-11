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
        setError(data.message || "Could not reset password");
        return;
      }

      setSuccess("Password updated successfully. Redirecting to login...");
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
      className="flex min-h-screen items-center justify-center bg-cover bg-center bg-no-repeat px-4 py-8"
      style={{
        backgroundImage:
          "radial-gradient(circle at 22% 20%, rgba(14,165,233,0.2) 0%, transparent 40%), radial-gradient(circle at 80% 24%, rgba(59,130,246,0.15) 0%, transparent 36%), radial-gradient(circle at 52% 80%, rgba(236,72,153,0.1) 0%, transparent 44%), linear-gradient(135deg, #020617 0%, #111827 56%, #030712 100%)",
      }}
    >
      <form
        onSubmit={handleReset}
        className="w-full max-w-md rounded-xl border border-white/15 bg-black/55 p-6 shadow-2xl backdrop-blur-md sm:p-8"
      >
        <h2 className="text-center text-[clamp(1.5rem,3vw,2rem)] font-bold text-white">Reset password</h2>
        <p className="mb-6 mt-1 text-center text-[clamp(0.9rem,2vw,1rem)] text-zinc-300">
          Enter your new password twice to confirm
        </p>

        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        {success && <p className="text-green-600 text-sm mb-4 text-center">{success}</p>}

        <input
          type="password"
          placeholder="New Password"
          className="mb-4 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-[clamp(0.95rem,2vw,1rem)] text-white placeholder-zinc-300"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          minLength={6}
          required
          autoComplete="new-password"
        />

        <input
          type="password"
          placeholder="Confirm New Password"
          className="mb-5 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-[clamp(0.95rem,2vw,1rem)] text-white placeholder-zinc-300"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          minLength={6}
          required
          autoComplete="new-password"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-500 px-3 py-2.5 text-[clamp(0.95rem,2vw,1rem)] text-white hover:bg-blue-600 disabled:bg-blue-300"
        >
          {loading ? "Updating..." : "Update password"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050607]" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}

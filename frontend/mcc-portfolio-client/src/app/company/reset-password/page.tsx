"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock, ShieldAlert, CheckCircle2 } from "lucide-react";
import api from "@/services/api";
import { useTheme } from "@/hooks/useTheme";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";
  const tokenParam = searchParams.get("token") || "";

  const [email, setEmail] = useState(emailParam);
  const [token, setToken] = useState(tokenParam);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (emailParam) setEmail(emailParam);
    if (tokenParam) setToken(tokenParam);
  }, [emailParam, tokenParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !token || !newPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const res = await api.post("/Company/Auth/reset-password", {
        email,
        token,
        newPassword,
      });

      setSuccess(res.data.message);
      setTimeout(() => {
        router.push("/company/login");
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-3xl p-8 md:p-10 shadow-2xl space-y-6 border border-slate-200/80 dark:border-white/10 bg-white/40 dark:bg-white/[0.02] backdrop-blur-xl">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-black tracking-tight">Set New Password</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Create a secure password for your HR placement console account
        </p>
      </div>

      {!success ? (
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div>
            <label className="text-[11px] uppercase tracking-wider font-extrabold block mb-1 text-slate-700 dark:text-slate-300">
              Registered HR Email
            </label>
            <input
              type="email"
              required
              disabled={!!emailParam}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border text-sm px-4 py-3 rounded-xl outline-none transition bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-blue-500 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider font-extrabold block mb-1 text-slate-700 dark:text-slate-300">
              Reset Token
            </label>
            <input
              type="text"
              required
              disabled={!!tokenParam}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full border text-sm px-4 py-3 rounded-xl outline-none transition bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-blue-500 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider font-extrabold block mb-1 text-slate-700 dark:text-slate-300">
              New Password
            </label>
            <input
              type="password"
              required
              placeholder="Minimum 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border text-sm px-4 py-3 rounded-xl outline-none transition bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider font-extrabold block mb-1 text-slate-700 dark:text-slate-300">
              Confirm Password
            </label>
            <input
              type="password"
              required
              placeholder="Re-type password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border text-sm px-4 py-3 rounded-xl outline-none transition bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-blue-500"
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs p-3.5 rounded-xl flex items-center gap-2.5">
              <ShieldAlert size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider transition-all duration-200 shadow-xl cursor-pointer disabled:opacity-50"
          >
            {loading ? "Resetting Password..." : "Reset Password"}
          </button>
        </form>
      ) : (
        <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs p-4 rounded-xl flex items-start gap-2.5">
          <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
          <span className="leading-relaxed">{success}</span>
        </div>
      )}
    </div>
  );
}

export default function CompanyResetPasswordPage() {
  const [themeMode] = useTheme();
  const isDark = themeMode === "dark";

  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}
      className={`min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-300 ${
        isDark ? "bg-[#090d16] text-slate-100" : "bg-[#faf9f6] text-slate-900"
      }`}
    >
      <div className="w-full max-w-md space-y-6">
        <Link
          href="/company/login"
          className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-500 hover:text-blue-500 transition duration-200"
        >
          <ArrowLeft size={16} /> Cancel
        </Link>
        <Suspense fallback={<div className="text-center py-6 text-sm text-slate-500">Loading reset form...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}

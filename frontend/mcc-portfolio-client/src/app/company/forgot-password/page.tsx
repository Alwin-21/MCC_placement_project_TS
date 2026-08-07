"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, ShieldAlert, CheckCircle2, KeyRound } from "lucide-react";
import api from "@/services/api";
import { useTheme } from "@/hooks/useTheme";

export default function CompanyForgotPasswordPage() {
  const [themeMode] = useTheme();
  const isDark = themeMode === "dark";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [simToken, setSimToken] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your registered HR email.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const res = await api.post("/Company/Auth/forgot-password", { email });
      setSuccess(res.data.message);

      if (res.data.simulatedToken) {
        setSimToken(res.data.simulatedToken);
      }
    } catch (err: any) {
      setError(err.response?.data || "Failed to submit request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}
      className={`min-h-screen flex items-center justify-center p-6 transition-colors duration-300 ${
        isDark ? "bg-[#090d16] text-slate-100" : "bg-[#faf9f6] text-slate-900"
      }`}
    >
      <div className="w-full max-w-md space-y-6">
        <Link
          href="/company/login"
          className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-500 hover:text-[#781c1c] dark:hover:text-red-400 transition duration-200"
        >
          <ArrowLeft size={16} /> Back to Login
        </Link>

        <div className="glass-card rounded-3xl p-8 md:p-10 shadow-2xl space-y-6 border border-slate-200/80 dark:border-white/10 bg-white/40 dark:bg-white/[0.02] backdrop-blur-xl">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto shadow-md">
              <KeyRound size={24} />
            </div>
            <h1 className="text-2xl font-black tracking-tight">Forgot Password</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Enter your official HR email and we will send you instructions to reset your account password.
            </p>
          </div>

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              <div>
                <label className="text-[11px] uppercase tracking-wider font-extrabold block mb-2 text-slate-700 dark:text-slate-300">
                  Official HR Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
                  <input
                    type="email"
                    required
                    placeholder="hr@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border text-sm pl-11 pr-4 py-3.5 rounded-xl outline-none transition bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-[#781c1c] dark:focus:border-red-500"
                  />
                </div>
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
                className="w-full py-4 rounded-xl bg-[#781c1c] hover:bg-[#5f1515] text-white font-extrabold text-xs uppercase tracking-wider transition-all duration-200 shadow-xl shadow-red-900/20 hover:shadow-red-900/40 cursor-pointer disabled:opacity-50"
              >
                {loading ? "Sending Request..." : "Request Reset Link"}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs p-4 rounded-xl flex items-start gap-2.5">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                <span className="leading-relaxed">{success}</span>
              </div>

              {simToken && (
                <div className="p-5 rounded-2xl border border-red-200 dark:border-red-800/40 bg-red-500/5 space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-500 dark:text-red-400 block">
                    Developer Walkthrough Helper
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    A password reset token was simulated. Click below to reset the password immediately:
                  </p>
                  <Link
                    href={`/company/reset-password?email=${encodeURIComponent(email)}&token=${simToken}`}
                    className="inline-block w-full py-2.5 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-500 dark:text-red-300 font-extrabold text-xs uppercase text-center transition"
                  >
                    Reset Password Now
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

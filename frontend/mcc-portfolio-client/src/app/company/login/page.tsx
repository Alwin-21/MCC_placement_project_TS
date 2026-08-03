"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Lock,
  ShieldAlert,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Building2,
} from "lucide-react";
import api from "@/services/api";
import { useTheme } from "@/hooks/useTheme";

export default function CompanyLoginPage() {
  const router = useRouter();
  const [themeMode, toggleThemeMode] = useTheme();
  const isDark = themeMode === "dark";

  // Redirect if already authenticated as an HR user
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");
      if (token && user) {
        try {
          const parsed = JSON.parse(user);
          if (parsed?.role === "Company") {
            router.replace("/company/dashboard");
          }
        } catch {}
      }
    }
  }, [router]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter your official email and password.");
      return;
    }
    try {
      setLoading(true);
      setError("");

      const response = await api.post("/Company/Auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data));

      if (rememberMe) {
        localStorage.setItem("rememberCompanyEmail", email);
      } else {
        localStorage.removeItem("rememberCompanyEmail");
      }

      router.push("/company/dashboard");
    } catch (err: any) {
      let errorMsg = "Invalid email or password.";
      if (err.response?.data) {
        if (typeof err.response.data === "string") {
          errorMsg = err.response.data;
        } else if (err.response.data.message) {
          errorMsg = err.response.data.message;
        }
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedEmail = localStorage.getItem("rememberCompanyEmail");
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    }
  }, []);

  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}
      className={`min-h-screen flex transition-colors duration-300 ${
        isDark ? "bg-[#090d16] text-slate-100" : "bg-[#faf9f6] text-slate-900"
      }`}
    >
      {/* FLOATING DARK/LIGHT MODE TOGGLE */}
      <button
        onClick={toggleThemeMode}
        aria-label="Toggle dark mode"
        className={`fixed top-5 right-5 z-50 p-2.5 rounded-full transition-all duration-300 cursor-pointer shadow-lg backdrop-blur-md border flex items-center justify-center ${
          isDark
            ? "bg-white/10 hover:bg-white/20 text-amber-300 border-white/15"
            : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
        }`}
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* ── LEFT PANEL: DRONE VIDEO SHOWCASE (DESKTOP) ───────────────────── */}
      <div className="hidden lg:flex lg:w-6/12 relative text-white p-14 flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 z-0 bg-[#090d16]">
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            src="/new.mp4"
            className="w-full h-full object-cover filter brightness-105 contrast-105"
          />
          <div className="absolute inset-0 bg-black/45" />
        </div>

        <div className="relative z-10" />

        {/* Hero Overlay Copy - Dark Glass Container for high contrast */}
        <div className="relative z-10 max-w-lg p-10 rounded-3xl bg-[#090d16]/50 border border-white/10 backdrop-blur-md shadow-2xl space-y-6">
          <div className="w-12 h-12 bg-blue-500/20 text-blue-300 rounded-2xl flex items-center justify-center">
            <Building2 size={24} />
          </div>
          <h2 className="text-4xl font-black text-white leading-tight tracking-tight drop-shadow-md">
            Connect with MCC <span className="text-blue-400">talent</span> & onboard placement <span className="text-amber-300">drives</span>.
          </h2>

          <p className="text-sm text-slate-100 leading-relaxed font-medium">
            Register your company workspace, upload authorization documents, review candidate resumes, and manage interview schedules from the placement cell portal.
          </p>
        </div>

        <div className="relative z-10 text-[11px] font-mono text-slate-300 tracking-wider font-extrabold">
          PLACEMENT OFFICE · CHENNAI, INDIA
        </div>
      </div>

      {/* ── RIGHT PANEL: LOGIN FORM SECTION ─────────────────────────────── */}
      <div className="w-full lg:w-6/12 flex items-center justify-center p-6 md:p-12 relative overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          {/* Back Home Button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-500 hover:text-blue-500 transition duration-200"
          >
            <ArrowLeft size={16} /> Back to Home
          </Link>

          <div className="lg:hidden flex items-center gap-3.5 pb-2">
            <div>
              <span
                className="text-lg font-black uppercase tracking-wider block"
                style={{ color: isDark ? "#ffffff" : "#1e40af" }}
              >
                Placement Cell
              </span>
            </div>
          </div>

          {/* Login Form Container Card */}
          <div className="glass-card rounded-3xl p-8 md:p-10 shadow-2xl space-y-6 border border-slate-200/80 dark:border-white/10 bg-white/40 dark:bg-white/[0.02] backdrop-blur-xl">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-black tracking-tight">
                Company Sign In
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Enter your HR credentials to manage placement activities
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4" autoComplete="off" aria-label="HR Login Form" noValidate>
              <div>
                <label className="text-[11px] uppercase tracking-wider font-extrabold block mb-2 text-slate-700 dark:text-slate-300">
                  Official HR Email
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-4 top-3.5 text-slate-400"
                    size={18}
                  />
                  <input
                    type="email"
                    required
                    placeholder="hr@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="w-full border text-sm pl-11 pr-4 py-3.5 rounded-xl outline-none transition bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 dark:focus:border-blue-400"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[11px] uppercase tracking-wider font-extrabold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <Link
                    href="/company/forgot-password"
                    className="text-xs font-semibold text-blue-500 dark:text-blue-400 hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock
                    className="absolute left-4 top-3.5 text-slate-400"
                    size={18}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full border text-sm pl-11 pr-12 py-3.5 rounded-xl outline-none transition bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 dark:focus:border-blue-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 dark:border-white/10 accent-blue-600 cursor-pointer w-4 h-4"
                />
                <label
                  htmlFor="rememberMe"
                  className="text-xs font-semibold text-slate-500 dark:text-slate-400 cursor-pointer select-none"
                >
                  Remember my HR email
                </label>
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
                className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider transition-all duration-200 shadow-xl shadow-blue-900/20 hover:shadow-blue-900/40 cursor-pointer active:scale-98 disabled:opacity-50 mt-2"
              >
                {loading ? "Signing In..." : "Sign In to HR Console"}
              </button>
            </form>
          </div>

          <div className="space-y-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
            <div>
              HR Representative seeking onboarding?{" "}
              <Link
                href="/company/register"
                className="text-blue-600 dark:text-blue-400 font-extrabold hover:underline"
              >
                Register Company
              </Link>
            </div>
            <div>
              Are you a Student?{" "}
              <Link
                href="/login"
                className="text-slate-800 dark:text-red-400 font-extrabold hover:underline"
              >
                Student Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

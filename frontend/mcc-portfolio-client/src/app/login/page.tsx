"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Lock,
  ShieldAlert,
  KeyRound,
  CheckCircle2,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Sparkles,
  Award,
  CheckCircle
} from "lucide-react";
import api from "@/services/api";
import { useTheme } from "@/hooks/useTheme";

export default function LoginPage() {
  const router = useRouter();
  const [themeMode, toggleThemeMode] = useTheme();
  const isDark = themeMode === "dark";
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  }, []);

  const [videoReady, setVideoReady] = useState(false);

  const handleCanPlay = () => {
    if (videoRef.current) {
      if (videoRef.current.currentTime < 6) {
        videoRef.current.currentTime = 6;
      }
      setVideoReady(true);
    }
  };

  // Video handlers to skip the first 6 seconds
  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.currentTime < 6) {
      videoRef.current.currentTime = 6;
    }
  };

  // Login States
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Change Password States (For First Login Requirement)
  const [tempToken, setTempToken] = useState("");
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changeError, setChangeError] = useState("");
  const [changeSuccess, setChangeSuccess] = useState("");
  const [tempResponseData, setTempResponseData] = useState<any>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please enter your username or register number, and password.");
      return;
    }
    try {
      setLoading(true);
      setError("");

      const response = await api.post("/Auth/login", {
        username,
        password,
      });

      // If it is a temporary password, show the change password panel instead of redirecting
      if (response.data.isTemporaryPassword) {
        setTempToken(response.data.token);
        setTempResponseData(response.data);
        setShowChangePasswordModal(true);
        setLoading(false);
        return;
      }

      // Normal Login Success Flow
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data));
      router.push("/dashboard");
    } catch (err: any) {
      let errorMsg = "Invalid username or password";
      if (err.response?.data) {
        if (typeof err.response.data === "string") {
          errorMsg = err.response.data;
        } else if (err.response.data.errors) {
          errorMsg = Object.values(err.response.data.errors).flat().join(", ");
        } else if (err.response.data.message) {
          errorMsg = err.response.data.message;
        }
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError("");
    setChangeSuccess("");

    if (!newPassword || newPassword.length < 6) {
      setChangeError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setChangeError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      // Post to the change-password API using the temporary token
      await api.post(
        "/Auth/change-password",
        {
          newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${tempToken}`,
          },
        }
      );

      setChangeSuccess("Password changed successfully! Redirecting you to the dashboard...");

      // Store credentials and login fully
      setTimeout(() => {
        localStorage.setItem("token", tempToken);
        localStorage.setItem("user", JSON.stringify({
          ...tempResponseData,
          isTemporaryPassword: false,
        }));
        router.push("/dashboard");
      }, 1500);
    } catch (err: any) {
      setChangeError(err.response?.data || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

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
        className={`fixed top-5 right-5 z-50 p-3 rounded-full transition-all duration-300 cursor-pointer shadow-lg backdrop-blur-md border ${
          isDark
            ? "bg-white/10 hover:bg-white/20 text-amber-300 border-white/15"
            : "bg-white/90 hover:bg-slate-100 text-slate-700 border-slate-200"
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
            src="/DJI_0007.mp4"
            className="w-full h-full object-cover filter brightness-105 contrast-105"
          />
          {/* Minimal overlay to keep video fully visible */}
          <div className="absolute inset-0 bg-black/15" />
        </div>

        {/* Top Brand Logo */}
        <div className="relative z-10">
          <img
            src={isDark ? "/mcc-logo-dark.png" : "/mcc-logo.png"}
            alt="MCC Crest"
            className="h-16 sm:h-18 md:h-22 lg:h-24 w-auto object-contain shrink-0"
          />
        </div>

        {/* Hero Overlay Copy */}
        <div className="relative z-10 max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-xs font-extrabold text-amber-300 shadow-md">
            <Sparkles size={14} className="animate-pulse" />
            <span>Official Student Portal</span>
          </div>

          <h2 className="text-4xl font-black text-white leading-tight tracking-tight drop-shadow-md">
            Showcase your academic & professional milestones.
          </h2>

          <p className="text-sm text-slate-200 leading-relaxed font-medium drop-shadow-sm">
            Access your verified student dashboard, build ATS-engineered resumes, manage certifications, and consult the AI Career Advisor.
          </p>

          <div className="pt-2 flex items-center gap-6 text-xs text-slate-200 font-semibold">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-400" />
              <span>Faculty Verified</span>
            </div>
            <div className="flex items-center gap-2">
              <Award size={16} className="text-amber-400" />
              <span>ATS Compliant</span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="relative z-10 text-[11px] font-mono text-slate-300 tracking-wider font-extrabold">
          EST. 1837 · CHENNAI, INDIA
        </div>
      </div>

      {/* ── RIGHT PANEL: LOGIN FORM SECTION ─────────────────────────────── */}
      <div className="w-full lg:w-6/12 flex items-center justify-center p-6 md:p-12 relative overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          {/* Back Home Button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-500 hover:text-[#781c1c] dark:hover:text-red-400 transition duration-200"
          >
            <ArrowLeft size={16} /> Back to Home
          </Link>

          {/* Prominent Logo on Mobile Viewports */}
          <div className="lg:hidden flex items-center gap-3.5 pb-2">
            <img
              src={isDark ? "/mcc-logo-dark.png" : "/mcc-logo.png"}
              alt="MCC Crest"
              className="h-14 w-auto object-contain shrink-0 transition-transform duration-300 group-hover:scale-105"
            />
            <div>
              <span
                className="text-lg font-black uppercase tracking-wider block"
                style={{ color: isDark ? "#ffffff" : "#781c1c" }}
              >
                Portfolios
              </span>
              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                Madras Christian College
              </span>
            </div>
          </div>

          {/* Login Form Container Card */}
          <div className="glass-card rounded-3xl p-8 md:p-10 shadow-2xl space-y-6 border border-slate-200/80 dark:border-white/10">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-black tracking-tight">
                Student Log In
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Enter your credentials to access your account
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
              <div>
                <label className="text-[11px] uppercase tracking-wider font-extrabold block mb-2 text-slate-700 dark:text-slate-300">
                  Username or Register Number
                </label>
                <div className="relative">
                  <User
                    className="absolute left-4 top-3.5 text-slate-400"
                    size={18}
                  />
                  <input
                    type="text"
                    required
                    placeholder="e.g. 25017220370xx"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    className="w-full border text-sm pl-11 pr-4 py-3.5 rounded-xl outline-none transition bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-[#781c1c] dark:focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider font-extrabold block mb-2 text-slate-700 dark:text-slate-300">
                  Password
                </label>
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
                    className="w-full border text-sm pl-11 pr-12 py-3.5 rounded-xl outline-none transition bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-[#781c1c] dark:focus:border-red-500"
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

              {error && (
                <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs p-3.5 rounded-xl flex items-center gap-2.5">
                  <ShieldAlert size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl bg-[#781c1c] hover:bg-[#5f1515] text-white font-extrabold text-xs uppercase tracking-wider transition-all duration-200 shadow-xl shadow-red-900/20 hover:shadow-red-900/40 cursor-pointer active:scale-98 disabled:opacity-50 mt-2"
              >
                {loading ? "Logging in..." : "Sign In to Account"}
              </button>
            </form>
          </div>

          <div className="space-y-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
            <div>
              Don't have an account?{" "}
              <Link
                href="/register"
                className="text-[#781c1c] dark:text-red-400 font-extrabold hover:underline"
              >
                Register here
              </Link>
            </div>
            <div>
              Are you an Admin?{" "}
              <Link
                href="/admin/login"
                className="text-slate-800 dark:text-blue-400 font-extrabold hover:underline"
              >
                Admin Login
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: CHANGE TEMPORARY PASSWORD */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-3xl p-8 shadow-2xl text-left space-y-6 animate-fade-in-up">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto shadow-md">
                <KeyRound size={28} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                Set New Password
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                As a security measure, please update your temporary password before entering the student portal.
              </p>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] uppercase font-extrabold tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5">
                  New Secure Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-[#781c1c] text-slate-900 dark:text-white text-xs px-4 py-3.5 rounded-xl outline-none transition"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase font-extrabold tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-[#781c1c] text-slate-900 dark:text-white text-xs px-4 py-3.5 rounded-xl outline-none transition"
                />
              </div>

              {changeError && (
                <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 text-red-700 dark:text-red-300 text-xs p-3.5 rounded-xl flex items-center gap-2">
                  <ShieldAlert size={16} className="shrink-0" />
                  <span>{changeError}</span>
                </div>
              )}

              {changeSuccess && (
                <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 text-emerald-700 dark:text-emerald-300 text-xs p-3.5 rounded-xl flex items-center gap-2">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>{changeSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl bg-[#781c1c] hover:bg-[#5f1515] text-white font-extrabold text-xs uppercase tracking-wider transition duration-200 cursor-pointer shadow-lg"
              >
                {loading ? "Updating..." : "Update Password & Proceed"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
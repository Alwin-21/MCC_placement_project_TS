"use client";

import Link from "next/link";
import { ArrowRight, Sun, Moon, Sparkles } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export default function HomePage() {
  const [themeMode, toggleThemeMode] = useTheme();
  const isDark = themeMode === "dark";

  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}
      className={`min-h-screen flex flex-col justify-between overflow-x-hidden transition-colors duration-300 ${
        isDark ? "bg-[#090d16] text-slate-100" : "bg-[#faf9f6] text-slate-900"
      }`}
    >
      {/* ── HEADER WITH MOBILE-OPTIMIZED PROMINENT LOGO ─────────────────── */}
      <header
        className={`sticky top-0 z-50 backdrop-blur-2xl border-b transition-all duration-300 ${
          isDark
            ? "bg-[#090d16]/90 border-white/10 shadow-2xl shadow-black/50"
            : "bg-white/95 border-slate-200/90 shadow-md"
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-4">
          {/* Prominent Logo & Brand Link */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-4 group shrink-0">
            {/* Clean Logo without Frame */}
            <img
              src={isDark ? "/mcc-logo-dark.png" : "/mcc-logo.png"}
              alt="Madras Christian College Crest"
              className="h-14 sm:h-18 md:h-22 lg:h-24 w-auto object-contain shrink-0 transition-transform duration-300 group-hover:scale-105"
            />

            {/* Vertical Divider */}
            <div className="h-12 sm:h-16 w-[2px] bg-gradient-to-b from-[#781c1c]/40 via-[#781c1c] to-[#781c1c]/40 dark:from-white/10 dark:via-white/30 dark:to-white/10 hidden sm:block shrink-0" />

            {/* Brand Title */}
            <div className="flex flex-col space-y-0.5">
              <span
                className="text-sm sm:text-xl md:text-2xl font-black uppercase tracking-wider leading-none"
                style={{ color: isDark ? "#ffffff" : "#781c1c" }}
              >
                Portfolios
              </span>
              <span className="text-[11px] sm:text-sm font-extrabold text-slate-700 dark:text-slate-300 tracking-wide">
                Madras Christian College
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-semibold hidden md:block">
                Student Ecosystem
              </span>
            </div>
          </Link>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Dark/Light Mode Switcher */}
            <button
              onClick={toggleThemeMode}
              aria-label="Toggle dark mode"
              className={`p-2.5 sm:p-3 rounded-2xl transition-all duration-300 cursor-pointer border shadow-md ${
                isDark
                  ? "bg-white/10 hover:bg-white/20 text-amber-300 border-white/15"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
              }`}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <Link
              href="/login"
              className="text-xs sm:text-sm font-extrabold text-slate-700 dark:text-slate-200 hover:text-[#781c1c] dark:hover:text-white px-3 sm:px-4 py-2.5 transition-colors hidden sm:block"
            >
              Sign In
            </Link>

            <Link
              href="/register"
              className="px-3.5 sm:px-6 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-extrabold bg-[#781c1c] hover:bg-[#5f1515] text-white shadow-xl shadow-red-900/30 hover:shadow-red-900/50 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-1.5 sm:gap-2.5 group"
            >
              <span>Build Portfolio</span>
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION WITH INSTANT PERMANENTLY CROPPED VIDEO ─────────── */}
      <section className="relative min-h-[calc(100vh-90px)] flex items-center justify-center overflow-hidden py-10 sm:py-14 px-4 flex-1">
        {/* Permanently Cropped Background Drone Video - Plays Instantly with Zero Delay */}
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

          {/* Minimal overlay to ensure maximum video clarity */}
          <div
            className={`absolute inset-0 transition-colors duration-500 ${
              isDark
                ? "bg-black/20"
                : "bg-black/10"
            }`}
          />
        </div>

        {/* Floating Ultra-Translucent Glass Center Card */}
        <div className="relative z-10 max-w-2xl mx-auto text-center px-2 sm:px-4 w-full animate-fade-in-up">
          <div
            className={`rounded-3xl p-8 sm:p-12 shadow-2xl backdrop-blur-sm border transition-all duration-300 ${
              isDark
                ? "bg-black/20 border-white/20 shadow-black/90"
                : "bg-black/20 border-white/25 shadow-2xl text-white"
            }`}
          >
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-extrabold tracking-wide mb-6 shadow-md">
              <Sparkles size={14} className="text-amber-300 animate-pulse" />
              <span>Madras Christian College</span>
            </div>

            {/* Main Headline */}
            <h1
              className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15] mb-4 drop-shadow-lg"
              style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}
            >
              Designed for Academic Excellence.
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-slate-100 max-w-lg mx-auto leading-relaxed font-medium mb-8 drop-shadow-md">
              A minimalist, certified showcase of student portfolios, research, and verified competencies at Madras Christian College.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl text-xs sm:text-sm font-black bg-[#781c1c] hover:bg-[#5f1515] text-white shadow-xl shadow-red-900/50 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
              >
                <span>Build Portfolio</span>
                <ArrowRight size={15} />
              </Link>

              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl text-xs sm:text-sm font-black bg-white/25 hover:bg-white/35 text-white backdrop-blur-md border border-white/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center uppercase tracking-wider"
              >
                Sign In to Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer
        className={`py-6 px-4 border-t transition-colors ${
          isDark
            ? "bg-[#060911] border-white/10 text-slate-400"
            : "bg-white border-slate-200 text-slate-600"
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3.5">
            <img
              src={isDark ? "/mcc-logo-dark.png" : "/mcc-logo.png"}
              alt="MCC Logo"
              className="h-10 w-auto object-contain shrink-0"
            />
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-[#781c1c] dark:text-red-400">
                MCC Portfolio Platform
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                © {new Date().getFullYear()} Madras Christian College. All rights reserved.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs font-bold">
            <Link href="/login" className="hover:text-[#781c1c] dark:hover:text-white transition-colors">
              Student Sign In
            </Link>
            <Link href="/register" className="hover:text-[#781c1c] dark:hover:text-white transition-colors">
              Register Account
            </Link>
            <Link
              href="/admin/login"
              className="text-[#781c1c] dark:text-red-400 font-extrabold hover:underline"
            >
              Admin Portal
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
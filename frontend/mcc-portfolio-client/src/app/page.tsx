"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Sun, Moon, Sparkles, Menu, X } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export default function HomePage() {
  const [themeMode, toggleThemeMode] = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isDark = themeMode === "dark";

  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}
      className="relative min-h-screen flex flex-col justify-between overflow-x-hidden bg-[#090d16] text-slate-100"
    >
      {/* ── HEADER WITH MOBILE THEME TOGGLE & ENLARGED LOGO ──────────────── */}
      <header
        className={`relative sm:absolute top-0 left-0 right-0 z-50 backdrop-blur-md sm:backdrop-blur-none transition-all duration-300 ${
          isDark
            ? "bg-black/60 sm:bg-transparent border-b border-white/10 sm:border-b-0 shadow-2xl shadow-black/50 sm:shadow-none"
            : "bg-white/95 sm:bg-transparent border-b border-slate-200 sm:border-b-0 shadow-sm sm:shadow-none"
        }`}
      >
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-4 relative z-20">
          {/* Left: Prominent MCC Crest Logo + Aligned Brand Title */}
          <Link href="/" className="flex items-center gap-3 sm:gap-4 group shrink-0">
            {/* Mobile Logo (Theme Responsive) */}
            <img
              src={isDark ? "/mcc-logo-dark.png" : "/mcc-logo.png"}
              alt="Madras Christian College Crest"
              className="h-14 sm:hidden w-auto object-contain shrink-0 transition-all duration-300 group-hover:scale-105"
            />
            {/* Desktop Logo (Enlarged for Impactful Presentation) */}
            <img
              src="/mcc-logo-dark.png"
              alt="Madras Christian College Crest"
              className="hidden sm:block h-24 md:h-28 lg:h-32 w-auto object-contain shrink-0 transition-all duration-300 group-hover:scale-105"
            />

            {/* Vertical Divider */}
            <div
              className="h-12 sm:h-16 w-[2px] hidden sm:block shrink-0"
              style={{
                background: "linear-gradient(to bottom, rgba(255,255,255,0.1), rgba(255,255,255,0.3), rgba(255,255,255,0.1))"
              }}
            />

            {/* Brand Title (Kept at exact size requested) */}
            <div className="flex flex-col space-y-0.5">
              <span className="text-sm sm:text-xl md:text-2xl font-black uppercase tracking-wider leading-none text-white transition-transform group-hover:scale-105">
                Portfolios
              </span>
              <span className="text-[11px] sm:text-xs font-extrabold tracking-wide text-slate-300">
                Madras Christian College
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 hidden sm:block">
                Student Ecosystem
              </span>
            </div>
          </Link>

          {/* Right Header Action: Theme Switcher Aligned on Right */}
          <div className="flex items-center shrink-0">
            {/* Dark/Light Mode Switcher */}
            <button
              onClick={toggleThemeMode}
              aria-label="Toggle dark mode"
              className={`p-2.5 sm:p-3 rounded-2xl transition-all duration-300 cursor-pointer border shadow-sm ${
                isDark
                  ? "bg-white/10 hover:bg-white/20 text-amber-300 border-white/15"
                  : "bg-slate-100 sm:bg-white/90 hover:bg-slate-200 text-slate-900 border-slate-300 sm:border-white/40"
              }`}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION WITH INSTANT PERMANENTLY CROPPED VIDEO ─────────── */}
      <section className="relative flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-140px)] sm:min-h-screen overflow-hidden py-10 sm:py-16 px-3 sm:px-4">
        {/* Permanently Cropped Background Drone Video - Plays Instantly with Zero Delay */}
        <div className="absolute inset-0 z-0 bg-[#090d16] h-full w-full">
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            src="/DJI_0007.mp4"
            className="w-full h-full object-cover filter brightness-105 contrast-105"
          />

          {/* Rich Dark-to-Transparency Fade Overlay (350px tall) */}
          <div
            className="absolute top-0 left-0 right-0 h-[350px] pointer-events-none z-10 hidden sm:block"
            style={{
              background: "linear-gradient(to bottom, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.65) 25%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.1) 80%, rgba(0,0,0,0) 100%)"
            }}
          />

          {/* Minimal overlay to ensure maximum video clarity */}
          <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* Floating Ultra-Translucent Glass Center Card (Enlarged for Desktop) */}
        <div className="relative z-10 max-w-3xl lg:max-w-4xl mx-auto my-auto text-center px-2 sm:px-4 w-full animate-fade-in-up mt-6 sm:mt-12">
          <div className="rounded-3xl p-6 sm:p-14 lg:p-16 bg-black/[0.03] border border-white/10 shadow-lg shadow-black/10" style={{ backdropFilter: "blur(0.5px)", WebkitBackdropFilter: "blur(0.5px)" }}>
            {/* Main Headline */}
            <h1
              className="text-3xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.1] mb-4 sm:mb-6 text-white !text-white"
              style={{
                fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
                color: "#ffffff",
                letterSpacing: "-0.025em",
                textShadow: "0 4px 30px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.95)"
              }}
            >
              Designed for Academic Excellence.
            </h1>

            {/* Subtitle */}
            <p
              className="text-sm sm:text-xl lg:text-2xl max-w-2xl mx-auto leading-relaxed font-medium mb-6 sm:mb-10 text-white !text-white tracking-wide"
              style={{
                fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
                color: "#ffffff",
                textShadow: "0 2px 15px rgba(0,0,0,0.85), 0 1px 4px rgba(0,0,0,0.95)"
              }}
            >
              A minimalist, certified showcase of student portfolios, research, and verified competencies at Madras Christian College.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5">
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 sm:px-10 py-3.5 sm:py-4 rounded-2xl text-xs sm:text-base font-black bg-[#781c1c] hover:bg-[#5f1515] text-white shadow-xl shadow-red-900/50 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2.5 uppercase tracking-wider"
              >
                <span>Build Portfolio</span>
                <ArrowRight size={18} />
              </Link>

              <Link
                href="/login"
                className="w-full sm:w-auto px-8 sm:px-10 py-3.5 sm:py-4 rounded-2xl text-xs sm:text-base font-black bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/35 hover:scale-105 active:scale-95 transition-all flex items-center justify-center uppercase tracking-wider"
              >
                Sign In to Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER (MOBILE RESPONSIVE & COMPACT) ─────────────────────────── */}
      <footer
        className={`relative z-20 w-full backdrop-blur-md border-t transition-all duration-300 ${
          isDark
            ? "bg-black/60 border-white/10 shadow-2xl shadow-black/50"
            : "bg-white/95 border-slate-200 shadow-sm"
        }`}
      >
        <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-2 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 text-center sm:text-left">
          {/* Left Brand & Copyright */}
          <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-4 shrink-0">
            <img
              src={isDark ? "/mcc-logo-dark.png" : "/mcc-logo.png"}
              alt="MCC Logo"
              className="h-6 sm:h-10 w-auto object-contain shrink-0 transition-all duration-300"
            />

            {/* Vertical Divider matching Header */}
            <div
              className="h-6 sm:h-8 w-[2px] hidden sm:block shrink-0"
              style={{
                background: isDark
                  ? "linear-gradient(to bottom, rgba(255,255,255,0.1), rgba(255,255,255,0.3), rgba(255,255,255,0.1))"
                  : "linear-gradient(to bottom, rgba(120,28,28,0.2), rgba(120,28,28,0.6), rgba(120,28,28,0.2))"
              }}
            />

            <div className="flex flex-col space-y-0.5 text-center sm:text-left">
              <div
                className="text-[10px] sm:text-sm font-black uppercase tracking-wider leading-none"
                style={{ color: isDark ? "#ffffff" : "#781c1c" }}
              >
                MCC Portfolio Platform
              </div>
              <div
                className="text-[9px] sm:text-[11px] font-semibold"
                style={{ color: isDark ? "#94a3b8" : "#475569" }}
              >
                © {new Date().getFullYear()} Madras Christian College. All rights reserved.
              </div>
            </div>
          </div>

          {/* Right Navigation Links */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-6 shrink-0">
            <Link
              href="/login"
              className="text-[10px] sm:text-xs font-extrabold transition-colors hover:underline"
              style={{ color: isDark ? "#f1f5f9" : "#0f172a" }}
            >
              Student Sign In
            </Link>
            <Link
              href="/register"
              className="text-[10px] sm:text-xs font-extrabold transition-colors hover:underline"
              style={{ color: isDark ? "#f1f5f9" : "#0f172a" }}
            >
              Register Account
            </Link>
            <Link
              href="/admin/login"
              className="text-[10px] sm:text-xs font-black tracking-wide transition-colors hover:underline"
              style={{ color: isDark ? "#f87171" : "#781c1c" }}
            >
              Admin Portal
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
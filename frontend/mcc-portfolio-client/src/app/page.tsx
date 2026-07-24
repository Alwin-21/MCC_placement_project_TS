"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export default function HomePage() {
  const slides = [
    "/mcc-building.jpg",
    "/mcc-facade.jpg",
    "/mcc-entrance-gate.jpg",
    "/mcc-lake.jpg",
    "/mcc-pathway.jpg",
  ];

  const [activeSlide, setActiveSlide] = useState(0);
  const [themeMode, toggleThemeMode] = useTheme();

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const isDark = themeMode === "dark";

  return (
    <div
      style={{ fontFamily: "'Inter', 'Plus Jakarta Sans', system-ui, sans-serif" }}
      className={`min-h-screen flex flex-col overflow-x-hidden transition-colors duration-200 ${isDark ? "bg-[#0d0d12]" : "bg-[#fcfaf6]"}`}
    >

      {/* ── FLOATING "N" BADGE ─────────────────────────────────────────── */}
      <div className="fixed bottom-6 left-6 z-50">
        <div
          className="w-10 h-10 rounded-full bg-[#781c1c] text-white flex items-center justify-center font-black text-base shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer select-none"
          style={{ fontFamily: "Georgia, serif" }}
        >
          N
        </div>
      </div>

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header className={`sticky top-0 z-50 shadow-sm transition-colors duration-200 ${isDark ? "bg-[#000000] border-b border-white/10" : "bg-white border-b border-slate-200"}`}>
        <div className="px-4 sm:px-8 md:px-10 flex items-center gap-3 sm:gap-4 py-1 sm:py-2">
          {/* MCC logo — swaps based on theme */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <img
              src={isDark ? "/mcc-logo-dark.png" : "/mcc-logo.jpg"}
              alt="Madras Christian College"
              className="h-[72px] sm:h-[96px] md:h-[120px] w-auto object-contain rounded-sm"
            />
          </Link>

          {/* Pipe divider */}
          <div
            style={{
              width: "1px",
              height: "32px",
              background: isDark ? "rgba(255,255,255,0.12)" : "#cbd5e1",
              margin: "0 4px",
              flexShrink: 0,
            }}
          />

          {/* PORTFOLIOS text */}
          <span
            className="text-[10px] sm:text-[13px] md:text-[15px] tracking-[0.12em] sm:tracking-[0.18em] font-bold uppercase truncate"
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              color: isDark ? "#f3f4f6" : "#781c1c",
            }}
          >
            Portfolios
          </span>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Dark mode toggle */}
          <button
            onClick={toggleThemeMode}
            aria-label="Toggle dark mode"
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
              isDark
                ? "bg-white/10 hover:bg-white/20 text-yellow-300"
                : "bg-slate-100 hover:bg-slate-200 text-slate-600"
            }`}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section
        className="relative flex items-center justify-center overflow-hidden flex-1"
        style={{ minHeight: "calc(100vh - 88px)" }}
      >
        {/* Sliding campus background images */}
        <div className="absolute inset-0 z-0">
          {slides.map((src, i) => (
            <img
              key={src}
              src={src}
              alt="MCC Campus"
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
              style={{ opacity: i === activeSlide ? 1 : 0 }}
            />
          ))}
          {/* Overlay — slightly darker in dark mode */}
          <div
            className="absolute inset-0"
            style={{ background: isDark ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.18)" }}
          />
        </div>

        {/* ── Frosted glass card ──────────────────────────────────────── */}
        <div className="relative z-10 w-full px-4 flex justify-center">
          <div
            className="w-full text-center"
            style={{
              maxWidth: "560px",
              background: isDark ? "rgba(13,13,18,0.88)" : "rgba(24,35,60,0.85)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(255,255,255,0.15)",
              borderRadius: "24px",
              padding: "48px 52px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25), 0 4px 16px rgba(0,0,0,0.15)",
            }}
          >
            {/* Main heading */}
            <h1
              style={{
                fontFamily: "Inter, 'Plus Jakarta Sans', system-ui, sans-serif",
                fontWeight: 900,
                fontSize: "clamp(28px, 5vw, 42px)",
                lineHeight: 1.15,
                color: "#ffffff",
                margin: "0 0 16px 0",
                letterSpacing: "-0.02em",
              }}
            >
              Designed for Academic Excellence.
            </h1>

            {/* Subtitle */}
            <p
              style={{
                fontFamily: "Inter, system-ui, sans-serif",
                fontWeight: 400,
                fontSize: "14px",
                lineHeight: 1.65,
                color: "rgba(255,255,255,0.85)",
                margin: "0 0 28px 0",
                maxWidth: "400px",
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              A premium, minimalist showcase of certified portfolios, student
              research, and verified competencies at Madras Christian College.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/register"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#781c1c",
                  color: "#ffffff",
                  borderRadius: "9999px",
                  padding: "12px 28px",
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontWeight: 800,
                  fontSize: "11px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  transition: "background 0.2s, transform 0.15s, box-shadow 0.2s",
                  boxShadow: "0 4px 14px rgba(120,28,28,0.35)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "#5f1515";
                  (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "#781c1c";
                  (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
                }}
              >
                Build Portfolio
                <ArrowRight size={13} />
              </Link>

              <Link
                href="/login"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(255,255,255,0.1)",
                  color: "#ffffff",
                  border: "1.5px solid rgba(255,255,255,0.3)",
                  borderRadius: "9999px",
                  padding: "12px 28px",
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontWeight: 800,
                  fontSize: "11px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  transition: "background 0.2s, transform 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.2)";
                  (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.1)";
                  (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
                }}
              >
                Sign In to Account
              </Link>
            </div>
          </div>
        </div>

        {/* Slide indicator dots */}
        <div
          className="absolute z-10 flex gap-2"
          style={{ bottom: "24px", left: "50%", transform: "translateX(-50%)" }}
        >
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveSlide(i)}
              style={{
                height: "6px",
                width: i === activeSlide ? "20px" : "6px",
                borderRadius: "9999px",
                background: i === activeSlide ? "#781c1c" : "rgba(255,255,255,0.6)",
                border: "none",
                cursor: "pointer",
                transition: "all 0.3s ease",
                padding: 0,
              }}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
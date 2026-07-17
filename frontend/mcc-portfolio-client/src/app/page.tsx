"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function HomePage() {
  const slides = [
    "/mcc-building.jpg",
    "/mcc-facade.jpg",
    "/mcc-entrance-gate.jpg",
  ];

  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{ fontFamily: "'Inter', 'Plus Jakarta Sans', system-ui, sans-serif" }}
      className="min-h-screen flex flex-col bg-[#fcfaf6] overflow-x-hidden"
    >

      {/* ── FLOATING "N" BADGE ─────────────────────────────────────── */}
      <div className="fixed bottom-6 left-6 z-50">
        <div
          className="w-10 h-10 rounded-full bg-[#781c1c] text-white flex items-center justify-center font-black text-base shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer select-none"
          style={{ fontFamily: "Georgia, serif" }}
        >
          N
        </div>
      </div>

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div
          className="px-4 sm:px-8 md:px-10 flex items-center gap-3 sm:gap-4 py-3 sm:py-4"
        >
          {/* MCC logo — image already contains the college name, no duplicate text */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <img
              src="/mcc-logo.jpg"
              alt="Madras Christian College"
              className="h-[72px] sm:h-[96px] md:h-[120px] w-auto object-contain rounded-sm"
            />
          </Link>

          {/* Pipe divider */}
          <div
            style={{
              width: "1px",
              height: "32px",
              background: "#cbd5e1",
              margin: "0 4px",
              flexShrink: 0,
            }}
          />

          {/* PORTFOLIOS */}
          <span
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 700,
              fontSize: "11px",
              color: "#781c1c",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            Portfolios
          </span>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────────────────────── */}
      <section
        className="relative flex items-center justify-center overflow-hidden flex-1"
        style={{ minHeight: "calc(100vh - 68px)" }}
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
          {/* Subtle white overlay — keeps image visible but readable */}
          <div
            className="absolute inset-0"
            style={{ background: "rgba(255,255,255,0.18)" }}
          />
        </div>

        {/* ── Frosted glass card ──────────────────────────────────── */}
        <div className="relative z-10 w-full px-4 flex justify-center">
          <div
            className="w-full text-center"
            style={{
              maxWidth: "560px",
              background: "rgba(24,35,60,0.85)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "24px",
              padding: "48px 52px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25), 0 4px 16px rgba(0,0,0,0.15)",
            }}
          >
            {/* Institutional badge */}
            <div
              className="inline-flex items-center gap-1.5 mb-6"
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "9999px",
                padding: "4px 12px",
              }}
            >
              <Sparkles
                size={9}
                style={{ color: "#ffffff", flexShrink: 0 }}
              />
              <span
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontWeight: 800,
                  fontSize: "9px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "#ffffff",
                }}
              >
                Madras Christian College
              </span>
            </div>

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
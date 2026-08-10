"use client";

import React from "react";

interface MCCLoaderProps {
  isDark?: boolean;
  text?: string;
  subtext?: string;
}

export default function MCCLoader({
  isDark = true,
  text = "Loading MCC Platform...",
  subtext = "Please wait a moment",
}: MCCLoaderProps) {
  // We use the perfect logo assets if they exist, falling back to a stylized badge
  const logoSrc = isDark
    ? "/mcc-logo-perfect-dark.png"
    : "/mcc-logo-perfect-light.png";

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden transition-colors duration-500 ${
        isDark
          ? "bg-[#08080c] text-[#f3f4f6]"
          : "bg-[#fbf9f4] text-[#0f172a]"
      }`}
    >
      {/* Decorative Radial Glowing Background Lights */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] rounded-full blur-[120px] opacity-40 transition-colors duration-500 ${
            isDark ? "bg-purple-900/10" : "bg-red-200/20"
          }`}
        />
        <div
          className={`absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[45vw] h-[45vw] rounded-full blur-[140px] opacity-40 transition-colors duration-500 ${
            isDark ? "bg-rose-900/10" : "bg-amber-100/30"
          }`}
        />
      </div>

      {/* Main Glassmorphic Container */}
      <div className="relative flex flex-col items-center p-8 px-12 rounded-3xl max-w-sm w-full text-center">
        {/* Spinner & Logo Area */}
        <div className="relative w-32 h-32 mb-6 flex items-center justify-center">
          {/* Outer Multi-layered Orbit Spinners */}
          <div
            className={`absolute inset-0 rounded-full border-4 border-t-transparent border-r-transparent animate-spin ${
              isDark ? "border-[#a21caf]" : "border-[#be123c]"
            }`}
            style={{ animationDuration: "1.5s" }}
          />
          <div
            className={`absolute inset-2 rounded-full border-4 border-b-transparent border-l-transparent animate-spin ${
              isDark ? "border-rose-500/40" : "border-amber-500/40"
            }`}
            style={{ animationDuration: "1s", animationDirection: "reverse" }}
          />
          <div
            className={`absolute inset-4 rounded-full border-2 border-t-transparent border-l-transparent animate-spin ${
              isDark ? "border-purple-400/20" : "border-[#9a3412]/20"
            }`}
            style={{ animationDuration: "2.5s" }}
          />

          {/* Central Pulsing Glow */}
          <div className="absolute inset-6 rounded-full bg-gradient-to-tr from-rose-500/5 to-purple-500/5 blur-md animate-pulse" />

          {/* Inner Logo Image or Stylized Badge */}
          <div className="relative w-16 h-16 rounded-full overflow-hidden flex items-center justify-center bg-transparent">
            <img
              src={logoSrc}
              alt="MCC Logo"
              className="w-14 h-14 object-contain animate-[pulse_2s_infinite_ease-in-out]"
              onError={(e) => {
                // If image fails, replace with a stylish letter badge
                e.currentTarget.style.display = "none";
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  const fallback = document.createElement("div");
                  fallback.className =
                    "w-14 h-14 rounded-full bg-rose-900/10 flex items-center justify-center font-serif text-2xl font-bold text-rose-700 dark:text-rose-400 border border-rose-500/20";
                  fallback.innerText = "MCC";
                  parent.appendChild(fallback);
                }
              }}
            />
          </div>
        </div>

        {/* Text Details with elegant fade-in */}
        <h3
          className={`text-lg font-semibold tracking-wide mb-2 animate-pulse ${
            isDark ? "text-slate-100" : "text-slate-800"
          }`}
        >
          {text}
        </h3>
        <p
          className={`text-sm font-medium tracking-normal transition-colors duration-500 ${
            isDark ? "text-slate-400" : "text-slate-500"
          }`}
        >
          {subtext}
        </p>

        {/* Minimal Progress Bar */}
        <div
          className={`w-28 h-[2px] mt-6 rounded-full overflow-hidden relative ${
            isDark ? "bg-slate-800" : "bg-slate-200"
          }`}
        >
          <div
            className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-rose-500 via-amber-500 to-purple-500 rounded-full animate-[loading-bar_2s_infinite_ease-in-out]"
            style={{ width: "40%" }}
          />
        </div>
      </div>

      <style jsx global>{`
        @keyframes loading-bar {
          0% {
            left: -40%;
          }
          50% {
            left: 100%;
          }
          100% {
            left: -40%;
          }
        }
      `}</style>
    </div>
  );
}

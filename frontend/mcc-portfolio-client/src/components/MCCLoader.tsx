"use client";

import React from "react";
import Image from "next/image";

interface MCCLoaderProps {
  isDark?: boolean;
  text?: string;
  subtext?: string;
  fullScreen?: boolean;
  compact?: boolean;
}

export default function MCCLoader({
  isDark = false,
  text = "Loading MCC Placement Platform...",
  subtext = "Madras Christian College",
  fullScreen = true,
  compact = false,
}: MCCLoaderProps) {
  const containerBgClass = fullScreen
    ? isDark
      ? "fixed inset-0 z-50 flex flex-col items-center justify-center min-h-screen p-4 transition-colors duration-300 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100"
      : "fixed inset-0 z-50 flex flex-col items-center justify-center min-h-screen p-4 transition-colors duration-300 bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-800"
    : "relative w-full flex flex-col items-center justify-center p-4 transition-colors duration-300";

  const cardBg = isDark
    ? "bg-slate-900/80 border-slate-800 shadow-2xl shadow-black/50"
    : "bg-white/80 border-slate-200 shadow-xl shadow-slate-200/50";

  const ringSize = compact ? "w-16 h-16 mb-3" : "w-24 h-24 mb-6";
  const logoSize = compact ? "w-10 h-10" : "w-14 h-14";
  const logoImageSize = compact ? 32 : 48;
  const paddingClass = compact ? "p-4 max-w-xs" : "p-8 max-w-sm";

  return (
    <div className={containerBgClass}>
      <div
        className={`relative flex flex-col items-center w-full rounded-3xl border backdrop-blur-md transition-all animate-in fade-in zoom-in-95 duration-300 ${paddingClass} ${cardBg}`}
      >
        {/* Animated Glow Ring */}
        <div className={`relative flex items-center justify-center ${ringSize}`}>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#781c1c] border-r-[#781c1c]/40 animate-spin" />
          <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-[#9b2222] border-l-[#9b2222]/30 animate-spin [animation-duration:1.5s]" />

          {/* Emblem Container (Theme Responsive) */}
          <div className={`relative ${logoSize} rounded-full ${isDark ? "bg-slate-800/90 border border-slate-700/50" : "bg-white/90 shadow-inner"} p-2 flex items-center justify-center`}>
            <Image
              src={isDark ? "/mcc-crest-dark.png" : "/mcc-crest.png"}
              alt="MCC Crest Emblem"
              width={logoImageSize}
              height={logoImageSize}
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Loading Text */}
        <div className="text-center space-y-1.5">
          <p className={`${compact ? "text-sm" : "text-base"} font-bold tracking-tight ${isDark ? "text-slate-100" : "text-slate-900"}`}>
            {text}
          </p>
          {subtext && (
            <p className={`${compact ? "text-[10px]" : "text-xs"} font-medium text-[#781c1c] dark:text-red-400 tracking-wide uppercase`}>
              {subtext}
            </p>
          )}
        </div>

        {/* Progress Bar Animation */}
        <div className={`w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden ${compact ? "mt-4" : "mt-6"}`}>
          <div className="bg-gradient-to-r from-[#781c1c] via-red-600 to-[#781c1c] h-full w-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}

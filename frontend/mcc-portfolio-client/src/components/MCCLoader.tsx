"use client";

import React from "react";

interface MCCLoaderProps {
  text?: string;
  subtext?: string;
  isDark?: boolean;
  fullScreen?: boolean;
  compact?: boolean;
}

export default function MCCLoader({
  text = "Loading Verified Portfolio...",
  subtext = "Madras Christian College",
  isDark = false,
  fullScreen = true,
  compact = false
}: MCCLoaderProps) {
  if (compact) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <div className="relative w-14 h-14 mx-auto mb-3 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[#781c1c]/20 animate-ping" />
          <div className="w-12 h-12 border-3 border-t-[#781c1c] border-r-[#d4af37] border-b-[#18233c] border-l-transparent rounded-full animate-spin" />
          <img src="/mcc-crest.png" alt="MCC" className="w-5 h-5 object-contain absolute opacity-90" />
        </div>
        {subtext && (
          <span className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-[#d4af37] block font-mono mb-0.5">
            {subtext}
          </span>
        )}
        <p className={`font-bold tracking-wider text-[11px] uppercase animate-pulse ${isDark ? "text-slate-300" : "text-[#781c1c]"}`}>
          {text}
        </p>
      </div>
    );
  }

  const cardContent = (
    <div className="text-center p-8 rounded-3xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl max-w-sm w-full mx-4">
      <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-4 border-[#781c1c]/20 animate-ping" />
        <div className="w-16 h-16 border-4 border-t-[#781c1c] border-r-[#d4af37] border-b-[#18233c] border-l-transparent rounded-full animate-spin" />
        <img src="/mcc-crest.png" alt="MCC" className="w-8 h-8 object-contain absolute opacity-90" />
      </div>
      {subtext && (
        <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#d4af37] block mb-1 font-mono">
          {subtext}
        </span>
      )}
      <p className={`font-bold tracking-widest text-xs uppercase animate-pulse ${isDark ? "text-slate-300" : "text-[#781c1c]"}`}>
        {text}
      </p>
    </div>
  );

  if (!fullScreen) return cardContent;

  return (
    <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
      isDark ? "bg-[#090d16] text-slate-100" : "bg-[#fcfaf6] text-[#2c2c2c]"
    }`}>
      {cardContent}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Moon,
  Sun
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export default function HomePage() {
  // Slideshow images (images 2, 3, 4)
  const slides = [
    "/mcc-building.jpg",      // Image 2
    "/mcc-facade.jpg",        // Image 3
    "/mcc-entrance-gate.jpg"  // Image 4
  ];

  const [activeSlide, setActiveSlide] = useState(0);
  const [themeMode, toggleTheme] = useTheme();
  const isDarkMode = themeMode === "dark";

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans relative overflow-x-hidden ${
      isDarkMode 
        ? "bg-[#050507] text-[#f3f4f6] selection:bg-[#781c1c]/40 selection:text-white" 
        : "bg-[#fcfaf6] text-[#2c2c2c] selection:bg-[#781c1c]/20 selection:text-[#781c1c]"
    }`}>
      
      {/* Floating Circular Badge on the bottom-left corner with "N" */}
      <div className="fixed bottom-6 left-6 z-50">
        <div className="w-10 h-10 rounded-full bg-[#781c1c] text-white flex items-center justify-center font-serif font-black text-lg shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer select-none">
          N
        </div>
      </div>

      {/* HEADER NAV */}
      <header className={`border-b sticky top-0 z-50 transition-all duration-300 shadow-xs ${
        isDarkMode 
          ? "bg-[#050507]/90 border-slate-800 backdrop-blur-md" 
          : "bg-white/95 border-[#781c1c]/10 backdrop-blur-md"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
          
          {/* Logo & Branding */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group min-w-0 shrink">
            <img 
              src="/mcc-logo.jpg" 
              className="h-16 sm:h-22 md:h-26 w-auto object-contain transition-all duration-300 group-hover:scale-[1.01] shrink-0 rounded-md" 
              alt="Madras Christian College Logo" 
            />
            <div className={`border-l h-6 mx-1 sm:mx-2 shrink-0 ${isDarkMode ? "border-slate-800" : "border-slate-300"}`} />
            <span className={`font-black text-[10px] sm:text-xs uppercase tracking-wider font-mono truncate ${isDarkMode ? "text-slate-200" : "text-[#2c2c2c]"}`}>
              Portfolios
            </span>
          </Link>
        </div>
      </header>

      {/* HERO SECTION WITH DYNAMIC BACKGROUND PHOTOS SLIDER (HIGH VISIBILITY) */}
      <section className={`relative overflow-hidden py-20 md:py-28 min-h-[660px] flex items-center justify-center border-b transition-colors duration-300 ${
        isDarkMode ? "border-slate-850" : "border-[#781c1c]/10"
      }`}>
        
        {/* Slideshow background images - Adjusted active slide opacity for dark mode vs light mode */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {slides.map((src, index) => (
            <img
              key={src}
              src={src}
              alt="MCC Campus Slider"
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1200 ${
                index === activeSlide 
                  ? (isDarkMode ? "opacity-35" : "opacity-95") 
                  : "opacity-0"
              }`}
            />
          ))}
          
          {/* Custom grid mesh overlay matching the first mockup image */}
          <div 
            className="absolute inset-0 z-1"
            style={{
              backgroundImage: isDarkMode
                ? `linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)`
                : `linear-gradient(to right, rgba(120, 28, 28, 0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(120, 28, 28, 0.07) 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
              opacity: isDarkMode ? 0.35 : 0.09
            }}
          />

          {/* Semi-transparent gradient and backdrop-blur overlay to guarantee text readability */}
          <div className={`absolute inset-0 backdrop-blur-[0.5px] z-2 ${
            isDarkMode 
              ? "bg-gradient-to-b from-[#050507]/20 via-[#050507]/60 to-[#050507]" 
              : "bg-gradient-to-b from-[#fcfaf6]/20 via-[#fcfaf6]/45 to-[#fcfaf6]"
          }`} />
        </div>

        {/* Hero content container wrapped in a modern glassmorphic card for high-visibility contrast */}
        <div className="max-w-3xl mx-auto px-6 relative z-10 text-center">
          <div className={`border transition-all duration-300 shadow-2xl rounded-3xl p-8 md:p-12 space-y-6 ${
            isDarkMode
              ? "bg-black/60 border-white/5 shadow-black/40"
              : "bg-white/80 border-white/50"
          }`}>
            
            {/* Centered Institutional Badge */}
            <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 bg-[#781c1c]/5 border border-[#781c1c]/10 rounded-full text-[9px] font-black text-[#781c1c] uppercase tracking-widest font-mono mx-auto">
              <Sparkles size={11} className="animate-spin-slow" />
              <span>MADRAS CHRISTIAN COLLEGE</span>
            </div>

            {/* Main Heading */}
            <h1 className={`text-3xl sm:text-4xl md:text-5xl font-sans font-black tracking-tight leading-tight select-none ${
              isDarkMode ? "text-white" : "text-[#2c2c2c]"
            }`}>
              Designed for <span className="text-[#781c1c]">Academic Excellence.</span>
            </h1>

            {/* Subheading */}
            <p className={`text-xs sm:text-sm max-w-xl mx-auto leading-relaxed font-sans font-semibold ${
              isDarkMode ? "text-slate-300" : "text-slate-650"
            }`}>
              A premium, minimalist showcase of certified portfolios, student research, and verified competencies at Madras Christian College.
            </p>

            {/* Buttons (Pill shaped buttons) */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                href="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#781c1c] hover:bg-[#5f1515] text-white px-8 py-3.5 rounded-full font-bold uppercase tracking-wider text-xs transition duration-200 shadow-sm"
              >
                Build Portfolio
                <ArrowRight size={13} />
              </Link>
              
              <Link
                href="/login"
                className={`w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-full font-bold uppercase tracking-wider text-xs transition shadow-xs border ${
                  isDarkMode 
                    ? "bg-white/5 hover:bg-white/10 border-white/10 text-white" 
                    : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                }`}
              >
                Sign In to Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: CALL TO ACTION */}
      <section className="max-w-5xl mx-auto px-6 py-20 relative z-10">
        <div className="bg-[#18233c] border border-amber-600/30 text-white rounded-[32px] p-10 md:p-16 text-center relative overflow-hidden shadow-lg">
          <div className="absolute inset-0 z-0">
            <img 
              src="/mcc-facade.jpg" 
              alt="MCC Main Facade Background" 
              className="w-full h-full object-cover opacity-15 filter blur-xs"
            />
          </div>

          <div className="relative z-10 space-y-6">
            <h2 className="font-serif text-3xl md:text-5xl font-black text-white">
              Launch Your Showcase
            </h2>
            <p className="text-slate-300 text-xs md:text-sm max-w-xl mx-auto leading-relaxed font-sans">
              Join fellow students at Madras Christian College. Stand out in placements and academic directories by building your unified showcase profile today.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link
                href="/register"
                className="bg-[#781c1c] hover:bg-[#5f1515] text-white px-8 py-3.5 rounded-full font-bold uppercase tracking-wider text-xs transition duration-200"
              >
                Register Profile
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#781c1c]/10 py-12 bg-[#18233c] text-[#f7f5f0]/80 relative z-10">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-6 items-center text-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-white flex items-center justify-center shadow-md p-0.5">
                <img src="/mcc-crest.png" className="w-full h-full object-contain" alt="MCC Crest" />
              </div>
              <span className="font-serif font-black text-sm text-white tracking-wide">MADRAS CHRISTIAN COLLEGE</span>
            </div>
            <p className="text-[10px] text-slate-400 font-sans">© {new Date().getFullYear()} Madras Christian College (Autonomous). All Rights Reserved.</p>
          </div>
          
          <div className="flex flex-wrap md:justify-end gap-6 text-[10px] uppercase font-bold tracking-wider text-[#d4af37] font-mono">
            <Link href="/login" className="hover:text-white transition">Dashboard Log In</Link>
            <Link href="/admin/login" className="hover:text-white transition">Admin Portal</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
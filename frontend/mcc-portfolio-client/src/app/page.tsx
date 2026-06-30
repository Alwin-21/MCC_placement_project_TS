"use client";

import Link from "next/link";
import {
  ArrowRight,
  Trophy,
  Code,
  Award,
  Briefcase,
  Sparkles,
  BookOpen,
  Globe,
  ChevronRight,
  Shield,
  Layers,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#050507] text-[#f3f4f6] selection:bg-[#8b5cf6]/30 selection:text-[#a78bfa] relative overflow-hidden">
      
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#4f46e5]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[55%] h-[55%] bg-[#ec4899]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[30%] right-[15%] w-[35%] h-[35%] bg-[#06b6d4]/5 rounded-full blur-[110px] pointer-events-none" />

      {/* HEADER NAV */}
      <header className="border-b border-white/5 bg-[#050507]/60 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-[1px] shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-[#09090b] rounded-[11px] flex items-center justify-center">
                <span className="font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400 text-lg">M</span>
              </div>
            </div>
            <div>
              <span className="font-display font-extrabold text-xl tracking-tight text-white block">
                MCC Portfolio
              </span>
              <span className="text-[9px] uppercase font-mono tracking-widest text-[#a78bfa] block font-bold leading-none">
                AI Ecosystem
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Platform Features</a>
            <a href="#stats" className="hover:text-white transition-colors">Analytics</a>
            <a href="/search" className="hover:text-white transition-colors">Directory</a>
            <a href="/leaderboard" className="hover:text-white transition-colors">Leaderboard</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-bold text-gray-300 hover:text-white transition px-4 py-2"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-16 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Institutional Tag */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-full text-xs font-bold text-[#c084fc] mb-8 shadow-sm">
            <Sparkles size={14} className="animate-spin-slow" />
            <span>Madras Christian College Digital Transformation</span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-black tracking-tight text-white mb-8 leading-[1.08] lg:leading-[1.05]">
            AI-Powered Student <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#818cf8] via-[#c084fc] to-[#f472b6]">
              Portfolio Ecosystem
            </span>
          </h1>

          <p className="text-lg md:text-xl text-[#9ca3af] max-w-2xl mx-auto mb-12 leading-relaxed">
            A centralized digital identity infrastructure for Madras Christian College. Showcase academic records, publications, software projects, and unlock AI-driven career guidance.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-16">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:opacity-95 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg shadow-indigo-600/20 hover:scale-[1.02]"
            >
              Build Your Profile
              <ArrowRight size={18} />
            </Link>
            
            <Link
              href="/admin/login"
              className="w-full sm:w-auto inline-flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all"
            >
              Admin Portal
            </Link>
          </div>
        </div>
      </section>

      {/* CORE HIGHLIGHTS CARD GRID */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-16 border-t border-white/5 relative z-10">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-white mb-4">
            Unified Portfolio Capabilities
          </h2>
          <p className="text-gray-400 text-sm md:text-base leading-relaxed">
            Our platform provides state-of-the-art tools enabling students to capture achievements and align with international university guidelines and premium corporate recruitment.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* CARD 1 */}
          <div className="bg-[#0b0b0f]/80 border border-white/5 hover:border-indigo-500/20 rounded-3xl p-8 hover:bg-[#0c0c12] transition-all group duration-300 flex flex-col justify-between h-[280px]">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition duration-300">
                <Code size={24} className="text-indigo-400" />
              </div>
              <h3 className="font-display text-xl font-bold mb-3 text-white">
                Project Vault
              </h3>
              <p className="text-gray-400 text-xs leading-relaxed">
                Publish software projects, compile tech stacks, and attach live demo links and Git repositories.
              </p>
            </div>
            <Link href="/login" className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-bold mt-4">
              Explore Projects <ChevronRight size={14} />
            </Link>
          </div>

          {/* CARD 2 */}
          <div className="bg-[#0b0b0f]/80 border border-white/5 hover:border-pink-500/20 rounded-3xl p-8 hover:bg-[#0c0c12] transition-all group duration-300 flex flex-col justify-between h-[280px]">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition duration-300">
                <BookOpen size={24} className="text-pink-400" />
              </div>
              <h3 className="font-display text-xl font-bold mb-3 text-white">
                Research Cell
              </h3>
              <p className="text-gray-400 text-xs leading-relaxed">
                Log academic papers, conference presentations, science reports, and build a prestigious academic profile.
              </p>
            </div>
            <Link href="/login" className="inline-flex items-center gap-1 text-xs text-pink-400 hover:text-pink-300 font-bold mt-4">
              Explore Research <ChevronRight size={14} />
            </Link>
          </div>

          {/* CARD 3 */}
          <div className="bg-[#0b0b0f]/80 border border-white/5 hover:border-purple-500/20 rounded-3xl p-8 hover:bg-[#0c0c12] transition-all group duration-300 flex flex-col justify-between h-[280px]">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition duration-300">
                <Sparkles size={24} className="text-purple-400" />
              </div>
              <h3 className="font-display text-xl font-bold mb-3 text-white">
                AI Synthesis
              </h3>
              <p className="text-gray-400 text-xs leading-relaxed">
                Generate high-quality dynamic Statements of Purpose (SOP) and get tailored university recommendation lists.
              </p>
            </div>
            <Link href="/login" className="inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 font-bold mt-4">
              Activate Advisor <ChevronRight size={14} />
            </Link>
          </div>

          {/* CARD 4 */}
          <div className="bg-[#0b0b0f]/80 border border-white/5 hover:border-emerald-500/20 rounded-3xl p-8 hover:bg-[#0c0c12] transition-all group duration-300 flex flex-col justify-between h-[280px]">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition duration-300">
                <Trophy size={24} className="text-emerald-400" />
              </div>
              <h3 className="font-display text-xl font-bold mb-3 text-white">
                Theme Switcher
              </h3>
              <p className="text-gray-400 text-xs leading-relaxed">
                Switch portfolio layouts instantly. Support Academic Serif, Corporate Minimalist, or Cyber monospaced aesthetics.
              </p>
            </div>
            <Link href="/login" className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-bold mt-4">
              Preview Themes <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section id="stats" className="max-w-7xl mx-auto px-6 py-16 border-t border-white/5 relative z-10">
        <div className="bg-[#0b0b0f] border border-white/5 rounded-[40px] p-8 md:p-14 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(79,70,229,0.06),transparent_40%)]" />
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 text-center relative z-10">
            <div className="p-4">
              <span className="block text-4xl md:text-5xl font-black text-white font-display mb-2">98%</span>
              <span className="block text-gray-400 text-xs uppercase font-mono tracking-wider font-bold">Profile Completion Rate</span>
            </div>
            <div className="p-4 border-t md:border-t-0 md:border-l border-white/5">
              <span className="block text-4xl md:text-5xl font-black text-white font-display mb-2">4+</span>
              <span className="block text-gray-400 text-xs uppercase font-mono tracking-wider font-bold">Interactive Layouts</span>
            </div>
            <div className="p-4 border-t lg:border-t-0 lg:border-l border-white/5">
              <span className="block text-4xl md:text-5xl font-black text-[#a78bfa] font-display mb-2">AI</span>
              <span className="block text-gray-400 text-xs uppercase font-mono tracking-wider font-bold">SOP Recommendation</span>
            </div>
            <div className="p-4 border-t lg:border-t-0 lg:border-l border-white/5">
              <span className="block text-4xl md:text-5xl font-black text-emerald-400 font-display mb-2">100%</span>
              <span className="block text-gray-400 text-xs uppercase font-mono tracking-wider font-bold">MCC Verified Badging</span>
            </div>
          </div>
        </div>
      </section>

      {/* RECRUITMENT CALL-TO-ACTION */}
      <section className="max-w-5xl mx-auto px-6 py-20 relative z-10">
        <div className="bg-gradient-to-br from-indigo-900/60 via-purple-900/40 to-[#0b0b0f] border border-indigo-500/20 rounded-[32px] p-10 md:p-16 text-center relative overflow-hidden shadow-2xl backdrop-blur-md">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />

          <h2 className="font-display text-3xl md:text-5xl font-black text-white mb-6">
            Ready to Build Your Showcase?
          </h2>
          <p className="text-gray-300 text-sm md:text-base max-w-2xl mx-auto mb-10 leading-relaxed">
            Create your account today, enter your technical achievements, research works, and dynamic projects, and represent Madras Christian College professionally.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-white text-black hover:bg-gray-100 px-8 py-4 rounded-2xl font-bold text-base transition duration-200"
            >
              Get Started Now
              <ArrowRight size={18} />
            </Link>
            
            <Link
              href="/search"
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-4 rounded-2xl font-bold text-base transition-all"
            >
              Browse Directory
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-10 bg-[#08080b]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="font-display font-black text-white text-sm">MCC Portfolio</span>
            <span>© 2026 Madras Christian College. All Rights Reserved.</span>
          </div>
          
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition">Privacy Policy</a>
            <a href="#" className="hover:text-white transition">Platform Guidelines</a>
            <a href="/admin/login" className="hover:text-white transition">Admin Dashboard</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
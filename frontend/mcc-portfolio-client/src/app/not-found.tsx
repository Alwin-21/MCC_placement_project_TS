"use client";

import Link from "next/link";
import { ArrowLeft, Home, SearchAlert } from "lucide-react";

export default function NotFound() {
  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}
      className="min-h-screen bg-[#090d16] text-slate-100 flex items-center justify-center p-6"
    >
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 text-red-400 rounded-3xl flex items-center justify-center mx-auto shadow-2xl backdrop-blur-md">
          <SearchAlert size={38} />
        </div>

        <div className="space-y-2">
          <h1 className="text-6xl font-black tracking-tight text-white">404</h1>
          <h2 className="text-xl font-bold text-slate-200">Page Not Found</h2>
          <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
            The page or resource you are looking for does not exist or has been moved.
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#781c1c] hover:bg-[#5f1515] text-white text-xs font-extrabold uppercase tracking-wider transition-all duration-200 shadow-lg shadow-red-950/40 cursor-pointer"
          >
            <Home size={16} /> Return to Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer"
          >
            <ArrowLeft size={16} /> Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

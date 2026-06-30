"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  User,
  GraduationCap,
  ArrowRight,
  BookOpen,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import api from "@/services/api";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const searchStudents = async (searchQuery = query) => {
    try {
      setLoading(true);
      const response = await api.get(`/Search?query=${searchQuery}`);
      setStudents(response.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  // Pre-fetch some initial students or empty state suggestions
  useEffect(() => {
    searchStudents("");
  }, []);

  const handleQuickSearch = (tag: string) => {
    setQuery(tag);
    searchStudents(tag);
  };

  return (
    <div className="min-h-screen bg-[#050507] text-[#f3f4f6] selection:bg-[#8b5cf6]/30 selection:text-[#a78bfa] relative overflow-hidden pb-20">
      
      {/* Background gradients */}
      <div className="absolute top-[-10%] right-[-10%] w-[45%] h-[45%] bg-[#3b82f6]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#8b5cf6]/5 rounded-full blur-[120px] pointer-events-none" />

      {/* TOP NAVBAR */}
      <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-white/5 relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition duration-200">
          <ArrowLeft size={16} /> Back to Home
        </Link>
        <span className="text-xs uppercase font-mono tracking-widest text-[#a78bfa] font-bold bg-[#8b5cf6]/10 px-3 py-1.5 rounded-full border border-[#8b5cf6]/20">
          MCC Student Registry
        </span>
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-16 relative z-10">
        
        {/* TITLE SECTION */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h1 className="font-display text-4xl md:text-5xl font-black text-white mb-4 tracking-tight leading-tight">
            Discover MCC Talent
          </h1>
          <p className="text-gray-400 text-sm md:text-base leading-relaxed">
            Search our comprehensive directory of Madras Christian College student profiles by name, tech skill, or academic major.
          </p>
        </div>

        {/* SEARCH BAR CARD */}
        <div className="bg-[#0b0b0f] border border-white/5 p-4 rounded-[28px] shadow-2xl mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 bg-[#121217] border border-white/5 rounded-2xl px-5 py-4 flex items-center gap-3 focus-within:border-indigo-500/30 transition-all">
              <Search className="text-gray-500 flex-shrink-0" size={20} />
              <input
                type="text"
                placeholder="Search by name, skill (e.g. React, C#), or department..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchStudents()}
                className="bg-transparent border-none outline-none text-sm text-white placeholder-gray-500 w-full"
              />
            </div>
            
            <button
              onClick={() => searchStudents()}
              disabled={loading}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white font-bold px-8 py-4 rounded-2xl text-sm transition duration-200 flex-shrink-0 active:scale-[0.98]"
            >
              {loading ? "Searching Directory..." : "Search Profiles"}
            </button>
          </div>

          {/* QUICK TARGET TAGS */}
          <div className="mt-4 flex items-center gap-2 flex-wrap text-xs">
            <span className="text-gray-500 font-semibold mr-1">Popular Skill Tags:</span>
            {["React", "C#", "Next.js", "Python", "SQL", "Tailwind", "Machine Learning"].map((tag) => (
              <button
                key={tag}
                onClick={() => handleQuickSearch(tag)}
                className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 hover:text-white text-gray-400 border border-white/5 transition duration-200"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* RESULTS GRID */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400 text-sm font-semibold tracking-wider uppercase animate-pulse">Filtering MCC Profiles...</p>
          </div>
        ) : students.length > 0 ? (
          <div>
            <div className="flex justify-between items-center text-xs font-semibold text-gray-400 mb-6 px-1">
              <span>FOUND {students.length} STUDENT MATCHES</span>
              <span>VERIFIED DIRECTORY PROFILES</span>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {students.map((student) => {
                const initials = student.fullName
                  ? student.fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
                  : "S";

                return (
                  <div
                    key={student.id}
                    className="bg-[#0b0b0f]/80 border border-white/5 hover:border-indigo-500/25 rounded-3xl p-6 relative group transition-all duration-300 flex flex-col justify-between hover:bg-[#0c0c14] hover:shadow-2xl"
                  >
                    <div>
                      {/* HEADER ROW */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/10 flex items-center justify-center font-bold text-indigo-400 shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors truncate">
                            {student.fullName}
                          </h3>
                          <span className="text-[10px] uppercase font-mono tracking-widest text-[#a78bfa] font-bold">
                            {student.department || "Madras Christian College"}
                          </span>
                        </div>
                      </div>

                      <p className="text-gray-400 text-xs mb-6 truncate leading-relaxed">
                        ✉️ {student.email}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-2">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                        ✓ VERIFIED
                      </span>

                      <Link
                        href={`/portfolio/${student.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 text-xs text-indigo-400 group-hover:text-indigo-300 font-bold"
                      >
                        View Portfolio
                        <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-[#0b0b0f] border border-white/5 rounded-[32px] px-6">
            <User size={48} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Profiles Found</h3>
            <p className="text-gray-400 text-xs max-w-sm mx-auto leading-relaxed">
              No verified student portfolio matches your keyword. Try looking up tags like "React" or "C#".
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
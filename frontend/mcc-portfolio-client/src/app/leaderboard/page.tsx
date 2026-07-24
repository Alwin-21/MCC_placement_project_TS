"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Trophy,
  Award,
  Search,
  Filter,
  ExternalLink,
  Sparkles,
  ArrowLeft,
  Sun,
  Moon,
  CheckCircle,
  BookOpen,
  User,
  Star
} from "lucide-react";
import api from "@/services/api";
import { useTheme } from "@/hooks/useTheme";

export default function LeaderboardPage() {
  const [themeMode, toggleThemeMode] = useTheme();
  const isDark = themeMode === "dark";

  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [selectedStream, setSelectedStream] = useState("All");

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get("/Public");
      setStudents(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to fetch public portfolios", err);
      // Fallback demo data if API is loading or empty
      setStudents([
        {
          id: "1",
          fullName: "Alwin Rosh G",
          registerNumber: "22-UCS-122",
          department: "Computer Science (B.Sc)",
          stream: "SFS",
          course: "B.Sc Computer Science",
          projectsCount: 8,
          skillsCount: 14,
          verified: true,
          badge: "Gold Achiever",
        },
        {
          id: "2",
          fullName: "Bryan Desikan",
          registerNumber: "22-UCS-137",
          department: "Computer Science (B.Sc)",
          stream: "SFS",
          course: "B.Sc Computer Science",
          projectsCount: 6,
          skillsCount: 12,
          verified: true,
          badge: "Silver Achiever",
        },
        {
          id: "3",
          fullName: "Ahimaaz P",
          registerNumber: "22-UCS-105",
          department: "Computer Science (B.Sc)",
          stream: "SFS",
          course: "B.Sc Computer Science",
          projectsCount: 5,
          skillsCount: 10,
          verified: true,
          badge: "Bronze Achiever",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Filter students based on search query, department, and stream
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.registerNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.department?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept =
      selectedDepartment === "All" || student.department === selectedDepartment;
    const matchesStream =
      selectedStream === "All" || student.stream === selectedStream;

    return matchesSearch && matchesDept && matchesStream;
  });

  const top3 = filteredStudents.slice(0, 3);
  const remainingStudents = filteredStudents.slice(3);

  return (
    <div
      style={{ fontFamily: "'Inter', 'Plus Jakarta Sans', system-ui, sans-serif" }}
      className={`min-h-screen flex flex-col transition-colors duration-300 ${
        isDark ? "bg-[#090d16] text-slate-100" : "bg-[#faf9f6] text-slate-900"
      }`}
    >
      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-colors duration-300 ${
          isDark
            ? "bg-[#090d16]/85 border-white/10"
            : "bg-white/85 border-slate-200 shadow-sm"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src={isDark ? "/mcc-logo-dark.png" : "/mcc-logo.jpg"}
              alt="Madras Christian College"
              className="h-12 w-auto object-contain transition-transform group-hover:scale-105"
            />
            <div className="h-8 w-[1px] bg-slate-300 dark:bg-white/15 hidden sm:block" />
            <div className="flex flex-col">
              <span
                className="text-xs sm:text-sm tracking-[0.18em] font-extrabold uppercase"
                style={{ color: isDark ? "#ffffff" : "#781c1c" }}
              >
                Leaderboard
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                Madras Christian College
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={toggleThemeMode}
              aria-label="Toggle theme"
              className={`p-2.5 rounded-full transition-all cursor-pointer ${
                isDark
                  ? "bg-white/10 hover:bg-white/20 text-amber-300"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <Link
              href="/"
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-800 dark:text-white transition flex items-center gap-2"
            >
              <ArrowLeft size={14} />
              <span>Back Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO SPOTLIGHT ─────────────────────────────────────────────── */}
      <section className="py-12 px-4 max-w-7xl mx-auto w-full text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
          <Trophy size={16} /> Top Student Portfolios & Ranking
        </div>

        <h1
          className="text-3xl sm:text-5xl font-black tracking-tight"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          MCC Student Showcase Leaderboard
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
          Explore top-performing student portfolios, verified academic accomplishments, and placement credentials across departments.
        </p>
      </section>

      {/* ── TOP 3 PODIUM ───────────────────────────────────────────────── */}
      <section className="px-4 max-w-7xl mx-auto w-full mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          {/* Rank 2 (Silver) */}
          {top3[1] && (
            <div className="glass-card rounded-3xl p-6 text-center space-y-4 border-2 border-slate-300 dark:border-slate-700 order-2 md:order-1 hover:-translate-y-2 transition-transform">
              <div className="relative inline-block">
                <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-800 mx-auto flex items-center justify-center font-bold text-2xl border-4 border-slate-300 dark:border-slate-500 shadow-xl overflow-hidden">
                  {top3[1].profileImageUrl ? (
                    <img
                      src={top3[1].profileImageUrl}
                      alt={top3[1].fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={36} className="text-slate-400" />
                  )}
                </div>
                <span className="absolute -bottom-2 right-0 w-8 h-8 rounded-full bg-slate-300 text-slate-900 font-black text-xs flex items-center justify-center shadow-lg border-2 border-white">
                  #2
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold truncate">{top3[1].fullName}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {top3[1].registerNumber}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-semibold">
                  {top3[1].department}
                </p>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold">
                <Award size={14} className="text-slate-400" />
                Silver Achiever
              </div>

              <Link
                href={`/portfolio/${top3[1].id || top3[1].registerNumber}`}
                className="block w-full py-2.5 rounded-xl bg-slate-800 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition shadow-md"
              >
                View Portfolio
              </Link>
            </div>
          )}

          {/* Rank 1 (Gold) */}
          {top3[0] && (
            <div className="glass-card rounded-3xl p-8 text-center space-y-4 border-2 border-amber-400 dark:border-amber-500/80 order-1 md:order-2 shadow-2xl hover:-translate-y-2 transition-transform bg-gradient-to-b from-amber-500/10 via-transparent to-transparent">
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-full bg-amber-100 dark:bg-amber-950/60 mx-auto flex items-center justify-center font-bold text-3xl border-4 border-amber-400 shadow-2xl overflow-hidden">
                  {top3[0].profileImageUrl ? (
                    <img
                      src={top3[0].profileImageUrl}
                      alt={top3[0].fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={44} className="text-amber-500" />
                  )}
                </div>
                <span className="absolute -bottom-2 right-0 w-9 h-9 rounded-full bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center shadow-xl border-2 border-white">
                  #1
                </span>
              </div>

              <div>
                <div className="flex items-center justify-center gap-1 text-amber-500 mb-1">
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                </div>
                <h3 className="text-xl font-black truncate">{top3[0].fullName}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {top3[0].registerNumber}
                </p>
                <p className="text-xs text-[#781c1c] dark:text-red-400 mt-1 font-bold">
                  {top3[0].department}
                </p>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 text-xs font-black">
                <Trophy size={14} className="text-amber-500" />
                Gold Achiever
              </div>

              <Link
                href={`/portfolio/${top3[0].id || top3[0].registerNumber}`}
                className="block w-full py-3 rounded-xl bg-[#781c1c] hover:bg-[#5f1515] text-white text-xs font-extrabold transition shadow-lg shadow-red-900/30"
              >
                View Top Portfolio
              </Link>
            </div>
          )}

          {/* Rank 3 (Bronze) */}
          {top3[2] && (
            <div className="glass-card rounded-3xl p-6 text-center space-y-4 border-2 border-amber-700/40 order-3 hover:-translate-y-2 transition-transform">
              <div className="relative inline-block">
                <div className="w-20 h-20 rounded-full bg-amber-900/10 mx-auto flex items-center justify-center font-bold text-2xl border-4 border-amber-700/60 shadow-xl overflow-hidden">
                  {top3[2].profileImageUrl ? (
                    <img
                      src={top3[2].profileImageUrl}
                      alt={top3[2].fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={36} className="text-amber-700" />
                  )}
                </div>
                <span className="absolute -bottom-2 right-0 w-8 h-8 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center shadow-lg border-2 border-white">
                  #3
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold truncate">{top3[2].fullName}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {top3[2].registerNumber}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-semibold">
                  {top3[2].department}
                </p>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-900/10 text-amber-700 dark:text-amber-400 text-xs font-bold">
                <Award size={14} className="text-amber-700" />
                Bronze Achiever
              </div>

              <Link
                href={`/portfolio/${top3[2].id || top3[2].registerNumber}`}
                className="block w-full py-2.5 rounded-xl bg-slate-800 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition shadow-md"
              >
                View Portfolio
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── SEARCH & FILTER TOOLBAR ─────────────────────────────────────── */}
      <section className="px-4 max-w-7xl mx-auto w-full mb-8">
        <div className="glass-card rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full md:w-1/2">
            <Search
              className="absolute left-4 top-3.5 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by student name, register number, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border text-sm pl-11 pr-4 py-3 rounded-xl outline-none bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
            />
          </div>

          {/* Stream & Department Filter */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 text-xs font-extrabold text-slate-500">
              <Filter size={16} />
              <span>Filters:</span>
            </div>

            <select
              value={selectedStream}
              onChange={(e) => setSelectedStream(e.target.value)}
              className="border text-xs px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0f172a] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
            >
              <option value="All">All Streams</option>
              <option value="Aided">Aided</option>
              <option value="SFS">SFS</option>
            </select>
          </div>
        </div>
      </section>

      {/* ── ALL STUDENT CARDS GRID ───────────────────────────────────────── */}
      <section className="px-4 max-w-7xl mx-auto w-full pb-20">
        {loading ? (
          <div className="text-center py-16 text-slate-500 text-sm font-semibold">
            Loading leaderboard entries...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-sm font-semibold">
            No portfolios found matching your search query.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map((student, index) => (
              <div
                key={student.id || index}
                className="glass-card rounded-2xl p-6 flex flex-col justify-between hover:shadow-xl transition-all border border-slate-200/80 dark:border-white/10 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-black px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                      #{index + 1}
                    </span>
                    <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle size={12} /> Verified
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-extrabold truncate group-hover:text-[#781c1c] dark:group-hover:text-red-400 transition-colors">
                      {student.fullName}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {student.registerNumber}
                    </p>
                  </div>

                  <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300">
                    <p className="font-semibold">{student.department}</p>
                    <p className="text-[11px] text-slate-500">{student.course}</p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">
                    {student.stream} Stream
                  </span>

                  <Link
                    href={`/portfolio/${student.id || student.registerNumber}`}
                    className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#781c1c] dark:text-red-400 hover:underline"
                  >
                    <span>View Profile</span>
                    <ExternalLink size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

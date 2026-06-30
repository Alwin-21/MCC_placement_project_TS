"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Trophy,
  Award,
  Crown,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  BookOpen,
  Code,
  GitBranch,
} from "lucide-react";
import api from "@/services/api";

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await api.get("/Leaderboard");
      setLeaders(response.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  // Divide leaders into podium and regular lists
  const podiumStudents = leaders.slice(0, 3);
  // Arrange as [2nd Place, 1st Place, 3rd Place] for visual podium rendering
  const arrangedPodium = [];
  if (podiumStudents[1]) arrangedPodium.push({ ...podiumStudents[1], place: 2 });
  if (podiumStudents[0]) arrangedPodium.push({ ...podiumStudents[0], place: 1 });
  if (podiumStudents[2]) arrangedPodium.push({ ...podiumStudents[2], place: 3 });

  const listStudents = leaders.slice(3);

  return (
    <div className="min-h-screen bg-[#050507] text-[#f3f4f6] selection:bg-[#8b5cf6]/30 selection:text-[#a78bfa] relative overflow-hidden pb-20">
      
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#f59e0b]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-[#8b5cf6]/5 rounded-full blur-[120px] pointer-events-none" />

      {/* TOP NAVBAR */}
      <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-white/5 relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition duration-200">
          <ArrowLeft size={16} /> Back to Home
        </Link>
        <span className="text-xs uppercase font-mono tracking-widest text-amber-400 font-bold bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20 flex items-center gap-1.5 animate-pulse">
          <Sparkles size={12} /> Live Rankings
        </span>
      </div>

      <div className="max-w-5xl mx-auto px-6 pt-16 relative z-10">
        
        {/* TITLE SECTION */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="font-display text-4xl md:text-5xl font-black text-white mb-4 tracking-tight leading-tight flex items-center justify-center gap-3">
            <Trophy size={40} className="text-amber-400" />
            MCC Student Leaderboard
          </h1>
          <p className="text-gray-400 text-sm md:text-base leading-relaxed">
            Celebrating the top-performing student builders of Madras Christian College based on projects, achievements, certifications, and research contributions.
          </p>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400 text-sm font-semibold tracking-wider uppercase animate-pulse">Synthesizing Leaderboard Scores...</p>
          </div>
        ) : (
          <div>
            {/* ═══════════════════════════════════════
                PODIUM VIEW (TOP 3)
            ═══════════════════════════════════════ */}
            {podiumStudents.length > 0 && (
              <div className="grid md:grid-cols-3 gap-6 items-end mb-16 max-w-4xl mx-auto">
                
                {/* 2nd Place (Left on desktop) */}
                {podiumStudents[1] && (
                  <div className="bg-[#0b0b0f]/80 border border-slate-700/30 p-6 rounded-3xl text-center flex flex-col justify-between h-[360px] relative order-2 md:order-1 hover:border-slate-400/30 transition-all duration-300">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-400 text-black w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 border-slate-900 shadow-md">
                      2
                    </div>
                    <div className="pt-4">
                      <Award size={36} className="text-slate-400 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-white mb-1 truncate">{podiumStudents[1].fullName}</h3>
                      <span className="text-[10px] text-gray-500 uppercase font-mono tracking-wider font-bold block mb-4">{podiumStudents[1].department || "STUDENT"}</span>
                      
                      <div className="flex justify-center gap-4 text-xs text-gray-400 mt-2">
                        <span>🚀 {podiumStudents[1].projects} Proj</span>
                        <span>🏆 {podiumStudents[1].achievements} Ach</span>
                      </div>
                    </div>
                    <div className="mt-6 border-t border-white/5 pt-4">
                      <span className="block text-3xl font-black text-slate-400 font-display mb-3">{podiumStudents[1].score} pts</span>
                      <Link href={`/portfolio/${podiumStudents[1].id}`} target="_blank" className="w-full bg-white/5 hover:bg-white/10 text-white text-xs font-bold py-2.5 rounded-xl block transition duration-200">
                        View Portfolio
                      </Link>
                    </div>
                  </div>
                )}

                {/* 1st Place (Center on desktop - Tallest) */}
                {podiumStudents[0] && (
                  <div className="bg-[#0f0e0b]/80 border border-amber-500/30 p-8 rounded-3xl text-center flex flex-col justify-between h-[420px] relative order-1 md:order-2 shadow-2xl shadow-amber-500/5 hover:border-amber-400/50 transition-all duration-300">
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-amber-500 text-black w-10 h-10 rounded-full flex items-center justify-center font-black text-base border-2 border-[#18150f] shadow-lg shadow-amber-500/20">
                      1
                    </div>
                    <div className="absolute top-4 right-4 animate-bounce">
                      <Crown size={22} className="text-amber-400" />
                    </div>
                    <div className="pt-4">
                      <Trophy size={48} className="text-amber-400 mx-auto mb-4" />
                      <h3 className="text-2xl font-black text-white mb-1 truncate">{podiumStudents[0].fullName}</h3>
                      <span className="text-xs text-amber-400 uppercase font-mono tracking-widest font-bold block mb-4">MCC GRAND MASTER</span>
                      
                      <div className="flex justify-center gap-5 text-xs text-gray-400 mt-2">
                        <span>🚀 {podiumStudents[0].projects} Proj</span>
                        <span>🏆 {podiumStudents[0].achievements} Ach</span>
                        <span>📄 {podiumStudents[0].researchPapers} Res</span>
                      </div>
                    </div>
                    <div className="mt-6 border-t border-amber-500/10 pt-4">
                      <span className="block text-4xl font-black text-amber-400 font-display mb-4">{podiumStudents[0].score} pts</span>
                      <Link href={`/portfolio/${podiumStudents[0].id}`} target="_blank" className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:opacity-95 text-black text-xs font-black py-3 rounded-xl block transition duration-200">
                        View Portfolio
                      </Link>
                    </div>
                  </div>
                )}

                {/* 3rd Place (Right on desktop) */}
                {podiumStudents[2] && (
                  <div className="bg-[#0b0b0f]/80 border border-[#b45309]/30 p-6 rounded-3xl text-center flex flex-col justify-between h-[340px] relative order-3 hover:border-[#b45309]/50 transition-all duration-300">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#b45309] text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 border-slate-900 shadow-md">
                      3
                    </div>
                    <div className="pt-4">
                      <Award size={36} className="text-[#b45309] mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-white mb-1 truncate">{podiumStudents[2].fullName}</h3>
                      <span className="text-[10px] text-gray-500 uppercase font-mono tracking-wider font-bold block mb-4">{podiumStudents[2].department || "STUDENT"}</span>
                      
                      <div className="flex justify-center gap-4 text-xs text-gray-400 mt-2">
                        <span>🚀 {podiumStudents[2].projects} Proj</span>
                        <span>🏆 {podiumStudents[2].achievements} Ach</span>
                      </div>
                    </div>
                    <div className="mt-6 border-t border-white/5 pt-4">
                      <span className="block text-3xl font-black text-[#b45309] font-display mb-3">{podiumStudents[2].score} pts</span>
                      <Link href={`/portfolio/${podiumStudents[2].id}`} target="_blank" className="w-full bg-white/5 hover:bg-white/10 text-white text-xs font-bold py-2.5 rounded-xl block transition duration-200">
                        View Portfolio
                      </Link>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* ═══════════════════════════════════════
                RANKING LIST VIEW (4TH PLACE+)
            ═══════════════════════════════════════ */}
            {listStudents.length > 0 && (
              <div className="mt-12 bg-[#0b0b0f] border border-white/5 rounded-3xl overflow-hidden p-6 shadow-2xl">
                <h3 className="text-xs uppercase font-mono font-bold text-gray-400 mb-6 tracking-widest px-2">
                  Challengers Registry
                </h3>
                <div className="space-y-3">
                  {listStudents.map((leader, index) => (
                    <div
                      key={leader.id}
                      className="bg-white/5 border border-white/5 hover:border-indigo-500/10 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 transition duration-200 hover:bg-white/[0.07]"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="text-lg font-bold font-mono text-gray-500 w-8 text-center shrink-0">
                          #{index + 4}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-base font-bold text-white truncate">
                            {leader.fullName}
                          </h4>
                          <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-xs text-gray-400 mt-1">
                            <span className="text-indigo-400 font-bold uppercase text-[9px] tracking-wide bg-indigo-500/10 px-2 py-0.5 rounded">
                              {leader.department || "STUDENT"}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1"><Code size={11} /> {leader.projects} Proj</span>
                            <span>•</span>
                            <span className="flex items-center gap-1"><Award size={11} /> {leader.achievements} Ach</span>
                            <span>•</span>
                            <span className="flex items-center gap-1"><BookOpen size={11} /> {leader.researchPapers} Res</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-white/5 pt-3 md:pt-0 shrink-0">
                        <span className="text-2xl font-black text-amber-400 font-display">
                          {leader.score} <span className="text-[10px] text-gray-500 uppercase font-mono font-bold">pts</span>
                        </span>
                        
                        <Link
                          href={`/portfolio/${leader.id}`}
                          className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1 transition"
                        >
                          Portfolio <ChevronRight size={14} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {leaders.length === 0 && (
              <div className="text-center py-20 bg-[#0b0b0f] border border-white/5 rounded-3xl px-6">
                <Trophy size={48} className="text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Registry Scoreboard Empty</h3>
                <p className="text-gray-400 text-xs max-w-sm mx-auto leading-relaxed">
                  No scores calculated yet. Students will appear on the leaderboard once portfolios are approved by administrators.
                </p>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
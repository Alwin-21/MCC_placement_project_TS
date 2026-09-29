"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
} from "recharts";
import { TrendingUp, Users, Activity, Target, RefreshCw, Info, AlertCircle } from "lucide-react";
import api from "@/services/api";

interface GrowthEngagementProps {
  activeStream: "Aided" | "SFS";
  themeMode: "light" | "dark";
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAROON = "#781c1c";
const CREAM_BG = "#faf8f5";

// ── Generic card wrapper ──────────────────────────────────────────────────────
function AnalyticsCard({ title, subtitle, badge, children, isDark, live = true }: {
  title: string; subtitle: string; badge?: string; children: React.ReactNode;
  isDark: boolean; live?: boolean;
}) {
  return (
    <div className={`border rounded-2xl p-5 ${isDark ? "bg-white/[0.02] border-white/5" : "bg-white border-slate-200 shadow-xs"}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className={`text-sm font-serif font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}>
            {title}
          </h4>
          <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>
        </div>
        <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
          live
            ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20"
            : "text-blue-500 bg-blue-500/10 border-blue-500/20"
        }`}>
          {live ? "● Live" : "↗ Trending"}
        </span>
      </div>
      {children}
    </div>
  );
}

// ── KPI badge ────────────────────────────────────────────────────────────────
function KpiBadge({ label, value, sub, color, isDark }: {
  label: string; value: string | number; sub: string; color: string; isDark: boolean;
}) {
  return (
    <div className={`rounded-xl p-3 border ${isDark ? "bg-white/[0.03] border-white/5" : "bg-slate-50 border-slate-100"}`}>
      <div className={`text-[9px] font-mono uppercase tracking-wider mb-1 ${isDark ? "text-gray-400" : "text-slate-500"}`}>{label}</div>
      <div className="text-xl font-serif font-black" style={{ color }}>{value}</div>
      <div className={`text-[10px] mt-0.5 ${isDark ? "text-gray-400" : "text-slate-500"}`}>{sub}</div>
    </div>
  );
}

// ── Skeleton loader ───────────────────────────────────────────────────────────
function ChartSkeleton({ isDark }: { isDark: boolean }) {
  return (
    <div className={`h-48 rounded-xl border animate-pulse ${isDark ? "bg-white/[0.03] border-white/5" : "bg-slate-100 border-slate-200"}`} />
  );
}

// ── Heatmap ───────────────────────────────────────────────────────────────────
function LoginHeatmap({ heatmap, isDark }: { heatmap: number[][], isDark: boolean }) {
  if (!heatmap || heatmap.length === 0) return <ChartSkeleton isDark={isDark} />;
  const maxVal = Math.max(...heatmap.flat(), 1);
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[520px]">
        {/* Hour labels */}
        <div className="flex ml-8 mb-1">
          {[0,3,6,9,12,15,18,21].map((h) => (
            <div key={h} className={`flex-1 text-[9px] font-mono text-center ${isDark ? "text-gray-500" : "text-slate-400"}`}>
              {h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h-12}p`}
            </div>
          ))}
        </div>
        {DAYS.map((day, dow) => (
          <div key={day} className="flex items-center gap-0.5 mb-0.5">
            <div className={`w-7 text-[9px] font-bold text-right mr-1 shrink-0 ${isDark ? "text-gray-400" : "text-slate-500"}`}>{day}</div>
            {heatmap[dow].map((val, hour) => {
              const intensity = maxVal > 0 ? val / maxVal : 0;
              const alpha = Math.round(intensity * 220 + 30);
              const bg = val === 0
                ? isDark ? "rgba(255,255,255,0.04)" : "#f1f5f9"
                : `rgba(120,28,28,${(intensity * 0.8 + 0.1).toFixed(2)})`;
              return (
                <div
                  key={hour}
                  title={`${DAYS[dow]} ${hour}:00 — ${val} login${val !== 1 ? "s" : ""}`}
                  className="flex-1 h-5 rounded-sm cursor-default transition-transform hover:scale-110"
                  style={{ backgroundColor: bg }}
                />
              );
            })}
          </div>
        ))}
        <div className="flex items-center gap-2 mt-2 ml-8">
          <span className={`text-[9px] font-mono ${isDark ? "text-gray-500" : "text-slate-400"}`}>Low</span>
          {[0.1,0.3,0.5,0.7,0.9].map((v) => (
            <div key={v} className="w-4 h-3 rounded-sm" style={{ backgroundColor: `rgba(120,28,28,${v})` }} />
          ))}
          <span className={`text-[9px] font-mono ${isDark ? "text-gray-500" : "text-slate-400"}`}>High</span>
        </div>
      </div>
    </div>
  );
}

// ── Funnel bar ────────────────────────────────────────────────────────────────
function FunnelBar({ label, count, pct, total, isDark, isMax }: {
  label: string; count: number; pct: number; total: number; isDark: boolean; isMax: boolean;
}) {
  const barColor = pct >= 70 ? "#10b981" : pct >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex items-center gap-3">
      <div className={`w-28 text-[11px] font-semibold text-right shrink-0 ${isDark ? "text-gray-300" : "text-slate-700"}`}>
        {label}
      </div>
      <div className="flex-1 h-6 rounded-lg overflow-hidden" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9" }}>
        <div
          className="h-full rounded-lg transition-all duration-700 ease-out flex items-center pl-2"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        >
          {pct >= 15 && (
            <span className="text-[10px] font-mono font-bold text-white">{pct}%</span>
          )}
        </div>
      </div>
      <div className={`w-16 text-[10px] font-mono font-bold text-right shrink-0 ${isDark ? "text-gray-300" : "text-slate-700"}`}>
        {count}<span className={`font-normal ml-0.5 ${isDark ? "text-gray-500" : "text-slate-400"}`}>/{total}</span>
      </div>
    </div>
  );
}

// ── Custom tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, isDark, valueFormatter }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className={`p-3 rounded-xl border shadow-xl text-xs ${isDark ? "bg-[#14141c] border-white/10 text-white" : "bg-white border-slate-200 text-slate-800"}`}>
      <div className="font-bold font-serif mb-1">{label}</div>
      {payload.map((item: any, i: number) => (
        <div key={i} className="flex justify-between gap-4 mt-0.5">
          <span className="text-gray-400">{item.name}:</span>
          <span className="font-mono font-bold" style={{ color: item.color }}>{valueFormatter ? valueFormatter(item.value) : item.value}</span>
        </div>
      ))}
    </div>
  );
}

function formatDate(d: string) {
  const dt = new Date(d);
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function GrowthEngagementAnalytics({ activeStream, themeMode }: GrowthEngagementProps) {
  const isDark = themeMode === "dark";
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  // Chart data states
  const [signupData, setSignupData] = useState<any>(null);
  const [engData, setEngData] = useState<any>(null);
  const [funnelData, setFunnelData] = useState<any>(null);
  const [trendData, setTrendData] = useState<any>(null);

  const [loadingSignup, setLoadingSignup] = useState(false);
  const [loadingEng, setLoadingEng] = useState(false);
  const [loadingFunnel, setLoadingFunnel] = useState(false);
  const [loadingTrend, setLoadingTrend] = useState(false);

  const [snapshotRunning, setSnapshotRunning] = useState(false);
  const [snapshotResult, setSnapshotResult] = useState<string | null>(null);

  const fetchAll = useCallback(async (stream: string) => {
    setLoadingSignup(true); setLoadingEng(true); setLoadingFunnel(true); setLoadingTrend(true);
    try {
      const [s, e, f, t] = await Promise.all([
        api.get(`/Admin/growth-analytics?type=signup-growth&stream=${stream}&days=90`),
        api.get(`/Admin/growth-analytics?type=engagement&stream=${stream}&days=30`),
        api.get(`/Admin/growth-analytics?type=funnel&stream=${stream}`),
        api.get(`/Admin/growth-analytics?type=trend&stream=${stream}`),
      ]);
      setSignupData(s.data);
      setEngData(e.data);
      setFunnelData(f.data);
      setTrendData(t.data);
    } catch (err) {
      console.error("Growth analytics fetch failed", err);
    } finally {
      setLoadingSignup(false); setLoadingEng(false); setLoadingFunnel(false); setLoadingTrend(false);
    }
  }, []);

  useEffect(() => { fetchAll(activeStream); }, [activeStream, fetchAll]);

  const handleRunSnapshot = async () => {
    setSnapshotRunning(true);
    setSnapshotResult(null);
    try {
      const res = await api.post("/Admin/snapshot-cron", {});
      setSnapshotResult(`✓ Snapshot written for ${res.data.rowsWritten} department(s). Trend chart will update.`);
      // Reload trend
      const t = await api.get(`/Admin/growth-analytics?type=trend&stream=${activeStream}`);
      setTrendData(t.data);
    } catch {
      setSnapshotResult("✗ Snapshot failed. Check server logs.");
    } finally {
      setSnapshotRunning(false);
    }
  };

  // ── Signup chart data — weekly aggregated ──────────────────────────────
  const weeklySignupData = useMemo(() => {
    if (!signupData?.series) return [];
    const series = signupData.series;
    const weeks: { week: string; newSignups: number; total: number }[] = [];
    for (let i = 0; i < series.length; i += 7) {
      const chunk = series.slice(i, i + 7);
      const weekLabel = formatDate(chunk[0].date);
      const newSignups = chunk.reduce((acc: number, d: any) => acc + d.newSignups, 0);
      const total = chunk[chunk.length - 1].total;
      weeks.push({ week: weekLabel, newSignups, total });
    }
    return weeks;
  }, [signupData]);

  // ── Engagement chart — last 30 days DAU ───────────────────────────────
  const dauSeries = useMemo(() => {
    if (!engData?.series) return [];
    return engData.series.map((d: any) => ({ ...d, date: formatDate(d.date) }));
  }, [engData]);

  // ── Trend series ──────────────────────────────────────────────────────
  const trendSeries = useMemo(() => {
    if (!trendData?.series) return [];
    return trendData.series.map((d: any) => ({ ...d, date: formatDate(d.date) }));
  }, [trendData]);

  // ── Signup KPI ────────────────────────────────────────────────────────
  const signupKpi = signupData?.kpi;
  const signupDelta = signupKpi ? signupKpi.thisMonth - signupKpi.prevMonth : 0;

  // ── WAU KPI ───────────────────────────────────────────────────────────
  const engKpi = engData?.kpi;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className={`border rounded-3xl shadow-xl overflow-hidden ${isDark ? "bg-[#0b0b0f] border-white/5" : `bg-gradient-to-b from-white to-[${CREAM_BG}] border-stone-200`}`}>
        <div className="p-5 border-b border-gray-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base md:text-lg font-serif font-black tracking-tight text-slate-900 dark:text-white">
                Growth & Engagement Analytics
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#781c1c]/10 text-[#781c1c] dark:bg-white/10 dark:text-gray-300">
                {activeStream} Stream
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Platform insights — signup trends, student activity, and portfolio completion funnel
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchAll(activeStream)}
              title="Refresh all charts"
              className={`p-2 rounded-xl border transition cursor-pointer ${isDark ? "bg-white/5 hover:bg-white/10 text-gray-300 border-white/10" : "bg-white hover:bg-stone-50 text-slate-700 border-slate-200"}`}
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={handleRunSnapshot}
              disabled={snapshotRunning}
              title="Run daily snapshot now (writes today's data point for the trend chart)"
              className="px-3.5 py-1.5 rounded-xl bg-[#781c1c] hover:bg-[#5f1515] text-white text-xs font-bold transition cursor-pointer flex items-center gap-2 disabled:opacity-60"
            >
              {snapshotRunning ? <RefreshCw size={13} className="animate-spin" /> : <Activity size={13} />}
              {snapshotRunning ? "Capturing…" : "Capture Today"}
            </button>
          </div>
        </div>

        {snapshotResult && (
          <div className={`mx-5 my-3 px-4 py-2.5 rounded-xl text-xs font-medium border ${snapshotResult.startsWith("✓") ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-500/30 dark:text-emerald-400" : "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/20 dark:border-rose-500/30 dark:text-rose-400"}`}>
            {snapshotResult}
          </div>
        )}

        <div className="p-5 space-y-6">

          {/* ── 3.1 SIGNUP GROWTH ─────────────────────────────────────── */}
          <AnalyticsCard
            title="📈 Signup Growth"
            subtitle={`New student registrations over time — ${activeStream} stream`}
            isDark={isDark}
            live={true}
          >
            {/* KPI row */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <KpiBadge
                label="This Month"
                value={loadingSignup ? "—" : signupKpi?.thisMonth ?? "—"}
                sub={signupDelta > 0 ? `+${signupDelta} vs last month` : signupDelta < 0 ? `${signupDelta} vs last month` : "Same as last month"}
                color={signupDelta > 0 ? "#10b981" : signupDelta < 0 ? "#ef4444" : "#f59e0b"}
                isDark={isDark}
              />
              <KpiBadge
                label="Last Month"
                value={loadingSignup ? "—" : signupKpi?.prevMonth ?? "—"}
                sub="Previous period"
                color={MAROON}
                isDark={isDark}
              />
              <KpiBadge
                label="Total Enrolled"
                value={loadingSignup ? "—" : signupKpi?.total ?? "—"}
                sub={`${activeStream} students`}
                color={MAROON}
                isDark={isDark}
              />
            </div>

            {loadingSignup || !isMounted ? (
              <ChartSkeleton isDark={isDark} />
            ) : weeklySignupData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-gray-400">No data available.</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={weeklySignupData} margin={{ top: 4, right: 16, left: -16, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9"} />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: isDark ? "#94a3b8" : "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: isDark ? "#94a3b8" : "#64748b" }} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip isDark={isDark} />} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} iconType="circle" />
                  <Line type="monotone" dataKey="newSignups" name="New Signups" stroke={MAROON} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="total" name="Cumulative Total" stroke="#d97706" strokeWidth={2} dot={false} strokeDasharray="5 3" />
                </LineChart>
              </ResponsiveContainer>
            )}
            <p className={`text-[10px] mt-2 ${isDark ? "text-gray-500" : "text-slate-400"}`}>
              ● Live — data pulled directly from signup timestamps in the Users table.
            </p>
          </AnalyticsCard>

          {/* ── 3.2 ENGAGEMENT ────────────────────────────────────────── */}
          <AnalyticsCard
            title="⚡ Engagement & Activity"
            subtitle={`Daily active students (last 30 days) + login heatmap — ${activeStream} stream`}
            isDark={isDark}
            live={true}
          >
            {/* KPI */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <KpiBadge
                label="Active This Week"
                value={loadingEng ? "—" : engKpi?.wau ?? "—"}
                sub={`${engKpi?.wauPct ?? 0}% of enrolled`}
                color={engKpi?.wauPct >= 50 ? "#10b981" : engKpi?.wauPct >= 20 ? "#f59e0b" : "#ef4444"}
                isDark={isDark}
              />
              <KpiBadge
                label="Total Enrolled"
                value={loadingEng ? "—" : engKpi?.totalStudents ?? "—"}
                sub={`${activeStream} students`}
                color={MAROON}
                isDark={isDark}
              />
              <KpiBadge
                label="7-Day WAU%"
                value={loadingEng ? "—" : `${engKpi?.wauPct ?? 0}%`}
                sub="Weekly active users"
                color={MAROON}
                isDark={isDark}
              />
            </div>

            {/* DAU chart */}
            <div className="mb-1">
              <div className={`text-[10px] font-mono uppercase tracking-wider font-bold mb-2 ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                Daily Active Students (Last 30 Days)
              </div>
              {loadingEng || !isMounted ? (
                <ChartSkeleton isDark={isDark} />
              ) : dauSeries.length === 0 ? (
                <div className="h-32 flex items-center justify-center text-sm text-gray-400">No login data in range.</div>
              ) : (
                <ResponsiveContainer width="100%" height={130}>
                  <BarChart data={dauSeries} margin={{ top: 4, right: 8, left: -20, bottom: 4 }} barSize={6}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.04)" : "#f1f5f9"} />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: isDark ? "#94a3b8" : "#64748b" }} axisLine={false} tickLine={false} interval={6} />
                    <YAxis tick={{ fontSize: 9, fill: isDark ? "#94a3b8" : "#64748b" }} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip isDark={isDark} />} />
                    <Bar dataKey="dau" name="Active Students" radius={[3,3,0,0]}>
                      {dauSeries.map((_: any, i: number) => (
                        <Cell key={i} fill={MAROON} fillOpacity={0.75} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Login Heatmap */}
            <div className="mt-4">
              <div className={`text-[10px] font-mono uppercase tracking-wider font-bold mb-2 ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                When Students Are Online (Login Heatmap)
              </div>
              {loadingEng ? (
                <div className={`h-32 rounded-xl animate-pulse ${isDark ? "bg-white/[0.03]" : "bg-slate-100"}`} />
              ) : (
                <LoginHeatmap heatmap={engData?.heatmap ?? []} isDark={isDark} />
              )}
            </div>
            <p className={`text-[10px] mt-3 ${isDark ? "text-gray-500" : "text-slate-400"}`}>
              ● Live — computed from AuditLogs "Student Login" events.
            </p>
          </AnalyticsCard>

          {/* ── 3.3 FUNNEL ───────────────────────────────────────────── */}
          <AnalyticsCard
            title="🔽 Portfolio Completion Funnel"
            subtitle={`% of ${activeStream} students who have each section filled — current snapshot`}
            isDark={isDark}
            live={true}
          >
            {loadingFunnel ? (
              <div className="space-y-2">
                {[1,2,3,4,5,6,7].map((n) => (
                  <div key={n} className={`h-6 rounded-lg animate-pulse ${isDark ? "bg-white/[0.05]" : "bg-slate-100"}`} />
                ))}
              </div>
            ) : !funnelData?.funnel ? (
              <div className="h-40 flex items-center justify-center text-sm text-gray-400">No funnel data.</div>
            ) : (
              <div className="space-y-2">
                {funnelData.funnel.map((item: any, i: number) => (
                  <FunnelBar
                    key={item.section}
                    label={item.label}
                    count={item.count}
                    pct={item.pct}
                    total={funnelData.total}
                    isDark={isDark}
                    isMax={i === 0}
                  />
                ))}
                <p className={`text-[10px] mt-2 ${isDark ? "text-gray-500" : "text-slate-400"}`}>
                  Sections shown in dashboard sidebar order. Drop-off reveals where students stop filling their portfolio.
                </p>
              </div>
            )}
            <p className={`text-[10px] mt-2 ${isDark ? "text-gray-500" : "text-slate-400"}`}>
              ● Live — computed from current portfolio table fill-state. Not historical.
            </p>
          </AnalyticsCard>

          {/* ── 3.4 COMPLETION RATE TREND ────────────────────────────── */}
          <AnalyticsCard
            title="📊 Completion Rate Trend"
            subtitle={`Avg portfolio completion % over time — ${activeStream} stream (accumulates from launch)`}
            isDark={isDark}
            live={false}
          >
            {loadingTrend || !isMounted ? (
              <ChartSkeleton isDark={isDark} />
            ) : trendData?.insufficientData ? (
              <div className={`flex flex-col items-center justify-center py-12 gap-3 ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                <AlertCircle size={28} className="text-amber-500" />
                <div className="text-sm font-semibold text-center">Not enough data yet</div>
                <p className="text-[11px] text-center max-w-xs">
                  This chart requires at least 2 daily snapshots to show a trend. Use the <strong>Capture Today</strong> button above to write today&rsquo;s data point. The chart will start populating after the second capture.
                </p>
                <p className={`text-[10px] mt-1 ${isDark ? "text-gray-500" : "text-slate-400"}`}>
                  The daily snapshot cron runs automatically at midnight to accumulate history.
                </p>
              </div>
            ) : (
              <>
                {trendData?.firstDate && (
                  <p className={`text-[10px] mb-2 ${isDark ? "text-gray-500" : "text-slate-400"}`}>
                    Tracking from {new Date(trendData.firstDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} onward — no earlier data exists.
                  </p>
                )}
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={trendSeries} margin={{ top: 4, right: 16, left: -16, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9"} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: isDark ? "#94a3b8" : "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: isDark ? "#94a3b8" : "#64748b" }} unit="%" />
                    <Tooltip content={<ChartTooltip isDark={isDark} valueFormatter={(v: number) => `${v}%`} />} />
                    <Line type="monotone" dataKey="avgCompletion" name="Avg Completion" stroke={MAROON} strokeWidth={2.5} dot={{ r: 3, fill: MAROON }} />
                  </LineChart>
                </ResponsiveContainer>
                <p className={`text-[10px] mt-2 ${isDark ? "text-gray-500" : "text-slate-400"}`}>
                  ↗ Trending — data sourced from daily snapshots captured by the nightly cron job.
                </p>
              </>
            )}
          </AnalyticsCard>

        </div>
      </div>
    </div>
  );
}

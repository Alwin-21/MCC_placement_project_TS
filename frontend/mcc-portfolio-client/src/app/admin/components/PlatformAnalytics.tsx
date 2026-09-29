"use client";

import React, {
  useState, useEffect, useCallback, useMemo, useRef,
} from "react";
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Cell, PieChart, Pie, Legend,
  ReferenceLine, LabelList,
} from "recharts";
import {
  ChevronDown, ChevronUp, RefreshCw, TrendingUp, TrendingDown,
  Users, LogIn, CheckCircle2, UserPlus, Activity, Clock, ArrowRight,
  Dot, Zap, AlertCircle,
} from "lucide-react";
import api from "@/services/api";

// ─── Constants ────────────────────────────────────────────────────────────────
const MAROON = "#781c1c";
const MAROON_LIGHT = "#a33a3a";
const CREAM_BG = "#faf8f5";

const RANGE_OPTIONS = [
  { label: "Last 7 days",  days: 7  },
  { label: "Last 28 days", days: 28 },
  { label: "Last 90 days", days: 90 },
];

const TABS = ["Overview", "Content", "Audience", "Trends"] as const;
type Tab = typeof TABS[number];

type KpiMetric = "logins" | "completions" | "newStudents";

// ─── Props ────────────────────────────────────────────────────────────────────
interface PlatformAnalyticsProps {
  activeStream: "Aided" | "SFS";
  themeMode: "light" | "dark";
  growthData?: any;
  funnelData?: any;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function fmtDateRange(days: number) {
  const end = new Date();
  const start = new Date(end.getTime() - days * 86400000);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${fmt(start)} — ${fmt(end)}`;
}
function pctDelta(curr: number, prev: number) {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 100);
}
function relativeTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  if (diff < 172800) return "Yesterday";
  return fmtDate(iso);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SkeletonBox({ h = "h-40", isDark }: { h?: string; isDark: boolean }) {
  return <div className={`${h} rounded-xl animate-pulse ${isDark ? "bg-white/5" : "bg-slate-100"}`} />;
}

function KpiCard({
  label, curr, prev, icon, isDark, active, onClick,
}: {
  label: string; curr: number; prev: number; icon: React.ReactNode;
  isDark: boolean; active: boolean; onClick: () => void;
}) {
  const delta = pctDelta(curr, prev);
  const up = delta >= 0;
  return (
    <button
      onClick={onClick}
      className={`flex-1 min-w-0 rounded-2xl p-4 text-left border transition-all cursor-pointer ${
        active
          ? isDark
            ? "bg-[#781c1c]/20 border-[#781c1c]/40 ring-1 ring-[#781c1c]/30"
            : "bg-[#781c1c]/5 border-[#781c1c]/25 ring-1 ring-[#781c1c]/20"
          : isDark
          ? "bg-white/[0.03] border-white/5 hover:bg-white/[0.06]"
          : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[10px] font-mono uppercase tracking-wider font-bold ${isDark ? "text-gray-400" : "text-slate-500"}`}>
          {label}
        </span>
        <span className={`p-1.5 rounded-lg ${isDark ? "bg-white/10 text-gray-300" : "bg-slate-100 text-slate-600"}`}>
          {icon}
        </span>
      </div>
      <div className={`text-3xl font-serif font-black mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>
        {curr.toLocaleString()}
      </div>
      <div className={`flex items-center gap-1 text-[11px] font-medium ${up ? "text-emerald-600" : "text-rose-500"}`}>
        {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        <span>{up ? "+" : ""}{delta}%</span>
        <span className={`${isDark ? "text-gray-500" : "text-slate-400"} font-normal`}>vs prev period</span>
      </div>
    </button>
  );
}

// Custom tooltip for the main chart
function MainTooltip({ active, payload, label, isDark }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className={`px-3 py-2.5 rounded-xl border shadow-2xl text-xs ${
      isDark ? "bg-[#14141c] border-white/10 text-white" : "bg-white border-slate-200 text-slate-800"
    }`}>
      <div className={`font-bold mb-1.5 ${isDark ? "text-gray-300" : "text-slate-600"}`}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className={isDark ? "text-gray-400" : "text-slate-500"}>{p.name}:</span>
          <span className="font-mono font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// Realtime pulsing dot
function PulseDot({ color = "#10b981" }: { color?: string }) {
  return (
    <span className="relative flex h-2.5 w-2.5 shrink-0">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ backgroundColor: color }} />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: color }} />
    </span>
  );
}

// Activity event row
function EventRow({ event, isDark }: { event: any; isDark: boolean }) {
  const icons: Record<string, React.ReactNode> = {
    login: <LogIn size={13} className="text-[#781c1c]" />,
    signup: <UserPlus size={13} className="text-emerald-500" />,
    completion: <CheckCircle2 size={13} className="text-blue-500" />,
  };
  const bgClasses: Record<string, string> = {
    login: isDark ? "bg-[#781c1c]/20" : "bg-[#781c1c]/8",
    signup: isDark ? "bg-emerald-500/20" : "bg-emerald-500/10",
    completion: isDark ? "bg-blue-500/20" : "bg-blue-500/10",
  };
  return (
    <div className={`flex items-center gap-3 py-2.5 border-b last:border-0 ${isDark ? "border-white/5" : "border-slate-100"}`}>
      <div className={`p-1.5 rounded-lg shrink-0 ${bgClasses[event.type] || ""}`}>
        {icons[event.type] || <Activity size={13} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-xs font-semibold truncate ${isDark ? "text-gray-200" : "text-slate-800"}`}>{event.name}</div>
        <div className={`text-[10px] ${isDark ? "text-gray-500" : "text-slate-400"}`}>{event.detail}</div>
      </div>
      <div className={`text-[10px] font-mono shrink-0 ${isDark ? "text-gray-500" : "text-slate-400"}`}>{relativeTime(event.timestamp)}</div>
    </div>
  );
}

// ─── Audience Tab ─────────────────────────────────────────────────────────────
function AudienceTab({ stream, isDark }: { stream: string; isDark: boolean }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/Admin/platform-analytics?type=audience&stream=${stream}`)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [stream]);

  const COLORS = [MAROON, "#d97706", "#0f766e", "#1e3a5f", "#7c3aed", "#0891b2", "#db2777", "#65a30d", "#ea580c", "#6366f1", "#14b8a6", "#f43f5e"];

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
      <SkeletonBox h="h-64" isDark={isDark} />
      <SkeletonBox h="h-64" isDark={isDark} />
    </div>
  );

  if (!data) return <div className="text-center py-8 text-sm text-gray-400">Failed to load audience data.</div>;

  return (
    <div className="mt-4 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Course breakdown */}
        <div className={`border rounded-2xl p-5 ${isDark ? "bg-white/[0.02] border-white/5" : "bg-white border-slate-200 shadow-xs"}`}>
          <h4 className={`text-sm font-serif font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>
            Students by Course
          </h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.courseData} layout="vertical" margin={{ top: 2, right: 32, left: 0, bottom: 2 }} barCategoryGap="25%">
              <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9"} />
              <XAxis type="number" tick={{ fontSize: 10, fill: isDark ? "#94a3b8" : "#64748b" }} axisLine={false} />
              <YAxis type="category" dataKey="course" width={90} tick={{ fontSize: 9, fill: isDark ? "#94a3b8" : "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: isDark ? "rgba(255,255,255,0.05)" : "rgba(100,116,139,0.08)", radius: 4 }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className={`px-3 py-2 rounded-xl border shadow-xl text-xs ${isDark ? "bg-[#14141c] border-white/10 text-white" : "bg-white border-slate-200"}`}>
                      <div className="font-bold">{payload[0].payload.course}</div>
                      <div className="text-gray-400">{payload[0].value} students</div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="count" name="Students" radius={[0, 4, 4, 0]} barSize={14}>
                {data.courseData.map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.85} />
                ))}
                <LabelList dataKey="count" position="right" style={{ fontSize: "10px", fontWeight: 700, fontFamily: "monospace", fill: isDark ? "#e2e8f0" : "#1e293b" }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Year breakdown */}
        <div className={`border rounded-2xl p-5 ${isDark ? "bg-white/[0.02] border-white/5" : "bg-white border-slate-200 shadow-xs"}`}>
          <h4 className={`text-sm font-serif font-bold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>
            Students by Year of Study
          </h4>
          <p className="text-[11px] text-gray-400 mb-4">Total: {data.total} enrolled</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data.yearData} cx="45%" cy="50%" outerRadius={80} innerRadius={44}
                dataKey="count" nameKey="year" paddingAngle={3}
              >
                {data.yearData.map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className={`px-3 py-2 rounded-xl border shadow-xl text-xs ${isDark ? "bg-[#14141c] border-white/10 text-white" : "bg-white border-slate-200"}`}>
                      <div className="font-bold">{d.year}</div>
                      <div className="text-gray-400">{d.count} students ({data.total > 0 ? Math.round((d.count/data.total)*100) : 0}%)</div>
                    </div>
                  );
                }}
              />
              <Legend
                iconType="circle"
                formatter={(value) => <span className={`text-[10px] font-medium ${isDark ? "text-gray-300" : "text-slate-700"}`}>{value}</span>}
                wrapperStyle={{ fontSize: "11px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── Realtime Panel ───────────────────────────────────────────────────────────
function RealtimePanel({ stream, isDark }: { stream: string; isDark: boolean }) {
  const [data, setData] = useState<any>(null);
  const [showFeed, setShowFeed] = useState(false);
  const intervalRef = useRef<any>(null);

  const fetchData = useCallback(() => {
    api.get(`/Admin/platform-analytics?type=realtime&stream=${stream}`)
      .then(r => setData(r.data))
      .catch(() => {});
  }, [stream]);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 45000); // poll every 45s
    return () => clearInterval(intervalRef.current);
  }, [fetchData]);

  return (
    <div className={`border rounded-2xl p-4 ${isDark ? "bg-white/[0.02] border-white/5" : "bg-white border-slate-200 shadow-xs"}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <PulseDot color="#10b981" />
          <span className={`text-xs font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Realtime</span>
          <span className={`text-[10px] ${isDark ? "text-gray-500" : "text-slate-400"}`}>· Updating live</span>
        </div>
        <button
          onClick={fetchData}
          title="Refresh now"
          className={`p-1 rounded-lg transition cursor-pointer ${isDark ? "hover:bg-white/10 text-gray-400" : "hover:bg-slate-100 text-slate-500"}`}
        >
          <RefreshCw size={12} />
        </button>
      </div>

      {/* 48h count */}
      <div className="mb-3">
        <div className={`text-3xl font-serif font-black ${isDark ? "text-white" : "text-slate-900"}`}>
          {data?.count48h ?? "—"}
        </div>
        <div className={`text-[11px] mt-0.5 ${isDark ? "text-gray-400" : "text-slate-500"}`}>
          Logins · Last 48 hours
        </div>
      </div>

      {/* See live count */}
      <button
        onClick={() => setShowFeed(f => !f)}
        className={`text-[11px] font-semibold flex items-center gap-1 mb-3 transition cursor-pointer ${isDark ? "text-[#f87171] hover:text-white" : "text-[#781c1c] hover:text-[#5f1515]"}`}
      >
        {showFeed ? "Hide" : "See"} live count <ArrowRight size={11} />
      </button>

      {showFeed && data?.recentEvents && (
        <div className={`mb-3 p-3 rounded-xl text-xs space-y-1.5 ${isDark ? "bg-white/[0.03] border border-white/5" : "bg-slate-50 border border-slate-100"}`}>
          <div className={`font-bold text-[10px] uppercase tracking-wider mb-2 ${isDark ? "text-gray-400" : "text-slate-500"}`}>Recent logins</div>
          {data.recentEvents.slice(0, 5).map((ev: any, i: number) => (
            <div key={i} className="flex justify-between gap-2">
              <span className={`truncate font-medium ${isDark ? "text-gray-200" : "text-slate-700"}`}>{ev.name}</span>
              <span className={`shrink-0 ${isDark ? "text-gray-500" : "text-slate-400"}`}>{relativeTime(ev.timestamp)}</span>
            </div>
          ))}
        </div>
      )}

      {/* 48h mini chart */}
      {data?.miniSeries && (
        <div>
          <div className={`text-[10px] font-mono uppercase tracking-wider mb-1.5 ${isDark ? "text-gray-500" : "text-slate-400"}`}>
            -48h → Now
          </div>
          <ResponsiveContainer width="100%" height={64}>
            <AreaChart data={data.miniSeries} margin={{ top: 2, right: 0, left: -32, bottom: 0 }}>
              <defs>
                <linearGradient id="rtGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={MAROON} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={MAROON} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fontSize: 8, fill: isDark ? "#6b7280" : "#94a3b8" }} axisLine={false} tickLine={false} interval={5} />
              <YAxis hide allowDecimals={false} />
              <Area type="monotone" dataKey="count" stroke={MAROON} strokeWidth={1.5} fill="url(#rtGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ─── Latest Activity Feed ─────────────────────────────────────────────────────
function ActivityFeed({ stream, days, isDark }: { stream: string; days: number; isDark: boolean }) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<any>(null);

  const fetchEvents = useCallback(() => {
    api.get(`/Admin/platform-analytics?type=activity&stream=${stream}&days=${days}`)
      .then(r => setEvents(r.data.events || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [stream, days]);

  useEffect(() => {
    setLoading(true);
    fetchEvents();
    intervalRef.current = setInterval(fetchEvents, 45000);
    return () => clearInterval(intervalRef.current);
  }, [fetchEvents]);

  return (
    <div className={`border rounded-2xl p-4 ${isDark ? "bg-white/[0.02] border-white/5" : "bg-white border-slate-200 shadow-xs"}`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Latest Activity</span>
        <PulseDot color={MAROON} />
      </div>
      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4].map(n => <SkeletonBox key={n} h="h-10" isDark={isDark} />)}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-4 text-xs text-gray-400">No recent activity in this range.</div>
      ) : (
        <div>
          {events.map((ev, i) => <EventRow key={i} event={ev} isDark={isDark} />)}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PlatformAnalytics({ activeStream, themeMode }: PlatformAnalyticsProps) {
  const isDark = themeMode === "dark";

  // Expand/collapse
  const [isExpanded, setIsExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  // Date range
  const [rangeIdx, setRangeIdx] = useState(1); // default "Last 28 days"
  const days = RANGE_OPTIONS[rangeIdx].days;

  // KPI metric focus (for main chart)
  const [focusMetric, setFocusMetric] = useState<KpiMetric>("logins");

  // Overview data
  const [overviewData, setOverviewData] = useState<any>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);

  // Growth/trends data (for Trends tab — reuse growth-analytics API)
  const [signupData, setSignupData] = useState<any>(null);
  const [engData, setEngData] = useState<any>(null);
  const [trendData, setTrendData] = useState<any>(null);
  const [funData, setFunData] = useState<any>(null);
  const [trendsLoading, setTrendsLoading] = useState(false);

  const fetchOverview = useCallback(async () => {
    setOverviewLoading(true);
    try {
      const r = await api.get(`/Admin/platform-analytics?type=overview&stream=${activeStream}&days=${days}`);
      setOverviewData(r.data);
    } catch { /* ignore */ } finally { setOverviewLoading(false); }
  }, [activeStream, days]);

  const fetchTrends = useCallback(async () => {
    setTrendsLoading(true);
    try {
      const [s, e, t, f] = await Promise.all([
        api.get(`/Admin/growth-analytics?type=signup-growth&stream=${activeStream}&days=90`),
        api.get(`/Admin/growth-analytics?type=engagement&stream=${activeStream}&days=30`),
        api.get(`/Admin/growth-analytics?type=trend&stream=${activeStream}`),
        api.get(`/Admin/growth-analytics?type=funnel&stream=${activeStream}`),
      ]);
      setSignupData(s.data); setEngData(e.data); setTrendData(t.data); setFunData(f.data);
    } catch { /* ignore */ } finally { setTrendsLoading(false); }
  }, [activeStream]);

  // Fetch when expanded and tab changes
  useEffect(() => {
    if (!isExpanded) return;
    if (activeTab === "Overview") fetchOverview();
    if (activeTab === "Trends" || activeTab === "Content") fetchTrends();
  }, [isExpanded, activeTab, activeStream, days, fetchOverview, fetchTrends]);

  // Main chart data
  const mainChartData = useMemo(() => {
    if (!overviewData?.series) return [];
    return overviewData.series.map((d: any) => ({
      date: fmtDate(d.date),
      logins: d.logins,
      newStudents: d.newStudents,
    }));
  }, [overviewData]);

  // Headline
  const headline = overviewData?.headline ?? `Showing analytics for the ${activeStream} stream`;

  // Collapsed summary line
  const collapsedSummary = overviewData
    ? `${overviewData.kpi.logins.curr} logins · ${overviewData.kpi.newStudents.curr} new students · ${overviewData.totalStudents} enrolled`
    : `${activeStream} stream platform analytics`;

  const metricKeyMap: Record<KpiMetric, string> = {
    logins: "logins", completions: "completions", newStudents: "newStudents",
  };
  const metricColors: Record<KpiMetric, string> = {
    logins: MAROON, completions: "#0891b2", newStudents: "#10b981",
  };

  // Funnel data for Content tab
  const funnelItems = funData?.funnel ?? [];

  return (
    <div className={`border rounded-3xl shadow-xl overflow-hidden transition-all duration-300 ${
      isDark ? "bg-[#0b0b0f] border-white/5" : "bg-gradient-to-b from-white to-[#faf8f5] border-stone-200"
    }`}>
      {/* ── COLLAPSED / HEADER ROW ── */}
      <button
        onClick={() => {
          setIsExpanded(e => !e);
        }}
        className="w-full flex flex-wrap items-center justify-between gap-3 px-5 py-4 cursor-pointer text-left"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={`p-2 rounded-xl shrink-0 ${isDark ? "bg-[#781c1c]/20" : "bg-[#781c1c]/10"}`}>
            <Activity size={16} className="text-[#781c1c]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`text-base font-serif font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                Platform Analytics
              </h3>
              <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                isDark ? "text-gray-400 border-white/10" : "text-slate-500 border-slate-200"
              }`}>{activeStream}</span>
              {!isExpanded && (
                <span className={`text-[11px] hidden sm:inline ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                  {collapsedSummary}
                </span>
              )}
            </div>
            {isExpanded && (
              <p className={`text-[11px] mt-0.5 ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                {headline}
              </p>
            )}
          </div>
        </div>
        <div className={`p-2 rounded-xl border transition shrink-0 ${
          isDark ? "bg-white/5 hover:bg-white/10 text-gray-300 border-white/10" : "bg-white hover:bg-stone-50 text-slate-600 border-slate-200"
        }`}>
          {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>
      </button>

      {/* ── EXPANDED CONTENT (animated height) ── */}
      <div
        ref={contentRef}
        className={`overflow-hidden transition-all duration-400 ease-in-out`}
        style={{ maxHeight: isExpanded ? "9999px" : "0px", opacity: isExpanded ? 1 : 0 }}
      >
        <div className={`border-t ${isDark ? "border-white/5" : "border-stone-200"}`}>
          {/* Tab bar + date range row */}
          <div className={`px-5 flex flex-wrap items-center justify-between gap-3 border-b ${isDark ? "border-white/5" : "border-stone-200"}`}>
            {/* Tabs */}
            <div className="flex items-end gap-0">
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-xs font-bold transition cursor-pointer border-b-2 -mb-px ${
                    activeTab === tab
                      ? "border-[#781c1c] text-[#781c1c]"
                      : isDark
                      ? "border-transparent text-gray-400 hover:text-gray-200"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Date range (only on Overview) */}
            {activeTab === "Overview" && (
              <div className="flex items-center gap-2 py-2">
                <select
                  value={rangeIdx}
                  onChange={e => setRangeIdx(Number(e.target.value))}
                  className={`text-xs px-2.5 py-1.5 rounded-xl border cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#781c1c] ${
                    isDark ? "bg-[#0b0b0f] border-white/10 text-gray-200" : "bg-white border-slate-200 text-slate-700"
                  }`}
                >
                  {RANGE_OPTIONS.map((opt, i) => <option key={i} value={i}>{opt.label}</option>)}
                </select>
                <span className={`text-[10px] font-mono hidden sm:inline ${isDark ? "text-gray-500" : "text-slate-400"}`}>
                  {fmtDateRange(days)}
                </span>
              </div>
            )}
          </div>

          {/* ── OVERVIEW TAB ── */}
          {activeTab === "Overview" && (
            <div className="p-5">
              {/* Headline */}
              <p className={`text-sm font-semibold mb-5 ${isDark ? "text-gray-200" : "text-slate-700"}`}>{headline}</p>

              <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6">
                {/* Left: KPIs + main chart */}
                <div className="space-y-5">
                  {/* KPI cards */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    {overviewLoading ? (
                      [1,2,3].map(n => <SkeletonBox key={n} h="h-28" isDark={isDark} />)
                    ) : overviewData ? (
                      <>
                        <KpiCard label="Logins" curr={overviewData.kpi.logins.curr} prev={overviewData.kpi.logins.prev}
                          icon={<LogIn size={14} />} isDark={isDark} active={focusMetric === "logins"}
                          onClick={() => setFocusMetric("logins")} />
                        <KpiCard label="Completions (100%)" curr={overviewData.kpi.completions.curr} prev={overviewData.kpi.completions.prev}
                          icon={<CheckCircle2 size={14} />} isDark={isDark} active={focusMetric === "completions"}
                          onClick={() => setFocusMetric("completions")} />
                        <KpiCard label="New Students" curr={overviewData.kpi.newStudents.curr} prev={overviewData.kpi.newStudents.prev}
                          icon={<UserPlus size={14} />} isDark={isDark} active={focusMetric === "newStudents"}
                          onClick={() => setFocusMetric("newStudents")} />
                      </>
                    ) : (
                      <div className="text-sm text-gray-400">Failed to load KPIs.</div>
                    )}
                  </div>

                  {/* Main trend chart */}
                  <div className={`border rounded-2xl p-4 ${isDark ? "bg-white/[0.02] border-white/5" : "bg-white border-slate-200 shadow-xs"}`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                        {focusMetric === "logins" ? "Logins" : focusMetric === "completions" ? "Completions" : "New Students"} over time
                      </span>
                      <button
                        onClick={() => setActiveTab("Trends")}
                        className={`text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition ${isDark ? "text-gray-400 hover:text-white" : "text-slate-400 hover:text-[#781c1c]"}`}
                      >
                        See more <ArrowRight size={11} />
                      </button>
                    </div>
                    {overviewLoading ? (
                      <SkeletonBox h="h-48" isDark={isDark} />
                    ) : mainChartData.length === 0 ? (
                      <div className="h-48 flex items-center justify-center text-sm text-gray-400">No data for this range.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={mainChartData} margin={{ top: 4, right: 8, left: -24, bottom: 4 }}>
                          <defs>
                            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={metricColors[focusMetric]} stopOpacity={0.25} />
                              <stop offset="95%" stopColor={metricColors[focusMetric]} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9"} />
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: isDark ? "#94a3b8" : "#64748b" }} axisLine={false} tickLine={false} interval={Math.floor(mainChartData.length / 6)} />
                          <YAxis tick={{ fontSize: 10, fill: isDark ? "#94a3b8" : "#64748b" }} allowDecimals={false} />
                          <Tooltip
                            cursor={{ stroke: isDark ? "rgba(255,255,255,0.2)" : "#cbd5e1", strokeWidth: 1.5, strokeDasharray: "3 3" }}
                            content={<MainTooltip isDark={isDark} />}
                          />
                          <Area
                            type="monotone"
                            dataKey={metricKeyMap[focusMetric]}
                            name={focusMetric === "logins" ? "Logins" : focusMetric === "newStudents" ? "New Students" : "Completions"}
                            stroke={metricColors[focusMetric]}
                            strokeWidth={2}
                            fill="url(#areaGrad)"
                            dot={false}
                            activeDot={{ r: 4, fill: metricColors[focusMetric], strokeWidth: 0 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Right: Realtime + Activity */}
                <div className="space-y-4">
                  <RealtimePanel stream={activeStream} isDark={isDark} />
                  <ActivityFeed stream={activeStream} days={days} isDark={isDark} />
                </div>
              </div>
            </div>
          )}

          {/* ── CONTENT TAB (Portfolio Funnel) ── */}
          {activeTab === "Content" && (
            <div className="p-5">
              <div className="mb-4">
                <h4 className={`text-sm font-serif font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Portfolio Completion Funnel</h4>
                <p className={`text-[11px] mt-0.5 text-gray-400`}>
                  % of {activeStream} students who have each portfolio section filled — current snapshot
                </p>
              </div>
              {trendsLoading ? (
                <div className="space-y-2">{[1,2,3,4,5,6,7].map(n => <SkeletonBox key={n} h="h-7" isDark={isDark} />)}</div>
              ) : funnelItems.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-400">No funnel data.</div>
              ) : (
                <div className="space-y-2">
                  {funnelItems.map((item: any) => {
                    const barColor = item.pct >= 70 ? "#10b981" : item.pct >= 40 ? "#f59e0b" : "#ef4444";
                    return (
                      <div key={item.section} className="flex items-center gap-3">
                        <div className={`w-32 text-[11px] font-semibold text-right shrink-0 ${isDark ? "text-gray-300" : "text-slate-700"}`}>
                          {item.label}
                        </div>
                        <div className="flex-1 h-7 rounded-lg overflow-hidden" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9" }}>
                          <div className="h-full rounded-lg transition-all duration-700 flex items-center pl-2" style={{ width: `${item.pct}%`, backgroundColor: barColor }}>
                            {item.pct >= 15 && <span className="text-[10px] font-mono font-bold text-white">{item.pct}%</span>}
                          </div>
                        </div>
                        <div className={`w-16 text-[10px] font-mono font-bold text-right shrink-0 ${isDark ? "text-gray-300" : "text-slate-700"}`}>
                          {item.count}<span className={`font-normal ml-0.5 ${isDark ? "text-gray-500" : "text-slate-400"}`}>/{funData?.total ?? 0}</span>
                        </div>
                      </div>
                    );
                  })}
                  <p className={`text-[10px] mt-2 ${isDark ? "text-gray-500" : "text-slate-400"}`}>
                    Drop-off shows where students stop filling their portfolio.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── AUDIENCE TAB ── */}
          {activeTab === "Audience" && (
            <div className="p-5">
              <div className="mb-2">
                <h4 className={`text-sm font-serif font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Audience Breakdown</h4>
                <p className={`text-[11px] mt-0.5 text-gray-400`}>{activeStream} stream — enrolled students by course and year of study</p>
              </div>
              <AudienceTab stream={activeStream} isDark={isDark} />
            </div>
          )}

          {/* ── TRENDS TAB ── */}
          {activeTab === "Trends" && (
            <div className="p-5 space-y-6">
              <div className="mb-2">
                <h4 className={`text-sm font-serif font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Growth & Engagement Trends</h4>
                <p className={`text-[11px] mt-0.5 text-gray-400`}>{activeStream} stream — signup growth, engagement, and completion rate over time</p>
              </div>

              {/* Signup growth */}
              <div className={`border rounded-2xl p-5 ${isDark ? "bg-white/[0.02] border-white/5" : "bg-white border-slate-200 shadow-xs"}`}>
                <h5 className={`text-xs font-bold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}>📈 Signup Growth (Last 90 days)</h5>
                {trendsLoading ? <SkeletonBox h="h-44" isDark={isDark} /> : signupData?.series ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={signupData.series.filter((_: any, i: number) => i % 7 === 0)} margin={{ top: 4, right: 12, left: -24, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9"} />
                      <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 9, fill: isDark ? "#94a3b8" : "#64748b" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: isDark ? "#94a3b8" : "#64748b" }} allowDecimals={false} />
                      <Tooltip content={<MainTooltip isDark={isDark} />} />
                      <Line type="monotone" dataKey="newSignups" name="New Signups" stroke={MAROON} strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="total" name="Cumulative" stroke="#d97706" strokeWidth={2} dot={false} strokeDasharray="5 3" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <div className="h-44 flex items-center justify-center text-sm text-gray-400">No data.</div>}
              </div>

              {/* DAU */}
              <div className={`border rounded-2xl p-5 ${isDark ? "bg-white/[0.02] border-white/5" : "bg-white border-slate-200 shadow-xs"}`}>
                <h5 className={`text-xs font-bold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}>⚡ Daily Active Students (Last 30 days)</h5>
                {trendsLoading ? <SkeletonBox h="h-36" isDark={isDark} /> : engData?.series ? (
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={engData.series.map((d: any) => ({ ...d, date: fmtDate(d.date) }))} margin={{ top: 4, right: 8, left: -24, bottom: 4 }} barSize={5}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.04)" : "#f1f5f9"} />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: isDark ? "#94a3b8" : "#64748b" }} axisLine={false} tickLine={false} interval={6} />
                      <YAxis tick={{ fontSize: 9, fill: isDark ? "#94a3b8" : "#64748b" }} allowDecimals={false} />
                      <Tooltip content={<MainTooltip isDark={isDark} />} />
                      <Bar dataKey="dau" name="Active Students" radius={[3,3,0,0]}>
                        {engData.series.map((_: any, i: number) => <Cell key={i} fill={MAROON} fillOpacity={0.75} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="h-36 flex items-center justify-center text-sm text-gray-400">No data.</div>}
              </div>

              {/* Completion rate trend */}
              <div className={`border rounded-2xl p-5 ${isDark ? "bg-white/[0.02] border-white/5" : "bg-white border-slate-200 shadow-xs"}`}>
                <h5 className={`text-xs font-bold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}>📊 Avg Completion Rate Trend</h5>
                {trendsLoading ? <SkeletonBox h="h-44" isDark={isDark} /> : trendData?.insufficientData ? (
                  <div className="h-44 flex flex-col items-center justify-center gap-2 text-sm text-gray-400">
                    <AlertCircle size={24} className="text-amber-500" />
                    <span>Not enough snapshot data yet.</span>
                    <p className="text-xs text-center max-w-xs">Use the Capture Today button in the Growth & Engagement section below to start accumulating trend history.</p>
                  </div>
                ) : trendData?.series ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={trendData.series.map((d: any) => ({ ...d, date: fmtDate(d.date) }))} margin={{ top: 4, right: 12, left: -24, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9"} />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: isDark ? "#94a3b8" : "#64748b" }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0,100]} tick={{ fontSize: 9, fill: isDark ? "#94a3b8" : "#64748b" }} unit="%" />
                      <Tooltip content={<MainTooltip isDark={isDark} />} />
                      <Line type="monotone" dataKey="avgCompletion" name="Avg Completion" stroke={MAROON} strokeWidth={2.5} dot={{ r: 3, fill: MAROON }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <div className="h-44 flex items-center justify-center text-sm text-gray-400">No data.</div>}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

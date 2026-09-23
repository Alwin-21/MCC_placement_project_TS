"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LabelList,
} from "recharts";
import {
  Download,
  FileText,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Users,
  Code,
  Layers,
  Search,
  Building2,
  Clock,
  ArrowUpDown,
  Edit2,
  Save,
  X,
} from "lucide-react";
import api from "@/services/api";
import { MCC_CREST_WHITE_DATA_URL } from "@/utils/mccCrestBase64";

export interface DepartmentStudentCompletion {
  id: string;
  fullName: string;
  registerNumber: string;
  completionPercentage: number;
}

export interface DepartmentMetric {
  department: string;
  stream: "Aided" | "SFS"; // Served from API
  studentCount: number;
  projectCount: number;
  paperCount: number;
  skillCount: number;
  approvalRate: number; // 0 to 100 (kept for backward compatibility)
  completionRate?: number | null; // 0 to 100 (or null if 0 students)
  students?: DepartmentStudentCompletion[];
  lastUpdated?: string;
}

interface DepartmentAnalyticsProps {
  deptAnalytics: DepartmentMetric[];
  loading: boolean;
  themeMode: "light" | "dark";
  onRefresh?: () => Promise<void> | void;
  canWrite?: boolean;
}

// ────────────────────────────────────────────────────────────
// Custom Axis Ticks: fit median labels tightly, tooltip on hover
// ────────────────────────────────────────────────────────────
function TruncatedYAxisTick({
  x, y, payload, isDark, maxChars = 14,
}: {
  x?: number | string; y?: number | string; payload?: { value: string };
  isDark: boolean; maxChars?: number;
}) {
  if (!payload) return null;
  const full = payload.value || "";
  const label = full.length > maxChars ? full.slice(0, maxChars - 1) + "…" : full;
  return (
    <g transform={`translate(${x},${y})`}>
      <title>{full}</title>
      <text
        x={-8}
        y={0}
        dy={3.5}
        textAnchor="end"
        fill={isDark ? "#cbd5e1" : "#334155"}
        fontSize={10}
        fontWeight={600}
        style={{ cursor: "default", userSelect: "none" }}
      >
        {label}
      </text>
    </g>
  );
}

function TruncatedXAxisTick({
  x, y, payload, isDark, maxChars = 11,
}: {
  x?: number | string; y?: number | string; payload?: { value: string };
  isDark: boolean; maxChars?: number;
}) {
  if (!payload) return null;
  const full = payload.value || "";
  const label = full.length > maxChars ? full.slice(0, maxChars - 1) + "…" : full;
  return (
    <g transform={`translate(${x},${y})`}>
      <title>{full}</title>
      <text
        x={0}
        y={10}
        textAnchor="middle"
        fill={isDark ? "#94a3b8" : "#64748b"}
        fontSize={10}
        fontWeight={600}
        style={{ cursor: "default", userSelect: "none" }}
      >
        {label}
      </text>
    </g>
  );
}

export default function DepartmentAnalytics({
  deptAnalytics = [],
  loading = false,
  themeMode = "light",
  onRefresh,
  canWrite = false,
}: DepartmentAnalyticsProps) {
  const isDark = themeMode === "dark";

  // Client-mount check for SSR-safe Recharts rendering
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  // ──────────────────────────────────────────────────────────
  // STREAM TOGGLE — persisted in component state (localStorage-backed)
  // ──────────────────────────────────────────────────────────
  const [activeStream, setActiveStream] = useState<"Aided" | "SFS">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mcc_dept_analytics_stream");
      if (saved === "Aided" || saved === "SFS") return saved as "Aided" | "SFS";
    }
    return "Aided";
  });

  // Persist selection
  const handleStreamChange = (stream: "Aided" | "SFS") => {
    setActiveStream(stream);
    if (typeof window !== "undefined") {
      localStorage.setItem("mcc_dept_analytics_stream", stream);
    }
  };

  // ──────────────────────────────────────────────────────────
  // STREAM EDITOR STATE (for admin to reclassify departments)
  // ──────────────────────────────────────────────────────────
  const [streamEditorOpen, setStreamEditorOpen] = useState(false);
  const [editingStreams, setEditingStreams] = useState<Record<string, "Aided" | "SFS">>({});
  const [savingStreams, setSavingStreams] = useState(false);

  const openStreamEditor = () => {
    // Initialise from current data
    const initial: Record<string, "Aided" | "SFS"> = {};
    deptAnalytics.forEach((d) => { initial[d.department] = d.stream; });
    setEditingStreams(initial);
    setStreamEditorOpen(true);
  };

  const handleSaveStreams = async () => {
    try {
      setSavingStreams(true);
      await api.put("/Admin/institution/dept-streams", { deptStreams: editingStreams });
      setStreamEditorOpen(false);
      if (onRefresh) await onRefresh();
    } catch (err) {
      console.error("Failed to save department streams:", err);
      alert("Failed to save stream classification. Please try again.");
    } finally {
      setSavingStreams(false);
    }
  };

  // ──────────────────────────────────────────────────────────
  // FILTERED DATA for the active stream
  // ──────────────────────────────────────────────────────────
  const streamData = useMemo(
    () => deptAnalytics.filter((d) => d.stream === activeStream),
    [deptAnalytics, activeStream]
  );

  const aidedCount = useMemo(() => deptAnalytics.filter((d) => d.stream === "Aided").length, [deptAnalytics]);
  const sfsCount   = useMemo(() => deptAnalytics.filter((d) => d.stream === "SFS").length,   [deptAnalytics]);

  // ──────────────────────────────────────────────────────────
  // UI States
  // ──────────────────────────────────────────────────────────
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"students" | "completion" | "verification" | "projects" | "name">("completion");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [exportingDept, setExportingDept] = useState<string | null>(null);
  const [exportingAll, setExportingAll] = useState<"pdf" | "csv" | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedStudents, setExpandedStudents] = useState<Record<string, boolean>>({});

  const toggleStudents = (deptName: string) => {
    setExpandedStudents((prev) => ({ ...prev, [deptName]: !prev[deptName] }));
  };

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Close export dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("#export-all-dropdown-container")) {
        setExportDropdownOpen(false);
      }
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  // ──────────────────────────────────────────────────────────
  // KPI CALCULATIONS (computed on filtered stream data)
  // ──────────────────────────────────────────────────────────
  const kpiData = useMemo(() => {
    const data = streamData;
    if (!data || data.length === 0) {
      return { totalStudents: 0, avgCompletionRate: 0, totalProjects: 0, attentionNeededCount: 0 };
    }
    const totalStudents  = data.reduce((acc, d) => acc + (d.studentCount || 0), 0);
    const totalProjects  = data.reduce((acc, d) => acc + (d.projectCount || 0), 0);

    const deptsWithStudents = data.filter((d) => d.studentCount > 0);
    let avgCompletionRate = 0;
    if (totalStudents > 0) {
      const weightedSum = deptsWithStudents.reduce((acc, d) => {
        const rate = (d.completionRate !== undefined && d.completionRate !== null) ? d.completionRate : (d.approvalRate || 0);
        return acc + rate * d.studentCount;
      }, 0);
      avgCompletionRate = Math.round((weightedSum / totalStudents) * 10) / 10;
    } else if (data.length > 0) {
      const simpleSum = data.reduce((acc, d) => {
        const rate = (d.completionRate !== undefined && d.completionRate !== null) ? d.completionRate : (d.approvalRate || 0);
        return acc + rate;
      }, 0);
      avgCompletionRate = Math.round((simpleSum / data.length) * 10) / 10;
    }

    // Departments with enrolled students whose completion rate is < 40% (0-student departments excluded)
    const attentionNeededCount = deptsWithStudents.filter((d) => {
      const rate = (d.completionRate !== undefined && d.completionRate !== null) ? d.completionRate : (d.approvalRate || 0);
      return rate < 40;
    }).length;

    return { totalStudents, avgCompletionRate, totalProjects, attentionNeededCount };
  }, [streamData]);

  // ──────────────────────────────────────────────────────────
  // CHART DATA (always based on filtered stream)
  // ──────────────────────────────────────────────────────────
  const completionComparisonData = useMemo(() => {
    return [...streamData]
      .sort((a, b) => {
        const rateA = (a.completionRate !== undefined && a.completionRate !== null) ? a.completionRate : (a.approvalRate || 0);
        const rateB = (b.completionRate !== undefined && b.completionRate !== null) ? b.completionRate : (b.approvalRate || 0);
        return rateB - rateA;
      })
      .map((d) => {
        const rate = (d.completionRate !== undefined && d.completionRate !== null) ? d.completionRate : (d.approvalRate || 0);
        let color = "#ef4444";
        if (rate >= 70) color = "#10b981";
        else if (rate >= 40) color = "#f59e0b";
        if (d.studentCount === 0) color = isDark ? "#475569" : "#cbd5e1";
        return {
          department: d.department,
          completionRate: rate,
          studentCount: d.studentCount || 0,
          fillColor: color,
        };
      });
  }, [streamData, isDark]);

  const productionComparisonData = useMemo(() => {
    return [...streamData]
      .sort((a, b) => (b.studentCount || 0) - (a.studentCount || 0))
      .map((d) => ({
        department: d.department,
        shortDept: d.department.length > 14 ? d.department.slice(0, 12) + "…" : d.department,
        Projects: d.projectCount || 0,
        Papers: d.paperCount || 0,
        Skills: d.skillCount || 0,
      }));
  }, [streamData]);

  // ──────────────────────────────────────────────────────────
  // DEPARTMENT CARDS — filtered by stream + search + sort
  // ──────────────────────────────────────────────────────────
  const processedDepartments = useMemo(() => {
    let list = streamData.filter((d) =>
      d.department.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );
    list.sort((a, b) => {
      const rateA = (a.completionRate !== undefined && a.completionRate !== null) ? a.completionRate : (a.approvalRate || 0);
      const rateB = (b.completionRate !== undefined && b.completionRate !== null) ? b.completionRate : (b.approvalRate || 0);
      switch (sortBy) {
        case "students":
          return sortOrder === "asc" ? (a.studentCount || 0) - (b.studentCount || 0) : (b.studentCount || 0) - (a.studentCount || 0);
        case "completion":
        case "verification":
          return sortOrder === "asc" ? rateA - rateB : rateB - rateA;
        case "projects":
          return sortOrder === "asc" ? (a.projectCount || 0) - (b.projectCount || 0) : (b.projectCount || 0) - (a.projectCount || 0);
        case "name":
          return sortOrder === "asc"
            ? a.department.localeCompare(b.department)
            : b.department.localeCompare(a.department);
        default:
          return 0;
      }
    });
    return list;
  }, [streamData, searchQuery, sortBy, sortOrder]);

  // ──────────────────────────────────────────────────────────
  // HELPERS
  // ──────────────────────────────────────────────────────────
  const getGaugeColor = (rate: number, count: number) => {
    if (count === 0) return isDark ? "#64748b" : "#94a3b8";
    if (rate < 40) return "#ef4444";
    if (rate <= 70) return "#f59e0b";
    return "#10b981";
  };

  const getCompletionTier = (rate: number, count: number) => {
    if (count === 0) return { label: "No Data", badge: isDark ? "text-slate-400 bg-white/5" : "text-slate-500 bg-slate-100" };
    if (rate < 40) return { label: "Action Required", badge: "text-rose-500 bg-rose-500/10 border border-rose-500/20" };
    if (rate <= 70) return { label: "Moderate Progress", badge: "text-amber-500 bg-amber-500/10 border border-amber-500/20" };
    return { label: "Optimal Health", badge: "text-emerald-500 bg-emerald-500/10 border border-emerald-500/20" };
  };

  const maxMetricCount = useMemo(() => {
    let max = 5;
    streamData.forEach((d) => {
      if (d.projectCount > max) max = d.projectCount;
      if (d.paperCount > max) max = d.paperCount;
      if (d.skillCount > max) max = d.skillCount;
    });
    return max;
  }, [streamData]);

  const handleRefreshClick = async () => {
    if (onRefresh) {
      try {
        setRefreshing(true);
        await onRefresh();
      } finally {
        setTimeout(() => setRefreshing(false), 500);
      }
    }
  };

  // ──────────────────────────────────────────────────────────
  // CHART SIZING & SCROLL CONFIGURATION
  // ──────────────────────────────────────────────────────────
  // Chart 1 (Left): Portfolio Completion Rate (Ranked)
  const CHART_ROW_PX = 32;
  const CHART_MAX_VISIBLE = 9; // 9 rows visible comfortably before scrolling
  const completionScrollable = completionComparisonData.length > CHART_MAX_VISIBLE;
  const completionChartH = completionScrollable
    ? CHART_MAX_VISIBLE * CHART_ROW_PX
    : Math.max(160, completionComparisonData.length * CHART_ROW_PX);
  const completionScrollH = completionComparisonData.length * CHART_ROW_PX;
  const Y_AXIS_WIDTH = 96; // Fitted for median length (~10-12 chars), avoiding large empty gutter

  // Chart 2 (Right): Academic & Technical Production (Horizontal scroll)
  const PROD_COL_WIDTH = 70; // Width per department group
  const PROD_VISIBLE_DEPT_COUNT = 7; // Show 6-8 departments comfortably without diagonal rotation
  const prodScrollable = productionComparisonData.length > PROD_VISIBLE_DEPT_COUNT;
  const prodChartWidth = prodScrollable ? productionComparisonData.length * PROD_COL_WIDTH : "100%";
  const prodChartHeight = 288; // Matches left card viewport height for a clean balanced layout

  // ──────────────────────────────────────────────────────────
  // HELPERS: Asset Loaders & Native Chart Generators
  // ──────────────────────────────────────────────────────────
  const generateGaugeChartDataUrl = (completionRate: number, studentCount: number, size = 380): string => {
    if (typeof document === "undefined") return "";
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    const center = size / 2;
    const radius = size * 0.38;
    const lineWidth = size * 0.11;

    // Outer background circle
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    // Value Arc
    if (studentCount > 0 && completionRate > 0) {
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + (Math.min(100, Math.max(0, completionRate)) / 100) * (Math.PI * 2);
      ctx.beginPath();
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.strokeStyle = completionRate >= 70 ? "#10b981" : completionRate >= 40 ? "#f59e0b" : "#ef4444";
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.stroke();
    }

    // Centered percentage & label
    ctx.fillStyle = studentCount === 0 ? "#64748b" : "#0f172a";
    ctx.font = `bold ${Math.round(size * 0.19)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(studentCount === 0 ? "0%" : `${Math.round(completionRate)}%`, center, center - size * 0.05);

    ctx.fillStyle = "#64748b";
    ctx.font = `bold ${Math.round(size * 0.065)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText(studentCount === 0 ? "NO DATA" : "COMPLETE", center, center + size * 0.13);

    return canvas.toDataURL("image/png");
  };

  const generateBarChartDataUrl = (dept: DepartmentMetric, maxMetricVal: number, width = 820, height = 360): string => {
    if (typeof document === "undefined") return "";
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    const items = [
      { label: "Projects", count: dept.projectCount || 0, color: "#781c1c" },
      { label: "Research Papers", count: dept.paperCount || 0, color: "#d97706" },
      { label: "Skills Logged", count: dept.skillCount || 0, color: "#0f766e" },
    ];

    const maxVal = Math.max(maxMetricVal, 5);
    const rowH = height / items.length;
    const labelW = 210;
    const rightPad = 130;
    const trackW = width - labelW - rightPad;
    const barThickness = 24;

    items.forEach((item, idx) => {
      const yCenter = idx * rowH + rowH / 2;

      // Label on left
      ctx.fillStyle = "#1e293b";
      ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(item.label, 10, yCenter - 10);

      // Subtitle (per student average)
      const perStud = dept.studentCount > 0 ? (item.count / dept.studentCount).toFixed(1) : "0";
      ctx.fillStyle = "#64748b";
      ctx.font = '500 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`${perStud} per student`, 10, yCenter + 15);

      // Background track
      const trackX = labelW;
      const trackY = yCenter - barThickness / 2;

      ctx.fillStyle = "#f1f5f9";
      ctx.beginPath();
      if ((ctx as any).roundRect) {
        (ctx as any).roundRect(trackX, trackY, trackW, barThickness, 12);
      } else {
        ctx.rect(trackX, trackY, trackW, barThickness);
      }
      ctx.fill();

      if (item.count > 0) {
        const fillW = Math.max(14, (item.count / maxVal) * trackW);
        ctx.fillStyle = item.color;
        ctx.beginPath();
        if ((ctx as any).roundRect) {
          (ctx as any).roundRect(trackX, trackY, fillW, barThickness, 12);
        } else {
          ctx.rect(trackX, trackY, fillW, barThickness);
        }
        ctx.fill();

        // Bold numeric value at end of bar
        ctx.fillStyle = "#0f172a";
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(item.count.toString(), trackX + fillW + 14, yCenter);
      } else {
        // Explicit intentional zero state with dashed track
        ctx.save();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 2;
        ctx.beginPath();
        if ((ctx as any).roundRect) {
          (ctx as any).roundRect(trackX, trackY, trackW, barThickness, 12);
        } else {
          ctx.rect(trackX, trackY, trackW, barThickness);
        }
        ctx.stroke();
        ctx.restore();

        // Distinct "0" label next to track
        ctx.fillStyle = "#64748b";
        ctx.font = 'bold 22px monospace';
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText("0", trackX + 14, yCenter);

        ctx.fillStyle = "#94a3b8";
        ctx.font = 'italic 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText("(None recorded)", trackX + trackW + 14, yCenter);
      }
    });

    return canvas.toDataURL("image/png");
  };

  // ──────────────────────────────────────────────────────────
  // RENDERER: Single Department Report Page (Native jsPDF)
  // ──────────────────────────────────────────────────────────
  const renderDepartmentReportPage = (
    pdf: any,
    dept: DepartmentMetric,
    allDepts: DepartmentMetric[],
    pageNum = 1,
    totalPages = 1
  ) => {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    // 1. Institutional Benchmarks Calculation
    const deptRate = (dept.completionRate !== undefined && dept.completionRate !== null) ? dept.completionRate : (dept.approvalRate || 0);
    const totalStudents = allDepts.reduce((acc, d) => acc + (d.studentCount || 0), 0);
    const weightedSum = allDepts.reduce((acc, d) => {
      const r = (d.completionRate !== undefined && d.completionRate !== null) ? d.completionRate : (d.approvalRate || 0);
      return acc + r * (d.studentCount || 0);
    }, 0);
    const collegeAvgCompletion = totalStudents > 0 ? Math.round((weightedSum / totalStudents) * 10) / 10 : 0;
    const totalProjects = allDepts.reduce((acc, d) => acc + (d.projectCount || 0), 0);
    const totalPapers = allDepts.reduce((acc, d) => acc + (d.paperCount || 0), 0);
    const totalSkills = allDepts.reduce((acc, d) => acc + (d.skillCount || 0), 0);
    const collegeAvgProjectsPerStudent = totalStudents > 0 ? (totalProjects / totalStudents).toFixed(2) : "0.00";
    const collegeAvgPapersPerStudent = totalStudents > 0 ? (totalPapers / totalStudents).toFixed(2) : "0.00";
    const collegeAvgSkillsPerStudent = totalStudents > 0 ? (totalSkills / totalStudents).toFixed(2) : "0.00";

    // 2. Header Banner
    pdf.setFillColor(120, 28, 28);
    pdf.rect(0, 0, pageWidth, 28, "F");
    pdf.setFillColor(194, 65, 12);
    pdf.rect(0, 28, pageWidth, 1.2, "F");

    // College Crest / Logo: Crisp white silhouette on maroon banner (228 x 294 ratio: 15.5mm x 20mm)
    let textStartX = 14;
    try {
      if (MCC_CREST_WHITE_DATA_URL) {
        pdf.addImage(MCC_CREST_WHITE_DATA_URL, "PNG", 14, 4, 15.5, 20);
        textStartX = 34;
      }
    } catch {
      textStartX = 14;
    }

    // Header Text Block
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("times", "bold");
    pdf.setFontSize(14.5);
    pdf.text("MADRAS CHRISTIAN COLLEGE (AUTONOMOUS)", textStartX, 12.5);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    pdf.setTextColor(254, 226, 226);
    pdf.text(`Department Analytics Report • ${dept.stream} Stream`, textStartX, 19.5);
    pdf.text(`Generated: ${dateStr}`, pageWidth - 14, 19.5, { align: "right" });

    // 3. Department Title Block (Full, untruncated name)
    let titleSize = 17;
    if (dept.department.length > 36) titleSize = 12;
    else if (dept.department.length > 25) titleSize = 14;
    else if (dept.department.length > 18) titleSize = 15.5;

    pdf.setFont("times", "bold");
    pdf.setFontSize(titleSize);
    pdf.setTextColor(15, 23, 42);
    pdf.text(dept.department, 14, 38.5);

    // Colored Status Pill
    let pillText = "Optimal Health";
    let pillBg = [236, 253, 245];
    let pillBorder = [167, 243, 208];
    let pillColor = [5, 150, 105];

    if (dept.studentCount === 0) {
      pillText = "No Data";
      pillBg = [241, 245, 249];
      pillBorder = [203, 213, 225];
      pillColor = [100, 116, 139];
    } else if (deptRate < 40) {
      pillText = "Critical";
      pillBg = [254, 242, 242];
      pillBorder = [254, 202, 202];
      pillColor = [225, 29, 72];
    } else if (deptRate <= 70) {
      pillText = "Needs Attention";
      pillBg = [254, 243, 199];
      pillBorder = [253, 230, 138];
      pillColor = [217, 119, 6];
    }

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    const pillW = pdf.getTextWidth(pillText) + 8;
    pdf.setFillColor(pillBg[0], pillBg[1], pillBg[2]);
    pdf.setDrawColor(pillBorder[0], pillBorder[1], pillBorder[2]);
    pdf.roundedRect(pageWidth - 14 - pillW, 33.5, pillW, 6, 1.5, 1.5, "FD");
    pdf.setTextColor(pillColor[0], pillColor[1], pillColor[2]);
    pdf.text(pillText, pageWidth - 14 - pillW / 2, 37.6, { align: "center" });

    // Subheading line
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`Stream: ${dept.stream}   |   Students: ${dept.studentCount}   |   Completion Rate: ${dept.studentCount === 0 ? "No Data" : `${deptRate}%`}`, 14, 45);

    pdf.setDrawColor(226, 232, 240);
    pdf.line(14, 48.5, pageWidth - 14, 48.5);

    // 4. Visual Summary Row (Two Columns Side-by-Side)
    const cardY = 51.5;
    const cardH = 52;
    const cardW = 88;

    // LEFT COLUMN: Completion Donut Gauge
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(14, cardY, cardW, cardH, 2.5, 2.5, "FD");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.5);
    pdf.setTextColor(71, 85, 105);
    pdf.text("PORTFOLIO COMPLETION HEALTH", 18, cardY + 6.5);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6.5);
    pdf.setTextColor(148, 163, 184);
    pdf.text("Required portfolio fields completion", 18, cardY + 10.5);

    const gaugeDataUrl = generateGaugeChartDataUrl(deptRate, dept.studentCount);
    if (gaugeDataUrl) {
      pdf.addImage(gaugeDataUrl, "PNG", 17, cardY + 12, 36, 36);
    }

    const optimalCount = dept.students ? dept.students.filter(s => s.completionPercentage >= 70).length : Math.round((dept.studentCount * deptRate) / 100);
    const pendingCount = dept.studentCount - optimalCount;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(100, 116, 139);
    pdf.text("OPTIMAL PORTFOLIOS", 58, cardY + 18);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(16, 185, 129);
    pdf.text(`${optimalCount} students`, 58, cardY + 23);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(100, 116, 139);
    pdf.text("ATTENTION / INCOMPLETE", 58, cardY + 29);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(pendingCount > 0 ? 225 : 100, pendingCount > 0 ? 29 : 116, pendingCount > 0 ? 72 : 139);
    pdf.text(`${pendingCount} students`, 58, cardY + 34);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6.5);
    pdf.setTextColor(148, 163, 184);
    pdf.text(`College Benchmark: ${collegeAvgCompletion}%`, 58, cardY + 41);

    // RIGHT COLUMN: Horizontal Bar Chart
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(108, cardY, cardW, cardH, 2.5, 2.5, "FD");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.5);
    pdf.setTextColor(71, 85, 105);
    pdf.text("ACADEMIC & TECHNICAL PRODUCTION", 112, cardY + 6.5);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6.5);
    pdf.setTextColor(148, 163, 184);
    pdf.text("Logged projects, papers, and skills", 112, cardY + 10.5);

    let maxMetric = 5;
    allDepts.forEach((d) => {
      if (d.projectCount > maxMetric) maxMetric = d.projectCount;
      if (d.paperCount > maxMetric) maxMetric = d.paperCount;
      if (d.skillCount > maxMetric) maxMetric = d.skillCount;
    });

    const barDataUrl = generateBarChartDataUrl(dept, maxMetric);
    if (barDataUrl) {
      pdf.addImage(barDataUrl, "PNG", 111, cardY + 12, 82, 36);
    }

    // 5. Metrics Table (With College Benchmark Comparison)
    const tableStartY = 107.5;
    pdf.setFillColor(241, 245, 249);
    pdf.rect(14, tableStartY, 182, 7, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(51, 65, 85);
    pdf.text("Metric", 18, tableStartY + 4.8);
    pdf.text("Count", 76, tableStartY + 4.8);
    pdf.text("Performance", 102, tableStartY + 4.8);
    pdf.text("Department vs. College Benchmark", 140, tableStartY + 4.8);

    const completionDelta = deptRate - collegeAvgCompletion;
    let completionComp = `On par with avg (${collegeAvgCompletion}%)`;
    let completionCompColor: [number, number, number] = [100, 116, 139];
    if (dept.studentCount === 0) {
      completionComp = "No students enrolled";
      completionCompColor = [100, 116, 139];
    } else if (completionDelta > 0) {
      completionComp = `+${completionDelta.toFixed(1)}% above avg (${collegeAvgCompletion}%)`;
      completionCompColor = [16, 185, 129];
    } else if (completionDelta < 0) {
      completionComp = `${Math.abs(completionDelta).toFixed(1)}% below avg (${collegeAvgCompletion}%)`;
      completionCompColor = [225, 29, 72];
    }

    const deptShare = totalStudents > 0 ? ((dept.studentCount / totalStudents) * 100).toFixed(1) : "0";

    const rows = [
      {
        label: "Total Students Enrolled",
        val: dept.studentCount.toString(),
        perf: dept.studentCount > 0 ? "Active Roster" : "No Records",
        comp: `${deptShare}% of ${totalStudents} college students`,
        color: [15, 23, 42] as [number, number, number],
      },
      {
        label: "Portfolio Completion Rate",
        val: dept.studentCount === 0 ? "No Data" : `${deptRate}%`,
        perf: dept.studentCount === 0 ? "No Records" : deptRate >= 70 ? "Optimal (>70%)" : deptRate >= 40 ? "Moderate (40-70%)" : "Attention (<40%)",
        comp: completionComp,
        color: completionCompColor,
      },
      {
        label: "Student Projects Logged",
        val: dept.projectCount.toString(),
        perf: `${dept.studentCount > 0 ? (dept.projectCount / dept.studentCount).toFixed(2) : "0"}/student`,
        comp: `College avg: ${collegeAvgProjectsPerStudent}/student`,
        color: [15, 23, 42] as [number, number, number],
      },
      {
        label: "Research Papers & Publications",
        val: dept.paperCount.toString(),
        perf: `${dept.studentCount > 0 ? (dept.paperCount / dept.studentCount).toFixed(2) : "0"}/student`,
        comp: `College avg: ${collegeAvgPapersPerStudent}/student`,
        color: [15, 23, 42] as [number, number, number],
      },
      {
        label: "Technical & Domain Skills Logged",
        val: dept.skillCount.toString(),
        perf: `${dept.studentCount > 0 ? (dept.skillCount / dept.studentCount).toFixed(2) : "0"}/student`,
        comp: `College avg: ${collegeAvgSkillsPerStudent}/student`,
        color: [15, 23, 42] as [number, number, number],
      },
    ];

    let rowY = tableStartY + 7;
    const rowHeight = 6.8;
    pdf.setFont("helvetica", "normal");
    rows.forEach((row, i) => {
      if (i % 2 === 1) {
        pdf.setFillColor(248, 250, 252);
        pdf.rect(14, rowY, 182, rowHeight, "F");
      }
      pdf.setDrawColor(241, 245, 249);
      pdf.line(14, rowY + rowHeight, 196, rowY + rowHeight);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.8);
      pdf.setTextColor(71, 85, 105);
      pdf.text(row.label, 18, rowY + 4.6);

      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(15, 23, 42);
      pdf.text(row.val, 76, rowY + 4.6);

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(100, 116, 139);
      pdf.text(row.perf, 102, rowY + 4.6);

      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(row.color[0], row.color[1], row.color[2]);
      pdf.text(row.comp, 140, rowY + 4.6);

      rowY += rowHeight;
    });

    // 6. Fill The Remaining Space (Executive Insights, Action Plan, Official Sign-off)
    // Section A: Executive Observation Block
    const insightY = rowY + 4.5;
    const insightH = 28;
    pdf.setFillColor(250, 250, 249);
    pdf.setDrawColor(231, 229, 228);
    pdf.roundedRect(14, insightY, 182, insightH, 2, 2, "FD");

    pdf.setFillColor(120, 28, 28);
    pdf.rect(14, insightY, 3, insightH, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.5);
    pdf.setTextColor(120, 28, 28);
    pdf.text("EXECUTIVE OBSERVATIONS & ANALYTICS SUMMARY", 21, insightY + 6.5);

    let insightText = "";
    if (dept.studentCount === 0) {
      insightText = `This department currently records zero enrolled students in the placement platform database. Immediate coordination with the Academic Registrar is recommended to sync student rosters for the ${dept.stream} stream.`;
    } else {
      const completedPart = `This department has ${dept.studentCount} student${dept.studentCount > 1 ? "s" : ""} with a ${deptRate}% average portfolio completion rate (${completionDelta >= 0 ? `${completionDelta.toFixed(1)}% above` : `${Math.abs(completionDelta).toFixed(1)}% below`} the institutional benchmark of ${collegeAvgCompletion}%).`;
      let gapPart = "";
      if (dept.projectCount > 0 && dept.paperCount === 0) {
        gapPart = ` Skills logging (${dept.skillCount}) and projects (${dept.projectCount}) outpace research paper output (0), suggesting practical implementation strength with a prime opportunity to mentor students in documenting term work into conference publications.`;
      } else if (dept.paperCount > 0) {
        gapPart = ` Academic output is well-rounded across technical projects (${dept.projectCount}) and documented research publications (${dept.paperCount}), enhancing student competitive standing for higher education and R&D recruitments.`;
      } else {
        gapPart = ` Technical logging is currently nascent across projects (${dept.projectCount}) and skills (${dept.skillCount}); focused workshops on portfolio building are recommended.`;
      }
      const readyPart = deptRate >= 70
        ? " Portfolios demonstrate strong MCC placement readiness standards and are eligible for premier campus drives."
        : " Focused portfolio completion push is recommended prior to upcoming employer campus recruitments.";
      insightText = completedPart + gapPart + readyPart;
    }

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(51, 65, 85);
    const splitInsight = pdf.splitTextToSize(insightText, 172);
    pdf.text(splitInsight, 21, insightY + 12.5);

    // Section B: Strategic Recommendations
    const actionY = insightY + insightH + 3.5;
    const actionH = 32;
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(14, actionY, 182, actionH, 2, 2, "FD");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.5);
    pdf.setTextColor(71, 85, 105);
    pdf.text("STRATEGIC RECOMMENDATIONS FOR DEPARTMENT LEADERSHIP", 18, actionY + 6.5);

    const actions = [
      { title: "Completion Push:", desc: `Follow up with ${pendingCount > 0 ? pendingCount : "all"} student(s) to complete required portfolio sections (media handles, bio, projects, and certifications).` },
      { title: "Scholarly Mentorship:", desc: "Facilitate faculty guidance for final-year project groups to submit papers to Scopus/UGC CARE journals." },
      { title: "Corporate Alignment:", desc: `Audit logged skills against top hiring partner criteria for ${dept.stream} stream placement drives.` },
    ];

    let actionRowY = actionY + 12;
    actions.forEach((act) => {
      pdf.setFillColor(120, 28, 28);
      pdf.circle(19.5, actionRowY - 0.7, 1.2, "F");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7.2);
      pdf.setTextColor(15, 23, 42);
      pdf.text(act.title, 23, actionRowY);

      const titleW = pdf.getTextWidth(act.title);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(71, 85, 105);
      pdf.text(act.desc, 24 + titleW, actionRowY);

      actionRowY += 6.5;
    });

    // Section C: Institutional Sign-off Block
    const signY = actionY + actionH + 3.5;
    const signH = 30;
    pdf.setFillColor(250, 250, 250);
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(14, signY, 182, signH, 2, 2, "FD");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.2);
    pdf.setTextColor(100, 116, 139);
    pdf.text("OFFICIAL INSTITUTIONAL SIGN-OFF & VERIFICATION AUDIT", 18, signY + 6);

    const signCols = [
      { title: "Department Placement Coordinator", x1: 20, x2: 66 },
      { title: "Head of Department (HOD)", x1: 76, x2: 122 },
      { title: "Dean / Placement Officer", x1: 132, x2: 178 },
    ];

    signCols.forEach((col) => {
      pdf.setDrawColor(203, 213, 225);
      pdf.line(col.x1, signY + 20, col.x2, signY + 20);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(6.8);
      pdf.setTextColor(51, 65, 85);
      pdf.text(col.title, (col.x1 + col.x2) / 2, signY + 24, { align: "center" });

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6);
      pdf.setTextColor(148, 163, 184);
      pdf.text("Signature & Date", (col.x1 + col.x2) / 2, signY + 27.5, { align: "center" });
    });

    // 7. Page Footer
    pdf.setDrawColor(226, 232, 240);
    pdf.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(7.5);
    pdf.setTextColor(148, 163, 184);
    pdf.text("Madras Christian College (Autonomous) • Official Placement & Career Guidance Cell", 14, pageHeight - 8.5);
    pdf.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 14, pageHeight - 8.5, { align: "right" });
  };

  // ──────────────────────────────────────────────────────────
  // EXPORT: Single Department PDF
  // ──────────────────────────────────────────────────────────
  const handleDownloadDepartmentReport = async (dept: DepartmentMetric) => {
    try {
      setExportingDept(dept.department);
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      renderDepartmentReportPage(pdf, dept, deptAnalytics, 1, 1);

      const cleanDept = dept.department.replace(/[^a-zA-Z0-9_-]/g, "_");
      const filenameDate = new Date().toISOString().split("T")[0];
      pdf.save(`${cleanDept}_analytics_${filenameDate}.pdf`);
    } catch (err) {
      console.error("Dept PDF download failed:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setExportingDept(null);
    }
  };

  // ──────────────────────────────────────────────────────────
  // EXPORT: All Departments CSV
  // ──────────────────────────────────────────────────────────
  const handleExportAllCSV = () => {
    try {
      setExportingAll("csv");
      setExportDropdownOpen(false);
      const headers = ["Department", "Stream", "Students", "Completion Rate (%)", "Projects", "Papers", "Skills", "Health Status"];
      const csvRows = deptAnalytics.map((d) => {
        const rate = (d.completionRate !== undefined && d.completionRate !== null) ? d.completionRate : (d.approvalRate || 0);
        let status = d.studentCount === 0 ? "No Data" : rate >= 70 ? "Optimal" : rate >= 40 ? "Moderate" : "Attention Needed";
        const rateDisplay = d.studentCount === 0 ? "No Data" : `${rate}%`;
        return [`"${d.department}"`, d.stream, d.studentCount, rateDisplay, d.projectCount, d.paperCount, d.skillCount, `"${status}"`].join(",");
      });
      const csvContent = [headers.join(","), ...csvRows].join("\r\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const filenameDate = new Date().toISOString().split("T")[0];
      link.setAttribute("href", url);
      link.setAttribute("download", `MCC_All_Departments_Analytics_${filenameDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("CSV export error:", err);
      alert("Failed to export CSV.");
    } finally {
      setExportingAll(null);
    }
  };

  // ──────────────────────────────────────────────────────────
  // EXPORT: All Departments PDF (Multi-Page Executive Report)
  // ──────────────────────────────────────────────────────────
  const handleExportAllPDF = async () => {
    try {
      setExportingAll("pdf");
      setExportDropdownOpen(false);
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const filenameDate = new Date().toISOString().split("T")[0];
      const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

      const sortedDepts = [...deptAnalytics].sort((a, b) => {
        const rA = (a.completionRate !== undefined && a.completionRate !== null) ? a.completionRate : (a.approvalRate || 0);
        const rB = (b.completionRate !== undefined && b.completionRate !== null) ? b.completionRate : (b.approvalRate || 0);
        return rB - rA;
      });
      const totalPages = sortedDepts.length + 1; // Page 1: Executive Overview, Pages 2..N: Dept Reports

      // ─── PAGE 1: MASTER EXECUTIVE OVERVIEW ───
      pdf.setFillColor(120, 28, 28);
      pdf.rect(0, 0, pageWidth, 28, "F");
      pdf.setFillColor(194, 65, 12);
      pdf.rect(0, 28, pageWidth, 1.2, "F");

      let textStartX = 14;
      try {
        if (MCC_CREST_WHITE_DATA_URL) {
          pdf.addImage(MCC_CREST_WHITE_DATA_URL, "PNG", 14, 4, 15.5, 20);
          textStartX = 34;
        }
      } catch {
        textStartX = 14;
      }

      pdf.setTextColor(255, 255, 255);
      pdf.setFont("times", "bold");
      pdf.setFontSize(14.5);
      pdf.text("MADRAS CHRISTIAN COLLEGE (AUTONOMOUS)", textStartX, 12.5);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      pdf.setTextColor(254, 226, 226);
      pdf.text("All-Departments Analytics & Completion Master Report", textStartX, 19.5);
      pdf.text(`Date: ${dateStr}`, pageWidth - 14, 19.5, { align: "right" });

      // KPI box
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(14, 34, 182, 28, 3, 3, "F");
      pdf.setDrawColor(226, 232, 240);
      pdf.roundedRect(14, 34, 182, 28, 3, 3, "S");
      const kpiItems = [
        { label: "TOTAL STUDENTS", val: kpiData.totalStudents.toString() },
        { label: "AVG COMPLETION", val: `${kpiData.avgCompletionRate}%` },
        { label: "TOTAL PROJECTS", val: kpiData.totalProjects.toString() },
        { label: "ATTENTION NEEDED", val: `${kpiData.attentionNeededCount} Depts` },
      ];
      kpiItems.forEach((kpi, idx) => {
        const xPos = 18 + idx * 45;
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7.5);
        pdf.setTextColor(100, 116, 139);
        pdf.text(kpi.label, xPos, 43);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(13);
        if (idx === 3 && kpiData.attentionNeededCount > 0) pdf.setTextColor(225, 29, 72);
        else pdf.setTextColor(15, 23, 42);
        pdf.text(kpi.val, xPos, 53);
      });

      pdf.setFont("times", "bold");
      pdf.setFontSize(13);
      pdf.setTextColor(30, 41, 59);
      pdf.text("Department Comparative Rankings (All Streams)", 14, 70);

      let tableY = 75;
      pdf.setFillColor(241, 245, 249);
      pdf.rect(14, tableY, 182, 8, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(71, 85, 105);
      pdf.text("Department", 18, tableY + 5.5);
      pdf.text("Stream", 75, tableY + 5.5);
      pdf.text("Students", 98, tableY + 5.5);
      pdf.text("Completion", 118, tableY + 5.5);
      pdf.text("Projects", 145, tableY + 5.5);
      pdf.text("Papers", 163, tableY + 5.5);
      pdf.text("Skills", 180, tableY + 5.5);
      tableY += 8;

      pdf.setFont("helvetica", "normal");
      sortedDepts.forEach((d, index) => {
        if (tableY > pageHeight - 25) return; // Keep Page 1 as executive summary
        if (index % 2 === 1) {
          pdf.setFillColor(248, 250, 252);
          pdf.rect(14, tableY, 182, 7.5, "F");
        }
        pdf.setDrawColor(241, 245, 249);
        pdf.line(14, tableY + 7.5, 196, tableY + 7.5);
        pdf.setTextColor(15, 23, 42);
        pdf.text(d.department.length > 28 ? d.department.slice(0, 26) + "…" : d.department, 18, tableY + 5);
        pdf.setTextColor(d.stream === "Aided" ? 30 : 99, d.stream === "Aided" ? 90 : 71, d.stream === "Aided" ? 160 : 85);
        pdf.text(d.stream, 75, tableY + 5);
        pdf.setTextColor(15, 23, 42);
        pdf.text((d.studentCount || 0).toString(), 98, tableY + 5);
        const deptRate = (d.completionRate !== undefined && d.completionRate !== null) ? d.completionRate : (d.approvalRate || 0);
        if (d.studentCount === 0) {
          pdf.setTextColor(148, 163, 184);
          pdf.text("No Data", 118, tableY + 5);
        } else {
          if (deptRate >= 70) pdf.setTextColor(16, 185, 129);
          else if (deptRate >= 40) pdf.setTextColor(245, 158, 11);
          else pdf.setTextColor(239, 68, 68);
          pdf.text(`${deptRate}%`, 118, tableY + 5);
        }
        pdf.setTextColor(71, 85, 105);
        pdf.text((d.projectCount || 0).toString(), 145, tableY + 5);
        pdf.text((d.paperCount || 0).toString(), 163, tableY + 5);
        pdf.text((d.skillCount || 0).toString(), 180, tableY + 5);
        tableY += 7.5;
      });

      pdf.setDrawColor(226, 232, 240);
      pdf.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(7.5);
      pdf.setTextColor(148, 163, 184);
      pdf.text("Madras Christian College (Autonomous) • Official Placement & Career Guidance Cell", 14, pageHeight - 8.5);
      pdf.text(`Page 1 of ${totalPages}`, pageWidth - 14, pageHeight - 8.5, { align: "right" });

      // ─── PAGES 2..N: DEDICATED FULL REPORT PER DEPARTMENT ───
      sortedDepts.forEach((dept, idx) => {
        pdf.addPage();
        renderDepartmentReportPage(pdf, dept, deptAnalytics, idx + 2, totalPages);
      });

      pdf.save(`MCC_All_Departments_Analytics_${filenameDate}.pdf`);
    } catch (err) {
      console.error("Multi-Page PDF export failed:", err);
      alert("Failed to export all departments PDF.");
    } finally {
      setExportingAll(null);
    }
  };

  // ──────────────────────────────────────────────────────────
  // LOADING SKELETON
  // ──────────────────────────────────────────────────────────
  if (loading && (!deptAnalytics || deptAnalytics.length === 0)) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className={`h-14 rounded-2xl border ${isDark ? "bg-[#0b0b0f] border-white/5" : "bg-white border-slate-200"}`} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className={`h-28 rounded-3xl border p-5 ${isDark ? "bg-[#0b0b0f] border-white/5" : "bg-white border-slate-200"}`}>
              <div className="w-8 h-8 rounded-lg bg-gray-300 dark:bg-gray-800 mb-3" />
              <div className="w-16 h-6 rounded bg-gray-300 dark:bg-gray-800 mb-2" />
              <div className="w-28 h-3 rounded bg-gray-200 dark:bg-gray-800/60" />
            </div>
          ))}
        </div>
        <div className={`h-80 rounded-3xl border p-6 ${isDark ? "bg-[#0b0b0f] border-white/5" : "bg-white border-slate-200"}`}>
          <div className="w-48 h-6 rounded bg-gray-300 dark:bg-gray-800 mb-4" />
          <div className="w-full h-56 rounded-2xl bg-gray-100 dark:bg-white/[0.02]" />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className={`h-72 rounded-3xl border p-6 ${isDark ? "bg-[#0b0b0f] border-white/5" : "bg-white border-slate-200"}`}>
              <div className="flex justify-between mb-6">
                <div className="w-32 h-5 rounded bg-gray-300 dark:bg-gray-800" />
                <div className="w-20 h-5 rounded bg-gray-200 dark:bg-gray-800/60" />
              </div>
              <div className="flex justify-center my-4">
                <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-800/80" />
              </div>
              <div className="space-y-2 mt-4">
                <div className="w-full h-3 rounded bg-gray-200 dark:bg-gray-800/40" />
                <div className="w-4/5 h-3 rounded bg-gray-200 dark:bg-gray-800/40" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────
  // MAIN RENDER
  // ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ===================================================
          STREAM CLASSIFICATION EDITOR MODAL
          =================================================== */}
      {streamEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-lg rounded-3xl border shadow-2xl p-6 space-y-4 ${isDark ? "bg-[#0d0d14] border-white/10 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-serif font-black">Department Stream Classification</h3>
                <p className="text-xs text-gray-400 mt-0.5">Assign each department to Aided or SFS stream.</p>
              </div>
              <button onClick={() => setStreamEditorOpen(false)} className="p-2 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {Object.keys(editingStreams).sort().map((dept) => (
                <div key={dept} className={`flex items-center justify-between gap-3 px-3 py-2 rounded-xl border ${isDark ? "border-white/5 bg-white/[0.02]" : "border-slate-100 bg-slate-50"}`}>
                  <span className="text-xs font-semibold truncate flex-1" title={dept}>{dept}</span>
                  <div className="flex items-center rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 shrink-0">
                    {(["Aided", "SFS"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setEditingStreams((prev) => ({ ...prev, [dept]: s }))}
                        className={`px-3 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                          editingStreams[dept] === s
                            ? s === "Aided"
                              ? "bg-[#781c1c] text-white"
                              : "bg-[#1e3a5f] text-white"
                            : isDark
                            ? "bg-transparent text-gray-400 hover:bg-white/5"
                            : "bg-white text-slate-500 hover:bg-slate-100"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
              <button onClick={() => setStreamEditorOpen(false)} className={`px-4 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${isDark ? "border-white/10 text-gray-300 hover:bg-white/5" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
                Cancel
              </button>
              <button
                onClick={handleSaveStreams}
                disabled={savingStreams}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#781c1c] hover:bg-[#5f1515] text-white transition cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
              >
                {savingStreams ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                {savingStreams ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================
          TOP BAR: AIDED / SFS TOGGLE
          =================================================== */}
      <div className={`border rounded-2xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 ${isDark ? "bg-[#0b0b0f] border-white/5" : "bg-white border-slate-200 shadow-xs"}`}>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-slate-500"}`}>Stream View:</span>

          {/* Segmented Toggle */}
          <div className={`flex rounded-xl overflow-hidden border p-0.5 ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-100"}`}>
            {(["Aided", "SFS"] as const).map((stream) => {
              const count = stream === "Aided" ? aidedCount : sfsCount;
              const isActive = activeStream === stream;
              return (
                <button
                  key={stream}
                  onClick={() => handleStreamChange(stream)}
                  className={`px-3.5 py-1.5 rounded-[10px] text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? stream === "Aided"
                        ? "bg-[#781c1c] text-white shadow-sm"
                        : "bg-[#1e3a5f] text-white shadow-sm"
                      : isDark
                      ? "text-gray-400 hover:text-gray-200"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {stream}
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                    isActive
                      ? "bg-white/20 text-white"
                      : isDark
                      ? "bg-white/10 text-gray-400"
                      : "bg-slate-200 text-slate-500"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Stream description */}
          <span className={`text-[11px] hidden sm:block ${isDark ? "text-gray-500" : "text-slate-400"}`}>
            {activeStream === "Aided" ? "Aided (Government-funded) departments" : "Self-Financing Stream departments"}
          </span>
        </div>

        {/* Stream editor & export buttons */}
        <div className="flex items-center gap-2">
          {canWrite && (
            <button
              onClick={openStreamEditor}
              title="Edit Department Stream Classification"
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${isDark ? "bg-white/5 hover:bg-white/10 text-gray-300 border-white/10" : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"}`}
            >
              <Edit2 size={12} /> Edit Classification
            </button>
          )}

          {onRefresh && (
            <button
              onClick={handleRefreshClick}
              disabled={refreshing}
              title="Refresh Department Analytics"
              className={`p-2 rounded-xl border transition cursor-pointer ${isDark ? "bg-white/5 hover:bg-white/10 text-gray-300 border-white/10" : "bg-white hover:bg-stone-50 text-slate-700 border-slate-200"}`}
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin text-[#781c1c]" : ""} />
            </button>
          )}

          {/* Export dropdown */}
          <div id="export-all-dropdown-container" className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setExportDropdownOpen(!exportDropdownOpen); }}
              disabled={exportingAll !== null}
              className="px-3.5 py-1.5 rounded-xl bg-[#781c1c] hover:bg-[#5f1515] active:scale-[0.98] text-white text-xs font-bold transition cursor-pointer flex items-center gap-2 shadow-sm"
            >
              {exportingAll ? (
                <><RefreshCw size={13} className="animate-spin" /><span>Exporting…</span></>
              ) : (
                <><Download size={13} /><span>Export All</span><ChevronDown size={12} className={`transition-transform duration-200 ${exportDropdownOpen ? "rotate-180" : ""}`} /></>
              )}
            </button>
            {exportDropdownOpen && (
              <div className={`absolute right-0 mt-2 w-60 rounded-2xl border shadow-2xl z-50 py-2 ${isDark ? "bg-[#14141c] border-white/10 text-white" : "bg-white border-slate-200 text-slate-800"}`}>
                <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold border-b border-gray-100 dark:border-white/5">Download Reports</div>
                <button onClick={handleExportAllPDF} className={`w-full text-left px-3.5 py-2.5 text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${isDark ? "hover:bg-white/5 text-gray-200" : "hover:bg-stone-50 text-slate-700"}`}>
                  <FileText size={14} className="text-[#781c1c] shrink-0" />
                  <div><div className="font-bold">Multi-Page PDF Report</div><div className="text-[10px] text-gray-400">All departments, ranked table</div></div>
                </button>
                <button onClick={handleExportAllCSV} className={`w-full text-left px-3.5 py-2.5 text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${isDark ? "hover:bg-white/5 text-gray-200" : "hover:bg-stone-50 text-slate-700"}`}>
                  <Download size={14} className="text-emerald-600 shrink-0" />
                  <div><div className="font-bold">Raw Metrics (CSV)</div><div className="text-[10px] text-gray-400">Excel/Spreadsheet compatible</div></div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===================================================
          SECTION: INSTITUTIONAL BENCHMARKS (COLLAPSIBLE)
          =================================================== */}
      <div className={`border rounded-3xl shadow-xl transition-all duration-300 overflow-hidden ${isDark ? "bg-[#0b0b0f] border-white/5" : "bg-gradient-to-b from-white to-[#faf8f5] border-stone-200"}`}>
        {/* Panel Header */}
        <div className="p-5 pb-4 border-b border-gray-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base md:text-lg font-serif font-black tracking-tight text-slate-900 dark:text-white">
                {activeStream} Stream — Institutional Benchmarks
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#781c1c]/10 text-[#781c1c] dark:bg-white/10 dark:text-gray-300">
                {streamData.length} Depts
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Cross-department comparative intelligence, completion rates, and portfolio output.</p>
          </div>
          <button
            onClick={() => setIsOverviewExpanded(!isOverviewExpanded)}
            className={`p-2 rounded-xl border transition cursor-pointer flex items-center gap-1 text-xs font-semibold ${isDark ? "bg-white/5 hover:bg-white/10 text-gray-300 border-white/10" : "bg-white hover:bg-stone-50 text-slate-700 border-slate-200"}`}
          >
            {isOverviewExpanded ? <><ChevronUp size={14} /><span className="hidden sm:inline">Collapse</span></> : <><ChevronDown size={14} /><span className="hidden sm:inline">Expand</span></>}
          </button>
        </div>

        {isOverviewExpanded && (
          <div className="p-5 space-y-6">
            {/* KPI Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Enrolled", val: kpiData.totalStudents, sub: `in ${activeStream} departments`, icon: <Users size={15} />, color: "text-[#781c1c] bg-[#781c1c]/10 dark:bg-[#781c1c]/20 dark:text-[#f87171]" },
                {
                  label: "Avg Completion",
                  val: `${kpiData.avgCompletionRate}%`,
                  sub: kpiData.avgCompletionRate >= 70 ? "Healthy ✓" : kpiData.avgCompletionRate >= 40 ? "Moderate" : "Critical!",
                  icon: <CheckCircle2 size={15} />,
                  color: kpiData.avgCompletionRate >= 70 ? "text-emerald-600 bg-emerald-500/10" : kpiData.avgCompletionRate >= 40 ? "text-amber-500 bg-amber-500/10" : "text-rose-500 bg-rose-500/10",
                },
                { label: "Total Projects", val: kpiData.totalProjects, sub: "Registered portfolios", icon: <Code size={15} />, color: "text-[#781c1c] bg-[#781c1c]/10 dark:bg-[#781c1c]/20 dark:text-[#f87171]" },
                {
                  label: "Attention Needed",
                  val: kpiData.attentionNeededCount,
                  sub: kpiData.attentionNeededCount > 0 ? "Active depts <40%" : "All on track ✓",
                  icon: <AlertTriangle size={15} />,
                  color: kpiData.attentionNeededCount > 0 ? "text-rose-600 bg-rose-500/20 animate-pulse" : "text-emerald-500 bg-emerald-500/10",
                },
              ].map((kpi, idx) => (
                <div key={idx} className={`border rounded-2xl p-4 transition-all duration-200 ${kpiData.attentionNeededCount > 0 && idx === 3 ? isDark ? "bg-rose-950/20 border-rose-500/30" : "bg-rose-50/70 border-rose-200" : isDark ? "bg-white/[0.02] border-white/5" : "bg-white border-slate-200 hover:shadow-md"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-gray-400">{kpi.label}</span>
                    <div className={`p-1.5 rounded-lg ${kpi.color}`}>{kpi.icon}</div>
                  </div>
                  <div className={`text-2xl sm:text-3xl font-serif font-black ${kpiData.attentionNeededCount > 0 && idx === 3 ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"}`}>{kpi.val}</div>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 block">{kpi.sub}</span>
                </div>
              ))}
            </div>

            {/* Comparison Charts */}
            {isMounted && streamData.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart 1: Completion Rate Ranked — FIXED horizontal bar, scrollable if > 9 depts */}
                <div className={`border rounded-2xl p-5 ${isDark ? "bg-white/[0.02] border-white/5" : "bg-white border-slate-200 shadow-xs"}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-serif font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <TrendingUp size={15} className="text-[#781c1c] dark:text-[#f87171]" />
                        Portfolio Completion Rate (Ranked)
                      </h4>
                      <p className="text-[11px] text-gray-400 mt-0.5">{activeStream} departments — sorted by completion %</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 text-[10px] font-medium text-gray-500">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />&gt;70%</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />40–70%</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />&lt;40%</span>
                    </div>
                  </div>

                  {/* Scrollable wrapper when too many departments */}
                  <div
                    style={{ height: `${completionChartH}px` }}
                    className={completionScrollable ? "overflow-y-auto overscroll-contain pr-1" : ""}
                  >
                    <div style={{ height: completionScrollable ? `${completionScrollH}px` : "100%", width: "100%" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          layout="vertical"
                          data={completionComparisonData}
                          margin={{ top: 4, right: 32, left: 0, bottom: 4 }}
                          barCategoryGap="28%"
                        >
                          <CartesianGrid
                            horizontal={false}
                            strokeDasharray="3 3"
                            stroke={isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9"}
                          />
                          <XAxis
                            type="number"
                            domain={[0, 100]}
                            tick={{ fontSize: 10, fill: isDark ? "#94a3b8" : "#64748b" }}
                            unit="%"
                            axisLine={false}
                          />
                          <YAxis
                            type="category"
                            dataKey="department"
                            width={Y_AXIS_WIDTH}
                            tick={(props) => (
                              <TruncatedYAxisTick {...props} isDark={isDark} maxChars={14} />
                            )}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            cursor={{ fill: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(100, 116, 139, 0.08)", radius: 4 }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const item = payload[0].payload;
                                return (
                                  <div className={`p-3 rounded-xl border shadow-xl text-xs ${isDark ? "bg-[#14141c] border-white/10 text-white" : "bg-white border-slate-200 text-slate-800"}`}>
                                    <div className="font-bold font-serif mb-1">{item.department}</div>
                                    <div className="flex justify-between gap-4 text-[11px] text-gray-400">
                                      <span>Completion Rate:</span>
                                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                                        {item.studentCount === 0 ? "No Data" : `${item.completionRate}%`}
                                      </span>
                                    </div>
                                    <div className="flex justify-between gap-4 text-[11px] text-gray-400 mt-0.5">
                                      <span>Enrolled Students:</span>
                                      <span className="font-mono font-bold text-slate-900 dark:text-white">{item.studentCount}</span>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="completionRate" radius={[0, 5, 5, 0]} barSize={16}>
                            {completionComparisonData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fillColor} />
                            ))}
                            <LabelList
                              dataKey="completionRate"
                              position="right"
                              formatter={(v: any) => `${v}%`}
                              style={{ fontSize: "10px", fontWeight: 700, fontFamily: "monospace", fill: isDark ? "#e2e8f0" : "#1e293b" }}
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  {completionScrollable && (
                    <p className="text-[10px] text-gray-400 text-center mt-2">↕ Scroll inside chart to see all {completionComparisonData.length} departments</p>
                  )}
                </div>

                {/* Chart 2: Academic Production (Grouped bars with horizontal scroll) */}
                <div className={`border rounded-2xl p-5 ${isDark ? "bg-white/[0.02] border-white/5" : "bg-white border-slate-200 shadow-xs"}`}>
                  <div className="mb-3">
                    <h4 className="text-sm font-serif font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Layers size={15} className="text-amber-600 dark:text-amber-400" />
                      Academic & Technical Production
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">Projects, Research Papers, and Skills — {activeStream} stream</p>
                  </div>
                  <div className={`w-full ${prodScrollable ? "overflow-x-auto overscroll-contain pb-1" : ""}`}>
                    <div style={{ width: typeof prodChartWidth === "number" ? `${prodChartWidth}px` : prodChartWidth, height: `${prodChartHeight}px`, minWidth: "100%" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={productionComparisonData}
                          margin={{ top: 10, right: 16, left: -16, bottom: 10 }}
                          barCategoryGap="25%"
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9"} />
                          <XAxis
                            dataKey="department"
                            tick={(props) => (
                              <TruncatedXAxisTick {...props} isDark={isDark} maxChars={11} />
                            )}
                            interval={0}
                            height={32}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis tick={{ fontSize: 10, fill: isDark ? "#94a3b8" : "#64748b" }} allowDecimals={false} />
                          <Tooltip
                            cursor={{ fill: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(100, 116, 139, 0.08)", radius: 6 }}
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                const dept = productionComparisonData.find((d) => d.department === label);
                                return (
                                  <div className={`p-3 rounded-xl border shadow-xl text-xs ${isDark ? "bg-[#14141c] border-white/10 text-white" : "bg-white border-slate-200 text-slate-800"}`}>
                                    <div className="font-bold font-serif mb-1">{dept ? dept.department : label}</div>
                                    {payload.map((item, idx) => (
                                      <div key={idx} className="flex justify-between gap-4 text-[11px] mt-0.5">
                                        <span className="flex items-center gap-1.5" style={{ color: item.color }}>
                                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />{item.name}:
                                        </span>
                                        <span className="font-mono font-bold text-slate-900 dark:text-white">{item.value}</span>
                                      </div>
                                    ))}
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "4px" }} iconType="circle" />
                          <Bar dataKey="Projects" fill="#781c1c" radius={[4, 4, 0, 0]} barSize={8} />
                          <Bar dataKey="Papers" fill="#d97706" radius={[4, 4, 0, 0]} barSize={8} />
                          <Bar dataKey="Skills" fill="#0f766e" radius={[4, 4, 0, 0]} barSize={8} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  {prodScrollable && (
                    <p className="text-[10px] text-gray-400 text-center mt-2">↔ Scroll horizontally to see all {productionComparisonData.length} departments</p>
                  )}
                </div>
              </div>
            )}

            {streamData.length === 0 && (
              <div className="text-center py-10 text-gray-400 text-sm">
                No {activeStream} departments configured. Use the <strong>Edit Classification</strong> button above to assign departments.
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===================================================
          SECTION: DEPARTMENT PERFORMANCE CARDS
          =================================================== */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-serif font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{activeStream} Department Cards</span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400">
                {processedDepartments.length} shown
              </span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Hover for exact figures; download icon exports a single-page PDF report.</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-7 pr-3 py-1.5 rounded-xl text-xs border transition w-36 sm:w-48 focus:outline-none focus:ring-1 focus:ring-[#781c1c] ${isDark ? "bg-white/5 border-white/10 text-white placeholder:text-gray-500" : "bg-white border-slate-200 text-slate-800 placeholder:text-gray-400"}`}
              />
            </div>
            <div className="flex items-center rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden text-xs">
              <select
                aria-label="Sort departments"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className={`py-1.5 px-2 text-xs bg-transparent focus:outline-none cursor-pointer ${isDark ? "text-gray-200 bg-[#0b0b0f]" : "text-slate-700 bg-white"}`}
              >
                <option value="completion">Completion Rate</option>
                <option value="students">Students</option>
                <option value="projects">Projects</option>
                <option value="name">Name</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                title="Toggle sort direction"
                className={`p-1.5 border-l border-slate-200 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer ${isDark ? "text-gray-300" : "text-slate-600"}`}
              >
                <ArrowUpDown size={12} />
              </button>
            </div>
          </div>
        </div>

        {processedDepartments.length === 0 && (
          <div className={`border rounded-3xl p-12 text-center ${isDark ? "bg-[#0b0b0f] border-white/5" : "bg-white border-slate-200"}`}>
            <Building2 size={32} className="mx-auto text-gray-400 mb-3 opacity-60" />
            <h4 className="text-sm font-serif font-bold text-slate-900 dark:text-white">No matching departments found</h4>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              {searchQuery ? `No ${activeStream} departments matched "${searchQuery}".` : `No ${activeStream} departments are configured.`}
            </p>
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="mt-3 px-4 py-1.5 rounded-xl text-xs font-bold bg-[#781c1c] text-white hover:bg-[#5f1515] transition cursor-pointer">Clear Search</button>
            )}
          </div>
        )}

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {processedDepartments.map((dept) => {
            const deptRate = (dept.completionRate !== undefined && dept.completionRate !== null) ? dept.completionRate : (dept.approvalRate || 0);
            const gaugeColor = getGaugeColor(deptRate, dept.studentCount);
            const tier = getCompletionTier(deptRate, dept.studentCount);
            const isZeroData = dept.studentCount === 0;
            const isLowSample = dept.studentCount > 0 && dept.studentCount < 3;
            const donutData = isZeroData
              ? [{ name: "No Data", value: 100 }, { name: "Remaining", value: 0 }]
              : [{ name: "Complete", value: deptRate }, { name: "Remaining", value: Math.max(0, 100 - deptRate) }];
            const barData = [
              { name: "Projects", count: dept.projectCount || 0, fill: "#781c1c" },
              { name: "Papers", count: dept.paperCount || 0, fill: "#d97706" },
              { name: "Skills", count: dept.skillCount || 0, fill: "#0f766e" },
            ];
            const isDownloadingThis = exportingDept === dept.department;
            const isStudentsExpanded = Boolean(expandedStudents[dept.department]);

            return (
              <div
                key={dept.department}
                ref={(el) => { cardRefs.current[dept.department] = el; }}
                id={`dept-card-${dept.department.replace(/[^a-zA-Z0-9_-]/g, "_")}`}
                className={`border rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:border-[#781c1c]/30 flex flex-col justify-between relative group ${isDark ? "bg-[#0b0b0f] border-white/5 hover:bg-[#0e0e14]" : "bg-white border-slate-200 hover:border-[#781c1c]/30 shadow-xs"}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="min-w-0 flex-1">
                      <h4 className={`text-base font-serif font-black truncate leading-tight transition-colors ${isDark ? "text-white" : "text-slate-900 group-hover:text-[#781c1c]"}`} title={dept.department}>
                        {dept.department}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${tier.badge}`}>{tier.label}</span>
                        {isLowSample && (
                          <span
                            className="text-[9px] font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded"
                            title="Small sample size; department average reflects under 3 students"
                          >
                            (low sample size)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleDownloadDepartmentReport(dept)}
                        disabled={isDownloadingThis}
                        title="Download Department Report (PDF)"
                        className={`p-1.5 rounded-lg border transition cursor-pointer ${isDark ? "bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border-white/10" : "bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-[#781c1c] border-slate-200"}`}
                      >
                        {isDownloadingThis ? <RefreshCw size={13} className="animate-spin text-[#781c1c]" /> : <Download size={13} />}
                      </button>
                      <span className="text-[10px] font-mono font-bold text-[#781c1c] bg-[#781c1c]/10 dark:text-[#f87171] dark:bg-[#781c1c]/20 px-2 py-1 rounded-lg border border-[#781c1c]/15">
                        {dept.studentCount} Students
                      </span>
                    </div>
                  </div>

                  <div className={`border-t pt-4 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center ${isDark ? "border-white/5" : "border-slate-100"}`}>
                    {/* Donut Gauge */}
                    <div className="sm:col-span-5 flex flex-col items-center justify-center text-center">
                      <div className="relative w-24 h-24 flex items-center justify-center">
                        {isMounted ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={donutData} cx="50%" cy="50%" innerRadius={32} outerRadius={44} startAngle={90} endAngle={-270} paddingAngle={!isZeroData && deptRate > 0 && deptRate < 100 ? 3 : 0} dataKey="value" stroke="none">
                                <Cell fill={gaugeColor} />
                                <Cell fill={isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9"} />
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="w-20 h-20 rounded-full border-4 border-gray-200 dark:border-gray-800 animate-pulse" />
                        )}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className={`text-sm font-mono font-black leading-none ${isDark ? "text-white" : "text-slate-900"}`}>{isZeroData ? "No Data" : `${deptRate}%`}</span>
                          <span className="text-[8px] font-bold uppercase tracking-wider text-gray-400 mt-0.5">{isZeroData ? "No Data" : "Complete"}</span>
                        </div>
                      </div>
                      <span className="text-[9px] font-semibold text-gray-400 mt-1">Portfolio Completion</span>
                    </div>

                    {/* Mini Horizontal Bar Chart */}
                    <div className="sm:col-span-7 pl-1">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold mb-1 flex items-center justify-between">
                        <span>Production Metrics</span>
                        <span className="text-[9px] font-normal">Count</span>
                      </div>
                      <div className="w-full h-[98px]">
                        {isMounted ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={barData} margin={{ top: 2, right: 28, left: -10, bottom: 2 }}>
                              <XAxis type="number" hide domain={[0, maxMetricCount > 0 ? maxMetricCount : 5]} />
                              <YAxis type="category" dataKey="name" width={54} tick={{ fontSize: 9, fill: isDark ? "#94a3b8" : "#64748b", fontWeight: 600 }} axisLine={false} tickLine={false} />
                              <Tooltip
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    const entry = payload[0].payload;
                                    return (
                                      <div className={`px-2.5 py-1.5 rounded-lg border text-[10px] shadow-lg ${isDark ? "bg-[#14141c] border-white/10 text-white" : "bg-white border-slate-200 text-slate-800"}`}>
                                        <span className="font-semibold" style={{ color: entry.fill }}>{entry.name}:</span>{" "}
                                        <span className="font-mono font-bold">{entry.count}</span>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={11}>
                                {barData.map((entry, index) => <Cell key={`bar-${index}`} fill={entry.fill} />)}
                                <LabelList dataKey="count" position="right" style={{ fontSize: "9px", fontWeight: "bold", fontFamily: "monospace", fill: isDark ? "#cbd5e1" : "#475569" }} />
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="space-y-2 py-2">
                            <div className="w-full h-3 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
                            <div className="w-3/4 h-3 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
                            <div className="w-1/2 h-3 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Student Completion Breakdown Drilldown */}
                  {dept.studentCount > 0 && (
                    <div className={`mt-3 pt-3 border-t ${isDark ? "border-white/5" : "border-slate-100"}`}>
                      <button
                        onClick={() => toggleStudents(dept.department)}
                        className={`w-full flex items-center justify-between text-xs font-semibold transition cursor-pointer py-1 ${
                          isDark ? "text-gray-300 hover:text-white" : "text-slate-700 hover:text-[#781c1c]"
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <Users size={12} className="text-[#781c1c] dark:text-[#f87171]" />
                          <span>Student Breakdown</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400">
                            {dept.students?.length || dept.studentCount}
                          </span>
                        </span>
                        {isStudentsExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>

                      {isStudentsExpanded && (
                        <div className="mt-2 max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs">
                          {dept.students && dept.students.length > 0 ? (
                            dept.students.map((student) => {
                              const pct = student.completionPercentage;
                              const barColor = pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-rose-500";
                              const textColor = pct >= 70 ? "text-emerald-600 dark:text-emerald-400" : pct >= 40 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400";
                              return (
                                <div
                                  key={student.id}
                                  className={`p-2 rounded-xl border flex items-center justify-between gap-3 ${
                                    isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50/70 border-slate-100"
                                  }`}
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="font-semibold text-slate-800 dark:text-gray-200 truncate leading-tight">
                                      {student.fullName}
                                    </div>
                                    {student.registerNumber && (
                                      <div className="text-[10px] font-mono text-gray-400">
                                        {student.registerNumber}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                                      <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className={`text-[11px] font-mono font-bold w-9 text-right ${textColor}`}>
                                      {pct}%
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-[11px] text-gray-400 text-center py-2">
                              No student breakdown available.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className={`mt-4 pt-3 border-t flex items-center justify-between text-[9px] text-gray-400 font-medium ${isDark ? "border-white/5" : "border-slate-100"}`}>
                  <span className="flex items-center gap-1"><Clock size={10} /><span>Last updated: today</span></span>
                  <span className="font-mono text-gray-400">{dept.stream} Stream</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

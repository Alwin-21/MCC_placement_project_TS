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

export interface DepartmentMetric {
  department: string;
  stream: "Aided" | "SFS"; // Served from API
  studentCount: number;
  projectCount: number;
  paperCount: number;
  skillCount: number;
  approvalRate: number; // 0 to 100
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
// Custom Y-Axis tick: truncates long labels, full name on title
// ────────────────────────────────────────────────────────────
function TruncatedYAxisTick({
  x, y, payload, isDark, maxChars = 22,
}: {
  x?: number; y?: number; payload?: { value: string };
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
        y={0}
        dy={4}
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
  const [sortBy, setSortBy] = useState<"students" | "verification" | "projects" | "name">("verification");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [exportingDept, setExportingDept] = useState<string | null>(null);
  const [exportingAll, setExportingAll] = useState<"pdf" | "csv" | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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
      return { totalStudents: 0, avgVerificationRate: 0, totalProjects: 0, zeroVerificationCount: 0 };
    }
    const totalStudents  = data.reduce((acc, d) => acc + (d.studentCount || 0), 0);
    const totalProjects  = data.reduce((acc, d) => acc + (d.projectCount || 0), 0);

    let avgVerificationRate = 0;
    if (totalStudents > 0) {
      const weightedSum = data.filter((d) => d.studentCount > 0)
        .reduce((acc, d) => acc + d.approvalRate * d.studentCount, 0);
      avgVerificationRate = Math.round((weightedSum / totalStudents) * 10) / 10;
    } else if (data.length > 0) {
      const simpleSum = data.reduce((acc, d) => acc + d.approvalRate, 0);
      avgVerificationRate = Math.round((simpleSum / data.length) * 10) / 10;
    }

    const zeroVerificationCount = data.filter(
      (d) => d.studentCount > 0 && (d.approvalRate === 0 || !d.approvalRate)
    ).length;

    return { totalStudents, avgVerificationRate, totalProjects, zeroVerificationCount };
  }, [streamData]);

  // ──────────────────────────────────────────────────────────
  // CHART DATA (always based on filtered stream)
  // ──────────────────────────────────────────────────────────
  const verificationComparisonData = useMemo(() => {
    return [...streamData]
      .sort((a, b) => (b.approvalRate || 0) - (a.approvalRate || 0))
      .map((d) => {
        let color = "#ef4444";
        if (d.approvalRate >= 70) color = "#10b981";
        else if (d.approvalRate >= 40) color = "#f59e0b";
        if (d.studentCount === 0) color = isDark ? "#475569" : "#cbd5e1";
        return {
          department: d.department,
          approvalRate: d.approvalRate || 0,
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
      switch (sortBy) {
        case "students":
          return sortOrder === "asc" ? (a.studentCount || 0) - (b.studentCount || 0) : (b.studentCount || 0) - (a.studentCount || 0);
        case "verification":
          return sortOrder === "asc" ? (a.approvalRate || 0) - (b.approvalRate || 0) : (b.approvalRate || 0) - (a.approvalRate || 0);
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

  const getVerificationTier = (rate: number, count: number) => {
    if (count === 0) return { label: "No Students Yet", badge: isDark ? "text-slate-400 bg-white/5" : "text-slate-500 bg-slate-100" };
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
  // DYNAMIC CHART HEIGHT — proper per-row height, scrollable if big
  // ──────────────────────────────────────────────────────────
  // Each row gets 36px min, with a 10-item cap before scroll kicks in
  const CHART_ROW_PX = 36;
  const CHART_MAX_VISIBLE = 12; // show up to 12 rows before scrolling
  const verificationChartH = Math.max(240, Math.min(verificationComparisonData.length * CHART_ROW_PX, CHART_MAX_VISIBLE * CHART_ROW_PX));
  const verificationScrollable = verificationComparisonData.length > CHART_MAX_VISIBLE;
  const verificationScrollH = verificationComparisonData.length * CHART_ROW_PX;

  // Y-Axis left margin for long department names
  const Y_AXIS_WIDTH = 145;

  // ──────────────────────────────────────────────────────────
  // EXPORT: Single Department PDF
  // ──────────────────────────────────────────────────────────
  const handleDownloadDepartmentReport = async (dept: DepartmentMetric) => {
    const cardEl = cardRefs.current[dept.department];
    if (!cardEl) return;
    try {
      setExportingDept(dept.department);
      const html2canvas = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");
      const canvas = await html2canvas(cardEl, {
        scale: 2, useCORS: true,
        backgroundColor: isDark ? "#0b0b0f" : "#ffffff", logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

      pdf.setFillColor(120, 28, 28);
      pdf.rect(0, 0, pageWidth, 28, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.text("MADRAS CHRISTIAN COLLEGE (AUTONOMOUS)", 14, 12);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.text(`Department Analytics Report • ${dept.stream} Stream`, 14, 18);
      pdf.text(`Generated: ${dateStr}`, pageWidth - 14, 18, { align: "right" });

      pdf.setTextColor(30, 41, 59);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.text(dept.department, 14, 40);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Stream: ${dept.stream} | Students: ${dept.studentCount} | Verification: ${dept.approvalRate}%`, 14, 47);

      const imgWidth = 182;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 14, 53, imgWidth, Math.min(imgHeight, 110));

      const tableStartY = 53 + Math.min(imgHeight, 110) + 12;
      pdf.setFillColor(248, 250, 252);
      pdf.rect(14, tableStartY, 182, 9, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(51, 65, 85);
      pdf.text("Metric", 18, tableStartY + 6);
      pdf.text("Count", 120, tableStartY + 6);
      pdf.text("Performance", 155, tableStartY + 6);

      const rows = [
        { label: "Total Students", value: dept.studentCount.toString(), status: dept.studentCount > 0 ? "Active" : "No Records" },
        { label: "Verification Rate", value: `${dept.approvalRate}%`, status: dept.approvalRate >= 70 ? "High (>70%)" : dept.approvalRate >= 40 ? "Moderate (40-70%)" : "Attention (<40%)" },
        { label: "Projects", value: dept.projectCount.toString(), status: `${dept.studentCount > 0 ? (dept.projectCount / dept.studentCount).toFixed(2) : "0"}/student` },
        { label: "Research Papers", value: dept.paperCount.toString(), status: `${dept.studentCount > 0 ? (dept.paperCount / dept.studentCount).toFixed(2) : "0"}/student` },
        { label: "Skills Logged", value: dept.skillCount.toString(), status: `${dept.studentCount > 0 ? (dept.skillCount / dept.studentCount).toFixed(2) : "0"}/student` },
      ];

      let rowY = tableStartY + 9;
      pdf.setFont("helvetica", "normal");
      rows.forEach((row, i) => {
        if (i % 2 === 1) { pdf.setFillColor(248, 250, 252); pdf.rect(14, rowY, 182, 9, "F"); }
        pdf.setDrawColor(241, 245, 249);
        pdf.line(14, rowY + 9, 196, rowY + 9);
        pdf.setTextColor(71, 85, 105); pdf.text(row.label, 18, rowY + 6);
        pdf.setFont("helvetica", "bold"); pdf.setTextColor(15, 23, 42); pdf.text(row.value, 120, rowY + 6);
        pdf.setFont("helvetica", "normal"); pdf.setTextColor(100, 116, 139); pdf.text(row.status, 155, rowY + 6);
        rowY += 9;
      });

      pdf.setDrawColor(226, 232, 240);
      pdf.line(14, pageHeight - 16, pageWidth - 14, pageHeight - 16);
      pdf.setFont("helvetica", "italic"); pdf.setFontSize(8); pdf.setTextColor(148, 163, 184);
      pdf.text("Madras Christian College Placement & Career Cell • Official Admin Analytics", 14, pageHeight - 10);
      pdf.text("Page 1 of 1", pageWidth - 14, pageHeight - 10, { align: "right" });

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
      const headers = ["Department", "Stream", "Students", "Verification Rate (%)", "Projects", "Papers", "Skills", "Health Status"];
      const csvRows = deptAnalytics.map((d) => {
        let status = d.studentCount === 0 ? "No Data" : d.approvalRate >= 70 ? "Optimal" : d.approvalRate >= 40 ? "Moderate" : "Attention Needed";
        return [`"${d.department}"`, d.stream, d.studentCount, `${d.approvalRate}%`, d.projectCount, d.paperCount, d.skillCount, `"${status}"`].join(",");
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
  // EXPORT: All Departments PDF (multi-page)
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

      pdf.setFillColor(120, 28, 28);
      pdf.rect(0, 0, pageWidth, 28, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold"); pdf.setFontSize(16);
      pdf.text("MADRAS CHRISTIAN COLLEGE (AUTONOMOUS)", 14, 12);
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(9);
      pdf.text("All-Departments Analytics & Verification Master Report", 14, 18);
      pdf.text(`Date: ${dateStr}`, pageWidth - 14, 18, { align: "right" });

      // KPI box
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(14, 34, 182, 28, 3, 3, "F");
      pdf.setDrawColor(226, 232, 240);
      pdf.roundedRect(14, 34, 182, 28, 3, 3, "S");
      const kpiItems = [
        { label: "TOTAL STUDENTS", val: kpiData.totalStudents.toString() },
        { label: "AVG VERIFICATION", val: `${kpiData.avgVerificationRate}%` },
        { label: "TOTAL PROJECTS", val: kpiData.totalProjects.toString() },
        { label: "0% VERIFICATION", val: `${kpiData.zeroVerificationCount} Depts` },
      ];
      kpiItems.forEach((kpi, idx) => {
        const xPos = 18 + idx * 45;
        pdf.setFont("helvetica", "normal"); pdf.setFontSize(7.5); pdf.setTextColor(100, 116, 139); pdf.text(kpi.label, xPos, 43);
        pdf.setFont("helvetica", "bold"); pdf.setFontSize(13);
        if (idx === 3 && kpiData.zeroVerificationCount > 0) pdf.setTextColor(225, 29, 72);
        else pdf.setTextColor(15, 23, 42);
        pdf.text(kpi.val, xPos, 53);
      });

      pdf.setFont("helvetica", "bold"); pdf.setFontSize(12); pdf.setTextColor(30, 41, 59);
      pdf.text("Department Comparative Rankings (All Streams)", 14, 70);

      let tableY = 75;
      pdf.setFillColor(241, 245, 249); pdf.rect(14, tableY, 182, 8, "F");
      pdf.setFont("helvetica", "bold"); pdf.setFontSize(8); pdf.setTextColor(71, 85, 105);
      pdf.text("Department", 18, tableY + 5.5);
      pdf.text("Stream", 75, tableY + 5.5);
      pdf.text("Students", 98, tableY + 5.5);
      pdf.text("Verification", 118, tableY + 5.5);
      pdf.text("Projects", 145, tableY + 5.5);
      pdf.text("Papers", 163, tableY + 5.5);
      pdf.text("Skills", 180, tableY + 5.5);
      tableY += 8;
      pdf.setFont("helvetica", "normal");

      const sortedDepts = [...deptAnalytics].sort((a, b) => (b.approvalRate || 0) - (a.approvalRate || 0));
      sortedDepts.forEach((d, index) => {
        if (tableY > pageHeight - 25) {
          pdf.addPage(); tableY = 20;
          pdf.setFillColor(241, 245, 249); pdf.rect(14, tableY, 182, 8, "F");
          pdf.setFont("helvetica", "bold"); pdf.setFontSize(8); pdf.setTextColor(71, 85, 105);
          pdf.text("Department", 18, tableY + 5.5); pdf.text("Stream", 75, tableY + 5.5);
          pdf.text("Students", 98, tableY + 5.5); pdf.text("Verification", 118, tableY + 5.5);
          pdf.text("Projects", 145, tableY + 5.5); pdf.text("Papers", 163, tableY + 5.5); pdf.text("Skills", 180, tableY + 5.5);
          tableY += 8; pdf.setFont("helvetica", "normal");
        }
        if (index % 2 === 1) { pdf.setFillColor(248, 250, 252); pdf.rect(14, tableY, 182, 7.5, "F"); }
        pdf.setDrawColor(241, 245, 249); pdf.line(14, tableY + 7.5, 196, tableY + 7.5);
        pdf.setTextColor(15, 23, 42);
        pdf.text(d.department.length > 28 ? d.department.slice(0, 26) + "…" : d.department, 18, tableY + 5);
        pdf.setTextColor(d.stream === "Aided" ? 30 : 99, d.stream === "Aided" ? 90 : 71, d.stream === "Aided" ? 160 : 85);
        pdf.text(d.stream, 75, tableY + 5);
        pdf.setTextColor(15, 23, 42);
        pdf.text((d.studentCount || 0).toString(), 98, tableY + 5);
        if (d.approvalRate >= 70) pdf.setTextColor(16, 185, 129);
        else if (d.approvalRate >= 40) pdf.setTextColor(245, 158, 11);
        else pdf.setTextColor(239, 68, 68);
        pdf.text(`${d.approvalRate || 0}%`, 118, tableY + 5);
        pdf.setTextColor(71, 85, 105);
        pdf.text((d.projectCount || 0).toString(), 145, tableY + 5);
        pdf.text((d.paperCount || 0).toString(), 163, tableY + 5);
        pdf.text((d.skillCount || 0).toString(), 180, tableY + 5);
        tableY += 7.5;
      });

      const totalPages = pdf.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setDrawColor(226, 232, 240);
        pdf.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);
        pdf.setFont("helvetica", "italic"); pdf.setFontSize(8); pdf.setTextColor(148, 163, 184);
        pdf.text("Madras Christian College Placement & Career Cell • Official Admin Analytics", 14, pageHeight - 9);
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 9, { align: "right" });
      }
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
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#781c1c]/10 text-[#781c1c] dark:bg-[#781c1c]/20 dark:text-[#f87171] flex items-center justify-center shrink-0">
              <Building2 size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base md:text-lg font-serif font-black tracking-tight text-slate-900 dark:text-white">
                  {activeStream} Stream — Institutional Benchmarks
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#781c1c]/10 text-[#781c1c] dark:bg-white/10 dark:text-gray-300">
                  {streamData.length} Depts
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">Cross-department comparative intelligence, verification rates, and portfolio output.</p>
            </div>
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
                  label: "Avg Verification",
                  val: `${kpiData.avgVerificationRate}%`,
                  sub: kpiData.avgVerificationRate >= 70 ? "Healthy ✓" : kpiData.avgVerificationRate >= 40 ? "Moderate" : "Critical!",
                  icon: <CheckCircle2 size={15} />,
                  color: kpiData.avgVerificationRate >= 70 ? "text-emerald-600 bg-emerald-500/10" : kpiData.avgVerificationRate >= 40 ? "text-amber-500 bg-amber-500/10" : "text-rose-500 bg-rose-500/10",
                },
                { label: "Total Projects", val: kpiData.totalProjects, sub: "Registered portfolios", icon: <Code size={15} />, color: "text-[#781c1c] bg-[#781c1c]/10 dark:bg-[#781c1c]/20 dark:text-[#f87171]" },
                {
                  label: "Attention Needed",
                  val: kpiData.zeroVerificationCount,
                  sub: kpiData.zeroVerificationCount > 0 ? "Active depts at 0%" : "All verified ✓",
                  icon: <AlertTriangle size={15} />,
                  color: kpiData.zeroVerificationCount > 0 ? "text-rose-600 bg-rose-500/20 animate-pulse" : "text-emerald-500 bg-emerald-500/10",
                },
              ].map((kpi, idx) => (
                <div key={idx} className={`border rounded-2xl p-4 transition-all duration-200 ${kpiData.zeroVerificationCount > 0 && idx === 3 ? isDark ? "bg-rose-950/20 border-rose-500/30" : "bg-rose-50/70 border-rose-200" : isDark ? "bg-white/[0.02] border-white/5" : "bg-white border-slate-200 hover:shadow-md"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-gray-400">{kpi.label}</span>
                    <div className={`p-1.5 rounded-lg ${kpi.color}`}>{kpi.icon}</div>
                  </div>
                  <div className={`text-2xl sm:text-3xl font-serif font-black ${kpiData.zeroVerificationCount > 0 && idx === 3 ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"}`}>{kpi.val}</div>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 block">{kpi.sub}</span>
                </div>
              ))}
            </div>

            {/* Comparison Charts */}
            {isMounted && streamData.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart 1: Verification Rate Ranked — FIXED horizontal bar, scrollable if > 12 depts */}
                <div className={`border rounded-2xl p-5 ${isDark ? "bg-white/[0.02] border-white/5" : "bg-white border-slate-200 shadow-xs"}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-serif font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <TrendingUp size={15} className="text-[#781c1c] dark:text-[#f87171]" />
                        Portfolio Verification Rate (Ranked)
                      </h4>
                      <p className="text-[11px] text-gray-400 mt-0.5">{activeStream} departments — sorted by verification %</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 text-[10px] font-medium text-gray-500">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />&gt;70%</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />40–70%</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />&lt;40%</span>
                    </div>
                  </div>

                  {/* Scrollable wrapper when too many departments */}
                  <div
                    style={{ height: `${verificationChartH}px` }}
                    className={verificationScrollable ? "overflow-y-auto overscroll-contain" : ""}
                  >
                    <div style={{ height: verificationScrollable ? `${verificationScrollH}px` : "100%", width: "100%" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          layout="vertical"
                          data={verificationComparisonData}
                          margin={{ top: 4, right: 48, left: 0, bottom: 4 }}
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
                              <TruncatedYAxisTick {...props} isDark={isDark} maxChars={20} />
                            )}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const item = payload[0].payload;
                                return (
                                  <div className={`p-3 rounded-xl border shadow-xl text-xs ${isDark ? "bg-[#14141c] border-white/10 text-white" : "bg-white border-slate-200 text-slate-800"}`}>
                                    <div className="font-bold font-serif mb-1">{item.department}</div>
                                    <div className="flex justify-between gap-4 text-[11px] text-gray-400">
                                      <span>Verification Rate:</span>
                                      <span className="font-mono font-bold text-slate-900 dark:text-white">{item.approvalRate}%</span>
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
                          <Bar dataKey="approvalRate" radius={[0, 5, 5, 0]} barSize={16}>
                            {verificationComparisonData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fillColor} />
                            ))}
                            <LabelList
                              dataKey="approvalRate"
                              position="right"
                              formatter={(v: any) => `${v}%`}
                              style={{ fontSize: "10px", fontWeight: 700, fontFamily: "monospace", fill: isDark ? "#e2e8f0" : "#1e293b" }}
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  {verificationScrollable && (
                    <p className="text-[10px] text-gray-400 text-center mt-1.5">↕ Scroll inside chart to see all {verificationComparisonData.length} departments</p>
                  )}
                </div>

                {/* Chart 2: Academic Production (Grouped bars) */}
                <div className={`border rounded-2xl p-5 ${isDark ? "bg-white/[0.02] border-white/5" : "bg-white border-slate-200 shadow-xs"}`}>
                  <div className="mb-3">
                    <h4 className="text-sm font-serif font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Layers size={15} className="text-amber-600 dark:text-amber-400" />
                      Academic & Technical Production
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">Projects, Research Papers, and Skills — {activeStream} stream</p>
                  </div>
                  <div style={{ height: Math.max(240, Math.min(380, productionComparisonData.length * 30)) }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={productionComparisonData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 40 }}
                        barCategoryGap="35%"
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9"} />
                        <XAxis
                          dataKey="shortDept"
                          tick={{ fontSize: 9, fill: isDark ? "#94a3b8" : "#64748b" }}
                          interval={0}
                          angle={-30}
                          textAnchor="end"
                          height={50}
                        />
                        <YAxis tick={{ fontSize: 10, fill: isDark ? "#94a3b8" : "#64748b" }} allowDecimals={false} />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const dept = productionComparisonData.find((d) => d.shortDept === label);
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
                        <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }} iconType="circle" />
                        <Bar dataKey="Projects" fill="#781c1c" radius={[4, 4, 0, 0]} barSize={7} />
                        <Bar dataKey="Papers" fill="#d97706" radius={[4, 4, 0, 0]} barSize={7} />
                        <Bar dataKey="Skills" fill="#0f766e" radius={[4, 4, 0, 0]} barSize={7} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
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
                <option value="verification">Verification</option>
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
            const gaugeColor = getGaugeColor(dept.approvalRate, dept.studentCount);
            const tier = getVerificationTier(dept.approvalRate, dept.studentCount);
            const isZeroData = dept.studentCount === 0;
            const donutData = isZeroData
              ? [{ name: "No Data", value: 100 }, { name: "Remaining", value: 0 }]
              : [{ name: "Approved", value: dept.approvalRate }, { name: "Remaining", value: Math.max(0, 100 - dept.approvalRate) }];
            const barData = [
              { name: "Projects", count: dept.projectCount || 0, fill: "#781c1c" },
              { name: "Papers", count: dept.paperCount || 0, fill: "#d97706" },
              { name: "Skills", count: dept.skillCount || 0, fill: "#0f766e" },
            ];
            const isDownloadingThis = exportingDept === dept.department;

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
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${tier.badge}`}>{tier.label}</span>
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
                              <Pie data={donutData} cx="50%" cy="50%" innerRadius={32} outerRadius={44} startAngle={90} endAngle={-270} paddingAngle={!isZeroData && dept.approvalRate > 0 && dept.approvalRate < 100 ? 3 : 0} dataKey="value" stroke="none">
                                <Cell fill={gaugeColor} />
                                <Cell fill={isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9"} />
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="w-20 h-20 rounded-full border-4 border-gray-200 dark:border-gray-800 animate-pulse" />
                        )}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className={`text-sm font-mono font-black leading-none ${isDark ? "text-white" : "text-slate-900"}`}>{isZeroData ? "0%" : `${dept.approvalRate}%`}</span>
                          <span className="text-[8px] font-bold uppercase tracking-wider text-gray-400 mt-0.5">{isZeroData ? "No Data" : "Verified"}</span>
                        </div>
                      </div>
                      <span className="text-[9px] font-semibold text-gray-400 mt-1">Portfolio Verification</span>
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

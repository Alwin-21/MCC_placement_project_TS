"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Code,
  Award,
  Trophy,
  BookOpen,
  Sparkles,
  Search,
  CheckCircle,
  AlertCircle,
  FileText,
  Shield,
  Layers,
  Activity,
  ArrowLeft,
  XCircle,
  Settings,
  Building,
  BarChart2,
  Download,
  Bell,
  Plus,
  Trash2,
  Edit2,
  Globe,
  Mail,
  Phone,
  MapPin,
  ChevronRight,
  TrendingUp,
  Sun,
  Moon,
  Menu,
  X
} from "lucide-react";
import api from "@/services/api";
import { useTheme } from "@/hooks/useTheme";

type ActiveTab = 
  | "overview" 
  | "students" 
  | "institution" 
  | "analytics" 
  | "reports" 
  | "notifications"
  | "audit-logs"
  | "backup-restore";

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [loading, setLoading] = useState(true);
  const [themeMode, toggleThemeMode] = useTheme();
  const [showMobileNav, setShowMobileNav] = useState(false);

  // Data States
  const [metrics, setMetrics] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [institution, setInstitution] = useState<any>(null);
  const [deptAnalytics, setDeptAnalytics] = useState<any[]>([]);
  const [themes, setThemes] = useState<any[]>([]);
  const [reportsSummary, setReportsSummary] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  // Security & System States
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [adminRole, setAdminRole] = useState<string>("Admin");
  const [backingUp, setBackingUp] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
  const [alumniFilter, setAlumniFilter] = useState<"all" | "active" | "alumni">("all");

  // CRUD Modals States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<any>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [streamFilter, setStreamFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [manageLoading, setManageLoading] = useState(false);

  // Form States - Student Create/Edit
  const [studentForm, setStudentForm] = useState({
    fullName: "",
    email: "",
    password: "",
    department: "",
    registerNumber: "",
    role: "Student"
  });

  // Form States - Department
  const [newDeptName, setNewDeptName] = useState("");

  // Form States - Notification Dispatch
  const [notifForm, setNotifForm] = useState({
    title: "",
    message: "",
    type: "Broadcast",
    userId: 0,
    recipientType: "Broadcast",
    department: ""
  });

  const getAdminRoleFromToken = (token: string | null): string | null => {
    if (!token) return null;
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      const payload = JSON.parse(jsonPayload);
      return payload.role || payload["http://schemas.microsoft.com/wfx/2008/06/identity/claims/role"] || payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || null;
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const adminToken = localStorage.getItem("adminToken");
      if (!adminToken) {
        router.push("/admin/login");
        return;
      }
      const role = getAdminRoleFromToken(adminToken);
      if (role) {
        setAdminRole(role);
      }
      const savedTheme = localStorage.getItem("adminThemeMode") as "light" | "dark";
      if (savedTheme) {
        // Migrate old key to shared key on first visit
        localStorage.setItem("mcc-theme", savedTheme);
        localStorage.removeItem("adminThemeMode");
      }
      // Theme is now handled by the shared useTheme hook (mcc-theme key)
    }
    loadAllData();
  }, []);

  // toggleThemeMode is now provided by useTheme hook — no local implementation needed

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      let currentRole = "Admin";
      if (typeof window !== "undefined") {
        const adminToken = localStorage.getItem("adminToken");
        const dec = getAdminRoleFromToken(adminToken);
        if (dec) {
          currentRole = dec;
          setAdminRole(dec);
        }
      }

      const promises = [
        fetchMetrics(),
        fetchStudents(),
        fetchInstitution(),
        fetchDepartmentAnalytics(),
        fetchThemes(),
        fetchReportsSummary(),
        fetchNotifications()
      ];

      if (currentRole === "Admin" || currentRole === "1") {
        promises.push(fetchAuditLogs());
      }

      await Promise.all(promises);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const res = await api.get("/Admin/dashboard");
      setMetrics(res.data);
    } catch (err) {
      console.error("Metrics fetch failed", err);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get("/Admin/students");
      setStudents(res.data);
    } catch (err) {
      console.error("Students fetch failed", err);
    }
  };

  const fetchInstitution = async () => {
    try {
      const res = await api.get("/Admin/institution");
      setInstitution(res.data);
    } catch (err) {
      console.error("Institution fetch failed", err);
    }
  };

  const fetchDepartmentAnalytics = async () => {
    try {
      const res = await api.get("/Admin/department-analytics");
      setDeptAnalytics(res.data);
    } catch (err) {
      console.error("Department analytics fetch failed", err);
    }
  };

  const fetchThemes = async () => {
    try {
      const res = await api.get("/Admin/themes");
      setThemes(res.data);
    } catch (err) {
      console.error("Themes fetch failed", err);
    }
  };

  const fetchReportsSummary = async () => {
    try {
      const res = await api.get("/Admin/reports");
      setReportsSummary(res.data);
    } catch (err) {
      console.error("Reports summary fetch failed", err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/Admin/notifications");
      setNotifications(res.data);
    } catch (err) {
      console.error("Notifications fetch failed", err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await api.get("/Admin/audit-logs");
      setAuditLogs(res.data);
    } catch (err) {
      console.error("Audit logs fetch failed", err);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      setBackingUp(true);
      const res = await api.get("/Admin/backup");
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `mcc_portfolio_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      alert("System backup file downloaded successfully.");
    } catch (err: any) {
      alert(`Backup failed: ${err.response?.data || err.message}`);
    } finally {
      setBackingUp(false);
    }
  };

  const handleRestoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm("WARNING: Restoring a backup will completely overwrite all current database tables and data. This action is irreversible. Do you want to proceed?")) {
      return;
    }

    try {
      setRestoringBackup(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          await api.post("/Admin/restore", json);
          alert("Database successfully restored from backup payload. Reloading console...");
          loadAllData();
        } catch (err: any) {
          alert(`Restore failed: ${err.response?.data || err.message || "Invalid JSON payload structure"}`);
        }
      };
      reader.readAsText(file);
    } catch (err: any) {
      alert(`Failed to read file: ${err.message}`);
    } finally {
      setRestoringBackup(false);
      // Reset input value
      e.target.value = "";
    }
  };

  // ==========================================
  // STUDENT CRUD HANDLERS
  // ==========================================

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.fullName.trim() || !studentForm.registerNumber.trim() || !studentForm.email.trim() || !studentForm.department.trim()) {
      alert("All fields (Full Name, Register Number, Email, and Department) are required.");
      return;
    }
    try {
      await api.post("/Admin/students", studentForm);
      alert("Student account created successfully.");
      setIsCreateModalOpen(false);
      setStudentForm({
        fullName: "",
        email: "",
        password: "",
        department: "",
        registerNumber: "",
        role: "Student"
      });
      loadAllData();
    } catch (err: any) {
      alert(`Failed to create student: ${err.response?.data || err.message}`);
    }
  };

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent) return;
    if (!studentForm.fullName.trim() || !studentForm.registerNumber.trim() || !studentForm.email.trim() || !studentForm.department.trim()) {
      alert("All fields (Full Name, Register Number, Email, and Department) are required.");
      return;
    }
    try {
      await api.put(`/Admin/students/${currentStudent.id}`, studentForm);
      alert("Student account updated successfully.");
      setIsEditModalOpen(false);
      loadAllData();
    } catch (err: any) {
      alert(`Failed to update student: ${err.response?.data || err.message}`);
    }
  };

  const handleDeleteStudent = async (id: number, name: string) => {
    if (!confirm(`Are you absolutely sure you want to permanently delete the portfolio and account for ${name}? This action cannot be undone.`)) {
      return;
    }
    try {
      await api.delete(`/Admin/students/${id}`);
      alert("Student deleted successfully.");
      loadAllData();
    } catch (err: any) {
      alert(`Failed to delete student: ${err.response?.data || err.message}`);
    }
  };

  const openEditModal = (student: any) => {
    setCurrentStudent(student);
    setStudentForm({
      fullName: student.fullName || student.FullName || "",
      email: student.email || student.Email || "",
      password: "", // Not required for edit
      department: student.department || student.Department || "",
      registerNumber: student.registerNumber || student.RegisterNumber || "",
      role: student.role || student.Role || "Student"
    });
    setIsEditModalOpen(true);
  };

  const toggleApproval = async (studentId: number, currentStatus: boolean) => {
    try {
      await api.post(`/Admin/approve/${studentId}`, !currentStatus, {
        headers: { "Content-Type": "application/json" }
      });
      await loadAllData();
      alert(`Portfolio ${!currentStatus ? "Approved" : "Revoked"} successfully.`);
    } catch (err: any) {
      alert(`Failed to change approval: ${err.response?.data?.message || err.message}`);
    }
  };

  const openManageModal = (student: any) => {
    setSelectedStudent(student);
    setResetPasswordValue("");
    setIsManageModalOpen(true);
  };

  const handleToggleActive = async (studentId: number, currentActive: boolean) => {
    setManageLoading(true);
    try {
      const s = selectedStudent;
      await api.put(`/Admin/students/${studentId}`, {
        fullName: s.fullName,
        email: s.email,
        department: s.department,
        stream: s.stream || "Aided",
        registerNumber: s.registerNumber,
        role: s.role || "Student",
        isActive: !currentActive
      });
      setSelectedStudent({ ...selectedStudent, isActive: !currentActive });
      await loadAllData();
      alert(`Account ${!currentActive ? "activated" : "deactivated"} successfully.`);
    } catch (err: any) {
      alert(`Failed to toggle account: ${err.response?.data || err.message}`);
    } finally {
      setManageLoading(false);
    }
  };

  const handleAdminResetPassword = async (studentId: number) => {
    if (!resetPasswordValue.trim() || resetPasswordValue.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }
    setManageLoading(true);
    try {
      await api.post(`/Admin/students/${studentId}/reset-password`, { password: resetPasswordValue });
      alert("Password reset successfully.");
      setResetPasswordValue("");
    } catch (err: any) {
      alert(`Failed to reset password: ${err.response?.data || err.message}`);
    } finally {
      setManageLoading(false);
    }
  };

  // ==========================================
  // INSTITUTION SETTINGS HANDLERS
  // ==========================================

  const handleUpdateInstitution = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put("/Admin/institution", institution);
      alert("Institution details updated successfully.");
      loadAllData();
    } catch (err: any) {
      alert(`Failed to update institution details: ${err.response?.data || err.message}`);
    }
  };

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    try {
      await api.post("/Admin/institution/departments", JSON.stringify(newDeptName.trim()), {
        headers: { "Content-Type": "application/json" }
      });
      alert(`Department "${newDeptName}" added.`);
      setNewDeptName("");
      loadAllData();
    } catch (err: any) {
      alert(`Failed to add department: ${err.response?.data || err.message}`);
    }
  };

  const handleDeleteDepartment = async (deptName: string) => {
    if (!confirm(`Delete department "${deptName}"? This will only remove it from the managed list.`)) return;
    try {
      await api.delete(`/Admin/institution/departments/${encodeURIComponent(deptName)}`);
      alert("Department removed from managed list.");
      loadAllData();
    } catch (err: any) {
      alert(`Failed to remove department: ${err.response?.data || err.message}`);
    }
  };

  // ==========================================
  // USER ROLE MANAGEMENT HANDLERS
  // ==========================================

  const handleToggleRole = async (userId: number, currentRole: string) => {
    const targetRole = currentRole === "Admin" ? "Student" : "Admin";
    if (!confirm(`Are you sure you want to change this user's role to ${targetRole}?`)) return;
    try {
      await api.put(`/Admin/users/${userId}/role`, { role: targetRole });
      alert(`User role changed to ${targetRole}.`);
      loadAllData();
    } catch (err: any) {
      alert(`Failed to change role: ${err.response?.data || err.message}`);
    }
  };

  // ==========================================
  // THEME MANAGEMENT HANDLERS
  // ==========================================

  const handleToggleTheme = async (themeId: string, displayName: string, description: string, currentStatus: boolean) => {
    try {
      await api.put(`/Admin/themes/${themeId}`, {
        displayName,
        description,
        isActive: !currentStatus
      });
      alert(`Theme "${displayName}" ${!currentStatus ? "activated" : "deactivated"}.`);
      loadAllData();
    } catch (err: any) {
      alert(`Failed to update theme status: ${err.response?.data || err.message}`);
    }
  };

  const handleUpdateThemeStyle = async (themeId: string, payload: any) => {
    try {
      await api.put(`/Admin/themes/${themeId}`, payload);
      setThemes(prevThemes => prevThemes.map(t => t.themeId === themeId ? { ...t, ...payload } : t));
    } catch (err: any) {
      console.error("Failed to update theme style", err);
    }
  };

  // ==========================================
  // NOTIFICATION DISPATCH HANDLERS
  // ==========================================

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifForm.title || !notifForm.message) {
      alert("Title and message are required.");
      return;
    }

    if (notifForm.recipientType === "Department" && !notifForm.department) {
      alert("Please select a department.");
      return;
    }

    if (notifForm.recipientType === "Individual" && !notifForm.userId) {
      alert("Please select a target student.");
      return;
    }

    try {
      const payload: any = {
        title: notifForm.title,
        message: notifForm.message,
      };

      if (notifForm.recipientType === "Broadcast") {
        payload.type = "Broadcast";
        payload.userId = 0;
      } else if (notifForm.recipientType === "Department") {
        payload.type = "Department";
        payload.department = notifForm.department;
      } else {
        payload.type = notifForm.type === "Broadcast" ? "Info" : notifForm.type;
        payload.userId = Number(notifForm.userId);
      }

      await api.post("/Admin/notifications", payload);
      alert("Notification sent successfully.");
      setNotifForm({
        title: "",
        message: "",
        type: "Broadcast",
        userId: 0,
        recipientType: "Broadcast",
        department: ""
      });
      loadAllData();
    } catch (err: any) {
      alert(`Failed to send notification: ${err.response?.data?.message || err.response?.data || err.message}`);
    }
  };

  const handleDeleteNotification = async (id: number) => {
    if (!confirm("Are you sure you want to delete this notification from history?")) return;
    try {
      await api.delete(`/Admin/notifications/${id}`);
      alert("Notification deleted.");
      loadAllData();
    } catch (err: any) {
      alert(`Failed to delete notification: ${err.response?.data || err.message}`);
    }
  };

  // ==========================================
  // REPORTS & GROWTH EXPORT
  // ==========================================

  const handleExportCSV = async () => {
    const adminToken = localStorage.getItem("adminToken");
    try {
      const res = await fetch("/api/Admin/reports/export", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (!res.ok) {
        alert("Export failed: " + (await res.text()));
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
      const a = document.createElement("a");
      a.href = url;
      a.download = `mcc_portfolios_report_${dateStr}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("Export error: " + err.message);
    }
  };

  // Filter students list based on searchQuery, verification filter, and alumni status
  const filteredStudents = students.filter((s) => {
    if (!s) return false;
    const name = s.fullName || s.FullName || "";
    const email = s.email || s.Email || "";
    const dept = s.department || s.Department || "";
    const stream = s.stream || s.Stream || "";
    const regNum = s.registerNumber || s.RegisterNumber || "";
    
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.toLowerCase().includes(searchQuery.toLowerCase()) ||
      regNum.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (streamFilter !== "all" && stream.toLowerCase() !== streamFilter.toLowerCase()) return false;
    if (deptFilter !== "all" && dept.toLowerCase() !== deptFilter.toLowerCase()) return false;

    const isApproved = s.isApproved !== undefined 
      ? s.isApproved 
      : (s.IsApproved !== undefined ? s.IsApproved : false);

    if (filter === "pending") return !isApproved;
    if (filter === "approved") return isApproved;

    const isAlumni = s.isAlumni !== undefined
      ? s.isAlumni
      : (s.IsAlumni !== undefined ? s.IsAlumni : false);

    if (alumniFilter === "active" && isAlumni) return false;
    if (alumniFilter === "alumni" && !isAlumni) return false;

    return true;
  });

  if (loading && !metrics) {
    return (
      <div className="min-h-screen bg-[#0d0d12] text-[#f3f4f6] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-2 border-[#781c1c] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-400 text-sm font-semibold tracking-widest uppercase animate-pulse">
          Loading MCC Admin Console...
        </p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex relative overflow-hidden transition-colors duration-300 ${
      themeMode === "dark" ? "bg-[#0d0d12] text-[#f3f4f6]" : "bg-[#fcfaf6] text-[#0f172a]"
    }`}>
      {/* Background radial overlays */}
      {themeMode === "dark" && (
        <>
          <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-[#4f46e5]/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#ec4899]/5 rounded-full blur-[140px] pointer-events-none" />
        </>
      )}

      {/* ==========================================
          SIDEBAR NAVIGATION
          ========================================== */}
      <div className={`w-72 border-r relative z-20 flex-col justify-between shrink-0 h-screen sticky top-0 transition-colors duration-300 hidden md:flex ${
        themeMode === "dark" ? "bg-[#09090d]/90 border-white/5 text-white" : "bg-[#18233c] border-[#781c1c]/10 text-white shadow-xl"
      }`}>
        <div>
          {/* Logo & Console Title */}
          <div className={`p-6 border-b flex items-center gap-3 ${
            themeMode === "dark" ? "border-white/5" : "border-amber-600/20"
          }`}>
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 border border-white/20 shadow-md overflow-hidden p-0.5">
              <img src="/mcc-crest.png" className="w-full h-full object-contain" alt="MCC Crest" />
            </div>
            <div>
              <span className="font-serif font-black text-xs tracking-tight text-white block leading-none">
                MADRAS CHRISTIAN
              </span>
              <span className="font-serif font-black text-xs tracking-tight text-white block mt-0.5 leading-none">
                COLLEGE
              </span>
              <span className="text-[7px] uppercase font-mono tracking-widest text-[#d4af37] block font-extrabold mt-1 leading-none">
                Admin Console
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1.5">
            {[
              { id: "overview", label: "Dashboard Overview", icon: Activity },
              { id: "students", label: "Student Directory", icon: Users },
              { id: "institution", label: "Institution Details", icon: Building },
              { id: "analytics", label: "Department Analytics", icon: BarChart2 },
              { id: "reports", label: "Analytics & Export", icon: FileText },
              { id: "notifications", label: "Notification Manager", icon: Bell },
              { id: "audit-logs", label: "Security Audit Logs", icon: Shield },
              { id: "backup-restore", label: "System Backup/Restore", icon: Settings }
            ].filter((tab) => {
              if (adminRole === "Moderator" || adminRole === "3") {
                return !["audit-logs", "backup-restore"].includes(tab.id);
              }
              return true;
            }).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-btn-${tab.id}`}
                  onClick={() => setActiveTab(tab.id as ActiveTab)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 ${
                    isActive
                      ? themeMode === "dark"
                        ? "bg-white text-black shadow-lg shadow-white/5 font-bold"
                        : "bg-white text-[#18233c] shadow-lg shadow-white/5 font-bold"
                      : themeMode === "dark"
                        ? "text-slate-400 hover:text-white hover:bg-white/5"
                        : "text-slate-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Icon size={16} className={isActive ? (themeMode === "dark" ? "text-black" : "text-[#18233c]") : "text-slate-400"} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Quick Controls */}
        <div className={`p-4 border-t space-y-3 ${
          themeMode === "dark" ? "border-white/5" : "border-[#781c1c]/10"
        }`}>


          <Link
            href="/"
            className={`flex items-center justify-between text-[11px] transition px-2 ${
              themeMode === "dark" ? "text-gray-400 hover:text-white" : "text-slate-300 hover:text-white"
            }`}
          >
            <span className="flex items-center gap-2"><ArrowLeft size={12} /> Leave Admin Panel</span>
            <ChevronRight size={10} />
          </Link>
          <button
            onClick={() => {
              localStorage.removeItem("adminToken");
              localStorage.removeItem("admin");
              router.push("/admin/login");
            }}
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition duration-200"
          >
            Sign Out Console
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER SIDEBAR OVERLAY */}
      {showMobileNav && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-black/60 backdrop-blur-xs select-none">
          <div className={`w-72 flex flex-col justify-between p-5 animate-slideIn h-screen border-r ${
            themeMode === "dark" ? "bg-[#09090d] border-white/5 text-white" : "bg-[#18233c] border-[#781c1c]/10 text-white"
          }`}>
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center border border-white/20 shadow-sm overflow-hidden shrink-0 p-0.5">
                    <img src="/mcc-crest.png" className="w-full h-full object-contain" alt="MCC Crest" />
                  </div>
                  <div>
                    <span className="font-serif font-black text-[10px] tracking-tight text-white block leading-none">
                      MADRAS CHRISTIAN
                    </span>
                    <span className="font-serif font-black text-[10px] tracking-tight text-white block mt-0.5 leading-none">
                      COLLEGE
                    </span>
                  </div>
                </div>
                <button onClick={() => setShowMobileNav(false)} className="text-slate-400 hover:text-white cursor-pointer p-1">
                  <X size={18} />
                </button>
              </div>
              
              <nav className="py-4 space-y-1.5 overflow-y-auto max-h-[60vh] scrollbar-thin">
                {[
                  { id: "overview", label: "Dashboard Overview", icon: Activity },
                  { id: "students", label: "Student Directory", icon: Users },
                  { id: "institution", label: "Institution Details", icon: Building },
                  { id: "analytics", label: "Department Analytics", icon: BarChart2 },
                  { id: "reports", label: "Analytics & Export", icon: FileText },
                  { id: "notifications", label: "Notification Manager", icon: Bell },
                  { id: "audit-logs", label: "Security Audit Logs", icon: Shield },
                  { id: "backup-restore", label: "System Backup/Restore", icon: Settings }
                ].filter((tab) => {
                  if (adminRole === "Moderator" || adminRole === "3") {
                    return !["audit-logs", "backup-restore"].includes(tab.id);
                  }
                  return true;
                }).map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as ActiveTab);
                        setShowMobileNav(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                        isActive
                          ? "bg-[#781c1c] text-white shadow"
                          : "hover:bg-white/5 text-slate-350 hover:text-white"
                      }`}
                    >
                      <Icon size={14} />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
            
            <div className="pt-4 border-t border-white/10 space-y-3">
              <button
                onClick={() => {
                  localStorage.removeItem("adminToken");
                  localStorage.removeItem("admin");
                  router.push("/admin/login");
                }}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition duration-200"
              >
                Sign Out Console
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setShowMobileNav(false)} />
        </div>
      )}

      {/* ==========================================
          MAIN CONTENT AREA
          ========================================== */}
      <div className="flex-1 min-w-0 p-4 md:p-8 lg:p-12 relative z-10 overflow-y-auto max-h-screen">
        
        {/* MOBILE TOP HEADER BAR */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-[#09090d] border border-slate-200 dark:border-white/5 rounded-2xl select-none mb-6 shadow-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMobileNav(true)}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"
            >
              <Menu size={20} />
            </button>
            <span className="font-serif font-black text-[#18233c] dark:text-white tracking-tight text-xs uppercase">
              Admin Console
            </span>
          </div>
        </div>

        {/* BANNER SHOWCASE */}
        <div className="relative rounded-3xl overflow-hidden h-44 bg-[#18233c] text-white flex items-end p-8 border border-amber-600/20 shadow-md mb-8">
          <div className="absolute inset-0 z-0">
            <img 
              src="/mcc-main-gate.jpg" 
              alt="MCC Historic Archway" 
              className="w-full h-full object-cover opacity-30 filter brightness-75 contrast-125"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#18233c] via-[#18233c]/50 to-transparent" />
          </div>
          <div className="relative z-10 space-y-1 w-full text-left">
            <span className="text-[9px] uppercase font-mono font-black tracking-widest text-amber-400 bg-[#781c1c] px-3 py-1 rounded-full border border-amber-500/20 inline-block">
              Super Admin Console
            </span>
            <h1 className="font-serif text-2xl md:text-3xl font-black text-white mt-2">
              Placement & Portfolio Administration
            </h1>
            <p className="text-xs text-slate-300">
              Review and approve student directories, customize templates, and examine security audit logs.
            </p>
          </div>
        </div>
        
        {/* Title Bar */}
        <div className={`mb-10 flex items-center justify-between flex-wrap gap-4 border-b pb-6 ${
          themeMode === "dark" ? "border-white/5" : "border-slate-200"
        }`}>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-[#818cf8] font-bold">
              Madras Christian College
            </span>
            <h2 className={`text-2xl md:text-3xl font-black tracking-tight mt-0.5 capitalize ${
              themeMode === "dark" ? "text-white" : "text-slate-900"
            }`}>
              {activeTab === "overview" ? "Ecosystem Overview" : activeTab.replace("-", " ")}
            </h2>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-xl flex items-center gap-2">
            <Activity className="text-emerald-400 animate-pulse" size={14} />
            <span className="text-[10px] uppercase font-mono text-emerald-400 font-bold">Server Connection:</span>
            <span className={`text-[10px] font-bold ${themeMode === "dark" ? "text-white" : "text-slate-800"}`}>Online & Healthy</span>
          </div>
        </div>

        {/* ==========================================
            TAB: OVERVIEW & PORTFOLIO APPROVALS
            ========================================== */}
        {activeTab === "overview" && (
          <div className="space-y-10">
            {/* Global Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: "Students", val: metrics.totalStudents, icon: Users, color: "text-[#781c1c]" },
                { label: "Projects", val: metrics.totalProjects, icon: Code, color: "text-pink-400" },
                { label: "Skills", val: metrics.totalSkills, icon: Layers, color: "text-[#781c1c]" },
                { label: "Achievements", val: metrics.totalAchievements, icon: Trophy, color: "text-amber-400" },
                { label: "Hackathons", val: metrics.totalHackathons, icon: Activity, color: "text-emerald-400" },
                { label: "Papers", val: metrics.totalResearchPapers, icon: BookOpen, color: "text-cyan-400" }
              ].map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div key={idx} className={`border rounded-2xl p-5 transition duration-200 ${
                    themeMode === "dark"
                      ? "bg-[#0b0b0f] border-white/5 hover:bg-[#0c0c14]"
                      : "bg-white border-slate-200 hover:bg-slate-50 hover:shadow-md"
                  }`}>
                    <Icon size={18} className={`${stat.color} mb-2.5`} />
                    <span className={`text-xl md:text-2xl font-black block leading-none ${
                      themeMode === "dark" ? "text-white" : "text-slate-900"
                    }`}>
                      {stat.val || 0}
                    </span>
                    <span className="text-[9px] uppercase font-mono tracking-wider font-bold text-gray-400 mt-1 block">
                      {stat.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Quick Approvals Queue */}
            <div className={`border rounded-3xl p-6 shadow-xl transition-colors duration-300 ${
              themeMode === "dark" ? "bg-[#0b0b0f] border-white/5" : "bg-white border-slate-200"
            }`}>
              <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div>
                  <h3 className={`text-lg font-bold ${themeMode === "dark" ? "text-white" : "text-slate-900"}`}>Pending Portfolio Approvals</h3>
                  <p className="text-gray-400 text-xs mt-1">Students waiting for administrative profile verification.</p>
                </div>
                <div className={`flex items-center gap-1 border p-1 rounded-xl ${
                  themeMode === "dark" ? "bg-white/5 border-white/5" : "bg-slate-100 border-slate-200"
                }`}>
                  {[
                    { id: "pending", label: "Pending Queue" },
                    { id: "approved", label: "Approved List" },
                    { id: "all", label: "All Accounts" }
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      onClick={() => setFilter(btn.id as any)}
                      className={`px-3.5 py-1.5 rounded-lg text-[10px] font-bold transition ${
                        filter === btn.id
                          ? themeMode === "dark"
                            ? "bg-white text-black"
                            : "bg-slate-900 text-white shadow-sm"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredStudents.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredStudents.map((student) => {
                    const studentApproved = student.isApproved;
                    return (
                      <div
                        key={student.id}
                        className={`border rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between ${
                          themeMode === "dark" ? "bg-[#121217]/50 border-white/5 hover:border-[#781c1c]/20" : "bg-slate-50 border-slate-200 hover:border-[#781c1c]/25 hover:shadow-md"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3.5 flex-wrap gap-2">
                            <span className="text-[10px] uppercase font-mono tracking-widest text-[#781c1c] font-bold bg-[#a78bfa]/10 px-2 py-0.5 rounded border border-[#a78bfa]/15">
                              {student.department || "No Department"}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              studentApproved ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10" : "bg-amber-500/10 text-amber-400 border border-amber-500/10 animate-pulse"
                            }`}>
                              {studentApproved ? "Verified" : "Pending Approval"}
                            </span>
                          </div>

                          <h4 className={`text-base font-bold truncate leading-tight mb-1 ${
                            themeMode === "dark" ? "text-white" : "text-slate-900"
                          }`}>{student.fullName}</h4>
                          <span className="text-[10px] font-mono text-gray-500 block mb-2">{student.registerNumber}</span>
                          <span className="text-[11px] text-gray-400 block truncate mb-4">✉️ {student.email}</span>
                        </div>

                        <div className={`flex gap-2 border-t pt-3.5 ${
                          themeMode === "dark" ? "border-white/5" : "border-slate-200"
                        }`}>
                          <Link
                            href={`/portfolio/${student.id}`}
                            target="_blank"
                            className={`flex-1 border py-2 rounded-lg text-xs font-bold text-center transition ${
                              themeMode === "dark" ? "bg-white/5 hover:bg-white/10 text-white border-white/10" : "bg-white hover:bg-slate-100 text-slate-800 border-slate-200"
                            }`}
                          >
                            View Portfolio
                          </Link>
                          <button
                            onClick={() => openManageModal(student)}
                            className="flex-1 py-2 rounded-lg text-xs font-bold bg-[#781c1c] hover:bg-[#5f1515] text-white transition"
                          >
                            Manage
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={`text-center py-14 border border-dashed rounded-2xl ${
                  themeMode === "dark" ? "border-white/5 bg-white/[0.01]" : "border-slate-200 bg-slate-50/50"
                }`}>
                  <CheckCircle size={36} className="text-gray-600 mx-auto mb-3" />
                  <h4 className={`text-sm font-bold mb-1 ${themeMode === "dark" ? "text-white" : "text-slate-800"}`}>Queue is Clear</h4>
                  <p className="text-gray-400 text-xs">No students currently match the selected filter category.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==========================================
            TAB: STUDENT DIRECTORY (CRUD)
            ========================================== */}
        {activeTab === "students" && (
          <div className={`border rounded-3xl p-6 shadow-xl space-y-6 transition-colors duration-300 ${
            themeMode === "dark" ? "bg-[#0b0b0f] border-white/5" : "bg-white border-slate-200"
          }`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex flex-1 items-center gap-3 w-full max-w-xl">
                <div className={`flex-1 border rounded-xl px-4 h-[40px] flex items-center gap-2 ${
                  themeMode === "dark" ? "bg-[#121217] border-white/5" : "bg-slate-50 border-slate-200"
                }`}>
                  <Search size={14} className="text-gray-500 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search by name, email, reg no..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`bg-transparent border-none outline-none text-xs w-full ${
                      themeMode === "dark" ? "text-white placeholder-gray-500" : "text-slate-900 placeholder-slate-400"
                    }`}
                  />
                </div>
                <select
                  value={streamFilter}
                  onChange={(e) => setStreamFilter(e.target.value)}
                  className={`px-3 h-[40px] rounded-xl text-xs font-semibold outline-none border ${
                    themeMode === "dark" ? "bg-[#121217] border-white/5 text-white" : "bg-white border-slate-200 text-slate-700"
                  }`}
                >
                  <option value="all">All Streams</option>
                  <option value="Aided">Aided</option>
                  <option value="SFS">SFS</option>
                </select>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className={`px-3 h-[40px] rounded-xl text-xs font-semibold outline-none border ${
                    themeMode === "dark" ? "bg-[#121217] border-white/5 text-white" : "bg-white border-slate-200 text-slate-700"
                  }`}
                >
                  <option value="all">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <button
                onClick={() => {
                  setStudentForm({
                    fullName: "",
                    email: "",
                    password: "",
                    department: institution?.departments?.split(";")[0] || "",
                    registerNumber: "",
                    role: "Student"
                  });
                  setIsCreateModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 h-[40px] rounded-xl text-xs bg-[#781c1c] hover:bg-[#5f1515] text-white font-bold transition shadow-lg shadow-[#781c1c]/10"
              >
                <Plus size={14} /> Add Student
              </button>
            </div>

            {/* Student count */}
            <p className={`text-xs mb-4 ${themeMode === "dark" ? "text-gray-500" : "text-slate-400"}`}>
              Showing {filteredStudents.length} of {students.length} students
            </p>

            {filteredStudents.length > 0 ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className={`border rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 ${
                      themeMode === "dark"
                        ? "bg-[#121217]/50 border-white/5 hover:border-[#781c1c]/20"
                        : "bg-white border-slate-200 hover:border-[#781c1c]/25 hover:shadow-md"
                    }`}
                  >
                    <div>
                      {/* Top row: dept badge + status */}
                      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                        <span className="text-[9px] uppercase font-mono tracking-widest text-[#781c1c] font-bold bg-[#781c1c]/5 px-2 py-0.5 rounded border border-[#781c1c]/15">
                          {student.department || "No Dept"}
                        </span>
                        <div className="flex gap-1.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            student.isApproved ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400 animate-pulse"
                          }`}>
                            {student.isApproved ? "Verified" : "Pending"}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            student.isActive !== false ? "bg-blue-500/10 text-blue-400" : "bg-rose-500/10 text-rose-400"
                          }`}>
                            {student.isActive !== false ? "Active" : "Disabled"}
                          </span>
                        </div>
                      </div>

                      {/* Name */}
                      <h4 className={`text-sm font-bold truncate leading-tight mb-0.5 ${
                        themeMode === "dark" ? "text-white" : "text-slate-900"
                      }`}>{student.fullName}</h4>
                      <span className="text-[10px] font-mono text-gray-500 block mb-0.5">{student.registerNumber || "No Reg #"}</span>
                      <span className="text-[10px] text-gray-400 block truncate mb-1">✉️ {student.email}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                        themeMode === "dark" ? "bg-white/5 text-gray-400" : "bg-slate-100 text-slate-500"
                      }`}>{student.stream || "—"}</span>
                    </div>

                    {/* Action buttons */}
                    <div className={`flex gap-2 border-t pt-3.5 mt-3.5 ${
                      themeMode === "dark" ? "border-white/5" : "border-slate-100"
                    }`}>
                      <button
                        onClick={() => openManageModal(student)}
                        className="flex-1 py-2 rounded-lg text-xs font-bold bg-[#781c1c] hover:bg-[#5f1515] text-white transition"
                      >
                        Manage
                      </button>
                      <Link
                        href={`/portfolio/${student.id}`}
                        target="_blank"
                        className={`flex-1 py-2 rounded-lg text-xs font-bold text-center border transition ${
                          themeMode === "dark" ? "bg-white/5 hover:bg-white/10 text-white border-white/10" : "bg-white hover:bg-slate-100 text-slate-800 border-slate-200"
                        }`}
                      >
                        Portfolio
                      </Link>
                      <button
                        onClick={() => handleDeleteStudent(student.id, student.fullName)}
                        className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`text-center py-14 border border-dashed rounded-2xl ${
                themeMode === "dark" ? "border-white/5 bg-white/[0.01]" : "border-slate-200 bg-slate-50/50"
              }`}>
                <Users size={36} className="text-gray-600 mx-auto mb-3" />
                <h4 className={`text-sm font-bold mb-1 ${themeMode === "dark" ? "text-white" : "text-slate-800"}`}>No Students Found</h4>
                <p className="text-gray-400 text-xs">No students match your current search or filter criteria.</p>
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            TAB: INSTITUTION MANAGEMENT
            ========================================== */}
        {activeTab === "institution" && institution && (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left: General Settings Form */}
            <div className={`lg:col-span-2 border rounded-3xl p-6 shadow-xl space-y-6 transition-colors duration-300 ${
              themeMode === "dark" ? "bg-[#0b0b0f] border-white/5" : "bg-white border-slate-200"
            }`}>
              <div>
                <h3 className={`text-lg font-bold ${themeMode === "dark" ? "text-white" : "text-slate-900"}`}>Ecosystem Configuration</h3>
                <p className="text-gray-400 text-xs mt-1">Configure default naming and metadata for Madras Christian College.</p>
              </div>

              <form onSubmit={handleUpdateInstitution} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-gray-400 block mb-2">College Name</label>
                    <input
                      type="text"
                      value={institution.name}
                      onChange={(e) => setInstitution({ ...institution, name: e.target.value })}
                      className={`w-full border rounded-xl px-4 py-3 text-xs outline-none focus:border-[#781c1c] transition ${
                        themeMode === "dark" ? "bg-[#121217] border-white/5 text-white" : "bg-white border-slate-200 text-slate-900"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-gray-400 block mb-2">Institution Code</label>
                    <input
                      type="text"
                      value={institution.code}
                      onChange={(e) => setInstitution({ ...institution, code: e.target.value })}
                      className={`w-full border rounded-xl px-4 py-3 text-xs outline-none focus:border-[#781c1c] transition ${
                        themeMode === "dark" ? "bg-[#121217] border-white/5 text-white" : "bg-white border-slate-200 text-slate-900"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-gray-400 block mb-2">Description</label>
                  <textarea
                    rows={4}
                    value={institution.description}
                    onChange={(e) => setInstitution({ ...institution, description: e.target.value })}
                    className={`w-full border rounded-xl px-4 py-3 text-xs outline-none focus:border-[#781c1c] transition resize-none ${
                      themeMode === "dark" ? "bg-[#121217] border-white/5 text-white" : "bg-white border-slate-200 text-slate-900"
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-gray-400 block mb-2">Contact Email</label>
                    <input
                      type="email"
                      value={institution.contactEmail}
                      onChange={(e) => setInstitution({ ...institution, contactEmail: e.target.value })}
                      className={`w-full border rounded-xl px-4 py-3 text-xs outline-none focus:border-[#781c1c] transition ${
                        themeMode === "dark" ? "bg-[#121217] border-white/5 text-white" : "bg-white border-slate-200 text-slate-900"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-gray-400 block mb-2">Contact Phone</label>
                    <input
                      type="text"
                      value={institution.contactPhone}
                      onChange={(e) => setInstitution({ ...institution, contactPhone: e.target.value })}
                      className={`w-full border rounded-xl px-4 py-3 text-xs outline-none focus:border-[#781c1c] transition ${
                        themeMode === "dark" ? "bg-[#121217] border-white/5 text-white" : "bg-white border-slate-200 text-slate-900"
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-gray-400 block mb-2">Website URL</label>
                    <input
                      type="text"
                      value={institution.website}
                      onChange={(e) => setInstitution({ ...institution, website: e.target.value })}
                      className={`w-full border rounded-xl px-4 py-3 text-xs outline-none focus:border-[#781c1c] transition ${
                        themeMode === "dark" ? "bg-[#121217] border-white/5 text-white" : "bg-white border-slate-200 text-slate-900"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-gray-400 block mb-2">Logo Image URL</label>
                    <input
                      type="text"
                      value={institution.logoUrl}
                      onChange={(e) => setInstitution({ ...institution, logoUrl: e.target.value })}
                      className={`w-full border rounded-xl px-4 py-3 text-xs outline-none focus:border-[#781c1c] transition ${
                        themeMode === "dark" ? "bg-[#121217] border-white/5 text-white" : "bg-white border-slate-200 text-slate-900"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-gray-400 block mb-2">Address</label>
                  <input
                    type="text"
                    value={institution.address}
                    onChange={(e) => setInstitution({ ...institution, address: e.target.value })}
                    className={`w-full border rounded-xl px-4 py-3 text-xs outline-none focus:border-[#781c1c] transition ${
                      themeMode === "dark" ? "bg-[#121217] border-white/5 text-white" : "bg-white border-slate-200 text-slate-900"
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-[#781c1c] hover:bg-[#5f1515] text-white text-xs font-bold transition shadow-lg shadow-[#781c1c]/10"
                >
                  Save Configuration
                </button>
              </form>
            </div>

            {/* Right: Managed Departments List */}
            <div className={`border rounded-3xl p-6 shadow-xl space-y-6 transition-colors duration-300 ${
              themeMode === "dark" ? "bg-[#0b0b0f] border-white/5" : "bg-white border-slate-200"
            }`}>
              <div>
                <h3 className={`text-lg font-bold ${themeMode === "dark" ? "text-white" : "text-slate-900"}`}>Department Catalog</h3>
                <p className="text-gray-400 text-xs mt-1">Manage standard list of active streams inside the portal.</p>
              </div>

              <form onSubmit={handleAddDepartment} className="flex gap-2">
                <input
                  type="text"
                  placeholder="New department name..."
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  className={`flex-1 border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-[#781c1c] transition ${
                    themeMode === "dark" ? "bg-[#121217] border-white/5 text-white" : "bg-white border-slate-200 text-slate-900"
                  }`}
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-[#781c1c] hover:bg-[#5f1515] text-white text-xs font-bold transition shrink-0"
                >
                  Add
                </button>
              </form>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {institution.departments
                  .split(";")
                  .filter((d: string) => d.trim().length > 0)
                  .map((dept: string, idx: number) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-3 border rounded-xl transition ${
                        themeMode === "dark" ? "bg-white/5 border-white/5 hover:bg-white/[0.08]" : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span className={`text-xs font-semibold ${themeMode === "dark" ? "text-white" : "text-slate-700"}`}>{dept}</span>
                      <button
                        onClick={() => handleDeleteDepartment(dept)}
                        className="text-rose-400 p-1 hover:bg-rose-500/10 rounded transition"
                        title="Remove stream"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB: DEPARTMENT ANALYTICS
            ========================================== */}
        {activeTab === "analytics" && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {deptAnalytics.map((dept, idx) => (
                <div key={idx} className={`border rounded-3xl p-6 transition-all duration-300 hover:border-[#a78bfa]/20 ${
                  themeMode === "dark" ? "bg-[#0b0b0f] border-white/5" : "bg-white border-slate-200"
                }`}>
                  <div className="flex justify-between items-start mb-4">
                    <h4 className={`text-base font-extrabold truncate max-w-[160px] ${
                      themeMode === "dark" ? "text-white" : "text-slate-800"
                    }`} title={dept.department}>
                      {dept.department}
                    </h4>
                    <span className="text-[10px] font-mono font-bold text-[#781c1c] bg-[#781c1c]/10 px-2 py-0.5 rounded shrink-0">
                      {dept.studentCount} Students
                    </span>
                  </div>

                  {/* Horizontal progress/metrics */}
                  <div className={`space-y-3.5 border-t pt-4 ${
                    themeMode === "dark" ? "border-white/5" : "border-slate-200"
                  }`}>
                    <div>
                      <div className="flex justify-between text-[10px] font-semibold text-gray-400 mb-1">
                        <span>Portfolio Verification Rate</span>
                        <span className={`font-mono ${themeMode === "dark" ? "text-white" : "text-slate-900"}`}>{dept.approvalRate}%</span>
                      </div>
                      <div className={`w-full h-1.5 rounded-full overflow-hidden ${
                        themeMode === "dark" ? "bg-white/5" : "bg-slate-100"
                      }`}>
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-green-600 h-full rounded-full"
                          style={{ width: `${dept.approvalRate}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center pt-2">
                      <div className={`border rounded-lg py-2 ${
                        themeMode === "dark" ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-100"
                      }`}>
                        <span className={`text-xs font-black block ${themeMode === "dark" ? "text-white" : "text-slate-900"}`}>{dept.projectCount}</span>
                        <span className="text-[8px] uppercase tracking-wider text-gray-500 font-bold block">Projects</span>
                      </div>
                      <div className={`border rounded-lg py-2 ${
                        themeMode === "dark" ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-100"
                      }`}>
                        <span className={`text-xs font-black block ${themeMode === "dark" ? "text-white" : "text-slate-900"}`}>{dept.paperCount}</span>
                        <span className="text-[8px] uppercase tracking-wider text-gray-500 font-bold block">Papers</span>
                      </div>
                      <div className={`border rounded-lg py-2 ${
                        themeMode === "dark" ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-100"
                      }`}>
                        <span className={`text-xs font-black block ${themeMode === "dark" ? "text-white" : "text-slate-900"}`}>{dept.skillCount}</span>
                        <span className="text-[8px] uppercase tracking-wider text-gray-500 font-bold block">Skills</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ALUMNI PLACEMENT & PROGRESSION DASHBOARD */}
            <div className={`border rounded-3xl p-6 shadow-xl transition-colors duration-300 ${
              themeMode === "dark" ? "bg-[#0b0b0f] border-white/5" : "bg-white border-slate-200"
            }`}>
              <div className="mb-6">
                <h3 className={`text-lg font-bold ${themeMode === "dark" ? "text-white" : "text-slate-900"}`}>
                  🎓 Alumni Career Progression & Placements
                </h3>
                <p className="text-gray-400 text-xs mt-1">
                  Verifiable tracking statistics for Madras Christian College graduates.
                </p>
              </div>

              {(() => {
                const alumniList = students.filter(s => s && (s.isAlumni || s.IsAlumni));
                const totalAlumni = alumniList.length;
                const employedAlumni = alumniList.filter(s => s.currentCompany && s.currentCompany.trim().length > 0);
                const higherEdAlumni = alumniList.filter(s => s.higherStudyUniversity && s.higherStudyUniversity.trim().length > 0);
                
                const placementRate = totalAlumni > 0 ? Math.round((employedAlumni.length / totalAlumni) * 100) : 0;
                const higherEdRate = totalAlumni > 0 ? Math.round((higherEdAlumni.length / totalAlumni) * 100) : 0;
                const otherRate = totalAlumni > 0 ? 100 - placementRate - higherEdRate : 0;

                return (
                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Stat Cards Column */}
                    <div className="md:col-span-1 space-y-4">
                      <div className={`border rounded-2xl p-5 ${
                        themeMode === "dark" ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-100"
                      }`}>
                        <span className="text-gray-400 text-[10px] uppercase font-mono tracking-wider font-bold">Total Alumni Tracked</span>
                        <div className={`text-3xl font-black mt-1 ${themeMode === "dark" ? "text-white" : "text-slate-900"}`}>
                          {totalAlumni}
                        </div>
                      </div>

                      <div className={`border rounded-2xl p-5 ${
                        themeMode === "dark" ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-100"
                      }`}>
                        <span className="text-gray-400 text-[10px] uppercase font-mono tracking-wider font-bold">Industry Placements</span>
                        <div className="text-3xl font-black mt-1 text-emerald-400">
                          {employedAlumni.length} <span className="text-xs text-gray-500 font-normal">({placementRate}%)</span>
                        </div>
                      </div>

                      <div className={`border rounded-2xl p-5 ${
                        themeMode === "dark" ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-100"
                      }`}>
                        <span className="text-gray-400 text-[10px] uppercase font-mono tracking-wider font-bold">Global Higher Education</span>
                        <div className="text-3xl font-black mt-1 text-[#781c1c]">
                          {higherEdAlumni.length} <span className="text-xs text-gray-500 font-normal">({higherEdRate}%)</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Chart Column */}
                    <div className="md:col-span-2 space-y-6">
                      <h4 className={`text-sm font-bold ${themeMode === "dark" ? "text-white" : "text-slate-800"}`}>
                        Destination Distribution
                      </h4>

                      <div className="space-y-4">
                        {/* Placement bar */}
                        <div>
                          <div className="flex justify-between text-xs font-semibold text-gray-400 mb-1.5">
                            <span>💼 Corporate Placements / Employed</span>
                            <span className={themeMode === "dark" ? "text-white" : "text-slate-900"}>{placementRate}%</span>
                          </div>
                          <div className={`w-full h-3 rounded-full overflow-hidden ${
                            themeMode === "dark" ? "bg-white/5" : "bg-slate-100"
                          }`}>
                            <div className="bg-gradient-to-r from-emerald-400 to-green-600 h-full rounded-full" style={{ width: `${placementRate}%` }} />
                          </div>
                        </div>

                        {/* Higher studies bar */}
                        <div>
                          <div className="flex justify-between text-xs font-semibold text-gray-400 mb-1.5">
                            <span>🏛️ Global Universities / Higher Studies</span>
                            <span className={themeMode === "dark" ? "text-white" : "text-slate-900"}>{higherEdRate}%</span>
                          </div>
                          <div className={`w-full h-3 rounded-full overflow-hidden ${
                            themeMode === "dark" ? "bg-white/5" : "bg-slate-100"
                          }`}>
                            <div className="bg-gradient-to-r from-[#781c1c] to-[#18233c] h-full rounded-full" style={{ width: `${higherEdRate}%` }} />
                          </div>
                        </div>

                        {/* Other bar */}
                        <div>
                          <div className="flex justify-between text-xs font-semibold text-gray-400 mb-1.5">
                            <span>🎯 Entrepreneurship / Self-Employed / Other</span>
                            <span className={themeMode === "dark" ? "text-white" : "text-slate-900"}>{otherRate}%</span>
                          </div>
                          <div className={`w-full h-3 rounded-full overflow-hidden ${
                            themeMode === "dark" ? "bg-white/5" : "bg-slate-100"
                          }`}>
                            <div className="bg-gradient-to-r from-blue-400 to-cyan-500 h-full rounded-full" style={{ width: `${otherRate}%` }} />
                          </div>
                        </div>
                      </div>

                      {/* Top destinations lists */}
                      <div className={`grid grid-cols-2 gap-4 pt-4 border-t font-sans ${
                        themeMode === "dark" ? "border-white/5" : "border-slate-200"
                      }`}>
                        <div>
                          <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-gray-500 block mb-2">Top Hiring Employers</span>
                          <ul className={`text-xs space-y-1 ${themeMode === "dark" ? "text-gray-300" : "text-slate-700"}`}>
                            {employedAlumni.slice(0, 3).map((a, i) => (
                              <li key={i} className="truncate">🏢 {a.currentCompany} ({a.fullName})</li>
                            ))}
                            {employedAlumni.length === 0 && <li className="text-gray-500 italic">No placements logged yet</li>}
                          </ul>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-gray-500 block mb-2">Top Academic Destinations</span>
                          <ul className={`text-xs space-y-1 ${themeMode === "dark" ? "text-gray-300" : "text-slate-700"}`}>
                            {higherEdAlumni.slice(0, 3).map((a, i) => (
                              <li key={i} className="truncate">🎓 {a.higherStudyUniversity} ({a.fullName})</li>
                            ))}
                            {higherEdAlumni.length === 0 && <li className="text-gray-500 italic">No academic progressions logged yet</li>}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}




        {/* ==========================================
            TAB: REPORTS & EXPORTS
            ========================================== */}
        {activeTab === "reports" && reportsSummary && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-3 gap-6">
              {/* CSV Export Panel */}
              <div className={`border rounded-3xl p-6 shadow-xl flex flex-col justify-between ${
                themeMode === "dark" ? "bg-[#0b0b0f] border-white/5" : "bg-white border-slate-200"
              }`}>
                <div>
                  <h4 className={`text-lg font-bold mb-1 ${themeMode === "dark" ? "text-white" : "text-slate-900"}`}>Export Database Reports</h4>
                  <p className="text-gray-400 text-xs leading-relaxed mb-6">
                    Download full list of registered student portfolios containing registration number, email, department, approval status, theme choice, and signup date.
                  </p>
                </div>
                <button
                  onClick={handleExportCSV}
                  className={`w-full py-3.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg ${
                    themeMode === "dark" ? "bg-white text-black hover:bg-gray-150" : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  <Download size={14} /> Download Student Portfolios (.CSV)
                </button>
              </div>

              {/* Ecosystem growth status */}
              <div className={`border rounded-3xl p-6 shadow-xl space-y-4 ${
                themeMode === "dark" ? "bg-[#0b0b0f] border-white/5" : "bg-white border-slate-200"
              }`}>
                <h4 className="text-sm font-bold uppercase tracking-wider font-mono text-[#818cf8]">Ecosystem Speed</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="text-emerald-400 shrink-0" size={20} />
                    <div>
                      <span className={`text-xl font-black block ${themeMode === "dark" ? "text-white" : "text-slate-900"}`}>+{reportsSummary.registeredLast30}</span>
                      <span className="text-[10px] text-gray-400 block font-semibold uppercase tracking-wider">New signups (30 Days)</span>
                    </div>
                  </div>
                  <div className={`border-t pt-4 ${themeMode === "dark" ? "border-white/5" : "border-slate-200"}`}>
                    <span className="text-xs text-gray-400 font-semibold">Total User Base: <strong className={themeMode === "dark" ? "text-white" : "text-slate-800"}>{reportsSummary.totalUsers}</strong> Accounts</span>
                  </div>
                </div>
              </div>

              {/* Productivity highlights */}
              <div className={`border rounded-3xl p-6 shadow-xl space-y-4 ${
                themeMode === "dark" ? "bg-[#0b0b0f] border-white/5" : "bg-white border-slate-200"
              }`}>
                <h4 className="text-sm font-bold uppercase tracking-wider font-mono text-[#818cf8]">Ecosystem Output</h4>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className={`border rounded-xl py-3.5 ${
                    themeMode === "dark" ? "bg-white/[0.01] border-white/5" : "bg-slate-50 border-slate-100"
                  }`}>
                    <span className={`text-lg font-black block ${themeMode === "dark" ? "text-white" : "text-slate-900"}`}>{reportsSummary.totalProjects}</span>
                    <span className="text-[9px] uppercase font-semibold text-gray-500">Total Projects</span>
                  </div>
                  <div className={`border rounded-xl py-3.5 ${
                    themeMode === "dark" ? "bg-white/[0.01] border-white/5" : "bg-slate-50 border-slate-100"
                  }`}>
                    <span className={`text-lg font-black block ${themeMode === "dark" ? "text-white" : "text-slate-900"}`}>{reportsSummary.totalPapers}</span>
                    <span className="text-[9px] uppercase font-semibold text-gray-500">Research Papers</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Popular Skills list */}
            <div className={`border rounded-3xl p-6 shadow-xl space-y-6 ${
              themeMode === "dark" ? "bg-[#0b0b0f] border-white/5" : "bg-white border-slate-200"
            }`}>
              <div>
                <h3 className={`text-lg font-bold ${themeMode === "dark" ? "text-white" : "text-slate-900"}`}>In-demand Skill Taxonomy</h3>
                <p className="text-gray-400 text-xs mt-1">Analytics on most popular core skills added by Madras Christian College students.</p>
              </div>

              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                {reportsSummary.popularSkills.map((s: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-4 border rounded-2xl transition duration-200 ${
                      themeMode === "dark" ? "bg-white/5 border-white/5 hover:border-[#781c1c]/25" : "bg-slate-50 border-slate-250 hover:bg-slate-100 hover:shadow-sm"
                    }`}
                  >
                    <span className={`text-xs font-bold block mb-1.5 ${themeMode === "dark" ? "text-white" : "text-slate-800"}`}>{s.skill}</span>
                    <div className="flex justify-between items-center text-[10px] text-gray-400 font-semibold">
                      <span>Shared by</span>
                      <span className="text-[#781c1c] font-mono font-bold">{s.count} student(s)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB: NOTIFICATION CENTER
            ========================================== */}
        {activeTab === "notifications" && (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left: Dispatch Announcement Form */}
            <div className={`lg:col-span-2 border rounded-3xl p-6 shadow-xl space-y-6 transition-colors duration-300 ${
              themeMode === "dark" ? "bg-[#0b0b0f] border-white/5" : "bg-white border-slate-200"
            }`}>
              <div>
                <h3 className={`text-lg font-bold ${themeMode === "dark" ? "text-white" : "text-slate-900"}`}>Create Announcement / Alert</h3>
                <p className="text-gray-400 text-xs mt-1">Publish a global broadcast message or send an alert directly to a specific student.</p>
              </div>

              <form onSubmit={handleSendNotification} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-gray-400 block mb-2">Recipient Target</label>
                    <select
                      value={notifForm.recipientType}
                      onChange={(e) => setNotifForm({ ...notifForm, recipientType: e.target.value })}
                      className={`w-full border rounded-xl px-4 py-3 text-xs outline-none focus:border-[#781c1c] transition ${
                        themeMode === "dark" ? "bg-[#121217] border-white/5 text-white" : "bg-white border-slate-200 text-slate-900"
                      }`}
                    >
                      <option value="Broadcast">All Students (Global Broadcast)</option>
                      <option value="Department">Filter by Department</option>
                      <option value="Individual">Specific Student</option>
                    </select>
                  </div>

                  {notifForm.recipientType === "Broadcast" && (
                    <div>
                      <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-gray-400 block mb-2">Alert Severity</label>
                      <select
                        value={notifForm.type}
                        onChange={(e) => setNotifForm({ ...notifForm, type: e.target.value })}
                        className={`w-full border rounded-xl px-4 py-3 text-xs outline-none focus:border-[#781c1c] transition ${
                          themeMode === "dark" ? "bg-[#121217] border-white/5 text-white" : "bg-white border-slate-200 text-slate-900"
                        }`}
                      >
                        <option value="Broadcast">Broadcast Announcement</option>
                        <option value="Info">Information Message</option>
                        <option value="Warning">Warning Alert</option>
                        <option value="Alert">Urgent Notice</option>
                      </select>
                    </div>
                  )}

                  {notifForm.recipientType === "Department" && (
                    <div>
                      <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-gray-400 block mb-2">Target Department</label>
                      <select
                        value={notifForm.department}
                        onChange={(e) => setNotifForm({ ...notifForm, department: e.target.value })}
                        className={`w-full border rounded-xl px-4 py-3 text-xs outline-none focus:border-[#781c1c] transition ${
                          themeMode === "dark" ? "bg-[#121217] border-white/5 text-white" : "bg-white border-slate-200 text-slate-900"
                        }`}
                      >
                        <option value="">-- Choose Department --</option>
                        {institution?.departments
                          ?.split(";")
                          .filter((d: string) => d.trim().length > 0)
                          .map((dept: string, idx: number) => (
                            <option key={idx} value={dept}>
                              {dept}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  {notifForm.recipientType === "Individual" && (
                    <div className="grid grid-cols-2 gap-2 col-span-2 sm:col-span-1">
                      <div>
                        <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-gray-400 block mb-2">Target Student</label>
                        <select
                          value={notifForm.userId}
                          onChange={(e) => setNotifForm({ ...notifForm, userId: Number(e.target.value) })}
                          className={`w-full border rounded-xl px-4 py-3 text-xs outline-none focus:border-[#781c1c] transition ${
                            themeMode === "dark" ? "bg-[#121217] border-white/5 text-white" : "bg-white border-slate-200 text-slate-900"
                          }`}
                        >
                          <option value={0}>-- Select Student --</option>
                          {students
                            .filter(s => s.role !== "Admin")
                            .map(s => (
                              <option key={s.id} value={s.id}>
                                {s.fullName} ({s.registerNumber || s.email})
                              </option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-gray-400 block mb-2">Severity</label>
                        <select
                          value={notifForm.type}
                          onChange={(e) => setNotifForm({ ...notifForm, type: e.target.value })}
                          className={`w-full border rounded-xl px-4 py-3 text-xs outline-none focus:border-[#781c1c] transition ${
                            themeMode === "dark" ? "bg-[#121217] border-white/5 text-white" : "bg-white border-slate-200 text-slate-900"
                          }`}
                        >
                          <option value="Info">Info</option>
                          <option value="Warning">Warning</option>
                          <option value="Alert">Urgent</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-gray-400 block mb-2">Notification Title</label>
                  <input
                    type="text"
                    placeholder="E.g., Submission Deadline Extended"
                    value={notifForm.title}
                    onChange={(e) => setNotifForm({ ...notifForm, title: e.target.value })}
                    className={`w-full border rounded-xl px-4 py-3 text-xs outline-none focus:border-[#781c1c] transition ${
                      themeMode === "dark" ? "bg-[#121217] border-white/5 text-white" : "bg-white border-slate-200 text-slate-900"
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-gray-400 block mb-2">Message Body</label>
                  <textarea
                    rows={4}
                    placeholder="Enter announcement description..."
                    value={notifForm.message}
                    onChange={(e) => setNotifForm({ ...notifForm, message: e.target.value })}
                    className={`w-full border rounded-xl px-4 py-3 text-xs outline-none focus:border-[#781c1c] transition resize-none ${
                      themeMode === "dark" ? "bg-[#121217] border-white/5 text-white" : "bg-white border-slate-200 text-slate-900"
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-[#781c1c] hover:bg-[#5f1515] text-white text-xs font-bold transition"
                >
                  Send Announcement
                </button>
              </form>
            </div>

            {/* Right: Sent Logs */}
            <div className={`border rounded-3xl p-6 shadow-xl space-y-6 transition-colors duration-300 ${
              themeMode === "dark" ? "bg-[#0b0b0f] border-white/5" : "bg-white border-slate-200"
            }`}>
              <div>
                <h3 className={`text-lg font-bold ${themeMode === "dark" ? "text-white" : "text-slate-900"}`}>Broadcast History</h3>
                <p className="text-gray-400 text-xs mt-1">Review recently dispatched system logs and alerts.</p>
              </div>

              <div className="space-y-3.5 max-h-[450px] overflow-y-auto pr-1">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 border rounded-2xl flex flex-col justify-between hover:bg-white/[0.08] transition relative group ${
                        themeMode === "dark" ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold uppercase text-[#818cf8]">{notif.type}</span>
                        <button
                          onClick={() => handleDeleteNotification(notif.id)}
                          className="text-rose-400 hover:bg-rose-500/10 p-1 rounded transition opacity-0 group-hover:opacity-100"
                          title="Delete message"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <h5 className={`text-xs font-bold leading-tight mb-1 ${themeMode === "dark" ? "text-white" : "text-slate-800"}`}>{notif.title}</h5>
                      <p className="text-gray-400 text-[11px] leading-relaxed mb-3">{notif.message}</p>
                      
                      <div className={`border-t pt-2.5 flex justify-between text-[9px] text-gray-500 font-semibold ${
                        themeMode === "dark" ? "border-white/5" : "border-slate-200"
                      }`}>
                        <span>Target: {notif.targetUser}</span>
                        <span>{new Date(notif.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-gray-600 text-xs">
                    No announcements dispatched yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB: SECURITY AUDIT LOGS
            ========================================== */}
        {activeTab === "audit-logs" && (
          <div className={`border rounded-3xl p-6 shadow-xl space-y-6 transition-colors duration-300 ${
            themeMode === "dark" ? "bg-[#0b0b0f] border-white/5" : "bg-white border-slate-200"
          }`}>
            <div>
              <h3 className={`text-lg font-bold ${themeMode === "dark" ? "text-white" : "text-slate-900"}`}>Security Audit Logs</h3>
              <p className="text-gray-400 text-xs mt-1">Real-time log of administrative and security events on the platform.</p>
            </div>

            <div className={`overflow-x-auto border rounded-2xl ${
              themeMode === "dark" ? "border-white/5" : "border-slate-200"
            }`}>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`border-b text-gray-400 font-bold uppercase tracking-wider ${
                    themeMode === "dark" ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-200 text-slate-500"
                  }`}>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Action</th>
                    <th className="p-4">Actor</th>
                    <th className="p-4">IP Address</th>
                    <th className="p-4">Details</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${
                  themeMode === "dark" ? "divide-white/5" : "divide-slate-200"
                }`}>
                  {auditLogs.length > 0 ? (
                    auditLogs.map((log) => (
                      <tr key={log.id} className={themeMode === "dark" ? "hover:bg-white/[0.02] transition" : "hover:bg-slate-50 transition"}>
                        <td className="p-4 font-mono text-[#818cf8]">
                          {new Date(log.timestamp).toLocaleString("en-IN")}
                        </td>
                        <td className={`p-4 font-bold ${themeMode === "dark" ? "text-white" : "text-slate-900"}`}>
                          {log.action}
                        </td>
                        <td className="p-4 text-gray-400">
                          {log.performedByEmail}
                        </td>
                        <td className="p-4 font-mono text-gray-500">
                          {log.ipAddress || "Local"}
                        </td>
                        <td className="p-4 text-gray-405 max-w-xs truncate" title={log.details}>
                          {log.details}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-gray-500">
                        No security audit logs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB: SYSTEM BACKUP & RESTORE
            ========================================== */}
        {activeTab === "backup-restore" && (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Backup card */}
            <div className={`border rounded-3xl p-8 shadow-xl space-y-6 flex flex-col justify-between transition-colors duration-300 ${
              themeMode === "dark" ? "bg-[#0b0b0f] border-white/5" : "bg-white border-slate-200"
            }`}>
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#781c1c]/10 border border-[#781c1c]/20 flex items-center justify-center">
                  <Download size={22} className="text-[#781c1c]" />
                </div>
                <h3 className={`text-xl font-bold ${themeMode === "dark" ? "text-white" : "text-slate-900"}`}>Download Database Backup</h3>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Generate and download a complete JSON payload backup of the Madras Christian College portfolio database. This backup compiles all user registrations, profile settings, student projects, certifications, research papers, resumes, and notifications.
                </p>
              </div>
              <button
                onClick={handleDownloadBackup}
                disabled={backingUp}
                className="w-full py-3.5 rounded-xl text-xs font-bold bg-[#8b5cf6] hover:bg-[#7c3aed] text-white shadow-lg transition duration-200"
              >
                {backingUp ? "Generating Backup JSON..." : "Download Full JSON Backup"}
              </button>
            </div>

            {/* Restore card */}
            <div className={`border rounded-3xl p-8 shadow-xl space-y-6 flex flex-col justify-between transition-colors duration-300 ${
              themeMode === "dark" ? "bg-[#0b0b0f] border-white/5" : "bg-white border-slate-200"
            }`}>
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                  <Shield size={22} className="text-rose-400" />
                </div>
                <h3 className={`text-xl font-bold ${themeMode === "dark" ? "text-white" : "text-slate-900"}`}>Restore Database from Backup</h3>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Restore database tables from a previously downloaded backup JSON file. 
                  <strong className="text-rose-400 block mt-2">
                    ⚠ WARNING: This action will permanently drop and overwrite all current database tables. Make sure to download a current backup first.
                  </strong>
                </p>
              </div>
              
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreBackup}
                  disabled={restoringBackup}
                  id="restore-file-upload"
                  className="hidden"
                />
                <label
                  htmlFor="restore-file-upload"
                  className={`w-full py-3.5 rounded-xl text-xs font-bold text-center block cursor-pointer transition shadow-lg ${
                    restoringBackup 
                      ? "bg-rose-500/20 text-rose-300 cursor-not-allowed" 
                      : "bg-rose-600 hover:bg-rose-700 text-white"
                  }`}
                >
                  {restoringBackup ? "Restoring Database..." : "Select Backup JSON & Restore"}
                </label>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ==========================================
          MODAL: CREATE STUDENT
          ========================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d0d12]/75 backdrop-blur-sm">
          <div className={`border rounded-3xl p-8 w-full max-w-lg shadow-2xl relative ${
            themeMode === "dark" ? "bg-[#0b0b0f] border-white/10" : "bg-white border-slate-200"
          }`}>
            <h3 className={`text-xl font-bold mb-2 ${themeMode === "dark" ? "text-white" : "text-slate-900"}`}>Add New Student Account</h3>
            <p className="text-gray-400 text-xs mb-6">Create a student registration to the Madras Christian College directory.</p>

            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-gray-400 block mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={studentForm.fullName}
                    onChange={(e) => setStudentForm({ ...studentForm, fullName: e.target.value })}
                    className={`w-full border rounded-xl px-4 py-3 text-xs outline-none focus:border-[#781c1c] ${
                      themeMode === "dark" ? "bg-[#121217] border-white/5 text-white" : "bg-white border-slate-200 text-slate-900"
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-gray-400 block mb-1.5">Register Number</label>
                  <input
                    type="text"
                    required
                    value={studentForm.registerNumber}
                    onChange={(e) => setStudentForm({ ...studentForm, registerNumber: e.target.value })}
                    className={`w-full border rounded-xl px-4 py-3 text-xs outline-none focus:border-[#781c1c] ${
                      themeMode === "dark" ? "bg-[#121217] border-white/5 text-white" : "bg-white border-slate-200 text-slate-900"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-gray-400 block mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={studentForm.email}
                  onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                  className={`w-full border rounded-xl px-4 py-3 text-xs outline-none focus:border-[#781c1c] ${
                    themeMode === "dark" ? "bg-[#121217] border-white/5 text-white" : "bg-white border-slate-200 text-slate-900"
                  }`}
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-gray-400 block mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  value={studentForm.password}
                  onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                  className={`w-full border rounded-xl px-4 py-3 text-xs outline-none focus:border-[#781c1c] ${
                    themeMode === "dark" ? "bg-[#121217] border-white/5 text-white" : "bg-white border-slate-200 text-slate-900"
                  }`}
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-gray-400 block mb-1.5">Department / Stream</label>
                <select
                  value={studentForm.department}
                  onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value })}
                  className={`w-full border rounded-xl px-4 py-3 text-xs outline-none focus:border-[#781c1c] ${
                    themeMode === "dark" ? "bg-[#121217] border-white/5 text-white" : "bg-white border-slate-200 text-slate-900"
                  }`}
                >
                  {institution?.departments
                    ?.split(";")
                    .filter((d: string) => d.trim().length > 0)
                    .map((dept: string, idx: number) => (
                      <option key={idx} value={dept}>{dept}</option>
                    ))}
                </select>
              </div>

              <div className={`flex justify-end gap-3 border-t pt-6 mt-6 ${
                themeMode === "dark" ? "border-white/5" : "border-slate-200"
              }`}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition ${
                    themeMode === "dark" ? "border-white/10 text-white hover:bg-white/5" : "border-slate-200 text-slate-700 hover:bg-slate-150"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#781c1c] hover:bg-[#5f1515] text-white text-xs font-bold transition shadow-lg shadow-[#781c1c]/10"
                >
                  Create Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: EDIT STUDENT
          ========================================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d0d12]/75 backdrop-blur-sm">
          <div className={`border rounded-3xl p-8 w-full max-w-lg shadow-2xl relative ${
            themeMode === "dark" ? "bg-[#0b0b0f] border-white/10" : "bg-white border-slate-200"
          }`}>
            <h3 className={`text-xl font-bold mb-2 ${themeMode === "dark" ? "text-white" : "text-slate-900"}`}>Edit Student Details</h3>
            <p className="text-gray-400 text-xs mb-6">Modify records for student inside the platform.</p>

            <form onSubmit={handleEditStudent} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-gray-400 block mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={studentForm.fullName}
                    onChange={(e) => setStudentForm({ ...studentForm, fullName: e.target.value })}
                    className={`w-full border rounded-xl px-4 py-3 text-xs outline-none focus:border-[#781c1c] ${
                      themeMode === "dark" ? "bg-[#121217] border-white/5 text-white" : "bg-white border-slate-200 text-slate-900"
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-gray-400 block mb-1.5">Register Number</label>
                  <input
                    type="text"
                    required
                    value={studentForm.registerNumber}
                    onChange={(e) => setStudentForm({ ...studentForm, registerNumber: e.target.value })}
                    className={`w-full border rounded-xl px-4 py-3 text-xs outline-none focus:border-[#781c1c] ${
                      themeMode === "dark" ? "bg-[#121217] border-white/5 text-white" : "bg-white border-slate-200 text-slate-900"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-gray-400 block mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={studentForm.email}
                  onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                  className={`w-full border rounded-xl px-4 py-3 text-xs outline-none focus:border-[#781c1c] ${
                    themeMode === "dark" ? "bg-[#121217] border-white/5 text-white" : "bg-white border-slate-200 text-slate-900"
                  }`}
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-gray-400 block mb-1.5">Department / Stream</label>
                <select
                  value={studentForm.department}
                  onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value })}
                  className={`w-full border rounded-xl px-4 py-3 text-xs outline-none focus:border-[#781c1c] ${
                    themeMode === "dark" ? "bg-[#121217] border-white/5 text-white" : "bg-white border-slate-200 text-slate-900"
                  }`}
                >
                  {institution?.departments
                    ?.split(";")
                    .filter((d: string) => d.trim().length > 0)
                    .map((dept: string, idx: number) => (
                      <option key={idx} value={dept}>{dept}</option>
                    ))}
                </select>
              </div>

              <div className={`flex justify-end gap-3 border-t pt-6 mt-6 ${
                themeMode === "dark" ? "border-white/5" : "border-slate-200"
              }`}>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition ${
                    themeMode === "dark" ? "border-white/10 text-white hover:bg-white/5" : "border-slate-200 text-slate-700 hover:bg-slate-150"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#781c1c] hover:bg-[#5f1515] text-white text-xs font-bold transition shadow-lg shadow-[#781c1c]/10"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: MANAGE STUDENT
          ========================================== */}
      {isManageModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-[#0d0d12]/80 backdrop-blur-sm overflow-y-auto py-8 px-4">
          <div className={`border rounded-3xl p-0 w-full max-w-2xl shadow-2xl relative overflow-hidden ${
            themeMode === "dark" ? "bg-[#0b0b0f] border-white/10" : "bg-white border-slate-200"
          }`}>
            {/* Modal Header */}
            <div className="bg-gradient-to-br from-[#781c1c] to-[#18233c] p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300">Student Management</span>
                  <h3 className="text-xl font-bold mt-1">{selectedStudent.fullName}</h3>
                  <p className="text-xs text-white/70 mt-0.5">
                    {selectedStudent.registerNumber} · {selectedStudent.department} · {selectedStudent.stream}
                  </p>
                </div>
                <button
                  onClick={() => setIsManageModalOpen(false)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Status badges row */}
              <div className="flex gap-2 mt-4 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold ${
                  selectedStudent.isApproved ? "bg-emerald-400/20 text-emerald-300" : "bg-amber-400/20 text-amber-300"
                }`}>
                  {selectedStudent.isApproved ? "✓ Portfolio Approved" : "⏳ Pending Approval"}
                </span>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold ${
                  selectedStudent.isActive !== false ? "bg-blue-400/20 text-blue-300" : "bg-rose-400/20 text-rose-300"
                }`}>
                  {selectedStudent.isActive !== false ? "✓ Account Active" : "✗ Account Disabled"}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-white/10 text-white/80">
                  ✉️ {selectedStudent.email}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-6">

              {/* ── ACCOUNT CONTROLS ── */}
              <div className={`border rounded-2xl p-5 space-y-4 ${themeMode === "dark" ? "border-white/5 bg-white/[0.02]" : "border-slate-200 bg-slate-50"}`}>
                <h4 className={`text-xs uppercase font-mono font-bold tracking-widest ${themeMode === "dark" ? "text-gray-400" : "text-slate-500"}`}>Account Controls</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => toggleApproval(selectedStudent.id, selectedStudent.isApproved)}
                    disabled={manageLoading}
                    className={`py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                      selectedStudent.isApproved
                        ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"
                        : "bg-emerald-500 hover:bg-emerald-600 text-black"
                    }`}
                  >
                    <CheckCircle size={13} />
                    {selectedStudent.isApproved ? "Revoke Portfolio" : "Approve Portfolio"}
                  </button>
                  <button
                    onClick={() => handleToggleActive(selectedStudent.id, selectedStudent.isActive !== false)}
                    disabled={manageLoading}
                    className={`py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                      selectedStudent.isActive !== false
                        ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20"
                        : "bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20"
                    }`}
                  >
                    <Shield size={13} />
                    {selectedStudent.isActive !== false ? "Deactivate Account" : "Activate Account"}
                  </button>
                </div>
              </div>

              {/* ── RESET PASSWORD ── */}
              <div className={`border rounded-2xl p-5 space-y-3 ${themeMode === "dark" ? "border-white/5 bg-white/[0.02]" : "border-slate-200 bg-slate-50"}`}>
                <h4 className={`text-xs uppercase font-mono font-bold tracking-widest ${themeMode === "dark" ? "text-gray-400" : "text-slate-500"}`}>Reset Password</h4>
                <div className="flex gap-3">
                  <input
                    type="password"
                    placeholder="Enter new password (min 6 chars)"
                    value={resetPasswordValue}
                    onChange={(e) => setResetPasswordValue(e.target.value)}
                    className={`flex-1 border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#781c1c] ${
                      themeMode === "dark" ? "bg-[#121217] border-white/5 text-white placeholder-gray-600" : "bg-white border-slate-200 text-slate-900 placeholder-slate-400"
                    }`}
                  />
                  <button
                    onClick={() => handleAdminResetPassword(selectedStudent.id)}
                    disabled={manageLoading || !resetPasswordValue}
                    className="px-4 py-2.5 rounded-xl bg-[#781c1c] hover:bg-[#5f1515] text-white text-xs font-bold transition disabled:opacity-40"
                  >
                    Reset
                  </button>
                </div>
                <p className={`text-[10px] ${themeMode === "dark" ? "text-gray-600" : "text-slate-400"}`}>
                  The new password will be set immediately. Student will need to use the new password on next login.
                </p>
              </div>

              {/* ── ACTIVITY TIMELINE ── */}
              <div className={`border rounded-2xl p-5 space-y-3 ${themeMode === "dark" ? "border-white/5 bg-white/[0.02]" : "border-slate-200 bg-slate-50"}`}>
                <h4 className={`text-xs uppercase font-mono font-bold tracking-widest ${themeMode === "dark" ? "text-gray-400" : "text-slate-500"}`}>
                  Activity Timeline
                </h4>
                {(() => {
                  const studentLogs = auditLogs.filter(
                    (log) => log.performedByEmail === selectedStudent.email
                  ).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                  
                  if (studentLogs.length === 0) {
                    return (
                      <p className="text-xs text-gray-500 text-center py-4">No activity recorded yet for this student.</p>
                    );
                  }
                  
                  return (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                      {studentLogs.map((log: any, i: number) => (
                        <div key={log.id || i} className={`flex gap-3 items-start text-xs pb-2 border-b last:border-b-0 ${themeMode === "dark" ? "border-white/5" : "border-slate-100"}`}>
                          <div className="w-1.5 h-1.5 rounded-full bg-[#781c1c] mt-1.5 shrink-0" />
                          <div className="min-w-0">
                            <span className={`font-bold block truncate ${themeMode === "dark" ? "text-white" : "text-slate-900"}`}>
                              {log.action}
                            </span>
                            <span className="text-gray-500 text-[10px] block">
                              {new Date(log.timestamp).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                              {log.ipAddress && log.ipAddress !== "127.0.0.1" ? ` · ${log.ipAddress}` : ""}
                            </span>
                            {log.details && (
                              <span className="text-gray-500 text-[10px] truncate block">{log.details}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* ── QUICK LINKS ── */}
              <div className="flex gap-3 pt-1">
                <Link
                  href={`/portfolio/${selectedStudent.id}`}
                  target="_blank"
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-center border transition ${
                    themeMode === "dark" ? "border-white/10 text-white hover:bg-white/5" : "border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  View Public Portfolio ↗
                </Link>
                <button
                  onClick={() => { openEditModal(selectedStudent); setIsManageModalOpen(false); }}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[#18233c] hover:bg-[#1f2d4f] text-white text-center transition"
                >
                  Edit Details
                </button>
                <button
                  onClick={() => { handleDeleteStudent(selectedStudent.id, selectedStudent.fullName); setIsManageModalOpen(false); }}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-center transition"
                >
                  Delete Account
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
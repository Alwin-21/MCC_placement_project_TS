"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  LogOut,
  Clock,
  CheckCircle,
  AlertTriangle,
  Globe,
  MapPin,
  Briefcase,
  FileText,
  User,
  Phone,
  Sun,
  Moon,
  Info,
  ExternalLink,
  Edit,
  Plus,
  Trash2,
  Search,
  Users,
  Award,
  Video,
  Image as ImageIcon,
  MessageSquare,
  HelpCircle,
  ChevronRight,
  TrendingUp,
  Sliders,
  FolderPlus,
  Bookmark,
  Share2,
  Sparkles,
  X,
  Menu,
  BarChart3
} from "lucide-react";
import api from "@/services/api";
import { useTheme } from "@/hooks/useTheme";

const LinkedinIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

type TabType = "overview" | "profile" | "jobs" | "applications" | "talent-pools" | "talent-search" | "analytics";

export default function CompanyDashboardPage() {
  const router = useRouter();
  const [themeMode, toggleThemeMode] = useTheme();
  const isDark = themeMode === "dark";

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [loading, setLoading] = useState(true);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);

  // Stats Metrics State
  const [stats, setStats] = useState<any>({
    activeJobs: 0,
    pendingJobs: 0,
    approvedJobs: 0,
    rejectedJobs: 0,
    applicationsReceived: 0,
    studentsShortlisted: 0,
    interviewsScheduled: 0,
    offersReleased: 0,
    savedTalentPools: 0,
    resumeDownloads: 0,
    notifications: [],
    recentActivities: [],
  });

  // Jobs State
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [editingJobId, setEditingJobId] = useState<number | null>(null);
  const [jobForm, setJobForm] = useState<any>({
    title: "",
    department: "",
    description: "",
    responsibilities: "",
    requirements: "",
    requiredSkills: "",
    preferredSkills: "",
    jobType: "FullTime",
    workMode: "OnSite",
    eligibilityDepartments: "",
    eligibilityYears: "",
    eligibilityMinCGPA: "0.0",
    eligibilityExperience: "",
    vacancies: "1",
    salary: "",
    lpa: "0.0",
    benefits: "",
    selectionProcess: "",
    deadlines: "",
    attachments: "",
  });

  // Applications State
  const [applications, setApplications] = useState<any[]>([]);
  const [appSearch, setAppSearch] = useState("");
  const [appStatusFilter, setAppStatusFilter] = useState("all");

  // Talent Pool State
  const [pools, setPools] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentDeptFilter, setStudentDeptFilter] = useState("all");
  const [poolModalOpen, setPoolModalOpen] = useState(false);
  const [poolForm, setPoolForm] = useState({ name: "", studentIds: [] as number[] });

  // Recruitment Lifecycle scheduler and offer states
  const [availableAssessments, setAvailableAssessments] = useState<any[]>([]);
  const [activeSchedulerAppId, setActiveSchedulerAppId] = useState<number | null>(null);
  const [schedulerForm, setSchedulerForm] = useState({
    type: "Online",
    scheduleTime: "",
    meetLink: "",
    venue: "",
    feedback: ""
  });
  const [activeOfferAppId, setActiveOfferAppId] = useState<number | null>(null);
  const [offerFormUrl, setOfferFormUrl] = useState("");

  // Analytics states
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Edit Profile form state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<any>({});
  const [saveProfileLoading, setSaveProfileLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      // 1. Fetch Profile
      const profRes = await api.get("/Company/profile");
      setProfile(profRes.data.hrUser);
      setCompany(profRes.data.company);

      // Initialize Profile Form
      const prof = profRes.data.company.profile || {};
      const headLoc = profRes.data.company.locations.find((l: any) => l.isHeadOffice)?.location || "";
      const branches = profRes.data.company.locations.filter((l: any) => !l.isHeadOffice).map((l: any) => l.location);

      setProfileForm({
        name: profRes.data.company.name,
        logoUrl: prof.logoUrl || "",
        coverImageUrl: prof.coverImageUrl || "",
        website: prof.website || "",
        linkedInUrl: prof.linkedInUrl || "",
        industry: prof.industry || "",
        companyType: prof.companyType || "",
        companySize: prof.companySize || "",
        foundedYear: prof.foundedYear || "",
        description: prof.description || "",
        mission: prof.mission || "",
        vision: prof.vision || "",
        workCulture: prof.workCulture || "",
        benefits: prof.benefits || "",
        awards: prof.awards || "",
        achievements: prof.achievements || "",
        recruitmentProcess: prof.recruitmentProcess || "",
        internshipAvailable: !!prof.internshipAvailable,
        placementAvailable: !!prof.placementAvailable,
        headOffice: headLoc,
        branchLocations: branches,
        workMode: profRes.data.company.locations?.[0]?.workMode || "OnSite",
        gallery: prof.gallery || "",
        videos: prof.videos || "",
        placementHistory: prof.placementHistory || "",
        internshipPrograms: prof.internshipPrograms || "",
        faqs: prof.faqs || "",
        contactDetails: prof.contactDetails || "",
        socialLinks: prof.socialLinks || "",
      });

      // 2. Fetch Stats
      const statsRes = await api.get("/Company/dashboard-stats");
      setStats(statsRes.data);

      // 3. Fetch Jobs
      const jobsRes = await api.get("/Company/jobs");
      setJobs(jobsRes.data);

      // 4. Fetch Applications
      const appsRes = await api.get("/Company/applications");
      setApplications(appsRes.data);

      // 5. Fetch Pools
      const poolsRes = await api.get("/Company/talent-pools");
      setPools(poolsRes.data);

      // 6. Fetch Students
      const studsRes = await api.get("/Company/students");
      setStudents(studsRes.data);

      try {
        const assRes = await api.get("/Company/assessments");
        setAvailableAssessments(assRes.data);
      } catch (e) { }

      try {
        const analyRes = await api.get("/Company/analytics");
        setAnalyticsData(analyRes.data);
      } catch (e) { }
    } catch (err: any) {
      console.error(err);
      setError("Failed to load company workspace. Verify your connection or credentials.");
      if (err.response?.status === 401) {
        router.push("/company/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/company/login");
      return;
    }
    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/company/login");
  };

  const handleScheduleInterviewSubmit = async (appId: number) => {
    try {
      if (!schedulerForm.scheduleTime) {
        alert("Please select a date and time for the interview.");
        return;
      }
      await api.post("/Company/interviews", {
        applicationId: appId,
        ...schedulerForm
      });
      alert("Interview scheduled successfully.");
      setActiveSchedulerAppId(null);
      setSchedulerForm({ type: "Online", scheduleTime: "", meetLink: "", venue: "", feedback: "" });
      await fetchData();
    } catch (err) {
      alert("Failed to schedule interview.");
    }
  };

  const handleReleaseOfferSubmit = async (appId: number) => {
    try {
      if (!offerFormUrl.trim()) {
        alert("Please provide an offer letter document URL.");
        return;
      }
      await api.post(`/Company/applications/${appId}/release-offer`, {
        offerLetterUrl: offerFormUrl
      });
      alert("Offer letter released to candidate successfully.");
      setActiveOfferAppId(null);
      setOfferFormUrl("");
      await fetchData();
    } catch (err) {
      alert("Failed to release offer letter.");
    }
  };

  const handleExport = async (format: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/Company/reports/export-details?format=${format}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error("Failed to export report");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `candidate_pipeline_${new Date().toISOString().split("T")[0]}.${format === "excel" ? "xls" : "csv"}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert("Failed to export report.");
    }
  };

  // Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaveProfileLoading(true);
      await api.put("/Company/profile", profileForm);
      setIsEditingProfile(false);
      await fetchData();
    } catch (err: any) {
      alert("Failed to save company profile changes.");
    } finally {
      setSaveProfileLoading(false);
    }
  };

  // Job CRUD handlers
  const handleOpenJobModal = (job: any = null) => {
    if (job) {
      setEditingJobId(job.id || job.Id);
      setJobForm({
        title: job.title || job.Title || "",
        department: job.department || job.Department || "",
        description: job.description || job.Description || "",
        responsibilities: job.responsibilities || job.Responsibilities || "",
        requirements: job.requirements || job.Requirements || "",
        requiredSkills: job.requiredSkills || job.RequiredSkills || "",
        preferredSkills: job.preferredSkills || job.PreferredSkills || "",
        jobType: job.jobType || job.JobType || "FullTime",
        workMode: job.workMode || job.WorkMode || "OnSite",
        eligibilityDepartments: job.eligibilityDepartments || job.EligibilityDepartments || "",
        eligibilityYears: job.eligibilityYears || job.EligibilityYears || "",
        eligibilityMinCGPA: String(job.eligibilityMinCGPA ?? job.EligibilityMinCGPA ?? "0.0"),
        eligibilityExperience: job.eligibilityExperience || job.EligibilityExperience || "",
        vacancies: String(job.vacancies ?? job.Vacancies ?? "1"),
        salary: job.salary || job.Salary || "",
        lpa: String(job.lpa ?? job.LPA ?? "0.0"),
        benefits: job.benefits || job.Benefits || "",
        selectionProcess: job.selectionProcess || job.SelectionProcess || "",
        deadlines: job.deadlines || job.Deadlines ? new Date(job.deadlines || job.Deadlines).toISOString().split("T")[0] : "",
        attachments: job.attachments || job.Attachments || "",
        assessmentId: String(job.assessmentId || job.AssessmentId || ""),
      });
    } else {
      setEditingJobId(null);
      setJobForm({
        title: "",
        department: "",
        description: "",
        responsibilities: "",
        requirements: "",
        requiredSkills: "",
        preferredSkills: "",
        jobType: "FullTime",
        workMode: "OnSite",
        eligibilityDepartments: "",
        eligibilityYears: "",
        eligibilityMinCGPA: "0.0",
        eligibilityExperience: "",
        vacancies: "1",
        salary: "",
        lpa: "0.0",
        benefits: "",
        selectionProcess: "",
        deadlines: "",
        attachments: "",
        assessmentId: "",
      });
    }
    setJobModalOpen(true);
  };

  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingJobId) {
        await api.put(`/Company/jobs/${editingJobId}`, jobForm);
      } else {
        await api.post("/Company/jobs", jobForm);
      }
      setJobModalOpen(false);
      await fetchData();
    } catch (err: any) {
      alert("Failed to submit job posting.");
    }
  };

  const handleDeleteJob = async (id: number) => {
    if (!confirm("Are you sure you want to delete this job posting?")) return;
    try {
      await api.delete(`/Company/jobs/${id}`);
      await fetchData();
    } catch (err: any) {
      alert("Failed to delete job posting.");
    }
  };

  // Application Actions
  const handleUpdateAppStatus = async (appId: number, status: string) => {
    try {
      await api.put(`/Company/applications/${appId}`, { status });
      await fetchData();
    } catch (err: any) {
      alert("Failed to update application status.");
    }
  };

  // Talent Pool Actions
  const handleCreatePool = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/Company/talent-pools", poolForm);
      setPoolModalOpen(false);
      setPoolForm({ name: "", studentIds: [] });
      await fetchData();
    } catch (err: any) {
      alert("Failed to create saved talent pool.");
    }
  };

  const handleDeletePool = async (id: number) => {
    if (!confirm("Are you sure you want to delete this saved talent pool?")) return;
    try {
      await api.delete(`/Company/talent-pools/${id}`);
      await fetchData();
    } catch (err: any) {
      alert("Failed to delete talent pool.");
    }
  };

  const toggleStudentInPool = (id: number) => {
    setPoolForm((prev) => {
      const exist = prev.studentIds.includes(id);
      const studentIds = exist
        ? prev.studentIds.filter((sid) => sid !== id)
        : [...prev.studentIds, id];
      return { ...prev, studentIds };
    });
  };

  // ==========================================
  // TALENT SEARCH MATCHING ENGINE STATE
  // ==========================================
  const [searchFilters, setSearchFilters] = useState({
    keywords: "",
    skills: "",
    departments: "",
    domains: "",
    experience: "all",
    certifications: "",
    projects: "",
    languages: "",
    minCgpa: "0.0"
  });
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [savePoolModalOpen, setSavePoolModalOpen] = useState(false);
  const [savePoolName, setSavePoolName] = useState("");

  const [selectedPoolNode, setSelectedPoolNode] = useState<any>(null);
  const [poolCandidates, setPoolCandidates] = useState<any[]>([]);
  const [poolCandidatesLoading, setPoolCandidatesLoading] = useState(false);

  const runTalentMatching = async () => {
    try {
      setSearchLoading(true);
      const params = {
        keywords: searchFilters.keywords,
        skills: searchFilters.skills ? searchFilters.skills.split(";").map(s => s.trim()).filter(Boolean) : [],
        domains: searchFilters.domains ? searchFilters.domains.split(";").map(d => d.trim()).filter(Boolean) : [],
        departments: searchFilters.departments ? searchFilters.departments.split(";").map(d => d.trim()).filter(Boolean) : [],
        experience: searchFilters.experience,
        certifications: searchFilters.certifications ? searchFilters.certifications.split(";").map(c => c.trim()).filter(Boolean) : [],
        projects: searchFilters.projects ? searchFilters.projects.split(";").map(p => p.trim()).filter(Boolean) : [],
        languages: searchFilters.languages ? searchFilters.languages.split(";").map(l => l.trim()).filter(Boolean) : [],
        minCgpa: parseFloat(searchFilters.minCgpa) || 0.0
      };
      const res = await api.post("/Company/talent-search", params);
      setSearchResults(res.data);
    } catch (err) {
      alert("Failed to run talent matching engine.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSaveDynamicPool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!savePoolName.trim()) return;
    try {
      const criteria = {
        keywords: searchFilters.keywords,
        skills: searchFilters.skills ? searchFilters.skills.split(";").map(s => s.trim()).filter(Boolean) : [],
        domains: searchFilters.domains ? searchFilters.domains.split(";").map(d => d.trim()).filter(Boolean) : [],
        departments: searchFilters.departments ? searchFilters.departments.split(";").map(d => d.trim()).filter(Boolean) : [],
        experience: searchFilters.experience,
        certifications: searchFilters.certifications ? searchFilters.certifications.split(";").map(c => c.trim()).filter(Boolean) : [],
        projects: searchFilters.projects ? searchFilters.projects.split(";").map(p => p.trim()).filter(Boolean) : [],
        languages: searchFilters.languages ? searchFilters.languages.split(";").map(l => l.trim()).filter(Boolean) : [],
        minCgpa: parseFloat(searchFilters.minCgpa) || 0.0
      };

      await api.post("/Company/talent-pools", {
        name: savePoolName,
        criteria
      });
      setSavePoolModalOpen(false);
      setSavePoolName("");
      alert("Dynamic talent pool saved successfully.");
      await fetchData();
    } catch (err) {
      alert("Failed to save dynamic talent pool.");
    }
  };

  const handleViewPoolMembers = async (pool: any) => {
    setSelectedPoolNode(pool);
    setPoolCandidates([]);
    if (pool.criteria) {
      try {
        setPoolCandidatesLoading(true);
        const res = await api.post("/Company/talent-search", pool.criteria);
        setPoolCandidates(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setPoolCandidatesLoading(false);
      }
    } else {
      if (pool.studentIds) {
        const ids = pool.studentIds.split(",");
        const matches = students
          .filter(s => ids.includes(String(s.id)))
          .map(s => ({
            id: s.id,
            fullName: s.fullName,
            email: s.email,
            department: s.department,
            bio: s.bio,
            cgpa: s.cgpa,
            graduationYear: s.graduationYear,
            linkedInUrl: s.linkedInUrl,
            gitHubUrl: s.gitHubUrl,
            matchPct: 100,
            matchedSkills: ["Saved Candidate"],
            missingSkills: [],
            projects: [],
            resumes: [],
            certificates: []
          }));
        setPoolCandidates(matches);
      }
    }
  };

  // Log Resume download audit
  const handleDownloadResume = async (studentName: string) => {
    try {
      // Just record download action in audit logs
      await api.post("/Company/profile", {
        // dummy PUT triggering audit
        name: company.Name,
      });
      // Increment stats visually or re-fetch
      await fetchData();
    } catch (e) { }
  };

  // Close modals with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setJobModalOpen(false);
        setPoolModalOpen(false);
        setActiveSchedulerAppId(null);
        setActiveOfferAppId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div
        style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}
        className={`min-h-screen p-6 md:p-10 transition-colors duration-300 ${isDark ? "bg-[#090d16]" : "bg-[#faf9f6]"
          }`}
        aria-busy="true"
        aria-label="Loading company workspace"
      >
        {/* Skeleton Header */}
        <div className="max-w-7xl mx-auto">
          <div className={`h-16 rounded-2xl mb-8 animate-pulse ${isDark ? "bg-white/5" : "bg-slate-200"}`} />
          <div className="flex gap-6">
            {/* Skeleton Sidebar */}
            <div className="hidden lg:flex flex-col gap-2 w-64 shrink-0">
              {[...Array(7)].map((_, i) => (
                <div key={i} className={`h-10 rounded-2xl animate-pulse ${isDark ? "bg-white/5" : "bg-slate-200"}`} style={{ animationDelay: `${i * 60}ms` }} />
              ))}
            </div>
            {/* Skeleton Main Content */}
            <div className="flex-1 space-y-4">
              <div className={`h-20 rounded-3xl animate-pulse ${isDark ? "bg-white/5" : "bg-slate-200"}`} />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className={`h-20 rounded-3xl animate-pulse ${isDark ? "bg-white/5" : "bg-slate-200"}`} style={{ animationDelay: `${i * 50}ms` }} />
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className={`h-48 rounded-3xl animate-pulse ${isDark ? "bg-white/5" : "bg-slate-200"}`} style={{ animationDelay: `${i * 80}ms` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !company) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 ${isDark ? "bg-[#090d16] text-white" : "bg-[#faf9f6]"}`}>
        <div className="text-center space-y-4 max-w-md p-8 glass-card border border-red-200 dark:border-red-900 rounded-3xl bg-white/40 dark:bg-white/[0.02]">
          <AlertTriangle className="text-red-500 mx-auto" size={48} />
          <h1 className="text-xl font-bold">Workspace Access Error</h1>
          <p className="text-xs text-slate-500 leading-relaxed">{error}</p>
          <button
            onClick={() => router.push("/company/login")}
            className="px-6 py-2.5 bg-[#781c1c] text-white rounded-xl text-xs font-bold uppercase transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const isPending = company?.status === "Pending";
  const isVerified = company?.status === "Verified";

  const statusColors: Record<string, string> = {
    Pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    Verified: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    Rejected: "bg-red-500/10 text-red-500 border-red-500/20",
    Suspended: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  };

  const jobStatusBadge: Record<string, string> = {
    Pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    Approved: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    Rejected: "bg-red-500/10 text-red-500 border-red-500/20",
    ChangesRequested: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  };

  const appStatusBadge: Record<string, string> = {
    Applied: "bg-slate-500/10 text-slate-500 border-slate-500/20",
    Reviewed: "bg-red-500/10 text-red-500 border-red-500/20",
    Shortlisted: "bg-sky-500/10 text-sky-500 border-sky-500/20",
    InterviewScheduled: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    Selected: "bg-violet-500/10 text-violet-500 border-violet-500/20",
    "Offer Sent": "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
    "Offer Accepted": "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    Joined: "bg-teal-500/10 text-teal-500 border-teal-500/20",
    Rejected: "bg-red-500/10 text-red-500 border-red-500/20",
  };

  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}
      className={`h-screen h-[100dvh] overflow-hidden flex transition-colors duration-300 ${themeMode === "dark" ? "bg-[#0d0d12] text-white" : "bg-[#fcfaf6] text-[#0f172a]"
        }`}
    >
      {/* DESKTOP SIDEBAR NAVIGATION */}
      <div className="w-72 border-r border-slate-200/50 dark:border-white/5 relative z-20 flex flex-col justify-between shrink-0 h-screen sticky top-0 transition-colors duration-300 hidden md:flex mcc-sidebar bg-white dark:bg-[#090d16]">
        <div className="p-6 border-b border-slate-200 dark:border-white/5 flex items-center justify-center shrink-0">
          <img
            src={themeMode === "dark" ? "/mcc-logo-dark.png" : "/mcc-logo.jpg"}
            className="w-full max-w-[280px] h-auto object-contain rounded-lg transition-transform duration-200 hover:scale-[1.02]"
            alt="Madras Christian College Logo"
          />
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5 overflow-y-auto flex-1 scrollbar-thin">
          {[
            { id: "overview", label: "Dashboard", icon: Sliders },
            { id: "profile", label: "Profile Setup", icon: Building2 },
            { id: "jobs", label: "Job Postings", icon: Briefcase },
            { id: "applications", label: "Candidates", icon: Users },
            { id: "talent-search", label: "Talent Match Engine", icon: Sparkles },
            { id: "talent-pools", label: "Talent Pools", icon: Bookmark },
            { id: "analytics", label: "Analytics & Reports", icon: BarChart3 },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${active
                    ? "mcc-active-tab font-bold"
                    : themeMode === "dark"
                      ? "text-slate-400 hover:text-white hover:bg-white/5"
                      : "text-slate-700 hover:text-[#18233c] hover:bg-slate-100"
                  }`}
              >
                <Icon
                  size={16}
                  className={
                    active
                      ? themeMode === "dark"
                        ? "text-white"
                        : "text-white"
                      : "text-[#781c1c]"
                  }
                />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Recruiter Quick Controls */}
        <div className="p-4 border-t border-slate-200 dark:border-white/5 space-y-3 shrink-0">
          <div className={`px-3 py-2 rounded-xl text-[10px] font-mono font-bold flex items-center gap-2 ${themeMode === "dark"
              ? "bg-emerald-500/10 text-emerald-350 border border-emerald-500/20"
              : "bg-emerald-50 text-emerald-700 border border-emerald-250"
            }`}>
            <CheckCircle size={11} className="text-emerald-400" />
            Verified Recruiter
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <LogOut size={15} /> Log Out
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER SIDEBAR OVERLAY */}
      {showMobileNav && (
        <div className="fixed inset-0 z-[50] flex md:hidden animate-fade-in select-none">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setShowMobileNav(false)}
          />

          <div className="w-72 flex flex-col p-5 animate-slideIn h-screen border-r border-slate-200 dark:border-white/5 mcc-sidebar bg-white dark:bg-[#090d16] justify-between">
            <div className="flex flex-col flex-1 min-h-0">
              <div className="pb-6 border-b border-slate-200 dark:border-white/5 flex items-center justify-between shrink-0">
                <img
                  src={themeMode === "dark" ? "/mcc-logo-dark.png" : "/mcc-logo.jpg"}
                  className="h-10 w-auto object-contain rounded-lg"
                  alt="MCC Logo"
                />
                <button onClick={() => setShowMobileNav(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5">
                  <X size={20} />
                </button>
              </div>

              <nav className="py-4 space-y-1.5 overflow-y-auto flex-1 scrollbar-thin">
                {[
                  { id: "overview", label: "Dashboard", icon: Sliders },
                  { id: "profile", label: "Profile Setup", icon: Building2 },
                  { id: "jobs", label: "Job Postings", icon: Briefcase },
                  { id: "applications", label: "Candidates", icon: Users },
                  { id: "talent-search", label: "Talent Match Engine", icon: Sparkles },
                  { id: "talent-pools", label: "Talent Pools", icon: Bookmark },
                  { id: "analytics", label: "Analytics & Reports", icon: BarChart3 },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as TabType);
                        setShowMobileNav(false);
                      }}
                      className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${active
                          ? "mcc-active-tab font-bold"
                          : themeMode === "dark"
                            ? "text-slate-400 hover:text-white hover:bg-white/5"
                            : "text-slate-700 hover:text-[#18233c] hover:bg-slate-100"
                        }`}
                    >
                      <Icon
                        size={16}
                        className={
                          active
                            ? themeMode === "dark"
                              ? "text-white"
                              : "text-white"
                            : "text-[#781c1c]"
                        }
                      />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-white/5 space-y-3 shrink-0">
              <div className={`px-3 py-2 rounded-xl text-[10px] font-mono font-bold flex items-center gap-2 ${themeMode === "dark"
                  ? "bg-emerald-500/10 text-emerald-350 border border-emerald-500/20"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-250"
                }`}>
                <CheckCircle size={11} className="text-emerald-400" />
                Verified Recruiter
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                <LogOut size={15} /> Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RIGHT CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

        {/* MOBILE TOP HEADER BAR */}
        <div className="sticky top-0 z-[49] md:hidden flex items-center justify-between p-4 bg-white/90 dark:bg-[#09090d]/90 backdrop-blur-md border-b border-slate-200 dark:border-white/5 select-none shadow-md shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowMobileNav(true)}
              className="p-2 rounded-xl bg-[#781c1c] hover:bg-[#5f1515] transition cursor-pointer flex items-center justify-center shrink-0"
              style={{ color: '#ffffff' }}
            >
              <Menu size={18} style={{ color: '#ffffff' }} />
            </button>
            <span className="font-serif font-black text-[#18233c] dark:text-white tracking-tight text-xs uppercase">
              Recruiter Menu
            </span>
          </div>
          <button
            onClick={toggleThemeMode}
            aria-label="Toggle theme"
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 cursor-pointer shadow-md hover:scale-110 active:scale-95 border ${themeMode === "dark"
                ? "bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/30"
                : "bg-indigo-900/40 hover:bg-indigo-900/60 text-white border-white/10"
              }`}
          >
            {themeMode === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* MAIN CONTAINER */}
        <div className="flex-1 overflow-y-auto px-4 md:px-10 py-6 md:py-8 space-y-10">

          {/* BANNER SHOWCASE */}
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden min-h-[140px] sm:min-h-[160px] md:h-44 bg-[#18233c] text-white flex items-end p-4 sm:p-6 md:p-8 border border-amber-600/20 shadow-md mb-4 mcc-welcome-banner">
            <div className="absolute inset-0 z-0">
              <img
                src="/mcc-facade.jpg"
                alt="MCC Quadrangle"
                className="w-full h-full object-cover opacity-35 filter brightness-90 contrast-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#18233c] via-[#18233c]/40 to-transparent" />
            </div>

            {/* Desktop Theme Switcher */}
            <div className="hidden md:flex absolute top-4 right-5 z-20 items-center">
              <button
                onClick={toggleThemeMode}
                title="Toggle Light/Dark Mode"
                className={`p-2.5 rounded-full transition-all duration-300 cursor-pointer border shadow-sm flex items-center justify-center ${themeMode === "dark"
                    ? "bg-white/10 hover:bg-white/20 text-amber-300 border-white/15"
                    : "bg-white/90 hover:bg-slate-100 text-slate-700 border-slate-200"
                  }`}
              >
                {themeMode === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>

            <div className="relative z-10 space-y-1 w-full text-left">
              <span
                style={{ color: '#ffffff' }}
                className="text-[9px] sm:text-[9.5px] uppercase font-mono font-black tracking-wider sm:tracking-widest bg-[#781c1c] px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full border border-amber-500/20 inline-block max-w-full truncate"
              >
                {company?.industry || "Recruiting Partner"} · {company?.companyType || "MNC"}
              </span>
              <h1
                style={{ color: '#ffffff' }}
                className="font-serif text-lg sm:text-2xl md:text-3xl font-black mt-1.5 sm:mt-2 leading-tight break-words"
              >
                Welcome back, {profile?.fullName || "HR Representative"}
              </h1>
              <p
                style={{ color: 'rgba(255, 255, 255, 0.85)' }}
                className="text-[11px] sm:text-xs leading-normal"
              >
                Onboard drives, post recruitment vacancies, evaluate candidate pipelines and portfolios.
              </p>
            </div>
          </div>

          {/* HEADER BAR */}
          <div className={`mb-10 flex items-center justify-between flex-wrap gap-4 border-b pb-6 ${themeMode === "dark" ? "border-white/5" : "border-slate-200"
            }`}>
            <div>
              <span className="text-[10px] uppercase font-mono font-black tracking-widest text-[#781c1c] block mb-1 whitespace-nowrap">Madras Christian College</span>
              <h2 className="font-serif text-3xl font-extrabold tracking-tight text-[#18233c] dark:text-white">HR Placement Console</h2>
              <p className={`text-xs mt-1 ${themeMode === "dark" ? "text-gray-400" : "text-slate-500"}`}>
                Post vacancies, evaluate talent portfolios, select applicants, and coordinate placements.
              </p>
            </div>
          </div>

          {/* STATUS BANNER */}
          <div
            className={`border rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${statusColors[company?.status] || "bg-slate-500/10 text-slate-500 border-slate-500/20"
              }`}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/10 rounded-2xl shrink-0 mt-0.5">
                {isPending ? <Clock size={24} /> : <CheckCircle size={24} />}
              </div>
              <div className="text-left space-y-1">
                <span className="text-lg font-black uppercase tracking-wide block">
                  Verification Status: {company?.status}
                </span>
                <p className="text-xs font-medium leading-relaxed opacity-90">
                  {isPending
                    ? "Your onboarding request is currently under review by the placement administration. Placement features (Job postings, applications) will become active once verified."
                    : "Your account is verified! You can post jobs, evaluate candidate portfolios, schedule interviews, and manage recruitment."}
                </p>
              </div>
            </div>
          </div>


          {/* ==========================================
              TAB: OVERVIEW (DASHBOARD)
              ========================================== */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-fade-in">
              {/* Stat Widgets */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Active Jobs", count: stats.activeJobs, color: "text-emerald-500 bg-emerald-500/5 border-emerald-500/10" },
                  { label: "Pending Jobs", count: stats.pendingJobs, color: "text-amber-500 bg-amber-500/5 border-amber-500/10" },
                  { label: "Rejected Jobs", count: stats.rejectedJobs, color: "text-red-500 bg-red-500/5 border-red-500/10" },
                  { label: "Applications", count: stats.applicationsReceived, color: "text-red-500 bg-red-500/5 border-red-500/10" },
                  { label: "Shortlisted", count: stats.studentsShortlisted, color: "text-cyan-500 bg-cyan-500/5 border-cyan-500/10" },
                  { label: "Interviews", count: stats.interviewsScheduled, color: "text-purple-500 bg-purple-500/5 border-purple-500/10" },
                  { label: "Offers Issued", count: stats.offersReleased, color: "text-indigo-500 bg-indigo-500/5 border-indigo-500/10" },
                  { label: "Downloads", count: stats.resumeDownloads, color: "text-pink-500 bg-pink-500/5 border-pink-500/10" },
                ].map((w, idx) => (
                  <div key={idx} className={`p-5 rounded-3xl border text-left space-y-1 ${w.color} ${isDark ? "" : "bg-white"}`}>
                    <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">{w.label}</span>
                    <span className="text-2xl font-black block">{w.count}</span>
                  </div>
                ))}
              </div>

              {/* Feed Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Audit Activities Logs */}
                <div className="lg:col-span-2 glass-card rounded-3xl border p-6 text-left space-y-4 border-slate-200/50 dark:border-white/5 bg-white/40 dark:bg-white/[0.01]">
                  <span className="text-[10px] uppercase font-mono font-black tracking-widest text-[#781c1c] dark:text-red-400 block mb-2">Recent Workspace Activities</span>
                  <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                    {stats.recentActivities.length > 0 ? (
                      stats.recentActivities.map((act: any) => (
                        <div key={act.id} className="flex gap-3 text-xs border-b border-slate-100 dark:border-white/5 pb-2.5 last:border-b-0">
                          <Clock size={14} className="text-red-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="block font-bold">{act.action}</span>
                            <span className="block text-[10px] text-slate-400 mt-0.5">{act.details}</span>
                            <span className="block text-[9px] text-slate-500 mt-1 font-mono">{new Date(act.timestamp).toLocaleString("en-IN")} · by {act.performedByEmail}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 italic">No activity logged in this workspace yet.</p>
                    )}
                  </div>
                </div>

                {/* Notifications Alert Board */}
                <div className="glass-card rounded-3xl border p-6 text-left space-y-4 border-slate-200/50 dark:border-white/5 bg-white/40 dark:bg-white/[0.01]">
                  <span className="text-[10px] uppercase font-mono font-black tracking-widest text-[#781c1c] dark:text-red-400 block mb-2">Announcements Feed</span>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {stats.notifications.length > 0 ? (
                      stats.notifications.map((n: any) => (
                        <div key={n.id} className="p-3 bg-slate-55 dark:bg-white/5 rounded-2xl text-[11px] space-y-1">
                          <div className="flex justify-between font-bold">
                            <span>{n.title}</span>
                            <span className="text-[8px] text-slate-500">{new Date(n.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-normal">{n.message}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 italic">No active notifications broadcasted.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              TAB: PROFILE SETUP
              ========================================== */}
          {activeTab === "profile" && (
            <div className="space-y-6 animate-fade-in">
              {!isEditingProfile ? (
                <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-white/10 bg-white/40 dark:bg-white/[0.02] space-y-6 text-left">
                  <div className="flex justify-between items-center">
                    <h3 className="font-serif text-xl font-extrabold text-[#18233c] dark:text-white mb-2">Company Information</h3>
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="px-4 py-2 bg-[#781c1c]/10 hover:bg-[#781c1c]/20 text-red-500 dark:text-red-300 text-xs font-extrabold uppercase rounded-xl transition flex items-center gap-2 cursor-pointer"
                    >
                      <Edit size={14} /> Edit Company Info
                    </button>
                  </div>

                  {/* Profile Layout Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Visual cards */}
                    <div className="md:col-span-1 space-y-4">
                      <div className="border border-slate-200 dark:border-white/5 rounded-3xl p-6 bg-slate-50/50 dark:bg-white/[0.01] flex flex-col items-center text-center space-y-4">
                        {company?.profile?.logoUrl ? (
                          <img src={company.profile.logoUrl} className="w-20 h-20 object-contain rounded-2xl border p-2 bg-white" alt="logo" />
                        ) : (
                          <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center border"><Building2 size={36} /></div>
                        )}
                        <div>
                          <h4 className="font-black text-lg">{company?.name}</h4>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">{company?.profile?.industry || "Not Specified"}</span>
                        </div>
                      </div>

                      {/* Contact Card */}
                      <div className="border border-slate-200 dark:border-white/5 rounded-3xl p-6 bg-slate-50/50 dark:bg-white/[0.01] text-xs font-semibold space-y-3.5">
                        <span className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider block">HR Representative</span>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Name:</span>
                            <span>{profile?.fullName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Email:</span>
                            <span>{profile?.email}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Designation:</span>
                            <span>{profile?.designation}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Phone:</span>
                            <span>{profile?.phone || "N/A"}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Description & Rich content */}
                    <div className="md:col-span-2 space-y-6">
                      <div>
                        <span className="text-xs font-bold text-slate-400 block mb-1">About Company</span>
                        <p className="text-sm font-medium leading-relaxed">{company?.profile?.description || "No description provided."}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-xs font-bold text-slate-400 block mb-1">Our Mission</span>
                          <p className="text-sm font-medium leading-relaxed">{company?.profile?.mission || "Not specified."}</p>
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-400 block mb-1">Our Vision</span>
                          <p className="text-sm font-medium leading-relaxed">{company?.profile?.vision || "Not specified."}</p>
                        </div>
                      </div>

                      <div>
                        <span className="text-xs font-bold text-slate-400 block mb-1">Work Culture & Benefits</span>
                        <p className="text-sm font-medium leading-relaxed">{company?.profile?.workCulture || "Not specified."}</p>
                      </div>

                      <div>
                        <span className="text-xs font-bold text-slate-400 block mb-1">Hiring & Internship Details</span>
                        <div className="flex flex-wrap gap-2 text-xs font-bold">
                          <span className="px-2.5 py-1 bg-red-500/10 text-red-500 rounded-lg">Internships: {company?.profile?.internshipAvailable ? "Yes" : "No"}</span>
                          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg">Placements: {company?.profile?.placementAvailable ? "Yes" : "No"}</span>
                        </div>
                      </div>

                      {/* Extended Profile Fields */}
                      <div className="border-t border-slate-200/50 dark:border-white/5 pt-4 space-y-4">
                        <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Placement History & Programs</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <span className="text-xs font-bold text-slate-500 block mb-1">Placement History</span>
                            <p className="text-xs font-medium leading-relaxed text-slate-400">{company?.profile?.placementHistory || "No placement history logged."}</p>
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-500 block mb-1">Internship Programs</span>
                            <p className="text-xs font-medium leading-relaxed text-slate-400">{company?.profile?.internshipPrograms || "No internship programs logged."}</p>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-200/50 dark:border-white/5 pt-4 space-y-2">
                        <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">FAQs & Contact details</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <span className="text-xs font-bold text-slate-500 block mb-1">Faq Notes</span>
                            <p className="text-xs font-medium leading-relaxed text-slate-400">{company?.profile?.faqs || "No FAQs added."}</p>
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-500 block mb-1">Contact & Social handles</span>
                            <p className="text-xs font-medium leading-relaxed text-slate-400">Social handles: {company?.profile?.socialLinks || "N/A"}</p>
                            <p className="text-xs font-medium leading-relaxed text-slate-400">Extra contacts: {company?.profile?.contactDetails || "N/A"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveProfile} className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-white/10 bg-white/40 dark:bg-white/[0.02] space-y-6 text-left">
                  <h3 className="text-lg font-black uppercase tracking-wider text-slate-400">Edit Company Information</h3>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Company Name</label>
                        <input
                          type="text"
                          required
                          value={profileForm.name}
                          onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                          className="w-full border text-xs px-4 py-2.5 rounded-xl outline-none bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Logo URL</label>
                        <input
                          type="url"
                          value={profileForm.logoUrl}
                          onChange={(e) => setProfileForm({ ...profileForm, logoUrl: e.target.value })}
                          className="w-full border text-xs px-4 py-2.5 rounded-xl outline-none bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Cover Image URL</label>
                        <input
                          type="url"
                          value={profileForm.coverImageUrl}
                          onChange={(e) => setProfileForm({ ...profileForm, coverImageUrl: e.target.value })}
                          className="w-full border text-xs px-4 py-2.5 rounded-xl outline-none bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Website URL</label>
                        <input
                          type="url"
                          value={profileForm.website}
                          onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                          className="w-full border text-xs px-4 py-2.5 rounded-xl outline-none bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">LinkedIn Profile</label>
                        <input
                          type="url"
                          value={profileForm.linkedInUrl}
                          onChange={(e) => setProfileForm({ ...profileForm, linkedInUrl: e.target.value })}
                          className="w-full border text-xs px-4 py-2.5 rounded-xl outline-none bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Industry Sectors</label>
                        <input
                          type="text"
                          value={profileForm.industry}
                          onChange={(e) => setProfileForm({ ...profileForm, industry: e.target.value })}
                          className="w-full border text-xs px-4 py-2.5 rounded-xl outline-none bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Company Size</label>
                        <input
                          type="text"
                          placeholder="e.g. 50-100"
                          value={profileForm.companySize}
                          onChange={(e) => setProfileForm({ ...profileForm, companySize: e.target.value })}
                          className="w-full border text-xs px-4 py-2.5 rounded-xl outline-none bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Company Description</label>
                      <textarea
                        rows={3}
                        required
                        value={profileForm.description}
                        onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                        className="w-full border text-xs px-4 py-2.5 rounded-xl outline-none bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Vision Statement</label>
                        <textarea
                          rows={2}
                          value={profileForm.vision}
                          onChange={(e) => setProfileForm({ ...profileForm, vision: e.target.value })}
                          className="w-full border text-xs px-4 py-2.5 rounded-xl outline-none bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Mission Statement</label>
                        <textarea
                          rows={2}
                          value={profileForm.mission}
                          onChange={(e) => setProfileForm({ ...profileForm, mission: e.target.value })}
                          className="w-full border text-xs px-4 py-2.5 rounded-xl outline-none bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Extended Section Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-200 dark:border-white/5 pt-4">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Placement History Summary</label>
                        <textarea
                          rows={2}
                          placeholder="Record key hiring stats from previous years..."
                          value={profileForm.placementHistory}
                          onChange={(e) => setProfileForm({ ...profileForm, placementHistory: e.target.value })}
                          className="w-full border text-xs px-4 py-2.5 rounded-xl outline-none bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Internship Programs Offered</label>
                        <textarea
                          rows={2}
                          placeholder="Describe available internship timelines and structures..."
                          value={profileForm.internshipPrograms}
                          onChange={(e) => setProfileForm({ ...profileForm, internshipPrograms: e.target.value })}
                          className="w-full border text-xs px-4 py-2.5 rounded-xl outline-none bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-200 dark:border-white/5 pt-4">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Gallery Image URLs (Comma-separated)</label>
                        <input
                          type="text"
                          placeholder="http://img1.jpg, http://img2.jpg"
                          value={profileForm.gallery}
                          onChange={(e) => setProfileForm({ ...profileForm, gallery: e.target.value })}
                          className="w-full border text-xs px-4 py-2.5 rounded-xl outline-none bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Video Links (Comma-separated)</label>
                        <input
                          type="text"
                          placeholder="http://vid1.mp4, http://vid2.mp4"
                          value={profileForm.videos}
                          onChange={(e) => setProfileForm({ ...profileForm, videos: e.target.value })}
                          className="w-full border text-xs px-4 py-2.5 rounded-xl outline-none bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Work Culture & Perks</label>
                        <input
                          type="text"
                          value={profileForm.workCulture}
                          onChange={(e) => setProfileForm({ ...profileForm, workCulture: e.target.value })}
                          className="w-full border text-xs px-4 py-2.5 rounded-xl outline-none bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-200 dark:border-white/5 pt-4">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">FAQS Notes</label>
                        <textarea
                          rows={2}
                          placeholder="e.g. Q: What is work hours? A: Flexible."
                          value={profileForm.faqs}
                          onChange={(e) => setProfileForm({ ...profileForm, faqs: e.target.value })}
                          className="w-full border text-xs px-4 py-2.5 rounded-xl outline-none bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Social Links (Twitter, Instagram etc.)</label>
                        <textarea
                          rows={2}
                          placeholder="Twitter: @company, Insta: @company"
                          value={profileForm.socialLinks}
                          onChange={(e) => setProfileForm({ ...profileForm, socialLinks: e.target.value })}
                          className="w-full border text-xs px-4 py-2.5 rounded-xl outline-none bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Direct Contacts (Phone / Email)</label>
                        <textarea
                          rows={2}
                          placeholder="HR phone, direct line office details..."
                          value={profileForm.contactDetails}
                          onChange={(e) => setProfileForm({ ...profileForm, contactDetails: e.target.value })}
                          className="w-full border text-xs px-4 py-2.5 rounded-xl outline-none bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 border-t border-slate-200 dark:border-white/5 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="px-5 py-2.5 bg-slate-200 dark:bg-white/5 text-slate-800 dark:text-white text-xs font-bold uppercase rounded-xl transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saveProfileLoading}
                      className="px-6 py-2.5 bg-[#781c1c] hover:bg-[#5f1515] text-white text-xs font-bold uppercase rounded-xl transition cursor-pointer disabled:opacity-50"
                    >
                      {saveProfileLoading ? "Saving..." : "Save Workspace"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ==========================================
              TAB: JOB POSTINGS
              ========================================== */}
          {activeTab === "jobs" && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-serif text-2xl font-extrabold text-[#18233c] dark:text-white">Hiring Opportunities</h2>
                  <p className="text-xs text-slate-400">Post new listings and review approval statuses.</p>
                </div>
                {!isPending && (
                  <button
                    onClick={() => handleOpenJobModal()}
                    className="px-4 py-2.5 bg-[#781c1c] hover:bg-[#5f1515] text-white text-xs font-extrabold uppercase rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-red-900/10"
                  >
                    <Plus size={14} /> Create Job Posting
                  </button>
                )}
              </div>

              {/* Jobs List Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {jobs.length > 0 ? (
                  jobs.map((job) => (
                    <div
                      key={job.id || job.Id}
                      className={`p-6 border rounded-3xl flex flex-col justify-between h-80 shadow-md ${isDark ? "bg-white/5 border-white/5" : "bg-white border-slate-200"
                        }`}
                    >
                      <div className="space-y-3.5">
                        <div className="flex justify-between items-start">
                          <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${jobStatusBadge[job.status || job.Status]}`}>
                            {job.status || job.Status}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-400">
                            Deadline: {new Date(job.deadlines || job.Deadlines).toLocaleDateString()}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-lg font-black truncate">{job.title || job.Title}</h4>
                          <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide block">{job.department || job.Department} · {job.jobType || job.JobType}</span>
                        </div>

                        <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">{job.description || job.Description}</p>

                        <div className="flex flex-wrap gap-1.5 pt-1.5">
                          <span className="text-[9px] px-2 py-0.5 bg-slate-500/10 rounded-full font-bold text-slate-400">Min CGPA: {job.eligibilityMinCGPA ?? job.EligibilityMinCGPA}</span>
                          <span className="text-[9px] px-2 py-0.5 bg-indigo-500/10 rounded-full font-bold text-indigo-400">LPA: {job.lpa ?? job.LPA} LPA</span>
                          <span className="text-[9px] px-2 py-0.5 bg-violet-500/10 rounded-full font-bold text-violet-400">Mode: {job.workMode ?? job.WorkMode}</span>
                        </div>

                        {job.status === "ChangesRequested" && job.changesFeedback && (
                          <div className="p-3 bg-purple-500/5 border border-purple-500/10 rounded-2xl text-[10px] text-purple-400 leading-normal">
                            <strong>Admin Feedback:</strong> "{job.changesFeedback}"
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-white/5">
                        <button
                          onClick={() => handleOpenJobModal(job)}
                          className="flex-1 py-2 bg-[#781c1c]/10 hover:bg-[#781c1c]/20 text-red-500 dark:text-red-300 text-xs font-bold uppercase rounded-xl transition cursor-pointer"
                        >
                          Edit Details
                        </button>
                        <button
                          onClick={() => handleDeleteJob(job.id || job.Id)}
                          className="px-3.5 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-xl transition cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="md:col-span-2 border border-dashed rounded-3xl p-14 text-center border-slate-200 dark:border-white/10">
                    <div className="w-16 h-16 rounded-3xl bg-red-500/10 flex items-center justify-center mx-auto mb-5">
                      <Briefcase className="text-red-400" size={30} />
                    </div>
                    <p className="text-base font-black text-slate-600 dark:text-slate-300 mb-2">No Job Postings Yet</p>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed mb-5">
                      Create your first job listing to start receiving applications from eligible MCC students.
                    </p>
                    {!isPending && (
                      <button
                        onClick={() => handleOpenJobModal()}
                        className="px-5 py-2.5 bg-[#781c1c] hover:bg-[#5f1515] text-white text-xs font-extrabold uppercase rounded-xl transition cursor-pointer shadow-lg shadow-red-900/20"
                      >
                        <span className="flex items-center gap-2"><Plus size={13} /> Create First Job</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==========================================
              TAB: APPLICATIONS (CANDIDATES TRACKING)
              ========================================== */}
          {activeTab === "applications" && (
            <div className="space-y-6 animate-fade-in text-left">
              <div>
                <h2 className="font-serif text-2xl font-extrabold text-[#18233c] dark:text-white">Student Candidate Profiles</h2>
                <p className="text-xs text-slate-400">Monitor candidate evaluation pipelines and set review status.</p>
              </div>

              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                  <input
                    type="text"
                    placeholder="Search by student name or job title..."
                    value={appSearch}
                    onChange={(e) => setAppSearch(e.target.value)}
                    className="w-full text-xs pl-9 pr-4 py-2 border rounded-xl outline-none transition bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <span className="text-xs font-bold text-slate-400">Status:</span>
                  <select
                    value={appStatusFilter}
                    onChange={(e) => setAppStatusFilter(e.target.value)}
                    aria-label="Filter candidates by pipeline stage"
                    className="text-xs px-4 py-2 border rounded-xl outline-none transition bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                  >
                    <option value="all">All Stages</option>
                    <option value="Applied">Applied</option>
                    <option value="Reviewed">Reviewed</option>
                    <option value="Shortlisted">Shortlisted</option>
                    <option value="InterviewScheduled">Interview Scheduled</option>
                    <option value="Selected">Selected</option>
                    <option value="Offer Sent">Offer Sent</option>
                    <option value="Offer Accepted">Offer Accepted</option>
                    <option value="Joined">Joined</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Applications List */}
              <div className="space-y-4">
                {applications
                  .filter((app) => {
                    const matchQuery =
                      app.student.fullName.toLowerCase().includes(appSearch.toLowerCase()) ||
                      app.jobTitle.toLowerCase().includes(appSearch.toLowerCase());
                    const matchStatus = appStatusFilter === "all" || app.status === appStatusFilter;
                    return matchQuery && matchStatus;
                  })
                  .map((app) => (
                    <div
                      key={app.id}
                      className={`p-6 border rounded-3xl flex flex-col justify-between gap-4 shadow-sm text-left ${isDark ? "bg-white/5 border-white/5" : "bg-white border-slate-200"
                        }`}
                    >
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="space-y-3.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-3.5">
                            <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${appStatusBadge[app.status]}`}>
                              {app.status}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                              Job: <strong>{app.jobTitle}</strong> ({app.jobType})
                            </span>
                          </div>

                          <div className="space-y-1">
                            <h4 className="text-base font-black truncate">{app.student.fullName}</h4>
                            <p className="text-xs text-slate-400 font-semibold">{app.student.department} · Reg: {app.student.registerNumber || "N/A"}</p>
                          </div>

                          <p className="text-xs text-slate-500 italic line-clamp-2">{app.student.bio || "No summary provided."}</p>

                          <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-400">
                            <span className="px-2 py-0.5 bg-slate-500/10 rounded-lg">CGPA: {app.student.cgpa}</span>
                            <span className="px-2 py-0.5 bg-indigo-500/10 rounded-lg">Graduation: {app.student.graduationYear || "N/A"}</span>
                          </div>

                          {/* Assessment Score Display */}
                          {app.assessmentId && (
                            <div className="text-[10px] font-extrabold bg-red-500/5 dark:bg-red-500/10 border border-red-500/10 rounded-2xl p-3.5 text-left mt-2 max-w-md">
                              <span className="text-slate-400 uppercase tracking-wide block mb-1">Attached Screening Test</span>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-300 font-bold">{app.assessmentTitle}</span>
                                {app.assessmentAttempt ? (
                                  <span className="text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full font-mono border border-emerald-500/20">
                                    Score: {app.assessmentAttempt.marksObtained} / {app.assessmentAttempt.totalMarks} ({app.assessmentAttempt.percentage}%)
                                  </span>
                                ) : (
                                  <span className="text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full font-mono border border-amber-500/20">
                                    Pending Attempt
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col justify-between items-end gap-3.5 shrink-0 w-full md:w-auto">
                          <span className="text-[10px] text-slate-500 font-semibold font-mono">Applied: {new Date(app.appliedAt).toLocaleDateString()}</span>

                          <div className="flex flex-col sm:flex-row md:flex-col gap-2 w-full">
                            <a
                              href={app.resumeUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={() => handleDownloadResume(app.student.fullName)}
                              className="px-4 py-2 bg-[#781c1c]/10 hover:bg-[#781c1c]/20 text-red-500 dark:text-red-300 text-xs font-bold uppercase rounded-xl transition text-center flex items-center justify-center gap-1.5"
                            >
                              <FileText size={12} /> View Resume
                            </a>

                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">Stage:</span>
                              <select
                                value={app.status}
                                onChange={(e) => handleUpdateAppStatus(app.id, e.target.value)}
                                className="text-xs px-3 py-1.5 border rounded-xl outline-none transition bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white cursor-pointer"
                              >
                                <option value="Applied">Applied</option>
                                <option value="Reviewed">Reviewed</option>
                                <option value="Shortlisted">Shortlisted</option>
                                <option value="InterviewScheduled">Interview Scheduled</option>
                                <option value="Selected">Selected</option>
                                <option value="Offer Sent">Offer Sent</option>
                                <option value="Offer Accepted">Offer Accepted</option>
                                <option value="Joined">Joined</option>
                                <option value="Rejected">Rejected</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Recruitment Lifecycle Panels (Interviews & Offers) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 dark:border-white/5 pt-4">
                        {/* Interview scheduling & list */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Candidate Interviews</span>
                            <button
                              onClick={() => {
                                setActiveSchedulerAppId(activeSchedulerAppId === app.id ? null : app.id);
                              }}
                              className="px-3 py-1.5 bg-[#781c1c]/10 hover:bg-[#781c1c]/20 text-red-500 dark:text-red-300 text-[10px] font-bold uppercase rounded-xl transition cursor-pointer"
                            >
                              {activeSchedulerAppId === app.id ? "Close Calendar" : "Schedule Interview"}
                            </button>
                          </div>

                          {/* List of interviews scheduled */}
                          {app.interviews && app.interviews.length > 0 && (
                            <div className="space-y-2">
                              {app.interviews.map((i: any) => (
                                <div key={i.id} className="p-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl text-[10px] space-y-1 text-slate-400 font-bold">
                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-250 uppercase font-black">{i.type} Interview</span>
                                    <span className={`px-2 py-0.5 rounded-full border text-[8px] font-extrabold uppercase ${i.status === "Scheduled" ? "bg-red-500/10 text-red-400 border-red-500/20" : i.status === "Rescheduled" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                                      }`}>{i.status}</span>
                                  </div>
                                  <div>Time: {new Date(i.scheduleTime).toLocaleString()}</div>
                                  {i.meetLink && <div className="truncate">Link: <a href={i.meetLink} target="_blank" rel="noreferrer" className="text-red-500 underline">{i.meetLink}</a></div>}
                                  {i.venue && <div>Venue: {i.venue}</div>}
                                </div>
                              ))}
                            </div>
                          )}

                          {activeSchedulerAppId === app.id && (
                            <div className="p-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl space-y-3">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Mode</label>
                                  <select
                                    value={schedulerForm.type}
                                    onChange={(e) => setSchedulerForm({ ...schedulerForm, type: e.target.value })}
                                    className="w-full border text-[10px] px-2 py-1.5 rounded-lg bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                                  >
                                    <option value="Online">Online Meet</option>
                                    <option value="Offline">In-Person</option>
                                    <option value="Campus">Campus Drive</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Date & Time</label>
                                  <input
                                    type="datetime-local"
                                    value={schedulerForm.scheduleTime}
                                    onChange={(e) => setSchedulerForm({ ...schedulerForm, scheduleTime: e.target.value })}
                                    className="w-full border text-[10px] px-2 py-1.5 rounded-lg bg-white dark:bg-white/5 border-slate-200 text-slate-900 dark:text-white"
                                  />
                                </div>
                              </div>

                              {schedulerForm.type === "Online" ? (
                                <div>
                                  <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Meet Link URL</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. https://meet.google.com/abc-defg-hij"
                                    value={schedulerForm.meetLink}
                                    onChange={(e) => setSchedulerForm({ ...schedulerForm, meetLink: e.target.value })}
                                    className="w-full border text-[10px] px-3 py-1.5 rounded-lg bg-white dark:bg-white/5 border-slate-200 text-slate-900 dark:text-white"
                                  />
                                </div>
                              ) : (
                                <div>
                                  <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Interview Venue / Office Room</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. Hall A, 3rd Floor Seminar Hall"
                                    value={schedulerForm.venue}
                                    onChange={(e) => setSchedulerForm({ ...schedulerForm, venue: e.target.value })}
                                    className="w-full border text-[10px] px-3 py-1.5 rounded-lg bg-white dark:bg-white/5 border-slate-200 text-slate-900 dark:text-white"
                                  />
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={() => handleScheduleInterviewSubmit(app.id)}
                                className="w-full py-2 bg-[#781c1c] hover:bg-[#5f1515] text-white text-[10px] font-bold uppercase rounded-lg transition cursor-pointer"
                              >
                                Confirm Interview Schedule
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Offer letter panel */}
                        <div className="space-y-3 border-t md:border-t-0 md:border-l border-slate-100 dark:border-white/5 pt-3 md:pt-0 md:pl-4">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Offer Administration</span>
                            <button
                              onClick={() => {
                                setActiveOfferAppId(activeOfferAppId === app.id ? null : app.id);
                              }}
                              className="px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-500 dark:text-indigo-300 text-[10px] font-bold uppercase rounded-xl transition cursor-pointer"
                            >
                              {activeOfferAppId === app.id ? "Close Panel" : "Manage Offers"}
                            </button>
                          </div>

                          {app.offerLetterUrl && (
                            <div className="p-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl text-[10px] space-y-1 text-slate-400 font-bold">
                              <div className="flex justify-between items-center">
                                <span>Status: <strong className="text-red-500 uppercase">{app.offerStatus || "Released"}</strong></span>
                                {app.offerReleasedAt && <span>{new Date(app.offerReleasedAt).toLocaleDateString()}</span>}
                              </div>
                              <div className="pt-1">
                                <a href={app.offerLetterUrl} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 underline block font-extrabold">
                                  Download Released Offer Letter (PDF)
                                </a>
                              </div>
                            </div>
                          )}

                          {activeOfferAppId === app.id && (
                            <div className="p-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl space-y-3">
                              <div>
                                <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Offer Letter PDF Document URL</label>
                                <input
                                  type="text"
                                  placeholder="e.g. https://mcc.edu/uploads/letters/offer.pdf"
                                  value={offerFormUrl}
                                  onChange={(e) => setOfferFormUrl(e.target.value)}
                                  className="w-full border text-[10px] px-3 py-1.5 rounded-lg bg-white dark:bg-white/5 border-slate-200 text-slate-900 dark:text-white"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleReleaseOfferSubmit(app.id)}
                                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold uppercase rounded-lg transition cursor-pointer"
                              >
                                Release Offer Letter
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                {applications.length === 0 && (
                  <div className="border border-dashed rounded-3xl p-14 text-center border-slate-200 dark:border-white/10">
                    <div className="w-16 h-16 rounded-3xl bg-slate-500/10 flex items-center justify-center mx-auto mb-5">
                      <Users className="text-slate-400" size={30} />
                    </div>
                    <p className="text-base font-black text-slate-600 dark:text-slate-300 mb-2">No Applications Received</p>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                      Once students apply to your job postings, their profiles will appear here for evaluation.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==========================================
              TAB: TALENT POOLS
              ========================================== */}
          {activeTab === "talent-pools" && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-serif text-2xl font-extrabold text-[#18233c] dark:text-white">Talent Pools</h2>
                  <p className="text-xs text-slate-400">Organize and save potential candidates for recruiting runs.</p>
                </div>
                <button
                  onClick={() => setPoolModalOpen(true)}
                  className="px-4 py-2.5 bg-[#781c1c] hover:bg-[#5f1515] text-white text-xs font-extrabold uppercase rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-red-900/10"
                >
                  <FolderPlus size={14} /> Create Talent Pool
                </button>
              </div>

              {/* Pools list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pools.length > 0 ? (
                  pools.map((p) => {
                    const studentCount = p.StudentIds ? p.StudentIds.split(",").length : 0;
                    return (
                      <div
                        key={p.Id || p.id}
                        className={`p-6 border rounded-3xl flex flex-col justify-between h-48 shadow-md ${isDark ? "bg-white/5 border-white/5" : "bg-white border-slate-200"
                          }`}
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-bold font-mono">
                              Pool ID: #{p.Id || p.id}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono font-bold">
                              Saved: {new Date(p.CreatedAt || p.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-lg font-black truncate">{p.Name || p.name}</h4>
                            <span className="text-xs text-slate-400 font-semibold">{studentCount} candidate(s) saved</span>
                          </div>
                          {p.isDynamic && (
                            <span className="text-[8px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold inline-block mt-1 w-fit">
                              DYNAMIC POOL
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2 border-t border-slate-100 dark:border-white/5 pt-4">
                          <button
                            onClick={() => handleViewPoolMembers(p)}
                            className="flex-1 py-2 bg-[#781c1c]/10 hover:bg-[#781c1c]/20 text-red-500 dark:text-red-300 text-xs font-bold uppercase rounded-xl transition cursor-pointer"
                          >
                            View Members
                          </button>
                          <button
                            onClick={() => handleDeletePool(p.Id || p.id)}
                            className="px-3 py-2 bg-red-650/10 hover:bg-red-600/20 text-red-500 rounded-xl transition cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="md:col-span-2 border border-dashed rounded-3xl p-12 text-center text-slate-500 border-slate-200 dark:border-white/10">
                    <Bookmark className="mx-auto mb-3 text-slate-400" size={32} />
                    <p className="text-sm font-bold">No saved talent pools found.</p>
                    <p className="text-xs text-slate-400 mt-1">Organize student profiles into custom lists by clicking the create pool button.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==========================================
              TAB: ANALYTICS & REPORTS
              ========================================== */}
          {activeTab === "analytics" && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <h2 className="font-serif text-2xl font-extrabold text-[#18233c] dark:text-white">Recruiter Analytics & Export</h2>
                  <p className="text-xs text-slate-400">Monitor candidate conversion pipelines and download Excel/CSV reports.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">Export:</span>
                  <button
                    type="button"
                    onClick={() => handleExport("csv")}
                    className="px-3.5 py-2 bg-[#781c1c]/10 hover:bg-[#781c1c]/20 text-red-500 rounded-xl text-xs font-bold uppercase transition cursor-pointer"
                  >
                    CSV Format
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExport("excel")}
                    className="px-3.5 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-500 rounded-xl text-xs font-bold uppercase transition cursor-pointer"
                  >
                    Excel Format
                  </button>
                </div>
              </div>

              {analyticsLoading || !analyticsData ? (
                <div className="p-12 text-center text-slate-500">
                  <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs font-bold">Computing candidate funnel analytics...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Total Applications", val: analyticsData.totalApplications, icon: Users, color: "text-red-500 bg-red-500/5" },
                      { label: "Pipeline Placed Rate", val: `${analyticsData.conversionRate}%`, icon: CheckCircle, color: "text-emerald-500 bg-emerald-500/5" },
                      { label: "Average Candidate Match", val: `${analyticsData.averageMatchScore}%`, icon: Sparkles, color: "text-violet-500 bg-violet-500/5" },
                      { label: "Offer Acceptance Rate", val: `${analyticsData.offerAcceptanceRate}%`, icon: Briefcase, color: "text-amber-500 bg-amber-500/5" },
                    ].map((card, idx) => {
                      const Icon = card.icon;
                      return (
                        <div key={idx} className={`p-6 border rounded-3xl space-y-2 ${card.color} ${isDark ? "border-white/5 bg-white/5" : "bg-white border-slate-200"}`}>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] uppercase font-black tracking-wide text-slate-400">{card.label}</span>
                            <Icon size={16} />
                          </div>
                          <span className="text-2xl font-black block">{card.val}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Funnel Layout */}
                  <div className={`p-6 border rounded-3xl space-y-4 ${isDark ? "bg-white/5 border-white/5" : "bg-white border-slate-200"}`}>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">Hiring Funnel Progression</h4>
                    <div className="space-y-3.5">
                      {[
                        { label: "Applied", count: analyticsData.funnel.Applied, pct: 105, color: "bg-slate-500" },
                        { label: "Reviewed", count: analyticsData.funnel.Reviewed, pct: analyticsData.totalApplications > 0 ? (analyticsData.funnel.Reviewed / analyticsData.totalApplications) * 100 : 0, color: "bg-red-500" },
                        { label: "Shortlisted", count: analyticsData.funnel.Shortlisted, pct: analyticsData.totalApplications > 0 ? (analyticsData.funnel.Shortlisted / analyticsData.totalApplications) * 100 : 0, color: "bg-sky-500" },
                        { label: "Interview Scheduled", count: analyticsData.funnel.InterviewScheduled, pct: analyticsData.totalApplications > 0 ? (analyticsData.funnel.InterviewScheduled / analyticsData.totalApplications) * 100 : 0, color: "bg-amber-500" },
                        { label: "Selected", count: analyticsData.funnel.Selected, pct: analyticsData.totalApplications > 0 ? (analyticsData.funnel.Selected / analyticsData.totalApplications) * 100 : 0, color: "bg-purple-500" },
                        { label: "Offers Sent", count: analyticsData.funnel["Offer Sent"], pct: analyticsData.totalApplications > 0 ? (analyticsData.funnel["Offer Sent"] / analyticsData.totalApplications) * 100 : 0, color: "bg-indigo-500" },
                        { label: "Offers Accepted", count: analyticsData.funnel["Offer Accepted"] + analyticsData.funnel.Joined, pct: analyticsData.totalApplications > 0 ? ((analyticsData.funnel["Offer Accepted"] + analyticsData.funnel.Joined) / analyticsData.totalApplications) * 100 : 0, color: "bg-emerald-500" }
                      ].map((item, idx) => (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-slate-350">{item.label}</span>
                            <span className="font-mono">{item.count} Candidate(s) ({Math.round(item.pct === 105 ? 100 : item.pct)}%)</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-white/5 h-2.5 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-500 ${item.color}`} style={{ width: `${Math.max(item.pct === 105 ? 100 : item.pct, 1)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Skills chart */}
                    <div className={`p-6 border rounded-3xl space-y-4 ${isDark ? "bg-white/5 border-white/5" : "bg-white border-slate-200"}`}>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Popular Applicant Skills</h4>
                      {analyticsData.popularSkills.length > 0 ? (
                        <div className="space-y-3.5 pt-2">
                          {analyticsData.popularSkills.map((s: any, idx: number) => {
                            const maxCount = analyticsData.popularSkills[0].count;
                            const pct = (s.count / maxCount) * 100;
                            return (
                              <div key={idx} className="space-y-1">
                                <div className="flex justify-between items-center text-[10px] font-bold">
                                  <span className="text-slate-350 font-mono">#{idx + 1} {s.skill}</span>
                                  <span className="text-slate-400">{s.count} matched</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-white/5 h-1.5 rounded-full overflow-hidden">
                                  <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs font-bold text-slate-500 text-center py-8">No applicant skill sets matched yet.</p>
                      )}
                    </div>

                    {/* Department chart */}
                    <div className={`p-6 border rounded-3xl space-y-4 ${isDark ? "bg-white/5 border-white/5" : "bg-white border-slate-200"}`}>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Applicants by Department</h4>
                      {analyticsData.departments.length > 0 ? (
                        <div className="space-y-3.5 pt-2">
                          {analyticsData.departments.map((d: any, idx: number) => {
                            const maxCount = analyticsData.departments[0].count;
                            const pct = (d.count / maxCount) * 100;
                            return (
                              <div key={idx} className="space-y-1">
                                <div className="flex justify-between items-center text-[10px] font-bold">
                                  <span className="text-slate-350">{d.name}</span>
                                  <span className="text-slate-450">{d.count} student(s)</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-white/5 h-1.5 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs font-bold text-slate-500 text-center py-8">No candidates applied from any department yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div> {/* close main container */}
      </div> {/* close right content wrapper */}

      {/* ==========================================
          MODAL: JOB CREATION / EDITING FORM
          ========================================== */}
      {jobModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
          <form
            onSubmit={handleSaveJob}
            className={`w-full max-w-2xl h-screen shadow-2xl relative overflow-y-auto flex flex-col justify-between p-8 text-left ${isDark ? "bg-[#0b0b0f] text-white" : "bg-white text-slate-900"
              }`}
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-4">
              <h3 className="text-lg font-black uppercase tracking-wider text-slate-400">
                {editingJobId ? "Edit Job Posting" : "New Job Placement Opportunity"}
              </h3>
              <button
                type="button"
                onClick={() => setJobModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
              >
                Cancel
              </button>
            </div>

            {/* Inputs */}
            <div className="flex-1 py-6 space-y-4 overflow-y-auto pr-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Job Title *</label>
                  <input
                    type="text"
                    required
                    value={jobForm.title}
                    onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                    className="w-full border text-xs px-4 py-2.5 rounded-xl outline-none bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Target Department *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Engineering, Sales"
                    value={jobForm.department}
                    onChange={(e) => setJobForm({ ...jobForm, department: e.target.value })}
                    className="w-full border text-xs px-4 py-2.5 rounded-xl outline-none bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Job Type</label>
                  <select
                    value={jobForm.jobType}
                    onChange={(e) => setJobForm({ ...jobForm, jobType: e.target.value })}
                    className="w-full border text-xs px-4 py-2.5 rounded-xl outline-none bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                  >
                    <option value="FullTime">Full Time</option>
                    <option value="Internship">Internship</option>
                    <option value="PartTime">Part Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Freelance">Freelance</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Work Mode</label>
                  <select
                    value={jobForm.workMode}
                    onChange={(e) => setJobForm({ ...jobForm, workMode: e.target.value })}
                    className="w-full border text-xs px-4 py-2.5 rounded-xl outline-none bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                  >
                    <option value="OnSite">On Site</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Attached Online Assessment (Optional)</label>
                <select
                  value={jobForm.assessmentId}
                  onChange={(e) => setJobForm({ ...jobForm, assessmentId: e.target.value })}
                  className="w-full border text-xs px-4 py-2.5 rounded-xl outline-none bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white mb-4 cursor-pointer"
                >
                  <option value="">No Assessment Linked</option>
                  {availableAssessments.map((ass: any) => (
                    <option key={ass.id} value={ass.id}>
                      {ass.title} ({ass.durationMinutes} min)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Job Description *</label>
                <textarea
                  rows={3}
                  required
                  value={jobForm.description}
                  onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                  className="w-full border text-xs px-4 py-2.5 rounded-xl outline-none bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Responsibilities</label>
                  <textarea
                    rows={2}
                    value={jobForm.responsibilities}
                    onChange={(e) => setJobForm({ ...jobForm, responsibilities: e.target.value })}
                    className="w-full border text-xs px-4 py-2.5 rounded-xl outline-none bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Job Requirements</label>
                  <textarea
                    rows={2}
                    value={jobForm.requirements}
                    onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })}
                    className="w-full border text-xs px-4 py-2.5 rounded-xl outline-none bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Required Skills (Comma-separated)</label>
                  <input
                    type="text"
                    placeholder="React, Next.js, Node"
                    value={jobForm.requiredSkills}
                    onChange={(e) => setJobForm({ ...jobForm, requiredSkills: e.target.value })}
                    className="w-full border text-xs px-4 py-2.5 rounded-xl outline-none bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Preferred Skills (Comma-separated)</label>
                  <input
                    type="text"
                    placeholder="Docker, Redis, AWS"
                    value={jobForm.preferredSkills}
                    onChange={(e) => setJobForm({ ...jobForm, preferredSkills: e.target.value })}
                    className="w-full border text-xs px-4 py-2.5 rounded-xl outline-none bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Eligibility Fields */}
              <div className="p-4 bg-slate-55 dark:bg-white/5 rounded-3xl space-y-4">
                <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-450 block">Candidate Eligibility criteria</span>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Eligible Academic Depts</label>
                    <input
                      type="text"
                      placeholder="e.g. Computer Science;MCA (Semicolon split) or all"
                      value={jobForm.eligibilityDepartments}
                      onChange={(e) => setJobForm({ ...jobForm, eligibilityDepartments: e.target.value })}
                      className="w-full border text-xs px-3 py-2 rounded-xl outline-none bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Graduation Years</label>
                    <input
                      type="text"
                      placeholder="e.g. 2025;2026 (Semicolon split) or all"
                      value={jobForm.eligibilityYears}
                      onChange={(e) => setJobForm({ ...jobForm, eligibilityYears: e.target.value })}
                      className="w-full border text-xs px-3 py-2 rounded-xl outline-none bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Min CGPA Required</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={jobForm.eligibilityMinCGPA}
                      onChange={(e) => setJobForm({ ...jobForm, eligibilityMinCGPA: e.target.value })}
                      className="w-full border text-xs px-3 py-2 rounded-xl outline-none bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Salary Details</label>
                    <input
                      type="text"
                      placeholder="e.g. Rs. 45,000 / month"
                      value={jobForm.salary}
                      onChange={(e) => setJobForm({ ...jobForm, salary: e.target.value })}
                      className="w-full border text-xs px-3 py-2 rounded-xl outline-none bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Numerical LPA (Lakhs)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={jobForm.lpa}
                      onChange={(e) => setJobForm({ ...jobForm, lpa: e.target.value })}
                      className="w-full border text-xs px-3 py-2 rounded-xl outline-none bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Eligible Experience</label>
                    <input
                      type="text"
                      placeholder="e.g. Freshers, 0-1 years"
                      value={jobForm.eligibilityExperience}
                      onChange={(e) => setJobForm({ ...jobForm, eligibilityExperience: e.target.value })}
                      className="w-full border text-xs px-3 py-2 rounded-xl outline-none bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Total Vacancies</label>
                  <input
                    type="number"
                    required
                    value={jobForm.vacancies}
                    onChange={(e) => setJobForm({ ...jobForm, vacancies: e.target.value })}
                    className="w-full border text-xs px-4 py-2.5 rounded-xl outline-none bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Deadlines Date *</label>
                  <input
                    type="date"
                    required
                    value={jobForm.deadlines}
                    onChange={(e) => setJobForm({ ...jobForm, deadlines: e.target.value })}
                    className="w-full border text-xs px-4 py-2.5 rounded-xl outline-none bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Attachments URLs</label>
                  <input
                    type="text"
                    placeholder="Brief details or doc link"
                    value={jobForm.attachments}
                    onChange={(e) => setJobForm({ ...jobForm, attachments: e.target.value })}
                    className="w-full border text-xs px-4 py-2.5 rounded-xl outline-none bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Selection & Interview Process</label>
                <textarea
                  rows={2}
                  placeholder="Describe online test, technical round, HR rounds..."
                  value={jobForm.selectionProcess}
                  onChange={(e) => setJobForm({ ...jobForm, selectionProcess: e.target.value })}
                  className="w-full border text-xs px-4 py-2.5 rounded-xl outline-none bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Job Perks & Benefits</label>
                <textarea
                  rows={2}
                  placeholder="Describe medical cover, cab facilities, learning subsidies..."
                  value={jobForm.benefits}
                  onChange={(e) => setJobForm({ ...jobForm, benefits: e.target.value })}
                  className="w-full border text-xs px-4 py-2.5 rounded-xl outline-none bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-white/5 pt-4">
              <button
                type="button"
                onClick={() => setJobModalOpen(false)}
                className="px-5 py-2.5 bg-slate-200 dark:bg-white/5 text-slate-800 dark:text-white text-xs font-bold uppercase rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#781c1c] hover:bg-[#5f1515] text-white text-xs font-bold uppercase rounded-xl transition cursor-pointer"
              >
                Submit Listing
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==========================================
          MODAL: TALENT POOL CREATION
          ========================================== */}
      {poolModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <form
            onSubmit={handleCreatePool}
            className={`w-full max-w-xl rounded-3xl shadow-2xl relative p-6 text-left border ${isDark ? "bg-[#0b0b0f] text-white border-white/5" : "bg-white text-slate-900 border-slate-200"
              }`}
          >
            <h3 className="text-base font-black uppercase tracking-wider text-slate-400 mb-4">
              Create New Saved Talent Pool
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Pool Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Core Java Candidates 2026"
                  value={poolForm.name}
                  onChange={(e) => setPoolForm({ ...poolForm, name: e.target.value })}
                  className="w-full border text-xs px-4 py-2.5 rounded-xl outline-none bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                />
              </div>

              {/* Student Search and select checkboxes */}
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-2">Select Candidate Portfolios</label>

                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Search by student name..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="flex-1 text-xs px-3 py-2 border rounded-xl outline-none transition bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                  />
                  <select
                    value={studentDeptFilter}
                    onChange={(e) => setStudentDeptFilter(e.target.value)}
                    className="text-xs px-3 py-2 border rounded-xl outline-none transition bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                  >
                    <option value="all">All Departments</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="MCA">MCA</option>
                  </select>
                </div>

                <div className="border border-slate-200 dark:border-white/5 rounded-2xl h-48 overflow-y-auto p-3 space-y-2">
                  {students
                    .filter((s) => {
                      const matchSearch = s.fullName.toLowerCase().includes(studentSearch.toLowerCase());
                      const matchDept = studentDeptFilter === "all" || s.department === studentDeptFilter;
                      return matchSearch && matchDept;
                    })
                    .map((s) => {
                      const checked = poolForm.studentIds.includes(s.id);
                      return (
                        <label key={s.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl cursor-pointer text-xs font-semibold">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleStudentInPool(s.id)}
                            className="rounded text-red-600 focus:ring-red-500 border-slate-350"
                          />
                          <div>
                            <span className="block font-bold">{s.fullName} ({s.cgpa} CGPA)</span>
                            <span className="block text-[9px] text-slate-450 leading-none mt-0.5">{s.department} · Class of {s.graduationYear || "N/A"}</span>
                          </div>
                        </label>
                      );
                    })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-white/5 pt-4 mt-6">
              <button
                type="button"
                onClick={() => setPoolModalOpen(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-white/5 text-slate-800 dark:text-white text-xs font-bold uppercase rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-[#781c1c] hover:bg-[#5f1515] text-white text-xs font-bold uppercase rounded-xl transition cursor-pointer"
              >
                Save Pool
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==========================================
          MODAL: SAVE SEARCH AS DYNAMIC TALENT POOL
          ========================================== */}
      {savePoolModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <form
            onSubmit={handleSaveDynamicPool}
            className={`w-full max-w-md rounded-3xl border shadow-2xl p-6 text-left ${isDark ? "bg-[#0b0b0f] border-white/15 text-white" : "bg-white border-slate-200 text-slate-900"
              }`}
          >
            <h3 className="text-base font-black uppercase tracking-wider text-slate-400 mb-2">
              Save Dynamic Talent Pool
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              This pool will automatically update with candidate profiles matching your current filters.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Pool Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mid-Level React Developers"
                  value={savePoolName}
                  onChange={(e) => setSavePoolName(e.target.value)}
                  className="w-full border text-xs px-4 py-2.5 rounded-xl outline-none bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-white/5 pt-4 mt-6">
              <button
                type="button"
                onClick={() => setSavePoolModalOpen(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-white/5 text-slate-800 dark:text-white text-xs font-bold uppercase rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-[#781c1c] hover:bg-[#5f1515] text-white text-xs font-bold uppercase rounded-xl transition cursor-pointer"
              >
                Save Dynamic Pool
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==========================================
          MODAL: VIEW DYNAMIC POOL MEMBERS
          ========================================== */}
      {selectedPoolNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-2xl h-screen shadow-2xl relative overflow-y-auto flex flex-col justify-between p-8 text-left ${isDark ? "bg-[#0b0b0f] text-white" : "bg-white text-slate-900"
            }`}>
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-4">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  {selectedPoolNode.isDynamic ? "DYNAMIC TALENT POOL" : "STATIC TALENT POOL"}
                </span>
                <h3 className="text-lg font-black mt-1">{selectedPoolNode.name}</h3>
              </div>
              <button
                onClick={() => setSelectedPoolNode(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
              >
                <X size={20} />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 py-6 space-y-4 overflow-y-auto pr-1">
              {poolCandidatesLoading ? (
                <div className="text-center py-12">
                  <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-xs text-slate-450 font-semibold">Running matching queries...</p>
                </div>
              ) : poolCandidates.length > 0 ? (
                poolCandidates.map((cand) => (
                  <div
                    key={cand.id}
                    className={`p-5 border rounded-3xl flex justify-between gap-4 text-xs font-semibold ${isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-150"
                      }`}
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2.5">
                        {selectedPoolNode.isDynamic && (
                          <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 text-[8px] rounded-lg">
                            {cand.matchPct}% Match
                          </span>
                        )}
                        <h4 className="font-bold truncate text-sm">{cand.fullName}</h4>
                      </div>
                      <span className="text-[10px] text-slate-450 block">{cand.department} · {cand.cgpa} CGPA</span>
                      <p className="text-[10px] text-slate-400 line-clamp-1 leading-normal italic mt-1">"{cand.bio || "No summary provided."}"</p>
                    </div>

                    <div className="flex gap-2 shrink-0 items-center justify-end">
                      <Link
                        href={`/student/${cand.email.split("@")[0]}`}
                        target="_blank"
                        className="px-3 py-1.5 bg-[#781c1c] text-white rounded-lg text-[10px] font-bold uppercase transition"
                      >
                        Profile
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic text-center py-12">No matching student profiles found inside this pool.</p>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 dark:border-white/5 pt-4 flex justify-end">
              <button
                onClick={() => setSelectedPoolNode(null)}
                className="px-5 py-2 bg-slate-200 dark:bg-white/5 text-slate-800 dark:text-white text-xs font-bold uppercase rounded-xl transition"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

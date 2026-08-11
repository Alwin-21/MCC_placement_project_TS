"use client";

import { useEffect, useState, Suspense } from "react";
import { useResizableSidebar } from "@/hooks/useResizableSidebar";
import MCCLoader from "@/components/MCCLoader";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Users,
  UserCheck,
  Briefcase,
  Landmark,
  Ticket,
  CalendarDays,
  ClipboardList,
  Settings,
  Search,
  CheckSquare,
  Bell,
  Power,
  Clock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  ExternalLink,
  AlertCircle,
  Award,
  Trophy,
  BookOpen,
  Mail,
  MapPin,
  Star,
  FileText,
  Code2,
  Cpu,
  ArrowLeft,
  Heart,
  Share2,
  Download,
  Check,
  Menu,
  User,
  Globe,
  Phone,
  Link as LinkIcon,
  Home,
  Gift,
  Cake,
  MoreHorizontal,
  X,
  Eye,
  Sun,
  Moon
} from "lucide-react";
import api from "@/services/api";
import { parseImageAdjustments } from "@/utils/image";

const InstagramIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
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
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const Github = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
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
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const Linkedin = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
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

function PortfolioPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id;
  const username = params.username;

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [researchPapers, setResearchPapers] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [resumes, setResumes] = useState<any[]>([]);
  const [academicRecords, setAcademicRecords] = useState<any[]>([]);
  const [experiences, setExperiences] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [imgError, setImgError] = useState(false);
  
  // Custom states matching image UI components
  const [currentView, setCurrentView] = useState("dashboard"); // mapping to sidebar
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { sidebarWidth, startResizing, resetWidth } = useResizableSidebar({ storageKey: "mcc_portfolio_sidebar_width" });
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [previewResumeUrl, setPreviewResumeUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [resumeSubTab, setResumeSubTab] = useState<"student" | "portfolio">("student");

  // Theme state — persisted in localStorage under "mcc-theme"
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Initialize theme from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mcc-theme");
      if (saved === "dark") {
        setTheme("dark");
      } else {
        setTheme("light");
      }
    }
  }, []);

  // Sync theme to <html> class and localStorage whenever theme changes
  useEffect(() => {
    if (typeof document !== "undefined") {
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      localStorage.setItem("mcc-theme", theme);
    }
    // Cleanup: restore previous global theme when leaving this page
    return () => {
      const savedTheme = localStorage.getItem("mcc-theme");
      if (savedTheme === "dark" && typeof document !== "undefined") {
        document.documentElement.classList.add("dark");
      } else if (typeof document !== "undefined") {
        document.documentElement.classList.remove("dark");
      }
    };
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === "dark" ? "light" : "dark");
  const isDark = theme === "dark";

  useEffect(() => {
    fetchPortfolio();
  }, [id, username]);

  useEffect(() => {
    const viewParam = searchParams.get("view");
    if (viewParam) {
      setCurrentView(viewParam);
    }
  }, [searchParams]);

  // Real-time clock matching "09:53 pm Thursday" layout
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      const formattedHours = hours.toString().padStart(2, '0');
      const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const day = weekdays[now.getDay()];
      setCurrentTime(`${formattedHours}:${minutes} ${ampm}\n${day}`);
    };
    updateClock();
    const timerId = setInterval(updateClock, 1000);
    return () => clearInterval(timerId);
  }, []);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const url = id ? `/Public/${id}` : `/Public/by-username/${username}`;
      const response = await api.get(url);
      setUser(response.data.user);
      setProfile(response.data.profile);
      setSkills(response.data.skills || []);
      setProjects(response.data.projects || []);
      setCertifications(response.data.certifications || []);
      setResearchPapers(response.data.researchPapers || []);
      setAchievements(response.data.achievements || []);
      setResumes(response.data.resumes || []);
      setAcademicRecords(response.data.academicRecords || []);
      setExperiences(response.data.experiences || []);
    } catch (error) {
      console.error("Failed to load portfolio details", error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleDownloadPDF = async () => {
    const wrapper = document.getElementById("digital-resume-container-wrapper");
    if (!wrapper) return;
    try {
      setDownloading(true);
      const html2canvas = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");

      let pageSheets = Array.from(wrapper.querySelectorAll(".resume-page-sheet"));
      if (pageSheets.length === 0) {
        pageSheets = [wrapper];
      }

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [794, 1123]
      });

      for (let i = 0; i < pageSheets.length; i++) {
        if (i > 0) {
          pdf.addPage([794, 1123], "portrait");
        }

        const sheetEl = pageSheets[i] as HTMLElement;
        const pageCanvas = await html2canvas(sheetEl, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: "#ffffff",
          logging: false,
          onclone: (clonedDoc) => {
            const style = clonedDoc.createElement("style");
            style.innerHTML = `
              * {
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                text-rendering: optimizeLegibility;
              }
            `;
            clonedDoc.head.appendChild(style);
          }
        });

        const pageImgData = pageCanvas.toDataURL("image/jpeg", 0.95);
        pdf.addImage(pageImgData, "JPEG", 0, 0, 794, 1123, undefined, "FAST");
      }

      const fileName = `${(user?.fullName || "student").replace(/[^a-z0-9_\-]/gi, "_")}_Resume.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Could not generate PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return <MCCLoader isDark={isDark} text="Loading Verified Portfolio..." />;
  }

  if (!user) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 text-center transition-colors duration-300 ${isDark ? "bg-[#090d16] text-slate-100" : "bg-[#fcfaf6] text-[#2c2c2c]"}`}>
        <div className="max-w-md w-full p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-[#781c1c]/15 text-[#781c1c] flex items-center justify-center mx-auto mb-4 border border-[#781c1c]/30">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-2xl font-black font-serif tracking-tight text-[#18233c] dark:text-white">Portfolio Record Not Found</h2>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">The requested student directory is empty or the URL slug is invalid.</p>
          <button 
            onClick={() => router.push("/")} 
            className="mt-6 w-full bg-[#781c1c] hover:bg-[#5f1515] text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-[#781c1c]/25 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            Back to Homepage
          </button>
        </div>
      </div>
    );
  }

  const initials = user ? (user.fullName ? user.fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() : "ST") : "ST";

  // Sidebar list matching the student dashboard sections exactly
  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, visible: true },
    { id: "about", label: "About Section", icon: FileText, visible: !!(profile?.bio || profile?.personalStory || profile?.sop) },
    { id: "experience", label: "Experience", icon: Briefcase, visible: experiences.length > 0 },
    { id: "academic", label: "Academic Details", icon: Award, visible: academicRecords.length > 0 },
    { id: "achievements", label: "Achievements", icon: Trophy, visible: achievements.length > 0 },
    { id: "projects-research", label: "Projects & Research", icon: GitBranch, visible: projects.length > 0 || researchPapers.length > 0 },
    { id: "skills", label: "Skills", icon: Code2, visible: skills.length > 0 },
    { id: "licenses-certifications", label: "Licenses & Certifications", icon: Award, visible: certifications.length > 0 },
    { id: "languages", label: "Languages known", icon: Globe, visible: !!profile?.languages?.trim() },
    { id: "test-scores", label: "Test Scores", icon: Award, visible: !!profile?.testScores?.trim() },
    { id: "patents", label: "Patents", icon: FileText, visible: !!profile?.patents?.trim() },
    { id: "media-handles", label: "Other Media handles", icon: LinkIcon, visible: !!(profile?.linkedInUrl || profile?.gitHubUrl || profile?.instagramUrl || profile?.blogUrl || profile?.behanceUrl || profile?.otherHandles) },
    { id: "resume", label: "Resume", icon: FileText, visible: true }
  ].filter(item => item.visible);

  // Map display page titles for breadcrumbs
  const getBreadcrumbTitle = () => {
    const item = sidebarItems.find(item => item.id === currentView);
    return item ? item.label : "Dashboard";
  };

  // Compile active milestones list based on the student's actual experience & education start-years
  const timelineMilestones = [
    ...academicRecords.map((rec) => ({
      date: `${rec.startYear} - ${rec.endYear}`,
      title: rec.fieldOfStudy?.trim() ? `${rec.degree} in ${rec.fieldOfStudy}` : rec.degree,
      subtitle: rec.institution,
      type: "education"
    })),
    ...experiences.map((exp) => ({
      date: `${exp.startDate} - ${exp.isCurrent ? "Present" : exp.endDate}`,
      title: exp.title,
      subtitle: `${exp.company} · ${exp.location}`,
      type: "experience"
    }))
  ];

  // Helper to render active section content
  const renderContent = () => {
    switch (currentView) {
      case "dashboard":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fadeIn">
            {/* LEFT COLUMN - STUDENT BIO & CARD */}
            <div className="lg:col-span-4 space-y-6">
              {/* Profile Hero Card */}
              <div className={`relative overflow-hidden rounded-2xl border transition-all duration-300 shadow-md ${
                isDark ? "bg-[#131d31] border-[#781c1c]/30 text-slate-100" : "bg-white border-[#781c1c]/15 text-[#18233c]"
              }`}>
                {/* Solid Brand Maroon Top Accent Strip */}
                <div className="h-2.5 w-full bg-[#781c1c]" />

                <div className="p-6 text-center lg:text-left space-y-5">
                  <div className="flex flex-col lg:flex-row items-center gap-5">
                    {(profile?.profileImageUrl || user?.profileImageUrl) && !imgError ? (() => {
                      const imgDetails = parseImageAdjustments(profile?.profileImageUrl || user?.profileImageUrl);
                      return (
                        <div className="w-20 h-20 rounded-full ring-4 ring-[#d4af37]/40 shadow-lg overflow-hidden flex items-center justify-center shrink-0 transition-transform duration-300 hover:scale-105">
                          <img 
                            src={imgDetails.src} 
                            onError={() => setImgError(true)}
                            style={imgDetails.style} 
                            className="w-full h-full object-cover"
                            alt={user.fullName} 
                          />
                        </div>
                      );
                    })() : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#781c1c] to-[#18233c] text-white flex items-center justify-center font-black text-2xl ring-4 ring-[#d4af37]/40 shadow-lg shrink-0">
                        {initials}
                      </div>
                    )}
                    <div className="space-y-1.5 overflow-hidden min-w-0 flex-1">
                      <div className="flex items-center justify-center lg:justify-start gap-2 flex-wrap">
                        <h2 className="text-xl sm:text-2xl font-black font-serif tracking-tight leading-tight truncate">
                          {user.fullName}
                        </h2>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" title="Verified Portfolio Profile" />
                      </div>
                      
                      {profile?.course && (
                        <p className={`text-xs font-semibold leading-tight truncate ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                          {profile.course} {profile?.yearOfStudy ? `· ${profile.yearOfStudy}` : ""}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap justify-center lg:justify-start gap-1.5 pt-1">
                        {user.department && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase font-mono tracking-wider ${
                            isDark ? "bg-slate-800 text-slate-300 border border-slate-700" : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}>
                            {user.department}
                          </span>
                        )}
                        {profile?.targetCareer && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/30">
                            {profile.targetCareer}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Student Attributes Details */}
                  <div className={`space-y-2 text-xs pt-4 border-t transition-colors ${
                    isDark ? "border-slate-800 text-slate-300" : "border-slate-150 text-slate-600"
                  }`}>
                    {user.registerNumber && (
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-medium text-slate-400">Register ID</span>
                        <span className="font-mono font-bold">{user.registerNumber}</span>
                      </div>
                    )}
                    {user.email && (
                      <div className="flex justify-between items-center truncate">
                        <span className="text-[11px] font-medium text-slate-400">Email</span>
                        <span className="font-medium truncate max-w-[190px]">{user.email}</span>
                      </div>
                    )}
                    {profile?.phone && (
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-medium text-slate-400">Phone</span>
                        <span className="font-medium">{profile.phone}</span>
                      </div>
                    )}
                    {profile?.cgpa !== undefined && Number(profile.cgpa) > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-medium text-slate-400">Verified CGPA</span>
                        <span className="font-extrabold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          {profile.cgpa} / 10.0
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 3-Column Quick Metrics Arsenal */}
                  <div className={`grid grid-cols-2 gap-3 pt-4 border-t text-center ${
                    isDark ? "border-slate-800" : "border-slate-150"
                  }`}>
                    <div className={`p-3 rounded-xl transition-all ${isDark ? "bg-slate-900/60" : "bg-slate-50"}`}>
                      <span className="block text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Skills Arsenal</span>
                      <span className="block text-xl font-black text-[#781c1c] dark:text-red-400 mt-0.5">{skills.length}</span>
                    </div>
                    <div className={`p-3 rounded-xl transition-all ${isDark ? "bg-slate-900/60" : "bg-slate-50"}`}>
                      <span className="block text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Projects Listed</span>
                      <span className="block text-xl font-black text-[#18233c] dark:text-blue-400 mt-0.5">{projects.length}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Biography summary widget (reflecting student bio) */}
              {profile?.bio && (
                <div className={`rounded-2xl border p-5 shadow-sm transition-all duration-300 ${
                  isDark ? "bg-[#131d31] border-[#781c1c]/25 text-slate-200" : "bg-white border-[#781c1c]/10 text-[#18233c]"
                }`}>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider pb-3 border-b border-slate-500/15 mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-[#781c1c] rounded-full" />
                    <FileText size={15} className="text-[#781c1c]" /> Biography Statement
                  </h3>
                  <p className={`text-sm leading-relaxed italic ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    "{profile.bio}"
                  </p>
                  {profile.personalStory && (
                    <p className={`text-xs leading-relaxed mt-3 pt-3 border-t border-dashed ${isDark ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500"}`}>
                      {profile.personalStory}
                    </p>
                  )}
                </div>
              )}

              {/* Connected Media Handles / Contacts summary widget */}
              {(user.email || profile?.phone || profile?.currentLocation || profile?.linkedInUrl || profile?.gitHubUrl || profile?.gitHubUsername || profile?.behanceUrl) && (
                <div className={`rounded-2xl border p-5 shadow-sm transition-all duration-300 ${
                  isDark ? "bg-[#131d31] border-[#781c1c]/25 text-slate-200" : "bg-white border-[#781c1c]/10 text-[#18233c]"
                }`}>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider pb-3 border-b border-slate-500/15 mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-[#781c1c] rounded-full" />
                    <LinkIcon size={15} className="text-[#781c1c]" /> Contacts & Verified Socials
                  </h3>
                  <div className="space-y-2.5 text-xs">
                    {user.email && (
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-7 h-7 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                          <Mail size={14} />
                        </div>
                        <span className="truncate">{user.email}</span>
                      </div>
                    )}
                    {profile?.phone && (
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                          <Phone size={14} />
                        </div>
                        <span>{profile.phone}</span>
                      </div>
                    )}
                    {profile?.currentLocation && (
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                          <MapPin size={14} />
                        </div>
                        <span>{profile.currentLocation}</span>
                      </div>
                    )}
                    {profile?.linkedInUrl && (
                      <a href={profile.linkedInUrl} target="_blank" className="flex items-center gap-2.5 text-blue-500 hover:underline font-semibold">
                        <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                          <Linkedin size={14} />
                        </div>
                        <span>LinkedIn Profile ↗</span>
                      </a>
                    )}
                    {profile?.gitHubUrl && (
                      <a href={profile.gitHubUrl} target="_blank" className="flex items-center gap-2.5 text-slate-400 hover:text-white transition font-semibold">
                        <div className="w-7 h-7 rounded-lg bg-slate-500/10 text-slate-400 flex items-center justify-center shrink-0">
                          <Github size={14} />
                        </div>
                        <span>GitHub Profile ↗</span>
                      </a>
                    )}
                    {profile?.behanceUrl && (
                      <a href={profile.behanceUrl} target="_blank" className="flex items-center gap-2.5 text-indigo-400 hover:underline font-semibold">
                        <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 font-bold font-serif">
                          Bē
                        </div>
                        <span>Behance Portfolio ↗</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN - DETAILED METRICS & ARRAYS */}
            <div className="lg:col-span-8 space-y-6">
              {/* Row: Student stats metrics cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {/* Academic Metric Card */}
                <button
                  type="button"
                  onClick={() => setCurrentView("academic")}
                  className={`relative overflow-hidden rounded-2xl border p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-[#781c1c] dark:hover:border-blue-400 cursor-pointer text-left w-full focus:outline-none focus:ring-2 focus:ring-[#781c1c]/40 group ${
                    isDark ? "bg-[#131d31] border-[#781c1c]/30" : "bg-white border-[#781c1c]/15"
                  }`}
                >
                  <div className="w-1.5 h-full bg-[#18233c] absolute left-0 top-0 bottom-0 group-hover:bg-[#781c1c] transition-colors" />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest group-hover:text-[#781c1c] dark:group-hover:text-blue-400 transition-colors">Academics</span>
                    <Award size={18} className="text-[#18233c] dark:text-blue-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-[#18233c] dark:text-white mt-2 font-serif">{academicRecords.length}</div>
                  <span className="text-[11px] text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 font-semibold mt-1 flex items-center justify-between transition-colors">
                    <span>Verified Education Records</span>
                    <span className="text-xs font-bold text-[#781c1c] dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">View ↗</span>
                  </span>
                </button>

                {/* Experience Metric Card */}
                <button
                  type="button"
                  onClick={() => setCurrentView("experience")}
                  className={`relative overflow-hidden rounded-2xl border p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-[#781c1c] dark:hover:border-red-400 cursor-pointer text-left w-full focus:outline-none focus:ring-2 focus:ring-[#781c1c]/40 group ${
                    isDark ? "bg-[#131d31] border-[#781c1c]/30" : "bg-white border-[#781c1c]/15"
                  }`}
                >
                  <div className="w-1.5 h-full bg-[#781c1c] absolute left-0 top-0 bottom-0 group-hover:bg-red-500 transition-colors" />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest group-hover:text-[#781c1c] dark:group-hover:text-red-400 transition-colors">Experiences</span>
                    <Briefcase size={18} className="text-[#781c1c] dark:text-red-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-[#781c1c] dark:text-red-400 mt-2 font-serif">{experiences.length}</div>
                  <span className="text-[11px] text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 font-semibold mt-1 flex items-center justify-between transition-colors">
                    <span>Jobs & Internships</span>
                    <span className="text-xs font-bold text-[#781c1c] dark:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">View ↗</span>
                  </span>
                </button>

                {/* Certifications Metric Card */}
                <button
                  type="button"
                  onClick={() => setCurrentView("licenses-certifications")}
                  className={`relative overflow-hidden rounded-2xl border p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-[#d4af37] cursor-pointer text-left w-full focus:outline-none focus:ring-2 focus:ring-[#d4af37]/40 group ${
                    isDark ? "bg-[#131d31] border-[#781c1c]/30" : "bg-white border-[#781c1c]/15"
                  }`}
                >
                  <div className="w-1.5 h-full bg-[#d4af37] absolute left-0 top-0 bottom-0 group-hover:bg-amber-400 transition-colors" />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest group-hover:text-[#d4af37] transition-colors">Certifications</span>
                    <Trophy size={18} className="text-[#d4af37] group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-[#d4af37] mt-2 font-serif">{certifications.length}</div>
                  <span className="text-[11px] text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 font-semibold mt-1 flex items-center justify-between transition-colors">
                    <span>Courses & Licenses</span>
                    <span className="text-xs font-bold text-[#d4af37] opacity-0 group-hover:opacity-100 transition-opacity">View ↗</span>
                  </span>
                </button>
              </div>

              {/* Projects List Card */}
              {projects.length > 0 && (
                <div className={`rounded-2xl border p-6 shadow-md transition-all duration-300 ${
                  isDark ? "bg-[#131d31] border-[#781c1c]/30 text-slate-200" : "bg-white border-[#781c1c]/15 text-[#18233c]"
                }`}>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider pb-3 border-b border-slate-500/15 mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-4 bg-[#781c1c] rounded-full" />
                      <span>Featured Projects & Works</span>
                    </div>
                    <span className="px-2.5 py-0.5 text-[9px] font-extrabold text-white bg-[#781c1c] rounded-full tracking-wider uppercase">
                      Verified
                    </span>
                  </h3>
                  <div className="space-y-4">
                    {projects.slice(0, 3).map((proj, idx) => (
                      <div key={proj.id} className="flex items-start justify-between border-b border-slate-500/10 last:border-0 pb-4 last:pb-0 gap-4">
                        <div className="space-y-1 min-w-0 flex-1">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-[#781c1c] dark:text-amber-400">{idx + 1}.</span> 
                            <span className="truncate">{proj.title}</span>
                          </h4>
                          {proj.technologies && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {proj.technologies.split(",").map((tech: string, i: number) => (
                                <span key={i} className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-semibold ${
                                  isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"
                                }`}>
                                  {tech.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        {(proj.githubUrl || proj.liveUrl) && (
                          <a 
                            href={proj.githubUrl || proj.liveUrl} 
                            target="_blank" 
                            className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 text-xs font-bold shrink-0 flex items-center gap-1 transition"
                          >
                            <ExternalLink size={12} /> View
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline Card */}
              {timelineMilestones.length > 0 && (
                <div className={`rounded-2xl border p-6 shadow-md transition-all duration-300 ${
                  isDark ? "bg-[#131d31] border-[#781c1c]/30 text-slate-200" : "bg-white border-[#781c1c]/15 text-[#18233c]"
                }`}>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider pb-3 border-b border-slate-500/15 mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-[#18233c] dark:bg-blue-400 rounded-full" />
                    <span>Academic & Professional Milestones</span>
                  </h3>
                  <div className="space-y-4">
                    {timelineMilestones.slice(0, 4).map((m, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs border-b border-slate-500/10 last:border-0 pb-3 last:pb-0 gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-3 h-3 rounded-full shrink-0 ${m.type === "education" ? "bg-[#18233c] dark:bg-blue-400" : "bg-[#781c1c]"}`} />
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{m.title}</h4>
                            <p className="text-xs text-slate-400 font-medium truncate">{m.subtitle}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-mono font-bold shrink-0 px-2.5 py-1 rounded-lg border ${
                          isDark ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"
                        }`}>
                          {m.date}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Achievements & Awards Summary */}
              {achievements.length > 0 && (
                <div className={`rounded-2xl border p-6 shadow-md transition-all duration-300 ${
                  isDark ? "bg-[#131d31] border-[#781c1c]/30 text-slate-200" : "bg-white border-[#781c1c]/15 text-[#18233c]"
                }`}>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider pb-3 border-b border-slate-500/15 mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-[#d4af37] rounded-full" />
                    <span>Key Merits & Recognition</span>
                  </h3>
                  <div className="space-y-4">
                    {achievements.slice(0, 3).map((ach) => (
                      <div key={ach.id} className="relative pl-5 border-l-2 border-[#d4af37] text-xs space-y-1">
                        <span className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-[#d4af37]" />
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{ach.title}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">{ach.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case "about":
        return (
          <div className={`rounded-2xl border p-5 sm:p-8 shadow-md transition-all duration-300 animate-fadeIn ${
            isDark ? "bg-[#131d31] border-[#781c1c]/30 text-slate-100" : "bg-white border-[#781c1c]/15 text-[#18233c]"
          }`}>
            <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wider pb-4 border-b border-slate-500/15 mb-6 flex items-center gap-2.5 font-serif">
              <div className="w-1.5 h-5 bg-[#781c1c] rounded-full" />
              <FileText size={18} className="text-[#781c1c]" /> About & Statement of Purpose
            </h3>
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2 font-mono">Short Biography</h4>
                <p className={`text-sm leading-relaxed font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                  {profile?.bio || "No biography added."}
                </p>
              </div>

              {profile?.personalStory && (
                <div className="border-t border-slate-500/15 pt-5">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2 font-mono">Personal Journey & Background</h4>
                  <p className={`text-sm italic leading-relaxed ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    "{profile.personalStory}"
                  </p>
                </div>
              )}

              {profile?.sop && (
                <div className="border-t border-slate-500/15 pt-5">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2 font-mono">Statement of Purpose</h4>
                  <div className={`text-sm leading-relaxed p-4 sm:p-5 rounded-xl border whitespace-pre-line ${
                    isDark ? "bg-slate-900/60 border-slate-800 text-slate-200" : "bg-[#fcfaf6] border-[#781c1c]/15 text-slate-800"
                  }`}>
                    {profile.sop}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case "experience":
        return (
          <div className={`rounded-2xl border p-5 sm:p-8 shadow-md transition-all duration-300 animate-fadeIn ${
            isDark ? "bg-[#131d31] border-[#781c1c]/30 text-slate-100" : "bg-white border-[#781c1c]/15 text-[#18233c]"
          }`}>
            <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wider pb-4 border-b border-slate-500/15 mb-6 flex items-center gap-2.5 font-serif">
              <div className="w-1.5 h-5 bg-[#781c1c] rounded-full" />
              <Briefcase size={18} className="text-[#781c1c]" /> Experience History
            </h3>
            {experiences.length > 0 ? (
              <div className="space-y-8">
                {experiences.map((exp) => (
                  <div key={exp.id} className="relative pl-5 sm:pl-6 border-l-2 border-[#781c1c] last:border-transparent pb-2 space-y-1.5">
                    <span className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-[#781c1c] ring-4 ring-[#781c1c]/20" />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">{exp.title}</h4>
                      <span className="px-3 py-1 text-xs font-extrabold text-[#781c1c] bg-[#781c1c]/10 rounded-full border border-[#781c1c]/20 w-fit">
                        {exp.category}
                      </span>
                    </div>
                    <p className="text-xs font-extrabold text-[#d4af37]">{exp.company} · {exp.location}</p>
                    <p className="text-xs font-mono font-bold text-slate-400">{exp.startDate} - {exp.isCurrent ? "Present" : exp.endDate}</p>
                    <p className={`text-sm mt-2 whitespace-pre-line leading-relaxed ${isDark ? "text-slate-300" : "text-slate-700"}`}>{exp.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-400 text-center py-8">No work experience listed.</div>
            )}
          </div>
        );

      case "academic":
        return (
          <div className={`rounded-2xl border p-5 sm:p-8 shadow-md transition-all duration-300 animate-fadeIn ${
            isDark ? "bg-[#131d31] border-[#781c1c]/30 text-slate-100" : "bg-white border-[#781c1c]/15 text-[#18233c]"
          }`}>
            <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wider pb-4 border-b border-slate-500/15 mb-6 flex items-center gap-2.5 font-serif">
              <div className="w-1.5 h-5 bg-[#18233c] dark:bg-blue-400 rounded-full" />
              <Award size={18} className="text-[#18233c] dark:text-blue-400" /> Education Records & Degrees
            </h3>
            {academicRecords.length > 0 ? (
              <div className="space-y-8">
                {academicRecords.map((rec) => (
                  <div key={rec.id} className="relative pl-5 sm:pl-6 border-l-2 border-[#18233c] dark:border-blue-400 last:border-transparent pb-2 space-y-1.5">
                    <span className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-[#18233c] dark:bg-blue-400 ring-4 ring-blue-500/20" />
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {rec.fieldOfStudy?.trim() ? `${rec.degree} in ${rec.fieldOfStudy}` : rec.degree}
                    </h4>
                    <p className="text-xs font-extrabold text-[#d4af37]">{rec.institution}</p>
                    <p className="text-xs text-slate-400 font-mono font-bold">
                      Duration: {rec.startYear} - {rec.endYear} · Grade: {rec.grade || "N/A"}
                    </p>
                    {rec.attachmentUrl && (
                      <a href={rec.attachmentUrl} target="_blank" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#781c1c] dark:text-red-400 hover:underline mt-2">
                        <FileText size={12} /> View Marksheet Proof ↗
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-400 text-center py-8">No academic records listed.</div>
            )}
          </div>
        );

      case "achievements":
        return (
          <div className={`rounded-2xl border p-5 sm:p-8 shadow-md transition-all duration-300 animate-fadeIn ${
            isDark ? "bg-[#131d31] border-[#781c1c]/30 text-slate-100" : "bg-white border-[#781c1c]/15 text-[#18233c]"
          }`}>
            <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wider pb-4 border-b border-slate-500/15 mb-6 flex items-center gap-2.5 font-serif">
              <div className="w-1.5 h-5 bg-[#d4af37] rounded-full" />
              <Trophy size={18} className="text-[#d4af37]" /> Achievements & Ranks
            </h3>
            {achievements.length > 0 ? (
              <div className="space-y-8">
                {achievements.map((ach) => (
                  <div key={ach.id} className="relative pl-5 sm:pl-6 border-l-2 border-[#d4af37] last:border-transparent pb-2 space-y-1.5">
                    <span className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-[#d4af37] ring-4 ring-[#d4af37]/20" />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">{ach.title}</h4>
                      <span className="px-3 py-1 text-xs font-extrabold text-[#d4af37] bg-[#d4af37]/10 rounded-full border border-[#d4af37]/20 w-fit">
                        {ach.category}
                      </span>
                    </div>
                    <p className="text-xs font-mono font-bold text-slate-400">
                      Year: {ach.achievementDate ? new Date(ach.achievementDate).getFullYear() : ""}
                    </p>
                    <p className={`text-sm mt-2 leading-relaxed ${isDark ? "text-slate-300" : "text-slate-700"}`}>{ach.description}</p>
                    {ach.achievementUrl && (
                      <a href={ach.achievementUrl} target="_blank" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#d4af37] hover:underline mt-2">
                        <ExternalLink size={12} /> View Merit Document ↗
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-400 text-center py-8">No achievements recorded.</div>
            )}
          </div>
        );

      case "projects-research":
        return (
          <div className={`rounded-2xl border p-5 sm:p-8 shadow-md transition-all duration-300 animate-fadeIn space-y-8 ${
            isDark ? "bg-[#131d31] border-[#781c1c]/30 text-slate-100" : "bg-white border-[#781c1c]/15 text-[#18233c]"
          }`}>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wider pb-4 border-b border-slate-500/15 mb-6 flex items-center gap-2.5 font-serif">
                <div className="w-1.5 h-5 bg-emerald-500 rounded-full" />
                <GitBranch size={18} className="text-emerald-500" /> Projects
              </h3>
              {projects.length > 0 ? (
                <div className="space-y-8">
                  {projects.map((proj) => (
                    <div key={proj.id} className="relative pl-5 sm:pl-6 border-l-2 border-emerald-500 last:border-transparent pb-2 space-y-1.5">
                      <span className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">{proj.title}</h4>
                        <span className="px-3 py-1 text-xs font-extrabold text-emerald-500 bg-emerald-500/10 rounded-full border border-emerald-500/20 w-fit">
                          Verified Project
                        </span>
                      </div>
                      {proj.technologies && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {proj.technologies.split(",").map((tech: string, i: number) => (
                            <span key={i} className={`text-xs font-mono px-2.5 py-0.5 rounded-md font-semibold ${
                              isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700"
                            }`}>
                              {tech.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className={`text-sm mt-2 leading-relaxed ${isDark ? "text-slate-300" : "text-slate-700"}`}>{proj.description}</p>
                      {(proj.githubUrl || proj.liveUrl) && (
                        <a href={proj.githubUrl || proj.liveUrl} target="_blank" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-500 hover:underline mt-2">
                          <ExternalLink size={12} /> View Project Link ↗
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-400 text-center py-8">No projects listed.</div>
              )}
            </div>

            <div className="border-t border-slate-500/15 pt-8">
              <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wider pb-4 border-b border-slate-500/15 mb-6 flex items-center gap-2.5 font-serif">
                <div className="w-1.5 h-5 bg-purple-500 rounded-full" />
                <GitBranch size={18} className="text-purple-500" /> Research Publications
              </h3>
              {researchPapers.length > 0 ? (
                <div className="space-y-8">
                  {researchPapers.map((paper) => (
                    <div key={paper.id} className="relative pl-5 sm:pl-6 border-l-2 border-purple-500 last:border-transparent pb-2 space-y-1.5">
                      <span className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-purple-500 ring-4 ring-purple-500/20" />
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">{paper.title}</h4>
                        <span className="px-3 py-1 text-xs font-extrabold text-purple-500 bg-purple-500/10 rounded-full border border-purple-500/20 w-fit">
                          Publication
                        </span>
                      </div>
                      <p className="text-xs font-extrabold text-purple-500">{paper.conference} · {paper.publishedDate ? new Date(paper.publishedDate).toLocaleDateString() : ""}</p>
                      <p className={`text-sm mt-2 leading-relaxed italic ${isDark ? "text-slate-300" : "text-slate-700"}`}>"{paper.abstract}"</p>
                      {paper.paperUrl && (
                        <a href={paper.paperUrl} target="_blank" className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-500 hover:underline mt-2">
                          <ExternalLink size={12} /> Read Paper PDF ↗
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-400 text-center py-8">No publications listed.</div>
              )}
            </div>
          </div>
        );

      case "skills":
        return (
          <div className={`rounded-2xl border p-6 sm:p-8 shadow-md transition-all duration-300 animate-fadeIn ${
            isDark ? "bg-[#131d31] border-[#781c1c]/30 text-slate-100" : "bg-white border-[#781c1c]/15 text-[#18233c]"
          }`}>
            <h3 className="text-base font-extrabold uppercase tracking-wider pb-4 border-b border-slate-500/15 mb-6 flex items-center gap-2.5 font-serif">
              <div className="w-1.5 h-5 bg-[#781c1c] rounded-full" />
              <Code2 size={18} className="text-[#781c1c]" /> Skills Arsenal & Proficiencies
            </h3>
            {skills.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {skills.map((skill) => (
                  <div key={skill.id} className={`p-4 rounded-xl border transition-all duration-300 hover:-translate-y-0.5 flex justify-between items-center ${
                    isDark ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200"
                  }`}>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{skill.name}</h4>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 block">{skill.category}</span>
                    </div>
                    <span className="text-xs font-extrabold px-3 py-1 bg-[#781c1c]/10 text-[#781c1c] dark:text-red-400 border border-[#781c1c]/20 rounded-full uppercase">
                      {skill.level}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-400 text-center py-8">No skills listed yet.</div>
            )}
          </div>
        );

      case "licenses-certifications":
        return (
          <div className={`rounded-2xl border p-6 sm:p-8 shadow-md transition-all duration-300 animate-fadeIn ${
            isDark ? "bg-[#131d31] border-[#781c1c]/30 text-slate-100" : "bg-white border-[#781c1c]/15 text-[#18233c]"
          }`}>
            <h3 className="text-base font-extrabold uppercase tracking-wider pb-4 border-b border-slate-500/15 mb-6 flex items-center gap-2.5 font-serif">
              <div className="w-1.5 h-5 bg-[#781c1c] rounded-full" />
              <Award size={18} className="text-[#781c1c]" /> Licenses & Certifications
            </h3>
            {certifications.length > 0 ? (
              <div className="space-y-8">
                {certifications.map((cert) => (
                  <div key={cert.id} className="relative pl-6 border-l-2 border-[#781c1c] last:border-transparent pb-2 space-y-1.5">
                    <span className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-[#781c1c] ring-4 ring-[#781c1c]/20" />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">{cert.title}</h4>
                      <span className="px-3 py-1 text-xs font-extrabold text-[#781c1c] bg-[#781c1c]/10 rounded-full border border-[#781c1c]/20 w-fit">
                        {cert.category}
                      </span>
                    </div>
                    <p className="text-xs font-extrabold text-[#d4af37]">{cert.issuer}</p>
                    <p className="text-xs font-mono font-bold text-slate-400">
                      Year: {cert.issueDate ? new Date(cert.issueDate).getFullYear() : ""}
                    </p>
                    {cert.certificateUrl && (
                      <a href={cert.certificateUrl} target="_blank" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#781c1c] dark:text-red-400 hover:underline mt-2">
                        <ExternalLink size={12} /> View Certification Document ↗
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-400 text-center py-8">No certifications listed.</div>
            )}
          </div>
        );

      case "languages":
        return (
          <div className={`rounded-2xl border p-6 sm:p-8 shadow-md transition-all duration-300 animate-fadeIn ${
            isDark ? "bg-[#131d31] border-[#781c1c]/30 text-slate-100" : "bg-white border-[#781c1c]/15 text-[#18233c]"
          }`}>
            <h3 className="text-base font-extrabold uppercase tracking-wider pb-4 border-b border-slate-500/15 mb-6 flex items-center gap-2.5 font-serif">
              <div className="w-1.5 h-5 bg-[#18233c] dark:bg-blue-400 rounded-full" />
              <Globe size={18} className="text-[#18233c] dark:text-blue-400" /> Languages Known
            </h3>
            {profile?.languages ? (
              <div className="flex flex-wrap gap-3">
                {profile.languages.split(",").map((l: string, i: number) => (
                  <span key={i} className={`px-4 py-2 text-sm font-bold rounded-xl border shadow-sm ${
                    isDark ? "bg-slate-900 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-[#18233c]"
                  }`}>
                    {l.trim()}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-400 text-center py-8">No languages listed.</div>
            )}
          </div>
        );

      case "test-scores":
        return (
          <div className={`rounded-2xl border p-6 sm:p-8 shadow-md transition-all duration-300 animate-fadeIn ${
            isDark ? "bg-[#131d31] border-[#781c1c]/30 text-slate-100" : "bg-white border-[#781c1c]/15 text-[#18233c]"
          }`}>
            <h3 className="text-base font-extrabold uppercase tracking-wider pb-4 border-b border-slate-500/15 mb-6 flex items-center gap-2.5 font-serif">
              <div className="w-1.5 h-5 bg-[#781c1c] rounded-full" />
              <Award size={18} className="text-[#781c1c]" /> Standardized Test Scores
            </h3>
            {profile?.testScores ? (
              <div className={`p-5 rounded-xl border text-sm leading-relaxed whitespace-pre-line font-mono ${
                isDark ? "bg-slate-900/60 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-700"
              }`}>
                {profile.testScores}
              </div>
            ) : (
              <div className="text-sm text-slate-400 text-center py-8">No test scores recorded.</div>
            )}
          </div>
        );

      case "patents":
        return (
          <div className={`rounded-2xl border p-6 sm:p-8 shadow-md transition-all duration-300 animate-fadeIn ${
            isDark ? "bg-[#131d31] border-[#781c1c]/30 text-slate-100" : "bg-white border-[#781c1c]/15 text-[#18233c]"
          }`}>
            <h3 className="text-base font-extrabold uppercase tracking-wider pb-4 border-b border-slate-500/15 mb-6 flex items-center gap-2.5 font-serif">
              <div className="w-1.5 h-5 bg-[#781c1c] rounded-full" />
              <FileText size={18} className="text-[#781c1c]" /> Patents
            </h3>
            {profile?.patents ? (
              <div className={`p-5 rounded-xl border text-sm leading-relaxed whitespace-pre-line ${
                isDark ? "bg-slate-900/60 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-700"
              }`}>
                {profile.patents}
              </div>
            ) : (
              <div className="text-sm text-slate-400 text-center py-8">No patents listed.</div>
            )}
          </div>
        );

      case "media-handles":
        return (
          <div className={`rounded-2xl border p-6 sm:p-8 shadow-md transition-all duration-300 animate-fadeIn ${
            isDark ? "bg-[#131d31] border-[#781c1c]/30 text-slate-100" : "bg-white border-[#781c1c]/15 text-[#18233c]"
          }`}>
            <h3 className="text-base font-extrabold uppercase tracking-wider pb-4 border-b border-slate-500/15 mb-6 flex items-center gap-2.5 font-serif">
              <div className="w-1.5 h-5 bg-[#781c1c] rounded-full" />
              <LinkIcon size={18} className="text-[#781c1c]" /> Connected Social Handles
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {profile?.linkedInUrl && (
                <a href={profile.linkedInUrl} target="_blank" className={`p-5 rounded-xl border flex items-center gap-4 transition-all duration-300 hover:-translate-y-1 min-w-0 ${
                  isDark ? "bg-slate-900/60 border-slate-800 hover:border-blue-500" : "bg-slate-50 border-slate-200 hover:border-blue-400"
                }`}>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                    <Linkedin size={22} />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-sm block">LinkedIn Profile ↗</span>
                    <span className="text-xs text-slate-400 block mt-0.5 truncate">{profile.linkedInUrl}</span>
                  </div>
                </a>
              )}
              {profile?.gitHubUrl && (
                <a href={profile.gitHubUrl} target="_blank" className={`p-5 rounded-xl border flex items-center gap-4 transition-all duration-300 hover:-translate-y-1 min-w-0 ${
                  isDark ? "bg-slate-900/60 border-slate-800 hover:border-slate-500" : "bg-slate-50 border-slate-200 hover:border-slate-400"
                }`}>
                  <div className="w-10 h-10 rounded-xl bg-slate-500/10 text-slate-400 flex items-center justify-center shrink-0">
                    <Github size={22} />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-sm block">GitHub Profile ↗</span>
                    <span className="text-xs text-slate-400 block mt-0.5 truncate">{profile.gitHubUrl}</span>
                  </div>
                </a>
              )}
              {profile?.instagramUrl && (
                <a href={profile.instagramUrl} target="_blank" className={`p-5 rounded-xl border flex items-center gap-4 transition-all duration-300 hover:-translate-y-1 min-w-0 ${
                  isDark ? "bg-slate-900/60 border-slate-800 hover:border-pink-500" : "bg-slate-50 border-slate-200 hover:border-pink-400"
                }`}>
                  <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center shrink-0">
                    <InstagramIcon size={22} />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-sm block">Instagram Profile ↗</span>
                    <span className="text-xs text-slate-400 block mt-0.5 truncate">{profile.instagramUrl}</span>
                  </div>
                </a>
              )}
              {profile?.blogUrl && (
                <a href={profile.blogUrl} target="_blank" className={`p-5 rounded-xl border flex items-center gap-4 transition-all duration-300 hover:-translate-y-1 min-w-0 ${
                  isDark ? "bg-slate-900/60 border-slate-800 hover:border-emerald-500" : "bg-slate-50 border-slate-200 hover:border-emerald-400"
                }`}>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                    <Globe size={22} />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-sm block">Blog / Website ↗</span>
                    <span className="text-xs text-slate-400 block mt-0.5 truncate">{profile.blogUrl}</span>
                  </div>
                </a>
              )}
              {profile?.behanceUrl && (
                <a href={profile.behanceUrl} target="_blank" className={`p-5 rounded-xl border flex items-center gap-4 transition-all duration-300 hover:-translate-y-1 min-w-0 ${
                  isDark ? "bg-slate-900/60 border-slate-800 hover:border-indigo-500" : "bg-slate-50 border-slate-200 hover:border-indigo-400"
                }`}>
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-serif font-black text-xl shrink-0">
                    Bē
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-sm block">Behance Portfolio ↗</span>
                    <span className="text-xs text-slate-400 block mt-0.5 truncate">{profile.behanceUrl}</span>
                  </div>
                </a>
              )}
              {profile?.otherHandles && (
                <div className={`p-5 rounded-xl border sm:col-span-2 min-w-0 overflow-hidden ${
                  isDark ? "bg-slate-900/60 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-700"
                }`}>
                  <span className="font-bold text-sm block">Other Information / Handles</span>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed break-words">{profile.otherHandles}</p>
                </div>
              )}
            </div>
          </div>
        );

      case "resume": {
        // Item-level partitioning matching Resume Builder logic to ensure clean page boundaries
        const p1Sections: { key: string; items?: any[]; isContinued?: boolean }[] = [];
        const p2Sections: { key: string; items?: any[]; isContinued?: boolean }[] = [];

        let accumP1 = 0;
        // Conservative budget for Page 1 content with MIN_SPACE_REMAINING safety buffer
        const P1_BUDGET = 740;
        const MIN_SPACE_REMAINING = 70;

        const checkFitsP1 = (needed: number) => accumP1 + needed + MIN_SPACE_REMAINING <= P1_BUDGET;

        // 1. Executive Summary
        if (profile?.bio || profile?.personalStory || profile?.sop) {
          const textLen = (profile?.bio || profile?.personalStory || profile?.sop || "").length;
          const summaryH = 42 + Math.min(Math.ceil(textLen / 95) * 16, 120);
          if (checkFitsP1(summaryH)) {
            p1Sections.push({ key: "summary" });
            accumP1 += summaryH;
          } else {
            p2Sections.push({ key: "summary" });
          }
        }

        // 2. Education & Academic Records
        if (academicRecords.length > 0) {
          const headerH = 34;
          const itemH = 46;
          const p1Items: any[] = [];
          const p2Items: any[] = [];

          academicRecords.forEach((rec) => {
            const needed = (p1Items.length === 0 ? headerH : 0) + itemH;
            if (checkFitsP1(needed)) {
              p1Items.push(rec);
              accumP1 += needed;
            } else {
              p2Items.push(rec);
            }
          });

          if (p1Items.length > 0) {
            p1Sections.push({ key: "academic", items: p1Items });
          }
          if (p2Items.length > 0) {
            p2Sections.push({ key: "academic", items: p2Items, isContinued: p1Items.length > 0 });
          }
        }

        // 3. Professional Experience
        if (experiences.length > 0) {
          const headerH = 34;
          const p1Items: any[] = [];
          const p2Items: any[] = [];

          experiences.forEach((exp) => {
            const descLen = (exp.description || "").length;
            const expH = 45 + Math.min(Math.ceil(descLen / 90) * 16, 95);
            const needed = (p1Items.length === 0 ? headerH : 0) + expH;
            if (checkFitsP1(needed)) {
              p1Items.push(exp);
              accumP1 += needed;
            } else {
              p2Items.push(exp);
            }
          });

          if (p1Items.length > 0) {
            p1Sections.push({ key: "experience", items: p1Items });
          }
          if (p2Items.length > 0) {
            p2Sections.push({ key: "experience", items: p2Items, isContinued: p1Items.length > 0 });
          }
        }

        // 4. Projects & Research Publications
        const allProjects = [
          ...projects.map((p) => ({ ...p, itemType: "project" })),
          ...researchPapers.map((r) => ({ ...r, itemType: "paper" }))
        ];
        if (allProjects.length > 0) {
          const headerH = 34;
          const p1Items: any[] = [];
          const p2Items: any[] = [];

          allProjects.forEach((proj) => {
            const projH = proj.itemType === "project" ? 65 : 55;
            const needed = (p1Items.length === 0 ? headerH : 0) + projH;
            if (checkFitsP1(needed)) {
              p1Items.push(proj);
              accumP1 += needed;
            } else {
              p2Items.push(proj);
            }
          });

          if (p1Items.length > 0) {
            p1Sections.push({ key: "projects", items: p1Items });
          }
          if (p2Items.length > 0) {
            p2Sections.push({ key: "projects", items: p2Items, isContinued: p1Items.length > 0 });
          }
        }

        // 5. Skills & Competencies
        if (skills.length > 0) {
          const headerH = 34;
          const rows = Math.ceil(skills.length / 3);
          const skillsH = headerH + rows * 28;
          if (checkFitsP1(skillsH)) {
            p1Sections.push({ key: "skills" });
            accumP1 += skillsH;
          } else {
            p2Sections.push({ key: "skills" });
          }
        }

        // 6. Certifications & Merits
        if (certifications.length > 0 || achievements.length > 0) {
          const headerH = 34;
          const totalCert = certifications.length + achievements.length;
          const certH = headerH + Math.ceil(totalCert / 2) * 44;
          if (checkFitsP1(certH)) {
            p1Sections.push({ key: "certifications" });
            accumP1 += certH;
          } else {
            p2Sections.push({ key: "certifications" });
          }
        }

        const pagesList = [p1Sections];
        if (p2Sections.length > 0) {
          pagesList.push(p2Sections);
        }
        const totalPages = pagesList.length;

        // Render helper for an individual section on a specific page sheet
        const renderSectionItem = (sec: { key: string; items?: any[]; isContinued?: boolean }) => {
          const headingLabel = (baseTitle: string) =>
            sec.isContinued ? `${baseTitle} (Continued)` : baseTitle;

          switch (sec.key) {
            case "summary":
              return (
                <div key="summary" className="space-y-1.5 print-avoid-break">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-1 mb-2">
                    <div className="w-1 h-3.5 bg-[#781c1c] rounded-sm shrink-0" />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#18233c] font-mono">
                      Executive Summary
                    </h4>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed italic text-justify">
                    {profile?.bio || profile?.personalStory || profile?.sop}
                  </p>
                </div>
              );

            case "academic":
              return (
                <div key="academic" className="space-y-2 print-avoid-break">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-1 mb-2">
                    <div className="w-1 h-3.5 bg-[#781c1c] rounded-sm shrink-0" />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#18233c] font-mono">
                      {headingLabel("Education & Qualifications")}
                    </h4>
                  </div>
                  <div className="space-y-3">
                    {(sec.items || academicRecords).map((rec) => (
                      <div key={rec.id} className="flex justify-between items-start text-xs">
                        <div>
                          <h5 className="font-bold text-[#18233c]">
                            {rec.fieldOfStudy?.trim() ? `${rec.degree} in ${rec.fieldOfStudy}` : rec.degree}
                          </h5>
                          <p className="text-[11px] text-slate-500 font-medium">{rec.institution}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono text-[11px] font-bold text-slate-600 block">{rec.startYear} - {rec.endYear}</span>
                          {rec.grade && <span className="text-[10px] text-emerald-600 font-bold block">Grade: {rec.grade}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );

            case "experience":
              return (
                <div key="experience" className="space-y-2 print-avoid-break">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-1 mb-2">
                    <div className="w-1 h-3.5 bg-[#781c1c] rounded-sm shrink-0" />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#18233c] font-mono">
                      {headingLabel("Professional Experience")}
                    </h4>
                  </div>
                  <div className="space-y-3.5">
                    {(sec.items || experiences).map((exp) => (
                      <div key={exp.id} className="space-y-1 text-xs">
                        <div className="flex justify-between items-center">
                          <h5 className="font-bold text-[#18233c]">{exp.title}</h5>
                          <span className="font-mono text-[11px] font-bold text-slate-600 shrink-0">
                            {exp.startDate} - {exp.isCurrent ? "Present" : exp.endDate}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#781c1c] font-semibold">{exp.company} · {exp.location}</p>
                        <p className="text-xs text-slate-650 leading-relaxed whitespace-pre-line pt-0.5">{exp.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );

            case "projects": {
              const itemsToRender = sec.items || [
                ...projects.map((p) => ({ ...p, itemType: "project" })),
                ...researchPapers.map((r) => ({ ...r, itemType: "paper" }))
              ];
              return (
                <div key="projects" className="space-y-2 print-avoid-break">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-1 mb-2">
                    <div className="w-1 h-3.5 bg-[#781c1c] rounded-sm shrink-0" />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#18233c] font-mono">
                      {headingLabel("Projects & Research")}
                    </h4>
                  </div>
                  <div className="space-y-3">
                    {itemsToRender.map((item: any) =>
                      item.itemType === "project" ? (
                        <div key={item.id} className="text-xs space-y-0.5">
                          <div className="flex justify-between items-center">
                            <h5 className="font-bold text-[#18233c]">{item.title}</h5>
                            {(item.githubUrl || item.liveUrl) && (
                              <a href={item.githubUrl || item.liveUrl} target="_blank" className="text-blue-600 hover:underline text-[10px] font-bold shrink-0">
                                View Link ↗
                              </a>
                            )}
                          </div>
                          {item.technologies && (
                            <p className="text-[10px] text-slate-450 font-mono">Technologies: {item.technologies}</p>
                          )}
                          <p className="text-xs text-slate-655 leading-relaxed">{item.description}</p>
                        </div>
                      ) : (
                        <div key={item.id} className="text-xs space-y-0.5">
                          <h5 className="font-bold text-[#18233c]">{item.title}</h5>
                          <p className="text-[10px] text-purple-700 font-semibold">{item.conference}</p>
                          <p className="text-xs text-slate-600 italic">"{item.abstract}"</p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              );
            }

            case "skills":
              return (
                <div key="skills" className="space-y-2 print-avoid-break">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-1 mb-2">
                    <div className="w-1 h-3.5 bg-[#781c1c] rounded-sm shrink-0" />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#18233c] font-mono">
                      Skills & Competencies
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {skills.map((skill) => (
                      <span
                        key={skill.id}
                        className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-[#18233c] rounded-md text-[11px] font-semibold"
                      >
                        {skill.name} {skill.level ? `(${skill.level})` : ""}
                      </span>
                    ))}
                  </div>
                </div>
              );

            case "certifications":
              return (
                <div key="certifications" className="space-y-2 print-avoid-break">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-1 mb-2">
                    <div className="w-1 h-3.5 bg-[#781c1c] rounded-sm shrink-0" />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#18233c] font-mono">
                      Certifications & Merits
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {certifications.map((cert) => (
                      <div key={cert.id} className="bg-slate-50/60 p-2.5 rounded-lg border border-slate-150">
                        <h5 className="font-bold text-[#18233c]">{cert.title}</h5>
                        <p className="text-[10px] text-slate-500">{cert.issuer}</p>
                      </div>
                    ))}
                    {achievements.map((ach) => (
                      <div key={ach.id} className="bg-slate-50/60 p-2.5 rounded-lg border border-slate-150">
                        <h5 className="font-bold text-[#18233c]">{ach.title}</h5>
                        <p className="text-[10px] text-slate-500">{ach.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );

            default:
              return null;
          }
        };

        return (
          <div className="space-y-6 animate-fadeIn">
            {/* Action Bar Header */}
            <div className={`rounded-2xl border p-5 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-300 ${
              isDark ? "bg-[#131d31] border-[#781c1c]/30 text-slate-100" : "bg-white border-[#781c1c]/15 text-[#18233c]"
            }`}>
              <div>
                <h3 className="text-sm font-extrabold flex items-center gap-2 font-serif">
                  <FileText size={18} className="text-[#781c1c]" /> Placement Resume Options
                </h3>
                <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {resumeSubTab === "student"
                    ? "Preview and download official CV files uploaded directly by the student."
                    : "Preview and download the verified professional placement resume compiled from portfolio data."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                {/* Two Explicit Options Buttons */}
                <div className={`flex items-center p-1 rounded-xl text-xs font-bold shrink-0 border ${
                  isDark ? "bg-slate-900 border-slate-800" : "bg-slate-100 border-slate-200"
                }`}>
                  <button
                    onClick={() => setResumeSubTab("student")}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      resumeSubTab === "student"
                        ? isDark ? "bg-[#781c1c] text-white shadow-xs font-black" : "bg-white text-[#781c1c] shadow-xs font-black"
                        : isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Student's Resume {resumes.length > 0 ? `(${resumes.length})` : ""}
                  </button>
                  <button
                    onClick={() => setResumeSubTab("portfolio")}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      resumeSubTab === "portfolio"
                        ? isDark ? "bg-[#781c1c] text-white shadow-xs font-black" : "bg-white text-[#781c1c] shadow-xs font-black"
                        : isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Portfolio Created Resume
                  </button>
                </div>

                {/* Download Button for Portfolio Created Resume */}
                {resumeSubTab === "portfolio" && (
                  <button
                    onClick={handleDownloadPDF}
                    disabled={downloading}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-[#781c1c] hover:bg-[#5f1515] text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {downloading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Generating PDF...</span>
                      </>
                    ) : (
                      <>
                        <Download size={14} />
                        <span>Download Portfolio Resume</span>
                      </>
                    )}
                  </button>
                )}

                {/* Download Button for Student's Uploaded Resume */}
                {resumeSubTab === "student" && resumes.length > 0 && (
                  <a
                    href={resumes[0].resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-[#781c1c] hover:bg-[#5f1515] text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer text-decoration-none"
                  >
                    <Download size={14} />
                    <span>Download Student's Resume</span>
                  </a>
                )}
              </div>
            </div>

            {/* Option 1: Student's Resume (Uploaded CV Documents) */}
            {resumeSubTab === "student" && (
              <div className={`rounded-2xl border p-6 shadow-md space-y-4 transition-all duration-300 ${
                isDark ? "bg-[#131d31] border-[#781c1c]/30 text-slate-100" : "bg-white border-[#781c1c]/15 text-[#18233c]"
              }`}>
                <h4 className="text-xs font-bold uppercase tracking-wider pb-3 border-b border-slate-500/15 flex items-center gap-2">
                  <FileText size={15} className="text-[#781c1c]" /> Official Student Uploaded Resume Documents
                </h4>
                {resumes.length > 0 ? (
                  <div className="space-y-4">
                    {resumes.map((res) => (
                      <div key={res.id} className={`border p-5 rounded-xl flex flex-col ${
                        isDark ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200"
                      }`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center shrink-0">
                              <FileText size={20} />
                            </div>
                            <div>
                              <h5 className="font-bold text-xs">{res.resumeTitle || "Student Verified CV"}</h5>
                              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Uploaded Student Document</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setPreviewResumeUrl(previewResumeUrl === res.resumeUrl ? null : res.resumeUrl)}
                              className={`flex items-center gap-1.5 px-4 py-2 border rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                                isDark ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              <Eye size={14} />
                              <span>{previewResumeUrl === res.resumeUrl ? "Hide Preview" : "Preview Resume"}</span>
                            </button>
                          </div>
                        </div>
                        {previewResumeUrl === res.resumeUrl && (
                          <div className="mt-4 w-full h-[500px] sm:h-[650px] rounded-xl overflow-hidden border border-slate-500/20 shadow-inner bg-slate-100">
                            <iframe src={res.resumeUrl} className="w-full h-full border-none" title="Student Resume Preview" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`text-center py-10 px-4 rounded-xl border border-dashed ${
                    isDark ? "bg-slate-900/40 border-slate-800" : "bg-slate-50 border-slate-200"
                  }`}>
                    <FileText size={32} className="mx-auto text-slate-400 mb-2" />
                    <h5 className="font-bold text-xs">No Student Uploaded Resume Available</h5>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      The student has not uploaded a custom CV document yet. You can click on the <span className="font-bold text-[#781c1c]">"Portfolio Created Resume"</span> option above to preview and download the dynamically generated resume.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Option 2: Portfolio Created Resume (Digital Live A4 Sheets) */}
            {resumeSubTab === "portfolio" && (
              <div className="space-y-3">
                {/* Mobile scroll tip */}
                <div className="md:hidden text-center text-[11px] font-mono text-amber-500 bg-amber-500/10 border border-amber-500/20 py-2 px-3 rounded-xl font-bold">
                  📱 Mobile View: Swipe horizontally to view full A4 PDF sheet, or use the download button above.
                </div>

                <div id="digital-resume-container-wrapper" className="w-full overflow-x-auto flex flex-col items-center gap-8 pb-8">
                  {pagesList.map((pageSections, pageIdx) => (
                  <div
                    key={`sheet_page_${pageIdx + 1}`}
                    className="resume-page-sheet relative bg-white border border-slate-200 shadow-xl rounded-lg p-8 sm:p-10 font-sans text-slate-800 text-xs leading-relaxed flex flex-col justify-between select-text"
                    style={{
                      width: "794px",
                      height: "1123px",
                      boxSizing: "border-box"
                    }}
                  >
                    {/* Sheet Body Content */}
                    <div className="space-y-4 flex-1 overflow-hidden">
                      {/* HEADER ON PAGE 1 ONLY */}
                      {pageIdx === 0 && (
                        <div className="border-b-2 border-[#781c1c] pb-4 flex justify-between items-start">
                          <div className="space-y-1">
                            <h1 className="text-2xl font-black font-serif text-[#18233c] tracking-tight">{user.fullName}</h1>
                            <p className="text-xs font-bold text-[#781c1c] uppercase tracking-wider">
                              {profile?.targetCareer || profile?.course || "Madras Christian College Graduate"}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 font-medium pt-1">
                              {user.email && (
                                <span className="flex items-center gap-1">
                                  <Mail size={11} className="text-slate-400" /> {user.email}
                                </span>
                              )}
                              {profile?.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone size={11} className="text-slate-400" /> {profile.phone}
                                </span>
                              )}
                              {profile?.currentLocation && (
                                <span className="flex items-center gap-1">
                                  <MapPin size={11} className="text-slate-400" /> {profile.currentLocation}
                                </span>
                              )}
                              {user.department && (
                                <span className="text-slate-400 font-mono text-[10px]">
                                  Dept: {user.department}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#18233c] font-semibold pt-1">
                              {profile?.linkedInUrl && (
                                <a href={profile.linkedInUrl} target="_blank" className="hover:underline flex items-center gap-1">
                                  <Linkedin size={11} className="text-[#0a66c2]" /> LinkedIn
                                </a>
                              )}
                              {profile?.gitHubUrl && (
                                <a href={profile.gitHubUrl} target="_blank" className="hover:underline flex items-center gap-1">
                                  <Github size={11} className="text-slate-700" /> GitHub
                                </a>
                              )}
                              {profile?.blogUrl && (
                                <a href={profile.blogUrl} target="_blank" className="hover:underline flex items-center gap-1">
                                  <Globe size={11} className="text-emerald-600" /> Portfolio
                                </a>
                              )}
                              {profile?.behanceUrl && (
                                <a href={profile.behanceUrl} target="_blank" className="hover:underline flex items-center gap-1">
                                  <span className="font-bold text-[10px] text-blue-600 font-serif">Bē</span> Behance
                                </a>
                              )}
                            </div>
                          </div>

                          {(profile?.profileImageUrl || user?.profileImageUrl) && !imgError && (() => {
                            const imgDetails = parseImageAdjustments(profile?.profileImageUrl || user?.profileImageUrl);
                            return (
                              <div className="w-16 h-16 rounded-xl border-2 border-[#781c1c]/20 overflow-hidden shrink-0 shadow-xs">
                                <img
                                  src={imgDetails.src}
                                  onError={() => setImgError(true)}
                                  style={imgDetails.style}
                                  className="w-full h-full object-cover"
                                  alt={user.fullName}
                                />
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* Header Continuation Mini Banner for Page 2+ */}
                      {pageIdx > 0 && (
                        <div className="border-b border-slate-200 pb-2 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-serif font-extrabold text-[#18233c]">{user.fullName}</span>
                            <span className="text-slate-400 mx-2">|</span>
                            <span className="text-[#781c1c] font-semibold">{profile?.targetCareer || "Placement Resume"}</span>
                          </div>
                          <span className="font-mono text-[10px] text-slate-400 font-bold">Page {pageIdx + 1} of {totalPages}</span>
                        </div>
                      )}

                      {/* Page Sections */}
                      <div className="space-y-3.5">
                        {pageSections.map((sec) => renderSectionItem(sec))}
                      </div>
                    </div>

                    {/* FOOTER STAMP AT THE BOTTOM OF EACH SHEET */}
                    <div className="pt-4 border-t border-slate-150 flex justify-between items-center text-[10px] text-slate-400 font-mono shrink-0">
                      <span>Madras Christian College Portfolio Verified CV</span>
                      <span>Page {pageIdx + 1} of {totalPages}</span>
                      <span>Ref: MCC-{user.id}-{new Date().getFullYear()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className={`h-screen overflow-hidden flex font-sans selection:bg-[#781c1c]/20 selection:text-[#781c1c] transition-colors duration-300 ${isDark ? "bg-[#0f1623] text-slate-200" : "bg-[#fcfaf6] text-[#2c2c2c]"}`}>
      
      {/* LEFT SIDEBAR (DESKTOP) */}
      <aside 
        style={{ width: isSidebarCollapsed ? "64px" : `${sidebarWidth}px` }}
        className={`bg-[#18233c] text-slate-300 flex flex-col relative shrink-0 select-none hidden md:flex border-r border-[#781c1c]/15 mcc-sidebar ${
          isSidebarCollapsed ? "w-16" : ""
        }`}
      >
        {/* Sidebar Brand Header - MCC Navy / Gold details with Prominent Logo & Institutional Tagline */}
        <div className={`border-b flex items-center justify-center py-2.5 px-3 shrink-0 transition-colors duration-300 ${
          isDark 
            ? "bg-gradient-to-b from-[#18233c] to-[#111927] border-slate-700/30" 
            : "bg-[#f4efe4] border-slate-300/60 shadow-xs"
        }`}>
          {!isSidebarCollapsed ? (
            <div className="flex items-center justify-center gap-3.5 w-full">
              <img 
                src={isDark ? "/mcc-logo-dark.png" : "/mcc-logo.png"}
                className="h-20 md:h-[88px] w-auto max-w-full object-contain rounded-lg transition-transform duration-200 hover:scale-[1.02] shrink-0" 
                alt="Madras Christian College Logo" 
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-white/10 dark:bg-slate-900/50 flex items-center justify-center mx-auto border-2 border-[#d4af37] shadow-md overflow-hidden p-1 transition-transform hover:scale-110" title="Madras Christian College">
              <img src={isDark ? "/mcc-crest-dark.png" : "/mcc-crest.png"} className="w-full h-full object-contain" alt="MCC Crest" />
            </div>
          )}
        </div>

        {/* Student Mini Avatar Card */}
        <div className={`p-4 border-b border-slate-700/30 flex items-center gap-3 ${
          isSidebarCollapsed ? "justify-center" : ""
        }`}>
          {(profile?.profileImageUrl || user?.profileImageUrl) && !imgError ? (() => {
            const imgDetails = parseImageAdjustments(profile?.profileImageUrl || user?.profileImageUrl);
            return (
              <div className="w-9 h-9 rounded-full border-2 border-[#d4af37] shadow-sm overflow-hidden flex items-center justify-center shrink-0">
                <img 
                  src={imgDetails.src} 
                  onError={() => setImgError(true)}
                  style={imgDetails.style} 
                  className="w-full h-full object-cover" 
                  alt={user.fullName} 
                />
              </div>
            );
          })() : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#781c1c] to-[#18233c] text-white flex items-center justify-center text-xs font-black border-2 border-[#d4af37]">
              {initials}
            </div>
          )}
          {!isSidebarCollapsed && (
            <div className="overflow-hidden">
              <h4 className="text-xs font-bold text-white truncate max-w-[135px] flex items-center gap-1.5">
                {user.fullName}
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shrink-0 animate-pulse" />
              </h4>
              <span className="text-[10px] text-slate-400 font-mono block truncate">
                {user.department || "MCC Student"}
              </span>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center transition-all duration-200 px-3.5 py-2.5 rounded-xl text-xs font-bold text-left cursor-pointer ${
                  isActive
                    ? "mcc-active-tab font-black shadow-sm"
                    : "text-slate-300 hover:bg-slate-800/50 hover:text-white hover:translate-x-0.5"
                } ${isSidebarCollapsed ? "justify-center px-0" : ""}`}
                title={item.label}
              >
                <Icon size={16} className={`shrink-0 ${isActive ? "text-[#d4af37]" : "text-slate-400"}`} />
                {!isSidebarCollapsed && <span className="ml-3 truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer: Collapse Chevron */}
        <div className={`p-3 border-t border-slate-700/50 flex items-center justify-end ${
          isSidebarCollapsed ? "justify-center" : "justify-end"
        }`}>
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="w-9 h-9 rounded-xl hover:bg-slate-800/60 flex items-center justify-center text-slate-400 hover:text-white transition shrink-0 cursor-pointer"
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Interactive Drag Handle for Sidebar Resizing */}
        {!isSidebarCollapsed && (
          <div
            onMouseDown={startResizing}
            onDoubleClick={resetWidth}
            title="Click and drag to resize sidebar width. Double-click to reset."
            className="absolute top-0 -right-1 bottom-0 w-2.5 cursor-col-resize hover:bg-[#781c1c]/50 active:bg-[#781c1c] transition-colors z-40 group flex items-center justify-center"
          >
            <div className="w-0.5 h-10 bg-slate-500/30 group-hover:bg-[#d4af37] rounded-full" />
          </div>
        )}
      </aside>

      {/* MOBILE DRAWER SIDEBAR OVERLAY */}
      {showMobileNav && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-[#18233c]/80 backdrop-blur-sm animate-fadeIn">
          <div className={`w-72 flex flex-col p-4 animate-slideIn transition-colors duration-300 border-r ${
            isDark ? "bg-[#18233c] text-slate-200 border-slate-700/50" : "bg-white text-[#18233c] border-slate-200"
          }`}>
            <div className="flex justify-between items-center pb-4 border-b border-slate-500/20">
              <div className="flex items-center justify-start py-1">
                <img 
                  src={isDark ? "/mcc-logo-dark.png" : "/mcc-logo.png"}
                  className="w-full max-w-[180px] h-auto object-contain rounded-lg" 
                  alt="Madras Christian College Logo" 
                />
              </div>
              <div className="flex items-center gap-2">
                {/* Theme toggle in mobile drawer */}
                <button
                  onClick={toggleTheme}
                  title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer ${
                    isDark
                      ? "bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
                  }`}
                >
                  {isDark ? <Sun size={14} /> : <Moon size={14} />}
                </button>
                <button onClick={() => setShowMobileNav(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer p-1">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 py-4 border-b border-slate-500/20">
              {(profile?.profileImageUrl || user?.profileImageUrl) && !imgError ? (() => {
                const imgDetails = parseImageAdjustments(profile?.profileImageUrl || user?.profileImageUrl);
                return (
                  <div className="w-9 h-9 rounded-full border-2 border-[#d4af37] overflow-hidden flex items-center justify-center shrink-0">
                    <img 
                      src={imgDetails.src} 
                      onError={() => setImgError(true)}
                      style={imgDetails.style} 
                      className="w-full h-full object-cover" 
                      alt={user.fullName} 
                    />
                  </div>
                );
              })() : (
                <div className="w-9 h-9 rounded-full bg-[#781c1c] text-white flex items-center justify-center text-xs font-bold">
                  {initials}
                </div>
              )}
              <h4 className="text-xs font-bold truncate max-w-[140px] flex items-center gap-1.5">
                {user.fullName}
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
              </h4>
            </div>

            <nav className="flex-1 py-3 space-y-1.5 overflow-y-auto">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id);
                      setShowMobileNav(false);
                    }}
                    className={`w-full flex items-center px-3.5 py-2.5 rounded-xl text-xs font-bold text-left cursor-pointer transition-all ${
                      isActive
                        ? "mcc-active-tab font-black shadow-xs"
                        : isDark ? "text-slate-300 hover:bg-slate-800/50" : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Icon size={16} className={isActive ? "text-[#d4af37]" : "text-slate-400"} />
                    <span className="ml-3">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
          <div className="flex-1" onClick={() => setShowMobileNav(false)} />
        </div>
      )}

      {/* MAIN RIGHT PANEL CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* TOP BAR */}
        <header className={`min-h-[4rem] sm:min-h-[4.5rem] py-2 border-b flex items-center justify-between px-3 sm:px-6 z-[49] select-none shadow-sm shrink-0 transition-colors duration-300 ${
          isDark ? "bg-[#121b2e] border-[#781c1c]/25" : "bg-white border-[#781c1c]/15"
        }`}>
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            {/* Hamburger Button for mobile */}
            <button
              onClick={() => setShowMobileNav(true)}
              className={`md:hidden p-2 rounded-xl border transition cursor-pointer shrink-0 ${
                isDark ? "text-slate-300 bg-slate-800 border-slate-700" : "text-slate-700 bg-slate-100 border-slate-200"
              }`}
            >
              <Menu size={18} />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#781c1c] shrink-0" />
                <span className="text-[9px] uppercase font-mono font-black tracking-widest text-[#781c1c] dark:text-red-400 block truncate">
                  Madras Christian College
                </span>
              </div>
              <h1 className={`text-xs sm:text-base font-black tracking-tight font-serif truncate ${isDark ? "text-white" : "text-[#18233c]"}`}>
                {getBreadcrumbTitle()}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Share link button */}
            <button
              onClick={handleShare}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                copiedLink 
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                  : isDark 
                    ? "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700" 
                    : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
              }`}
              title="Share portfolio URL"
            >
              {copiedLink ? <Check size={14} className="shrink-0" /> : <Share2 size={14} className="shrink-0" />}
              <span className="hidden sm:inline">{copiedLink ? "Link Copied!" : "Share Profile"}</span>
            </button>

            {/* Theme Toggle Button in Header */}
            <button
              onClick={toggleTheme}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isDark
                  ? "bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/30"
                  : "bg-[#f0ece1] hover:bg-[#e4ddcc] text-[#781c1c] border-[#781c1c]/25 shadow-2xs"
              }`}
            >
              {isDark ? <Sun size={14} className="text-amber-300 shrink-0" /> : <Moon size={14} className="text-[#781c1c] shrink-0" />}
              <span className="hidden sm:inline text-[10px] uppercase tracking-wider font-extrabold">
                {isDark ? "Light" : "Dark"}
              </span>
            </button>

          </div>
        </header>

        {/* DASHBOARD CONTENT BODY */}
        <main className="flex-1 p-3 sm:p-6 overflow-y-auto max-w-7xl w-full mx-auto space-y-5 sm:space-y-6 transition-colors duration-300">
          
          {/* Welcome Greeting Banner */}
          <div className={`rounded-2xl p-4 sm:p-6 border shadow-md relative overflow-hidden transition-all duration-300 ${
            isDark 
              ? "bg-gradient-to-r from-[#18233c] via-[#121b2e] to-[#0f1623] border-[#781c1c]/30 text-white" 
              : "bg-gradient-to-r from-[#f0ece1] via-[#f7f3ea] to-[#e8dfcf] border-[#781c1c]/20 text-[#18233c]"
          }`}>
            {/* Subtle background glow */}
            <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-[#d4af37]/10 blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="space-y-1 min-w-0">
                <span className={`text-[9px] sm:text-[10px] uppercase font-mono tracking-[0.2em] block ${
                  isDark ? "text-[#d4af37] font-extrabold" : "text-[#781c1c] font-black"
                }`}>
                  Official Verified Portfolio
                </span>
                <h1 className={`text-lg sm:text-2xl font-black font-serif tracking-tight break-words leading-snug ${
                  isDark ? "text-white" : "text-[#18233c]"
                }`}>
                  Welcome to {user.fullName}'s Portfolio
                </h1>
                <p className={`text-xs max-w-xl leading-relaxed ${
                  isDark ? "text-slate-300" : "text-slate-700 font-medium"
                }`}>
                  Showcasing institutionally verified academic achievements, projects, research, and career competencies at Madras Christian College.
                </p>
              </div>

              {currentTime && (
                <div className={`px-3 sm:px-4 py-2 rounded-xl border text-left sm:text-right shrink-0 w-fit backdrop-blur-md ${
                  isDark 
                    ? "bg-white/10 border-white/15 text-white" 
                    : "bg-white/90 border-[#781c1c]/20 text-[#18233c] shadow-xs"
                }`}>
                  <span className={`text-[9px] uppercase font-mono font-bold tracking-wider block ${
                    isDark ? "text-[#d4af37]" : "text-[#781c1c]"
                  }`}>Current Time</span>
                  <span className={`text-xs font-mono font-bold whitespace-pre-line leading-tight ${
                    isDark ? "text-white" : "text-[#18233c]"
                  }`}>{currentTime}</span>
                </div>
              )}
            </div>
          </div>

          {/* Core dynamic content render */}
          {renderContent()}
        </main>
      </div>

    </div>
  );
}

export default function PortfolioPage() {
  return (
    <Suspense fallback={<MCCLoader text="Loading MCC Resume Portfolio..." />}>
      <PortfolioPageContent />
    </Suspense>
  );
}
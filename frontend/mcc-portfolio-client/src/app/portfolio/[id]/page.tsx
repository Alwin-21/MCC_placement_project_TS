"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  GitBranch,
  ExternalLink,
  AlertCircle,
  Award,
  Trophy,
  BookOpen,
  Briefcase,
  Mail,
  MapPin,
  Star,
  FileText,
  Code2,
  Cpu,
  ArrowLeft,
  Heart,
  Palette,
  Share2,
  Download,
  Check,
  Menu,
  User,
  Globe,
  Phone,
  Link as LinkIcon
} from "lucide-react";
import api from "@/services/api";

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
  const [themeConfig, setThemeConfig] = useState<any>(null);
  const [activeTheme, setActiveTheme] = useState("Academic");
  const [currentView, setCurrentView] = useState("header-sec");
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    fetchPortfolio();
  }, [id, username]);

  useEffect(() => {
    const viewParam = searchParams.get("view");
    if (viewParam) {
      setCurrentView(viewParam);
    }
  }, [searchParams]);

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
      
      if (response.data.themeConfig) {
        setThemeConfig(response.data.themeConfig);
      }
      if (response.data.profile?.selectedTheme) {
        setActiveTheme(response.data.profile.selectedTheme);
      }
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

  const getThemeStyles = () => {
    switch (activeTheme) {
      case "Corporate":
        return {
          wrapper: "bg-slate-50 text-slate-800 font-sans min-h-screen",
          header: "bg-slate-900 text-white px-10 py-12 relative overflow-hidden",
          avatarBorder: "border-4 border-slate-700 shadow-md",
          avatarBg: "bg-slate-800 text-white",
          subtitle: "text-slate-300 font-semibold uppercase tracking-wider text-xs",
          sidebar: "w-72 bg-white border-r border-slate-200 text-slate-700 sticky top-0 h-screen flex flex-col p-6 space-y-2 shrink-0 print:hidden",
          mainContent: "flex-grow bg-white px-10 py-10 space-y-10",
          iconColor: "text-blue-600",
          btnColor: "bg-blue-600 hover:bg-blue-700 text-white shadow-sm",
          badge: "inline-block px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded border border-slate-200",
          borderAccent: "border-l-4 border-blue-600 pl-4",
          btnSmall: "bg-blue-600 text-white text-xs px-3 py-1.5 rounded font-bold shadow-sm",
          btnSmallSec: "text-xs text-slate-600 border border-slate-200 hover:bg-slate-50",
          paperReadBtn: "bg-slate-900 hover:bg-slate-800 text-white text-xs px-3 py-1.5 rounded font-bold",
          footer: "bg-slate-950 text-slate-400 px-10 py-6 text-center print:hidden",
          navSidebar: "bg-white border border-slate-200 text-slate-700",
          navHeader: "text-blue-600 border-blue-100",
          navItemActive: "bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600 pl-2",
          navItemInactive: "text-slate-600 hover:bg-slate-50 pl-3",
          navIconActive: "text-blue-600",
          navIconInactive: "text-slate-400",
          mobileNavBtn: "bg-blue-600 text-white border-blue-600 hover:bg-blue-700",
          mobileNavMenu: "bg-white border border-slate-200 text-slate-800"
        };
      case "Startup":
        return {
          wrapper: "bg-white text-neutral-800 font-sans min-h-screen",
          header: "bg-gradient-to-r from-violet-600 to-indigo-700 text-white px-10 py-14 relative overflow-hidden",
          avatarBorder: "border-4 border-white/20 shadow-lg",
          avatarBg: "bg-violet-900 text-white",
          subtitle: "text-violet-100 font-semibold tracking-wider text-xs",
          sidebar: "w-72 bg-neutral-50 border-r border-neutral-100 text-neutral-700 sticky top-0 h-screen flex flex-col p-6 space-y-2 shrink-0 print:hidden",
          mainContent: "flex-grow px-10 py-10 space-y-10",
          iconColor: "text-violet-600",
          btnColor: "bg-violet-600 hover:bg-violet-750 text-white shadow-md",
          badge: "inline-block px-2.5 py-0.5 bg-violet-50 text-violet-700 text-[10px] font-bold rounded-full border border-violet-100",
          borderAccent: "border-l-4 border-violet-600 pl-4",
          btnSmall: "bg-violet-600 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-md",
          btnSmallSec: "text-xs text-violet-600 border border-violet-100 hover:bg-violet-50/50",
          paperReadBtn: "bg-neutral-900 hover:bg-neutral-800 text-white text-xs px-3 py-1.5 rounded-full font-bold",
          footer: "bg-neutral-950 text-neutral-400 px-10 py-6 text-center print:hidden",
          navSidebar: "bg-neutral-50 border border-neutral-100 text-neutral-700",
          navHeader: "text-violet-600 border-violet-100",
          navItemActive: "bg-violet-50 text-violet-700 font-bold border-l-4 border-violet-600 pl-2",
          navItemInactive: "text-neutral-600 hover:bg-neutral-100 pl-3",
          navIconActive: "text-violet-600",
          navIconInactive: "text-neutral-400",
          mobileNavBtn: "bg-violet-600 text-white border-violet-600 hover:bg-violet-700",
          mobileNavMenu: "bg-white border border-neutral-150 text-neutral-800"
        };
      case "Creative":
        return {
          wrapper: "bg-indigo-950 text-indigo-50 font-sans min-h-screen",
          header: "bg-gradient-to-r from-teal-900 via-indigo-950 to-purple-950 text-white px-10 py-14 relative overflow-hidden border-b border-indigo-900/50",
          avatarBorder: "border-4 border-teal-500/30 shadow-2xl",
          avatarBg: "bg-indigo-900 text-teal-300",
          subtitle: "text-teal-300 font-bold uppercase tracking-wider text-xs",
          sidebar: "w-72 bg-indigo-950/60 border-r border-indigo-900/50 text-indigo-200 sticky top-0 h-screen flex flex-col p-6 space-y-2 shrink-0 print:hidden",
          mainContent: "flex-grow px-10 py-10 space-y-10",
          iconColor: "text-teal-400",
          btnColor: "bg-teal-500 hover:bg-teal-600 text-white shadow-lg",
          badge: "inline-block px-2 py-0.5 bg-teal-50/10 text-teal-300 text-[10px] font-semibold rounded border border-teal-500/25",
          borderAccent: "border-l-4 border-teal-500 pl-4",
          btnSmall: "bg-teal-500 text-white text-xs px-3 py-1.5 rounded font-bold shadow-lg",
          btnSmallSec: "text-xs text-teal-300 border border-teal-500/30 hover:bg-teal-500/10",
          paperReadBtn: "bg-indigo-900 hover:bg-indigo-800 text-white text-xs px-3 py-1.5 rounded font-bold",
          footer: "bg-indigo-950 text-indigo-400 px-10 py-6 text-center print:hidden",
          navSidebar: "bg-indigo-950/40 border border-indigo-900 text-indigo-200",
          navHeader: "text-teal-400 border-indigo-800",
          navItemActive: "bg-teal-500/10 text-teal-300 font-bold border-l-4 border-teal-500 pl-2",
          navItemInactive: "text-indigo-200 hover:bg-indigo-900/40 pl-3",
          navIconActive: "text-teal-400",
          navIconInactive: "text-indigo-450",
          mobileNavBtn: "bg-teal-500 text-white border-teal-500 hover:bg-teal-600",
          mobileNavMenu: "bg-indigo-950 border border-indigo-900 text-indigo-100"
        };
      case "AIFuturistic":
        return {
          wrapper: "bg-black text-gray-300 font-mono min-h-screen",
          header: "bg-black border-b border-[#00ffcc]/20 px-10 py-16 relative overflow-hidden",
          avatarBorder: "border-2 border-[#00ffcc] shadow-[0_0_15px_rgba(0,255,204,0.3)]",
          avatarBg: "bg-black text-[#00ffcc]",
          subtitle: "text-cyan-400 font-bold tracking-widest text-xs uppercase",
          sidebar: "w-72 bg-black border-r border-[#00ffcc]/15 text-gray-400 sticky top-0 h-screen flex flex-col p-6 space-y-2 shrink-0 print:hidden",
          mainContent: "flex-grow px-10 py-10 space-y-10",
          iconColor: "text-[#00ffcc]",
          btnColor: "bg-transparent text-[#00ffcc] border border-[#00ffcc] hover:bg-[#00ffcc]/10 shadow-[0_0_10px_rgba(0,255,204,0.15)]",
          badge: "inline-block px-2 py-0.5 bg-black text-[#00ffcc] text-[10px] font-bold rounded border border-[#00ffcc]/20",
          borderAccent: "border-l-4 border-[#00ffcc] pl-4",
          btnSmall: "bg-transparent text-[#00ffcc] border border-[#00ffcc]/50 text-xs px-3 py-1.5 rounded font-bold shadow-[0_0_8px_rgba(0,255,204,0.1)]",
          btnSmallSec: "text-xs text-[#00ffcc]/80 border border-[#00ffcc]/20 hover:bg-[#00ffcc]/5",
          paperReadBtn: "bg-transparent text-cyan-400 border border-cyan-400/50 hover:bg-cyan-400/10 text-xs px-3 py-1.5 rounded font-bold",
          footer: "bg-black border-t border-[#00ffcc]/15 text-gray-500 px-10 py-6 text-center print:hidden",
          navSidebar: "bg-black border border-[#00ffcc]/15 text-gray-400",
          navHeader: "text-[#00ffcc] border-[#00ffcc]/20",
          navItemActive: "bg-[#00ffcc]/5 text-[#00ffcc] font-bold border-l-4 border-[#00ffcc] pl-2",
          navItemInactive: "text-gray-400 hover:bg-[#00ffcc]/5 hover:text-[#00ffcc] pl-3",
          navIconActive: "text-[#00ffcc]",
          navIconInactive: "text-gray-600",
          mobileNavBtn: "bg-black text-[#00ffcc] border-[#00ffcc] hover:bg-[#00ffcc]/10",
          mobileNavMenu: "bg-black border border-[#00ffcc]/25 text-gray-300"
        };
      case "LinkedIn":
        return {
          wrapper: "bg-[#f3f2ef] text-slate-800 font-sans min-h-screen",
          header: "bg-white border border-slate-200 rounded-b-xl px-10 py-12 relative overflow-hidden shadow-sm max-w-5xl mx-auto mt-4",
          avatarBorder: "border-4 border-white shadow-md",
          avatarBg: "bg-slate-200 text-slate-700",
          subtitle: "text-slate-500 font-semibold text-xs",
          sidebar: "w-72 bg-white border border-slate-200 rounded-xl text-slate-700 sticky top-4 h-[calc(100vh-32px)] flex flex-col p-6 space-y-2 shrink-0 print:hidden",
          mainContent: "flex-grow bg-white border border-slate-200 rounded-xl p-8 space-y-10 max-w-5xl mx-auto mt-4",
          iconColor: "text-[#0a66c2]",
          btnColor: "bg-[#0a66c2] hover:bg-[#004182] text-white shadow-sm rounded-full font-bold",
          badge: "inline-block px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded-full border border-slate-200",
          borderAccent: "border-l-4 border-[#0a66c2] pl-4",
          btnSmall: "bg-[#0a66c2] text-white text-xs px-3.5 py-1.5 rounded-full font-semibold shadow-xs",
          btnSmallSec: "text-xs text-[#0a66c2] border border-[#0a66c2] rounded-full hover:bg-[#0a66c2]/5",
          paperReadBtn: "bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs px-3 py-1.5 rounded-full font-semibold border border-slate-300",
          footer: "bg-white border-t border-slate-200 text-slate-500 px-10 py-6 text-center mt-8 print:hidden",
          navSidebar: "bg-white border border-slate-200 text-slate-700",
          navHeader: "text-[#0a66c2] border-slate-100",
          navItemActive: "bg-[#0a66c2]/5 text-[#0a66c2] font-bold border-l-4 border-[#0a66c2] pl-2",
          navItemInactive: "text-slate-600 hover:bg-slate-50 pl-3",
          navIconActive: "text-[#0a66c2]",
          navIconInactive: "text-slate-400",
          mobileNavBtn: "bg-[#0a66c2] text-white border-[#0a66c2] hover:bg-[#004182]",
          mobileNavMenu: "bg-white border border-slate-200 text-slate-800"
        };
      default: // Academic Theme
        return {
          wrapper: "bg-[#faf9f6] text-[#2c2c2c] font-serif min-h-screen",
          header: "bg-[#18233c] text-white px-10 py-14 relative overflow-hidden border-b-4 border-amber-600",
          avatarBorder: "border-4 border-amber-600/30 shadow-md",
          avatarBg: "bg-[#18233c] text-white",
          subtitle: "text-amber-500 font-bold uppercase tracking-wider text-xs",
          sidebar: "w-72 bg-white border-r border-amber-900/10 text-[#18233c] sticky top-0 h-screen flex flex-col p-6 space-y-2 shrink-0 print:hidden",
          mainContent: "flex-grow bg-white px-10 py-10 space-y-10",
          iconColor: "text-amber-650",
          btnColor: "bg-amber-600 hover:bg-amber-700 text-white shadow-sm font-semibold",
          badge: "inline-block px-2.5 py-0.5 bg-amber-50 text-amber-800 text-[10px] font-semibold rounded border border-amber-250",
          borderAccent: "border-l-4 border-amber-600 pl-4",
          btnSmall: "bg-amber-600 text-white text-xs px-3.5 py-1.5 rounded font-semibold shadow-sm",
          btnSmallSec: "text-xs text-amber-700 border border-amber-200 bg-amber-50/20 hover:bg-amber-50",
          paperReadBtn: "bg-[#18233c] hover:bg-slate-800 text-white text-xs px-3 py-1.5 rounded font-semibold",
          footer: "bg-[#18233c] text-slate-300 px-10 py-6 text-center print:hidden",
          navSidebar: "bg-white border border-amber-900/10 text-[#18233c]",
          navHeader: "text-amber-600 border-amber-200",
          navItemActive: "bg-amber-50 text-amber-900 font-bold border-l-4 border-amber-600 pl-2",
          navItemInactive: "text-[#18233c]/80 hover:bg-amber-50/50 pl-3",
          navIconActive: "text-amber-600",
          navIconInactive: "text-slate-400",
          mobileNavBtn: "bg-amber-600 text-white border-amber-600 hover:bg-amber-700",
          mobileNavMenu: "bg-white border border-amber-900/15 text-[#18233c]"
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07070a] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-purple-500 border-r-indigo-500 border-b-transparent border-l-transparent rounded-full animate-spin mx-auto mb-6" />
          <p className="text-gray-400 font-bold tracking-widest text-xs uppercase animate-pulse">Loading MCC Resume Portfolio...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#07070a] text-white flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle size={48} className="text-red-500 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold">Portfolio Record Not Found</h2>
        <p className="text-sm text-gray-400 mt-2">The requested student directory is empty or the URL slug is invalid.</p>
        <button onClick={() => router.push("/search")} className="mt-6 bg-purple-600 text-white px-6 py-2.5 rounded-xl font-bold">
          Search Placement Directory
        </button>
      </div>
    );
  }

  const s = getThemeStyles();
  const initials = user.fullName ? user.fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() : "ST";

  // Re-map sidebar options to exactly the 13 required sections
  const sectionsList = [
    { id: "header-sec", label: "Full Portfolio", icon: User },
    { id: "about-sec", label: "About Section", icon: FileText },
    { id: "experience-sec", label: "Experience", icon: Briefcase },
    { id: "academic-sec", label: "Academic Details", icon: Award },
    { id: "achievements-sec", label: "Achievements", icon: Trophy },
    { id: "projects-research-sec", label: "Projects & Research", icon: GitBranch },
    { id: "skills-sec", label: "Skills", icon: Code2 },
    { id: "licenses-certifications-sec", label: "Licenses & Certifications", icon: Award },
    { id: "languages-sec", label: "Languages known", icon: Globe },
    { id: "test-scores-sec", label: "Test Scores", icon: Award },
    { id: "patents-sec", label: "Patents", icon: FileText },
    { id: "media-handles-sec", label: "Other Media handles", icon: LinkIcon },
    { id: "resume-sec", label: "Resume", icon: FileText }
  ];

  return (
    <div className={s.wrapper}>
      {/* HEADER CARD */}
      <header className={s.header}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="flex items-center gap-5">
            {profile?.profileImageUrl ? (
              <img src={profile.profileImageUrl} className={`w-20 h-20 rounded-full object-cover ${s.avatarBorder}`} alt={user.fullName} />
            ) : (
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold ${s.avatarBorder} ${s.avatarBg}`}>
                {initials}
              </div>
            )}
            <div>
              <h2 className="text-2xl font-black tracking-tight">{user.fullName}</h2>
              {profile?.course ? (
                <p className={`text-xs font-semibold tracking-wide ${s.subtitle} mt-1`}>{profile.course}</p>
              ) : (
                <p className={`text-xs font-semibold tracking-wide ${s.subtitle} mt-1`}>{user.department} · MCC Student</p>
              )}
              {profile?.currentLocation && (
                <p className="text-[10px] opacity-70 mt-1 flex items-center gap-1"><MapPin size={10} /> {profile.currentLocation}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto print:hidden">
            <button
              onClick={handleShare}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition ${s.btnColor}`}
            >
              {copiedLink ? <Check size={14} /> : <Share2 size={14} />}
              {copiedLink ? "Link Copied!" : "Share Portfolio"}
            </button>
          </div>
        </div>

        {/* Contacts details row in header */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10 text-xs text-slate-300">
          <div className="flex items-center gap-2"><Mail size={14} className={s.iconColor} /> {user.email}</div>
          {profile?.phone && <div className="flex items-center gap-2"><Phone size={14} className={s.iconColor} /> {profile.phone}</div>}
          {profile?.linkedInUrl && (
            <a href={profile.linkedInUrl} target="_blank" className="flex items-center gap-2 hover:text-white transition">
              <Linkedin size={14} className={s.iconColor} /> LinkedIn Profile
            </a>
          )}
        </div>
      </header>

      {/* BODY SIDEBAR + CONTENT SECTION */}
      <div className="max-w-5xl mx-auto flex gap-6 py-6 px-4 md:px-0">
        
        {/* SIDEBAR NAVIGATION */}
        <nav className={`w-72 bg-white/5 border border-white/10 rounded-2xl flex flex-col p-4 space-y-1 sticky top-6 h-[calc(100vh-48px)] shrink-0 print:hidden ${s.navSidebar}`}>
          {sectionsList.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center gap-3 transition px-4 py-2 rounded-xl text-xs font-medium text-left ${
                  isActive ? s.navItemActive : s.navItemInactive
                }`}
              >
                <Icon size={14} className={isActive ? s.navIconActive : s.navIconInactive} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* CONTENT MAIN PANEL */}
        <main className={`${s.mainContent} flex-1 bg-white/5 border border-white/10 rounded-2xl p-8`}>
          {/* ==========================================
              VIEW CONTROLLER
              ========================================== */}
          
          {/* CASE 1: FULL VIEW / HEADER */}
          {currentView === "header-sec" && (
            <div className="space-y-8 animate-fadeIn">
              {/* About short summary */}
              <div>
                <h3 className="text-lg font-bold border-b pb-2 mb-3">About Summary</h3>
                <p className="text-sm opacity-80 leading-relaxed italic">"{profile?.bio || "No summary provided."}"</p>
              </div>

              {/* Quick statistics/meta */}
              <div className="grid grid-cols-2 gap-4 border border-dashed border-white/10 p-5 rounded-2xl bg-white/[0.01]">
                <div>
                  <span className="text-[10px] uppercase opacity-55 font-bold block">Course / Year</span>
                  <span className="text-sm font-bold mt-1 block">{profile?.course || user.department}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase opacity-55 font-bold block">CGPA Score</span>
                  <span className="text-sm font-bold mt-1 block">{profile?.cgpa || "N/A"} CGPA</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase opacity-55 font-bold block">Current Location</span>
                  <span className="text-sm font-bold mt-1 block">{profile?.currentLocation || "N/A"}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase opacity-55 font-bold block">Connected Handles</span>
                  <span className="text-xs font-bold mt-1 block flex items-center gap-1.5">
                    {profile?.gitHubUrl && <Github size={12} />}
                    {profile?.linkedInUrl && <Linkedin size={12} />}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* CASE 2: ABOUT DETAILS */}
          {currentView === "about-sec" && (
            <div className="space-y-6 animate-fadeIn">
              <h3 className="text-lg font-bold border-b pb-2 mb-3 flex items-center gap-2"><FileText size={18} /> About Summary</h3>
              
              <div>
                <h4 className="text-xs font-bold uppercase opacity-60">Short Bio</h4>
                <p className="text-sm leading-relaxed mt-2">{profile?.bio || "No summary added."}</p>
              </div>

              {profile?.personalStory && (
                <div className="pt-4">
                  <h4 className="text-xs font-bold uppercase opacity-60">Personal Journey & Background</h4>
                  <p className="text-sm leading-relaxed mt-2 whitespace-pre-line italic">"{profile.personalStory}"</p>
                </div>
              )}

              {profile?.sop && (
                <div className="pt-4">
                  <h4 className="text-xs font-bold uppercase opacity-60">Statement of Purpose</h4>
                  <div className="text-xs leading-relaxed p-4 rounded-xl border border-white/5 bg-white/[0.01] mt-2 whitespace-pre-line">
                    {profile.sop}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CASE 3: EXPERIENCE */}
          {currentView === "experience-sec" && (
            <div className="space-y-6 animate-fadeIn">
              <h3 className="text-lg font-bold border-b pb-2 mb-3 flex items-center gap-2"><Briefcase size={18} /> Experience Records</h3>
              {experiences.length > 0 ? (
                <div className="space-y-6">
                  {experiences.map((exp) => (
                    <div key={exp.id} className={`${s.borderAccent} pl-4`}>
                      <span className="inline-block px-2.5 py-0.5 rounded-full font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[8px] font-bold uppercase mb-2">
                        {exp.category}
                      </span>
                      <h4 className="font-bold text-base leading-snug">{exp.title}</h4>
                      <p className="text-xs opacity-75 mt-1">{exp.company} · {exp.location}</p>
                      <p className="text-[10px] opacity-50 mt-1 font-mono">{exp.startDate} - {exp.isCurrent ? "Present" : exp.endDate}</p>
                      <p className="text-xs opacity-70 mt-2 leading-relaxed whitespace-pre-line">{exp.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">No experiences listed yet.</div>
              )}
            </div>
          )}

          {/* CASE 4: ACADEMIC DETAILS */}
          {currentView === "academic-sec" && (
            <div className="space-y-6 animate-fadeIn">
              <h3 className="text-lg font-bold border-b pb-2 mb-3 flex items-center gap-2"><Award size={18} /> Academic details</h3>
              {academicRecords.length > 0 ? (
                <div className="space-y-6">
                  {academicRecords.map((rec) => (
                    <div key={rec.id} className={`${s.borderAccent} pl-4`}>
                      <h4 className="font-bold text-base">{rec.degree} in {rec.fieldOfStudy}</h4>
                      <p className="text-xs opacity-75 mt-1">{rec.institution}</p>
                      <p className="text-[10px] opacity-50 mt-1 font-semibold">Duration: {rec.startYear} - {rec.endYear} · Grade: {rec.grade || "N/A"}</p>
                      {rec.attachmentUrl && (
                        <a href={rec.attachmentUrl} target="_blank" className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg border transition mt-3 ${s.btnSmallSec}`}>
                          <FileText size={10} /> View Marksheet Proof
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">No academic details listed.</div>
              )}
            </div>
          )}

          {/* CASE 5: ACHIEVEMENTS */}
          {currentView === "achievements-sec" && (
            <div className="space-y-6 animate-fadeIn">
              <h3 className="text-lg font-bold border-b pb-2 mb-3 flex items-center gap-2"><Trophy size={18} /> Achievements</h3>
              {achievements.length > 0 ? (
                <div className="space-y-6">
                  {achievements.map((ach) => (
                    <div key={ach.id} className={`${s.borderAccent} pl-4`}>
                      <span className="inline-block px-2.5 py-0.5 rounded-full font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[8px] font-bold uppercase mb-2">
                        {ach.category}
                      </span>
                      <h4 className="font-bold text-base leading-snug">{ach.title}</h4>
                      <p className="text-[10px] opacity-55 mt-1 font-semibold">{ach.achievementDate ? new Date(ach.achievementDate).toLocaleDateString() : ""}</p>
                      <p className="text-xs opacity-70 mt-2 leading-relaxed">{ach.description}</p>
                      {ach.achievementUrl && (
                        <a href={ach.achievementUrl} target="_blank" className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg border transition mt-3 ${s.btnSmallSec}`}>
                          <ExternalLink size={10} /> View Merit Document
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">No achievements recorded yet.</div>
              )}
            </div>
          )}

          {/* CASE 6: PROJECTS & RESEARCH */}
          {currentView === "projects-research-sec" && (
            <div className="space-y-6 animate-fadeIn">
              <h3 className="text-lg font-bold border-b pb-2 mb-3 flex items-center gap-2"><GitBranch size={18} /> Projects & Research Publications</h3>
              
              {/* Projects List */}
              {projects.length > 0 && (
                <div className="space-y-6 mb-8">
                  <h4 className="text-xs font-black uppercase tracking-widest opacity-50 mb-4">Development Projects</h4>
                  {projects.map((proj) => (
                    <div key={proj.id} className={`${s.borderAccent} pl-4`}>
                      <span className="inline-block px-2.5 py-0.5 rounded-full font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[8px] font-bold uppercase mb-2">
                        {proj.category || "Projects"}
                      </span>
                      <h5 className="font-bold text-sm">{proj.title}</h5>
                      <p className="text-[10px] opacity-50 mt-1 font-semibold">Tech stack: {proj.technologies}</p>
                      <p className="text-xs opacity-70 mt-2 leading-relaxed">{proj.description}</p>
                      {(proj.githubUrl || proj.liveUrl) && (
                        <a href={proj.githubUrl || proj.liveUrl} target="_blank" className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg border transition mt-3 ${s.btnSmallSec}`}>
                          <ExternalLink size={10} /> Access Source/Deployment Link
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Publications List */}
              {researchPapers.length > 0 && (
                <div className="space-y-6">
                  <h4 className="text-xs font-black uppercase tracking-widest opacity-50 mb-4">Publications & Scholarly Papers</h4>
                  {researchPapers.map((paper) => (
                    <div key={paper.id} className={`${s.borderAccent} pl-4`}>
                      <span className="inline-block px-2.5 py-0.5 rounded-full font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[8px] font-bold uppercase mb-2">
                        {paper.category || "Publications"}
                      </span>
                      <h5 className="font-bold text-sm">{paper.title}</h5>
                      <p className="text-[10px] opacity-50 mt-1 font-semibold">{paper.conference} · {paper.publishedDate ? new Date(paper.publishedDate).toLocaleDateString() : ""}</p>
                      <p className="text-xs opacity-70 mt-2 leading-relaxed whitespace-pre-line italic">"{paper.abstract}"</p>
                      {paper.paperUrl && (
                        <a href={paper.paperUrl} target="_blank" className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg border transition mt-3 ${s.btnSmallSec}`}>
                          <ExternalLink size={10} /> Read Full Paper PDF
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {projects.length === 0 && researchPapers.length === 0 && (
                <div className="text-center py-10 text-gray-500">No project or publication records uploaded.</div>
              )}
            </div>
          )}

          {/* CASE 7: SKILLS */}
          {currentView === "skills-sec" && (
            <div className="space-y-6 animate-fadeIn">
              <h3 className="text-lg font-bold border-b pb-2 mb-3 flex items-center gap-2"><Code2 size={18} /> Skills Arsenal</h3>
              {skills.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {skills.map((skill) => (
                    <div key={skill.id} className="border border-white/5 bg-white/[0.01] p-4 rounded-xl">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-sm">{skill.name}</h4>
                        <span className="text-[9px] px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded font-semibold uppercase">{skill.level}</span>
                      </div>
                      <span className="text-[9px] opacity-45 uppercase font-bold font-mono tracking-wider">{skill.category}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">No skills added yet.</div>
              )}
            </div>
          )}

          {/* CASE 8: CERTIFICATIONS */}
          {currentView === "licenses-certifications-sec" && (
            <div className="space-y-6 animate-fadeIn">
              <h3 className="text-lg font-bold border-b pb-2 mb-3 flex items-center gap-2"><Award size={18} /> Licenses & Certifications</h3>
              {certifications.length > 0 ? (
                <div className="space-y-6">
                  {certifications.map((cert) => (
                    <div key={cert.id} className={`${s.borderAccent} pl-4`}>
                      <span className="inline-block px-2.5 py-0.5 rounded-full font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[8px] font-bold uppercase mb-2">
                        {cert.category}
                      </span>
                      <h4 className="font-bold text-base leading-snug">{cert.title}</h4>
                      <p className="text-xs opacity-75 mt-1">{cert.issuer}</p>
                      <p className="text-[10px] opacity-50 mt-1 font-semibold">{cert.issueDate ? new Date(cert.issueDate).toLocaleDateString() : ""}</p>
                      {cert.certificateUrl && (
                        <a href={cert.certificateUrl} target="_blank" className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg border transition mt-3 ${s.btnSmallSec}`}>
                          <ExternalLink size={10} /> View Credentials Document
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">No certifications recorded.</div>
              )}
            </div>
          )}

          {/* CASE 9: LANGUAGES KNOWN */}
          {currentView === "languages-sec" && (
            <div className="space-y-6 animate-fadeIn">
              <h3 className="text-lg font-bold border-b pb-2 mb-3 flex items-center gap-2"><Globe size={18} /> Languages known</h3>
              {profile?.languages ? (
                <div className="flex flex-wrap gap-2.5">
                  {profile.languages.split(",").map((l: string, i: number) => (
                    <span key={i} className="px-4 py-2 border border-white/10 bg-white/[0.02] text-xs font-semibold rounded-xl">
                      {l.trim()}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">No languages specified.</div>
              )}
            </div>
          )}

          {/* CASE 10: TEST SCORES */}
          {currentView === "test-scores-sec" && (
            <div className="space-y-6 animate-fadeIn">
              <h3 className="text-lg font-bold border-b pb-2 mb-3 flex items-center gap-2"><Award size={18} /> Standardized Test Scores</h3>
              {profile?.testScores ? (
                <div className="p-5 border border-white/5 bg-white/[0.01] rounded-2xl text-sm leading-relaxed whitespace-pre-line">
                  {profile.testScores}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">No test scores recorded.</div>
              )}
            </div>
          )}

          {/* CASE 11: PATENTS */}
          {currentView === "patents-sec" && (
            <div className="space-y-6 animate-fadeIn">
              <h3 className="text-lg font-bold border-b pb-2 mb-3 flex items-center gap-2"><FileText size={18} /> Patents</h3>
              {profile?.patents ? (
                <div className="p-5 border border-white/5 bg-white/[0.01] rounded-2xl text-sm leading-relaxed whitespace-pre-line">
                  {profile.patents}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">No patents listed.</div>
              )}
            </div>
          )}

          {/* CASE 12: OTHER MEDIA HANDLES */}
          {currentView === "media-handles-sec" && (
            <div className="space-y-6 animate-fadeIn">
              <h3 className="text-lg font-bold border-b pb-2 mb-3 flex items-center gap-2"><LinkIcon size={18} /> Other Media handles</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {profile?.instagramUrl && (
                  <a href={profile.instagramUrl} target="_blank" className="border border-white/5 bg-white/[0.01] p-4 rounded-xl flex items-center gap-3 hover:bg-white/[0.04] transition">
                    <InstagramIcon size={18} className="text-pink-400" />
                    <div>
                      <span className="font-bold text-xs block">Instagram Profile</span>
                      <span className="text-[10px] opacity-50 block mt-0.5 truncate">{profile.instagramUrl}</span>
                    </div>
                  </a>
                )}
                
                {profile?.blogUrl && (
                  <a href={profile.blogUrl} target="_blank" className="border border-white/5 bg-white/[0.01] p-4 rounded-xl flex items-center gap-3 hover:bg-white/[0.04] transition">
                    <Globe size={18} className="text-blue-400" />
                    <div>
                      <span className="font-bold text-xs block">Blog / Website</span>
                      <span className="text-[10px] opacity-50 block mt-0.5 truncate">{profile.blogUrl}</span>
                    </div>
                  </a>
                )}

                {profile?.otherHandles && (
                  <div className="border border-white/5 bg-white/[0.01] p-4 rounded-xl flex items-center gap-3 md:col-span-2">
                    <LinkIcon size={18} className="text-purple-400" />
                    <div>
                      <span className="font-bold text-xs block">Other Social Handles</span>
                      <p className="text-xs opacity-70 mt-1 leading-relaxed">{profile.otherHandles}</p>
                    </div>
                  </div>
                )}

                {!profile?.instagramUrl && !profile?.blogUrl && !profile?.otherHandles && (
                  <div className="text-center py-10 text-gray-500 md:col-span-2">No other media handles connected.</div>
                )}
              </div>
            </div>
          )}

          {/* CASE 13: RESUME */}
          {currentView === "resume-sec" && (
            <div className="space-y-6 animate-fadeIn">
              <h3 className="text-lg font-bold border-b pb-2 mb-3 flex items-center gap-2"><FileText size={18} /> Resumes</h3>
              {resumes.length > 0 ? (
                <div className="space-y-4">
                  {resumes.map((res) => (
                    <div key={res.id} className="border border-white/5 bg-white/[0.01] p-4 rounded-xl flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <FileText className="text-purple-400" size={20} />
                        <div>
                          <h5 className="font-bold text-sm">{res.resumeTitle}</h5>
                          <a href={res.resumeUrl} target="_blank" className="text-[10px] text-purple-400 hover:underline flex items-center gap-0.5 mt-0.5">
                            <ExternalLink size={10} /> View / Download Document
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">No resumes uploaded.</div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* FOOTER */}
      <footer className={s.footer}>
        <p className="text-[10px] font-mono tracking-widest text-inherit/50">
          MADRAS CHRISTIAN COLLEGE · STUDENT PLACEMENT DIRECTORY · OFFICIAL VERIFIED ARCHIVE · {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}

export default function PortfolioPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#07070a] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-purple-500 border-r-indigo-500 border-b-transparent border-l-transparent rounded-full animate-spin mx-auto mb-6" />
          <p className="text-gray-400 font-bold tracking-widest text-xs uppercase animate-pulse">Loading MCC Resume Portfolio...</p>
        </div>
      </div>
    }>
      <PortfolioPageContent />
    </Suspense>
  );
}
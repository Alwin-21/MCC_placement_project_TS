"use client";

import { useEffect, useState, Suspense } from "react";
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
  Eye
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
  const [copiedLink, setCopiedLink] = useState(false);
  const [imgError, setImgError] = useState(false);
  
  // Custom states matching image UI components
  const [currentView, setCurrentView] = useState("dashboard"); // mapping to sidebar
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [previewResumeUrl, setPreviewResumeUrl] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcfaf6] text-[#2c2c2c] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-[#781c1c] border-r-[#18233c] border-b-transparent border-l-transparent rounded-full animate-spin mx-auto mb-6" />
          <p className="text-slate-500 font-bold tracking-widest text-xs uppercase animate-pulse">Loading MCC Resume Portfolio...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#fcfaf6] text-[#2c2c2c] flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle size={48} className="text-[#781c1c] mb-4 animate-bounce" />
        <h2 className="text-xl font-bold text-[#18233c]">Portfolio Record Not Found</h2>
        <p className="text-sm text-slate-550 mt-2">The requested student directory is empty or the URL slug is invalid.</p>
        <button onClick={() => router.push("/")} className="mt-6 bg-[#781c1c] hover:bg-[#5f1515] text-white px-6 py-2.5 rounded-xl font-bold transition-all">
          Back to Homepage
        </button>
      </div>
    );
  }

  const initials = user.fullName ? user.fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() : "ST";

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
    { id: "resume", label: "Resume", icon: FileText, visible: resumes.length > 0 }
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
      title: `${rec.degree} in ${rec.fieldOfStudy}`,
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
              {/* Profile Card */}
              <div className="bg-white border border-[#781c1c]/10 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.01)] text-center lg:text-left">
                <div className="flex flex-col lg:flex-row items-center gap-4">
                  {(profile?.profileImageUrl || user?.profileImageUrl) && !imgError ? (
                    <img 
                      src={profile?.profileImageUrl || user?.profileImageUrl} 
                      onError={() => setImgError(true)}
                      className="w-16 h-16 rounded-full object-cover border-2 border-slate-100 shadow-xs" 
                      alt={user.fullName} 
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[#f0ece1] text-[#781c1c] flex items-center justify-center font-bold text-lg border border-slate-205 shadow-xs shrink-0">
                      {initials}
                    </div>
                  )}
                  <div className="space-y-1.5 overflow-hidden">
                    <h2 className="text-base font-bold text-[#18233c] leading-tight truncate">{user.fullName}</h2>
                    {profile?.course && (
                      <p className="text-xs text-slate-500 font-medium leading-tight truncate">
                        {profile.course} {profile?.yearOfStudy ? `(${profile.yearOfStudy})` : ""}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                      Department: {user.department || "N/A"}
                    </p>
                    {user.registerNumber && (
                      <p className="text-[9px] text-slate-400 font-bold">
                        Register ID: {user.registerNumber}
                      </p>
                    )}
                    {profile?.phone && (
                      <p className="text-[10px] text-slate-500 font-medium leading-tight truncate">
                        Phone: {profile.phone}
                      </p>
                    )}
                    {user.email && (
                      <p className="text-[10px] text-slate-500 leading-tight truncate">
                        Email: {user.email}
                      </p>
                    )}
                    {profile?.cgpa !== undefined && Number(profile.cgpa) > 0 && (
                      <p className="text-[10px] text-emerald-600 font-bold">
                        CGPA: {profile.cgpa}
                      </p>
                    )}
                    {profile?.targetCareer && (
                      <p className="text-[9px] text-indigo-600 font-bold uppercase tracking-wider">
                        Target: {profile.targetCareer}
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-100 mt-5 pt-4 flex justify-between items-center text-xs text-slate-500 font-bold px-1">
                  <div>
                    <span className="block text-slate-450 text-[10px] uppercase font-bold tracking-wide">Skills Arsenal</span>
                    <span className="block text-base font-extrabold text-[#781c1c] mt-0.5">{skills.length}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-slate-450 text-[10px] uppercase font-bold tracking-wide">Projects Listed</span>
                    <span className="block text-base font-extrabold text-[#18233c] mt-0.5">{projects.length}</span>
                  </div>
                </div>
              </div>

              {/* Biography summary widget (reflecting student bio) */}
              {profile?.bio && (
                <div className="bg-white border border-[#781c1c]/10 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
                  <h3 className="text-xs font-bold text-[#18233c] uppercase tracking-wider pb-3 border-b border-slate-100 mb-3 flex items-center gap-1.5">
                    <FileText size={14} className="text-[#781c1c]" /> Biography
                  </h3>
                  <p className="text-xs text-slate-650 leading-relaxed italic">
                    "{profile.bio}"
                  </p>
                  {profile.personalStory && (
                    <p className="text-[11px] text-slate-500 leading-relaxed mt-2.5 pt-2.5 border-t border-dashed border-slate-100">
                      {profile.personalStory}
                    </p>
                  )}
                </div>
              )}
              {/* Connected Media Handles / Contacts summary widget */}
              {(user.email || profile?.phone || profile?.currentLocation || profile?.linkedInUrl || profile?.gitHubUrl || profile?.gitHubUsername || profile?.behanceUrl) && (
                <div className="bg-white border border-[#781c1c]/10 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
                  <h3 className="text-xs font-bold text-[#18233c] uppercase tracking-wider pb-3 border-b border-slate-100 mb-3 flex items-center gap-1.5">
                    <LinkIcon size={14} className="text-[#781c1c]" /> Contacts & Socials
                  </h3>
                  <div className="space-y-2 text-xs text-slate-655">
                    {user.email && (
                      <div className="flex items-center gap-2 truncate">
                        <Mail size={13} className="text-slate-400 shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </div>
                    )}
                    {profile?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={13} className="text-slate-400 shrink-0" />
                        <span>{profile.phone}</span>
                      </div>
                    )}
                    {profile?.currentLocation && (
                      <div className="flex items-center gap-2">
                        <MapPin size={13} className="text-slate-400 shrink-0" />
                        <span>{profile.currentLocation}</span>
                      </div>
                    )}
                    {profile?.linkedInUrl && (
                      <a href={profile.linkedInUrl} target="_blank" className="flex items-center gap-2 text-blue-650 hover:underline">
                        <Linkedin size={13} className="shrink-0" />
                        <span>LinkedIn Profile</span>
                      </a>
                    )}
                    {profile?.gitHubUrl && (
                      <a href={profile.gitHubUrl} target="_blank" className="flex items-center gap-2 text-slate-700 hover:underline">
                        <Github size={13} className="shrink-0" />
                        <span>GitHub profile</span>
                      </a>
                    )}
                    {profile?.gitHubUsername && !profile?.gitHubUrl && (
                      <a href={`https://github.com/${profile.gitHubUsername}`} target="_blank" className="flex items-center gap-2 text-slate-700 hover:underline">
                        <Github size={13} className="shrink-0" />
                        <span>GitHub: @{profile.gitHubUsername}</span>
                      </a>
                    )}
                    {profile?.behanceUrl && (
                      <a href={profile.behanceUrl} target="_blank" className="flex items-center gap-2 text-blue-600 hover:underline">
                        <span className="text-[11px] font-serif font-black shrink-0">Bē</span>
                        <span>Behance Portfolio</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN - DETAILED METRICS & ARRAYS */}
            <div className="lg:col-span-8 space-y-6">
              {/* Row: Student stats metrics cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white border border-[#781c1c]/10 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Academics</span>
                  <div className="text-2xl font-extrabold text-[#18233c] mt-1.5">{academicRecords.length}</div>
                  <span className="text-[10px] text-slate-400 font-medium">Verified Records</span>
                </div>
                <div className="bg-white border border-[#781c1c]/10 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Experiences</span>
                  <div className="text-2xl font-extrabold text-[#781c1c] mt-1.5">{experiences.length}</div>
                  <span className="text-[10px] text-slate-400 font-medium">Jobs & Internships</span>
                </div>
                <div className="bg-white border border-[#781c1c]/10 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Certifications</span>
                  <div className="text-2xl font-extrabold text-[#d4af37] mt-1.5">{certifications.length}</div>
                  <span className="text-[10px] text-slate-400 font-medium">Courses & Licenses</span>
                </div>
              </div>

              {/* Projects List Card */}
              {projects.length > 0 && (
                <div className="bg-white border border-[#781c1c]/10 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
                  <h3 className="text-xs font-bold text-[#18233c] uppercase tracking-wider pb-3 border-b border-slate-100 mb-4 flex items-center justify-between">
                    <span>Projects & Publications</span>
                    <span className="px-2 py-0.5 text-[9px] font-extrabold text-white bg-[#781c1c] rounded-full scale-90">
                      Real-time
                    </span>
                  </h3>
                  <div className="space-y-4">
                    {projects.slice(0, 3).map((proj, idx) => (
                      <div key={proj.id} className="flex items-start justify-between border-b border-slate-50 last:border-0 pb-3 last:pb-0 text-xs">
                        <div>
                          <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                            {idx + 1}. {proj.title}
                          </h4>
                          {proj.technologies && (
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">Tech: {proj.technologies}</p>
                          )}
                        </div>
                        {(proj.githubUrl || proj.liveUrl) && (
                          <a href={proj.githubUrl || proj.liveUrl} target="_blank" className="text-blue-650 hover:underline flex items-center gap-0.5 text-[10px] font-bold shrink-0">
                            <ExternalLink size={10} /> Link
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline Card */}
              {timelineMilestones.length > 0 && (
                <div className="bg-white border border-[#781c1c]/10 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
                  <h3 className="text-xs font-bold text-[#18233c] uppercase tracking-wider pb-3 border-b border-slate-100 mb-4">Milestones & History</h3>
                  <div className="space-y-4">
                    {timelineMilestones.slice(0, 4).map((m, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs border-b border-slate-50 last:border-0 pb-3 last:pb-0">
                        <div>
                          <h4 className="font-bold text-slate-800">{m.title}</h4>
                          <p className="text-[10px] text-slate-400 font-medium">{m.subtitle}</p>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-500 shrink-0 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg">
                          {m.date}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Achievements & Awards Summary */}
              {achievements.length > 0 && (
                <div className="bg-white border border-[#781c1c]/10 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
                  <h3 className="text-xs font-bold text-[#18233c] uppercase tracking-wider pb-3 border-b border-slate-100 mb-4">Merits & Achievements</h3>
                  <div className="space-y-3.5">
                    {achievements.slice(0, 3).map((ach) => (
                      <div key={ach.id} className="relative pl-4 border-l-2 border-[#d4af37]/30 text-xs">
                        <span className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-[#d4af37]" />
                        <h4 className="font-bold text-slate-800">{ach.title}</h4>
                        <p className="text-[10px] text-slate-450 leading-relaxed mt-0.5">{ach.description}</p>
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
          <div className="bg-white border border-[#781c1c]/10 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.01)] animate-fadeIn">
            <h3 className="text-sm font-bold text-[#18233c] pb-3 border-b border-slate-100 mb-6 flex items-center gap-2">
              <FileText size={16} className="text-[#781c1c]" /> About & Statement of Purpose
            </h3>
            <div className="space-y-5">
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Short Biography</h4>
                <p className="text-xs text-slate-650 mt-1.5 leading-relaxed">{profile?.bio || "No biography added."}</p>
              </div>

              {profile?.personalStory && (
                <div className="border-t border-slate-100 pt-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Personal Journey & Background</h4>
                  <p className="text-xs text-slate-655 mt-1.5 leading-relaxed italic">"{profile.personalStory}"</p>
                </div>
              )}

              {profile?.sop && (
                <div className="border-t border-slate-100 pt-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Statement of Purpose</h4>
                  <div className="text-xs text-slate-650 leading-relaxed p-4 rounded-lg bg-[#f0ece1]/45 border border-[#781c1c]/10 mt-2 whitespace-pre-line">
                    {profile.sop}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case "experience":
        return (
          <div className="bg-white border border-[#781c1c]/10 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.01)] animate-fadeIn">
            <h3 className="text-sm font-bold text-[#18233c] pb-3 border-b border-slate-100 mb-6 flex items-center gap-2">
              <Briefcase size={16} className="text-[#781c1c]" /> Experience History
            </h3>
            {experiences.length > 0 ? (
              <div className="space-y-6">
                {experiences.map((exp) => (
                  <div key={exp.id} className="relative pl-5 border-l-2 border-[#18233c]/20 last:border-transparent pb-1">
                    <span className="absolute -left-[6px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#18233c]" />
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-800">{exp.title}</h4>
                      <span className="px-2 py-0.5 text-[9px] font-bold text-[#781c1c] bg-[#781c1c]/5 rounded border border-[#781c1c]/10">
                        {exp.category}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 mt-0.5">{exp.company} · {exp.location}</p>
                    <p className="text-[9px] font-mono text-slate-400 mt-0.5">{exp.startDate} - {exp.isCurrent ? "Present" : exp.endDate}</p>
                    <p className="text-xs text-slate-655 mt-2 whitespace-pre-line leading-relaxed">{exp.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 text-center py-6">No work experience listed.</div>
            )}
          </div>
        );

      case "academic":
        return (
          <div className="bg-white border border-[#781c1c]/10 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.01)] animate-fadeIn">
            <h3 className="text-sm font-bold text-[#18233c] pb-3 border-b border-slate-100 mb-6 flex items-center gap-2">
              <Award size={16} className="text-[#781c1c]" /> Education Records & Degrees
            </h3>
            {academicRecords.length > 0 ? (
              <div className="space-y-6">
                {academicRecords.map((rec) => (
                  <div key={rec.id} className="relative pl-5 border-l-2 border-[#781c1c]/20 last:border-transparent pb-1">
                    <span className="absolute -left-[6px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#781c1c]" />
                    <h4 className="text-xs font-bold text-slate-855 leading-snug">{rec.degree} in {rec.fieldOfStudy}</h4>
                    <p className="text-[10px] text-slate-500 font-bold mt-0.5">{rec.institution}</p>
                    <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                      Duration: {rec.startYear} - {rec.endYear} · Grade: {rec.grade || "N/A"}
                    </p>
                    {rec.attachmentUrl && (
                      <a href={rec.attachmentUrl} target="_blank" className="inline-flex items-center gap-1.5 text-[9px] font-bold text-[#781c1c] hover:underline mt-2">
                        <FileText size={10} /> View Marksheet Proof
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 text-center py-6">No academic records listed.</div>
            )}
          </div>
        );

      case "achievements":
        return (
          <div className="bg-white border border-[#781c1c]/10 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.01)] animate-fadeIn">
            <h3 className="text-sm font-bold text-[#18233c] pb-3 border-b border-slate-100 mb-6 flex items-center gap-2">
              <Trophy size={16} className="text-[#d4af37]" /> Achievements & Ranks
            </h3>
            {achievements.length > 0 ? (
              <div className="space-y-6">
                {achievements.map((ach) => (
                  <div key={ach.id} className="relative pl-5 border-l-2 border-[#d4af37]/20 last:border-transparent pb-1">
                    <span className="absolute -left-[6px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#d4af37]" />
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-800">{ach.title}</h4>
                      <span className="px-2 py-0.5 text-[9px] font-bold text-[#d4af37] bg-[#d4af37]/5 rounded border border-[#d4af37]/15">
                        {ach.category}
                      </span>
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                      {ach.achievementDate ? new Date(ach.achievementDate).toLocaleDateString() : ""}
                    </p>
                    <p className="text-xs text-slate-655 mt-2 leading-relaxed">{ach.description}</p>
                    {ach.achievementUrl && (
                      <a href={ach.achievementUrl} target="_blank" className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#18233c] hover:underline mt-2">
                        <ExternalLink size={10} /> View merit document
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 text-center py-6">No achievements recorded.</div>
            )}
          </div>
        );

      case "projects-research":
        return (
          <div className="bg-white border border-[#781c1c]/10 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.01)] animate-fadeIn space-y-6">
            <div>
              <h3 className="text-sm font-bold text-[#18233c] pb-3 border-b border-slate-100 mb-6 flex items-center gap-2">
                <GitBranch size={16} className="text-[#781c1c]" /> Projects
              </h3>
              {projects.length > 0 ? (
                <div className="space-y-6">
                  {projects.map((proj) => (
                    <div key={proj.id} className="relative pl-5 border-l-2 border-emerald-500/20 last:border-transparent pb-1">
                      <span className="absolute -left-[6px] top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-800">{proj.title}</h4>
                        <span className="px-2 py-0.5 text-[9px] font-bold text-emerald-600 bg-emerald-50 rounded border border-emerald-100">
                          Project
                        </span>
                      </div>
                      <p className="text-[9px] font-bold text-slate-500 mt-0.5">Tech stack: {proj.technologies}</p>
                      <p className="text-xs text-slate-655 mt-2 leading-relaxed">{proj.description}</p>
                      {(proj.githubUrl || proj.liveUrl) && (
                        <a href={proj.githubUrl || proj.liveUrl} target="_blank" className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:underline mt-2">
                          <ExternalLink size={10} /> View Project Link
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-400 text-center py-6">No projects listed.</div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-6">
              <h3 className="text-sm font-bold text-[#18233c] pb-3 border-b border-slate-100 mb-6 flex items-center gap-2">
                <GitBranch size={16} className="text-[#781c1c]" /> Research Publications
              </h3>
              {researchPapers.length > 0 ? (
                <div className="space-y-6">
                  {researchPapers.map((paper) => (
                    <div key={paper.id} className="relative pl-5 border-l-2 border-purple-500/20 last:border-transparent pb-1">
                      <span className="absolute -left-[6px] top-1.5 w-2.5 h-2.5 rounded-full bg-purple-500" />
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-800">{paper.title}</h4>
                        <span className="px-2 py-0.5 text-[9px] font-bold text-purple-600 bg-purple-50 rounded border border-purple-100">
                          Publication
                        </span>
                      </div>
                      <p className="text-[9px] font-bold text-slate-500 mt-0.5">{paper.conference} · {paper.publishedDate ? new Date(paper.publishedDate).toLocaleDateString() : ""}</p>
                      <p className="text-xs text-slate-655 mt-2 leading-relaxed italic">"{paper.abstract}"</p>
                      {paper.paperUrl && (
                        <a href={paper.paperUrl} target="_blank" className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-650 hover:underline mt-2">
                          <ExternalLink size={10} /> Read Paper PDF
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-400 text-center py-6">No publications listed.</div>
              )}
            </div>
          </div>
        );

      case "skills":
        return (
          <div className="bg-white border border-[#781c1c]/10 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.01)] animate-fadeIn">
            <h3 className="text-sm font-bold text-[#18233c] pb-3 border-b border-slate-100 mb-6 flex items-center gap-2">
              <Code2 size={16} className="text-[#781c1c]" /> Skills Arsenal & Proficiencies
            </h3>
            {skills.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {skills.map((skill) => (
                  <div key={skill.id} className="border border-slate-100 p-4 rounded-xl bg-slate-50/50 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-xs text-slate-800">{skill.name}</h4>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 block">{skill.category}</span>
                    </div>
                    <span className="text-[9px] font-extrabold px-2 py-0.5 bg-[#781c1c]/5 text-[#781c1c] border border-[#781c1c]/15 rounded-full uppercase">
                      {skill.level}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 text-center py-6">No skills listed yet.</div>
            )}
          </div>
        );

      case "licenses-certifications":
        return (
          <div className="bg-white border border-[#781c1c]/10 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.01)] animate-fadeIn">
            <h3 className="text-sm font-bold text-[#18233c] pb-3 border-b border-slate-100 mb-6 flex items-center gap-2">
              <Award size={16} className="text-[#781c1c]" /> Licenses & Certifications
            </h3>
            {certifications.length > 0 ? (
              <div className="space-y-6">
                {certifications.map((cert) => (
                  <div key={cert.id} className="relative pl-5 border-l-2 border-[#781c1c]/25 last:border-transparent pb-1">
                    <span className="absolute -left-[6px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#781c1c]" />
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-800">{cert.title}</h4>
                      <span className="px-2 py-0.5 text-[9px] font-bold text-[#781c1c] bg-[#781c1c]/5 rounded border border-[#781c1c]/10">
                        {cert.category}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold mt-0.5">{cert.issuer}</p>
                    <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                      Issued: {cert.issueDate ? new Date(cert.issueDate).toLocaleDateString() : ""}
                    </p>
                    {cert.certificateUrl && (
                      <a href={cert.certificateUrl} target="_blank" className="inline-flex items-center gap-1 text-[10px] font-bold text-[#18233c] hover:underline mt-2">
                        <ExternalLink size={10} /> View certification document
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 text-center py-6">No certifications listed.</div>
            )}
          </div>
        );

      case "languages":
        return (
          <div className="bg-white border border-[#781c1c]/10 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.01)] animate-fadeIn">
            <h3 className="text-sm font-bold text-[#18233c] pb-3 border-b border-slate-100 mb-6 flex items-center gap-2">
              <Globe size={16} className="text-[#18233c]" /> Languages Known
            </h3>
            {profile?.languages ? (
              <div className="flex flex-wrap gap-2">
                {profile.languages.split(",").map((l: string, i: number) => (
                  <span key={i} className="px-3 py-1.5 bg-[#f0ece1]/50 border border-[#781c1c]/10 text-xs font-semibold rounded-lg text-[#18233c]">
                    {l.trim()}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 text-center py-6">No languages listed.</div>
            )}
          </div>
        );

      case "test-scores":
        return (
          <div className="bg-white border border-[#781c1c]/10 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.01)] animate-fadeIn">
            <h3 className="text-sm font-bold text-[#18233c] pb-3 border-b border-slate-100 mb-6 flex items-center gap-2">
              <Award size={16} className="text-[#781c1c]" /> Standardized Test Scores
            </h3>
            {profile?.testScores ? (
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg text-xs leading-relaxed text-slate-655 whitespace-pre-line">
                {profile.testScores}
              </div>
            ) : (
              <div className="text-xs text-slate-400 text-center py-6">No test scores recorded.</div>
            )}
          </div>
        );

      case "patents":
        return (
          <div className="bg-white border border-[#781c1c]/10 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.01)] animate-fadeIn">
            <h3 className="text-sm font-bold text-[#18233c] pb-3 border-b border-slate-100 mb-6 flex items-center gap-2">
              <FileText size={16} className="text-[#781c1c]" /> Patents
            </h3>
            {profile?.patents ? (
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg text-xs leading-relaxed text-slate-655 whitespace-pre-line">
                {profile.patents}
              </div>
            ) : (
              <div className="text-xs text-slate-400 text-center py-6">No patents listed.</div>
            )}
          </div>
        );

      case "media-handles":
        return (
          <div className="bg-white border border-[#781c1c]/10 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.01)] animate-fadeIn">
            <h3 className="text-sm font-bold text-[#18233c] pb-3 border-b border-slate-100 mb-4 flex items-center gap-2">
              <LinkIcon size={16} className="text-[#781c1c]" /> Connected Social Handles
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {profile?.linkedInUrl && (
                <a href={profile.linkedInUrl} target="_blank" className="border border-slate-205 p-4 rounded-xl flex items-center gap-3 bg-slate-50/50 hover:bg-slate-50 transition">
                  <Linkedin size={20} className="text-[#0a66c2]" />
                  <div>
                    <span className="font-bold text-xs text-[#18233c] block">LinkedIn Profile</span>
                    <span className="text-[10px] text-slate-455 block mt-0.5 truncate">{profile.linkedInUrl}</span>
                  </div>
                </a>
              )}
              {profile?.gitHubUrl && (
                <a href={profile.gitHubUrl} target="_blank" className="border border-slate-205 p-4 rounded-xl flex items-center gap-3 bg-slate-50/50 hover:bg-slate-50 transition">
                  <Github size={20} className="text-slate-850" />
                  <div>
                    <span className="font-bold text-xs text-[#18233c] block">GitHub Profile</span>
                    <span className="text-[10px] text-slate-455 block mt-0.5 truncate">{profile.gitHubUrl}</span>
                  </div>
                </a>
              )}
              {profile?.instagramUrl && (
                <a href={profile.instagramUrl} target="_blank" className="border border-slate-205 p-4 rounded-xl flex items-center gap-3 bg-slate-50/50 hover:bg-slate-50 transition">
                  <InstagramIcon size={20} className="text-pink-655" />
                  <div>
                    <span className="font-bold text-xs text-[#18233c] block">Instagram Profile</span>
                    <span className="text-[10px] text-slate-455 block mt-0.5 truncate">{profile.instagramUrl}</span>
                  </div>
                </a>
              )}
              {profile?.blogUrl && (
                <a href={profile.blogUrl} target="_blank" className="border border-slate-205 p-4 rounded-xl flex items-center gap-3 bg-slate-50/50 hover:bg-slate-50 transition">
                  <Globe size={20} className="text-emerald-600" />
                  <div>
                    <span className="font-bold text-xs text-[#18233c] block">Blog / Website</span>
                    <span className="text-[10px] text-slate-455 block mt-0.5 truncate">{profile.blogUrl}</span>
                  </div>
                </a>
              )}
              {profile?.behanceUrl && (
                <a href={profile.behanceUrl} target="_blank" className="border border-slate-205 p-4 rounded-xl flex items-center gap-3 bg-slate-50/50 hover:bg-slate-50 transition">
                  <span className="text-[#1769ff] font-serif font-black text-xl w-5 text-center shrink-0">Bē</span>
                  <div>
                    <span className="font-bold text-xs text-[#18233c] block">Behance Portfolio</span>
                    <span className="text-[10px] text-slate-455 block mt-0.5 truncate">{profile.behanceUrl}</span>
                  </div>
                </a>
              )}
              {profile?.otherHandles && (
                <div className="border border-slate-205 p-4 rounded-xl bg-slate-50/50 sm:col-span-2">
                  <span className="font-bold text-xs text-[#18233c] block">Other Information / Handles</span>
                  <p className="text-xs text-slate-655 mt-1 leading-relaxed">{profile.otherHandles}</p>
                </div>
              )}
            </div>
          </div>
        );

      case "resume":
        return (
          <div className="bg-white border border-[#781c1c]/10 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.01)] animate-fadeIn">
            <h3 className="text-sm font-bold text-[#18233c] pb-3 border-b border-slate-100 mb-6 flex items-center gap-2">
              <FileText size={16} className="text-[#781c1c]" /> Official Resume Archive
            </h3>
            {resumes.length > 0 ? (
              <div className="space-y-3">
                {resumes.map((res) => (
                  <div key={res.id} className="border border-slate-205 p-4 rounded-xl flex flex-col bg-slate-50/50">
                    <div className="flex justify-between items-center w-full">
                      <div className="flex items-center gap-3">
                        <FileText className="text-blue-500" size={24} />
                        <div>
                          <h5 className="font-bold text-xs text-slate-800">{res.resumeTitle}</h5>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-[10px] text-slate-450 font-bold">Verified Placement CV</span>
                            <button
                              onClick={() => setPreviewResumeUrl(previewResumeUrl === res.resumeUrl ? null : res.resumeUrl)}
                              className="text-[10px] text-[#781c1c] hover:underline flex items-center gap-0.5 cursor-pointer bg-transparent border-none p-0 font-bold"
                            >
                              <Eye size={10} /> {previewResumeUrl === res.resumeUrl ? "Hide Preview" : "Preview"}
                            </button>
                          </div>
                        </div>
                      </div>
                      <a href={res.resumeUrl} target="_blank" className="flex items-center gap-1.5 px-3 py-1.5 bg-[#781c1c] hover:bg-[#5f1515] text-white rounded-lg text-xs font-bold transition shadow-xs">
                        <Download size={12} />
                        <span>Download</span>
                      </a>
                    </div>
                    {previewResumeUrl === res.resumeUrl && (
                      <div className="mt-4 w-full h-[500px] rounded-xl overflow-hidden border border-slate-200 shadow-inner">
                        <iframe src={res.resumeUrl} className="w-full h-full" title="Resume Preview" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 text-center py-6">No resume file uploaded yet.</div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-[#fcfaf6] text-[#2c2c2c] flex font-sans selection:bg-[#781c1c]/20 selection:text-[#781c1c]">
      
      {/* LEFT SIDEBAR (DESKTOP) */}
      <aside className={`bg-[#18233c] text-slate-300 flex flex-col transition-all duration-300 shrink-0 select-none hidden md:flex border-r border-[#781c1c]/15 ${
        isSidebarCollapsed ? "w-16" : "w-64"
      }`}>
        {/* Sidebar Brand Header - MCC Navy / Gold details with Logo */}
        <div className="h-16 border-b border-slate-700/50 flex items-center gap-2.5 px-4 shrink-0">
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-2 select-none overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0 border border-[#d4af37]/30 shadow-sm overflow-hidden p-0.5">
                <img src="/mcc-crest.png" className="w-full h-full object-contain" alt="MCC Crest" />
              </div>
              <span className="font-serif font-black text-white tracking-tight text-[10px] uppercase leading-tight">
                <span className="text-[#d4af37] font-serif block">MADRAS</span> CHRISTIAN COLLEGE
              </span>
            </div>
          )}
          {isSidebarCollapsed && (
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center mx-auto border border-[#d4af37]/30 shadow-sm overflow-hidden p-0.5" title="Madras Christian College">
              <img src="/mcc-crest.png" className="w-full h-full object-contain" alt="MCC Crest" />
            </div>
          )}
        </div>

        {/* Student Mini Avatar Card */}
        <div className={`p-4 border-b border-slate-700/30 flex items-center gap-3 ${
          isSidebarCollapsed ? "justify-center" : ""
        }`}>
          {(profile?.profileImageUrl || user?.profileImageUrl) && !imgError ? (
            <img 
              src={profile?.profileImageUrl || user?.profileImageUrl} 
              onError={() => setImgError(true)}
              className="w-8 h-8 rounded-full object-cover border border-[#d4af37]/40" 
              alt={user.fullName} 
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#781c1c] text-white flex items-center justify-center text-xs font-bold border border-amber-600/30">
              {initials}
            </div>
          )}
          {!isSidebarCollapsed && (
            <div className="overflow-hidden">
              <h4 className="text-[11px] font-bold text-white truncate max-w-[130px] flex items-center gap-1.5">
                {user.fullName}
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block shrink-0 animate-pulse" />
              </h4>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center transition-all duration-150 px-3 py-2 rounded-lg text-xs font-bold text-left ${
                  isActive
                    ? "bg-[#781c1c] text-white border-l-4 border-[#d4af37] pl-2 shadow-xs"
                    : "hover:bg-slate-800/30 hover:text-white"
                } ${isSidebarCollapsed ? "justify-center pl-3" : ""}`}
                title={item.label}
              >
                <Icon size={14} className={`shrink-0 ${isActive ? "text-[#d4af37]" : ""}`} />
                {!isSidebarCollapsed && <span className="ml-3 truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Collapse Toggle Chevron */}
        <div className="p-3 border-t border-slate-700/50 flex justify-center">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="w-8 h-8 rounded-lg hover:bg-slate-800/40 flex items-center justify-center text-slate-500 hover:text-white transition"
          >
            {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>
      </aside>

      {/* MOBILE DRAWER SIDEBAR OVERLAY */}
      {showMobileNav && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-[#18233c]/60 backdrop-blur-xs">
          <div className="w-64 bg-[#18233c] text-slate-300 flex flex-col p-4 animate-slideIn">
            <div className="flex justify-between items-center pb-4 border-b border-slate-700/40">
              <span className="font-serif font-black text-white tracking-widest text-xs uppercase flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-[#d4af37]/30 shadow-sm overflow-hidden shrink-0 p-0.5">
                  <img src="/mcc-crest.png" className="w-full h-full object-contain" alt="MCC Crest" />
                </div>
                <span className="text-[#d4af37]">MCC</span> PORTFOLIO
              </span>
              <button onClick={() => setShowMobileNav(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="flex items-center gap-3 py-4 border-b border-slate-700/30">
              {(profile?.profileImageUrl || user?.profileImageUrl) && !imgError ? (
                <img 
                  src={profile?.profileImageUrl || user?.profileImageUrl} 
                  onError={() => setImgError(true)}
                  className="w-8 h-8 rounded-full object-cover border border-[#d4af37]/40" 
                  alt={user.fullName} 
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#781c1c] text-white flex items-center justify-center text-xs font-bold">
                  {initials}
                </div>
              )}
              <h4 className="text-[11px] font-bold text-white truncate max-w-[130px] flex items-center gap-1.5">
                {user.fullName}
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
              </h4>
            </div>

            <nav className="flex-1 py-3 space-y-1 overflow-y-auto">
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
                    className={`w-full flex items-center px-3 py-2 rounded-lg text-xs font-bold text-left ${
                      isActive
                        ? "bg-[#781c1c] text-white border-l-4 border-[#d4af37] pl-2"
                        : "text-slate-300 hover:bg-slate-800/30 hover:text-white"
                    }`}
                  >
                    <Icon size={14} className={isActive ? "text-[#d4af37]" : ""} />
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
        <header className="h-16 bg-white border-b border-[#781c1c]/10 flex items-center justify-between px-6 z-10 select-none shadow-xs shrink-0">
          <div className="flex items-center gap-3">
            {/* Hamburger Button for mobile */}
            <button
              onClick={() => setShowMobileNav(true)}
              className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
            >
              <Menu size={18} />
            </button>

            <div>
              <h1 className="text-sm font-extrabold text-[#18233c] tracking-tight leading-none font-serif">{getBreadcrumbTitle()}</h1>
              <div className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider font-mono">
                Home <span className="mx-1 text-slate-300">&gt;</span> {getBreadcrumbTitle()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <span className="text-sm font-extrabold text-[#18233c] tracking-tight font-serif uppercase truncate max-w-[120px] sm:max-w-[200px] md:max-w-none" title={user.fullName}>
              {user.fullName}
            </span>
          </div>
        </header>

        {/* DASHBOARD CONTENT BODY */}
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto space-y-6">
          
          {/* Welcome greeting banner */}
          <div className="flex justify-between items-center pb-2">
            <h1 className="text-base font-extrabold text-[#18233c] font-serif">
              Welcome {user.fullName?.split(" ")[0] || "Praveen"}
            </h1>
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
    <Suspense fallback={
      <div className="min-h-screen bg-[#fcfaf6] text-[#2c2c2c] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-[#781c1c] border-r-[#18233c] border-b-transparent border-l-transparent rounded-full animate-spin mx-auto mb-6" />
          <p className="text-slate-500 font-bold tracking-widest text-xs uppercase animate-pulse">Loading MCC Resume Portfolio...</p>
        </div>
      </div>
    }>
      <PortfolioPageContent />
    </Suspense>
  );
}
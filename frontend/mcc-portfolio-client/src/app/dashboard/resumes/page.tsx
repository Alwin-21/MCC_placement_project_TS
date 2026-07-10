"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Briefcase,
  Award,
  Code,
  LogOut,
  Plus,
  GitBranch,
  Trophy,
  Sparkles,
  Trash2,
  Sun,
  Moon,
  FileText,
  Eye,
  Edit,
  Globe,
  Link,
  ChevronRight,
  Menu,
  X,
  Copy,
  Download,
  Calendar,
  AlertCircle
} from "lucide-react";
import api from "@/services/api";
import { useTheme } from "@/hooks/useTheme";

export default function ResumesDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [resumes, setResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newResumeTitle, setNewResumeTitle] = useState("");
  const [themeMode, toggleThemeMode] = useTheme();
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchUserProfile();
    fetchSavedResumes();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const res = await api.get("/Profiles");
      if (res.data && res.data.user) {
        setUser(res.data.user);
      }
    } catch (err) {
      console.error("Failed to fetch user profile", err);
    }
  };

  const fetchSavedResumes = async () => {
    try {
      setLoading(true);
      const res = await api.get("/SavedResumes");
      setResumes(res.data);
    } catch (err) {
      console.error("Failed to fetch saved resumes", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateResume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResumeTitle.trim()) return;

    try {
      setCreating(true);
      const res = await api.post("/SavedResumes", {
        resumeTitle: newResumeTitle.trim(),
        selectedTheme: "Professional",
        accentColor: "#18233c",
        resumeDataJson: "{}"
      });
      setShowCreateModal(false);
      setNewResumeTitle("");
      // Redirect to the newly created resume editor
      router.push(`/dashboard/resumes/${res.data.id}`);
    } catch (err) {
      alert("Failed to create resume. Please try again.");
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleDuplicate = async (id: number) => {
    try {
      await api.post(`/SavedResumes/${id}/duplicate`);
      fetchSavedResumes();
    } catch (err) {
      alert("Failed to duplicate resume.");
      console.error(err);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This will not affect your portfolio data.`)) {
      return;
    }
    try {
      await api.delete(`/SavedResumes/${id}`);
      setResumes(resumes.filter((r) => r.id !== id));
    } catch (err) {
      alert("Failed to delete resume.");
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const formatUpdateDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Nav scroll helper (redirects to main dashboard with section hash)
  const navigateToDashboardSection = (sectionId: string) => {
    router.push(`/dashboard#${sectionId}`);
  };

  return (
    <div className={`flex h-screen overflow-hidden ${themeMode === "dark" ? "bg-[#09090d] text-white" : "bg-slate-50 text-slate-900"}`}>
      
      {/* DESKTOP SIDEBAR */}
      <div className={`hidden md:flex flex-col w-72 shrink-0 border-r select-none ${
        themeMode === "dark" ? "bg-[#09090d] border-white/5" : "bg-[#18233c] border-[#781c1c]/10 text-white shadow-xl"
      }`}>
        {/* Brand Crest */}
        <div className="flex items-center gap-2.5 p-6 border-b border-white/10">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-white/20 shadow-sm overflow-hidden p-0.5">
            <img src="/mcc-crest.png" className="w-full h-full object-contain" alt="MCC Crest" />
          </div>
          <div>
            <span className="font-serif font-black text-xs tracking-tight text-white block leading-none">
              MADRAS CHRISTIAN
            </span>
            <span className="font-serif font-black text-xs tracking-tight text-white block mt-0.5 leading-none">
              COLLEGE
            </span>
          </div>
        </div>

        {/* Navigation Sidebar List */}
        <div className="flex-1 py-6 overflow-y-auto px-4 space-y-1.5 scrollbar-thin">
          <button onClick={() => navigateToDashboardSection("header-section")} className="w-full flex items-center gap-3 transition px-4 py-2.5 rounded-xl text-sm font-medium text-left text-slate-300 hover:text-white hover:bg-white/5 cursor-pointer">
            <User size={16} className="text-[#781c1c]" /> Header Section
          </button>
          <button onClick={() => navigateToDashboardSection("about-section")} className="w-full flex items-center gap-3 transition px-4 py-2.5 rounded-xl text-sm font-medium text-left text-slate-300 hover:text-white hover:bg-white/5 cursor-pointer">
            <FileText size={16} className="text-[#781c1c]" /> About Section
          </button>
          <button onClick={() => navigateToDashboardSection("experience-section")} className="w-full flex items-center gap-3 transition px-4 py-2.5 rounded-xl text-sm font-medium text-left text-slate-300 hover:text-white hover:bg-white/5 cursor-pointer">
            <Briefcase size={16} className="text-[#781c1c]" /> Experience
          </button>
          <button onClick={() => navigateToDashboardSection("academic-section")} className="w-full flex items-center gap-3 transition px-4 py-2.5 rounded-xl text-sm font-medium text-left text-slate-300 hover:text-white hover:bg-white/5 cursor-pointer">
            <Award size={16} className="text-[#781c1c]" /> Academic Details
          </button>
          <button onClick={() => navigateToDashboardSection("achievements-section")} className="w-full flex items-center gap-3 transition px-4 py-2.5 rounded-xl text-sm font-medium text-left text-slate-300 hover:text-white hover:bg-white/5 cursor-pointer">
            <Trophy size={16} className="text-[#781c1c]" /> Achievements
          </button>
          <button onClick={() => navigateToDashboardSection("projects-research-section")} className="w-full flex items-center gap-3 transition px-4 py-2.5 rounded-xl text-sm font-medium text-left text-slate-300 hover:text-white hover:bg-white/5 cursor-pointer">
            <GitBranch size={16} className="text-[#781c1c]" /> Projects & Research
          </button>
          <button onClick={() => navigateToDashboardSection("skills-section")} className="w-full flex items-center gap-3 transition px-4 py-2.5 rounded-xl text-sm font-medium text-left text-slate-300 hover:text-white hover:bg-white/5 cursor-pointer">
            <Code size={16} className="text-[#781c1c]" /> Skills
          </button>

          <div className="pt-4 border-t border-white/5 space-y-1">
            <button
              onClick={() => router.push("/dashboard/resumes")}
              className={`w-full flex items-center gap-3 transition px-4 py-2.5 rounded-xl text-sm font-semibold text-left bg-white/10 text-white cursor-pointer`}
            >
              <Sparkles size={16} className="text-emerald-400" /> Resume Builder
            </button>
            <button onClick={() => router.push("/dashboard")} className="w-full flex items-center gap-3 transition px-4 py-2.5 rounded-xl text-sm font-medium text-left text-slate-300 hover:text-white hover:bg-white/5 cursor-pointer">
              <Eye size={16} className="text-emerald-400" /> Back to Dashboard
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-3 rounded-xl text-sm font-semibold transition cursor-pointer"
          >
            <LogOut size={16} /> Log Out
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER SIDEBAR OVERLAY */}
      {showMobileNav && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-black/60 backdrop-blur-xs select-none">
          <div className={`w-72 flex flex-col p-5 animate-slideIn h-screen border-r ${
            themeMode === "dark" ? "bg-[#09090d] border-white/5 text-white" : "bg-[#18233c] border-[#781c1c]/10 text-white shadow-xl"
          }`}>
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
            
            <nav className="flex-1 py-4 space-y-1 overflow-y-auto scrollbar-thin">
              <button onClick={() => { navigateToDashboardSection("header-section"); setShowMobileNav(false); }} className="w-full flex items-center gap-3 transition px-4 py-2.5 rounded-xl text-sm font-medium text-left text-slate-300 hover:text-white cursor-pointer">
                <User size={16} className="text-[#781c1c]" /> Header Section
              </button>
              <button onClick={() => { navigateToDashboardSection("about-section"); setShowMobileNav(false); }} className="w-full flex items-center gap-3 transition px-4 py-2.5 rounded-xl text-sm font-medium text-left text-slate-300 hover:text-white cursor-pointer">
                <FileText size={16} className="text-[#781c1c]" /> About Section
              </button>
              <button onClick={() => { navigateToDashboardSection("experience-section"); setShowMobileNav(false); }} className="w-full flex items-center gap-3 transition px-4 py-2.5 rounded-xl text-sm font-medium text-left text-slate-300 hover:text-white cursor-pointer">
                <Briefcase size={16} className="text-[#781c1c]" /> Experience
              </button>
              <button onClick={() => { navigateToDashboardSection("academic-section"); setShowMobileNav(false); }} className="w-full flex items-center gap-3 transition px-4 py-2.5 rounded-xl text-sm font-medium text-left text-slate-300 hover:text-white cursor-pointer">
                <Award size={16} className="text-[#781c1c]" /> Academic Details
              </button>
              
              <div className="pt-4 border-t border-white/5 space-y-1">
                <button
                  onClick={() => { router.push("/dashboard/resumes"); setShowMobileNav(false); }}
                  className="w-full flex items-center gap-3 transition px-4 py-2.5 rounded-xl text-sm font-semibold text-left bg-white/10 text-white cursor-pointer"
                >
                  <Sparkles size={16} className="text-emerald-400" /> Resume Builder
                </button>
                <button onClick={() => { router.push("/dashboard"); setShowMobileNav(false); }} className="w-full flex items-center gap-3 transition px-4 py-2.5 rounded-xl text-sm font-medium text-left text-slate-300 hover:text-white cursor-pointer">
                  <Eye size={16} className="text-emerald-400" /> Back to Dashboard
                </button>
              </div>
            </nav>
            <div className="pt-4 border-t border-white/10">
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-left hover:bg-red-500/10 text-red-400 cursor-pointer">
                <LogOut size={16} /> Log Out
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setShowMobileNav(false)} />
        </div>
      )}

      {/* RIGHT CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* MOBILE TOP BAR */}
        <div className="sticky top-0 z-40 md:hidden flex items-center justify-between p-4 bg-white/90 dark:bg-[#09090d]/90 backdrop-blur-md border-b border-slate-200 dark:border-white/5 select-none shadow-md shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMobileNav(true)}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"
            >
              <Menu size={20} />
            </button>
            <span className="font-serif font-black text-[#18233c] dark:text-white tracking-tight text-xs uppercase">
              Resume Dashboard
            </span>
          </div>
        </div>

        {/* DESKTOP TOP BAR */}
        <div className="hidden md:flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/5 bg-white/50 dark:bg-[#09090d]/50 backdrop-blur-md shrink-0">
          <div>
            <h1 className="text-2xl font-serif font-black text-[#18233c] dark:text-white">Resume Builder Dashboard</h1>
            <p className="text-xs opacity-60 mt-1">Design and manage multiple professional resumes generated from your portfolio.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-[#781c1c] hover:bg-[#5f1515] text-white px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 shadow-sm shadow-[#781c1c]/10 cursor-pointer"
            >
              <Plus size={16} /> Create Resume
            </button>
          </div>
        </div>

        {/* MAIN BODY AREA */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {/* Mobile Create Button Row */}
          <div className="md:hidden mb-6 flex justify-end">
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full bg-[#781c1c] hover:bg-[#5f1515] text-white py-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <Plus size={16} /> Create Resume
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-4 border-[#781c1c] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm opacity-60">Fetching your resumes...</p>
            </div>
          ) : resumes.length === 0 ? (
            <div className={`border-2 border-dashed rounded-3xl p-12 text-center max-w-xl mx-auto mt-8 transition ${
              themeMode === "dark" ? "border-white/10 bg-white/[0.01]" : "border-slate-200 bg-white shadow-sm"
            }`}>
              <FileText className="mx-auto text-slate-400 dark:text-white/20 mb-4" size={48} />
              <h3 className="text-lg font-bold mb-2">No resumes found</h3>
              <p className="text-sm opacity-60 mb-6 max-w-md mx-auto">
                Build high-quality professional resumes dynamically populated with your Academic, Skills, and Experience details.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-[#18233c] hover:bg-[#0f1627] text-white px-6 py-2.5 rounded-xl font-bold text-xs transition inline-flex items-center gap-2 shadow-md cursor-pointer"
              >
                <Plus size={16} /> Build Your First Resume
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {resumes.map((resume) => (
                <div
                  key={resume.id}
                  className={`border rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] hover:shadow-lg ${
                    themeMode === "dark"
                      ? "bg-white/[0.02] border-white/5 hover:border-white/10"
                      : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#781c1c]/10 text-[#781c1c] border border-[#781c1c]/25 shrink-0">
                        <FileText size={20} />
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase tracking-wider ${
                        resume.selectedTheme === "Professional"
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/25"
                          : resume.selectedTheme === "Classic ATS"
                          ? "bg-neutral-500/10 text-neutral-400 border border-neutral-500/25"
                          : "bg-purple-500/10 text-purple-400 border border-purple-500/25"
                      }`}>
                        {resume.selectedTheme}
                      </span>
                    </div>

                    <h3 className="font-serif font-black text-lg mb-1 leading-snug break-words">
                      {resume.resumeTitle}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs opacity-50 mb-6">
                      <Calendar size={12} />
                      <span>Updated {formatUpdateDate(resume.updatedAt)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 border-t border-slate-200 dark:border-white/5 pt-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/dashboard/resumes/${resume.id}`)}
                        className="flex-1 bg-[#18233c] hover:bg-[#0f1627] text-white py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Edit size={14} /> Edit
                      </button>
                      <button
                        onClick={() => router.push(`/dashboard/resumes/${resume.id}?print=true`)}
                        className={`flex-1 border py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          themeMode === "dark"
                            ? "border-white/10 hover:bg-white/5 text-white"
                            : "border-slate-200 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <Download size={14} /> PDF
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDuplicate(resume.id)}
                        className={`flex-1 border py-1.5 rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                          themeMode === "dark"
                            ? "border-white/5 hover:bg-white/5 text-slate-300"
                            : "border-slate-100 hover:bg-slate-50 text-slate-600"
                        }`}
                        title="Duplicate Resume"
                      >
                        <Copy size={12} /> Duplicate
                      </button>
                      <button
                        onClick={() => handleDelete(resume.id, resume.resumeTitle)}
                        className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-1.5 rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                        title="Delete Resume"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4">
          <div
            className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl animate-scaleIn ${
              themeMode === "dark" ? "bg-[#0c0c12] border-white/10 text-white" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-white/5 mb-5">
              <h3 className="font-serif text-lg font-black flex items-center gap-2">
                <Sparkles size={18} className="text-[#781c1c]" /> Create New Resume
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewResumeTitle("");
                }}
                className="text-slate-400 hover:text-white cursor-pointer p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateResume} className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500">
                  Resume Title / Target Role *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Software Engineer Resume 2026"
                  value={newResumeTitle}
                  onChange={(e) => setNewResumeTitle(e.target.value)}
                  className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition focus:border-[#781c1c] ${
                    themeMode === "dark"
                      ? "bg-[#121217] border-white/5 text-white"
                      : "bg-white border-slate-200 text-slate-900"
                  }`}
                />
              </div>

              <div className="flex gap-2 items-center justify-end pt-3 border-t border-slate-200 dark:border-white/5 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewResumeTitle("");
                  }}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    themeMode === "dark"
                      ? "hover:bg-white/5 text-slate-300"
                      : "hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newResumeTitle.trim()}
                  className="bg-[#781c1c] hover:bg-[#5f1515] text-white px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create & Open Editor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

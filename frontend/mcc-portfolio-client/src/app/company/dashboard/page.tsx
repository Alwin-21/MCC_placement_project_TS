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
} from "lucide-react";
import api from "@/services/api";
import { useTheme } from "@/hooks/useTheme";

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

export default function CompanyDashboardPage() {
  const router = useRouter();
  const [themeMode, toggleThemeMode] = useTheme();
  const isDark = themeMode === "dark";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [saveLoading, setSaveLoading] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/Company/profile");
      setProfile(res.data.hrUser);
      setCompany(res.data.company);
      
      // Initialize edit form
      const prof = res.data.company.profile || {};
      const headLoc = res.data.company.locations.find((l: any) => l.isHeadOffice)?.location || "";
      const branches = res.data.company.locations.filter((l: any) => !l.isHeadOffice).map((l: any) => l.location);

      setEditForm({
        name: res.data.company.name,
        website: prof.website || "",
        linkedInUrl: prof.linkedInUrl || "",
        industry: prof.industry || "",
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
        workMode: res.data.company.locations?.[0]?.workMode || "OnSite",
      });
    } catch (err: any) {
      console.error(err);
      setError("Failed to load company profile workspace.");
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
    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/company/login");
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaveLoading(true);
      await api.put("/Company/profile", editForm);
      setIsEditing(false);
      await fetchProfile();
    } catch (err: any) {
      setError("Failed to save profile changes.");
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-[#090d16]" : "bg-[#faf9f6]"}`}>
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-500">Loading company workspace...</p>
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
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const isPending = company?.status === "Pending";
  const statusColors: Record<string, string> = {
    Pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    Verified: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    Rejected: "bg-red-500/10 text-red-500 border-red-500/20",
    Suspended: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  };

  const headOfficeLoc = company?.locations?.find((l: any) => l.isHeadOffice)?.location || "Not Configured";
  const branches = company?.locations?.filter((l: any) => !l.isHeadOffice) || [];

  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}
      className={`min-h-screen flex flex-col transition-colors duration-300 ${
        isDark ? "bg-[#090d16] text-slate-100" : "bg-[#faf9f6] text-slate-900"
      }`}
    >
      {/* HEADER NAVBAR */}
      <header className="sticky top-0 z-40 backdrop-blur-md border-b border-slate-200/50 dark:border-white/10 p-4 bg-white/30 dark:bg-black/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25">
              <Building2 size={20} />
            </div>
            <div>
              <span className="text-sm font-black uppercase tracking-wider block leading-none">
                MCC Placement Portal
              </span>
              <span className="text-[10px] text-slate-400 font-bold block mt-1">
                Company Workspace
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleThemeMode}
              className={`w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer transition ${
                isDark ? "bg-white/5 border-white/10 text-amber-300" : "bg-slate-100 border-slate-350 text-slate-700"
              }`}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase transition cursor-pointer shadow-lg shadow-red-900/10"
            >
              <LogOut size={14} /> Log Out
            </button>
          </div>
        </div>
      </header>

      {/* DASHBOARD BODY */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6">
        {/* STATUS BANNER */}
        <div
          className={`border rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
            statusColors[company?.status] || "bg-slate-500/10 text-slate-500 border-slate-500/20"
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
                  ? "Your onboarding request is currently under review by the placement administration. Placement feature blocks (Job posting, Student search) are locked until status is Verified."
                  : "Congratulations! Your account is verified. You can configure placement information and manage hiring status."}
              </p>
            </div>
          </div>
        </div>

        {/* PROFILE INFORMATION ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN: COMPANY CARD */}
          <div className="space-y-6 lg:col-span-1">
            <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-white/10 bg-white/40 dark:bg-white/[0.02] space-y-6 text-center">
              <div className="flex flex-col items-center gap-4">
                {company?.profile?.logoUrl ? (
                  <img
                    src={company?.profile?.logoUrl}
                    className="w-24 h-24 object-contain rounded-2xl border p-2 bg-white"
                    alt="Company Logo"
                  />
                ) : (
                  <div className="w-24 h-24 bg-blue-600/10 text-blue-500 dark:text-blue-300 rounded-2xl flex items-center justify-center border p-2">
                    <Building2 size={40} />
                  </div>
                )}
                <div className="space-y-1">
                  <h2 className="text-xl font-black">{company?.name}</h2>
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                    {company?.profile?.industry || "Not Specified"}
                  </span>
                </div>
              </div>

              <div className="flex justify-center gap-4 border-t border-slate-200/50 dark:border-white/5 pt-4">
                {company?.profile?.website && (
                  <a
                    href={company?.profile?.website}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-blue-600 transition"
                  >
                    <Globe size={18} />
                  </a>
                )}
                {company?.profile?.linkedInUrl && (
                  <a
                    href={company?.profile?.linkedInUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-blue-600 transition"
                  >
                    <Linkedin size={18} />
                  </a>
                )}
              </div>

              <div className="text-left space-y-3.5 border-t border-slate-200/50 dark:border-white/5 pt-4 text-xs font-semibold">
                <div className="flex justify-between">
                  <span className="text-slate-400">Founded:</span>
                  <span>{company?.profile?.foundedYear || "Unknown"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Size:</span>
                  <span>{company?.profile?.companySize || "Unknown"} employees</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Type:</span>
                  <span>{company?.profile?.companyType || "Unknown"}</span>
                </div>
              </div>
            </div>

            {/* HR DETAILS */}
            <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-white/10 bg-white/40 dark:bg-white/[0.02] text-left space-y-4">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
                Primary HR Contact
              </span>
              <div className="space-y-3 text-xs font-semibold">
                <div className="flex items-center gap-2.5">
                  <User size={16} className="text-blue-500" />
                  <div>
                    <span className="block font-bold">{profile?.fullName}</span>
                    <span className="block text-[10px] text-slate-400 leading-none">{profile?.designation}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <FileText size={16} className="text-blue-500" />
                  <span>{profile?.email}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone size={16} className="text-blue-500" />
                  <span>{profile?.phone || "No phone added"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: DETAILED SPECIFICATIONS OR EDIT WORKSPACE */}
          <div className="lg:col-span-2 space-y-6 text-left">
            {!isEditing ? (
              <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-white/10 bg-white/40 dark:bg-white/[0.02] space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-black uppercase tracking-wider text-slate-400">
                    Company Profile Workspace
                  </h3>
                  {!isPending && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 dark:text-blue-300 text-xs font-extrabold uppercase rounded-xl transition flex items-center gap-2 cursor-pointer"
                    >
                      <Edit size={14} /> Edit Profile
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-bold text-slate-400 block mb-1">Company Description</span>
                    <p className="text-sm font-medium leading-relaxed">
                      {company?.profile?.description || "No description provided."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-200/50 dark:border-white/5 pt-4">
                    <div>
                      <span className="text-xs font-bold text-slate-400 block mb-1">Our Mission</span>
                      <p className="text-sm font-medium leading-relaxed">
                        {company?.profile?.mission || "Not specified."}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-400 block mb-1">Our Vision</span>
                      <p className="text-sm font-medium leading-relaxed">
                        {company?.profile?.vision || "Not specified."}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-200/50 dark:border-white/5 pt-4 space-y-2">
                    <span className="text-xs font-bold text-slate-400 block">Work Settings & Locations</span>
                    <div className="flex flex-wrap gap-2 text-xs font-bold">
                      <span className="px-2.5 py-1 bg-blue-500/10 text-blue-500 dark:text-blue-300 rounded-lg">
                        Mode: {company?.locations?.[0]?.workMode || "On Site"}
                      </span>
                      <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-500 dark:text-indigo-300 rounded-lg">
                        Headquarters: {headOfficeLoc}
                      </span>
                    </div>

                    {branches.length > 0 && (
                      <div className="text-xs font-semibold text-slate-500 pt-1">
                        Branches: {branches.map((b: any) => b.location).join(", ")}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-200/50 dark:border-white/5 pt-4">
                    <div>
                      <span className="text-xs font-bold text-slate-400 block mb-1">Culture & Perks</span>
                      <p className="text-sm font-medium leading-relaxed">
                        {company?.profile?.workCulture || "Not specified."}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-400 block mb-1">Recruitment Steps</span>
                      <p className="text-sm font-medium leading-relaxed">
                        {company?.profile?.recruitmentProcess || "Not specified."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-white/10 bg-white/40 dark:bg-white/[0.02] space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-black uppercase tracking-wider text-slate-400">
                    Edit Profile Details
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">Company Description</label>
                    <textarea
                      rows={3}
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full border text-xs px-4 py-3 rounded-xl outline-none bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">Mission</label>
                      <textarea
                        rows={2}
                        value={editForm.mission}
                        onChange={(e) => setEditForm({ ...editForm, mission: e.target.value })}
                        className="w-full border text-xs px-4 py-3 rounded-xl outline-none bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">Vision</label>
                      <textarea
                        rows={2}
                        value={editForm.vision}
                        onChange={(e) => setEditForm({ ...editForm, vision: e.target.value })}
                        className="w-full border text-xs px-4 py-3 rounded-xl outline-none bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">Website</label>
                      <input
                        type="url"
                        value={editForm.website}
                        onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                        className="w-full border text-xs px-4 py-3 rounded-xl outline-none bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">LinkedIn</label>
                      <input
                        type="url"
                        value={editForm.linkedInUrl}
                        onChange={(e) => setEditForm({ ...editForm, linkedInUrl: e.target.value })}
                        className="w-full border text-xs px-4 py-3 rounded-xl outline-none bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">Work Mode</label>
                      <select
                        value={editForm.workMode}
                        onChange={(e) => setEditForm({ ...editForm, workMode: e.target.value })}
                        className="w-full border text-xs px-4 py-3 rounded-xl outline-none bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                      >
                        <option value="OnSite">On Site</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="Remote">Remote</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">Culture & Perks</label>
                      <textarea
                        rows={2}
                        value={editForm.workCulture}
                        onChange={(e) => setEditForm({ ...editForm, workCulture: e.target.value })}
                        className="w-full border text-xs px-4 py-3 rounded-xl outline-none bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">Recruitment Process</label>
                      <textarea
                        rows={2}
                        value={editForm.recruitmentProcess}
                        onChange={(e) => setEditForm({ ...editForm, recruitmentProcess: e.target.value })}
                        className="w-full border text-xs px-4 py-3 rounded-xl outline-none bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-5 py-2.5 bg-slate-250 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 text-slate-800 dark:text-white text-xs font-bold uppercase rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase rounded-xl transition disabled:opacity-50"
                  >
                    {saveLoading ? "Saving..." : "Save Workspace"}
                  </button>
                </div>
              </form>
            )}

            {/* UPLOADED DOCUMENTS VERIFICATION ARCHIVE */}
            <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-white/10 bg-white/40 dark:bg-white/[0.02] text-left space-y-4">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
                Verification Documents
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-bold">
                {company?.documents?.map((doc: any) => (
                  <a
                    key={doc.id}
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2.5 p-3.5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200/50 dark:border-white/5 hover:bg-slate-100 hover:dark:bg-white/10 transition"
                  >
                    <FileText className="text-blue-500 shrink-0" size={18} />
                    <div className="truncate">
                      <span className="block truncate">{doc.docType}</span>
                      <span className="text-[8px] font-mono text-slate-400 block mt-0.5">Click to view <ExternalLink size={8} className="inline ml-0.5" /></span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

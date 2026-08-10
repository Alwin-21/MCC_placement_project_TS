"use client";

import { useEffect, useState } from "react";
import MCCLoader from "@/components/MCCLoader";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  Building2,
  Clock,
  CheckCircle,
  FileText,
  MapPin,
  ArrowLeft,
  Sun,
  Moon,
  Search,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info,
  DollarSign
} from "lucide-react";
import api from "@/services/api";
import { useTheme } from "@/hooks/useTheme";

export default function StudentJobsPage() {
  const router = useRouter();
  const [themeMode, toggleThemeMode] = useTheme();
  const isDark = themeMode === "dark";

  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);
  const [resumes, setResumes] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  
  // Apply Modal state
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedResumeUrl, setSelectedResumeUrl] = useState("");
  const [applyLoading, setApplyLoading] = useState(false);

  const fetchJobsAndResumes = async () => {
    try {
      setLoading(true);
      // Fetch eligible jobs
      const jobsRes = await api.get("/Student/jobs");
      setJobs(jobsRes.data);

      // Fetch student resumes
      const resumesRes = await api.get("/Resumes");
      setResumes(resumesRes.data);
      if (resumesRes.data.length > 0) {
        setSelectedResumeUrl(resumesRes.data[0].ResumeUrl);
      }
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 401) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchJobsAndResumes();
  }, []);

  const [activeSubTab, setActiveSubTab] = useState<"eligible" | "applications">("eligible");
  const [selectedOfferAppId, setSelectedOfferAppId] = useState<number | null>(null);
  const [offerFeedback, setOfferFeedback] = useState("");
  const [offerActionType, setOfferActionType] = useState<"Accept" | "Reject">("Accept");
  const [offerModalOpen, setOfferModalOpen] = useState(false);

  const handleApplyClick = (job: any) => {
    setSelectedJob(job);
    setApplyModalOpen(true);
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResumeUrl) {
      alert("Please upload or select a resume before applying.");
      return;
    }
    try {
      setApplyLoading(true);
      await api.post("/Student/jobs/apply", {
        jobId: selectedJob.id,
        resumeUrl: selectedResumeUrl,
      });
      setApplyModalOpen(false);
      await fetchJobsAndResumes();
      alert("Your application was submitted successfully!");
    } catch (err: any) {
      alert(err.response?.data || "Failed to submit job application.");
    } finally {
      setApplyLoading(false);
    }
  };

  const handleOfferActionClick = (appId: number, type: "Accept" | "Reject") => {
    setSelectedOfferAppId(appId);
    setOfferActionType(type);
    setOfferFeedback("");
    setOfferModalOpen(true);
  };

  const handleOfferActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOfferAppId) return;
    try {
      await api.post("/Student/jobs/offer-action", {
        applicationId: selectedOfferAppId,
        action: offerActionType,
        feedback: offerFeedback
      });
      setOfferModalOpen(false);
      await fetchJobsAndResumes();
      alert(`Offer letter successfully ${offerActionType}ed!`);
    } catch (err: any) {
      alert(err.response?.data || "Failed to process offer action.");
    }
  };

  const handleWithdrawApplication = async (jobId: number) => {
    if (!confirm("Are you sure you want to withdraw your application? This will permanently delete your active application for this role.")) return;
    try {
      await api.delete(`/Student/jobs/apply?jobId=${jobId}`);
      await fetchJobsAndResumes();
      alert("Application withdrawn successfully.");
    } catch (err: any) {
      alert("Failed to withdraw application.");
    }
  };

  if (loading) {
    return <MCCLoader isDark={isDark} text="Loading Placement Board..." />;
  }

  const appStatusColors: Record<string, string> = {
    Applied: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    Reviewed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    Shortlisted: "bg-sky-500/10 text-sky-450 border-sky-500/20",
    InterviewScheduled: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    Selected: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    "Offer Sent": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    "Offer Accepted": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    Joined: "bg-teal-500/10 text-teal-400 border-teal-500/20",
    Rejected: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}
      className={`min-h-screen flex flex-col transition-colors duration-300 ${
        isDark ? "bg-[#090d16] text-slate-100" : "bg-[#faf9f6] text-slate-900"
      }`}
    >
      {/* HEADER */}
      <header className="sticky top-0 z-40 backdrop-blur-md border-b border-slate-200/50 dark:border-white/10 p-4 bg-white/30 dark:bg-black/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-400 hover:text-blue-500 transition"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <span className="text-sm font-black uppercase tracking-wider block leading-none">
                Job Placements
              </span>
              <span className="text-[10px] text-slate-400 font-bold block mt-1">
                Madras Christian College
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
          </div>
        </div>
      </header>

      {/* BODY */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 space-y-6 text-left">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div>
            <h2 className="text-2xl font-black">Placement Board</h2>
            <p className="text-xs text-slate-400">Apply to job listings and track active application pipeline stages.</p>
          </div>

          {/* Search & Filters (Only show when viewing eligible list) */}
          {activeSubTab === "eligible" && (
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                <input
                  type="text"
                  placeholder="Search jobs or companies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-9 pr-4 py-2 border rounded-xl outline-none bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="text-xs px-4 py-2 border rounded-xl outline-none bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
              >
                <option value="all">All Types</option>
                <option value="FullTime">Full Time</option>
                <option value="Internship">Internship</option>
                <option value="PartTime">Part Time</option>
              </select>
            </div>
          )}
        </div>

        {/* SUB-TABS */}
        <div className="flex border-b border-slate-200 dark:border-white/10 pb-px gap-6">
          <button
            onClick={() => setActiveSubTab("eligible")}
            className={`pb-3 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer border-b-2 ${
              activeSubTab === "eligible"
                ? "border-blue-600 text-blue-500"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Eligible Opportunities ({jobs.filter((j) => !j.applied).length})
          </button>
          <button
            onClick={() => setActiveSubTab("applications")}
            className={`pb-3 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer border-b-2 ${
              activeSubTab === "applications"
                ? "border-blue-600 text-blue-500"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            My Application Tracker ({jobs.filter((j) => j.applied).length})
          </button>
        </div>

        {/* TAB 1: ELIGIBLE PLACEMENTS */}
        {activeSubTab === "eligible" && (
          <div className="space-y-4">
            {jobs
              .filter((j) => !j.applied)
              .filter((j) => {
                const matchSearch =
                  j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  j.companyName.toLowerCase().includes(searchQuery.toLowerCase());
                const matchType = typeFilter === "all" || j.jobType === typeFilter;
                return matchSearch && matchType;
              })
              .map((job) => (
                <div
                  key={job.id}
                  className={`p-6 border rounded-3xl flex flex-col md:flex-row justify-between gap-6 shadow-sm ${
                    isDark ? "bg-white/5 border-white/5" : "bg-white border-slate-200"
                  }`}
                >
                  <div className="space-y-3.5 flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      {job.companyLogoUrl ? (
                        <img src={job.companyLogoUrl} className="w-10 h-10 object-contain rounded-xl border p-1 bg-white shrink-0" alt="logo" />
                      ) : (
                        <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center border shrink-0"><Building2 size={18} /></div>
                      )}
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block leading-none">{job.companyName}</span>
                        <h3 className="text-base font-black truncate mt-1">{job.title}</h3>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-400">
                      <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded-lg">{job.jobType}</span>
                      <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-500 rounded-lg">{job.workMode}</span>
                      <span className="px-2 py-0.5 bg-purple-500/10 text-purple-500 rounded-lg">{job.department}</span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">{job.description}</p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3.5 border-t border-slate-100 dark:border-white/5 text-xs font-semibold">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Compensation</span>
                        <span>{job.salary || "N/A"} ({job.lpa} LPA)</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">CGPA Required</span>
                        <span>{job.eligibilityMinCGPA} CGPA</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Vacancies</span>
                        <span>{job.vacancies} position(s)</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Deadline</span>
                        <span>{new Date(job.deadlines).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-end items-end gap-3 shrink-0 w-full md:w-auto">
                    <button
                      onClick={() => handleApplyClick(job)}
                      className="w-full md:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase rounded-xl transition cursor-pointer text-center"
                    >
                      Apply Now
                    </button>
                  </div>
                </div>
              ))}

            {jobs.filter((j) => !j.applied).length === 0 && (
              <div className="border border-dashed rounded-3xl p-12 text-center text-slate-500 border-slate-200 dark:border-white/10">
                <Briefcase className="mx-auto mb-3 text-slate-400" size={32} />
                <p className="text-sm font-bold">No active job listings.</p>
                <p className="text-xs text-slate-450 mt-1">You are currently not eligible for any active placements, or onboarding listings are empty.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: LIVE APPLICATION TRACKER */}
        {activeSubTab === "applications" && (
          <div className="space-y-6">
            {jobs
              .filter((j) => j.applied)
              .map((job) => (
                <div
                  key={job.id}
                  className={`p-6 border rounded-3xl space-y-6 shadow-md text-left ${
                    isDark ? "bg-white/5 border-white/5" : "bg-white border-slate-200"
                  }`}
                >
                  {/* Top Card Info */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
                    <div className="flex items-center gap-3">
                      {job.companyLogoUrl ? (
                        <img src={job.companyLogoUrl} className="w-10 h-10 object-contain rounded-xl border p-1 bg-white shrink-0" alt="logo" />
                      ) : (
                        <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center border shrink-0"><Building2 size={18} /></div>
                      )}
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block leading-none">{job.companyName}</span>
                        <h3 className="text-base font-black truncate mt-1">{job.title}</h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1.5 rounded-full border text-[10px] font-black uppercase ${appStatusColors[job.applicationStatus]}`}>
                        Status: {job.applicationStatus}
                      </span>
                      {job.applicationStatus === "Applied" && (
                        <button
                          type="button"
                          onClick={() => handleWithdrawApplication(job.id)}
                          className="px-3 py-1.5 bg-red-600/10 hover:bg-red-650/20 text-red-500 text-[10px] font-extrabold uppercase rounded-lg transition cursor-pointer"
                        >
                          Withdraw
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Stepper Process Board */}
                  <div className="bg-slate-50 dark:bg-[#0c0f17] p-4 border border-slate-200 dark:border-white/5 rounded-2xl">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-400 mb-4">
                      <span>Recruitment Stage tracker</span>
                      <span className="text-blue-500">Live Stage: {job.applicationStatus}</span>
                    </div>

                    <div className="relative flex flex-wrap gap-2 items-center justify-between text-[9px] font-bold">
                      {["Applied", "Reviewed", "Shortlisted", "Interview", "Offer Sent", "Offer Processed"].map((stage, idx) => {
                        let active = false;
                        let completed = false;

                        const current = job.applicationStatus;
                        if (current === stage) active = true;

                        // Custom match index mapping
                        const order = ["Applied", "Reviewed", "Shortlisted", "InterviewScheduled", "Offer Sent", "Offer Accepted"];
                        const currentIdx = order.indexOf(current === "Interview" ? "InterviewScheduled" : current === "Offer Processed" ? "Offer Accepted" : current);
                        const stageIdx = order.indexOf(stage === "Interview" ? "InterviewScheduled" : stage === "Offer Processed" ? "Offer Accepted" : stage);

                        if (currentIdx >= stageIdx) completed = true;

                        return (
                          <div key={stage} className="flex items-center gap-1.5">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center border font-mono font-bold text-[8px] ${
                              completed ? "bg-emerald-500 border-emerald-500 text-white" : active ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 dark:border-white/10 text-slate-450"
                            }`}>
                              {idx + 1}
                            </span>
                            <span className={`${completed || active ? "text-slate-250 font-black" : "text-slate-500"}`}>
                              {stage}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Online screening details */}
                  {job.assessmentId && (
                    <div className="p-4 bg-blue-600/5 dark:bg-blue-600/10 border border-blue-500/10 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
                      <div className="space-y-0.5">
                        <p className="font-extrabold text-blue-500 dark:text-blue-300">Screening Test Required</p>
                        <p className="text-[10px] text-slate-450">Please complete the screening evaluation assessment attached by the hiring manager.</p>
                      </div>
                      <Link
                        href={`/dashboard/assessments`}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold uppercase rounded-xl transition text-[10px] tracking-wider text-center shrink-0"
                      >
                        Enter Test Panel
                      </Link>
                    </div>
                  )}

                  {/* Interviews Calendar list */}
                  {job.interviews && job.interviews.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Scheduled Interview calendar</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {job.interviews.map((interview: any) => (
                          <div key={interview.id} className="p-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl text-xs space-y-2 text-slate-400">
                            <div className="flex justify-between items-center border-b dark:border-white/5 pb-2">
                              <span className="font-extrabold uppercase text-slate-300">{interview.type} Interview</span>
                              <span className="text-[9px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 uppercase font-black">
                                {interview.status}
                              </span>
                            </div>
                            <div className="space-y-1.5 font-bold">
                              <div>📅 Date: <strong className="text-slate-300">{new Date(interview.scheduleTime).toLocaleDateString()}</strong></div>
                              <div>🕒 Time: <strong className="text-slate-300">{new Date(interview.scheduleTime).toLocaleTimeString()}</strong></div>
                              {interview.meetLink && (
                                <div className="pt-2">
                                  <a
                                    href={interview.meetLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-3.5 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 dark:text-blue-300 rounded-xl inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    Join Google Meet <ExternalLink size={12} />
                                  </a>
                                </div>
                              )}
                              {interview.venue && <div>📍 Venue Room: <strong className="text-slate-300">{interview.venue}</strong></div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Offer management card */}
                  {job.offerLetterUrl && (
                    <div className="p-5 bg-indigo-600/5 dark:bg-indigo-600/10 border border-indigo-500/10 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
                      <div className="space-y-1">
                        <p className="font-extrabold text-indigo-500 dark:text-indigo-300">Congratulations! Offer Letter Received</p>
                        <p className="text-[10px] text-slate-450 leading-relaxed">The recruiter has released an official employment offer for you. Please download and evaluate your package.</p>
                        {job.offerStatus && (
                          <div className="pt-1 text-[10px] font-bold">
                            Decision Status:{" "}
                            <span className={`px-2 py-0.5 rounded font-black text-[8px] uppercase border ${
                              job.offerStatus === "Accepted" ? "bg-emerald-500/10 text-emerald-450 border-emerald-500/20" : job.offerStatus === "Rejected" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-blue-500/10 text-blue-450 border-blue-500/20"
                            }`}>
                              {job.offerStatus}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <a
                          href={job.offerLetterUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded-xl font-bold inline-flex items-center gap-1 border border-indigo-500/20 text-[10px] uppercase"
                        >
                          View PDF <FileText size={12} />
                        </a>
                        {job.offerStatus === "Sent" && (
                          <>
                            <button
                              onClick={() => handleOfferActionClick(job.applicationId, "Accept")}
                              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold uppercase transition cursor-pointer text-[10px]"
                            >
                              Accept Offer
                            </button>
                            <button
                              onClick={() => handleOfferActionClick(job.applicationId, "Reject")}
                              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-extrabold uppercase transition cursor-pointer text-[10px]"
                            >
                              Reject Offer
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

            {jobs.filter((j) => j.applied).length === 0 && (
              <div className="border border-dashed rounded-3xl p-12 text-center text-slate-500 border-slate-200 dark:border-white/10">
                <Clock className="mx-auto mb-3 text-slate-400 animate-pulse" size={32} />
                <p className="text-sm font-bold">No active applications.</p>
                <p className="text-xs text-slate-450 mt-1">Once you apply for placement opportunities, your live tracker pipeline will show up here.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ==========================================
          MODAL: APPLY TO JOB
          ========================================== */}
      {applyModalOpen && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <form
            onSubmit={handleApplySubmit}
            className={`w-full max-w-md rounded-3xl border shadow-2xl p-6 text-left ${
              isDark ? "bg-[#0b0b0f] border-white/15 text-white" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <h3 className="text-base font-black uppercase tracking-wider text-slate-400 mb-2">
              Apply to {selectedJob.companyName}
            </h3>
            <p className="text-xs text-slate-400 mb-6">Position: <strong>{selectedJob.title}</strong></p>

            <div className="space-y-4">
              {resumes.length > 0 ? (
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-2">Select Your Resume Portfolio</label>
                  <select
                    value={selectedResumeUrl}
                    onChange={(e) => setSelectedResumeUrl(e.target.value)}
                    className="w-full text-xs px-4 py-2.5 border rounded-xl outline-none transition bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                  >
                    {resumes.map((res) => (
                      <option key={res.Id || res.id} value={res.ResumeUrl || res.resumeUrl}>
                        {res.ResumeTitle || res.resumeTitle}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-xs leading-normal">
                  No resumes uploaded in your workspace. Please go to <Link href="/dashboard" className="underline font-bold">Dashboard Resume Section</Link> to add your resume portfolio before applying.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-white/5 pt-4 mt-6">
              <button
                type="button"
                onClick={() => setApplyModalOpen(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-white/5 text-slate-800 dark:text-white text-xs font-bold uppercase rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={resumes.length === 0 || applyLoading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                {applyLoading ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==========================================
          MODAL: ACCEPT/REJECT OFFER
          ========================================== */}
      {offerModalOpen && selectedOfferAppId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <form
            onSubmit={handleOfferActionSubmit}
            className={`w-full max-w-md rounded-3xl border shadow-2xl p-6 text-left ${
              isDark ? "bg-[#0b0b0f] border-white/15 text-white" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <h3 className="text-base font-black uppercase tracking-wider text-slate-400 mb-2">
              {offerActionType} Job Offer
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              You are about to <strong className="text-blue-500">{offerActionType.toLowerCase()}</strong> the official offer. This decision cannot be undone.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-2">Add Feedback / Comments (Optional)</label>
                <textarea
                  rows={3}
                  value={offerFeedback}
                  onChange={(e) => setOfferFeedback(e.target.value)}
                  placeholder="Provide comments regarding your decision..."
                  className="w-full text-xs px-4 py-2.5 border rounded-xl outline-none bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-white/5 pt-4 mt-6">
              <button
                type="button"
                onClick={() => setOfferModalOpen(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-white/5 text-slate-800 dark:text-white text-xs font-bold uppercase rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-6 py-2 text-white text-xs font-bold uppercase rounded-xl transition cursor-pointer ${
                  offerActionType === "Accept" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-650 hover:bg-red-700"
                }`}
              >
                Confirm Decision
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

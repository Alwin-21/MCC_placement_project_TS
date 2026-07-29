"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList, Clock, ChevronLeft, ChevronRight, CheckCircle,
  AlertTriangle, Camera, CameraOff, Trophy, Target, XCircle,
  BookOpen, ArrowRight, RotateCcw, ArrowLeft, Bell, Sun, Moon
} from "lucide-react";
import api from "@/services/api";
import { useTheme } from "@/hooks/useTheme";

type ViewState = "list" | "instructions" | "exam" | "result";

interface Question {
  id: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption?: string;
  marks: number;
  orderIndex: number;
  selectedOption: string;
}

interface Assessment {
  id: number;
  title: string;
  description: string;
  instructions: string;
  durationMinutes: number;
  totalMarks: number;
  startDate: string;
  endDate: string;
  status: string;
  departments: string;
  isStarted: boolean;
  isCompleted: boolean;
  attemptStatus: string | null;
  attemptId: number | null;
  isAvailable: boolean;
}

export default function AssessmentPage() {
  const router = useRouter();
  const [themeMode, toggleThemeMode] = useTheme();

  // Auth
  const [user, setUser] = useState<any>(null);

  // Views
  const [view, setView] = useState<ViewState>("list");

  // List state
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  // Active assessment + attempt
  const [activeAssessment, setActiveAssessment] = useState<Assessment | null>(null);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState(0); // seconds

  // Proctoring
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [warningCount, setWarningCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [terminated, setTerminated] = useState(false);
  const lastWarningTime = useRef<number>(0);
  const prevPixels = useRef<number[]>([]);
  const proctorInterval = useRef<NodeJS.Timeout | null>(null);
  const [cameraPermission, setCameraPermission] = useState<"pending" | "granted" | "denied">("pending");

  // Result
  const [result, setResult] = useState<any>(null);
  const [loadingResult, setLoadingResult] = useState(false);

  // ── Auth check ──
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/login"); return; }
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed.role !== "Student") { router.push("/login"); return; }
      setUser(parsed);
    }
    fetchAssessments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAssessments = async () => {
    setLoadingList(true);
    try {
      const res = await api.get("/Assessments/student");
      setAssessments(res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoadingList(false); }
  };

  // Pending count calculation
  const pendingCount = assessments.filter(a => {
    const now = new Date();
    const start = new Date(a.startDate);
    const end = new Date(a.endDate);
    const isLive = !a.isCompleted && (a.isAvailable || (now >= start && now <= end));
    return isLive;
  }).length;

  // ── Timer ──
  useEffect(() => {
    if (view !== "exam" || !startedAt || !activeAssessment) return;
    const durationSec = activeAssessment.durationMinutes * 60;
    const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000);
    const remaining = Math.max(0, durationSec - elapsed);
    setTimeLeft(remaining);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, startedAt, activeAssessment]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // ── Camera / Proctoring ──
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, facingMode: "user" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      streamRef.current = stream;
      setCameraActive(true);
      setCameraPermission("granted");
      startProctoring();
    } catch (err) {
      setCameraError(true);
      setCameraPermission("denied");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (proctorInterval.current) clearInterval(proctorInterval.current);
    setCameraActive(false);
  };

  const startProctoring = () => {
    proctorInterval.current = setInterval(() => {
      detectSuspiciousBehavior();
    }, 3000);
  };

  const detectSuspiciousBehavior = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx || video.readyState < 2) return;

    canvas.width = 64;
    canvas.height = 48;
    ctx.drawImage(video, 0, 0, 64, 48);
    const data = ctx.getImageData(0, 0, 64, 48).data;

    let totalBrightness = 0;
    const pixels: number[] = [];
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const brightness = (r + g + b) / 3;
      totalBrightness += brightness;
      pixels.push(brightness);
    }
    const avgBrightness = totalBrightness / pixels.length;

    let motionScore = 0;
    if (prevPixels.current.length === pixels.length) {
      let diffSum = 0;
      for (let i = 0; i < pixels.length; i++) {
        diffSum += Math.abs(pixels[i] - prevPixels.current[i]);
      }
      motionScore = diffSum / pixels.length;
    }
    prevPixels.current = pixels;

    const now = Date.now();
    const cooldown = 10000;

    if (now - lastWarningTime.current < cooldown) return;

    if (avgBrightness < 20) {
      triggerWarning("FaceNotDetected", "Camera appears covered or face not visible.");
    } else if (motionScore > 35) {
      triggerWarning("LookingAway", "Sudden movement detected. Please face the camera.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerWarning = async (type: string, details: string) => {
    if (!attemptId || !activeAssessment) return;
    lastWarningTime.current = Date.now();

    try {
      const res = await api.post(`/Assessments/${activeAssessment.id}/attempt/proctoring`, {
        attemptId,
        warningType: type,
        details,
      });

      const newCount = res.data.warningNum;
      setWarningCount(newCount);

      if (res.data.shouldTerminate || newCount >= 4) {
        setWarningMessage("⚠️ Final Warning (4/4): Your assessment has been terminated due to repeated proctoring violations.");
        setShowWarningModal(true);
        setTimeout(() => handleTerminate(), 3000);
      } else {
        setWarningMessage(`Warning ${newCount}/3: ${details} Repeated violations will terminate your assessment.`);
        setShowWarningModal(true);
        setTimeout(() => setShowWarningModal(false), 4000);
      }
    } catch (err) { console.error("Proctoring warning error:", err); }
  };

  const handleTerminate = async () => {
    if (!attemptId || !activeAssessment) return;
    stopCamera();
    setTerminated(true);
    try {
      await api.post(`/Assessments/${activeAssessment.id}/attempt/terminate`, {
        attemptId,
        reason: "Four proctoring violations: suspicious behavior detected.",
      });
    } catch (err) { console.error(err); }
    setView("result");
    fetchResult();
  };

  // ── Start Assessment ──
  const handleStart = async (assessment: Assessment) => {
    setActiveAssessment(assessment);
    if (assessment.isCompleted) {
      setView("result");
      fetchResult(assessment.id);
      return;
    }
    setView("instructions");
  };

  const handleBeginExam = async () => {
    if (!activeAssessment) return;
    try {
      const existingRes = await api.get(`/Assessments/${activeAssessment.id}/attempt`);
      if (existingRes.data && existingRes.data.attemptId) {
        if (existingRes.data.isCompleted) {
          setView("result");
          fetchResult(activeAssessment.id);
          return;
        }
        setAttemptId(existingRes.data.attemptId);
        setQuestions(existingRes.data.questions);
        setStartedAt(new Date(existingRes.data.startedAt));
      } else {
        const res = await api.post(`/Assessments/${activeAssessment.id}/attempt`, {});
        setAttemptId(res.data.attemptId);
        setQuestions(res.data.questions.map((q: any) => ({ ...q, selectedOption: "" })));
        setStartedAt(new Date(res.data.startedAt));
      }
      setCurrentQIndex(0);
      setView("exam");
      startCamera();
    } catch (err: any) {
      if (err.response?.status === 409) {
        alert("You have already attempted this assessment.");
        fetchAssessments();
        setView("list");
      } else {
        alert("Failed to start: " + (err.response?.data?.message || err.message));
      }
    }
  };

  // ── Save Answer ──
  const saveAnswer = async (questionId: number, selectedOption: string) => {
    if (!attemptId || !activeAssessment) return;
    try {
      await api.post(`/Assessments/${activeAssessment.id}/attempt/answer`, {
        attemptId,
        questionId,
        selectedOption,
      });
    } catch (err) { console.error("Save answer error:", err); }
  };

  const selectOption = (option: string) => {
    const q = questions[currentQIndex];
    if (!q) return;
    const updated = questions.map((ques, i) =>
      i === currentQIndex ? { ...ques, selectedOption: option } : ques
    );
    setQuestions(updated);
    saveAnswer(q.id, option);
  };

  // ── Submit ──
  const handleSubmit = async () => {
    if (!confirm("Are you sure you want to submit the assessment?")) return;
    if (!attemptId || !activeAssessment) return;
    stopCamera();
    try {
      await api.post(`/Assessments/${activeAssessment.id}/attempt/submit`, { attemptId, autoSubmit: false });
      setView("result");
      fetchResult(activeAssessment.id);
    } catch (err: any) { alert("Submit failed: " + (err.response?.data?.message || err.message)); }
  };

  const handleAutoSubmit = async () => {
    if (!attemptId || !activeAssessment) return;
    stopCamera();
    try {
      await api.post(`/Assessments/${activeAssessment.id}/attempt/submit`, { attemptId, autoSubmit: true });
    } catch (err) { console.error(err); }
    setView("result");
    fetchResult(activeAssessment.id);
  };

  // ── Fetch Result ──
  const fetchResult = async (assessmentId?: number) => {
    const id = assessmentId || activeAssessment?.id;
    if (!id) return;
    setLoadingResult(true);
    try {
      const res = await api.get(`/Assessments/${id}/attempt/result`);
      setResult(res.data);
    } catch (err) { console.error(err); }
    finally { setLoadingResult(false); }
  };

  // Back button action inside header
  const handleBack = () => {
    stopCamera();
    if (view === "exam") {
      if (!confirm("Are you sure you want to leave the exam hall? Timer will continue running.")) return;
      setView("list");
    } else if (view === "instructions" || view === "result") {
      setView("list");
      setResult(null);
    } else {
      router.back();
    }
  };

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => { stopCamera(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isDark = themeMode === "dark";
  const bg = isDark ? "bg-[#0d0d12] text-white" : "bg-[#fcfaf6] text-[#0f172a]";
  const card = isDark ? "bg-[#0b0b0f] border-white/5" : "bg-white border-slate-200";
  const subText = isDark ? "text-gray-400" : "text-slate-500";
  const answered = questions.filter((q) => q.selectedOption).length;

  return (
    <div className={`min-h-screen ${bg} transition-colors duration-300`}>
      {/* ── HEADER WITH BACK BUTTON & PENDING BADGE ── */}
      <div className={`sticky top-0 z-40 border-b px-4 md:px-8 py-3 flex items-center justify-between backdrop-blur-md ${isDark ? "border-white/5 bg-[#0d0d12]/90" : "border-slate-200 bg-white/90"}`}>
        <div className="flex items-center gap-3">
          {/* Back button replacing Home button */}
          <button onClick={handleBack}
            aria-label="Back"
            className={`p-2 rounded-xl transition cursor-pointer ${isDark ? "hover:bg-white/5 text-gray-300" : "hover:bg-slate-100 text-slate-700"}`}>
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <ClipboardList size={18} className="text-[#781c1c]" />
            <span className="font-bold text-sm">
              {view === "list" ? "Assessments" :
               view === "instructions" ? activeAssessment?.title :
               view === "exam" ? activeAssessment?.title :
               "Assessment Result"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {view === "exam" && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono font-black text-sm ${
              timeLeft < 300 ? "bg-rose-500/20 text-rose-400" : timeLeft < 600 ? "bg-amber-500/20 text-amber-400" : isDark ? "bg-white/5 text-white" : "bg-slate-100 text-slate-900"
            }`}>
              <Clock size={14} /> {formatTime(timeLeft)}
            </div>
          )}
          {view === "exam" && cameraActive && (
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400">
              <Camera size={12} /> Recording
            </div>
          )}
          {view === "exam" && warningCount > 0 && (
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-orange-400">
              <AlertTriangle size={12} /> {warningCount}/4
            </div>
          )}

          {/* Theme Changer Icon Button */}
          <button
            onClick={toggleThemeMode}
            title="Toggle Light/Dark Mode"
            aria-label="Toggle Theme"
            className={`p-2 rounded-full transition-all duration-200 cursor-pointer border shadow-sm flex items-center justify-center ${
              isDark
                ? "bg-white/10 hover:bg-white/20 text-amber-300 border-white/15"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
            }`}
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </div>

      {/* ── WARNING MODAL ── */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md mx-4 rounded-2xl p-6 border shadow-2xl ${warningCount >= 4 ? "border-rose-500/30 bg-rose-950" : "border-orange-500/30 bg-[#1a1008]"}`}>
            <div className="flex items-start gap-3">
              <AlertTriangle size={24} className={warningCount >= 4 ? "text-rose-400 shrink-0" : "text-orange-400 shrink-0"} />
              <div>
                <h3 className={`font-black text-base mb-1 ${warningCount >= 4 ? "text-rose-300" : "text-orange-300"}`}>
                  Proctoring Alert – Warning {warningCount}/4
                </h3>
                <p className={`text-sm ${warningCount >= 4 ? "text-rose-200" : "text-orange-200"}`}>{warningMessage}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {view === "list" && (
        <div className="max-w-5xl md:max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
          <div className="mb-10">
            <span className="text-[10px] uppercase font-mono tracking-widest text-[#781c1c] font-bold">Madras Christian College</span>
            <h1 className={`text-2xl md:text-4xl font-black tracking-tight mt-1 ${isDark ? "text-white" : "text-slate-900"}`}>
              Welcome, {user?.fullName || "Student"} 👋
            </h1>
            <p className={`text-xs sm:text-sm mt-1.5 ${subText}`}>Department-specific assessments assigned to you.</p>
          </div>

          {loadingList ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#781c1c] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : assessments.length === 0 ? (
            <div className={`rounded-3xl border p-16 text-center ${card}`}>
              <ClipboardList size={52} className="mx-auto mb-4 opacity-20" />
              <p className="text-base font-semibold text-gray-400">No assessments assigned to your department yet.</p>
              <p className="text-xs text-gray-500 mt-1">Check back later or contact your administrator.</p>
            </div>
          ) : (
            <div className="space-y-6 md:space-y-8">
              {assessments.map((assessment, index) => {
                const now = new Date();
                const start = new Date(assessment.startDate);
                const end = new Date(assessment.endDate);
                const isLive = start <= now && end >= now;
                const isUpcoming = start > now;
                const isExpired = end < now;

                return (
                  <div key={assessment.id} className={`rounded-3xl border p-6 sm:p-8 md:p-10 transition-all duration-300 shadow-xl ${card} ${!assessment.isCompleted && isLive ? "hover:shadow-2xl border-rose-500/30 ring-1 ring-rose-500/20" : ""}`}>
                    <div className="flex items-start justify-between gap-6 flex-wrap">
                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-xs font-mono font-black uppercase tracking-wider px-3 py-1 rounded-xl bg-[#781c1c]/10 text-[#781c1c] border border-[#781c1c]/20">
                            Assessment {index + 1}
                          </span>
                          <h2 className={`font-black text-xl sm:text-2xl tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>{assessment.title}</h2>
                          {assessment.isCompleted ? (
                            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                              Completed
                            </span>
                          ) : isLive ? (
                            <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 uppercase tracking-wider animate-pulse">
                              ● Live
                            </span>
                          ) : isUpcoming ? (
                            <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                              Upcoming
                            </span>
                          ) : (
                            <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20 uppercase tracking-wider">
                              Expired
                            </span>
                          )}
                        </div>
                        <p className={`text-sm sm:text-base leading-relaxed line-clamp-3 ${subText}`}>{assessment.description || "No description provided."}</p>
                        <div className={`inline-flex items-center gap-5 text-xs sm:text-sm p-3.5 sm:p-4 rounded-2xl border ${isDark ? "bg-white/[0.02] border-white/5 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"} flex-wrap font-mono`}>
                          <span className="flex items-center gap-1.5"><Clock size={14} className="text-[#781c1c]" /> {assessment.durationMinutes} minutes</span>
                          <span className="flex items-center gap-1.5"><Target size={14} className="text-[#781c1c]" /> {assessment.totalMarks} marks</span>
                          <span className="flex items-center gap-1.5"><BookOpen size={14} className="text-[#781c1c]" />
                            {start.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} –
                            {" "}{end.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 self-center">
                        {assessment.isCompleted ? (
                          <button
                            onClick={() => handleStart(assessment)}
                            className={`px-6 py-3.5 text-xs sm:text-sm font-bold rounded-2xl border transition cursor-pointer ${isDark ? "border-white/10 hover:bg-white/5" : "border-slate-200 hover:bg-slate-50"}`}
                          >
                            View Result
                          </button>
                        ) : isLive ? (
                          <button
                            onClick={() => handleStart(assessment)}
                            className="px-7 py-3.5 sm:px-8 sm:py-4 text-xs sm:text-sm font-black rounded-2xl bg-[#781c1c] hover:bg-[#5f1515] text-white transition shadow-lg shadow-rose-950 cursor-pointer active:scale-98"
                          >
                            {assessment.isStarted ? "Resume Exam" : "Start Exam"} <ArrowRight size={14} className="inline ml-1" />
                          </button>
                        ) : isUpcoming ? (
                          <div className="px-5 py-3 text-xs sm:text-sm font-semibold text-blue-400 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                            Opens {start.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                          </div>
                        ) : (
                          <div className={`px-5 py-3 text-xs sm:text-sm rounded-2xl ${isDark ? "bg-white/5 text-gray-400" : "bg-slate-100 text-slate-500"}`}>
                            Expired
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── INSTRUCTIONS VIEW ── */}
      {view === "instructions" && activeAssessment && (
        <div className="max-w-2xl mx-auto px-4 md:px-8 py-8 md:py-12">
          <div className={`rounded-2xl border p-6 md:p-8 ${card}`}>
            <div className="mb-6">
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#781c1c] font-bold">Assessment Instructions</span>
              <h2 className={`text-xl font-black mt-1 ${isDark ? "text-white" : "text-slate-900"}`}>{activeAssessment.title}</h2>
            </div>

            {/* Key stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: "Duration", value: `${activeAssessment.durationMinutes} min`, icon: Clock },
                { label: "Total Marks", value: activeAssessment.totalMarks, icon: Target },
                { label: "Department", value: activeAssessment.departments?.split(";")[0] || "General", icon: BookOpen },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className={`rounded-xl p-3 text-center ${isDark ? "bg-white/[0.03]" : "bg-slate-50"}`}>
                  <Icon size={14} className="mx-auto mb-1 text-[#781c1c]" />
                  <span className={`text-sm font-black block ${isDark ? "text-white" : "text-slate-900"}`}>{value}</span>
                  <span className={`text-[9px] uppercase font-mono ${subText}`}>{label}</span>
                </div>
              ))}
            </div>

            {/* Instructions */}
            <div className={`rounded-xl p-4 mb-6 ${isDark ? "bg-amber-500/5 border border-amber-500/20" : "bg-amber-50 border border-amber-200"}`}>
              <h3 className="text-xs font-bold text-amber-500 mb-2 flex items-center gap-1"><AlertTriangle size={12} /> Instructions</h3>
              <div className={`text-xs whitespace-pre-wrap leading-relaxed ${isDark ? "text-amber-200/80" : "text-amber-900"}`}>
                {activeAssessment.instructions || `• Do not switch tabs or applications during the exam.\n• Keep your face visible to the camera at all times.\n• You will receive 3 warnings before automatic termination.\n• The exam will auto-submit when time runs out.\n• Do not refresh or navigate away from this page.`}
              </div>
            </div>

            {/* Proctoring notice */}
            <div className={`rounded-xl p-4 mb-6 ${isDark ? "bg-white/[0.03] border border-white/5" : "bg-slate-50 border border-slate-200"}`}>
              <h3 className={`text-xs font-bold mb-2 flex items-center gap-1 ${isDark ? "text-white" : "text-slate-900"}`}>
                <Camera size={12} /> Proctoring System
              </h3>
              <p className={`text-xs ${subText}`}>
                This assessment uses webcam-based proctoring. Your camera will be activated when you begin.
                4 warnings (face not visible, excessive movement) will result in automatic termination and malpractice reporting.
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setView("list")}
                className={`flex-1 py-3 rounded-xl text-xs font-bold border transition cursor-pointer ${isDark ? "border-white/10 hover:bg-white/5" : "border-slate-200 hover:bg-slate-50"}`}>
                Back
              </button>
              <button onClick={handleBeginExam}
                className="flex-1 py-3 rounded-xl text-xs font-bold bg-[#781c1c] hover:bg-[#5f1515] text-white transition shadow-sm cursor-pointer">
                Begin Exam →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EXAM VIEW ── */}
      {view === "exam" && !terminated && questions.length > 0 && (
        <div className="max-w-5xl mx-auto px-3 md:px-8 py-4 md:py-6">
          <div className="flex gap-4 flex-col-reverse lg:flex-row">
            {/* Question Panel */}
            <div className="flex-1">
              <div className={`rounded-2xl border p-5 md:p-6 mb-4 ${card}`}>
                {/* Question header */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-[10px] font-mono uppercase tracking-widest ${subText}`}>
                    Question {currentQIndex + 1} of {questions.length}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDark ? "bg-white/5" : "bg-slate-100"} ${subText}`}>
                    {questions[currentQIndex]?.marks} mark{(questions[currentQIndex]?.marks || 1) > 1 ? "s" : ""}
                  </span>
                </div>

                {/* Progress bar */}
                <div className={`h-1 rounded-full mb-5 ${isDark ? "bg-white/5" : "bg-slate-100"}`}>
                  <div className="h-1 bg-[#781c1c] rounded-full transition-all duration-500"
                    style={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }} />
                </div>

                {/* Question text */}
                <p className={`text-sm md:text-base font-semibold leading-relaxed mb-5 ${isDark ? "text-white" : "text-slate-900"}`}>
                  {questions[currentQIndex]?.questionText}
                </p>

                {/* Options */}
                <div className="space-y-2.5">
                  {(["A", "B", "C", "D"] as const).map((opt) => {
                    const optKey = `option${opt}` as keyof Question;
                    const optText = questions[currentQIndex]?.[optKey] as string;
                    const isSelected = questions[currentQIndex]?.selectedOption === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => selectOption(opt)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? "border-[#781c1c] bg-[#781c1c]/10 text-[#781c1c]"
                            : isDark
                              ? "border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 text-gray-200"
                              : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-800"
                        }`}
                      >
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 transition-all ${
                          isSelected ? "bg-[#781c1c] text-white" : isDark ? "bg-white/10 text-gray-400" : "bg-slate-100 text-slate-500"
                        }`}>{opt}</span>
                        <span className="flex-1">{optText}</span>
                        {isSelected && <CheckCircle size={15} className="text-[#781c1c] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => setCurrentQIndex((i) => Math.max(0, i - 1))}
                  disabled={currentQIndex === 0}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer disabled:opacity-40 ${isDark ? "border-white/10 hover:bg-white/5" : "border-slate-200 hover:bg-slate-50"}`}
                >
                  <ChevronLeft size={14} /> Previous
                </button>
                <span className={`text-[10px] ${subText}`}>{answered}/{questions.length} answered</span>
                {currentQIndex < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQIndex((i) => Math.min(questions.length - 1, i + 1))}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${isDark ? "border-white/10 hover:bg-white/5" : "border-slate-200 hover:bg-slate-50"}`}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#781c1c] hover:bg-[#5f1515] text-white transition cursor-pointer"
                  >
                    Submit <CheckCircle size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Right sidebar: question navigator + camera */}
            <div className="lg:w-64 space-y-4 shrink-0">
              {/* Webcam */}
              <div className={`rounded-2xl border p-3 ${card}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[9px] font-mono uppercase tracking-widest font-bold ${subText}`}>Proctoring Camera</span>
                  {cameraActive ? (
                    <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-1"><Camera size={9} /> Live</span>
                  ) : (
                    <span className="text-[9px] text-rose-400 font-bold flex items-center gap-1"><CameraOff size={9} /> Off</span>
                  )}
                </div>
                <div className={`rounded-xl overflow-hidden aspect-video relative ${isDark ? "bg-black" : "bg-slate-900"}`}>
                  <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                  <canvas ref={canvasRef} className="hidden" />
                  {!cameraActive && !cameraError && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                  {cameraError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center">
                      <CameraOff size={20} className="text-rose-400 mb-1" />
                      <p className="text-[9px] text-rose-300">Camera unavailable. Exam continues without proctoring.</p>
                    </div>
                  )}
                </div>
                {warningCount > 0 && (
                  <div className={`mt-2 flex items-center gap-1.5 text-[9px] font-bold ${warningCount >= 3 ? "text-rose-400" : "text-orange-400"}`}>
                    <AlertTriangle size={10} /> {warningCount}/4 warnings
                  </div>
                )}
              </div>

              {/* Question navigator */}
              <div className={`rounded-2xl border p-3 ${card}`}>
                <span className={`text-[9px] font-mono uppercase tracking-widest font-bold block mb-2 ${subText}`}>Question Navigator</span>
                <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-5 gap-1.5">
                  {questions.map((q, i) => (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQIndex(i)}
                      className={`aspect-square rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        i === currentQIndex
                          ? "bg-[#781c1c] text-white ring-2 ring-[#781c1c]/40"
                          : q.selectedOption
                            ? "bg-emerald-500/20 text-emerald-400"
                            : isDark ? "bg-white/5 text-gray-400 hover:bg-white/10" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-3 text-[9px]">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500/20 inline-block" /> Answered</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-white/5 inline-block border border-white/10" /> Not answered</span>
                </div>
              </div>

              {/* Submit button */}
              <button onClick={handleSubmit}
                className="w-full py-3 rounded-xl text-xs font-black bg-[#781c1c] hover:bg-[#5f1515] text-white transition cursor-pointer">
                Submit Assessment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RESULT VIEW ── */}
      {view === "result" && (
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-12">
          {loadingResult ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#781c1c] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : result ? (
            <div className="space-y-6">
              {/* Result Hero Card */}
              <div className={`rounded-3xl border p-6 md:p-8 text-center ${card} ${result.isMalpractice ? "border-rose-500/20" : ""}`}>
                {result.isMalpractice ? (
                  <>
                    <XCircle size={52} className="mx-auto mb-3 text-rose-400" />
                    <h2 className="text-xl font-black text-rose-400">Assessment Terminated</h2>
                    <p className="text-xs text-rose-300 mt-1 mb-4">Your attempt was terminated due to proctoring violations.</p>
                    {result.malpracticeReason && (
                      <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-xs text-rose-300 text-left">
                        {result.malpracticeReason}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <Trophy size={52} className="mx-auto mb-3 text-amber-400" />
                    <h2 className={`text-2xl font-black ${isDark ? "text-white" : "text-slate-900"}`}>{result.assessmentTitle}</h2>
                    <div className="mt-4">
                      <span className={`text-5xl font-black ${result.percentage >= 60 ? "text-emerald-400" : "text-rose-400"}`}>
                        {result.percentage?.toFixed(1)}%
                      </span>
                      <p className={`text-sm mt-1 ${subText}`}>{result.marksObtained} / {result.totalMarks} marks</p>
                    </div>
                    <div className={`inline-block mt-3 px-4 py-1.5 rounded-full text-xs font-bold ${
                      result.percentage >= 75 ? "bg-emerald-500/10 text-emerald-400" :
                      result.percentage >= 50 ? "bg-amber-500/10 text-amber-400" :
                      "bg-rose-500/10 text-rose-400"
                    }`}>
                      {result.percentage >= 75 ? "Excellent" : result.percentage >= 50 ? "Average" : "Needs Improvement"}
                    </div>
                  </>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Attempted", val: result.attemptedQuestions, color: "" },
                  { label: "Correct", val: result.correctAnswers, color: "text-emerald-400" },
                  { label: "Wrong", val: result.wrongAnswers, color: "text-rose-400" },
                  { label: "Unattempted", val: result.unattemptedQuestions, color: "text-amber-400" },
                ].map(({ label, val, color }) => (
                  <div key={label} className={`rounded-xl border p-4 text-center ${card}`}>
                    <span className={`text-2xl font-black block ${color || (isDark ? "text-white" : "text-slate-900")}`}>{val}</span>
                    <span className={`text-[9px] uppercase font-mono ${subText}`}>{label}</span>
                  </div>
                ))}
              </div>

              {/* Answer Review */}
              {result.answers && result.answers.length > 0 && (
                <div className={`rounded-2xl border ${card}`}>
                  <div className={`p-4 border-b ${isDark ? "border-white/5" : "border-slate-200"}`}>
                    <h3 className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Answer Review</h3>
                  </div>
                  <div className="divide-y divide-white/5 max-h-96 overflow-y-auto">
                    {result.answers.map((a: any, i: number) => (
                      <div key={a.questionId} className="p-4">
                        <div className="flex items-start gap-3 mb-2">
                          <span className={`text-[9px] font-mono font-bold mt-0.5 shrink-0 ${isDark ? "text-gray-400" : "text-slate-400"}`}>Q{i + 1}</span>
                          <p className={`text-xs font-medium ${isDark ? "text-white" : "text-slate-900"}`}>{a.questionText}</p>
                          <span className="shrink-0 ml-auto">
                            {a.selectedOption === "" ? (
                              <span className="text-amber-400 text-[9px] font-bold">Skipped</span>
                            ) : a.isCorrect ? (
                              <CheckCircle size={14} className="text-emerald-400" />
                            ) : (
                              <XCircle size={14} className="text-rose-400" />
                            )}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 pl-5">
                          {(["A","B","C","D"] as const).map((opt) => {
                            const optText = a[`option${opt}`];
                            const isCorrect = a.correctOption === opt;
                            const isSelected = a.selectedOption === opt;
                            return (
                              <span key={opt} className={`text-[10px] px-2 py-0.5 rounded-lg ${
                                isCorrect && isSelected ? "bg-emerald-500/15 text-emerald-400 font-bold" :
                                isCorrect ? "bg-emerald-500/10 text-emerald-400 font-bold" :
                                isSelected && !isCorrect ? "bg-rose-500/10 text-rose-400 line-through" :
                                isDark ? "text-gray-400" : "text-slate-500"
                              }`}>
                                {opt}: {optText}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Back button */}
              <button
                onClick={() => { setView("list"); setResult(null); setAttemptId(null); setQuestions([]); fetchAssessments(); }}
                className={`w-full py-3 rounded-xl text-xs font-bold border transition cursor-pointer ${isDark ? "border-white/10 hover:bg-white/5" : "border-slate-200 hover:bg-slate-50"}`}
              >
                <RotateCcw size={13} className="inline mr-2" /> Back to Assessments
              </button>
            </div>
          ) : (
            <div className={`rounded-2xl border p-12 text-center ${card}`}>
              <p className="text-sm text-gray-400">Result not available yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

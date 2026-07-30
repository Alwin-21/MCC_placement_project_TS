"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList, Clock, ChevronLeft, ChevronRight, CheckCircle,
  AlertTriangle, Camera, CameraOff, Trophy, Target, XCircle,
  BookOpen, ArrowRight, RotateCcw, ArrowLeft, Bell, Sun, Moon,
  ShieldCheck, Lock, RefreshCw, Eye, Lightbulb, Video, Sparkles
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

  // Pre-Exam Camera Diagnostic & Constraint State
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const [cameraCheck, setCameraCheck] = useState<{
    permission: "idle" | "checking" | "passed" | "failed";
    lighting: "idle" | "checking" | "passed" | "failed";
    resolution: "idle" | "checking" | "passed" | "failed";
    framing: "idle" | "checking" | "passed" | "failed";
    brightnessValue: number;
    resolutionText: string;
    overallStatus: "idle" | "checking" | "passed" | "failed";
    errorMessage: string;
  }>({
    permission: "idle",
    lighting: "idle",
    resolution: "idle",
    framing: "idle",
    brightnessValue: 0,
    resolutionText: "",
    overallStatus: "idle",
    errorMessage: "",
  });

  // Continuous Diagnostic Frame Analyzer (Runs every 400ms on Instructions View)
  const sampleDiagnosticFrame = useCallback(() => {
    const video = previewVideoRef.current;
    const stream = streamRef.current;

    // Check if video element or stream active
    if (!video) return;

    // Auto-resume video stream if paused by browser
    if ((video.paused || video.ended || video.readyState < 2) && stream && stream.active) {
      if (!video.srcObject) {
        video.srcObject = stream;
      }
      video.muted = true;
      video.playsInline = true;
      video.play().catch(() => {});

      // Give stream 1 cycle to resume without returning early false failure
      if (video.readyState < 2) {
        return;
      }
    }

    if (video.paused || video.ended || video.readyState < 2) {
      setCameraCheck((prev) => {
        if (prev.permission !== "passed") return prev;
        return {
          ...prev,
          framing: "failed",
          overallStatus: "failed",
          errorMessage: "Webcam video feed is inactive or frozen. Please click 'Re-Test Camera Setup'.",
        };
      });
      return;
    }

    const canvas = previewCanvasRef.current || document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 48;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, 64, 48);
    const imgData = ctx.getImageData(0, 0, 64, 48).data;

    let totalLuminance = 0;
    let totalPixels = 0;
    const allPixels: number[] = [];

    // Face / Skin-tone Spatial Mass Tracking
    let totalFacePixels = 0;
    let sumFaceX = 0;
    let centerTargetFacePixels = 0;

    for (let y = 0; y < 48; y++) {
      for (let x = 0; x < 64; x++) {
        const i = (y * 64 + x) * 4;
        const r = imgData[i];
        const g = imgData[i + 1];
        const b = imgData[i + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;

        totalLuminance += lum;
        totalPixels++;
        allPixels.push(lum);

        // Precise human skin-tone & face feature detector (distinguishes human skin from walls/furniture)
        const isSkinTone = r > 48 && g > 28 && b > 18 && r > g && (r - g) >= 8 && (r - b) >= 12 && Math.abs(g - b) <= 36;
        if (isSkinTone) {
          totalFacePixels++;
          sumFaceX += x;
          // Center target oval region (x: 18 to 46, y: 6 to 42)
          if (x >= 18 && x <= 46 && y >= 6 && y <= 42) {
            centerTargetFacePixels++;
          }
        }
      }
    }

    const avgLuminance = totalPixels > 0 ? totalLuminance / totalPixels : 0;
    const brightnessPercentage = Math.round((avgLuminance / 255) * 100);

    // 1. Lighting Check (Acceptable range 25% - 95%)
    let lightingPassed = true;
    let lightingErr = "";
    if (avgLuminance < 25) {
      lightingPassed = false;
      lightingErr = `Room environment is too dark (${brightnessPercentage}% brightness). Please turn on room lights or uncover camera.`;
    } else if (avgLuminance > 245) {
      lightingPassed = false;
      lightingErr = `Excessive direct glare detected (${brightnessPercentage}%). Please adjust light positioning.`;
    }

    // 2. Resolution Check
    const w = video.videoWidth || 320;
    const h = video.videoHeight || 240;
    const resPassed = w >= 320 && h >= 240;
    const resText = `${w}x${h}`;

    // 3. Face Centering & Spatial Mass Analysis
    let totalVarianceSum = 0;
    for (let p of allPixels) {
      totalVarianceSum += Math.abs(p - avgLuminance);
    }
    const frameVariance = allPixels.length > 0 ? totalVarianceSum / allPixels.length : 0;

    let framingPassed = true;
    let framingErr = "";

    // Calculate face horizontal centroid (0..64)
    const centroidX = totalFacePixels > 0 ? sumFaceX / totalFacePixels : 32;
    const centerRatio = totalFacePixels > 0 ? centerTargetFacePixels / totalFacePixels : 0;

    if (frameVariance < 1.8) {
      framingPassed = false;
      framingErr = "Webcam lens appears covered or video feed is obscured.";
    } else if (totalFacePixels < 30 || centerTargetFacePixels < 18) {
      // Case 3: Face completely missing or out of camera view
      framingPassed = false;
      framingErr = "Face not detected in camera frame. Please position yourself directly in front of the camera.";
    } else if (centroidX < 23 || centroidX > 41 || centerRatio < 0.50) {
      // Case 2: Face shifted off-center / half-way out of circle
      framingPassed = false;
      framingErr = "Face is shifted off-center. Please align your face inside the target circle.";
    } else {
      // Case 1: Face centered inside target oval
      framingPassed = true;
    }

    const allPassed = resPassed && lightingPassed && framingPassed;

    let finalError = "";
    if (!resPassed) finalError = `Resolution (${resText}) below requirement.`;
    else if (!lightingPassed) finalError = lightingErr;
    else if (!framingPassed) finalError = framingErr;

    setCameraCheck((prev) => ({
      permission: "passed",
      lighting: lightingPassed ? "passed" : "failed",
      resolution: resPassed ? "passed" : "failed",
      framing: framingPassed ? "passed" : "failed",
      brightnessValue: brightnessPercentage,
      resolutionText: resText,
      overallStatus: allPassed ? "passed" : "failed",
      errorMessage: finalError,
    }));
  }, []);

  const runCameraDiagnostic = async () => {
    setCameraCheck({
      permission: "checking",
      lighting: "checking",
      resolution: "checking",
      framing: "checking",
      brightnessValue: 0,
      resolutionText: "",
      overallStatus: "checking",
      errorMessage: "",
    });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
      });

      streamRef.current = stream;
      setCameraActive(true);

      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = stream;
        try {
          await previewVideoRef.current.play();
        } catch (e) {
          console.warn("Video play interrupted:", e);
        }
      }

      setCameraPermission("granted");
      sampleDiagnosticFrame();
    } catch (err: any) {
      let msg = "Camera permissions denied or webcam hardware unavailable. Please allow camera access in your browser settings to proceed.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        msg = "Camera permission was denied. Please click the camera/lock icon in your browser address bar and select 'Allow'.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        msg = "No camera hardware detected. Please connect a working webcam to your device.";
      }
      setCameraCheck({
        permission: "failed",
        lighting: "failed",
        resolution: "failed",
        framing: "failed",
        brightnessValue: 0,
        resolutionText: "N/A",
        overallStatus: "failed",
        errorMessage: msg,
      });
      setCameraPermission("denied");
    }
  };

  // Continuous real-time diagnostic check whenever Instructions view is active
  useEffect(() => {
    let diagnosticInterval: NodeJS.Timeout | null = null;

    if (view === "instructions") {
      runCameraDiagnostic();
      diagnosticInterval = setInterval(() => {
        sampleDiagnosticFrame();
      }, 400);
    }

    return () => {
      if (diagnosticInterval) clearInterval(diagnosticInterval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

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
    if (cameraCheck.overallStatus !== "passed") {
      alert("Camera setup check failed. Please resolve the camera or lighting constraints shown above before starting the exam.");
      return;
    }
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

            {/* ── WEBCAM PRE-CHECK & CONSTRAINTS DIAGNOSTIC ── */}
            <div className={`rounded-2xl border p-5 mb-6 space-y-4 ${isDark ? "bg-white/[0.02] border-white/10" : "bg-slate-50/80 border-slate-200"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#781c1c]/10 text-[#781c1c] flex items-center justify-center">
                    <Camera size={16} />
                  </div>
                  <div>
                    <h3 className={`text-xs font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                      Camera & System Pre-Exam Diagnostic
                    </h3>
                    <p className={`text-[10px] ${subText}`}>
                      Webcam proctoring constraints verification
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={runCameraDiagnostic}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold flex items-center gap-1 border transition cursor-pointer ${
                    isDark
                      ? "border-white/10 bg-white/5 hover:bg-white/10 text-white"
                      : "border-slate-300 bg-white hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <RefreshCw size={11} className={cameraCheck.overallStatus === "checking" ? "animate-spin" : ""} />
                  Re-Test Camera Setup
                </button>
              </div>

              {/* Live Video Preview Box with Framing Overlay */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-slate-700/60 shadow-inner flex items-center justify-center">
                  <video
                    ref={previewVideoRef}
                    autoPlay
                    muted
                    playsInline
                    onLoadedMetadata={(e) => (e.target as HTMLVideoElement).play().catch(() => {})}
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                  <canvas ref={previewCanvasRef} className="hidden" />

                  {/* Dynamic Face Bounding Guide Overlay */}
                  <div className={`absolute inset-0 border-2 border-dashed rounded-[45%] mx-auto my-3 w-32 h-40 pointer-events-none flex items-center justify-center transition-all duration-300 ${
                    cameraCheck.framing === "passed"
                      ? "border-emerald-400/80 bg-emerald-500/10 shadow-lg shadow-emerald-500/20"
                      : "border-rose-500/90 bg-rose-500/20 animate-pulse"
                  }`}>
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border shadow ${
                      cameraCheck.framing === "passed"
                        ? "text-emerald-300 bg-black/70 border-emerald-500/30"
                        : "text-rose-300 bg-black/70 border-rose-500/30"
                    }`}>
                      {cameraCheck.framing === "passed" ? "✅ Face Centered" : "❌ Center Face Here"}
                    </span>
                  </div>

                  {/* Overlay Badges */}
                  <div className="absolute top-2 left-2 flex gap-1.5">
                    {cameraCheck.overallStatus === "passed" && (
                      <span className="bg-emerald-500/90 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-sm shadow">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live Stream
                      </span>
                    )}
                    {cameraCheck.overallStatus === "failed" && (
                      <span className="bg-rose-500/90 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-sm shadow">
                        <CameraOff size={10} /> Stream Stopped
                      </span>
                    )}
                    {cameraCheck.overallStatus === "checking" && (
                      <span className="bg-amber-500/90 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-sm shadow">
                        <RefreshCw size={10} className="animate-spin" /> Sampling...
                      </span>
                    )}
                  </div>

                  {cameraCheck.overallStatus === "passed" && (
                    <div className="absolute bottom-2 right-2 flex gap-1.5 text-[9px] font-mono font-bold text-white bg-black/60 px-2 py-0.5 rounded-md border border-white/10">
                      <span>💡 {cameraCheck.brightnessValue}%</span>
                      <span>•</span>
                      <span>📐 {cameraCheck.resolutionText}</span>
                    </div>
                  )}
                </div>

                {/* Constraint Checklist Cards */}
                <div className="space-y-2 text-xs">
                  {[
                    {
                      title: "Camera Permissions & Hardware",
                      status: cameraCheck.permission,
                      detail: cameraCheck.permission === "passed" ? "Webcam active & authorized" : cameraCheck.permission === "failed" ? "Permission blocked / No camera" : "Requesting access...",
                      icon: Camera,
                    },
                    {
                      title: "Room Environment Lighting",
                      status: cameraCheck.lighting,
                      detail: cameraCheck.lighting === "passed" ? `Optimal brightness (${cameraCheck.brightnessValue}%)` : cameraCheck.lighting === "failed" ? `Lighting invalid (${cameraCheck.brightnessValue}%)` : "Measuring brightness...",
                      icon: Lightbulb,
                    },
                    {
                      title: "Video Stream & Resolution",
                      status: cameraCheck.resolution,
                      detail: cameraCheck.resolution === "passed" ? `Valid resolution (${cameraCheck.resolutionText})` : cameraCheck.resolution === "failed" ? "Low resolution / Unreadable feed" : "Evaluating resolution...",
                      icon: Video,
                    },
                    {
                      title: "Face Visibility & Positioning",
                      status: cameraCheck.framing,
                      detail: cameraCheck.framing === "passed" ? "Active feed ready for proctoring" : cameraCheck.framing === "failed" ? "Video feed frozen or unreadable" : "Checking video feed...",
                      icon: Eye,
                    },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                        item.status === "passed"
                          ? isDark ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-300" : "bg-emerald-50 border-emerald-200 text-emerald-900"
                          : item.status === "failed"
                            ? isDark ? "bg-rose-500/10 border-rose-500/30 text-rose-300" : "bg-rose-50 border-rose-200 text-rose-900"
                            : isDark ? "bg-white/5 border-white/5 text-gray-400" : "bg-white border-slate-200 text-slate-600"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <item.icon size={13} className="shrink-0" />
                        <div>
                          <p className="font-bold text-[11px] leading-tight">{item.title}</p>
                          <p className="text-[10px] opacity-80">{item.detail}</p>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {item.status === "passed" && <CheckCircle size={15} className="text-emerald-500" />}
                        {item.status === "failed" && <XCircle size={15} className="text-rose-500" />}
                        {item.status === "checking" && <RefreshCw size={13} className="animate-spin text-amber-500" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Overall Failure Alert Box */}
              {cameraCheck.overallStatus === "failed" && (
                <div className={`p-4 rounded-xl border flex items-start gap-3 ${isDark ? "bg-rose-500/10 border-rose-500/30 text-rose-200" : "bg-rose-50 border-rose-200 text-rose-900"}`}>
                  <XCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <p className="font-extrabold text-rose-500 uppercase tracking-wider text-[10px]">
                      Camera Constraint Check Failed
                    </p>
                    <p className="font-medium leading-relaxed">{cameraCheck.errorMessage}</p>
                    <p className="text-[11px] opacity-90 pt-1">
                      💡 <b>Action Required:</b> Ensure camera permission is set to "Allow", adjust room lighting, uncover your lens, and click <b>"Re-Test Camera Setup"</b> to unlock the exam.
                    </p>
                  </div>
                </div>
              )}

              {/* Overall Success Alert Box */}
              {cameraCheck.overallStatus === "passed" && (
                <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${isDark ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200" : "bg-emerald-50 border-emerald-200 text-emerald-900"}`}>
                  <ShieldCheck size={18} className="text-emerald-500 shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold text-emerald-500">All Camera Constraints Verified</p>
                    <p className="text-[11px] opacity-90">Your camera and room environment meet all proctoring guidelines. You may now start the exam.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setView("list")}
                className={`flex-1 py-3 rounded-xl text-xs font-bold border transition cursor-pointer ${isDark ? "border-white/10 hover:bg-white/5 text-gray-300" : "border-slate-200 hover:bg-slate-50 text-slate-700"}`}>
                Back
              </button>
              {cameraCheck.overallStatus === "passed" ? (
                <button onClick={handleBeginExam}
                  className="flex-1 py-3 rounded-xl text-xs font-bold bg-[#781c1c] hover:bg-[#5f1515] text-white transition shadow-lg shadow-[#781c1c]/20 cursor-pointer flex items-center justify-center gap-1.5">
                  Begin Exam →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (cameraCheck.overallStatus === "failed") {
                      alert("Camera setup check failed: " + cameraCheck.errorMessage);
                    } else {
                      runCameraDiagnostic();
                    }
                  }}
                  className={`flex-1 py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-not-allowed ${
                    isDark ? "bg-white/10 text-gray-500 border border-white/5" : "bg-slate-200 text-slate-400"
                  }`}
                >
                  <Lock size={12} /> Begin Exam (Camera Required)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── EXAM VIEW (3-Segment Grid Layout) ── */}
      {view === "exam" && !terminated && questions.length > 0 && (
        <div className="max-w-[1550px] mx-auto px-4 md:px-8 py-5 md:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* ── LEFT SEGMENT (Question Navigator & Submit) ── */}
            <div className="lg:col-span-3 space-y-5">
              <div className={`rounded-2xl border p-5 ${card} space-y-4 shadow-sm`}>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono uppercase tracking-widest font-extrabold ${subText}`}>
                    Question Navigator
                  </span>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    {answered}/{questions.length} Answered
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2.5">
                  {questions.map((q, i) => (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQIndex(i)}
                      className={`aspect-square rounded-xl text-xs font-black transition-all duration-150 cursor-pointer shadow-sm flex items-center justify-center ${
                        i === currentQIndex
                          ? "bg-[#781c1c] text-white ring-4 ring-[#781c1c]/30 scale-105"
                          : q.selectedOption
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                            : isDark
                              ? "bg-white/5 text-gray-300 hover:bg-white/10 hover:border-white/20 border border-white/5"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-200/50 dark:border-white/10 space-y-2 text-[10px]">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Answered
                    </span>
                    <span className="font-mono font-bold text-emerald-400">{answered}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#781c1c]" /> Current
                    </span>
                    <span className="font-mono font-bold text-[#781c1c]">Q{currentQIndex + 1}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-white/20" /> Remaining
                    </span>
                    <span className="font-mono font-bold">{questions.length - answered}</span>
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  className="w-full py-4 rounded-2xl text-xs md:text-sm font-black bg-[#781c1c] hover:bg-[#5f1515] text-white transition shadow-xl shadow-[#781c1c]/20 hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2 mt-4"
                >
                  Submit Assessment <CheckCircle size={16} />
                </button>
              </div>
            </div>

            {/* ── CENTER SEGMENT (Questions & Choices) ── */}
            <div className="lg:col-span-6 space-y-5">
              <div className={`rounded-2xl border p-6 md:p-8 ${card} shadow-sm space-y-6`}>
                {/* Question Header */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-extrabold uppercase tracking-wider text-[#781c1c] bg-[#781c1c]/10 px-3 py-1 rounded-full border border-[#781c1c]/20">
                    Question {currentQIndex + 1} of {questions.length}
                  </span>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${isDark ? "bg-white/5 border-white/10 text-amber-300" : "bg-amber-50 border-amber-200 text-amber-800"}`}>
                    {questions[currentQIndex]?.marks} mark{(questions[currentQIndex]?.marks || 1) > 1 ? "s" : ""}
                  </span>
                </div>

                {/* Progress bar */}
                <div className={`h-2 rounded-full ${isDark ? "bg-white/5" : "bg-slate-100"}`}>
                  <div
                    className="h-2 bg-[#781c1c] rounded-full transition-all duration-500"
                    style={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}
                  />
                </div>

                {/* Question text */}
                <p className={`text-base md:text-lg font-bold leading-relaxed ${isDark ? "text-white" : "text-slate-900"}`}>
                  {questions[currentQIndex]?.questionText}
                </p>

                {/* Options (Bigger Buttons & Padding) */}
                <div className="space-y-3.5 pt-2">
                  {(["A", "B", "C", "D"] as const).map((opt) => {
                    const optKey = `option${opt}` as keyof Question;
                    const optText = questions[currentQIndex]?.[optKey] as string;
                    const isSelected = questions[currentQIndex]?.selectedOption === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => selectOption(opt)}
                        className={`w-full flex items-center gap-4 px-5 py-4 md:py-4.5 rounded-2xl border text-sm md:text-base font-semibold text-left transition-all duration-200 cursor-pointer shadow-sm ${
                          isSelected
                            ? "border-2 border-[#781c1c] bg-[#781c1c]/10 text-[#781c1c] shadow-md shadow-[#781c1c]/10 scale-[1.01]"
                            : isDark
                              ? "border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/20 text-gray-200"
                              : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-800"
                        }`}
                      >
                        <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs md:text-sm font-black shrink-0 transition-all shadow-inner ${
                          isSelected
                            ? "bg-[#781c1c] text-white"
                            : isDark
                              ? "bg-white/10 text-gray-300"
                              : "bg-slate-100 text-slate-600"
                        }`}>
                          {opt}
                        </span>
                        <span className="flex-1 leading-snug">{optText}</span>
                        {isSelected && <CheckCircle size={20} className="text-[#781c1c] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Center Navigation Buttons */}
              <div className="flex items-center justify-between gap-4 pt-2">
                <button
                  onClick={() => setCurrentQIndex((i) => Math.max(0, i - 1))}
                  disabled={currentQIndex === 0}
                  className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl text-xs md:text-sm font-bold border transition cursor-pointer disabled:opacity-40 shadow-sm ${
                    isDark ? "border-white/10 hover:bg-white/5 text-gray-200" : "border-slate-200 hover:bg-slate-100 text-slate-700 bg-white"
                  }`}
                >
                  <ChevronLeft size={16} /> Previous Question
                </button>

                {currentQIndex < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQIndex((i) => Math.min(questions.length - 1, i + 1))}
                    className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl text-xs md:text-sm font-bold border transition cursor-pointer shadow-sm ${
                      isDark ? "border-white/10 hover:bg-white/5 text-gray-200" : "border-slate-200 hover:bg-slate-100 text-slate-700 bg-white"
                    }`}
                  >
                    Next Question <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    className="flex items-center gap-2 px-7 py-3.5 rounded-2xl text-xs md:text-sm font-black bg-[#781c1c] hover:bg-[#5f1515] text-white transition shadow-lg shadow-[#781c1c]/20 cursor-pointer"
                  >
                    Submit Assessment <CheckCircle size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* ── RIGHT SEGMENT (Proctoring Camera Video) ── */}
            <div className="lg:col-span-3 space-y-5">
              <div className={`rounded-2xl border p-5 ${card} shadow-sm space-y-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className={`text-[10px] font-mono uppercase tracking-widest font-extrabold ${subText}`}>
                      Proctoring Camera
                    </span>
                  </div>
                  {cameraActive ? (
                    <span className="text-[10px] text-emerald-400 font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
                      <Camera size={10} /> Live
                    </span>
                  ) : (
                    <span className="text-[10px] text-rose-400 font-extrabold px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center gap-1">
                      <CameraOff size={10} /> Off
                    </span>
                  )}
                </div>

                {/* Larger Camera Video Container filling the right column */}
                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-black relative border-2 border-slate-700/80 shadow-2xl w-full flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {!cameraActive && !cameraError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-2">
                      <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span className="text-[10px] font-mono text-white/70">Connecting Feed...</span>
                    </div>
                  )}
                  {cameraError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-rose-950/80">
                      <CameraOff size={24} className="text-rose-400 mb-1" />
                      <p className="text-[10px] font-bold text-rose-200">Camera Feed Interrupted</p>
                      <p className="text-[9px] text-rose-300/80">Exam proctoring is still active.</p>
                    </div>
                  )}
                </div>

                {/* Proctoring Status Details */}
                <div className="space-y-2 pt-1">
                  <div className={`p-2.5 rounded-xl border flex items-center justify-between text-[11px] ${
                    warningCount >= 3 ? "bg-rose-500/10 border-rose-500/30 text-rose-300" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  }`}>
                    <span className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle size={12} /> Warning Logs
                    </span>
                    <span className="font-mono font-extrabold">{warningCount} / 4</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border flex items-center justify-between text-[11px] ${
                    isDark ? "bg-white/5 border-white/10 text-gray-300" : "bg-slate-50 border-slate-200 text-slate-700"
                  }`}>
                    <span className="flex items-center gap-1.5 font-bold">
                      <ShieldCheck size={12} className="text-emerald-400" /> Focus Status
                    </span>
                    <span className="font-mono text-emerald-400 font-bold">Active</span>
                  </div>
                </div>
              </div>
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

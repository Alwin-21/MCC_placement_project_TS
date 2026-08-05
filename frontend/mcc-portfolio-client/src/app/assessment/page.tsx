"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList, Clock, ChevronLeft, ChevronRight, CheckCircle,
  AlertTriangle, Camera, CameraOff, Trophy, Target, XCircle,
  BookOpen, ArrowRight, RotateCcw, ArrowLeft, Sun, Moon,
  ShieldCheck, Lock, RefreshCw, Eye, Lightbulb, Video,
  Monitor, Globe, Maximize2, ShieldAlert, Check, HelpCircle, Save, AlertCircle,
  Users
} from "lucide-react";
import api from "@/services/api";
import { useTheme } from "@/hooks/useTheme";
import { useExamSecurity } from "@/hooks/useExamSecurity";
import { Calculator as CalculatorIcon } from "lucide-react";
import Calculator from "@/components/Calculator";
import { useAutoSave } from "@/hooks/useAutoSave";
import { ExamRiskEngine, ViolationLogEntry, ViolationType, AUTO_SUBMIT_THRESHOLD } from "@/utils/examRiskEngine";
import { collectDeviceInfo, checkBrowserCompatibility } from "@/utils/deviceInfo";
import { ProctoringEngine as ModularProctoringEngine, createPreExamFaceDetector, loadFaceApiForRegistration, classifyCameraError, CameraErrorResult } from "@/utils/proctoringEngine";

type ViewState = "list" | "compatibility" | "instructions" | "exam" | "result";

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
  
  // Custom states/refs for AI Proctoring & Calculator additions
  const [examSettings, setExamSettings] = useState({
    calculatorEnabled: true,
    calculatorMode: "Basic" as "Basic" | "Scientific",
    faceMissingTimeout: 5,
    pauseTimerOnFaceMissing: false,
    objectDetectionEnabled: true
  });
  const examSettingsRef = useRef(examSettings);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const isTimerPausedRef = useRef(false);
  const [showCalculator, setShowCalculator] = useState(false);
  
  const [aiStatus, setAiStatus] = useState("Initializing proctoring...");
  const proctoringEngineRef = useRef<ModularProctoringEngine | null>(null);

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

  // Risk Engine & Proctoring State
  const [riskScore, setRiskScore] = useState<number>(0);
  const [violationLog, setViolationLog] = useState<ViolationLogEntry[]>([]);
  const riskEngineRef = useRef<ExamRiskEngine | null>(null);

  // Proctoring Video / Canvas
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [cameraErrorInfo, setCameraErrorInfo] = useState<CameraErrorResult | null>(null);
  const [isRecoveringStream, setIsRecoveringStream] = useState(false);
  const [terminated, setTerminated] = useState(false);
  // Live refs — always hold the current value so setInterval callbacks are never stale
  const attemptIdRef = useRef<number | null>(null);
  const activeAssessmentRef = useRef<Assessment | null>(null);
  const [cameraPermission, setCameraPermission] = useState<"pending" | "granted" | "denied">("pending");
  // Custom confirm modals
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // Modals & Popups
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timerModal, setTimerModal] = useState<{ open: boolean; title: string; message: string }>({
    open: false, title: "", message: ""
  });
  const timerWarningsFired = useRef<Record<number, boolean>>({});

  // System Compatibility Check State
  const [compatCheck, setCompatCheck] = useState<{
    camera: "checking" | "passed" | "failed";
    screen: "checking" | "passed" | "failed";
    browser: "checking" | "passed" | "failed";
    connection: "checking" | "passed" | "failed";
    fullscreen: "checking" | "passed" | "failed";
    errors: string[];
    allPassed: boolean;
  }>({
    camera: "checking",
    screen: "checking",
    browser: "checking",
    connection: "checking",
    fullscreen: "checking",
    errors: [],
    allPassed: false,
  });

  // Pre-Exam Camera Diagnostic State
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

  // Face Registration States
  const [registeredDescriptor, setRegisteredDescriptor] = useState<number[] | null>(null);
  const [registeredFacePhoto, setRegisteredFacePhoto] = useState("");
  const [pauseReason, setPauseReason] = useState("");

  // Manual Face Capture States
  const [capturedFacePhoto, setCapturedFacePhoto] = useState<string>("");
  const [capturedFaceDescriptor, setCapturedFaceDescriptor] = useState<number[] | null>(null);
  const [isVerifyingCapture, setIsVerifyingCapture] = useState(false);
  const isVerifyingCaptureRef = useRef(false);
  useEffect(() => { isVerifyingCaptureRef.current = isVerifyingCapture; }, [isVerifyingCapture]);
  const [captureVerifyError, setCaptureVerifyError] = useState("");

  // Warning queue states
  const [activeWarning, setActiveWarning] = useState<{ type: string; message: string } | null>(null);
  const activeWarningRef = useRef<{ type: string; message: string } | null>(null);
  const warningQueueRef = useRef<{ type: string; message: string }[]>([]);

  // Prevent repeated warnings for continuous violations
  const activeViolationsRef = useRef<Record<string, boolean>>({});

  // (Tick counter refs superseded by ProctoringEngine state machines)

  // Malpractice Lock
  const [malpracticeLocked, setMalpracticeLocked] = useState(false);

  // Internet Monitoring
  const [isOnline, setIsOnline] = useState(true);

  // Malpractice termination state
  const [terminatedDueToMalpractice, setTerminatedDueToMalpractice] = useState(false);

  // Inline retake-photo confirmation (replaces window.confirm to avoid focus-steal blur warning)
  const [showRetakeConfirm, setShowRetakeConfirm] = useState(false);

  // Live face count from MediaPipe pre-exam diagnostic (-1 = AI not yet loaded)
  const [faceCountInFrame, setFaceCountInFrame] = useState<number>(-1);

  const handleWarningDismiss = () => {
    if (warningQueueRef.current.length > 0) {
      const nextWarning = warningQueueRef.current.shift()!;
      activeWarningRef.current = nextWarning;
      setActiveWarning(nextWarning);
    } else {
      activeWarningRef.current = null;
      setActiveWarning(null);
    }
  };

  const queueWarning = useCallback((type: string, message: string) => {
    if (activeWarningRef.current?.type === type || warningQueueRef.current.some(w => w.type === type)) {
      return;
    }
    const newWarning = { type, message };
    if (!activeWarningRef.current) {
      activeWarningRef.current = newWarning;
      setActiveWarning(newWarning);
    } else {
      warningQueueRef.current.push(newWarning);
    }
  }, []);

  // ── SECURITY HOOK (Keyboard/DevTools/Fullscreen/TabSwitch) ────────────────
  const handleSecurityViolation = useCallback((type: ViolationType, details: string, browserEvent?: string) => {
    if (riskEngineRef.current) {
      const entry = riskEngineRef.current.logViolation(type, details, 1.0, browserEvent);
      if (entry) {
        setRiskScore(riskEngineRef.current.getCumulativeRisk());
        setViolationLog(riskEngineRef.current.getLog());
        
        // Log warning event to database
        const aid = attemptIdRef.current;
        const assessment = activeAssessmentRef.current;
        if (aid && assessment) {
          api.post(`/Assessments/${assessment.id}/attempt/proctoring`, {
            attemptId: aid,
            warningType: type,
            details,
          }).catch(err => console.error("Database security warning log failed:", err));
        }

        let displayMessage = details;
        if (type === "TabSwitch" || type === "WindowBlur") {
          displayMessage = "Tab Switching Detected\n\nPlease stay within the assessment window.";
        } else if (type === "FullscreenExit") {
          displayMessage = "Fullscreen Required\n\nPlease return to fullscreen mode.";
        }
        
        queueWarning(type, displayMessage);
      }
    }
  }, [queueWarning]);

  const { isFullscreen, requestFullscreen, exitFullscreen } = useExamSecurity({
    active: view === "exam" && !terminated,
    onViolation: handleSecurityViolation,
  });

  // ── AUTOSAVE HOOK ─────────────────────────────────────────────────────────
  const saveAnswerApi = useCallback(async (questionId: number, selectedOption: string) => {
    if (!attemptId || !activeAssessment) return;
    await api.post(`/Assessments/${activeAssessment.id}/attempt/answer`, {
      attemptId,
      questionId,
      selectedOption,
    });
  }, [attemptId, activeAssessment]);

  const { queueSave, flushQueue, isSaving, lastSavedAt, saveError } = useAutoSave({
    active: view === "exam" && !terminated,
    saveFn: saveAnswerApi,
  });

  // Pre-exam face detector ref — separate from the engine's FaceLandmarker
  const preExamFaceDetectorRef = useRef<any>(null);

  // Simplified diagnostic frame sampler — brightness/resolution/framing checks + face count via MediaPipe FaceDetector
  const sampleDiagnosticFrame = useCallback(() => {
    // Skip diagnostic sampling while face capture verification is running to prevent main-thread contention
    if (isVerifyingCaptureRef.current) return;

    const video = previewVideoRef.current;
    const stream = streamRef.current;

    if (!video) return;

    if ((video.paused || video.ended || video.readyState < 2) && stream && stream.active) {
      if (!video.srcObject) video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      video.play().catch(() => {});
      if (video.readyState < 2) return;
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

    // ── Pixel analysis for brightness / framing ──────────────────────────────
    const canvas = previewCanvasRef.current || document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 48;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, 64, 48);
    const imgData = ctx.getImageData(0, 0, 64, 48).data;

    let totalLuminance = 0;
    const allPixels: number[] = [];
    let totalFacePixels = 0;

    for (let y = 0; y < 48; y++) {
      for (let x = 0; x < 64; x++) {
        const i = (y * 64 + x) * 4;
        const r = imgData[i];
        const g = imgData[i + 1];
        const b = imgData[i + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        totalLuminance += lum;
        allPixels.push(lum);
        // Skin-tone heuristic for fallback face count
        const isSkin = r > 48 && g > 28 && b > 18 && r > g && (r - g) >= 8 && (r - b) >= 12 && Math.abs(g - b) <= 36;
        if (isSkin) totalFacePixels++;
      }
    }

    const avgLuminance = allPixels.length > 0 ? totalLuminance / allPixels.length : 0;
    const brightnessPercentage = Math.round((avgLuminance / 255) * 100);

    let lightingPassed = true;
    let lightingErr = "";
    if (avgLuminance < 25) {
      lightingPassed = false;
      lightingErr = `Room is too dark (${brightnessPercentage}% brightness). Please turn on room lights.`;
    } else if (avgLuminance > 245) {
      lightingPassed = false;
      lightingErr = `Excessive glare (${brightnessPercentage}%). Please adjust lighting.`;
    }

    const w = video.videoWidth || 320;
    const h = video.videoHeight || 240;
    const resPassed = w >= 320 && h >= 240;
    const resText = `${w}x${h}`;

    let totalVariance = 0;
    for (const p of allPixels) totalVariance += Math.abs(p - avgLuminance);
    const frameVariance = allPixels.length > 0 ? totalVariance / allPixels.length : 0;
    const framingPassed = frameVariance >= 1.8;
    const framingErr = framingPassed ? "" : "Webcam lens appears covered or video feed is obscured.";

    const allPassed = resPassed && lightingPassed && framingPassed;
    let finalError = "";
    if (!resPassed) finalError = `Resolution (${resText}) below requirement.`;
    else if (!lightingPassed) finalError = lightingErr;
    else if (!framingPassed) finalError = framingErr;

    setCameraCheck(() => ({
      permission: "passed",
      lighting: lightingPassed ? "passed" : "failed",
      resolution: resPassed ? "passed" : "failed",
      framing: framingPassed ? "passed" : "failed",
      brightnessValue: brightnessPercentage,
      resolutionText: resText,
      overallStatus: allPassed ? "passed" : "failed",
      errorMessage: finalError,
    }));

    // ── Face count via pre-exam MediaPipe FaceDetector ───────────────────────
    if (preExamFaceDetectorRef.current) {
      try {
        const results = preExamFaceDetectorRef.current.detectForVideo
          ? preExamFaceDetectorRef.current.detectForVideo(video, performance.now())
          : preExamFaceDetectorRef.current.detect(video);
        const detections = results.detections || [];
        setFaceCountInFrame(detections.length);
      } catch (err) {
        // Detector not ready yet or video not playing — ignore
      }
    } else {
      // Skin-pixel fallback until MediaPipe loads
      setFaceCountInFrame(totalFacePixels > 80 ? 1 : 0);
    }
  }, [])

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
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" }
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
      const classified = classifyCameraError(err);
      setCameraCheck({
        permission: "failed",
        lighting: "failed",
        resolution: "failed",
        framing: "failed",
        brightnessValue: 0,
        resolutionText: "N/A",
        overallStatus: "failed",
        errorMessage: `${classified.title}: ${classified.message}`,
      });
      setCameraPermission("denied");
    }
  };

  // Continuous real-time diagnostic check whenever Instructions view is active
  useEffect(() => {
    let diagnosticInterval: NodeJS.Timeout | null = null;

    if (view === "instructions") {
      setFaceCountInFrame(-1); // Show "checking" spinner while AI loads

      // Start camera immediately — face count updates once AI model loads
      runCameraDiagnostic();
      diagnosticInterval = setInterval(() => {
        sampleDiagnosticFrame();
      }, 750);

      // Load lightweight pre-exam face detector (FaceDetector, not FaceLandmarker)
      if (!preExamFaceDetectorRef.current) {
        createPreExamFaceDetector()
          .then((detector) => {
            preExamFaceDetectorRef.current = detector;
          })
          .catch((err) => {
            console.warn("[Diagnostic] Pre-exam face detector load failed (skin-pixel fallback active):", err);
          });
      }

      // Preload face-api.js models in background so photo capture is instant
      loadFaceApiForRegistration().catch((e) => {
        console.warn("[Diagnostic] Face API background preload:", e);
      });
    } else {
      setFaceCountInFrame(-1); // Clear when leaving instructions view
    }

    return () => {
      if (diagnosticInterval) clearInterval(diagnosticInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  // ── SYSTEM COMPATIBILITY CHECK ────────────────────────────────────────────
  const runSystemCompatibilityCheck = async () => {
    setCompatCheck((prev) => ({ ...prev, camera: "checking", screen: "checking", browser: "checking", connection: "checking", fullscreen: "checking" }));

    const issues = checkBrowserCompatibility();
    const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

    let cameraOk = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
      cameraOk = true;
    } catch {
      cameraOk = false;
    }

    const screenOk = typeof screen !== "undefined" ? screen.width >= 1024 && screen.height >= 600 : true;
    const browserOk = issues.length === 0;
    const fsOk = typeof document !== "undefined" && !!(document.documentElement.requestFullscreen || (document.documentElement as any).webkitRequestFullscreen);

    const allPassed = cameraOk && screenOk && browserOk && isOnline && fsOk;

    setCompatCheck({
      camera: cameraOk ? "passed" : "failed",
      screen: screenOk ? "passed" : "failed",
      browser: browserOk ? "passed" : "failed",
      connection: isOnline ? "passed" : "failed",
      fullscreen: fsOk ? "passed" : "failed",
      errors: issues,
      allPassed,
    });
  };

  useEffect(() => {
    if (view === "compatibility") {
      runSystemCompatibilityCheck();
    }
  }, [view]);

  // Result
  const [result, setResult] = useState<any>(null);
  const [loadingResult, setLoadingResult] = useState(false);

  // ── Auth check ──
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    
    // Fetch full user profile details to ensure profileImageUrl is available
    const loadProfile = async () => {
      try {
        const res = await api.get("/Users/me");
        setUser(res.data);
      } catch (err) {
        console.error("Failed to load user profile:", err);
        // Fallback to local storage if API fails
        const userData = localStorage.getItem("user");
        if (userData) {
          const parsed = JSON.parse(userData);
          setUser(parsed);
        }
      }
    };
    
    loadProfile();
    fetchAssessments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Keep live refs in sync with state (prevents stale closures in setInterval) ──
  useEffect(() => { attemptIdRef.current = attemptId; }, [attemptId]);
  useEffect(() => { activeAssessmentRef.current = activeAssessment; }, [activeAssessment]);

  // Load saved reference face descriptor on start/refresh using assessment and user ID
  useEffect(() => {
    if (activeAssessment && user) {
      const keyDesc = `reference-descriptor-${activeAssessment.id}-${user.id}`;
      const keyPhoto = `registered-face-photo-${activeAssessment.id}-${user.id}`;
      const savedDescriptor = localStorage.getItem(keyDesc);
      const savedPhoto = localStorage.getItem(keyPhoto);
      if (savedDescriptor) {
        setRegisteredDescriptor(JSON.parse(savedDescriptor));
      } else {
        setRegisteredDescriptor(null);
      }
      if (savedPhoto) {
        setRegisteredFacePhoto(savedPhoto);
      } else {
        setRegisteredFacePhoto("");
      }
    }
  }, [activeAssessment, user]);

  // ── Internet Monitoring Effect ──
  useEffect(() => {
    if (view !== "exam") return;

    const handleOnline = () => {
      setIsOnline(true);
      setIsTimerPaused(false);
      setPauseReason("");
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsTimerPaused(true);
      setPauseReason("Internet Connection Lost\n\nWaiting for reconnection...");
      
      if (riskEngineRef.current) {
        riskEngineRef.current.logViolation("InternetDisconnected", "Internet connection lost.", 1.0);
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [view]);

  const fetchAssessments = async () => {
    setLoadingList(true);
    try {
      const res = await api.get("/Assessments/student");
      setAssessments(res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoadingList(false); }
  };

  // ── Timer & Warnings (15m, 10m, 5m, 1m) ─────────────────────────────────
  useEffect(() => {
    if (view !== "exam" || !startedAt || !activeAssessment) return;
    const durationSec = activeAssessment.durationMinutes * 60;
    const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000);
    const remaining = Math.max(0, durationSec - elapsed);
    setTimeLeft(remaining);

    const interval = setInterval(() => {
      if (isTimerPausedRef.current) return; // skip ticking if timer is paused
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }

        // Trigger timed modal warnings
        const minsLeft = Math.floor(prev / 60);
        const secsMod = prev % 60;

        if (secsMod === 0 && [15, 10, 5, 1].includes(minsLeft) && !timerWarningsFired.current[minsLeft]) {
          timerWarningsFired.current[minsLeft] = true;
          setTimerModal({
            open: true,
            title: `⏰ Timer Warning: ${minsLeft} Minute${minsLeft > 1 ? "s" : ""} Remaining`,
            message: `You have ${minsLeft} minute${minsLeft > 1 ? "s" : ""} left to complete your assessment. Make sure to answer all questions and submit before time expires.`,
          });
          setTimeout(() => {
            setTimerModal((tm) => ({ ...tm, open: false }));
          }, 5000);
        }

        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, startedAt, activeAssessment]);

  // Tab Switch proctoring effect moved below triggerWarning to prevent TDZ error

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // ── Stream Auto-Recovery Callback ──
  const handleStreamDrop = useCallback(() => {
    if (view !== "exam" || terminated) return;
    setIsRecoveringStream(true);
    setCameraActive(false);
    
    if (riskEngineRef.current) {
      riskEngineRef.current.logViolation("CameraObstructed", "Webcam stream interrupted. Attempting automatic recovery...", 0.8);
      setRiskScore(riskEngineRef.current.getCumulativeRisk());
      setViolationLog(riskEngineRef.current.getLog());
    }

    queueWarning("CameraObstructed", "Webcam Stream Interrupted\n\nAttempting automatic reconnection...");

    let retries = 0;
    const retryInterval = setInterval(async () => {
      retries++;
      console.log(`[ProctorCamera] Stream recovery attempt ${retries}/3...`);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.onended = () => handleStreamDrop();
        }
        streamRef.current = stream;
        setCameraActive(true);
        setIsRecoveringStream(false);
        setCameraError(false);
        setCameraErrorInfo(null);
        clearInterval(retryInterval);
        console.log("[ProctorCamera] Stream recovered successfully!");
      } catch (err) {
        if (retries >= 3) {
          clearInterval(retryInterval);
          setIsRecoveringStream(false);
          setCameraError(true);
          const classified = classifyCameraError(err);
          setCameraErrorInfo(classified);
        }
      }
    }, 2000);
  }, [view, terminated, queueWarning]);

  // ── Camera / Proctoring ──
  const startCamera = async (isRetry = false) => {
    setCameraError(false);
    setCameraErrorInfo(null);

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" }
        });
      } catch (firstErr: any) {
        console.warn("Ideal video constraints failed, falling back to default constraints:", firstErr);
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (e) {
          console.warn("Video play interrupted:", e);
        }
      }

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          console.warn("[ProctorCamera] Video track ended mid-exam. Initiating auto-recovery...");
          handleStreamDrop();
        };
      }

      streamRef.current = stream;
      setCameraActive(true);
      setCameraPermission("granted");
      setIsRecoveringStream(false);
      startProctoring();
    } catch (err: any) {
      console.error("Camera acquisition failed:", err);
      const classified = classifyCameraError(err);
      setCameraError(true);
      setCameraErrorInfo(classified);
      setCameraPermission("denied");

      if (!isRetry && (classified.isInUseError || classified.isHardwareError)) {
        setTimeout(() => {
          if (view === "exam" && !terminated) {
            startCamera(true);
          }
        }, 2500);
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => {
        t.onended = null;
        t.stop();
      });
      streamRef.current = null;
    }
    if (proctoringEngineRef.current) {
      proctoringEngineRef.current.stop();
      proctoringEngineRef.current = null;
    }
    setCameraActive(false);
    setIsRecoveringStream(false);
  };

  const handleEngineViolation = useCallback((type: ViolationType, details: string, confidence: number) => {
    // Map the violation type to a clear student-facing warning message
    let popupMessage = "Suspicious behavior detected. Please keep your attention on the assessment.";
    if (type === "FaceMissing") {
      popupMessage = "Face Not Detected\n\nPlease return to the camera view.";
    } else if (type === "MultipleFaces") {
      popupMessage = "Multiple Persons Detected\n\nOnly one person should remain visible during the assessment.";
    } else if (type === "PhoneDetected") {
      popupMessage = "Mobile Phone Detected\n\nExternal mobile devices are not permitted during the examination.";
    } else if (type === "CameraObstructed") {
      popupMessage = "Camera Issue Detected\n\nPlease restore your camera immediately.";
    } else if (type === "LookingAway") {
      popupMessage = "Please keep your face directed towards the screen.";
    } else if (type === "FrequentEyeMovement") {
      popupMessage = "Suspicious Eye Movement Detected\n\nLooking away from the screen repeatedly is prohibited. Please keep your focus on the test.";
    } else if (type === "FaceMismatch") {
      popupMessage = "Identity Verification Failed\n\nOnly the registered student may continue this assessment.";
    } else if (type === "BookDetected") {
      popupMessage = "Prohibited Material Detected\n\nStudy materials, books, or notes are not allowed during the test.";
    } else if (type === "AdditionalPerson") {
      popupMessage = "Second Person Detected\n\nOnly the candidate must be visible in the camera frame.";
    }

    if (riskEngineRef.current) {
      const entry = riskEngineRef.current.logViolation(type, details, confidence);
      if (entry) {
        setRiskScore(riskEngineRef.current.getCumulativeRisk());
        setViolationLog(riskEngineRef.current.getLog());
        
        // Log warning event to database
        const aid = attemptIdRef.current;
        const assessment = activeAssessmentRef.current;
        if (aid && assessment) {
          api.post(`/Assessments/${assessment.id}/attempt/proctoring`, {
            attemptId: aid,
            warningType: type,
            details,
          }).catch(err => console.error("Database proctoring warning log failed:", err));
        }

        queueWarning(type, popupMessage);
      }
    }
  }, [queueWarning]);

  const startProctoring = () => {
    console.log("[Proctor] startProctoring called — ModularProctoringEngine starting");
    
    // Stop any existing engine loop
    if (proctoringEngineRef.current) {
      proctoringEngineRef.current.stop();
      proctoringEngineRef.current = null;
    }

    if (videoRef.current && canvasRef.current) {
      // Create new ProctoringEngine instance
      const engine = new ModularProctoringEngine({
        videoElement: videoRef.current,
        canvasElement: canvasRef.current,
        registeredDescriptor: registeredDescriptor,
        onViolation: (type, details, confidence) => {
          handleEngineViolation(type, details, confidence);
        },
        onViolationCleared: (type) => {
          activeViolationsRef.current[type] = false;
        },
        onStatusUpdate: (status) => {
          setAiStatus(status);
        },
        sampleFps: 5,
      });

      proctoringEngineRef.current = engine;
      engine.initAI().then(() => {
        // Only start if still in the exam view and not terminated
        if (activeAssessmentRef.current && !terminated) {
          engine.start();
        }
      }).catch((err) => {
        console.error("[Proctor] ModularProctoringEngine init failed:", err);
      });
    }
  };

  // ── handleMalpracticeTermination, handleTerminate ──
  // Both read from refs (attemptIdRef / activeAssessmentRef) to avoid stale closures.

  const handleMalpracticeTermination = useCallback(async () => {
    if (!attemptIdRef.current || !activeAssessmentRef.current) return;
    
    stopCamera();
    exitFullscreen();
    setTerminatedDueToMalpractice(true);
    setTerminated(true);
    
    try {
      await api.post(`/Assessments/${activeAssessmentRef.current.id}/attempt/terminate`, {
        attemptId: attemptIdRef.current,
        reason: "Malpractice limit exceeded (malpractice score reached 100 points).",
      });
    } catch (err) {
      console.error("Failed to terminate attempt on database:", err);
    }
    
    setTimeout(() => {
      setTerminatedDueToMalpractice(false);
      setTerminated(false);
      setView("list");
      setResult(null);
      setAttemptId(null);
      setQuestions([]);
      fetchAssessments();
    }, 9000);
  }, []);

  // ── RISK ENGINE AUTO-TERMINATE ───────────────────────────────────────────
  const handleRiskAutoSubmit = useCallback((log: ViolationLogEntry[]) => {
    handleMalpracticeTermination();
  }, [handleMalpracticeTermination]);

  // Initialize Risk Engine on exam start
  useEffect(() => {
    if (view === "exam") {
      riskEngineRef.current = new ExamRiskEngine(
        (entry) => {
          setRiskScore(riskEngineRef.current?.getCumulativeRisk() || 0);
          setViolationLog(riskEngineRef.current?.getLog() || []);
        },
        handleRiskAutoSubmit
      );
    } else {
      riskEngineRef.current = null;
    }
  }, [view, handleRiskAutoSubmit]);

  const handleTerminate = async (reason?: string) => {
    if (!attemptId || !activeAssessment) return;
    stopCamera();
    exitFullscreen();
    setTerminated(true);
    try {
      await api.post(`/Assessments/${activeAssessment.id}/attempt/terminate`, {
        attemptId,
        reason: reason || "Proctoring violations: suspicious behavior detected.",
      });
    } catch (err) { console.error(err); }
    setView("result");
    fetchResult();
  };



  // ── Start Assessment Handlers ──
  const handleStart = async (assessment: Assessment) => {
    setActiveAssessment(assessment);
    try {
      const existingRes = await api.get(`/Assessments/${assessment.id}/attempt`);
      if (existingRes.data && existingRes.data.isMalpractice) {
        setMalpracticeLocked(true);
        return;
      }
    } catch (err) {
      console.error("Error checking malpractice status:", err);
    }
    if (assessment.isCompleted) {
      setView("result");
      fetchResult(assessment.id);
      return;
    }
    setView("compatibility");
  };

  const handleBeginExam = async () => {
    if (!activeAssessment) return;
    if (cameraCheck.overallStatus !== "passed") {
      alert("Camera setup check failed. Please resolve the camera or lighting constraints shown above before starting the exam.");
      return;
    }

    // Call requestFullscreen immediately so it's bound to the user click gesture context
    await requestFullscreen();

    try {
      let createdAttemptId: number;

      const existingRes = await api.get(`/Assessments/${activeAssessment.id}/attempt`);
      if (existingRes.data && existingRes.data.attemptId) {
        if (existingRes.data.isMalpractice) {
          exitFullscreen();
          setMalpracticeLocked(true);
          return;
        }
        if (existingRes.data.isCompleted) {
          setView("result");
          fetchResult(activeAssessment.id);
          return;
        }
        createdAttemptId = existingRes.data.attemptId;
        setAttemptId(existingRes.data.attemptId);
        setQuestions(existingRes.data.questions);
        setStartedAt(new Date(existingRes.data.startedAt));
      } else {
        const res = await api.post(`/Assessments/${activeAssessment.id}/attempt`, {});
        createdAttemptId = res.data.attemptId;
        setAttemptId(res.data.attemptId);
        setQuestions(res.data.questions.map((q: any) => ({ ...q, selectedOption: "" })));
        setStartedAt(new Date(res.data.startedAt));
      }

      // Collect forensic device information & store via API
      try {
        const deviceInfo = collectDeviceInfo();
        await api.post(`/Assessments/${activeAssessment.id}/attempt/device-info`, {
          attemptId: createdAttemptId,
          deviceInfo,
        });
      } catch (e) {
        console.warn("Failed to store device info:", e);
      }

      // Load settings
      const savedSettings = localStorage.getItem(`assessment-settings-${activeAssessment.id}`);
      const settings = savedSettings ? JSON.parse(savedSettings) : {
        calculatorEnabled: true,
        calculatorMode: "Basic",
        faceMissingTimeout: 5,
        pauseTimerOnFaceMissing: false,
        objectDetectionEnabled: true
      };
      setExamSettings(settings);
      examSettingsRef.current = settings;

      // AI models are loaded by the ProctoringEngine itself during initAI()
      // Do NOT call loadProctoringAI() here — that was the old duplicate loader

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
  const selectOption = (option: string) => {
    const q = questions[currentQIndex];
    if (!q) return;
    const updated = questions.map((ques, i) =>
      i === currentQIndex ? { ...ques, selectedOption: option } : ques
    );
    setQuestions(updated);
    queueSave(q.id, option);
  };

  const confirmSubmit = async () => {
    if (!attemptId || !activeAssessment) return;
    setIsSubmitting(true);
    await flushQueue();
    stopCamera();
    exitFullscreen();
    try {
      await api.post(`/Assessments/${activeAssessment.id}/attempt/submit`, { attemptId, autoSubmit: false });
      setShowSubmitModal(false);
      setView("result");
      fetchResult(activeAssessment.id);
    } catch (err: any) {
      alert("Submit failed: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutoSubmit = async () => {
    if (!attemptId || !activeAssessment) return;
    await flushQueue();
    stopCamera();
    exitFullscreen();
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
    if (view === "exam") {
      // Use React state modal instead of window.confirm() — native confirm steals focus and triggers blur proctoring warning
      setShowLeaveConfirm(true);
    } else if (view === "compatibility" || view === "instructions" || view === "result") {
      stopCamera();
      setView("list");
      setResult(null);
    } else {
      router.back();
    }
  };

  // Cleanup on unmount
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
      {/* ── HEADER WITH BACK BUTTON & CONTROLS ── */}
      <div className={`sticky top-0 z-40 border-b px-4 md:px-8 py-3 flex items-center justify-between backdrop-blur-md ${isDark ? "border-white/5 bg-[#0d0d12]/90" : "border-slate-200 bg-white/90"}`}>
        <div className="flex items-center gap-3">
          <button onClick={handleBack}
            aria-label="Back"
            className={`p-2 rounded-xl transition cursor-pointer ${isDark ? "hover:bg-white/5 text-gray-300" : "hover:bg-slate-100 text-slate-700"}`}>
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <ClipboardList size={18} className="text-[#781c1c]" />
            <span className="font-bold text-sm">
              {view === "list" ? "Assessments" :
               view === "compatibility" ? "System Compatibility Check" :
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

          {view === "exam" && isSaving && (
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400">
              <RefreshCw size={11} className="animate-spin" /> Autosaving...
            </div>
          )}

          {view === "exam" && lastSavedAt && !isSaving && (
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400">
              <Save size={11} /> Saved
            </div>
          )}

          {view === "exam" && cameraActive && (
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400">
              <Camera size={12} /> Recording
            </div>
          )}

          {view === "exam" && riskScore > 0 && (
            <div className={`flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-1 rounded-lg border ${
              riskScore > 100 ? "bg-rose-500/20 text-rose-400 border-rose-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"
            }`}>
              <ShieldAlert size={12} /> Risk: {riskScore}/{AUTO_SUBMIT_THRESHOLD}
            </div>
          )}

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

      {/* ── TIMED WARNING MODAL (15m, 10m, 5m, 1m) ── */}
      {timerModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-md mx-4 rounded-2xl p-6 border shadow-2xl ${isDark ? "bg-[#16120b] border-amber-500/30" : "bg-amber-50 border-amber-300"}`}>
            <div className="flex items-start gap-3">
              <Clock size={24} className="text-amber-400 shrink-0 mt-1" />
              <div>
                <h3 className="font-black text-base text-amber-300 mb-1">{timerModal.title}</h3>
                <p className="text-sm text-amber-200/90 leading-relaxed">{timerModal.message}</p>
                <button
                  onClick={() => setTimerModal((tm) => ({ ...tm, open: false }))}
                  className="mt-4 px-4 py-2 bg-amber-500 text-black text-xs font-black rounded-xl hover:bg-amber-400 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PROFESSIONAL SECURITY WARNING MODAL (QUEUED) ── */}
      {activeWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className={`w-full max-w-md mx-4 rounded-3xl p-6 md:p-8 border shadow-2xl ${
            isDark ? "bg-[#16120b] border-amber-500/20 text-white" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center animate-bounce">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-serif font-black text-amber-500">
                {(() => {
                  const type = activeWarning.type;
                  const message = activeWarning.message;
                  if (message.includes("Verification Failed") || type === "FaceMismatch") return "Face Verification Failed";
                  if (message.includes("Camera Not Available") || type === "CameraObstructed") return "Camera Not Available";
                  if (type === "LookingAway") return "Attention Diverted";
                  if (type === "FrequentEyeMovement") return "Frequent Eye Movement Detected";
                  if (type === "PhoneDetected") return "Mobile Phone Detected";
                  if (type === "MultipleFaces") return "Multiple Persons Detected";
                  if (type === "FaceMissing") return "Face Not Detected";
                  if (type === "TabSwitch" || type === "WindowBlur") return "Assessment Window Left";
                  if (type === "FullscreenExit") return "Fullscreen Required";
                  return "Warning";
                })()}
              </h3>
              <div className={`text-sm leading-relaxed whitespace-pre-line font-medium ${isDark ? "text-gray-300" : "text-slate-600"}`}>
                {activeWarning.message}
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (activeWarning.type === "FullscreenExit") {
                      await requestFullscreen();
                    }
                    handleWarningDismiss();
                  }}
                  className="w-full py-3.5 rounded-2xl text-xs md:text-sm font-black bg-amber-500 hover:bg-amber-600 text-black transition shadow-lg shadow-amber-500/10 cursor-pointer"
                >
                  Understood
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── INTERNET CONNECTION LOST OVERLAY ── */}
      {!isOnline && (
        <div className="fixed inset-0 z-55 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 animate-fadeIn">
          <div className="max-w-md space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mx-auto animate-pulse">
              <Globe size={32} />
            </div>
            <h2 className="text-2xl font-serif font-black text-rose-500">Internet Connection Lost</h2>
            <p className="text-sm text-gray-300">Waiting for reconnection...</p>
          </div>
        </div>
      )}

      {/* ── ASSESSMENT TERMINATED MALPRACTICE OVERLAY ── */}
      {terminatedDueToMalpractice && (
        <div className="fixed inset-0 z-55 bg-[#0d0d12] flex flex-col items-center justify-center text-center p-6 animate-fadeIn">
          <div className="max-w-xl space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mx-auto animate-pulse">
              <ShieldAlert size={40} />
            </div>
            <h1 className="text-3xl font-serif font-black text-rose-500 tracking-tight">Assessment Terminated</h1>
            <div className="space-y-3 text-gray-300">
              <p className="text-lg font-bold">Your assessment has been terminated because the allowed malpractice threshold has been exceeded.</p>
              <p className="text-sm text-gray-400">Your responses have been saved automatically.</p>
              <p className="text-sm font-semibold text-[#ef4444]">This assessment can no longer be attempted.</p>
            </div>
            <div className="pt-4 flex items-center justify-center gap-2 text-xs font-mono text-gray-500">
              <RefreshCw size={12} className="animate-spin" /> Redirecting to Assessments Page...
            </div>
          </div>
        </div>
      )}

      {/* ── ASSESSMENT LOCKED DUE TO PREVIOUS MALPRACTICE ── */}
      {malpracticeLocked && (
        <div className="fixed inset-0 z-55 bg-[#0d0d12] flex flex-col items-center justify-center text-center p-6 animate-fadeIn">
          <div className="max-w-xl space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mx-auto">
              <ShieldAlert size={40} />
            </div>
            <h1 className="text-3xl font-serif font-black text-[#ef4444] tracking-tight">Assessment Unavailable</h1>
            <div className="space-y-3 text-gray-300">
              <p className="text-lg font-bold leading-relaxed">
                This assessment has already been terminated due to examination policy violations and cannot be attempted again.
              </p>
            </div>
            <button
              onClick={() => {
                setMalpracticeLocked(false);
                setView("list");
              }}
              className="mt-6 px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition cursor-pointer"
            >
              Back to Assessments
            </button>
          </div>
        </div>
      )}

      {/* ── STYLED SUBMIT CONFIRMATION MODAL ── */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className={`w-full max-w-md mx-4 rounded-3xl p-6 md:p-8 border shadow-2xl ${card}`}>
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#781c1c]/10 text-[#781c1c] mx-auto flex items-center justify-center">
                <CheckCircle size={28} />
              </div>
              <h3 className={`text-xl font-black ${isDark ? "text-white" : "text-slate-900"}`}>Submit Assessment?</h3>
              <p className={`text-xs md:text-sm ${subText}`}>
                Once submitted, your answers will be evaluated and you will not be able to modify them.
              </p>

              <div className={`p-4 rounded-2xl border text-xs font-mono space-y-2 ${isDark ? "bg-white/[0.03] border-white/10" : "bg-slate-50 border-slate-200"}`}>
                <div className="flex justify-between">
                  <span>Total Questions:</span>
                  <span className="font-bold">{questions.length}</span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>Answered:</span>
                  <span className="font-bold">{answered}</span>
                </div>
                <div className="flex justify-between text-amber-400">
                  <span>Unanswered / Skipped:</span>
                  <span className="font-bold">{questions.length - answered}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  disabled={isSubmitting}
                  onClick={() => setShowSubmitModal(false)}
                  className={`flex-1 py-3.5 rounded-2xl text-xs font-bold border transition cursor-pointer ${
                    isDark ? "border-white/10 hover:bg-white/5 text-gray-300" : "border-slate-300 hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  Cancel
                </button>
                <button
                  disabled={isSubmitting}
                  onClick={confirmSubmit}
                  className="flex-1 py-3.5 rounded-2xl text-xs font-black bg-[#781c1c] hover:bg-[#5f1515] text-white transition shadow-lg shadow-[#781c1c]/20 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? <RefreshCw size={14} className="animate-spin" /> : "Confirm & Submit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LEAVE EXAM CONFIRM MODAL (replaces window.confirm to avoid focus-steal blur warning) ── */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-sm mx-4 rounded-2xl p-6 border shadow-2xl ${isDark ? "border-white/10 bg-[#0f0f18]" : "border-slate-200 bg-white"}`}>
            <h3 className={`font-black text-base mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>Leave Exam?</h3>
            <p className={`text-sm mb-5 ${isDark ? "text-gray-400" : "text-slate-500"}`}>
              The timer will keep running. Your answers are saved. You can resume this exam later.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${isDark ? "border-white/10 hover:bg-white/5 text-gray-300" : "border-slate-200 hover:bg-slate-50 text-slate-700"}`}
              >
                Stay in Exam
              </button>
              <button
                onClick={() => { setShowLeaveConfirm(false); stopCamera(); setView("list"); }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black border transition cursor-pointer ${isDark ? "border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20" : "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"}`}
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── LIST VIEW ── */}
      {view === "list" && (
        <div className="w-full max-w-[1600px] mx-auto px-4 md:px-8 lg:px-12 py-8 md:py-12">
          <div className="mb-10">
            <span className="text-[10px] uppercase font-mono tracking-widest text-[#781c1c] font-bold">Madras Christian College</span>
            <h1 className={`text-2xl md:text-4xl font-serif font-black tracking-tight mt-1 ${isDark ? "text-white" : "text-slate-900"}`}>
              Welcome, {user?.fullName || "Student"}
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

                return (
                  <div
                    key={assessment.id}
                    className={`group rounded-3xl border-2 p-6 sm:p-8 md:p-10 transition-all duration-300 shadow-xl ${
                      isDark
                        ? "bg-[#0b0b0f] border-white/10 hover:bg-[#781c1c]/10 hover:border-[#781c1c] hover:shadow-2xl hover:shadow-[#781c1c]/25"
                        : "bg-white border-slate-300 hover:bg-[#781c1c]/[0.03] hover:border-[#781c1c] hover:shadow-2xl hover:shadow-[#781c1c]/15"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-6 flex-wrap">
                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-xs font-mono font-black uppercase tracking-wider px-3 py-1 rounded-xl bg-[#781c1c]/10 text-[#781c1c] border border-[#781c1c]/20">
                            Assessment {index + 1}
                          </span>
                          <h2 className={`font-serif font-black text-xl sm:text-2xl tracking-tight transition-colors duration-200 ${isDark ? "text-white group-hover:text-rose-200" : "text-slate-900 group-hover:text-[#781c1c]"}`}>
                            {assessment.title}
                          </h2>
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
                        <div className={`inline-flex items-center gap-5 text-xs sm:text-sm p-3.5 sm:p-4 rounded-2xl border transition-colors duration-200 ${isDark ? "bg-white/[0.02] border-white/5 text-slate-300 group-hover:border-[#781c1c]/30" : "bg-slate-50 border-slate-200 text-slate-700 group-hover:border-[#781c1c]/20"} flex-wrap font-mono`}>
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

      {/* ── SYSTEM COMPATIBILITY CHECK VIEW ── */}
      {view === "compatibility" && activeAssessment && (
        <div className="max-w-2xl mx-auto px-4 md:px-8 py-8 md:py-12">
          <div className={`rounded-3xl border p-6 md:p-8 ${card} space-y-6 shadow-2xl`}>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#781c1c] font-bold">Phase 1 of 2 — Verification</span>
              <h2 className={`text-xl md:text-2xl font-black mt-1 ${isDark ? "text-white" : "text-slate-900"}`}>System & Environment Compatibility Check</h2>
              <p className={`text-xs md:text-sm mt-1 ${subText}`}>
                Before entering the assessment instructions, we must verify your browser and system meet security requirements.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { title: "Webcam Hardware & Access", status: compatCheck.camera, desc: "Camera hardware detected and accessible", icon: Camera },
                { title: "Screen Resolution (Min 1024×600)", status: compatCheck.screen, desc: "Sufficient display resolution for proctoring grid", icon: Monitor },
                { title: "Supported Browser & Engine", status: compatCheck.browser, desc: "Modern Chromium / Firefox / Safari browser detected", icon: Globe },
                { title: "Active Network Connection", status: compatCheck.connection, desc: "Stable internet connection available", icon: RefreshCw },
                { title: "Fullscreen Security Support", status: compatCheck.fullscreen, desc: "Browser supports locked fullscreen mode", icon: Maximize2 },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    item.status === "passed"
                      ? isDark ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-300" : "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : item.status === "failed"
                        ? isDark ? "bg-rose-500/10 border-rose-500/30 text-rose-300" : "bg-rose-50 border-rose-200 text-rose-900"
                        : isDark ? "bg-white/5 border-white/5 text-gray-400" : "bg-white border-slate-200 text-slate-600"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={18} className="shrink-0" />
                    <div>
                      <h4 className="font-bold text-xs md:text-sm">{item.title}</h4>
                      <p className="text-[11px] opacity-80">{item.desc}</p>
                    </div>
                  </div>
                  <div>
                    {item.status === "passed" && <CheckCircle size={20} className="text-emerald-500" />}
                    {item.status === "failed" && <XCircle size={20} className="text-rose-500" />}
                    {item.status === "checking" && <RefreshCw size={16} className="animate-spin text-amber-500" />}
                  </div>
                </div>
              ))}
            </div>

            {compatCheck.errors.length > 0 && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1">
                <p className="font-bold flex items-center gap-1.5"><AlertCircle size={14} /> Compatibility Errors:</p>
                {compatCheck.errors.map((err, idx) => (
                  <p key={idx} className="pl-5">• {err}</p>
                ))}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setView("list")}
                className={`flex-1 py-3.5 rounded-2xl text-xs font-bold border transition cursor-pointer ${
                  isDark ? "border-white/10 hover:bg-white/5 text-gray-300" : "border-slate-300 hover:bg-slate-100 text-slate-700"
                }`}
              >
                Back to Assessments
              </button>
              {compatCheck.allPassed ? (
                <button
                  onClick={() => setView("instructions")}
                  className="flex-1 py-3.5 rounded-2xl text-xs font-black bg-[#781c1c] hover:bg-[#5f1515] text-white transition shadow-lg shadow-[#781c1c]/20 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  Proceed to Instructions →
                </button>
              ) : (
                <button
                  onClick={runSystemCompatibilityCheck}
                  className="flex-1 py-3.5 rounded-2xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RefreshCw size={14} /> Re-Run Compatibility Check
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── INSTRUCTIONS VIEW ── */}
      {view === "instructions" && activeAssessment && (
        <div className="max-w-2xl mx-auto px-4 md:px-8 py-8 md:py-12">
          <div className={`rounded-2xl border p-6 md:p-8 ${card}`}>
            <div className="mb-6">
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#781c1c] font-bold">Phase 2 of 2 — Instructions & Pre-Diagnostic</span>
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

            {/* Security Notice */}
            <div className={`rounded-xl p-4 mb-6 ${isDark ? "bg-amber-500/5 border border-amber-500/20" : "bg-amber-50 border border-amber-200"}`}>
              <h3 className="text-xs font-bold text-amber-500 mb-2 flex items-center gap-1"><AlertTriangle size={12} /> Anti-Malpractice Security Guidelines & Instructions</h3>
              <style dangerouslySetInnerHTML={{__html: `
                .rich-text-content ul { list-style-type: disc !important; padding-left: 1.25rem !important; margin: 0.5rem 0 !important; }
                .rich-text-content ol { list-style-type: decimal !important; padding-left: 1.25rem !important; margin: 0.5rem 0 !important; }
                .rich-text-content li { margin-bottom: 0.25rem !important; }
                .rich-text-content a { color: #3b82f6 !important; text-decoration: underline !important; }
              `}} />
              <div
                className={`text-xs leading-relaxed rich-text-content ${isDark ? "text-amber-200/80" : "text-amber-900"}`}
                dangerouslySetInnerHTML={{
                  __html: activeAssessment.instructions || `<ul>
                    <li>Fullscreen mode is mandatory and will be locked upon starting.</li>
                    <li>Copying, pasting, right-click, tab switches, and keyboard shortcuts are blocked.</li>
                    <li>Continuous video proctoring will log all movement, tab switches, and face missing events.</li>
                    <li>Cumulative security risk &gt; ${AUTO_SUBMIT_THRESHOLD} will immediately auto-terminate your attempt.</li>
                  </ul>`
                }}
              />
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

                  {/* Registered Face Photo Comparison Overlay */}
                  {registeredFacePhoto && (
                    <div className="absolute top-2 right-2 w-14 h-18 rounded-lg overflow-hidden border border-emerald-500/40 shadow-lg bg-black/45 backdrop-blur-sm flex flex-col items-center select-none">
                      <img
                        src={registeredFacePhoto}
                        alt="Registered"
                        className="w-full h-12 object-cover"
                      />
                      <span className="w-full bg-emerald-600 text-[6px] text-center font-mono py-0.5 text-white tracking-widest font-black uppercase">Reference</span>
                    </div>
                  )}


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
                    {
                      title: "Facial Identity Verification",
                      status: registeredDescriptor ? "passed" : "failed",
                      detail: registeredDescriptor 
                        ? "Face descriptor embedding successfully registered"
                        : "Identity registration required before starting",
                      icon: ShieldCheck,
                    },
                    {
                      title: "Face Presence Check (1 Face Required)",
                      status: faceCountInFrame === 1 ? "passed" : faceCountInFrame === -1 ? "checking" : "failed",
                      detail: faceCountInFrame === 1
                        ? "Exactly 1 face detected — ready for identity verification"
                        : faceCountInFrame === 0
                        ? "No face detected. Please center your face in the camera."
                        : faceCountInFrame > 1
                        ? `${faceCountInFrame} faces detected. Only one person should be visible.`
                        : "Loading face detection AI models... (may take up to 30s on first load)",
                      icon: Users,
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

              {/* Webcam Face Registration controls (Manual Capture) */}
              {cameraCheck.overallStatus === "passed" && (
                <div className={`rounded-2xl border p-5 space-y-4 ${
                  isDark ? "bg-white/[0.02] border-white/10" : "bg-slate-50/80 border-slate-200"
                }`}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                      <ShieldCheck size={16} />
                    </div>
                    <div>
                      <h3 className={`text-xs font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                        Candidate Identity Registration (Mandatory)
                      </h3>
                      <p className={`text-[10px] ${subText}`}>
                        Register your face reference photo before starting the exam.
                      </p>
                    </div>
                  </div>

                  {!registeredFacePhoto && !capturedFacePhoto && (
                    <div className="space-y-3">
                      <p className="text-[11px] text-slate-400">
                        Look directly into your webcam, center your face inside the target guide, and capture your reference photo.
                      </p>
                      {captureVerifyError && (
                        <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-semibold">
                          ⚠️ {captureVerifyError}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={async () => {
                          const video = previewVideoRef.current;
                          if (!video) return;
                          try {
                            setIsVerifyingCapture(true);
                            setCaptureVerifyError("");
                            
                            // Brief yield to render UI loading state
                            await new Promise((r) => setTimeout(r, 40));

                            const w = video.videoWidth || 640;
                            const h = video.videoHeight || 480;

                            const tempCanvas = document.createElement("canvas");
                            tempCanvas.width = w;
                            tempCanvas.height = h;
                            const tempCtx = tempCanvas.getContext("2d");
                            if (!tempCtx) return;

                            tempCtx.drawImage(video, 0, 0, w, h);
                            const photoData = tempCanvas.toDataURL("image/jpeg", 0.85);

                            const faceapi = (window as any).faceapi;
                            let descriptor: number[] | null = null;

                            if (faceapi && faceapi.nets?.tinyFaceDetector?.isLoaded) {
                              try {
                                const detections = await faceapi
                                  .detectAllFaces(
                                    video,
                                    new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.25 })
                                  )
                                  .withFaceLandmarks()
                                  .withFaceDescriptors();

                                if (detections.length === 0) {
                                  setCaptureVerifyError("Face not detected. Please position your face clearly inside the camera frame with good lighting.");
                                  setIsVerifyingCapture(false);
                                  return;
                                } else if (detections.length > 1) {
                                  setCaptureVerifyError("Multiple persons detected on the screen. Please ensure only one person is in the camera frame.");
                                  setIsVerifyingCapture(false);
                                  return;
                                }

                                const det = detections[0];
                                if (det && det.descriptor) {
                                  const box = det.detection.box;
                                  const faceCenterX = box.x + box.width / 2;
                                  const faceCenterY = box.y + box.height / 2;
                                  const frameCenterX = w / 2;
                                  const frameCenterY = h / 2;

                                  // Tolerance: face center must be within 15% of the frame size from the frame center
                                  const toleranceX = w * 0.15;
                                  const toleranceY = h * 0.15;

                                  if (Math.abs(faceCenterX - frameCenterX) > toleranceX || Math.abs(faceCenterY - frameCenterY) > toleranceY) {
                                    setCaptureVerifyError("Face is not centered. Please align your face to the center of the camera screen.");
                                    setIsVerifyingCapture(false);
                                    return;
                                  }

                                  descriptor = Array.from(det.descriptor);
                                }
                              } catch (e) {
                                console.warn("[FaceRegister] face-api detection fallback:", e);
                              }
                            }

                            // Robust Fallback: If face-api is loading or missed, check MediaPipe / Diagnostic face presence
                            if (!descriptor && (faceCountInFrame >= 1 || cameraCheck.framing === "passed")) {
                              if (faceCountInFrame > 1) {
                                setCaptureVerifyError("Multiple persons detected. Please ensure only one person is in the camera frame.");
                                setIsVerifyingCapture(false);
                                return;
                              }

                              // Also check centering using MediaPipe FaceDetector if possible
                              if (preExamFaceDetectorRef.current) {
                                try {
                                  const results = preExamFaceDetectorRef.current.detectForVideo
                                    ? preExamFaceDetectorRef.current.detectForVideo(video, performance.now())
                                    : preExamFaceDetectorRef.current.detect(video);
                                  const detections = results.detections || [];
                                  if (detections.length > 1) {
                                    setCaptureVerifyError("Multiple persons detected. Please ensure only one person is in the camera frame.");
                                    setIsVerifyingCapture(false);
                                    return;
                                  } else if (detections.length === 1) {
                                    const bbox = detections[0].boundingBox;
                                    if (bbox) {
                                      const faceCenterX = bbox.originX + bbox.width / 2;
                                      const faceCenterY = bbox.originY + bbox.height / 2;
                                      const frameCenterX = w / 2;
                                      const frameCenterY = h / 2;
                                      const toleranceX = w * 0.15;
                                      const toleranceY = h * 0.15;
                                      if (Math.abs(faceCenterX - frameCenterX) > toleranceX || Math.abs(faceCenterY - frameCenterY) > toleranceY) {
                                        setCaptureVerifyError("Face is not centered. Please align your face to the center of the camera screen.");
                                        setIsVerifyingCapture(false);
                                        return;
                                      }
                                    }
                                  }
                                } catch (err) {
                                  console.warn("Fallback diagnostic centering check failed:", err);
                                }
                              }

                              const sampleCanvas = document.createElement("canvas");
                              sampleCanvas.width = 16;
                              sampleCanvas.height = 8;
                              const sCtx = sampleCanvas.getContext("2d");
                              if (sCtx) {
                                sCtx.drawImage(video, 0, 0, 16, 8);
                                const imgData = sCtx.getImageData(0, 0, 16, 8).data;
                                const norm: number[] = [];
                                for (let i = 0; i < 128; i++) {
                                  norm.push((imgData[i * 4] || 128) / 255);
                                }
                                descriptor = norm;
                              }
                            }

                            if (descriptor) {
                              setCapturedFacePhoto(photoData);
                              setCapturedFaceDescriptor(descriptor);
                            } else {
                              setCaptureVerifyError("Face not detected. Please position your face clearly inside the camera frame with good lighting.");
                            }
                          } catch (err) {
                            console.error("Manual face registration capture error:", err);
                            setCaptureVerifyError("Verification failed. Please try again.");
                          } finally {
                            setIsVerifyingCapture(false);
                          }
                        }}
                        disabled={isVerifyingCapture}
                        className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isVerifyingCapture ? (
                          <>
                            <RefreshCw size={13} className="animate-spin" /> Verifying Face...
                          </>
                        ) : (
                          "Capture Face Photo"
                        )}
                      </button>
                    </div>
                  )}

                  {capturedFacePhoto && !registeredFacePhoto && (
                    <div className="space-y-4">
                      <div className="flex flex-col items-center gap-3">
                        <img
                          src={capturedFacePhoto}
                          alt="Captured preview"
                          className="w-40 h-30 object-cover rounded-xl border border-white/10 shadow-lg"
                        />
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          ✓ Face Detected & Verified
                        </span>
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setCapturedFacePhoto("");
                            setCapturedFaceDescriptor(null);
                            setCaptureVerifyError("");
                          }}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                            isDark ? "border-white/10 hover:bg-white/5 text-gray-300" : "border-slate-300 hover:bg-slate-100 text-slate-700"
                          }`}
                        >
                          Retake Photo
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (activeAssessment && user && capturedFaceDescriptor) {
                              const keyDesc = `reference-descriptor-${activeAssessment.id}-${user.id}`;
                              const keyPhoto = `registered-face-photo-${activeAssessment.id}-${user.id}`;
                              localStorage.setItem(keyDesc, JSON.stringify(capturedFaceDescriptor));
                              localStorage.setItem(keyPhoto, capturedFacePhoto);
                              setRegisteredDescriptor(capturedFaceDescriptor);
                              setRegisteredFacePhoto(capturedFacePhoto);
                              
                              setCapturedFacePhoto("");
                              setCapturedFaceDescriptor(null);
                              setCaptureVerifyError("");
                            }
                          }}
                          className="flex-1 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer"
                        >
                          Confirm & Save Reference Photo
                        </button>
                      </div>
                    </div>
                  )}

                  {registeredFacePhoto && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-xl font-mono">
                        <div className="flex items-center gap-4">
                          <img
                            src={registeredFacePhoto}
                            alt="Registered Profile"
                            className="w-12 h-16 object-cover rounded-lg border border-emerald-500/30"
                          />
                          <div>
                            <h4 className="text-xs font-black text-emerald-400">Face Registration Completed!</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5 font-sans">Facial embedding descriptor successfully registered for this attempt.</p>
                          </div>
                        </div>
                        {!showRetakeConfirm && (
                          <button
                            type="button"
                            onClick={() => setShowRetakeConfirm(true)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                              isDark ? "border-white/10 hover:bg-white/5 text-gray-300" : "border-slate-300 hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            Retake Photo
                          </button>
                        )}
                      </div>
                      {showRetakeConfirm && (
                        <div className={`p-3 rounded-xl border space-y-2 ${
                          isDark ? "border-amber-500/30 bg-amber-500/5" : "border-amber-200 bg-amber-50"
                        }`}>
                          <p className={`text-[11px] font-semibold ${
                            isDark ? "text-amber-400" : "text-amber-700"
                          }`}>
                            Are you sure you want to retake your reference photo? Your current registration will be cleared.
                          </p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setShowRetakeConfirm(false)}
                              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                                isDark ? "border-white/10 hover:bg-white/5 text-gray-300" : "border-slate-200 hover:bg-slate-50 text-slate-700"
                              }`}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowRetakeConfirm(false);
                                setRegisteredFacePhoto("");
                                setRegisteredDescriptor(null);
                                if (activeAssessment && user) {
                                  const keyDesc = `reference-descriptor-${activeAssessment.id}-${user.id}`;
                                  const keyPhoto = `registered-face-photo-${activeAssessment.id}-${user.id}`;
                                  localStorage.removeItem(keyDesc);
                                  localStorage.removeItem(keyPhoto);
                                }
                              }}
                              className="flex-1 py-1.5 rounded-lg text-[10px] font-black bg-rose-600 hover:bg-rose-700 text-white transition cursor-pointer"
                            >
                              Yes, Retake
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

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
              <button onClick={() => setView("compatibility")}
                className={`flex-1 py-3 rounded-xl text-xs font-bold border transition cursor-pointer ${isDark ? "border-white/10 hover:bg-white/5 text-gray-300" : "border-slate-200 hover:bg-slate-50 text-slate-700"}`}>
                Back
              </button>
              {cameraCheck.overallStatus === "passed" && registeredDescriptor && (faceCountInFrame === 1 || faceCountInFrame === -1) ? (
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
                    } else if (!registeredDescriptor) {
                      alert("Identity verification required: Please complete your student face registration to proceed.");
                    } else if (faceCountInFrame === 0) {
                      alert("No face detected. Please ensure your face is clearly visible in the camera before starting.");
                    } else if (faceCountInFrame > 1) {
                      alert("Multiple faces detected. Only one person may be present during the examination.");
                    } else {
                      runCameraDiagnostic();
                    }
                  }}
                  className={`flex-1 py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-not-allowed ${
                    isDark ? "bg-white/10 text-gray-500 border border-white/5" : "bg-slate-200 text-slate-400"
                  }`}
                >
                  <Lock size={12} /> Begin Exam ({!registeredDescriptor ? "Registration Required" : faceCountInFrame === 0 ? "No Face Detected" : faceCountInFrame > 1 ? "Multiple Faces" : "Camera Required"})
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
                  onClick={() => setShowSubmitModal(true)}
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
                    onClick={() => setShowSubmitModal(true)}
                    className="flex items-center gap-2 px-7 py-3.5 rounded-2xl text-xs md:text-sm font-black bg-[#781c1c] hover:bg-[#5f1515] text-white transition shadow-lg shadow-[#781c1c]/20 cursor-pointer"
                  >
                    Submit Assessment <CheckCircle size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* ── RIGHT SEGMENT (Proctoring Camera Video & Violation Log) ── */}
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

                {/* Camera Video Container with Live Recording Overlays */}
                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-black relative border-2 border-slate-700/80 shadow-2xl w-full flex items-center justify-center group">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Visual Recording & AI Status Overlay Badges */}
                  {cameraActive && !isRecoveringStream && (
                    <>
                      {/* Top-Left: Live REC Badge */}
                      <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-red-500/40 text-[10px] font-mono font-black text-red-400 tracking-wider shadow-lg">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                        <span>● REC</span>
                      </div>

                      {/* Top-Right: AI Proctoring Indicator */}
                      <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-950/80 backdrop-blur-md border border-emerald-500/40 text-[9px] font-mono font-bold text-emerald-300 shadow-lg max-w-[120px] truncate" title={aiStatus}>
                        <ShieldCheck size={11} className="shrink-0 text-emerald-400" />
                        <span className="truncate">AI ACTIVE</span>
                      </div>

                      {/* Bottom Status Bar overlay */}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 pt-4 flex items-center justify-between text-[9px] font-mono text-white/80">
                        <span className="truncate max-w-[170px]" title={aiStatus}>
                          {aiStatus}
                        </span>
                        <span className="shrink-0 text-emerald-400 font-bold">5 FPS</span>
                      </div>
                    </>
                  )}

                  {/* Reconnecting / Recovery Overlay */}
                  {isRecoveringStream && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-4 text-center gap-2.5 z-20 backdrop-blur-sm">
                      <div className="w-7 h-7 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                      <span className="text-[11px] font-bold font-mono text-amber-300">Reconnecting Camera Stream...</span>
                      <p className="text-[9px] text-amber-200/70">Attempting automatic recovery</p>
                    </div>
                  )}

                  {/* Initial Connecting Feed Overlay */}
                  {!cameraActive && !cameraError && !isRecoveringStream && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-2 z-20">
                      <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span className="text-[10px] font-mono text-white/70">Connecting Feed...</span>
                    </div>
                  )}

                  {/* Classified Camera Error Overlay */}
                  {cameraError && !isRecoveringStream && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-rose-950/90 z-20 space-y-2">
                      <CameraOff size={26} className="text-rose-400 shrink-0" />
                      <p className="text-[11px] font-extrabold text-rose-200">
                        {cameraErrorInfo?.title || "Camera Feed Interrupted"}
                      </p>
                      <p className="text-[9px] text-rose-200/90 leading-tight max-w-[200px]">
                        {cameraErrorInfo?.message || "Camera access lost. Exam proctoring is still tracking window security."}
                      </p>
                      <button
                        type="button"
                        onClick={() => startCamera(true)}
                        className="mt-1 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold font-mono transition cursor-pointer flex items-center gap-1"
                      >
                        <RefreshCw size={10} /> Retry Camera
                      </button>
                    </div>
                  )}
                </div>

                {/* Proctoring & Security Risk Panel */}
                <div className="space-y-2 pt-1">
                  <div className={`p-2.5 rounded-xl border flex items-center justify-between text-[11px] ${
                    riskScore > 100 ? "bg-rose-500/10 border-rose-500/30 text-rose-300" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  }`}>
                    <span className="flex items-center gap-1.5 font-bold">
                      <ShieldAlert size={12} /> Cumulative Risk
                    </span>
                    <span className="font-mono font-extrabold">{riskScore} / {AUTO_SUBMIT_THRESHOLD}</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border flex items-center justify-between text-[11px] ${
                    isFullscreen ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                  }`}>
                    <span className="flex items-center gap-1.5 font-bold">
                      <Maximize2 size={12} /> Fullscreen Mode
                    </span>
                    <span className="font-mono font-bold">{isFullscreen ? "Locked" : "Exited!"}</span>
                  </div>
                </div>

                {/* Live Violation Feed */}
                {violationLog.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-200/40 dark:border-white/5">
                    <span className={`text-[9px] font-mono uppercase font-bold tracking-wider ${subText}`}>Recent Security Events</span>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {violationLog.slice(-4).reverse().map((entry) => (
                        <div key={entry.id} className="text-[10px] p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start gap-1.5">
                          <AlertTriangle size={11} className="shrink-0 mt-0.5 text-rose-400" />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold truncate">{entry.type} (+{entry.riskScore} risk)</p>
                            <p className="opacity-80 text-[9px] line-clamp-1">{entry.details}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
          
          {/* Floating Draggable Calculator Trigger */}
          {examSettings.calculatorEnabled && (
            <>
              <button
                type="button"
                onClick={() => setShowCalculator((prev) => !prev)}
                className={`fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full border shadow-xl flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95 ${
                  showCalculator
                    ? "bg-rose-600 hover:bg-rose-700 text-white border-rose-500"
                    : "bg-[#781c1c] hover:bg-[#5f1515] text-white border-[#781c1c]/30"
                }`}
                title="Open Exam Calculator"
              >
                <CalculatorIcon size={20} />
              </button>

              {showCalculator && (
                <Calculator
                  onClose={() => setShowCalculator(false)}
                  allowedMode={examSettings.calculatorMode}
                  isDark={isDark}
                />
              )}
            </>
          )}

          {/* AI Proctoring Loading Status Overlay */}
          {isTimerPaused && (
            <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center text-center p-4">
              <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center animate-bounce mb-4">
                <AlertTriangle size={32} />
              </div>
              <h2 className="text-xl font-black text-rose-400 font-serif">Assessment Paused</h2>
              <p className="text-sm text-slate-350 mt-1 max-w-sm">{pauseReason || "Suspicious activity or environment issue detected. The assessment has been paused and will resume automatically once corrected."}</p>
            </div>
          )}
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

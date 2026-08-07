"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import api from "@/services/api";
import { useTheme } from "@/hooks/useTheme";
import { 
  ArrowLeft, BookOpen, AlertTriangle, Play, CheckCircle, 
  ChevronLeft, ChevronRight, RefreshCw, Sparkles, LogOut, Video, VideoOff,
  Calculator as CalculatorIcon, Camera, CameraOff, Lock, ShieldCheck, Eye,
  Lightbulb, Monitor, Globe, Maximize2, XCircle, AlertCircle
} from "lucide-react";
import Calculator from "@/components/Calculator";
import { ExamRiskEngine, ViolationType } from "@/utils/examRiskEngine";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TakeAssessmentPage({ params }: PageProps) {
  const router = useRouter();
  const { id: assessmentIdStr } = use(params);
  const assessmentId = parseInt(assessmentIdStr);
  const [themeMode] = useTheme();

  // Loading States
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Core Data States
  const [assessment, setAssessment] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [attempt, setAttempt] = useState<any>(null);
  
  // Custom states/refs for AI Proctoring & Calculator enhancements
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
  const objectDetectorRef = useRef<any>(null);
  const faceAbsentSeconds = useRef(0);
  const phoneDetectedSeconds = useRef(0);
  
  // Camera check and precheck verification states
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

  const [profileFaceKeypoints, setProfileFaceKeypoints] = useState<any[] | null>(null);
  const [profileFaceLoading, setProfileFaceLoading] = useState(false);
  const [profileFaceError, setProfileFaceError] = useState("");
  const [registeredFace, setRegisteredFace] = useState("");
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [faceVerified, setFaceVerified] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Advanced face registration states
  const [registrationProgress, setRegistrationProgress] = useState(0);
  const [registrationActive, setRegistrationActive] = useState(false);
  const [registeredDescriptor, setRegisteredDescriptor] = useState<number[] | null>(null);
  const [registeredFacePhoto, setRegisteredFacePhoto] = useState("");
  const [identityMatchScore, setIdentityMatchScore] = useState<number | null>(null);
  const [pauseReason, setPauseReason] = useState("");
  const identityMismatchCountRef = useRef(0);
  const multipleFacesCountRef = useRef(0);
  const proctorTicks = useRef(0);
  
  // MCQ Progress States
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Webcam & Proctoring States
  const [webcamActive, setWebcamActive] = useState(false);
  const [proctoringLoaded, setProctoringLoaded] = useState(false);
  const [warningsCount, setWarningsCount] = useState(0);
  const [proctoringMessage, setProctoringMessage] = useState("");
  const [proctoringStatus, setProctoringStatus] = useState<"initializing" | "running" | "warning" | "error" | "off">("off");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const proctoringLoopRef = useRef<number | null>(null);
  const faceDetectorRef = useRef<any>(null);
  const violationCounterRef = useRef<Record<string, number>>({
    NO_FACE: 0,
    MULTIPLE_FACES: 0,
    LOOKING_AWAY: 0,
    HEAD_TILT: 0
  });

  // Eye Movement Gaze History Refs
  const lookingAwayStateHistory = useRef<boolean[]>([]);
  const eyeMovementWarningTicksRef = useRef(0);

  // Risk Engine
  const riskEngineRef = useRef<ExamRiskEngine | null>(null);
  const [riskScore, setRiskScore] = useState(0);

  // Result Summary
  const [result, setResult] = useState<any>(null);

  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsTimerPaused(false);
      setPauseReason("");
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsTimerPaused(true);
      setPauseReason("Internet Connection Lost\n\nWaiting for reconnection...");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    loadAssessment();
    return () => {
      stopTimer();
      stopProctoring();
      stopInstructionsPreview();
    };
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await api.get("/Users/me");
        setUser(res.data);
      } catch (err) {
        console.error("Failed to load user profile:", err);
      }
    };
    loadProfile();
  }, []);

  // Load saved reference face descriptor on start/refresh
  useEffect(() => {
    if (assessmentId) {
      const savedDescriptor = localStorage.getItem("reference-descriptor-" + assessmentId);
      const savedPhoto = localStorage.getItem("registered-face-photo-" + assessmentId);
      if (savedDescriptor) {
        setRegisteredDescriptor(JSON.parse(savedDescriptor));
      }
      if (savedPhoto) {
        setRegisteredFacePhoto(savedPhoto);
      }
    }
  }, [assessmentId]);

  useEffect(() => {
    examSettingsRef.current = examSettings;
  }, [examSettings]);

  useEffect(() => {
    isTimerPausedRef.current = isTimerPaused;
  }, [isTimerPaused]);

  // Geometric similarity math and face detection for preview diagnostics
  const calculateFaceSimilarity = (keypoints1: any[], keypoints2: any[]): number => {
    if (keypoints1.length < 6 || keypoints2.length < 6) return 0;
    const nose1 = keypoints1[2];
    const nose2 = keypoints2[2];
    const centered1 = keypoints1.map(kp => ({ x: kp.x - nose1.x, y: kp.y - nose1.y }));
    const centered2 = keypoints2.map(kp => ({ x: kp.x - nose2.x, y: kp.y - nose2.y }));
    const eyeDist1 = Math.sqrt(Math.pow(centered1[0].x - centered1[1].x, 2) + Math.pow(centered1[0].y - centered1[1].y, 2));
    const eyeDist2 = Math.sqrt(Math.pow(centered2[0].x - centered2[1].x, 2) + Math.pow(centered2[0].y - centered2[1].y, 2));
    if (eyeDist1 === 0 || eyeDist2 === 0) return 0;
    const norm1 = centered1.map(kp => ({ x: kp.x / eyeDist1, y: kp.y / eyeDist1 }));
    const norm2 = centered2.map(kp => ({ x: kp.x / eyeDist2, y: kp.y / eyeDist2 }));
    let totalDist = 0;
    for (let i = 0; i < 6; i++) {
      totalDist += Math.sqrt(Math.pow(norm1[i].x - norm2[i].x, 2) + Math.pow(norm1[i].y - norm2[i].y, 2));
    }
    const avgDist = totalDist / 6;
    const similarity = Math.max(0, Math.min(100, Math.round((1 - avgDist / 0.40) * 100)));
    return similarity;
  };

  const detectProfileFace = async (url: string) => {
    if (!url) return;
    setProfileFaceLoading(true);
    setProfileFaceError("");
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = url;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error("Failed to load profile image"));
      });
      const canvas = document.createElement("canvas");
      canvas.width = img.width || 300;
      canvas.height = img.height || 300;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        let checks = 0;
        while (!faceDetectorRef.current && checks < 20) {
          await new Promise(resolve => setTimeout(resolve, 250));
          checks++;
        }

        if (faceDetectorRef.current) {
          const results = faceDetectorRef.current.detect(canvas);
          const detections = results.detections || [];
          if (detections.length > 0) {
            setProfileFaceKeypoints(detections[0].keypoints || []);
            setFaceVerified(false);
            console.log("[Verification] Profile face landmarks loaded successfully!");
          } else {
            setProfileFaceError("No face detected in profile photo.");
            setFaceVerified(true);
          }
        } else {
          setProfileFaceError("Face detection AI model not loaded.");
          setFaceVerified(true);
        }
      }
    } catch (e: any) {
      console.warn("CORS or image load error, trying bypass", e);
      setProfileFaceError("Could not process profile image (loading error).");
      setFaceVerified(true);
    } finally {
      setProfileFaceLoading(false);
    }
  };

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
      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = stream;
        try {
          await previewVideoRef.current.play();
        } catch (e) {
          console.warn(e);
        }
      }
      sampleDiagnosticFrame();
    } catch (err: any) {
      let msg = "Camera permissions denied or webcam hardware unavailable. Please allow camera access in your browser settings to proceed.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        msg = "Camera permission was denied. Please click the camera/lock icon in your browser address bar and select 'Allow'.";
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
    }
  };

  const sampleDiagnosticFrame = () => {
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
      setCameraCheck(prev => ({
        ...prev,
        framing: "failed",
        overallStatus: "failed",
        errorMessage: "Webcam video feed is inactive or frozen. Please click 'Re-Test Camera Setup'.",
      }));
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

        const isSkinTone = r > 48 && g > 28 && b > 18 && r > g && (r - g) >= 8 && (r - b) >= 12 && Math.abs(g - b) <= 36;
        if (isSkinTone) {
          totalFacePixels++;
          sumFaceX += x;
          if (x >= 18 && x <= 46 && y >= 6 && y <= 42) {
            centerTargetFacePixels++;
          }
        }
      }
    }

    const avgLuminance = totalPixels > 0 ? totalLuminance / totalPixels : 0;
    const brightnessPercentage = Math.round((avgLuminance / 255) * 100);

    let lightingPassed = true;
    let lightingErr = "";
    if (avgLuminance < 25) {
      lightingPassed = false;
      lightingErr = "Room environment is too dark (" + brightnessPercentage + "% brightness). Please turn on room lights.";
    } else if (avgLuminance > 245) {
      lightingPassed = false;
      lightingErr = "Excessive direct glare detected (" + brightnessPercentage + "%). Please adjust light positioning.";
    }

    const w = video.videoWidth || 320;
    const h = video.videoHeight || 240;
    const resPassed = w >= 320 && h >= 240;
    const resText = "" + w + "x" + h;

    let totalVarianceSum = 0;
    for (let p of allPixels) {
      totalVarianceSum += Math.abs(p - avgLuminance);
    }
    const frameVariance = allPixels.length > 0 ? totalVarianceSum / allPixels.length : 0;

    let framingPassed = true;
    let framingErr = "";
    const centroidX = totalFacePixels > 0 ? sumFaceX / totalFacePixels : 32;
    const centerRatio = totalFacePixels > 0 ? centerTargetFacePixels / totalFacePixels : 0;

    if (frameVariance < 1.8) {
      framingPassed = false;
      framingErr = "Webcam lens appears covered or video feed is obscured.";
    } else if (totalFacePixels < 30 || centerTargetFacePixels < 18) {
      framingPassed = false;
      framingErr = "Face not detected in camera frame. Please position yourself directly in front of the camera.";
    } else if (centroidX < 23 || centroidX > 41 || centerRatio < 0.50) {
      framingPassed = false;
      framingErr = "Face is shifted off-center. Please align your face inside the target circle.";
    }

    const allPassed = resPassed && lightingPassed && framingPassed;
    let finalError = "";
    if (!resPassed) finalError = "Resolution (" + resText + ") below requirement.";
    else if (!lightingPassed) finalError = lightingErr;
    else if (!framingPassed) finalError = framingErr;

    setCameraCheck({
      permission: "passed",
      lighting: lightingPassed ? "passed" : "failed",
      resolution: resPassed ? "passed" : "failed",
      framing: framingPassed ? "passed" : "failed",
      brightnessValue: brightnessPercentage,
      resolutionText: resText,
      overallStatus: allPassed ? "passed" : "failed",
      errorMessage: finalError,
    });

    if (faceDetectorRef.current) {
      try {
        const results = faceDetectorRef.current.detect(video);
        const detections = results.detections || [];
        if (detections.length > 0) {
          const webcamFace = detections[0];
          const snapCanvas = document.createElement("canvas");
          snapCanvas.width = 160;
          snapCanvas.height = 120;
          const snapCtx = snapCanvas.getContext("2d");
          if (snapCtx) {
            snapCtx.drawImage(video, 0, 0, 160, 120);
            const faceData = snapCanvas.toDataURL("image/jpeg", 0.6);
            setRegisteredFace(faceData);
            localStorage.setItem("registered-face-" + assessmentId, faceData);
          }

          if (profileFaceKeypoints && profileFaceKeypoints.length >= 6) {
            const similarity = calculateFaceSimilarity(profileFaceKeypoints, webcamFace.keypoints || []);
            setMatchScore(similarity);
            if (similarity >= 60) {
              setFaceVerified(true);
            } else {
              setFaceVerified(false);
            }
          } else {
            setFaceVerified(true);
          }
        }
      } catch (err) {
        console.error("Diagnostic face tracking error:", err);
      }
    }
  };

  // Real-time camera pre-diagnostic checker for dashboard assessment instructions view
  useEffect(() => {
    let diagnosticInterval: NodeJS.Timeout | null = null;
    if (!attempt && assessment) {
      runCameraDiagnostic();
      diagnosticInterval = setInterval(() => {
        sampleDiagnosticFrame();
      }, 400);
    }
    return () => {
      if (diagnosticInterval) clearInterval(diagnosticInterval);
    };
  }, [attempt, assessment, profileFaceKeypoints]);

  // Load vision libraries and profile image face landmarks
  useEffect(() => {
    if (!attempt && assessment) {
      const initAI = async () => {
        // Load tasks-vision library if not loaded
        if (!(window as any).FilesetResolver || !(window as any).FaceDetector) {
          try {
            await new Promise<void>((resolve, reject) => {
              const wasmScript = document.createElement("script");
              wasmScript.src = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm/vision_bundle.js";
              wasmScript.async = true;
              wasmScript.onload = () => resolve();
              wasmScript.onerror = (err) => reject(err);
              document.body.appendChild(wasmScript);
            });
            const vision = await (window as any).FilesetResolver.forVisionTasks(
              "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
            );
            faceDetectorRef.current = await (window as any).FaceDetector.createFromOptions(vision, {
              baseOptions: {
                modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
                delegate: "GPU"
              },
              runningMode: "VIDEO"
            });
          } catch (e) {
            console.error("Failed to load preview vision library", e);
          }
        }
        if (user?.profileImageUrl) {
          detectProfileFace(user.profileImageUrl);
        } else {
          setFaceVerified(true);
        }
      };
      initAI();
    }
  }, [attempt, assessment, user]);

  const loadAssessment = async () => {
    setLoading(true);
    try {
      // 1. Fetch details
      const res = await api.get(`/Assessments/${assessmentId}`);
      setAssessment(res.data);
      
      // Load configurations from localStorage
      const savedSettings = localStorage.getItem(`assessment-settings-${assessmentId}`);
      const settings = savedSettings ? JSON.parse(savedSettings) : {
        calculatorEnabled: true,
        calculatorMode: "Basic",
        faceMissingTimeout: 5,
        pauseTimerOnFaceMissing: false,
        objectDetectionEnabled: true
      };
      setExamSettings(settings);
      examSettingsRef.current = settings;

      // 2. Fetch existing attempt status
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const student = JSON.parse(userStr);
        // We will fetch student assessments list to check attempt
        const listRes = await api.get("/Assessments/student");
        const match = listRes.data.find((a: any) => a.id === assessmentId);
        if (match && match.attempt) {
          setAttempt(match.attempt);
          if (match.attempt.isSubmitted) {
            setResult(match.attempt);
          } else {
            // Attempt is in progress, resume it
            await resumeAttempt(match.attempt.id);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load assessment details", err);
    } finally {
      setLoading(false);
    }
  };

  const stopInstructionsPreview = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const startAttempt = async () => {
    stopInstructionsPreview();
    setStarting(true);
    try {
      const res = await api.post("/Assessments/attempts", { assessmentId });
      setAttempt(res.data);
      
      // Load questions
      const qRes = await api.get(`/Assessments/${assessmentId}/questions`);
      setQuestions(qRes.data || []);
      
      // Initialize timer
      const elapsedMs = Date.now() - new Date(res.data.startTime).getTime();
      const totalMs = assessment.duration * 60 * 1000;
      const initialRemaining = Math.max(0, Math.floor((totalMs - elapsedMs) / 1000));
      setTimeLeft(initialRemaining);
      startTimer();

      // Start Webcam and Proctoring
      await startWebcamAndProctoring();
    } catch (err) {
      console.error("Failed to start attempt", err);
      alert("Error starting test attempt. Please check that you are inside the active test window.");
    } finally {
      setStarting(false);
    }
  };

  const resumeAttempt = async (attemptId: number) => {
    try {
      const statusRes = await api.get(`/Assessments/attempts/${attemptId}`);
      setAttempt(statusRes.data);
      
      const qRes = await api.get(`/Assessments/${assessmentId}/questions`);
      setQuestions(qRes.data || []);
      
      setTimeLeft(statusRes.data.remainingSeconds);
      startTimer();

      // Restore any previously answered questions if we track them
      const savedAnswers: Record<string, string> = {};
      if (statusRes.data.studentAnswers) {
        statusRes.data.studentAnswers.forEach((ans: any) => {
          if (ans.SelectedAnswer) {
            savedAnswers[ans.QuestionId.toString()] = ans.SelectedAnswer;
          }
        });
        setAnswers(savedAnswers);
      }

      await startWebcamAndProctoring();
    } catch (err) {
      console.error("Failed to resume attempt", err);
    }
  };

  const startTimer = () => {
    stopTimer();
    timerRef.current = setInterval(() => {
      if (isTimerPausedRef.current) return; // skip countdown if timer is paused
      setTimeLeft((prev) => {
        if (prev <= 1) {
          stopTimer();
          autoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const selectOption = (questionId: number, option: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId.toString()]: option
    }));
  };

  const clearOption = (questionId: number) => {
    const updated = { ...answers };
    delete updated[questionId.toString()];
    setAnswers(updated);
  };

  const submitTest = async (isAuto = false) => {
    if (!isAuto && !confirm("Are you sure you want to submit your assessment? You cannot modify your answers after submitting.")) return;
    
    stopTimer();
    stopProctoring();
    setSubmitting(true);

    try {
      const payload = { answers };
      const res = await api.post(`/Assessments/attempts/${attempt.id}`, payload);
      setResult(res.data);
      setAttempt((prev: any) => ({ ...prev, isSubmitted: true }));
    } catch (err) {
      console.error("Error submitting test", err);
      alert("Submission error. Please contact your administrator.");
    } finally {
      setSubmitting(false);
    }
  };

  const autoSubmit = () => {
    alert("Test duration expired! Your answers are being submitted automatically.");
    submitTest(true);
  };

  // ── PROCTORING & WEBCAM LOGIC ─────────────────────────────────────────
  const startWebcamAndProctoring = async () => {
    setProctoringStatus("initializing");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 320, height: 240, frameRate: 15 }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setWebcamActive(true);
      }
      
      // Load vision library
      await loadMediaPipeVision();
    } catch (err) {
      console.error("Webcam access failed", err);
      setProctoringStatus("error");
      setProctoringMessage("Webcam access required for exam proctoring.");
    }
  };

  // Load face-api.js script and models dynamically
  const loadFaceApiModels = async () => {
    if ((window as any).faceapi && (window as any).faceapi.nets.tinyFaceDetector.isLoaded) {
      return;
    }

    if (!(window as any).faceapi) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/dist/face-api.js";
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load face-api.js"));
        document.body.appendChild(script);
      });
    }

    const faceapi = (window as any).faceapi;
    const modelUrl = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model/";

    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl),
      faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl),
      faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl)
    ]);
    console.log("[Identity] face-api.js models loaded successfully!");
  };

  // Pre-assessment Face Registration Loop (Captures 8 frames, extracts descriptors, chooses best)
  const startFaceRegistration = async () => {
    if (registrationActive || !previewVideoRef.current) return;
    setRegistrationActive(true);
    setRegistrationProgress(0);

    try {
      await loadFaceApiModels();
    } catch (err) {
      alert("Failed to load face verification models. Check connection.");
      setRegistrationActive(false);
      return;
    }

    const faceapi = (window as any).faceapi;
    const video = previewVideoRef.current;
    const descriptorsList: any[] = [];
    const framesList: string[] = [];
    const scoresList: number[] = [];

    let capturedCount = 0;
    const interval = setInterval(async () => {
      if (capturedCount >= 8) {
        clearInterval(interval);
        if (descriptorsList.length > 0) {
          let bestIdx = 0;
          let maxScore = -1;
          for (let i = 0; i < scoresList.length; i++) {
            if (scoresList[i] > maxScore) {
              maxScore = scoresList[i];
              bestIdx = i;
            }
          }
          const bestDescriptor = descriptorsList[bestIdx];
          const bestPhoto = framesList[bestIdx];

          setRegisteredDescriptor(Array.from(bestDescriptor));
          setRegisteredFacePhoto(bestPhoto);
          localStorage.setItem("reference-descriptor-" + assessmentId, JSON.stringify(Array.from(bestDescriptor)));
          localStorage.setItem("registered-face-photo-" + assessmentId, bestPhoto);
          setRegistrationProgress(100);
        } else {
          alert("Face not detected. Adjust lighting and stay in center of frame, then retry.");
        }
        setRegistrationActive(false);
        return;
      }

      try {
        const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.3 }))
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          descriptorsList.push(detection.descriptor);
          scoresList.push(detection.detection.score);

          const snapCanvas = document.createElement("canvas");
          snapCanvas.width = 160;
          snapCanvas.height = 120;
          const snapCtx = snapCanvas.getContext("2d");
          if (snapCtx) {
            snapCtx.drawImage(video, 0, 0, 160, 120);
            framesList.push(snapCanvas.toDataURL("image/jpeg", 0.6));
          }
          capturedCount++;
          setRegistrationProgress(Math.round((capturedCount / 8) * 100));
        }
      } catch (e) {
        console.warn("Capture tick warning:", e);
      }
    }, 400);
  };

  const loadMediaPipeVision = async () => {
    try {
      const settings = examSettingsRef.current;
      
      // Load face-api models
      await loadFaceApiModels();

      // Load TensorFlow and COCO-SSD if enabled
      if (settings.objectDetectionEnabled && !(window as any).cocoSsd) {
        await new Promise<void>((resolve, reject) => {
          const tfScript = document.createElement("script");
          tfScript.src = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.17.0/dist/tf.min.js";
          tfScript.async = true;
          tfScript.onload = () => {
            const cocoScript = document.createElement("script");
            cocoScript.src = "https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js";
            cocoScript.async = true;
            cocoScript.onload = () => resolve();
            cocoScript.onerror = (err) => reject(err);
            document.body.appendChild(cocoScript);
          };
          tfScript.onerror = (err) => reject(err);
          document.body.appendChild(tfScript);
        });
      }

      await initFaceDetector();
    } catch (err) {
      console.error("Failed to load proctoring engines", err);
      setProctoringStatus("error");
    }
  };

  const initFaceDetector = async () => {
    try {
      const settings = examSettingsRef.current;
      
      if (settings.objectDetectionEnabled && (window as any).cocoSsd) {
        objectDetectorRef.current = await (window as any).cocoSsd.load();
      }

      riskEngineRef.current = new ExamRiskEngine(
        (entry) => {
          setRiskScore(riskEngineRef.current?.getCumulativeRisk() || 0);
        },
        async (log) => {
          stopTimer();
          stopProctoring();
          setAttempt((prev: any) => ({ ...prev, status: "MALPRACTICE_TERMINATED", isSubmitted: true }));
          const nextWarning = warningsCount + 1;
          setWarningsCount(nextWarning);
          try {
            await api.post(`/Assessments/attempts/${attempt.id}/warnings`, {
              warningNumber: nextWarning,
              warningType: "AdditionalPerson",
              eventInfo: "Malpractice threshold reached (100 points exceeded). Assessment auto-terminated.",
              currentAnswers: answers,
              forceTerminate: true
            });
          } catch (err) {
            console.error("Malpractice auto-submit warning log failed:", err);
          }
          alert("Assessment Terminated! Your malpractice score has reached the threshold of 100 points. Your responses have been saved.");
        }
      );

      setProctoringLoaded(true);
      setProctoringStatus("running");
      
      // Start proctoring loop
      startProctoringLoop();
    } catch (err) {
      console.error("Error starting proctoring loop", err);
      setProctoringStatus("error");
    }
  };

  const startProctoringLoop = () => {
    let lastCheckTime = Date.now();

    const processFrame = async () => {
      if (!videoRef.current) {
        proctoringLoopRef.current = requestAnimationFrame(processFrame);
        return;
      }

      const nowTime = Date.now();
      const settings = examSettingsRef.current;
      const faceapi = (window as any).faceapi;

      // Only run face/object analysis every 400ms to conserve client resources
      if (nowTime - lastCheckTime > 400 && videoRef.current.readyState >= 2) {
        lastCheckTime = nowTime;
        
        proctorTicks.current = (proctorTicks.current + 1) % 60;
        // Object detection runs on every 2nd tick (every 800ms)
        const isObjectCheckTick = (proctorTicks.current % 2 === 0);

        try {
          // Face checks run on every 400ms tick for absolute responsiveness
          if (faceapi) {
            const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.3 }))
              .withFaceLandmarks()
              .withFaceDescriptors();
            
            evaluateProctoringRules(detections);
          }

          // Object Detection (Mobile / Tablet) (every 800ms)
          if (settings.objectDetectionEnabled && objectDetectorRef.current && isObjectCheckTick) {
            const predictions = await objectDetectorRef.current.detect(videoRef.current);
            const device = predictions.find((p: any) => 
              (p.class === "cell phone" || p.class === "phone" || p.class === "remote" || p.class === "tablet" || p.class === "laptop" || p.class === "book") && 
              p.score > 0.25 &&
              Math.max(p.bbox[2], p.bbox[3]) > 25
            );
            if (device) {
              phoneDetectedSeconds.current += 1;
              if (phoneDetectedSeconds.current >= 3) { // ~3 ticks (2.4s continuous)
                triggerWarningJSON("PhoneDetected", {
                  text: "Mobile Phone Detected. Mobile phones are not permitted during the examination.",
                  duration: "Continuous",
                  confidence: `${Math.round(device.score * 100)}%`,
                  screenshot: captureScreenshot()
                });
                if (phoneDetectedSeconds.current >= (settings.faceMissingTimeout * 2.5 / 2)) {
                  setIsTimerPaused(true);
                  setPauseReason("Mobile Phone Detected. Mobile phones are not permitted during the examination.");
                }
              }
            } else {
              phoneDetectedSeconds.current = 0;
              if (isTimerPausedRef.current && pauseReason.includes("Mobile phone detected")) {
                setIsTimerPaused(false);
                setPauseReason("");
              }
            }
          }
        } catch (err) {
          console.error("Face/Object detection loop error", err);
        }
      }

      proctoringLoopRef.current = requestAnimationFrame(processFrame);
    };

    proctoringLoopRef.current = requestAnimationFrame(processFrame);
  };

  const evaluateProctoringRules = (detectionsResult: any[]) => {
    const counts = detectionsResult.length;
    const settings = examSettingsRef.current;
    const faceapi = (window as any).faceapi;

    let activeViolation: "NO_FACE" | "MULTIPLE_FACES" | "LOOKING_AWAY" | "HEAD_TILT" | null = null;
    let details = "";
    const faceAbsentTicksLimit = settings.faceMissingTimeout * 2.5; // Timeout in 400ms ticks

    // Face Absent
    if (counts === 0) {
      multipleFacesCountRef.current = 0;
      faceAbsentSeconds.current += 1;
      if (faceAbsentSeconds.current >= faceAbsentTicksLimit) {
        if (settings.pauseTimerOnFaceMissing && !isTimerPausedRef.current) {
          setIsTimerPaused(true);
          setPauseReason("Face Not Detected. Please return to the camera view.");
        }
        if (Math.floor(faceAbsentSeconds.current) % 12 === 0) {
          triggerWarningJSON("NO_FACE", {
            text: "Face Not Detected. Please return to the camera view.",
            duration: `${Math.round(faceAbsentSeconds.current * 0.4)} seconds`,
            confidence: "0%",
            screenshot: captureScreenshot()
          });
        }
      }
    } 
    // Multiple Faces
    else if (counts > 1) {
      faceAbsentSeconds.current = 0;
      multipleFacesCountRef.current += 1;
      if (multipleFacesCountRef.current >= 3) { // ~1.2 seconds continuous
        triggerWarningJSON("MULTIPLE_FACES", {
          text: "Another person has been detected. Only the registered candidate should be visible.",
          duration: "Continuous",
          confidence: "High",
          screenshot: captureScreenshot()
        });
        if (multipleFacesCountRef.current >= faceAbsentTicksLimit) {
          setIsTimerPaused(true);
          setPauseReason("Another person has been detected. Only the registered candidate should be visible.");
        }
      }
    } 
    // Single Normal Face
    else {
      faceAbsentSeconds.current = 0;
      multipleFacesCountRef.current = 0;

      const webcamFace = detectionsResult[0];

      // Embedding matching verification
      if (registeredDescriptor) {
        const dist = faceapi.euclideanDistance(webcamFace.descriptor, new Float32Array(registeredDescriptor));
        const match = Math.max(0, Math.min(100, Math.round((1 - (dist / 1.5)) * 100)));
        setIdentityMatchScore(match);

        if (match < 60) {
          identityMismatchCountRef.current += 1;
          if (identityMismatchCountRef.current >= 4) { // ~1.6 seconds continuous
            triggerWarningJSON("NO_FACE", {
              text: "Identity mismatch detected. Please ensure the registered candidate is taking the examination.",
              duration: "Continuous",
              confidence: `${match}%`,
              screenshot: captureScreenshot()
            });
            if (identityMismatchCountRef.current >= faceAbsentTicksLimit) {
              setIsTimerPaused(true);
              setPauseReason("Identity mismatch detected. Please ensure the registered candidate is taking the examination.");
            }
          }
        } else {
          identityMismatchCountRef.current = 0;
          if (isTimerPausedRef.current && (pauseReason.includes("Identity mismatch") || pauseReason.includes("face is missing") || pauseReason.includes("Another person"))) {
            setIsTimerPaused(false);
            setPauseReason("");
          }
        }
      } else {
        if (isTimerPausedRef.current && (pauseReason.includes("face is missing") || pauseReason.includes("Another person"))) {
          setIsTimerPaused(false);
          setPauseReason("");
        }
      }

      // 68 landmarks posture mapping
      const landmarks = webcamFace.landmarks.positions;
      if (landmarks && landmarks.length >= 68) {
        const leftEye = landmarks[36];
        const rightEye = landmarks[45];
        const nose = landmarks[30];
        const leftEar = landmarks[0];
        const rightEar = landmarks[16];

        const dY = leftEye.y - rightEye.y;
        const dX = leftEye.x - rightEye.x;
        const angle = Math.abs(Math.atan2(dY, dX) * (180 / Math.PI));

        const distLeft = Math.abs(nose.x - leftEar.x);
        const distRight = Math.abs(nose.x - rightEar.x);
        const totalDist = distLeft + distRight;
        const symmetryRatio = totalDist > 0 ? distLeft / totalDist : 0.5;

        // Pitch check: vertical ratio
        const eyesMidY = (leftEye.y + rightEye.y) / 2;
        const chin = landmarks[8];
        const noseToEyes = nose.y - eyesMidY;
        const noseToChin = chin.y - nose.y;
        const verticalRatio = noseToChin > 0 ? noseToEyes / noseToChin : 1.0;

        // Eye aspect ratio (EAR) calculation for eye closure tracking (blink/squint/closed eyes)
        const dist = (p1: any, p2: any) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
        const earLeft = (dist(landmarks[37], landmarks[41]) + dist(landmarks[38], landmarks[40])) / (2 * dist(landmarks[36], landmarks[39]));
        const earRight = (dist(landmarks[43], landmarks[47]) + dist(landmarks[44], landmarks[46])) / (2 * dist(landmarks[42], landmarks[45]));
        const avgEar = (earLeft + earRight) / 2;

        if (angle > 15) {
          activeViolation = "HEAD_TILT";
          details = `Excessive head tilt detected (${angle.toFixed(1)}°).`;
        } else if (symmetryRatio < 0.35 || symmetryRatio > 0.65 || verticalRatio < 0.60 || verticalRatio > 1.40 || avgEar < 0.18) {
          activeViolation = "LOOKING_AWAY";
          details = avgEar < 0.18 
            ? `Closed or obscured eyes detected (eye aspect ratio: ${avgEar.toFixed(2)}).`
            : `Looking away from screen (nose symmetry ratio: ${symmetryRatio.toFixed(2)}, vertical: ${verticalRatio.toFixed(2)}).`;
        }

        // Eye Movement Monitoring: Gaze history transition tracking
        const isLookingAway = (symmetryRatio < 0.35 || symmetryRatio > 0.65 || verticalRatio < 0.60 || verticalRatio > 1.40 || avgEar < 0.18);
        lookingAwayStateHistory.current.push(isLookingAway);
        if (lookingAwayStateHistory.current.length > 25) {
          lookingAwayStateHistory.current.shift();
        }

        let attentionTransitions = 0;
        for (let i = 1; i < lookingAwayStateHistory.current.length; i++) {
          if (lookingAwayStateHistory.current[i] !== lookingAwayStateHistory.current[i - 1]) {
            attentionTransitions++;
          }
        }

        if (attentionTransitions >= 4) {
          eyeMovementWarningTicksRef.current += 1;
          if (eyeMovementWarningTicksRef.current >= 8) { // ~3 seconds of confirmed pattern
            eyeMovementWarningTicksRef.current = 0;
            triggerWarning("FrequentEyeMovement", "Suspicious Eye Movement Detected. Looking away from the screen repeatedly is prohibited. Please keep your focus on the test.");
          }
        } else {
          eyeMovementWarningTicksRef.current = Math.max(0, eyeMovementWarningTicksRef.current - 1);
        }
      }
    }

    // Decay / increment posture violation counts (Limit 12 checks ~5 seconds for natural lookaway)
    if (activeViolation === "LOOKING_AWAY" || activeViolation === "HEAD_TILT") {
      const limit = activeViolation === "LOOKING_AWAY" ? 12 : 6;
      const counters = violationCounterRef.current;
      const k = activeViolation === "LOOKING_AWAY" ? "LOOKING_AWAY" : "HEAD_TILT";
      counters[k] = (counters[k] || 0) + 1;
      if (counters[k] >= limit) {
        counters[k] = 0;
        triggerWarning(activeViolation, details);
      }
    } else {
      if (violationCounterRef.current) {
        violationCounterRef.current.LOOKING_AWAY = Math.max(0, (violationCounterRef.current.LOOKING_AWAY || 0) - 1);
        violationCounterRef.current.HEAD_TILT = Math.max(0, (violationCounterRef.current.HEAD_TILT || 0) - 1);
      }
    }
  };

  // Screenshot capture utility
  const captureScreenshot = (): string => {
    if (!videoRef.current) return "";
    try {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 320;
      canvas.height = videoRef.current.videoHeight || 240;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/jpeg", 0.55);
      }
    } catch (e) {
      console.error(e);
    }
    return "";
  };

  const triggerWarningJSON = async (type: string, data: { text: string; duration: string; screenshot: string; confidence?: string }) => {
    const detailsJSON = JSON.stringify(data);
    triggerWarning(type, detailsJSON);
  };

  const getMappedViolationType = (type: string): ViolationType => {
    if (type === "NO_FACE") return "FaceMissing";
    if (type === "HEAD_TILT") return "LookingAway";
    if (type === "MULTIPLE_FACES") return "MultipleFaces";
    if (type === "LOOKING_AWAY") return "LookingAway";
    return type as ViolationType;
  };

  const triggerWarning = async (type: string, details: string) => {
    if (riskEngineRef.current) {
      const entry = riskEngineRef.current.logViolation(getMappedViolationType(type), details, 1.0);
      if (!entry) return;
    }

    const nextWarning = warningsCount + 1;
    setWarningsCount(nextWarning);
    
    let displayDetails = details;
    try {
      if (details.startsWith("{")) {
        const parsed = JSON.parse(details);
        displayDetails = parsed.text;
      }
    } catch (e) {}

    // Play alert sound or make browser speak
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const speech = new SpeechSynthesisUtterance(`Warning ${nextWarning}. ${displayDetails}`);
      window.speechSynthesis.speak(speech);
    }

    try {
      // Send warning to backend
      await api.post(`/Assessments/attempts/${attempt.id}/warnings`, {
        warningNumber: nextWarning,
        warningType: type,
        eventInfo: details,
        currentAnswers: answers // Pass current answers so far to save them
      });
    } catch (err) {
      console.error("Failed to log warning to backend", err);
    }
  };

  const stopProctoring = () => {
    if (proctoringLoopRef.current) cancelAnimationFrame(proctoringLoopRef.current);
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
    }
    setWebcamActive(false);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [
      h > 0 ? h.toString().padStart(2, "0") : null,
      m.toString().padStart(2, "0"),
      s.toString().padStart(2, "0")
    ].filter(Boolean).join(":");
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0d0d12] text-white">
        <RefreshCw size={32} className="animate-spin text-[#781c1c] mb-3" />
        <span className="text-xs text-slate-450 font-mono uppercase tracking-widest">Loading exam assets...</span>
      </div>
    );
  }

  // ===========================================
  // SCREEN: IMMEDIATELY SHOW RESULTS / MALPRACTICE
  // ===========================================
  if (result || attempt?.status === "MALPRACTICE_TERMINATED" || attempt?.isSubmitted) {
    const isMalpractice = attempt?.status === "MALPRACTICE_TERMINATED" || result?.status === "MALPRACTICE_TERMINATED";
    
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 transition-colors duration-300 ${
        themeMode === "dark" ? "bg-[#0d0d12] text-white" : "bg-[#fcfaf6] text-[#18233c]"
      }`}>
        <div className={`w-full max-w-xl p-8 rounded-3xl border shadow-2xl text-center flex flex-col items-center gap-6 ${
          themeMode === "dark" ? "bg-white/[0.01] border-white/10" : "bg-white border-slate-200"
        }`}>
          {isMalpractice ? (
            <>
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/25 animate-pulse text-red-500">
                <AlertTriangle size={32} />
              </div>
              <h2 className="font-serif font-black text-2xl uppercase text-red-500 tracking-tight">Assessment Terminated</h2>
              <p className="text-sm text-slate-450 leading-relaxed max-w-md font-bold">
                This assessment has already been terminated due to examination policy violations and cannot be attempted again.
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/25 text-emerald-400">
                <CheckCircle size={32} />
              </div>
              <h2 className="font-serif font-black text-2xl uppercase tracking-tight">Assessment Submitted</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Your answers have been securely logged and evaluated.
              </p>

              {result && (
                <div className={`w-full p-6 rounded-2xl border font-mono text-xs text-left space-y-2 mt-2 ${
                  themeMode === "dark" ? "bg-black/40 border-white/5" : "bg-slate-50 border-slate-250"
                }`}>
                  <div className="font-bold text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-200/10 pb-2 mb-2 flex items-center justify-between">
                    <span>Performance Report</span>
                    <span className="text-emerald-400">Score: {result.score} / {assessment.totalMarks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Questions:</span>
                    <span>{result.totalQuestions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Attempted:</span>
                    <span>{result.attemptedQuestions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Unattempted:</span>
                    <span>{result.unattemptedQuestions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Correct Selections:</span>
                    <span className="text-emerald-400 font-bold">{result.correctAnswers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Incorrect Selections:</span>
                    <span className="text-red-400 font-bold">{result.wrongAnswers}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200/10 pt-2 font-bold text-sm">
                    <span>Percentage Obtained:</span>
                    <span className="text-emerald-400">{result.percentage}%</span>
                  </div>
                </div>
              )}
            </>
          )}

          <button
            onClick={() => router.push("/dashboard")}
            className="mt-4 flex items-center gap-2 bg-[#781c1c] hover:bg-[#5f1515] text-white px-6 py-3 rounded-xl text-xs font-bold transition hover:scale-105 active:scale-95 cursor-pointer shadow-md"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ===========================================
  // SCREEN: INSTRUCTIONS & START EXAM
  // ===========================================
  if (!attempt) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 transition-colors duration-300 ${
        themeMode === "dark" ? "bg-[#0d0d12] text-white" : "bg-[#fcfaf6] text-[#18233c]"
      }`}>
        <div className={`w-full max-w-2xl p-8 rounded-3xl border shadow-2xl space-y-6 ${
          themeMode === "dark" ? "bg-white/[0.01] border-white/10" : "bg-white border-slate-200"
        }`}>
          <div className="flex items-center gap-3.5 pb-4 border-b border-slate-200/10">
            <div className="w-10 h-10 rounded-2xl bg-[#781c1c]/10 flex items-center justify-center border border-[#781c1c]/25">
              <BookOpen size={20} className="text-[#781c1c]" />
            </div>
            <div>
              <h2 className="font-serif font-black text-xl uppercase tracking-tight">{assessment?.title}</h2>
              <p className="text-[10px] text-slate-400 mt-0.5">MCQ Assessment instructions page.</p>
            </div>
          </div>

          <div className="space-y-4 text-xs leading-relaxed text-slate-400">
            <div className="grid grid-cols-2 gap-4 border-y border-slate-200/10 py-4 font-mono text-slate-350">
              <div>Exam Duration: <span className="font-bold text-white">{assessment?.duration} Mins</span></div>
              <div>Total Marks: <span className="font-bold text-white">{assessment?.totalMarks} Marks</span></div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[10px]">Instructions:</h4>
              <style dangerouslySetInnerHTML={{__html: `
                .rich-text-content ul { list-style-type: disc !important; padding-left: 1.25rem !important; margin: 0.5rem 0 !important; }
                .rich-text-content ol { list-style-type: decimal !important; padding-left: 1.25rem !important; margin: 0.5rem 0 !important; }
                .rich-text-content li { margin-bottom: 0.25rem !important; }
                .rich-text-content a { color: #3b82f6 !important; text-decoration: underline !important; }
              `}} />
              <div 
                className="rich-text-content text-slate-300 text-xs leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: assessment?.instructions || "No specific instructions provided."
                }}
              />
            </div>

            {/* Webcam pre-check verification UI */}
            <div className={`rounded-2xl border p-5 space-y-4 ${
              themeMode === "dark" ? "bg-white/[0.02] border-white/10" : "bg-slate-50/80 border-slate-200"
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#781c1c]/10 text-[#781c1c] flex items-center justify-center">
                    <Camera size={16} />
                  </div>
                  <div>
                    <h3 className={`text-xs font-bold ${themeMode === "dark" ? "text-white" : "text-slate-900"}`}>
                      Camera & Face Verification Precheck
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={runCameraDiagnostic}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold flex items-center gap-1 border transition cursor-pointer ${
                    themeMode === "dark"
                      ? "border-white/10 bg-white/5 hover:bg-white/10 text-white"
                      : "border-slate-300 bg-white hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <RefreshCw size={11} className={cameraCheck.overallStatus === "checking" ? "animate-spin" : ""} />
                  Re-Test Camera
                </button>
              </div>

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

                  {/* Real-time Match Score overlay */}
                  {identityMatchScore !== null && (
                    <div className="absolute bottom-2 left-2 flex gap-1.5 text-[9px] font-mono font-bold text-white bg-black/75 px-2 py-0.5 rounded-md border border-white/10">
                      <span className={identityMatchScore >= 60 ? "text-emerald-400" : "text-rose-400"}>
                        Match: {identityMatchScore}%
                      </span>
                    </div>
                  )}

                  {/* Bounding overlay */}
                  <div className={`absolute inset-0 border-2 border-dashed rounded-[45%] mx-auto my-3 w-28 h-36 pointer-events-none flex items-center justify-center transition-all duration-300 ${
                    cameraCheck.framing === "passed"
                      ? "border-emerald-400/80 bg-emerald-500/10 shadow-lg"
                      : "border-rose-500/90 bg-rose-500/20 animate-pulse"
                  }`}>
                    <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded-full border shadow ${
                      cameraCheck.framing === "passed" ? "text-emerald-300 bg-black/70 border-emerald-500/30" : "text-rose-300 bg-black/70 border-rose-500/30"
                    }`}>
                      {cameraCheck.framing === "passed" ? "✅ Face Centered" : "❌ Center Face"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-[11px]">
                  {[
                    {
                      title: "Camera Permissions",
                      status: cameraCheck.permission,
                      detail: cameraCheck.permission === "passed" ? "Webcam active" : "Checking webcam access...",
                      icon: Camera,
                    },
                    {
                      title: "Environment Lighting",
                      status: cameraCheck.lighting,
                      detail: cameraCheck.lighting === "passed" ? "Optimal brightness (" + cameraCheck.brightnessValue + "%)" : "Checking lighting...",
                      icon: Lightbulb,
                    },
                    {
                      title: "Face Visibility",
                      status: cameraCheck.framing,
                      detail: cameraCheck.framing === "passed" ? "Face detected" : "Checking face positioning...",
                      icon: Eye,
                    },
                    {
                      title: "Facial Identity Verification",
                      status: registeredDescriptor ? "passed" : registrationActive ? "checking" : "failed",
                      detail: registeredDescriptor 
                        ? "Face descriptor embedding successfully registered"
                        : registrationActive ? "Registering candidate identity... (" + registrationProgress + "%)" : "Identity registration required before starting",
                      icon: ShieldCheck,
                    }
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                        item.status === "passed"
                          ? themeMode === "dark" ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-300" : "bg-emerald-50 border-emerald-200 text-emerald-900"
                          : item.status === "failed"
                            ? themeMode === "dark" ? "bg-rose-500/10 border-rose-500/30 text-rose-300" : "bg-rose-50 border-rose-200 text-rose-900"
                            : themeMode === "dark" ? "bg-white/5 border-white/5 text-gray-400" : "bg-white border-slate-200 text-slate-650"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <item.icon size={13} className="shrink-0" />
                        <div>
                          <p className="font-bold text-[10px] leading-tight">{item.title}</p>
                          <p className="text-[9px] opacity-80">{item.detail}</p>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {item.status === "passed" && <CheckCircle size={14} className="text-emerald-500" />}
                        {item.status === "failed" && <XCircle size={14} className="text-rose-500" />}
                        {item.status === "checking" && <RefreshCw size={12} className="animate-spin text-amber-500" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Webcam Face Registration controls */}
            {cameraCheck.overallStatus === "passed" && (
              <div className={`rounded-2xl border p-5 space-y-4 ${
                themeMode === "dark" ? "bg-white/[0.02] border-white/10" : "bg-slate-50/80 border-slate-200"
              }`}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <h3 className={`text-xs font-bold ${themeMode === "dark" ? "text-white" : "text-slate-900"}`}>
                      Candidate Identity Registration (Mandatory)
                    </h3>
                    <p className="text-[10px] text-slate-450">
                      Register your face descriptor embedding before beginning the exam.
                    </p>
                  </div>
                </div>

                {registrationProgress < 100 ? (
                  <div className="space-y-3">
                    <p className="text-[11px] text-slate-400">
                      Look directly into your webcam and turn your head slightly to register multiple angles.
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={startFaceRegistration}
                        disabled={registrationActive}
                        className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {registrationActive ? "Registering Face..." : "Start Face Registration"}
                      </button>
                      
                      {registrationActive && (
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between text-[9px] font-mono text-slate-400">
                            <span>Capturing...</span>
                            <span>{registrationProgress}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: registrationProgress + "%" }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-xl">
                    {registeredFacePhoto && (
                      <img
                        src={registeredFacePhoto}
                        alt="Registered Profile"
                        className="w-12 h-16 object-cover rounded-lg border border-emerald-500/30"
                      />
                    )}
                    <div>
                      <h4 className="text-xs font-black text-emerald-400">Face Registration Completed!</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Facial embedding descriptor successfully registered for this attempt.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/10">
            <button
              onClick={() => router.push("/dashboard")}
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold border transition active:scale-95 cursor-pointer ${
                themeMode === "dark" ? "bg-white/5 border-white/10 text-slate-300" : "bg-slate-100 border-slate-200 text-slate-700"
              }`}
            >
              Cancel
            </button>
            <button
              onClick={startAttempt}
              disabled={starting || cameraCheck.overallStatus !== "passed" || !registeredDescriptor}
              className="flex items-center gap-2 bg-[#781c1c] hover:bg-[#5f1515] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition hover:scale-105 active:scale-95 cursor-pointer shadow-md disabled:opacity-50"
            >
              {starting ? "Starting exam..." : "Enter Test Screen"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===========================================
  // SCREEN: ACTIVE ASSESSMENT / TEST TAKING
  // ===========================================
  const currentQ = questions[currentIdx];

  return (
    <div className={`h-screen h-[100dvh] overflow-hidden flex flex-col font-sans select-none ${
      themeMode === "dark" ? "bg-[#0d0d12] text-white" : "bg-[#fcfaf6] text-[#18233c]"
    }`}>
      
      {/* TEST SCREEN TOP NAV BANNER */}
      <header className="flex justify-between items-center px-6 py-4 border-b border-slate-250 dark:border-white/5 bg-slate-900/40 dark:bg-black/20 backdrop-blur-md z-40 shrink-0">
        <div className="flex items-center gap-3">
          <BookOpen size={18} className="text-[#781c1c]" />
          <div>
            <h1 className="font-serif font-black text-sm uppercase tracking-tight text-white">{assessment.title}</h1>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Attempt ID: {attempt.id}</div>
          </div>
        </div>

        {/* TIMER & CONTROLS */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[9px] uppercase font-mono tracking-widest text-slate-450">Remaining Time</span>
            <span className={`text-base font-mono font-black ${timeLeft < 180 ? "text-red-400 animate-pulse" : "text-emerald-450"}`}>
              {formatTime(timeLeft)}
            </span>
          </div>

          <button
            onClick={() => submitTest(false)}
            disabled={submitting}
            className="bg-[#781c1c] hover:bg-[#5f1515] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Exam"}
          </button>
        </div>
      </header>

      {/* CORE ASSESSMENT LAYOUT CONTAINER */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* LEFT COLUMN: ACTIVE MCQ DISPLAY */}
        <main className="flex-1 p-6 overflow-y-auto flex flex-col justify-between scrollbar-thin">
          {currentQ ? (
            <div className="max-w-3xl mx-auto w-full space-y-6">
              
              {/* Question Card */}
              <div className={`p-6 border rounded-2xl space-y-4 ${
                themeMode === "dark" ? "bg-white/[0.01] border-white/10" : "bg-white border-slate-200"
              }`}>
                <div className="flex justify-between items-start gap-4">
                  <span className="text-[10px] font-mono uppercase bg-[#781c1c]/10 text-[#781c1c] px-3 py-1 rounded-lg border border-[#781c1c]/15">
                    Question {currentIdx + 1} of {questions.length}
                  </span>
                  <span className="text-[10px] font-mono text-slate-455">
                    [{currentQ.marks} Marks]
                  </span>
                </div>

                <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed mt-2">
                  {currentQ.questionText}
                </p>

                {/* OPTIONS RADIO SELECTORS */}
                <div className="grid grid-cols-1 gap-3 pt-3">
                  {[
                    { key: "A", text: currentQ.optionA },
                    { key: "B", text: currentQ.optionB },
                    { key: "C", text: currentQ.optionC },
                    { key: "D", text: currentQ.optionD }
                  ].map(opt => {
                    const isSelected = answers[currentQ.id.toString()] === opt.key;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => selectOption(currentQ.id, opt.key)}
                        className={`p-4 border rounded-xl text-xs text-left transition duration-200 flex items-center gap-3 cursor-pointer ${
                          isSelected
                            ? "bg-[#781c1c]/10 border-[#781c1c] text-[#781c1c] dark:bg-white/10 dark:border-white dark:text-white font-bold"
                            : themeMode === "dark"
                              ? "bg-slate-900 border-white/5 text-slate-300 hover:bg-white/5 hover:text-white"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center font-bold text-[10px] transition shrink-0 ${
                          isSelected
                            ? "bg-[#781c1c] text-white border-none dark:bg-white dark:text-slate-900"
                            : "border-slate-400"
                        }`}>
                          {opt.key}
                        </div>
                        <span>{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* NAVIGATION BUTTONS BAR */}
              <div className="flex justify-between items-center">
                <button
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx(prev => prev - 1)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 border rounded-xl text-xs font-semibold transition active:scale-95 disabled:opacity-30 cursor-pointer ${
                    themeMode === "dark" ? "bg-white/5 border-white/10 text-slate-300" : "bg-slate-100 border-slate-250 text-slate-700"
                  }`}
                >
                  <ChevronLeft size={14} /> Previous
                </button>

                {answers[currentQ.id.toString()] && (
                  <button
                    onClick={() => clearOption(currentQ.id)}
                    className="text-xs font-semibold text-red-400 underline cursor-pointer"
                  >
                    Clear Response
                  </button>
                )}

                <button
                  disabled={currentIdx === questions.length - 1}
                  onClick={() => setCurrentIdx(prev => prev + 1)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 border rounded-xl text-xs font-semibold transition active:scale-95 disabled:opacity-30 cursor-pointer ${
                    themeMode === "dark" ? "bg-white/5 border-white/10 text-slate-300" : "bg-slate-100 border-slate-250 text-slate-700"
                  }`}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>

            </div>
          ) : (
            <div className="text-center py-20 text-slate-400 text-xs">
              No questions found inside the bank for this test.
            </div>
          )}
          
          {/* PROCTORING SYSTEM ALERTS OVERLAY FOOTER */}
          <footer className="max-w-3xl mx-auto w-full mt-4">
            <div className={`p-4 border rounded-xl flex items-center justify-between gap-4 text-[11px] font-mono leading-relaxed transition ${
              proctoringStatus === "warning"
                ? "bg-red-500/10 border-red-500/20 text-red-300 animate-pulse"
                : themeMode === "dark" ? "bg-white/[0.01] border-white/5 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"
            }`}>
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className={proctoringStatus === "warning" ? "text-red-400" : "text-[#781c1c]"} />
                <span>{proctoringMessage || "System initialization ongoing..."}</span>
              </div>
              {warningsCount > 0 && (
                <div className="px-2.5 py-0.5 rounded bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-bold">
                  Flags: {warningsCount} / 4
                </div>
              )}
            </div>
          </footer>
        </main>

        {/* RIGHT COLUMN: QUESTION GRID PALETTE */}
        <aside className="w-72 border-l border-slate-250 dark:border-white/5 flex flex-col justify-between shrink-0 p-5 bg-slate-900/10 dark:bg-black/10">
          <div className="space-y-4">
            <h3 className="text-xs uppercase font-mono tracking-widest font-black text-slate-400 pb-2 border-b border-slate-200/10">
              Question Palette
            </h3>
            
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = answers[q.id.toString()] !== undefined;
                const isCurrent = idx === currentIdx;
                
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`w-10 h-10 rounded-lg text-xs font-mono font-bold transition flex items-center justify-center border cursor-pointer active:scale-95 ${
                      isCurrent
                        ? "border-[#781c1c] bg-[#781c1c] text-white shadow-md"
                        : isAnswered
                          ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400 dark:bg-emerald-500/20"
                          : themeMode === "dark"
                            ? "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                            : "bg-slate-200 border-slate-350 text-slate-700 hover:bg-slate-300"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* FLOATING WEBCAM PROCTOR MONITOR */}
          <div className="space-y-3 pt-4 border-t border-slate-200/10 shrink-0 flex flex-col items-center">
            <div className="flex justify-between items-center w-full text-[10px] uppercase font-mono tracking-wider text-slate-400">
              <span>Proctor Monitor</span>
              <span className={`w-2.5 h-2.5 rounded-full inline-block ${webcamActive ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
            </div>
            
            <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-slate-200/10 bg-black flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]" // mirrors webcam for natural feel
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none scale-x-[-1]"
              />
              {!webcamActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-slate-500 text-[10px]">
                  <VideoOff size={18} />
                  <span>Webcam Off</span>
                </div>
              )}
            </div>
          </div>

        </aside>

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
              isDark={themeMode === "dark"}
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
          <p className="text-sm text-slate-350 mt-1 max-w-sm whitespace-pre-line">
            {pauseReason || "Your face is missing from the camera frame. The assessment has been paused and will resume automatically once you return to your seat."}
          </p>
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
    </div>
  );
}

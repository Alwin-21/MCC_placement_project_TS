"use client";

import { useEffect, useState, useRef, use } from "react";
import api from "@/services/api";
import { useTheme } from "@/hooks/useTheme";
import { 
  ArrowLeft, BookOpen, AlertTriangle, Play, CheckCircle, 
  ChevronLeft, ChevronRight, RefreshCw, Sparkles, LogOut, Video, VideoOff
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TakeAssessmentPage({ params }: PageProps) {
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

  // Result Summary
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    loadAssessment();
    return () => {
      stopTimer();
      stopProctoring();
    };
  }, []);

  const loadAssessment = async () => {
    setLoading(true);
    try {
      // 1. Fetch details
      const res = await api.get(`/Assessments/${assessmentId}`);
      setAssessment(res.data);

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

  const startAttempt = async () => {
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

  const loadMediaPipeVision = async () => {
    try {
      // Check if FilesetResolver is available on window
      if (!(window as any).FilesetResolver || !(window as any).FaceDetector) {
        const wasmScript = document.createElement("script");
        wasmScript.src = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm/vision_bundle.js";
        wasmScript.async = true;
        wasmScript.onload = async () => {
          await initFaceDetector();
        };
        document.body.appendChild(wasmScript);
      } else {
        await initFaceDetector();
      }
    } catch (err) {
      console.error("Failed to load MediaPipe tasks-vision", err);
      setProctoringStatus("error");
    }
  };

  const initFaceDetector = async () => {
    try {
      const vision = await (window as any).FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
      );
      
      const detector = await (window as any).FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
          delegate: "GPU"
        },
        runningMode: "VIDEO"
      });

      faceDetectorRef.current = detector;
      setProctoringLoaded(true);
      setProctoringStatus("running");
      
      // Start proctoring loop
      startProctoringLoop();
    } catch (err) {
      console.error("Error creating BlazeFace detector", err);
      setProctoringStatus("error");
    }
  };

  const startProctoringLoop = () => {
    let lastCheckTime = Date.now();

    const processFrame = async () => {
      if (!videoRef.current || !faceDetectorRef.current) {
        proctoringLoopRef.current = requestAnimationFrame(processFrame);
        return;
      }

      const nowTime = Date.now();
      // Only run face detection analysis every 400ms to conserve client resources
      if (nowTime - lastCheckTime > 400 && videoRef.current.readyState >= 2) {
        lastCheckTime = nowTime;
        
        try {
          const detections = faceDetectorRef.current.detectForVideo(videoRef.current, nowTime);
          evaluateProctoringRules(detections);
        } catch (err) {
          console.error("Face detection loop error", err);
        }
      }

      proctoringLoopRef.current = requestAnimationFrame(processFrame);
    };

    proctoringLoopRef.current = requestAnimationFrame(processFrame);
  };

  const evaluateProctoringRules = (resultData: any) => {
    const detections = resultData.detections || [];
    const counts = detections.length;

    let activeViolation: "NO_FACE" | "MULTIPLE_FACES" | "LOOKING_AWAY" | "HEAD_TILT" | null = null;
    let details = "";

    if (counts === 0) {
      activeViolation = "NO_FACE";
      details = "Face not detected in frame.";
    } else if (counts > 1) {
      activeViolation = "MULTIPLE_FACES";
      details = `Detected ${counts} faces in proctoring feed.`;
    } else {
      // Analyze single face orientation
      const face = detections[0];
      const bbox = face.boundingBox; // { originX, originY, width, height }
      const keypoints = face.keypoints || []; // 6 landmarks: leftEye, rightEye, noseTip, mouthCenter, leftEar, rightEar

      if (keypoints.length >= 6) {
        const leftEye = keypoints[0];  // screen right (subject left)
        const rightEye = keypoints[1]; // screen left (subject right)
        const nose = keypoints[2];
        const leftEar = keypoints[4];
        const rightEar = keypoints[5];

        // 1. Check Head Tilt (Angle of eyes)
        const dY = leftEye.y - rightEye.y;
        const dX = leftEye.x - rightEye.x;
        const angle = Math.abs(Math.atan2(dY, dX) * (180 / Math.PI));
        
        // 2. Check Looking Away (Nose symmetry horizontal shift)
        // Nose should be horizontally centered between the ears
        const distLeft = Math.abs(nose.x - leftEar.x);
        const distRight = Math.abs(nose.x - rightEar.x);
        const totalDist = distLeft + distRight;
        const symmetryRatio = totalDist > 0 ? distLeft / totalDist : 0.5;

        if (angle > 26) {
          activeViolation = "HEAD_TILT";
          details = `Excessive head tilt detected (${angle.toFixed(1)}°).`;
        } else if (symmetryRatio < 0.22 || symmetryRatio > 0.78) {
          activeViolation = "LOOKING_AWAY";
          details = `Looking away from screen (nose symmetry ratio: ${symmetryRatio.toFixed(2)}).`;
        }
      }
    }

    // Update violation counts (5 seconds limit, i.e., ~12 consecutive checks at 400ms interval)
    const limit = 12;
    const counters = violationCounterRef.current;

    // Decay other counters, increment active one
    Object.keys(counters).forEach(key => {
      if (key === activeViolation) {
        counters[key]++;
      } else {
        counters[key] = Math.max(0, counters[key] - 1);
      }
    });

    if (activeViolation && counters[activeViolation] >= limit) {
      // Reset counters for next warning
      Object.keys(counters).forEach(key => counters[key] = 0);
      triggerWarning(activeViolation, details);
    } else if (activeViolation) {
      setProctoringStatus("warning");
      setProctoringMessage(`Suspicious posture detected: ${details} (Hold position to reset, or correct posture).`);
    } else {
      setProctoringStatus("running");
      setProctoringMessage("Proctoring feed: Active and Secure");
    }
  };

  const triggerWarning = async (type: string, details: string) => {
    const nextWarning = warningsCount + 1;
    setWarningsCount(nextWarning);
    
    // Play alert sound or make browser speak
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const speech = new SpeechSynthesisUtterance(`Warning ${nextWarning}. ${details}`);
      window.speechSynthesis.speak(speech);
    }

    try {
      // Send warning to backend
      const res = await api.post(`/Assessments/attempts/${attempt.id}/warnings`, {
        warningNumber: nextWarning,
        warningType: type,
        eventInfo: details,
        currentAnswers: answers // Pass current answers so far to save them
      });

      if (res.data.terminated) {
        stopTimer();
        stopProctoring();
        setAttempt((prev: any) => ({ ...prev, status: "MALPRACTICE_TERMINATED", isSubmitted: true }));
        alert("Assessment Terminated! You have reached the maximum of 4 warnings for suspicious proctoring activity. Your exam has been locked.");
      }
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
              <h2 className="font-serif font-black text-2xl uppercase text-red-500 tracking-tight">Test Terminated</h2>
              <p className="text-sm text-slate-450 leading-relaxed max-w-md">
                This assessment was automatically locked and terminated due to repeated anti-malpractice/proctoring warnings (4 levels reached). A malpractice report has been submitted to the Super Admin.
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
            onClick={() => window.location.href = "/dashboard"}
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
              <p className="whitespace-pre-line">{assessment?.instructions || "No specific instructions provided."}</p>
            </div>

            <div className="space-y-2 p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
              <h4 className="font-bold text-red-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <AlertTriangle size={13} /> Active Webcam Proctoring Policy
              </h4>
              <p className="text-[11px] text-red-300">
                This test uses real-time webcam face-tracking proctoring. Moving away, tilting your head, or having multiple faces in focus will raise automatic warnings. Reaching 4 warnings will lock and terminate your exam immediately.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/10">
            <button
              onClick={() => window.location.href = "/dashboard"}
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold border transition active:scale-95 cursor-pointer ${
                themeMode === "dark" ? "bg-white/5 border-white/10 text-slate-300" : "bg-slate-100 border-slate-200 text-slate-700"
              }`}
            >
              Cancel
            </button>
            <button
              onClick={startAttempt}
              disabled={starting}
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
    </div>
  );
}

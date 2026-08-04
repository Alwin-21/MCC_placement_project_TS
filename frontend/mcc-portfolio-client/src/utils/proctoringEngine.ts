import { ViolationType } from "./examRiskEngine";

// ─── Camera Error Classifier ──────────────────────────────────────────────────

export interface CameraErrorResult {
  title: string;
  message: string;
  isPermissionError: boolean;
  isHardwareError: boolean;
  isInUseError: boolean;
}

export function classifyCameraError(err: any): CameraErrorResult {
  if (!err) {
    return {
      title: "Camera Access Error",
      message: "An unknown error occurred while requesting camera access. Please check device connections.",
      isPermissionError: false,
      isHardwareError: false,
      isInUseError: false,
    };
  }

  const name = err.name || err.code || "";
  const msg = err.message || "";

  if (name === "NotAllowedError" || name === "PermissionDeniedError" || msg.includes("Permission denied")) {
    return {
      title: "Camera Permission Denied",
      message: "Camera permission was blocked. Click the lock/camera icon in your browser address bar and change Camera to 'Allow', then retry.",
      isPermissionError: true,
      isHardwareError: false,
      isInUseError: false,
    };
  }

  if (name === "NotFoundError" || name === "DevicesNotFoundError" || msg.includes("Requested device not found")) {
    return {
      title: "No Camera Hardware Found",
      message: "No webcam hardware detected. Please connect an external webcam or verify your device manager settings.",
      isPermissionError: false,
      isHardwareError: true,
      isInUseError: false,
    };
  }

  if (name === "NotReadableError" || name === "TrackStartError" || msg.includes("Could not start video source") || msg.includes("in use")) {
    return {
      title: "Camera Currently In Use",
      message: "Your camera is in use by another app (e.g. Zoom, Teams, Skype, or another browser tab). Please close all video apps and retry.",
      isPermissionError: false,
      isHardwareError: false,
      isInUseError: true,
    };
  }

  if (name === "OverconstrainedError" || msg.includes("Constraints")) {
    return {
      title: "Camera Resolution Conflict",
      message: "Your webcam hardware does not support the requested video resolution. Falling back to default constraints...",
      isPermissionError: false,
      isHardwareError: false,
      isInUseError: false,
    };
  }

  if (name === "TypeError" || (typeof window !== "undefined" && (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia))) {
    return {
      title: "Browser or Protocol Not Supported",
      message: "Camera access requires HTTPS or localhost, and a modern browser like Chrome, Edge, or Firefox.",
      isPermissionError: false,
      isHardwareError: false,
      isInUseError: false,
    };
  }

  return {
    title: "Webcam Connection Error",
    message: err.message || "Failed to initialize webcam stream.",
    isPermissionError: false,
    isHardwareError: false,
    isInUseError: false,
  };
}

// ─── State Machine Config ─────────────────────────────────────────────────────

export interface StateMachineConfig {
  /** Rolling frame buffer size (N frames) */
  bufferSize: number;
  /** Fraction of buffer frames that must be positive to count as "signaling" (0–1) */
  percentThreshold: number;
  /** Number of consecutive "signaling" ticks before a violation is declared */
  minDurationFrames: number;
  /** Number of consecutive "clear" ticks before a violation is cleared */
  minClearFrames: number;
  /** Minimum milliseconds between two separate violation instances of the same type */
  cooldownMs: number;
}

// ─── Engine Config ────────────────────────────────────────────────────────────

export interface ProctoringEngineConfig {
  videoElement: HTMLVideoElement;
  canvasElement: HTMLCanvasElement;
  /** 128-dim face-api.js descriptor captured during pre-exam registration. Null = skip identity check. */
  registeredDescriptor: number[] | null;
  onViolation: (type: ViolationType, details: string, confidence: number) => void;
  onViolationCleared?: (type: ViolationType) => void;
  onStatusUpdate?: (status: string) => void;

  // ── Geometry thresholds (all overridable) ──────────────────────────────────
  /** face-api.js Euclidean distance above which faces are considered mismatched. Default: 0.55 */
  faceMismatchThreshold?: number;
  /** COCO-SSD minimum probability for phone detection. Default: 0.45 */
  phoneConfidenceThreshold?: number;
  /** Yaw angle (degrees) above which head is considered turned away. Default: 20 */
  yawThreshold?: number;
  /** Pitch angle (degrees) above which head is considered tilted away. Default: 15 */
  pitchThreshold?: number;
  /** Target frames per second for the proctoring loop. Default: 5 */
  sampleFps?: number;

  // ── State machine config overrides ────────────────────────────────────────
  faceMismatchConfig?: Partial<StateMachineConfig>;
  multipleFacesConfig?: Partial<StateMachineConfig>;
  phoneDetectedConfig?: Partial<StateMachineConfig>;
  cameraObstructedConfig?: Partial<StateMachineConfig>;
  lookingAwayConfig?: Partial<StateMachineConfig>;
  frequentEyeMovementConfig?: Partial<StateMachineConfig>;
  faceMissingConfig?: Partial<StateMachineConfig>;
  bookDetectedConfig?: Partial<StateMachineConfig>;
  additionalPersonConfig?: Partial<StateMachineConfig>;
}

// ─── Default State Machine Timings (at 5 FPS = 200 ms per frame) ─────────────

const DEFAULT_SM_CONFIGS: Record<string, StateMachineConfig> = {
  FaceMismatch: {
    bufferSize: 15,           // 3 s window
    percentThreshold: 0.70,   // 70 % of frames must mismatch
    minDurationFrames: 8,     // ~1.6 s continuous before alert
    minClearFrames: 5,
    cooldownMs: 10000,
  },
  MultipleFaces: {
    bufferSize: 15,           // 3 s window
    percentThreshold: 0.75,   // 75 % of frames show multiple faces
    minDurationFrames: 10,    // ~2 s continuous before alert
    minClearFrames: 10,
    cooldownMs: 10000,
  },
  PhoneDetected: {
    bufferSize: 4,            // 0.8 s window
    percentThreshold: 0.50,   // at least 2 frames positive
    minDurationFrames: 2,     // ~0.4 s before warning
    minClearFrames: 10,
    cooldownMs: 8000,
  },
  CameraObstructed: {
    bufferSize: 15,           // 3 s window
    percentThreshold: 0.80,
    minDurationFrames: 12,    // ~2.4 s continuous before alert
    minClearFrames: 8,
    cooldownMs: 10000,
  },
  LookingAway: {
    bufferSize: 8,            // 1.6 s window
    percentThreshold: 0.60,   // 60% of frames
    minDurationFrames: 5,     // ~1 s deviation
    minClearFrames: 2,
    cooldownMs: 8000,
  },
  FrequentEyeMovement: {
    bufferSize: 5,            // 1 s window
    percentThreshold: 0.50,   // at least 3 frames positive
    minDurationFrames: 3,     // ~0.6 s of eye movement away before alert
    minClearFrames: 4,
    cooldownMs: 6000,
  },
  FaceMissing: {
    bufferSize: 25,           // 5 s window
    percentThreshold: 0.90,
    minDurationFrames: 25,    // ~5 s continuous before alert
    minClearFrames: 5,
    cooldownMs: 10000,
  },
  BookDetected: {
    bufferSize: 6,            // 1.2 s window
    percentThreshold: 0.60,
    minDurationFrames: 4,     // ~0.8 s before warning
    minClearFrames: 8,
    cooldownMs: 8000,
  },
  AdditionalPerson: {
    bufferSize: 6,            // 1.2 s window
    percentThreshold: 0.60,
    minDurationFrames: 4,     // ~0.8 s before warning
    minClearFrames: 8,
    cooldownMs: 8000,
  },
};

// ─── Generic Proctoring State Machine ─────────────────────────────────────────

/**
 * A rolling-buffer state machine that converts raw per-frame boolean signals
 * into confirmed "violation started" / "violation cleared" events.
 *
 * Prevents false positives from single-frame blips by requiring a sustained
 * signal across multiple frames before declaring a violation.
 */
export class ProctoringStateMachine {
  private buffer: boolean[] = [];
  private readonly config: StateMachineConfig;

  private activeTicks = 0;
  private clearTicks = 0;
  private isViolating = false;
  private lastViolationTime = 0;

  constructor(config: StateMachineConfig) {
    this.config = config;
  }

  /**
   * Feed a new per-frame signal.
   * Returns "start" when a new violation is confirmed, "clear" when it ends, or null.
   */
  public update(signal: boolean): "start" | "clear" | null {
    // Maintain rolling buffer
    this.buffer.push(signal);
    if (this.buffer.length > this.config.bufferSize) {
      this.buffer.shift();
    }

    const trueCount = this.buffer.filter((v) => v).length;
    const trueRatio = this.buffer.length > 0 ? trueCount / this.buffer.length : 0;
    const isSignaling = trueRatio >= this.config.percentThreshold;

    if (isSignaling) {
      this.activeTicks++;
      this.clearTicks = 0;
    } else {
      this.clearTicks++;
      this.activeTicks = 0;
    }

    if (!this.isViolating) {
      // Check start condition
      if (this.activeTicks >= this.config.minDurationFrames) {
        const now = Date.now();
        if (now - this.lastViolationTime >= this.config.cooldownMs) {
          this.isViolating = true;
          this.lastViolationTime = now;
          return "start";
        }
      }
    } else {
      // Check clear condition
      if (this.clearTicks >= this.config.minClearFrames) {
        this.isViolating = false;
        return "clear";
      }
    }

    return null;
  }

  public reset() {
    this.buffer = [];
    this.activeTicks = 0;
    this.clearTicks = 0;
    this.isViolating = false;
  }

  public isCurrentlyViolating(): boolean {
    return this.isViolating;
  }
}

// ─── Model Loaders (static, cached on window) ────────────────────────────────

/**
 * Loads face-api.js library + TinyFaceDetector + FaceLandmark68Net + FaceRecognitionNet.
 * Idempotent — safe to call multiple times.
 */
async function loadFaceApiModels(): Promise<void> {
  // Already loaded?
  if ((window as any).faceapi?.nets?.tinyFaceDetector?.isLoaded) return;

  // Load the script if not present
  if (!(window as any).faceapi) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src =
        "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/dist/face-api.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load face-api.js"));
      document.body.appendChild(script);
    });
  }

  const faceapi = (window as any).faceapi;
  const modelUrl =
    "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model/";

  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl),
    faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl),
    faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl),
  ]);
}

/**
 * Loads the MediaPipe vision bundle script.
 * Idempotent — safe to call multiple times.
 */
async function loadMediaPipeBundle(): Promise<void> {
  if ((window as any).__mediapipeVisionLoaded) return;

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm/vision_bundle.js";
    script.async = true;
    script.onload = () => {
      (window as any).__mediapipeVisionLoaded = true;
      resolve();
    };
    script.onerror = (err) => reject(err);
    document.body.appendChild(script);
  });
}

/**
 * Creates a MediaPipe FaceLandmarker instance for the proctoring engine.
 * Tracks up to 2 faces, provides landmarks (478 pts with iris), transformation matrix, and blendshapes.
 * Uses a dedicated window key to avoid conflicts with the pre-exam FaceDetector instance.
 */
async function createFaceLandmarker(): Promise<any> {
  // Return cached instance if already created for the engine
  if ((window as any).__proctoringFaceLandmarker) {
    return (window as any).__proctoringFaceLandmarker;
  }

  await loadMediaPipeBundle();

  const vision = await (window as any).FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
  );

  const landmarker = await (window as any).FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
      delegate: "GPU",
    },
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: true,
    runningMode: "VIDEO",
    numFaces: 2,
  });

  (window as any).__proctoringFaceLandmarker = landmarker;
  return landmarker;
}

/**
 * Loads TensorFlow.js + COCO-SSD for object detection.
 * Idempotent — safe to call multiple times.
 */
async function loadCocoSsd(): Promise<void> {
  if ((window as any).tf && (window as any).cocoSsd) return;

  await new Promise<void>((resolve, reject) => {
    const tfScript = document.createElement("script");
    tfScript.src =
      "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.17.0/dist/tf.min.js";
    tfScript.async = true;
    tfScript.onload = () => {
      const cocoScript = document.createElement("script");
      cocoScript.src =
        "https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js";
      cocoScript.async = true;
      cocoScript.onload = () => resolve();
      cocoScript.onerror = () =>
        reject(new Error("Failed to load COCO-SSD"));
      document.body.appendChild(cocoScript);
    };
    tfScript.onerror = () =>
      reject(new Error("Failed to load TensorFlow.js"));
    document.body.appendChild(tfScript);
  });
}

// ─── Pre-exam Face Detector Loader (separate from engine FaceLandmarker) ─────

/**
 * Creates a MediaPipe FaceDetector for the pre-exam checklist.
 * Lighter and faster than FaceLandmarker — used only during the instructions view.
 * Stored under a separate window key to avoid conflicts with the engine's FaceLandmarker.
 */
export async function createPreExamFaceDetector(): Promise<any> {
  if ((window as any).__preExamFaceDetector) {
    return (window as any).__preExamFaceDetector;
  }

  await loadMediaPipeBundle();

  const vision = await (window as any).FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
  );

  const detector = await (window as any).FaceDetector.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
      delegate: "GPU",
    },
    runningMode: "VIDEO",
  });

  (window as any).__preExamFaceDetector = detector;
  return detector;
}

/**
 * Loads face-api.js models needed for the pre-exam face registration step.
 * Exported so page.tsx can call it during the manual capture flow.
 */
export async function loadFaceApiForRegistration(): Promise<void> {
  await loadFaceApiModels();
}

// ─── Proctoring Engine ────────────────────────────────────────────────────────

export class ProctoringEngine {
  private video: HTMLVideoElement;
  private canvas: HTMLCanvasElement;
  private registeredDescriptor: number[] | null;
  private onViolation: (type: ViolationType, details: string, confidence: number) => void;
  private onViolationCleared: (type: ViolationType) => void;
  private onStatus: (status: string) => void;

  // ── Geometry thresholds ───────────────────────────────────────────────────
  private faceMismatchThreshold: number;
  private phoneConfidenceThreshold: number;
  private yawThreshold: number;
  private pitchThreshold: number;
  private sampleFps: number;

  // ── State machines ────────────────────────────────────────────────────────
  private stateMachines: Record<string, ProctoringStateMachine> = {};

  // ── Engine loop ───────────────────────────────────────────────────────────
  private isRunning = false;
  private lastFrameTime = 0;
  private loopId: number | null = null;

  // ── AI model refs ─────────────────────────────────────────────────────────
  private faceLandmarker: any = null;
  private objectDetector: any = null;

  // ── Camera health tracking ────────────────────────────────────────────────
  /** Pixel snapshot for frozen-frame detection */
  private prevPixels: number[] = [];
  /** Consecutive frozen-frame count (requires 3 before flagging) */
  private cameraFrozenTicks = 0;

  constructor(config: ProctoringEngineConfig) {
    this.video = config.videoElement;
    this.canvas = config.canvasElement;
    this.registeredDescriptor = config.registeredDescriptor;
    this.onViolation = config.onViolation;
    this.onViolationCleared = config.onViolationCleared ?? (() => {});
    this.onStatus = config.onStatusUpdate ?? (() => {});

    // Geometry thresholds
    this.faceMismatchThreshold = config.faceMismatchThreshold ?? 0.55;
    this.phoneConfidenceThreshold = config.phoneConfidenceThreshold ?? 0.35;
    this.yawThreshold = config.yawThreshold ?? 14;
    this.pitchThreshold = config.pitchThreshold ?? 10;
    this.sampleFps = config.sampleFps ?? 5;

    // Build state machines with optional overrides
    const keys = [
      "FaceMismatch",
      "MultipleFaces",
      "PhoneDetected",
      "CameraObstructed",
      "LookingAway",
      "FrequentEyeMovement",
      "FaceMissing",
      "BookDetected",
      "AdditionalPerson",
    ] as const;

    for (const key of keys) {
      const propName = (key.charAt(0).toLowerCase() +
        key.slice(1) +
        "Config") as keyof ProctoringEngineConfig;
      const override = config[propName] as Partial<StateMachineConfig> | undefined;
      this.stateMachines[key] = new ProctoringStateMachine({
        ...DEFAULT_SM_CONFIGS[key],
        ...override,
      });
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Load all AI models required for proctoring.
   * Must complete before calling start().
   */
  public async initAI(): Promise<void> {
    this.onStatus("Loading facial verification models...");
    await loadFaceApiModels();

    this.onStatus("Loading head pose & landmark detection...");
    try {
      this.faceLandmarker = await createFaceLandmarker();
    } catch (e) {
      console.warn("[ProctoringEngine] FaceLandmarker load failed:", e);
    }

    this.onStatus("Loading object detection models...");
    try {
      await loadCocoSsd();
      if ((window as any).cocoSsd && !this.objectDetector) {
        this.objectDetector = await (window as any).cocoSsd.load();
      }
    } catch (e) {
      console.warn("[ProctoringEngine] COCO-SSD load failed:", e);
    }

    this.onStatus("Secure proctoring engine active");
  }

  /** Start the proctoring frame loop. Requires initAI() to have completed. */
  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.loop();
    console.log("[ProctoringEngine] Started at", this.sampleFps, "FPS");
  }

  /** Stop the proctoring loop and reset all state machines. */
  public stop(): void {
    this.isRunning = false;
    if (this.loopId !== null) {
      cancelAnimationFrame(this.loopId);
      this.loopId = null;
    }
    for (const sm of Object.values(this.stateMachines)) {
      sm.reset();
    }
    this.prevPixels = [];
    this.cameraFrozenTicks = 0;
    console.log("[ProctoringEngine] Stopped");
  }

  /** Update video/canvas refs (e.g. after a React remount). */
  public updateElements(
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement
  ): void {
    this.video = video;
    this.canvas = canvas;
  }

  // ── Internal Loop ──────────────────────────────────────────────────────────

  private loop(): void {
    if (!this.isRunning) return;

    this.loopId = requestAnimationFrame(async (timestamp) => {
      const elapsed = timestamp - this.lastFrameTime;
      const interval = 1000 / this.sampleFps;

      if (elapsed >= interval) {
        this.lastFrameTime = timestamp - (elapsed % interval);
        try {
          await this.processFrame();
        } catch (err) {
          console.error("[ProctoringEngine] Frame error:", err);
        }
      }

      this.loop();
    });
  }

  // ── Frame Processing ───────────────────────────────────────────────────────

  private async processFrame(): Promise<void> {
    if (!this.video || this.video.readyState < 2) return;

    // ── Step 1: Camera Health ─────────────────────────────────────────────────
    const obstructedSignal = this.checkCameraHealth();
    this.pushState("CameraObstructed", obstructedSignal, "Camera is blocked, frozen, or unavailable.", 1.0);

    if (obstructedSignal) {
      // Feed "no face" signal to relevant machines while camera is blocked
      this.pushState("FaceMissing", true, "No face detected — camera obstructed.", 1.0);
      this.pushState("MultipleFaces", false, "", 0);
      this.pushState("FaceMismatch", false, "", 0);
      this.pushState("LookingAway", false, "", 0);
      this.pushState("FrequentEyeMovement", false, "", 0);
      return;
    }

    // ── Step 2: Face Detection via MediaPipe FaceLandmarker ──────────────────
    let faceCount = 0;
    let mainLandmarks: any[] | null = null;
    let mainMatrix: number[] | null = null;

    if (this.faceLandmarker) {
      try {
        const results = this.faceLandmarker.detectForVideo(
          this.video,
          performance.now()
        );
        const landmarkSets: any[][] = results.faceLandmarks || [];
        faceCount = landmarkSets.length;

        if (faceCount > 0) {
          mainLandmarks = landmarkSets[0];
          const matrices = results.facialTransformationMatrixes || [];
          if (matrices.length > 0) {
            mainMatrix = matrices[0].data as number[];
          }
        }
      } catch (err) {
        console.warn("[ProctoringEngine] FaceLandmarker error:", err);
      }
    }

    // ── Fallback: face-api.js if FaceLandmarker unavailable or returned 0 ────
    const faceapi = (window as any).faceapi;
    let faceapiDetections: any[] = [];

    if (faceCount === 0 && faceapi) {
      try {
        faceapiDetections = await faceapi
          .detectAllFaces(
            this.video,
            new faceapi.TinyFaceDetectorOptions({
              inputSize: 224,
              scoreThreshold: 0.35,
            })
          )
          .withFaceLandmarks()
          .withFaceDescriptors();
        faceCount = faceapiDetections.length;
        if (faceCount > 0) {
          mainLandmarks = faceapiDetections[0].landmarks.positions;
        }
      } catch (err) {
        console.warn("[ProctoringEngine] face-api.js fallback error:", err);
      }
    }

    // ── Step 3: Face Missing & Multiple Faces ─────────────────────────────────
    this.pushState("FaceMissing", faceCount === 0, "No face detected in camera frame.", 1.0);
    this.pushState(
      "MultipleFaces",
      faceCount > 1,
      `Multiple faces visible: ${faceCount} detected.`,
      1.0
    );

    // ── Step 4: Per-Face Analysis (only when exactly one face is present) ─────
    if (faceCount === 1) {
      // A) Identity Verification
      await this.checkIdentity(faceapiDetections);

      // B) Head Pose (Looking Away)
      this.checkHeadPose(mainLandmarks, mainMatrix);

      // C) Iris Gaze (Frequent Eye Movement)
      this.checkIrisGaze(mainLandmarks);
    } else {
      // No single face — clear face-specific violations
      this.pushState("FaceMismatch", false, "", 0);
      this.pushState("LookingAway", false, "", 0);
      this.pushState("FrequentEyeMovement", false, "", 0);
    }

    // ── Step 5: Object Detection (Phone, Book, Additional Person) ─────────────
    await this.checkObjectDetection();
  }

  // ── Camera Health ──────────────────────────────────────────────────────────

  /**
   * Checks if the camera feed is blocked (too dark) or frozen (no pixel change).
   * Uses a tiny 10×10 canvas for efficiency.
   */
  private checkCameraHealth(): boolean {
    const ctx = this.canvas.getContext("2d");
    if (!ctx) return false;

    this.canvas.width = 10;
    this.canvas.height = 10;

    try {
      ctx.drawImage(this.video, 0, 0, 10, 10);
    } catch {
      return true; // Cannot draw → camera issue
    }

    const data = ctx.getImageData(0, 0, 10, 10).data;
    const pixelCount = data.length / 4; // 100 pixels

    // Brightness check
    let totalBrightness = 0;
    for (let i = 0; i < data.length; i += 4) {
      totalBrightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
    }
    const avgBrightness = totalBrightness / pixelCount;
    if (avgBrightness < 12) {
      // Lens covered or very dark environment
      return true;
    }

    // Frozen frame check — compare pixel-by-pixel with previous frame
    const currentPixels = Array.from(data);
    if (this.prevPixels.length === currentPixels.length) {
      let diffSum = 0;
      for (let i = 0; i < currentPixels.length; i++) {
        diffSum += Math.abs(currentPixels[i] - this.prevPixels[i]);
      }
      if (diffSum < 3) {
        this.cameraFrozenTicks++;
        if (this.cameraFrozenTicks >= 3) {
          // 3 consecutive frozen frames = confirmed frozen
          this.prevPixels = currentPixels;
          return true;
        }
      } else {
        this.cameraFrozenTicks = 0;
      }
    }

    this.prevPixels = currentPixels;
    return false;
  }

  // ── Identity Verification ──────────────────────────────────────────────────

  /**
   * Compares the live face descriptor with the registered reference descriptor.
   * Uses face-api.js Euclidean distance. Lower distance = more similar faces.
   */
  private async checkIdentity(faceapiDetections: any[]): Promise<void> {
    if (!this.registeredDescriptor) {
      this.pushState("FaceMismatch", false, "", 0);
      return;
    }

    const faceapi = (window as any).faceapi;
    if (!faceapi) {
      this.pushState("FaceMismatch", false, "", 0);
      return;
    }

    let descriptor: Float32Array | null = null;
    let identityConfidence = 0;

    try {
      if (faceapiDetections.length > 0) {
        // Reuse descriptor from the detection we already ran
        descriptor = faceapiDetections[0].descriptor;
      } else {
        // Run a fresh single-face detection for the descriptor
        const det = await faceapi
          .detectSingleFace(
            this.video,
            new faceapi.TinyFaceDetectorOptions({
              inputSize: 224,
              scoreThreshold: 0.35,
            })
          )
          .withFaceLandmarks()
          .withFaceDescriptor();
        if (det) {
          descriptor = det.descriptor;
        }
      }

      if (descriptor) {
        const dist = faceapi.euclideanDistance(
          descriptor,
          new Float32Array(this.registeredDescriptor)
        );
        const mismatch = dist > this.faceMismatchThreshold;
        identityConfidence = Math.max(0, Math.min(1, 1 - dist));
        this.pushState(
          "FaceMismatch",
          mismatch,
          "Identity verification failed: face does not match the registered student.",
          identityConfidence
        );
      } else {
        // No descriptor obtained — do not flag as mismatch (could be a transient miss)
        this.pushState("FaceMismatch", false, "", 0);
      }
    } catch (err) {
      console.warn("[ProctoringEngine] Identity check error:", err);
      this.pushState("FaceMismatch", false, "", 0);
    }
  }

  // ── Head Pose Estimation ───────────────────────────────────────────────────

  /**
   * Estimates head yaw and pitch from the MediaPipe facial transformation matrix
   * or, when unavailable, from 68-point face-api.js landmarks.
   *
   * Matrix layout (column-major 4×4):
   *   [0]=r00  [1]=r10  [2]=r20  [3]=r30
   *   [4]=r01  [5]=r11  [6]=r21  [7]=r31
   *   [8]=r02  [9]=r12  [10]=r22 [11]=r32
   *   ...
   *
   * Decomposed rotation:
   *   yaw   = atan2(-r20, r00)           → left/right head turn
   *   pitch = atan2(-r12, r11  approx)   → up/down nod
   *
   * This decomposition correctly extracts yaw/pitch from the MediaPipe matrix
   * in a Y-up, right-handed coordinate system.
   */
  private checkHeadPose(
    mainLandmarks: any[] | null,
    mainMatrix: number[] | null
  ): void {
    let lookingAwaySignal = false;

    if (mainMatrix && mainMatrix.length >= 16) {
      // MediaPipe transformation matrix (column-major 4×4)
      const r00 = mainMatrix[0];
      const r10 = mainMatrix[1];
      const r20 = mainMatrix[2];
      const r01 = mainMatrix[4];
      const r11 = mainMatrix[5];
      const r21 = mainMatrix[6];
      const r02 = mainMatrix[8];
      const r12 = mainMatrix[9];
      const r22 = mainMatrix[10];

      // Correct decomposition for MediaPipe's coordinate system
      const yaw = Math.atan2(-r20, Math.sqrt(r00 * r00 + r10 * r10)) * (180 / Math.PI);
      const pitch = Math.atan2(r21, r22) * (180 / Math.PI);

      lookingAwaySignal =
        Math.abs(yaw) > this.yawThreshold ||
        Math.abs(pitch) > this.pitchThreshold;

      this.pushState(
        "LookingAway",
        lookingAwaySignal,
        lookingAwaySignal
          ? `Head pose out of bounds: yaw=${yaw.toFixed(1)}°, pitch=${pitch.toFixed(1)}°`
          : "",
        1.0
      );
      return;
    }

    if (mainLandmarks && mainLandmarks.length >= 68) {
      // Geometric fallback using face-api.js 68-point landmarks
      const leftEye = mainLandmarks[36];
      const rightEye = mainLandmarks[45];
      const nose = mainLandmarks[30];
      const leftJaw = mainLandmarks[0];
      const rightJaw = mainLandmarks[16];
      const chin = mainLandmarks[8];

      // Horizontal symmetry ratio (how far nose is from center between jaw points)
      const distLeft = Math.abs(nose.x - leftJaw.x);
      const distRight = Math.abs(nose.x - rightJaw.x);
      const total = distLeft + distRight;
      const symmetryRatio = total > 0 ? distLeft / total : 0.5;

      // Eyes midpoint for vertical ratio
      const eyesMidY = (leftEye.y + rightEye.y) / 2;
      const vertRatio =
        chin.y - nose.y > 0 ? (nose.y - eyesMidY) / (chin.y - nose.y) : 1.0;

      // Roll — large roll usually means looking sideways
      const dY = leftEye.y - rightEye.y;
      const dX = leftEye.x - rightEye.x;
      const rollDeg = Math.abs(Math.atan2(dY, dX) * (180 / Math.PI));

      lookingAwaySignal =
        rollDeg > 15 ||
        symmetryRatio < 0.35 ||
        symmetryRatio > 0.65 ||
        vertRatio < 0.55 ||
        vertRatio > 1.50;
    }

    this.pushState(
      "LookingAway",
      lookingAwaySignal,
      lookingAwaySignal ? "Student turned face away from the screen." : "",
      1.0
    );
  }

  // ── Iris Gaze ──────────────────────────────────────────────────────────────

  /**
   * Detects suspicious eye movement using MediaPipe iris landmarks.
   * Iris indices: Left iris center = 468, Right iris center = 473
   * Eye corner indices: Left eye outer=33, Left inner=133 / Right inner=362, Right outer=263
   *
   * Computes a normalized horizontal gaze ratio for each eye.
   * Ratio near 0 = gaze far left, near 1 = gaze far right, ~0.5 = centered.
   *
   * IMPORTANT: Thresholds are intentionally wide (0.25–0.75) to avoid flagging
   * normal reading behavior. Only extreme, repeated off-screen gaze triggers a warning.
   */
  private checkIrisGaze(mainLandmarks: any[] | null): void {
    if (!mainLandmarks || mainLandmarks.length < 478) {
      // Iris landmarks require MediaPipe FaceLandmarker with 478+ points
      this.pushState("FrequentEyeMovement", false, "", 0);
      return;
    }

    const leftIris = mainLandmarks[468];
    const leftOuter = mainLandmarks[33];   // outer corner of left eye
    const leftInner = mainLandmarks[133];  // inner corner of left eye

    const rightIris = mainLandmarks[473];
    const rightInner = mainLandmarks[362]; // inner corner of right eye
    const rightOuter = mainLandmarks[263]; // outer corner of right eye

    const leftWidth = Math.abs(leftInner.x - leftOuter.x);
    const rightWidth = Math.abs(rightOuter.x - rightInner.x);

    if (leftWidth < 0.001 || rightWidth < 0.001) {
      this.pushState("FrequentEyeMovement", false, "", 0);
      return;
    }

    // Gaze ratio: 0 = looking far left, 1 = looking far right, 0.5 = center
    const leftRatio = (leftIris.x - leftOuter.x) / leftWidth;
    const rightRatio = (rightIris.x - rightInner.x) / rightWidth;
    const avgRatio = (leftRatio + rightRatio) / 2;

    const leftEyeUpper = mainLandmarks[159];
    const leftEyeLower = mainLandmarks[145];
    const rightEyeUpper = mainLandmarks[386];
    const rightEyeLower = mainLandmarks[374];

    const leftHeight = Math.abs(leftEyeLower.y - leftEyeUpper.y);
    const rightHeight = Math.abs(rightEyeLower.y - rightEyeUpper.y);

    const leftEAR = leftHeight / leftWidth;
    const rightEAR = rightHeight / rightWidth;
    const avgEAR = (leftEAR + rightEAR) / 2;
    const eyesClosed = avgEAR < 0.13; // EAR below 0.13 indicates closed eyes

    let verticalAwaySignal = false;
    let avgVertRatio = 0.5;
    if (leftHeight > 0.001 && rightHeight > 0.001) {
      const leftVertRatio = (leftIris.y - leftEyeUpper.y) / leftHeight;
      const rightVertRatio = (rightIris.y - rightEyeUpper.y) / rightHeight;
      avgVertRatio = (leftVertRatio + rightVertRatio) / 2;

      // avgVertRatio near 0 means looking up; near 1 means looking down
      verticalAwaySignal = avgVertRatio < 0.25 || avgVertRatio > 0.75;
    }

    // Trigger on horizontal gaze shift, vertical shift, or closed eyes (long blink)
    const eyeAwaySignal = avgRatio < 0.40 || avgRatio > 0.60 || verticalAwaySignal || eyesClosed;

    let detailsMsg = "";
    if (eyeAwaySignal) {
      if (eyesClosed) {
        detailsMsg = "Sustained closed eyes or blink detected.";
      } else {
        detailsMsg = `Sustained off-screen eye gaze detected (h-ratio: ${avgRatio.toFixed(2)}, v-ratio: ${avgVertRatio.toFixed(2)}).`;
      }
    }

    this.pushState(
      "FrequentEyeMovement",
      eyeAwaySignal,
      detailsMsg,
      1.0
    );
  }

  // ── Phone / Object Detection ───────────────────────────────────────────────

  /**
   * Runs COCO-SSD object detection to check for mobile phones, books, and additional people.
   * - PhoneDetected: cell phone, remote
   * - BookDetected: book
   * - AdditionalPerson: person count > 1
   */
  private async checkObjectDetection(): Promise<void> {
    if (!this.objectDetector) {
      this.pushState("PhoneDetected", false, "", 0);
      this.pushState("BookDetected", false, "", 0);
      this.pushState("AdditionalPerson", false, "", 0);
      return;
    }

    try {
      const predictions = await this.objectDetector.detect(this.video);

      // 1. Phone Detection (cell phone, remote)
      const phoneClasses = new Set(["cell phone", "remote"]);
      const phoneMatch = predictions.find(
        (p: any) =>
          phoneClasses.has(p.class) && p.score >= this.phoneConfidenceThreshold
      );

      if (phoneMatch) {
        this.pushState(
          "PhoneDetected",
          true,
          `Prohibited device detected: ${phoneMatch.class} (${Math.round(phoneMatch.score * 100)}% confidence).`,
          phoneMatch.score
        );
      } else {
        this.pushState("PhoneDetected", false, "", 0);
      }

      // 2. Book Detection (book / study materials)
      const bookMatch = predictions.find(
        (p: any) => p.class === "book" && p.score >= 0.40
      );

      if (bookMatch) {
        this.pushState(
          "BookDetected",
          true,
          `Prohibited study material detected: book (${Math.round(bookMatch.score * 100)}% confidence).`,
          bookMatch.score
        );
      } else {
        this.pushState("BookDetected", false, "", 0);
      }

      // 3. Additional Person Detection
      const personPredictions = predictions.filter(
        (p: any) => p.class === "person" && p.score >= 0.55
      );

      if (personPredictions.length > 1) {
        const highestScore = Math.max(...personPredictions.map((p: any) => p.score));
        this.pushState(
          "AdditionalPerson",
          true,
          `Additional person detected in camera view (${personPredictions.length} people visible).`,
          highestScore
        );
      } else {
        this.pushState("AdditionalPerson", false, "", 0);
      }

    } catch (err) {
      console.warn("[ProctoringEngine] Object detection error:", err);
      this.pushState("PhoneDetected", false, "", 0);
      this.pushState("BookDetected", false, "", 0);
      this.pushState("AdditionalPerson", false, "", 0);
    }
  }

  // ── State Machine Router ───────────────────────────────────────────────────

  /**
   * Feeds a signal into the appropriate state machine and fires callbacks on transitions.
   */
  private pushState(
    key: keyof typeof DEFAULT_SM_CONFIGS,
    signal: boolean,
    details: string,
    confidence: number
  ): void {
    const sm = this.stateMachines[key];
    if (!sm) return;

    const event = sm.update(signal);
    const violationType = key as ViolationType;

    if (event === "start") {
      console.log(`[ProctoringEngine] ▲ ${key} VIOLATION STARTED`);
      this.onViolation(violationType, details, confidence);
    } else if (event === "clear") {
      console.log(`[ProctoringEngine] ▽ ${key} CLEARED`);
      this.onViolationCleared(violationType);
    }
  }
}

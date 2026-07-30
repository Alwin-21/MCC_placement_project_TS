/**
 * Anti-Malpractice Proctoring Engine (Enhanced)
 *
 * Provides real-time camera frame analysis with temporal smoothing
 * to eliminate false-positive proctoring alerts.
 *
 * Enhancement over v1:
 *  - Extended WarningType set aligned with ExamRiskEngine
 *  - Rolling 3-frame buffer for temporal smoothing (face missing requires
 *    3 consecutive suspicious frames before triggering a warning)
 *  - Skin-tone mass centroid for face-presence detection
 *  - Configurable cooldown, threshold, and interval
 *  - Risk score included in warning event for Risk Engine integration
 */

export type WarningType =
  | "TabSwitchOrWindowBlur"
  | "LookingAwayOrHeadTilt"
  | "CameraObstructedOrNoFace"
  | "MultipleFacesOrExcessiveMovement"
  | "FullscreenExit"
  | "DevToolsAttempt"
  | "WindowResize";

export interface ProctoringWarningEvent {
  warningNum: number;
  warningType: WarningType;
  details: string;
  timestamp: string;
  riskScore: number;           // score added by this violation
  cumulativeRisk: number;      // total risk score after this violation
  cameraEvent?: string;        // raw camera event string for logging
}

export interface ProctoringEngineConfig {
  videoElement: HTMLVideoElement | null;
  canvasElement: HTMLCanvasElement | null;
  onWarningTriggered: (event: ProctoringWarningEvent) => void;
  onMaxWarningsExceeded: (lastEvent: ProctoringWarningEvent) => void;
  /** Milliseconds between frame samples. Default 800ms. */
  sampleIntervalMs?: number;
  /** Number of consecutive suspicious frames required to trigger a warning. Default 3. */
  consecutiveThreshold?: number;
  /** Cooldown in ms between consecutive warnings. Default 8000ms. */
  warningCooldownMs?: number;
  /** Maximum warnings before onMaxWarningsExceeded fires. Default 4. */
  maxWarnings?: number;
}

// ─── Risk weights for camera-detected violations ───────────────────────────
const CAMERA_RISK_WEIGHTS: Partial<Record<WarningType, number>> = {
  CameraObstructedOrNoFace:        25,
  LookingAwayOrHeadTilt:           15,
  MultipleFacesOrExcessiveMovement: 30,
  TabSwitchOrWindowBlur:           25,
};

export class ProctoringEngine {
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private onWarning: (event: ProctoringWarningEvent) => void;
  private onMaxExceeded: (lastEvent: ProctoringWarningEvent) => void;
  private sampleIntervalMs: number;
  private consecutiveThreshold: number;
  private warningCooldownMs: number;
  private maxWarnings: number;

  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private currentWarningCount: number = 0;
  private cumulativeRisk: number = 0;
  private lastWarningTimestamp: number = 0;

  // Temporal smoothing: rolling buffer of last N suspicious detections
  private frameBuffer: Array<{ suspicious: boolean; reason: WarningType }> = [];
  private readonly BUFFER_SIZE = 3;

  // Frame diff tracking
  private prevFrameSample: number[] = [];

  constructor(config: ProctoringEngineConfig) {
    this.video = config.videoElement;
    this.canvas = config.canvasElement;
    this.onWarning = config.onWarningTriggered;
    this.onMaxExceeded = config.onMaxWarningsExceeded;
    this.sampleIntervalMs = config.sampleIntervalMs ?? 800;
    this.consecutiveThreshold = config.consecutiveThreshold ?? 3;
    this.warningCooldownMs = config.warningCooldownMs ?? 8000;
    this.maxWarnings = config.maxWarnings ?? 4;

    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleWindowBlur = this.handleWindowBlur.bind(this);
  }

  /** Start the proctoring engine. Idempotent. */
  public start() {
    if (this.isRunning) return;
    this.isRunning = true;

    if (typeof window !== "undefined") {
      document.addEventListener("visibilitychange", this.handleVisibilityChange);
      window.addEventListener("blur", this.handleWindowBlur);
    }

    this.intervalId = setInterval(() => {
      this.sampleVideoFrame();
    }, this.sampleIntervalMs);
  }

  /** Stop the proctoring engine and remove all listeners. */
  public stop() {
    if (!this.isRunning) return;
    this.isRunning = false;

    if (typeof window !== "undefined") {
      document.removeEventListener("visibilitychange", this.handleVisibilityChange);
      window.removeEventListener("blur", this.handleWindowBlur);
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Clear frame buffer on stop to avoid stale state
    this.frameBuffer = [];
    this.prevFrameSample = [];
  }

  /** Update video/canvas elements (useful when refs change). */
  public setElements(video: HTMLVideoElement | null, canvas: HTMLCanvasElement | null) {
    this.video = video;
    this.canvas = canvas;
  }

  /** Returns current warning count. */
  public getWarningCount(): number {
    return this.currentWarningCount;
  }

  /** Returns cumulative risk score. */
  public getCumulativeRisk(): number {
    return this.cumulativeRisk;
  }

  // ── Tab/focus event handlers ──────────────────────────────────────────────

  private handleVisibilityChange() {
    if (document.hidden && this.isRunning) {
      this.registerViolation("TabSwitchOrWindowBlur", "Student switched tab or minimized window.", "visibilitychange:hidden");
    }
  }

  private handleWindowBlur() {
    if (this.isRunning) {
      this.registerViolation("TabSwitchOrWindowBlur", "Browser window lost focus.", "window:blur");
    }
  }

  // ── Video frame analysis ──────────────────────────────────────────────────

  private sampleVideoFrame() {
    if (!this.video || !this.canvas || !this.isRunning) return;
    if (this.video.paused || this.video.ended || this.video.readyState < 2) return;

    const ctx = this.canvas.getContext("2d");
    if (!ctx) return;

    const W = 160, H = 120;
    this.canvas.width = W;
    this.canvas.height = H;

    ctx.drawImage(this.video, 0, 0, W, H);
    const imgData = ctx.getImageData(0, 0, W, H);
    const pixels = imgData.data;

    // ── 1. Compute luminance and skin-tone pixel count ───────────────────
    let totalLum = 0;
    const sample: number[] = [];
    let skinPixels = 0;
    let skinCentroidX = 0;

    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      totalLum += lum;
      sample.push(lum);

      // Skin tone detection (works across most skin tones under indoor lighting)
      const isSkin = r > 48 && g > 28 && b > 18 && r > g && (r - g) >= 8 && (r - b) >= 12 && Math.abs(g - b) <= 36;
      if (isSkin) {
        const pixelIndex = i / 4;
        const px = pixelIndex % W;
        skinPixels++;
        skinCentroidX += px;
      }
    }

    const avgLum = totalLum / sample.length;
    const centX = skinPixels > 0 ? skinCentroidX / skinPixels : W / 2;

    // ── 2. Frame diff (motion / head movement) ───────────────────────────
    let motionScore = 0;
    if (this.prevFrameSample.length === sample.length) {
      let diffSum = 0;
      for (let i = 0; i < sample.length; i++) {
        diffSum += Math.abs(sample[i] - this.prevFrameSample[i]);
      }
      motionScore = diffSum / sample.length;
    }
    this.prevFrameSample = sample;

    // ── 3. Classify frame ────────────────────────────────────────────────
    let suspicious = false;
    let reason: WarningType = "LookingAwayOrHeadTilt";
    let cameraEvent = "";

    if (avgLum < 12 || avgLum > 248) {
      // Camera obstructed / pitch black / total overexposure
      suspicious = true;
      reason = "CameraObstructedOrNoFace";
      cameraEvent = `avgLum:${avgLum.toFixed(1)}`;
    } else if (skinPixels < 20) {
      // Very few skin pixels → face missing from frame
      suspicious = true;
      reason = "CameraObstructedOrNoFace";
      cameraEvent = `skinPixels:${skinPixels}`;
    } else if (centX < W * 0.2 || centX > W * 0.8) {
      // Face centroid heavily shifted to edge → looking away / leaving seat
      suspicious = true;
      reason = "LookingAwayOrHeadTilt";
      cameraEvent = `centroidX:${centX.toFixed(0)}`;
    } else if (motionScore > 50) {
      // Very high frame diff → sudden major movement (multiple faces / standing)
      suspicious = true;
      reason = "MultipleFacesOrExcessiveMovement";
      cameraEvent = `motion:${motionScore.toFixed(1)}`;
    } else if (motionScore > 32) {
      // Moderate motion → looking away / head tilt
      suspicious = true;
      reason = "LookingAwayOrHeadTilt";
      cameraEvent = `motion:${motionScore.toFixed(1)}`;
    }

    // ── 4. Temporal smoothing: push to rolling buffer ───────────────────
    this.frameBuffer.push({ suspicious, reason });
    if (this.frameBuffer.length > this.BUFFER_SIZE) {
      this.frameBuffer.shift();
    }

    // Only trigger warning if the last N frames are all suspicious with same reason
    if (this.frameBuffer.length === this.BUFFER_SIZE) {
      const allSuspicious = this.frameBuffer.every((f) => f.suspicious);
      const sameReason = this.frameBuffer.every((f) => f.reason === reason);

      if (allSuspicious && sameReason) {
        this.frameBuffer = []; // reset buffer after firing
        let details = "Continuous suspicious camera activity detected.";
        if (reason === "CameraObstructedOrNoFace") {
          details = "Face not detected or camera is obstructed.";
        } else if (reason === "LookingAwayOrHeadTilt") {
          details = "Repeated looking away from screen or significant head movement.";
        } else if (reason === "MultipleFacesOrExcessiveMovement") {
          details = "Large sudden movement detected — possible secondary person or student standing.";
        }
        this.registerViolation(reason, details, cameraEvent);
      }
    }
  }

  // ── Violation registration ────────────────────────────────────────────────

  private registerViolation(type: WarningType, details: string, cameraEvent?: string) {
    const now = Date.now();

    // Enforce cooldown between any two warnings
    if (now - this.lastWarningTimestamp < this.warningCooldownMs) return;
    this.lastWarningTimestamp = now;

    this.currentWarningCount++;

    const riskScore = CAMERA_RISK_WEIGHTS[type] ?? 10;
    this.cumulativeRisk += riskScore;

    const event: ProctoringWarningEvent = {
      warningNum: this.currentWarningCount,
      warningType: type,
      details,
      timestamp: new Date().toISOString(),
      riskScore,
      cumulativeRisk: this.cumulativeRisk,
      cameraEvent,
    };

    this.onWarning(event);

    if (this.currentWarningCount >= this.maxWarnings) {
      this.stop();
      this.onMaxExceeded(event);
    }
  }
}

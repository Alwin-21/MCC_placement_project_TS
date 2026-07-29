/**
 * Anti-Malpractice Proctoring Engine
 *
 * Provides real-time camera movement / face tracking & window visibility monitoring.
 * Uses a continuous sampling debouncer to eliminate single momentary false alerts.
 */

export type WarningType =
  | "TabSwitchOrWindowBlur"
  | "LookingAwayOrHeadTilt"
  | "CameraObstructedOrNoFace"
  | "MultipleFacesOrExcessiveMovement";

export interface ProctoringWarningEvent {
  warningNum: number;
  warningType: WarningType;
  details: string;
  timestamp: string;
}

export interface ProctoringEngineConfig {
  videoElement: HTMLVideoElement | null;
  canvasElement: HTMLCanvasElement | null;
  onWarningTriggered: (event: ProctoringWarningEvent) => void;
  onMaxWarningsExceeded: (lastEvent: ProctoringWarningEvent) => void;
  sampleIntervalMs?: number; // default 800ms
  consecutiveThreshold?: number; // require 2 consecutive suspicious frames to warn
}

export class ProctoringEngine {
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private onWarning: (event: ProctoringWarningEvent) => void;
  private onMaxExceeded: (lastEvent: ProctoringWarningEvent) => void;
  private sampleIntervalMs: number;
  private consecutiveThreshold: number;

  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private currentWarningCount: number = 0;
  private lastWarningTimestamp: number = 0;

  // Frame diff tracking
  private prevFrameData: number[] = [];
  private consecutiveSuspiciousFrames: number = 0;
  private lastSuspiciousReason: WarningType = "LookingAwayOrHeadTilt";

  constructor(config: ProctoringEngineConfig) {
    this.video = config.videoElement;
    this.canvas = config.canvasElement;
    this.onWarning = config.onWarningTriggered;
    this.onMaxExceeded = config.onMaxWarningsExceeded;
    this.sampleIntervalMs = config.sampleIntervalMs || 800;
    this.consecutiveThreshold = config.consecutiveThreshold || 2;

    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleWindowBlur = this.handleWindowBlur.bind(this);
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Attach tab switch and focus listeners
    if (typeof window !== "undefined") {
      document.addEventListener("visibilitychange", this.handleVisibilityChange);
      window.addEventListener("blur", this.handleWindowBlur);
    }

    // Start video sampling interval
    this.intervalId = setInterval(() => {
      this.sampleVideoFrame();
    }, this.sampleIntervalMs);
  }

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
  }

  public setElements(video: HTMLVideoElement | null, canvas: HTMLCanvasElement | null) {
    this.video = video;
    this.canvas = canvas;
  }

  public getWarningCount(): number {
    return this.currentWarningCount;
  }

  private handleVisibilityChange() {
    if (document.hidden && this.isRunning) {
      this.registerViolation("TabSwitchOrWindowBlur", "Student switched tab or minimized browser window.");
    }
  }

  private handleWindowBlur() {
    if (this.isRunning) {
      this.registerViolation("TabSwitchOrWindowBlur", "Window lost focus.");
    }
  }

  private sampleVideoFrame() {
    if (!this.video || !this.canvas || !this.isRunning) return;
    if (this.video.paused || this.video.ended || this.video.readyState < 2) return;

    const ctx = this.canvas.getContext("2d");
    if (!ctx) return;

    const width = 160;
    const height = 120;
    this.canvas.width = width;
    this.canvas.height = height;

    ctx.drawImage(this.video, 0, 0, width, height);
    const imgData = ctx.getImageData(0, 0, width, height);
    const pixels = imgData.data;

    let totalLuminance = 0;
    const currentSample: number[] = [];

    // Subsample pixels (every 4th pixel for speed)
    for (let i = 0; i < pixels.length; i += 16) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      totalLuminance += lum;
      currentSample.push(lum);
    }

    const avgLuminance = totalLuminance / currentSample.length;

    // Check 1: Camera obstructed / pitch black or total wash out
    if (avgLuminance < 10 || avgLuminance > 245) {
      this.consecutiveSuspiciousFrames++;
      this.lastSuspiciousReason = "CameraObstructedOrNoFace";
    } else if (this.prevFrameData.length > 0) {
      // Calculate pixel diff (motion & shift)
      let diffSum = 0;
      for (let i = 0; i < currentSample.length; i++) {
        diffSum += Math.abs(currentSample[i] - this.prevFrameData[i]);
      }
      const avgDiff = diffSum / currentSample.length;

      // Excessive movement / head tilt or face looking away
      if (avgDiff > 45) {
        this.consecutiveSuspiciousFrames++;
        this.lastSuspiciousReason = "MultipleFacesOrExcessiveMovement";
      } else if (avgDiff > 28) {
        this.consecutiveSuspiciousFrames++;
        this.lastSuspiciousReason = "LookingAwayOrHeadTilt";
      } else {
        // Reset consecutive count if frame is normal
        this.consecutiveSuspiciousFrames = Math.max(0, this.consecutiveSuspiciousFrames - 1);
      }
    }

    this.prevFrameData = currentSample;

    // Trigger warning only if consecutive threshold met (reduces false alarms)
    if (this.consecutiveSuspiciousFrames >= this.consecutiveThreshold) {
      this.consecutiveSuspiciousFrames = 0;
      let details = "Continuous suspicious movement detected.";
      if (this.lastSuspiciousReason === "CameraObstructedOrNoFace") {
        details = "Camera stream obstructed or face not visible.";
      } else if (this.lastSuspiciousReason === "LookingAwayOrHeadTilt") {
        details = "Repeated looking away from screen / head tilt.";
      } else if (this.lastSuspiciousReason === "MultipleFacesOrExcessiveMovement") {
        details = "Significant head movement or secondary motion detected.";
      }
      this.registerViolation(this.lastSuspiciousReason, details);
    }
  }

  private registerViolation(type: WarningType, details: string) {
    const now = Date.now();
    // Cooldown buffer of 5 seconds between warning logs
    if (now - this.lastWarningTimestamp < 5000) return;

    this.lastWarningTimestamp = now;
    this.currentWarningCount++;

    const event: ProctoringWarningEvent = {
      warningNum: this.currentWarningCount,
      warningType: type,
      details,
      timestamp: new Date().toISOString(),
    };

    this.onWarning(event);

    if (this.currentWarningCount >= 4) {
      this.stop();
      this.onMaxExceeded(event);
    }
  }
}

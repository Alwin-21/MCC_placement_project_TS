/**
 * Anti-Malpractice Proctoring Engine v3
 *
 * Performs real-time spatial skin-mass analysis on webcam frames to detect:
 *   1. Face Centered (looking straight) → No warning
 *   2. Face Turned Left                → Warning: LookingAway
 *   3. Face Turned Right               → Warning: LookingAway
 *   4. Multiple Faces (2+ persons)     → Warning: MultipleFaces
 *   5. No Face visible                 → Warning: NoFace
 *   6. Phone / rectangular device held → Warning: PhoneDetected
 *   7. Tab switch / window blur        → Warning: TabSwitch
 *
 * Algorithm uses 80×60 pixel canvas samples, skin-tone spatial mass centroid,
 * multi-cluster face detection, and horizontal luminance edge density for phone detection.
 */

export type WarningType =
  | "TabSwitchOrWindowBlur"
  | "LookingAway"
  | "NoFace"
  | "MultipleFaces"
  | "PhoneDetected"
  | "CameraObstructed";

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
  sampleIntervalMs?: number;
  warningCooldownMs?: number;
}

// ── Spatial Skin-Tone Cluster Detector ──────────────────────────────────────
function isSkinPixel(r: number, g: number, b: number): boolean {
  // Broad skin-tone detector for all complexions under indoor lighting
  return (
    r > 50 && g > 30 && b > 20 &&
    r > g && (r - g) >= 7 && (r - b) >= 10 &&
    Math.abs(g - b) <= 40 && r < 240
  );
}

interface SkinCluster {
  minX: number; maxX: number; minY: number; maxY: number;
  centroidX: number; centroidY: number; pixelCount: number;
}

function analyzeFrame(pixels: Uint8ClampedArray, W: number, H: number): {
  totalSkinPixels: number;
  clusters: SkinCluster[];
  leftHalfSkin: number;
  rightHalfSkin: number;
  centerSkin: number;
  centerHorizEdgeDensity: number;
  frameVariance: number;
} {
  const W2 = Math.floor(W / 2);

  // Build skin pixel map grid
  const skinGrid: boolean[] = new Array(W * H).fill(false);
  let totalSkinPixels = 0;
  let leftHalfSkin = 0;
  let rightHalfSkin = 0;
  let centerSkin = 0;
  let totalLum = 0;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      totalLum += lum;

      if (isSkinPixel(r, g, b)) {
        skinGrid[y * W + x] = true;
        totalSkinPixels++;
        if (x < W2) leftHalfSkin++;
        else rightHalfSkin++;
        // "Center" = middle 40% horizontal band
        if (x >= Math.floor(W * 0.30) && x <= Math.floor(W * 0.70)) centerSkin++;
      }
    }
  }

  const avgLum = totalLum / (W * H);
  // Frame variance (low = solid color = obscured)
  let varSum = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      varSum += Math.abs(lum - avgLum);
    }
  }
  const frameVariance = varSum / (W * H);

  // Horizontal luminance edge density in center-left area (phone screen has many sharp edges)
  let horizEdgeCount = 0;
  for (let y = 1; y < H - 1; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const above = (y - 1) * W + x;
      const below = (y + 1) * W + x;
      const lumThis = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
      const lumAbove = 0.299 * pixels[above * 4] + 0.587 * pixels[above * 4 + 1] + 0.114 * pixels[above * 4 + 2];
      const lumBelow = 0.299 * pixels[below * 4] + 0.587 * pixels[below * 4 + 1] + 0.114 * pixels[below * 4 + 2];
      if (Math.abs(lumThis - lumAbove) > 40 || Math.abs(lumThis - lumBelow) > 40) horizEdgeCount++;
    }
  }
  const centerHorizEdgeDensity = horizEdgeCount / (W * H);

  // ── Simple Cluster Detector via horizontal scan bands ──
  // Divide into 3 vertical zones: Top, Middle, Bottom
  // Count skin pixels per zone to detect 2 separate face regions

  const zoneH = Math.floor(H / 3);
  const zoneSkinCounts: { left: number; right: number; total: number }[] = [
    { left: 0, right: 0, total: 0 },
    { left: 0, right: 0, total: 0 },
    { left: 0, right: 0, total: 0 },
  ];

  for (let y = 0; y < H; y++) {
    const zone = Math.min(2, Math.floor(y / zoneH));
    for (let x = 0; x < W; x++) {
      if (skinGrid[y * W + x]) {
        zoneSkinCounts[zone].total++;
        if (x < W2) zoneSkinCounts[zone].left++;
        else zoneSkinCounts[zone].right++;
      }
    }
  }

  // Detect horizontal dual-cluster: significant skin both left AND right half
  const clusters: SkinCluster[] = [];

  // Main cluster (center of mass)
  if (totalSkinPixels > 15) {
    let sumX = 0, sumY = 0;
    let minX = W, maxX = 0, minY = H, maxY = 0;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (skinGrid[y * W + x]) {
          sumX += x; sumY += y;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    clusters.push({
      minX, maxX, minY, maxY,
      centroidX: sumX / totalSkinPixels,
      centroidY: sumY / totalSkinPixels,
      pixelCount: totalSkinPixels,
    });
  }

  // Dual-face cluster: if both left half and right half have substantial independent skin regions
  const leftHalfDense = leftHalfSkin > 20;
  const rightHalfDense = rightHalfSkin > 20;
  if (leftHalfDense && rightHalfDense && Math.min(leftHalfSkin, rightHalfSkin) / totalSkinPixels > 0.22) {
    // Add a second synthetic cluster to signal 2 faces
    clusters.push({
      minX: 0, maxX: W, minY: 0, maxY: H,
      centroidX: W2 - 10,
      centroidY: H / 2,
      pixelCount: leftHalfSkin,
    });
  }

  return { totalSkinPixels, clusters, leftHalfSkin, rightHalfSkin, centerSkin, centerHorizEdgeDensity, frameVariance };
}

// ── ProctoringEngine Class ───────────────────────────────────────────────────
export class ProctoringEngine {
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private onWarning: (event: ProctoringWarningEvent) => void;
  private onMaxExceeded: (lastEvent: ProctoringWarningEvent) => void;
  private sampleIntervalMs: number;
  private warningCooldownMs: number;

  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private currentWarningCount = 0;
  private lastWarningTimestamp = 0;

  // Consecutive suspicious frame counter (reduces false positives)
  private suspiciousStreak = 0;
  private pendingViolationType: WarningType = "NoFace";
  private pendingViolationDetails = "";
  private readonly CONSECUTIVE_REQUIRED = 2; // Require 2 consecutive bad frames

  constructor(config: ProctoringEngineConfig) {
    this.video = config.videoElement;
    this.canvas = config.canvasElement;
    this.onWarning = config.onWarningTriggered;
    this.onMaxExceeded = config.onMaxWarningsExceeded;
    this.sampleIntervalMs = config.sampleIntervalMs ?? 1000;
    this.warningCooldownMs = config.warningCooldownMs ?? 8000;

    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleWindowBlur = this.handleWindowBlur.bind(this);
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    if (typeof window !== "undefined") {
      document.addEventListener("visibilitychange", this.handleVisibilityChange);
      window.addEventListener("blur", this.handleWindowBlur);
    }
    this.intervalId = setInterval(() => this.sampleVideoFrame(), this.sampleIntervalMs);
  }

  public stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (typeof window !== "undefined") {
      document.removeEventListener("visibilitychange", this.handleVisibilityChange);
      window.removeEventListener("blur", this.handleWindowBlur);
    }
    if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
  }

  public setElements(video: HTMLVideoElement | null, canvas: HTMLCanvasElement | null) {
    this.video = video;
    this.canvas = canvas;
  }

  public getWarningCount(): number { return this.currentWarningCount; }

  private handleVisibilityChange() {
    if (document.hidden && this.isRunning) {
      this.registerViolation("TabSwitchOrWindowBlur", "Student switched tab or minimized browser window.");
    }
  }

  private handleWindowBlur() {
    if (this.isRunning) {
      this.registerViolation("TabSwitchOrWindowBlur", "Browser window lost focus — possible alt-tab detected.");
    }
  }

  private sampleVideoFrame() {
    if (!this.video || !this.canvas || !this.isRunning) return;
    if (this.video.paused || this.video.ended || this.video.readyState < 2) return;

    const W = 80, H = 60;
    this.canvas.width = W;
    this.canvas.height = H;
    const ctx = this.canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(this.video, 0, 0, W, H);
    const imgData = ctx.getImageData(0, 0, W, H);
    const pixels = imgData.data;

    const {
      totalSkinPixels,
      clusters,
      leftHalfSkin,
      rightHalfSkin,
      centerSkin,
      centerHorizEdgeDensity,
      frameVariance,
    } = analyzeFrame(pixels, W, H);

    // ── RULE 0: Camera Obstructed (solid frame, near-zero variance) ──
    if (frameVariance < 2.0) {
      this.flagSuspicious("CameraObstructed", "Camera lens appears to be covered or obstructed.");
      return;
    }

    // ── RULE 1: No Face Detected ──
    if (totalSkinPixels < 18) {
      this.flagSuspicious("NoFace", "No face detected in the camera frame. Please sit in front of the camera.");
      return;
    }

    // ── RULE 2: Multiple Faces ──
    if (clusters.length >= 2) {
      this.flagSuspicious("MultipleFaces", "Multiple faces detected in the camera. Only the registered student should be present.");
      return;
    }

    // ── RULE 3: Phone Detected (high horizontal edge density + non-skin luminance block) ──
    // A phone screen held up produces many sharp luminance edges in a rectangular region
    if (centerHorizEdgeDensity > 0.18 && totalSkinPixels < 60) {
      this.flagSuspicious("PhoneDetected", "A rectangular device (phone/tablet) was detected in the camera frame. Please remove all devices.");
      return;
    }

    // ── RULE 4 & 5: Face Turned Left or Right ──
    if (clusters.length > 0 && totalSkinPixels >= 18) {
      const mainCluster = clusters[0];
      const centroidX = mainCluster.centroidX;
      const totalHalf = W;

      // Centroid shifted heavily to left → face turned RIGHT (camera view is mirrored)
      // Centroid shifted heavily to right → face turned LEFT
      const normalizedCentroid = centroidX / totalHalf; // 0.0 = far left, 1.0 = far right

      // Also check the ratio of skin on each half
      const leftRatio = totalSkinPixels > 0 ? leftHalfSkin / totalSkinPixels : 0;
      const rightRatio = totalSkinPixels > 0 ? rightHalfSkin / totalSkinPixels : 0;

      // Face turned away: centroid skewed heavily, center skin is sparse
      const centerRatio = totalSkinPixels > 0 ? centerSkin / totalSkinPixels : 0;

      if (centerRatio < 0.25 && (leftRatio > 0.75 || rightRatio > 0.75)) {
        if (leftRatio > 0.75) {
          this.flagSuspicious("LookingAway", "Student appears to be looking to the right. Please face the camera directly.");
        } else {
          this.flagSuspicious("LookingAway", "Student appears to be looking to the left. Please face the camera directly.");
        }
        return;
      }
    }

    // ── All checks passed: face is centered and looking forward ──
    this.suspiciousStreak = Math.max(0, this.suspiciousStreak - 1);
  }

  private flagSuspicious(type: WarningType, details: string) {
    if (this.pendingViolationType !== type) {
      // New violation type resets streak
      this.suspiciousStreak = 1;
      this.pendingViolationType = type;
      this.pendingViolationDetails = details;
    } else {
      this.suspiciousStreak++;
    }

    if (this.suspiciousStreak >= this.CONSECUTIVE_REQUIRED) {
      this.suspiciousStreak = 0;
      this.registerViolation(this.pendingViolationType, this.pendingViolationDetails);
    }
  }

  private registerViolation(type: WarningType, details: string) {
    const now = Date.now();
    if (now - this.lastWarningTimestamp < this.warningCooldownMs) return;

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


/**
 * Exam Risk Engine
 *
 * Maintains a cumulative risk score during an examination session.
 * Every violation type has a configurable weight. When the cumulative
 * risk score exceeds the AUTO_SUBMIT_THRESHOLD the engine fires the
 * provided onAutoSubmit callback so the exam can be terminated.
 *
 * Uses configurable constants — never hardcoded numbers scattered
 * throughout component code.
 */

// ─── Violation Types ──────────────────────────────────────────────────────────
export type ViolationType =
  | "FaceMissing"
  | "MultipleFaces"
  | "LookingAway"
  | "LeavingSeat"
  | "PhoneDetected"
  | "BookDetected"
  | "AdditionalPerson"
  | "FullscreenExit"
  | "TabSwitch"
  | "WindowBlur"
  | "WindowResize"
  | "DevToolsAttempt"
  | "CameraObstructed"
  | "ExcessiveMovement"
  | "Unknown";

export type ViolationSeverity = "Low" | "Medium" | "High" | "Critical";

// ─── Risk Weights (configurable constants) ────────────────────────────────────
export const VIOLATION_WEIGHTS: Record<ViolationType, number> = {
  FaceMissing:       25,
  MultipleFaces:     70,
  LookingAway:       15,
  LeavingSeat:       60,
  PhoneDetected:     60,
  BookDetected:      50,
  AdditionalPerson:  70,
  FullscreenExit:    25,
  TabSwitch:         25,
  WindowBlur:        20,
  WindowResize:      10,
  DevToolsAttempt:   40,
  CameraObstructed:  25,
  ExcessiveMovement: 15,
  Unknown:           10,
};

// ─── Severity mapping ─────────────────────────────────────────────────────────
export const VIOLATION_SEVERITY: Record<ViolationType, ViolationSeverity> = {
  FaceMissing:       "High",
  MultipleFaces:     "Critical",
  LookingAway:       "Medium",
  LeavingSeat:       "High",
  PhoneDetected:     "Critical",
  BookDetected:      "High",
  AdditionalPerson:  "Critical",
  FullscreenExit:    "High",
  TabSwitch:         "High",
  WindowBlur:        "Medium",
  WindowResize:      "Low",
  DevToolsAttempt:   "High",
  CameraObstructed:  "High",
  ExcessiveMovement: "Medium",
  Unknown:           "Low",
};

// ─── Thresholds ───────────────────────────────────────────────────────────────
/** Risk score above which exam is auto-submitted */
export const AUTO_SUBMIT_THRESHOLD = 200;

/** Cooldown in ms between same-type violation logs (prevents spam) */
export const VIOLATION_COOLDOWN_MS = 8000;

// ─── Violation Log Entry ──────────────────────────────────────────────────────
export interface ViolationLogEntry {
  id: string;               // unique UUID for the entry
  timestamp: string;        // ISO 8601
  type: ViolationType;
  severity: ViolationSeverity;
  details: string;
  riskScore: number;        // score added by this violation
  cumulativeRisk: number;   // total after this violation
  confidence: number;       // 0–1, for camera violations
  browserEvent?: string;    // e.g. "visibilitychange"
  cameraEvent?: string;     // e.g. "frameVariance:55"
}

// ─── Risk Engine ──────────────────────────────────────────────────────────────
export class ExamRiskEngine {
  private cumulativeRisk: number = 0;
  private log: ViolationLogEntry[] = [];
  private lastTimestamps: Partial<Record<ViolationType, number>> = {};
  private onAutoSubmitFn: (log: ViolationLogEntry[]) => void;
  private onViolationFn: (entry: ViolationLogEntry) => void;
  private isTerminated: boolean = false;

  constructor(
    onViolation: (entry: ViolationLogEntry) => void,
    onAutoSubmit: (log: ViolationLogEntry[]) => void
  ) {
    this.onViolationFn = onViolation;
    this.onAutoSubmitFn = onAutoSubmit;
  }

  /**
   * Log a new violation. Enforces per-type cooldown to prevent spam.
   */
  public logViolation(
    type: ViolationType,
    details: string,
    confidence: number = 1.0,
    browserEvent?: string,
    cameraEvent?: string
  ): ViolationLogEntry | null {
    if (this.isTerminated) return null;

    const now = Date.now();
    const lastTime = this.lastTimestamps[type] ?? 0;

    // Enforce cooldown for the same violation type
    if (now - lastTime < VIOLATION_COOLDOWN_MS) return null;
    this.lastTimestamps[type] = now;

    const weight = VIOLATION_WEIGHTS[type] ?? 10;
    const addedRisk = Math.round(weight * confidence);
    this.cumulativeRisk += addedRisk;

    const entry: ViolationLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      type,
      severity: VIOLATION_SEVERITY[type],
      details,
      riskScore: addedRisk,
      cumulativeRisk: this.cumulativeRisk,
      confidence: Math.round(confidence * 100) / 100,
      browserEvent,
      cameraEvent,
    };

    this.log.push(entry);
    this.onViolationFn(entry);

    // Check if auto-submit threshold exceeded
    if (this.cumulativeRisk >= AUTO_SUBMIT_THRESHOLD && !this.isTerminated) {
      this.isTerminated = true;
      this.onAutoSubmitFn([...this.log]);
    }

    return entry;
  }

  /** Returns the current cumulative risk score */
  public getCumulativeRisk(): number {
    return this.cumulativeRisk;
  }

  /** Returns immutable copy of full violation log */
  public getLog(): ViolationLogEntry[] {
    return [...this.log];
  }

  /** Returns true if auto-submit threshold was already triggered */
  public isAutoSubmitTriggered(): boolean {
    return this.isTerminated;
  }

  /** Reset engine (e.g. for testing) */
  public reset() {
    this.cumulativeRisk = 0;
    this.log = [];
    this.lastTimestamps = {};
    this.isTerminated = false;
  }
}

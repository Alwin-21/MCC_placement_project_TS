/**
 * Device Info Collector
 *
 * Gathers browser, OS, screen resolution, timezone, and time information
 * from the client at exam start. Used to create a forensic device fingerprint
 * that is stored alongside the exam attempt for audit purposes.
 */

export interface DeviceInfo {
  browser: string;
  browserVersion: string;
  os: string;
  screenWidth: number;
  screenHeight: number;
  windowWidth: number;
  windowHeight: number;
  colorDepth: number;
  pixelRatio: number;
  timezone: string;
  timeOffset: number;        // UTC offset in minutes
  localTime: string;         // ISO 8601
  language: string;
  cookiesEnabled: boolean;
  doNotTrack: string;
  connectionType: string;    // "4g" | "wifi" | "unknown"
  hardwareConcurrency: number; // CPU core count
  deviceMemory: number;        // GB (if available)
  platform: string;
  touchSupport: boolean;
  fullscreenSupported: boolean;
}

/**
 * Detect browser name from userAgent string.
 * Returns a human-readable name like "Chrome 125", "Firefox 127", etc.
 */
function detectBrowser(): { name: string; version: string } {
  if (typeof navigator === "undefined") return { name: "Unknown", version: "" };

  const ua = navigator.userAgent;

  // Edge (Chromium-based)
  const edgMatch = ua.match(/Edg\/(\d+\.\d+)/);
  if (edgMatch) return { name: "Microsoft Edge", version: edgMatch[1] };

  // Opera
  const opeMatch = ua.match(/OPR\/(\d+)/);
  if (opeMatch) return { name: "Opera", version: opeMatch[1] };

  // Chrome
  const chrMatch = ua.match(/Chrome\/(\d+\.\d+)/);
  if (chrMatch && !ua.includes("Chromium")) return { name: "Chrome", version: chrMatch[1] };

  // Firefox
  const ffMatch = ua.match(/Firefox\/(\d+\.\d+)/);
  if (ffMatch) return { name: "Firefox", version: ffMatch[1] };

  // Safari
  const safMatch = ua.match(/Version\/(\d+\.\d+).*Safari/);
  if (safMatch) return { name: "Safari", version: safMatch[1] };

  // Chromium
  const chromiumMatch = ua.match(/Chromium\/(\d+)/);
  if (chromiumMatch) return { name: "Chromium", version: chromiumMatch[1] };

  return { name: "Unknown", version: "" };
}

/**
 * Detect operating system from userAgent + platform.
 */
function detectOS(): string {
  if (typeof navigator === "undefined") return "Unknown";

  const ua = navigator.userAgent;
  if (ua.includes("Win")) return "Windows";
  if (ua.includes("Mac") && !ua.includes("iPhone") && !ua.includes("iPad")) return "macOS";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
  if (ua.includes("Linux")) return "Linux";
  return "Unknown";
}

/**
 * Detect network connection type (best-effort).
 */
function detectConnectionType(): string {
  try {
    const conn = (navigator as any).connection ||
                 (navigator as any).mozConnection ||
                 (navigator as any).webkitConnection;
    if (conn) return conn.effectiveType || conn.type || "unknown";
  } catch {
    // ignore
  }
  return "unknown";
}

/**
 * Collect all device information. Call this client-side only.
 */
export function collectDeviceInfo(): DeviceInfo {
  const { name: browser, version: browserVersion } = detectBrowser();
  const os = detectOS();

  const fullscreenSupported =
    typeof document !== "undefined" &&
    !!(document.documentElement.requestFullscreen ||
       (document.documentElement as any).webkitRequestFullscreen ||
       (document.documentElement as any).mozRequestFullScreen);

  return {
    browser,
    browserVersion,
    os,
    screenWidth: typeof screen !== "undefined" ? screen.width : 0,
    screenHeight: typeof screen !== "undefined" ? screen.height : 0,
    windowWidth: typeof window !== "undefined" ? window.innerWidth : 0,
    windowHeight: typeof window !== "undefined" ? window.innerHeight : 0,
    colorDepth: typeof screen !== "undefined" ? screen.colorDepth : 0,
    pixelRatio: typeof window !== "undefined" ? window.devicePixelRatio : 1,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timeOffset: new Date().getTimezoneOffset(),
    localTime: new Date().toISOString(),
    language: typeof navigator !== "undefined" ? navigator.language : "unknown",
    cookiesEnabled: typeof navigator !== "undefined" ? navigator.cookieEnabled : false,
    doNotTrack: typeof navigator !== "undefined"
      ? (navigator.doNotTrack ?? (navigator as any).msDoNotTrack ?? "unspecified")
      : "unspecified",
    connectionType: detectConnectionType(),
    hardwareConcurrency: typeof navigator !== "undefined" ? (navigator.hardwareConcurrency || 0) : 0,
    deviceMemory: typeof navigator !== "undefined" ? ((navigator as any).deviceMemory || 0) : 0,
    platform: typeof navigator !== "undefined" ? navigator.platform : "unknown",
    touchSupport: typeof window !== "undefined" && "ontouchstart" in window,
    fullscreenSupported,
  };
}

/**
 * Check if the browser meets minimum requirements for the exam.
 * Returns an array of failed checks (empty = all passed).
 */
export function checkBrowserCompatibility(): string[] {
  const issues: string[] = [];

  if (typeof navigator === "undefined") return ["Browser environment not available"];

  // Minimum screen size: 1024x600
  if (typeof screen !== "undefined") {
    if (screen.width < 1024 || screen.height < 600) {
      issues.push(`Screen too small: ${screen.width}×${screen.height} (minimum: 1024×600)`);
    }
  }

  // Check for getUserMedia support
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    issues.push("Camera API (getUserMedia) not supported in this browser");
  }

  // Check fullscreen API
  if (
    typeof document !== "undefined" &&
    !document.documentElement.requestFullscreen &&
    !(document.documentElement as any).webkitRequestFullscreen &&
    !(document.documentElement as any).mozRequestFullScreen
  ) {
    issues.push("Fullscreen mode is not supported in this browser");
  }

  // Check Internet Explorer (completely unsupported)
  if (navigator.userAgent.includes("MSIE") || navigator.userAgent.includes("Trident/")) {
    issues.push("Internet Explorer is not supported. Please use Chrome, Firefox, or Edge.");
  }

  return issues;
}

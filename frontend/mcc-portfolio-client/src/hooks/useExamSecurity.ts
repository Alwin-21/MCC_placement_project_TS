/**
 * useExamSecurity Hook
 *
 * Attaches all keyboard blockers, fullscreen enforcement, tab-switch detection,
 * context-menu/drag/selection prevention, window-resize detection, and
 * beforeunload warning during an active exam session.
 *
 * Returns:
 *  - requestFullscreen: function to enter fullscreen
 *  - isFullscreen: current fullscreen state
 *  - cleanupSecurity: function to remove all listeners (call on exam end)
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { ViolationType } from "@/utils/examRiskEngine";

interface UseExamSecurityOptions {
  /** Whether security should be active */
  active: boolean;
  /** Callback fired whenever a security violation is detected */
  onViolation: (type: ViolationType, details: string, browserEvent?: string) => void;
}

export function useExamSecurity({ active, onViolation }: UseExamSecurityOptions) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const activeRef = useRef(active);
  const resizeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Keep ref in sync so event listeners always see latest value
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  // ── Fullscreen request ────────────────────────────────────────────────────
  const requestFullscreen = useCallback(async () => {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if ((el as any).webkitRequestFullscreen) {
        await (el as any).webkitRequestFullscreen();
      } else if ((el as any).mozRequestFullScreen) {
        await (el as any).mozRequestFullScreen();
      }
    } catch (err) {
      console.warn("Fullscreen request failed:", err);
    }
  }, []);

  // ── Exit fullscreen (for cleanup) ─────────────────────────────────────────
  const exitFullscreen = useCallback(() => {
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!active) return;

    // ── Keyboard blocker ───────────────────────────────────────────────────
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeRef.current) return;

      const blocked = [
        // Developer / inspection shortcuts
        { key: "F12", plain: true },
        { key: "F5", plain: true },
        // Ctrl combos
        { key: "c", ctrl: true },
        { key: "v", ctrl: true },
        { key: "x", ctrl: true },
        { key: "a", ctrl: true },
        { key: "p", ctrl: true },
        { key: "s", ctrl: true },
        { key: "u", ctrl: true },
        { key: "r", ctrl: true },
        // Ctrl+Shift+I = DevTools
        { key: "i", ctrl: true, shift: true },
        // Ctrl+Shift+J = DevTools console
        { key: "j", ctrl: true, shift: true },
        // Ctrl+Shift+C = Inspector
        { key: "c", ctrl: true, shift: true },
        // Alt+F4 (Windows close)
        { key: "F4", alt: true },
      ];

      const matches = blocked.some((b) => {
        const keyMatch = e.key.toLowerCase() === (b.key as string).toLowerCase();
        const ctrlMatch = !("ctrl" in b) || (b.ctrl && (e.ctrlKey || e.metaKey));
        const shiftMatch = !("shift" in b) || (b.shift && e.shiftKey);
        const altMatch = !("alt" in b) || (b.alt && e.altKey);
        const plainMatch = !("ctrl" in b) && !("shift" in b) && !("alt" in b);
        if (plainMatch) return keyMatch;
        return keyMatch && ctrlMatch && shiftMatch && altMatch;
      });

      if (matches) {
        e.preventDefault();
        e.stopPropagation();

        // Detect DevTools attempts specifically
        if (
          e.key === "F12" ||
          (e.key.toLowerCase() === "i" && (e.ctrlKey || e.metaKey) && e.shiftKey) ||
          (e.key.toLowerCase() === "j" && (e.ctrlKey || e.metaKey) && e.shiftKey)
        ) {
          onViolation("DevToolsAttempt", "Attempted to open developer tools.", "keydown:" + e.key);
        }
      }
    };

    // ── Context menu blocker ───────────────────────────────────────────────
    const handleContextMenu = (e: MouseEvent) => {
      if (!activeRef.current) return;
      e.preventDefault();
      e.stopPropagation();
    };

    // ── Drag & drop blocker ────────────────────────────────────────────────
    const handleDragStart = (e: DragEvent) => {
      if (!activeRef.current) return;
      e.preventDefault();
    };

    // ── Text selection blocker (via CSS is primary; this is a backup) ──────
    const handleSelectStart = (e: Event) => {
      if (!activeRef.current) return;
      e.preventDefault();
    };

    // ── Tab switch / window blur ───────────────────────────────────────────
    const handleVisibilityChange = () => {
      if (!activeRef.current) return;
      if (document.hidden) {
        onViolation("TabSwitch", "Student switched to another tab or minimized browser.", "visibilitychange:hidden");
      }
    };

    const handleWindowBlur = () => {
      if (!activeRef.current) return;
      onViolation("WindowBlur", "Browser window lost focus.", "window:blur");
    };

    // ── Fullscreen change monitor ─────────────────────────────────────────
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement
      );
      setIsFullscreen(isNowFullscreen);

      if (activeRef.current && !isNowFullscreen) {
        onViolation("FullscreenExit", "Student exited fullscreen mode.", "fullscreenchange:exit");
      }
    };

    // ── Window resize / split screen ──────────────────────────────────────
    const handleResize = () => {
      if (!activeRef.current) return;
      // Debounce to avoid spam on resize drag
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = setTimeout(() => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        // Flag if window becomes very small (possible split screen)
        if (w < 900 || h < 500) {
          onViolation(
            "WindowResize",
            `Window resized to small dimensions (${w}×${h}). Possible split-screen attempt.`,
            `resize:${w}x${h}`
          );
        }
      }, 600);
    };

    // ── Before unload warning ─────────────────────────────────────────────
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!activeRef.current) return;
      e.preventDefault();
      e.returnValue = "Leaving this page will end your exam. Are you sure?";
      return e.returnValue;
    };

    // Attach all listeners
    document.addEventListener("keydown", handleKeyDown, { capture: true });
    document.addEventListener("contextmenu", handleContextMenu, { capture: true });
    document.addEventListener("dragstart", handleDragStart, { capture: true });
    document.addEventListener("selectstart", handleSelectStart, { capture: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("resize", handleResize);
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Inject CSS to disable text selection and drag globally during exam
    const styleEl = document.createElement("style");
    styleEl.id = "exam-security-styles";
    styleEl.textContent = `
      .exam-active, .exam-active * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        user-select: none !important;
      }
    `;
    document.head.appendChild(styleEl);
    document.documentElement.classList.add("exam-active");

    return () => {
      document.removeEventListener("keydown", handleKeyDown, { capture: true });
      document.removeEventListener("contextmenu", handleContextMenu, { capture: true });
      document.removeEventListener("dragstart", handleDragStart, { capture: true });
      document.removeEventListener("selectstart", handleSelectStart, { capture: true });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("beforeunload", handleBeforeUnload);

      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);

      // Remove injected styles
      document.getElementById("exam-security-styles")?.remove();
      document.documentElement.classList.remove("exam-active");
    };
  }, [active, onViolation]);

  return { isFullscreen, requestFullscreen, exitFullscreen };
}

"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseResizableSidebarOptions {
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  storageKey?: string;
}

export function useResizableSidebar({
  defaultWidth = 280,
  minWidth = 200,
  maxWidth = 460,
  storageKey = "mcc_sidebar_width",
}: UseResizableSidebarOptions = {}) {
  const [sidebarWidth, setSidebarWidth] = useState<number>(defaultWidth);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const isResizingRef = useRef<boolean>(false);

  // Load saved width from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedWidth = localStorage.getItem(storageKey);
      if (savedWidth) {
        const parsed = parseInt(savedWidth, 10);
        if (!isNaN(parsed) && parsed >= minWidth && parsed <= maxWidth) {
          setSidebarWidth(parsed);
        }
      }
    }
  }, [storageKey, minWidth, maxWidth]);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    isResizingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  const resetWidth = useCallback(() => {
    setSidebarWidth(defaultWidth);
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, defaultWidth.toString());
    }
  }, [defaultWidth, storageKey]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      const newWidth = Math.min(Math.max(e.clientX, minWidth), maxWidth);
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        setIsResizing(false);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        if (typeof window !== "undefined") {
          setSidebarWidth((currentWidth) => {
            localStorage.setItem(storageKey, currentWidth.toString());
            return currentWidth;
          });
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [minWidth, maxWidth, storageKey]);

  return {
    sidebarWidth,
    isResizing,
    startResizing,
    resetWidth,
  };
}

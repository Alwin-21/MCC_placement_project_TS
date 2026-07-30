/**
 * useAutoSave Hook
 *
 * Debounced autosave that fires every AUTOSAVE_INTERVAL_MS (default 5 seconds)
 * and also immediately on every answer change.
 *
 * Features:
 *  - Queues the latest pending answer and flushes on interval
 *  - Retries up to MAX_RETRIES times on network failure
 *  - Exposes isSaving / lastSavedAt / saveError state for UI feedback
 *  - Cleans up interval on unmount to prevent memory leaks
 */

import { useEffect, useRef, useState, useCallback } from "react";

const AUTOSAVE_INTERVAL_MS = 5000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;

interface PendingSave {
  questionId: number;
  selectedOption: string;
  attemptId: number;
  assessmentId: number;
}

interface UseAutoSaveOptions {
  /** Whether autosave is active (should be false outside exam view) */
  active: boolean;
  /** Async function that performs the actual API call */
  saveFn: (questionId: number, selectedOption: string) => Promise<void>;
}

export function useAutoSave({ active, saveFn }: UseAutoSaveOptions) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Queue of pending saves (latest per questionId)
  const pendingQueue = useRef<Map<number, string>>(new Map());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const activeRef = useRef(active);
  const isFlushing = useRef(false);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  /**
   * Queue an answer for saving. Any subsequent call for the same questionId
   * replaces the previous pending value (only the latest matters).
   */
  const queueSave = useCallback((questionId: number, selectedOption: string) => {
    pendingQueue.current.set(questionId, selectedOption);
  }, []);

  /**
   * Flush all pending saves. Retries on failure.
   */
  const flushQueue = useCallback(async () => {
    if (!activeRef.current || isFlushing.current) return;
    if (pendingQueue.current.size === 0) return;

    isFlushing.current = true;
    setIsSaving(true);
    setSaveError(null);

    // Snapshot and clear the queue atomically
    const snapshot = new Map(pendingQueue.current);
    pendingQueue.current.clear();

    let success = true;

    for (const [questionId, selectedOption] of snapshot.entries()) {
      let attempts = 0;
      let saved = false;

      while (attempts < MAX_RETRIES && !saved) {
        try {
          await saveFn(questionId, selectedOption);
          saved = true;
        } catch (err) {
          attempts++;
          if (attempts < MAX_RETRIES) {
            await new Promise((res) => setTimeout(res, RETRY_DELAY_MS));
          } else {
            success = false;
            // Put back into queue for next cycle if all retries failed
            pendingQueue.current.set(questionId, selectedOption);
            setSaveError("Autosave failed. Retrying next cycle.");
          }
        }
      }
    }

    if (success) {
      setLastSavedAt(new Date());
    }

    setIsSaving(false);
    isFlushing.current = false;
  }, [saveFn]);

  // Start / stop autosave interval
  useEffect(() => {
    if (!active) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      flushQueue();
    }, AUTOSAVE_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [active, flushQueue]);

  return {
    queueSave,
    flushQueue,
    isSaving,
    lastSavedAt,
    saveError,
  };
}

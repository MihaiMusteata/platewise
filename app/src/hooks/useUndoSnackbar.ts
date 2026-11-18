import { useCallback, useEffect, useRef, useState } from 'react';

/** How long the undo snackbar stays on screen (spec: "Anulează" for 5 s). */
export const UNDO_DURATION_MS = 5000;

export interface UndoSnackbarState {
  message: string;
  onUndo: () => void;
}

/**
 * One undo snackbar at a time. `show` replaces any visible snackbar (the earlier action stays
 * done) and restarts the timer; it hides itself after `duration` ms. `undo` runs the callback once.
 */
export function useUndoSnackbar(duration = UNDO_DURATION_MS) {
  const [current, setCurrent] = useState<UndoSnackbarState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timer.current != null) clearTimeout(timer.current);
    timer.current = null;
  };

  const dismiss = useCallback(() => {
    clearTimer();
    setCurrent(null);
  }, []);

  const show = useCallback(
    (message: string, onUndo: () => void) => {
      clearTimer();
      setCurrent({ message, onUndo });
      timer.current = setTimeout(() => {
        timer.current = null;
        setCurrent(null);
      }, duration);
    },
    [duration],
  );

  const undo = useCallback(() => {
    if (!current) return;
    dismiss();
    current.onUndo();
  }, [current, dismiss]);

  useEffect(() => clearTimer, []);

  return { current, show, undo, dismiss };
}

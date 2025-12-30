"use client";

import React, {
  createContext,
  useCallback,
  useReducer,
  useEffect,
  useMemo,
  useRef,
  use,
} from "react";

import { TextDoc } from "@/lib/types";
import {
  calculateWpm,
  calculateAccuracy,
  getInitialTime,
} from "./engine-logic";
import {
  TextMode,
  Keystroke,
  EngineStatus,
  EngineStateCtxType,
  EngineActionsCtxType,
  EngineKeystrokeCtxType,
} from "./types";
import { engineReducer, initialState } from "./reducer";

const EngineStateContext = createContext<EngineStateCtxType | undefined>(
  undefined,
);
const EngineKeystrokeContext = createContext<
  EngineKeystrokeCtxType | undefined
>(undefined);
const EngineActionsContext = createContext<EngineActionsCtxType | undefined>(
  undefined,
);

type EngineProviderProps = {
  children: React.ReactNode;
  data: { textData: TextDoc | null; mode: TextMode };
};

export const EngineProvider = ({ children, data }: EngineProviderProps) => {
  const { textData, mode } = data;
  const [state, dispatch] = useReducer(engineReducer, {
    ...initialState,
    timeLeft: getInitialTime(mode),
  });

  const keystrokes = useRef<Keystroke[]>([]);
  const statusRef = useRef(state.status);
  const startedAtRef = useRef<number | null>(null);
  const accumulatedTimeRef = useRef(0);
  const hasUpdatedStatsRef = useRef(false);

  // Handle status changes and guard against race conditions and stale state
  useEffect(() => {
    statusRef.current = state.status;
  }, [state.status]);

  /* -------------------- ACTIONS -------------------- */

  const getTimeElapsed = useCallback(() => {
    const currentElapsed = startedAtRef.current
      ? Date.now() - startedAtRef.current
      : 0;
    return accumulatedTimeRef.current + currentElapsed;
  }, []);

  const resetSession = useCallback(() => {
    dispatch({ type: "RESET", timeLeft: getInitialTime(mode) });
    keystrokes.current = [];
    startedAtRef.current = null;
    accumulatedTimeRef.current = 0;
    hasUpdatedStatsRef.current = false;
  }, [mode]);

  const startSession = useCallback(() => {
    dispatch({ type: "START", timestamp: Date.now() });
    startedAtRef.current = Date.now();
    accumulatedTimeRef.current = 0;
    hasUpdatedStatsRef.current = false;
  }, []);

  const pauseSession = useCallback(() => {
    if (statusRef.current !== "typing") return;
    dispatch({ type: "PAUSE", timestamp: Date.now() });
    if (startedAtRef.current) {
      accumulatedTimeRef.current += Date.now() - startedAtRef.current;
      startedAtRef.current = null;
    }
  }, []);

  const resumeSession = useCallback(() => {
    if (statusRef.current !== "paused") return;
    dispatch({ type: "RESUME", timestamp: Date.now() });
    startedAtRef.current = Date.now();
  }, []);

  const endSession = useCallback(() => {
    if (statusRef.current !== "typing" && statusRef.current !== "paused")
      return;
    if (statusRef.current === "typing" && startedAtRef.current) {
      accumulatedTimeRef.current += Date.now() - startedAtRef.current;
    }
    dispatch({ type: "END", timestamp: Date.now() });
    startedAtRef.current = null;
  }, []);

  const setStatus = useCallback((status: EngineStatus) => {
    dispatch({ type: "SET_STATUS", status });
  }, []);

  const setCursor = useCallback(
    (cursor: number | ((prev: number) => number), extraOffset?: number) => {
      dispatch({
        type: "SET_CURSOR",
        cursor,
        extraOffset,
        charCount: textData?.charCount,
      });
    },
    [textData?.charCount],
  );

  const setShowOverlay = useCallback((show: boolean) => {
    dispatch({ type: "SET_OVERLAY", show });
  }, []);

  /* -------------------- TIMER & METRICS -------------------- */

  // Sync timeLeft when mode changes and reset session
  useEffect(() => {
    resetSession();
  }, [resetSession]);

  // Update metrics when session ends
  useEffect(() => {
    if (state.status !== "finished" || hasUpdatedStatsRef.current) return;
    hasUpdatedStatsRef.current = true;

    const ks = keystrokes.current;
    const totalTyped = ks.filter((k) => k.typedChar !== "Backspace").length;
    const correctKeys = ks.filter((k) => k.isCorrect).length;
    const errorCount = totalTyped - correctKeys;

    const elapsed = getTimeElapsed();
    const finalWpm = calculateWpm(correctKeys, elapsed);
    const finalAccuracy = calculateAccuracy(correctKeys, totalTyped);

    dispatch({
      type: "SET_METRICS",
      wpm: finalWpm,
      accuracy: finalAccuracy,
    });

    // Sync with DB
    if (textData?._id) {
      fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          textId: textData._id,
          category: textData.category,
          difficulty: textData.difficulty,
          mode,
          wpm: finalWpm,
          accuracy: finalAccuracy,
          errorCount,
          durationMs: elapsed,
          startedAt: startedAtRef.current,
          finishedAt: Date.now(),
          keystrokes: ks,
        }),
      })
        .then((res) => {
          if (res.ok) {
            // This event is needed to signal the header that the session and the backend logic has finished
            // and the header can now fetch the best WPM value (so we can't relay solely on the engine status)
            window.dispatchEvent(new CustomEvent("session-finished"));
          }
        })
        .catch((err) => console.error("Failed to sync session:", err));
    }
  }, [state.status, getTimeElapsed, mode, textData]);

  // Update metrics every second
  const intervalRef = useRef<NodeJS.Timeout>(undefined);
  useEffect(() => {
    if (state.status !== "typing") return;
    // Prevent double interval in case of fast re-renders/race conditions
    if (intervalRef.current) return;

    intervalRef.current = setInterval(() => {
      const elapsed = getTimeElapsed();
      const ks = keystrokes.current;
      const correctKeys = ks.filter((k) => k.isCorrect).length;
      const totalTyped = ks.filter((k) => k.typedChar !== "Backspace").length;

      dispatch({
        type: "TICK",
        mode,
        wpm: calculateWpm(correctKeys, elapsed),
        accuracy: calculateAccuracy(correctKeys, totalTyped),
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined; // Reset to allow re-start
      }
    };
  }, [state.status, mode, getTimeElapsed]);

  /* -------------------- PROVIDER VALUES -------------------- */

  const stateValue = useMemo(
    () => ({
      mode,
      textData,
      wpm: state.wpm,
      status: state.status,
      accuracy: state.accuracy,
      timeLeft: state.timeLeft,
      showOverlay: state.showOverlay,
      extraOffset: state.extraOffset,
    }),
    [
      mode,
      textData,
      state.wpm,
      state.status,
      state.accuracy,
      state.timeLeft,
      state.showOverlay,
      state.extraOffset,
    ],
  );

  const keystrokeValue = useMemo(
    () => ({
      cursor: state.cursor,
      extraOffset: state.extraOffset,
      progress: state.progress,
      keystrokes,
    }),
    [state.cursor, state.extraOffset, state.progress],
  );

  const actionsValue = useMemo(
    () => ({
      setCursor,
      setStatus,
      endSession,
      resetSession,
      startSession,
      pauseSession,
      resumeSession,
      getTimeElapsed,
      setShowOverlay,
    }),
    [
      setCursor,
      setStatus,
      endSession,
      resetSession,
      startSession,
      pauseSession,
      resumeSession,
      getTimeElapsed,
      setShowOverlay,
    ],
  );

  return (
    <EngineStateContext.Provider value={stateValue}>
      <EngineActionsContext.Provider value={actionsValue}>
        <EngineKeystrokeContext.Provider value={keystrokeValue}>
          {children}
        </EngineKeystrokeContext.Provider>
      </EngineActionsContext.Provider>
    </EngineStateContext.Provider>
  );
};

export const useEngineState = () => {
  const context = use(EngineStateContext);
  if (context === undefined)
    throw new Error("useEngineState must be used within an EngineProvider");
  return context;
};

export const useEngineKeystroke = () => {
  const context = use(EngineKeystrokeContext);
  if (context === undefined)
    throw new Error("useEngineKeystroke must be used within an EngineProvider");
  return context;
};

export const useEngineActions = () => {
  const context = use(EngineActionsContext);
  if (context === undefined)
    throw new Error("useEngineActions must be used within an EngineProvider");
  return context;
};

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
  const startedAtRef = useRef<number | null>(null);
  const accumulatedTimeRef = useRef(0);
  const hasUpdatedStatsRef = useRef(false);

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
    if (state.status !== "typing") return;
    dispatch({ type: "PAUSE", timestamp: Date.now() });
    if (startedAtRef.current) {
      accumulatedTimeRef.current += Date.now() - startedAtRef.current;
      startedAtRef.current = null;
    }
  }, [state.status]);

  const resumeSession = useCallback(() => {
    if (state.status !== "paused") return;
    dispatch({ type: "RESUME", timestamp: Date.now() });
    startedAtRef.current = Date.now();
  }, [state.status]);

  const endSession = useCallback(() => {
    if (state.status !== "typing" && state.status !== "paused") return;
    if (state.status === "typing" && startedAtRef.current) {
      accumulatedTimeRef.current += Date.now() - startedAtRef.current;
    }
    dispatch({ type: "END", timestamp: Date.now() });
    startedAtRef.current = null;
  }, [state.status]);

  const setStatus = useCallback((status: EngineStatus) => {
    dispatch({ type: "SET_STATUS", status });
  }, []);

  const setCursor = useCallback(
    (cursor: number | ((prev: number) => number)) => {
      dispatch({ type: "SET_CURSOR", cursor, charCount: textData?.charCount });
    },
    [textData?.charCount],
  );

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
      difficulty: textData?.difficulty || "easy",
      category: textData?.category || "general",
      mode,
      status: state.status,
      textData,
      wpm: state.wpm,
      accuracy: state.accuracy,
      timeLeft: state.timeLeft,
    }),
    [mode, state.status, state.wpm, state.accuracy, state.timeLeft, textData],
  );

  const keystrokeValue = useMemo(
    () => ({
      cursor: state.cursor,
      progress: state.progress,
      keystrokes,
    }),
    [state.cursor, state.progress],
  );

  const actionsValue = useMemo(
    () => ({
      setCursor,
      setStatus,
      resetSession,
      startSession,
      pauseSession,
      resumeSession,
      endSession,
      getTimeElapsed,
      tick: () => dispatch({ type: "TICK", mode }),
    }),
    [
      setCursor,
      setStatus,
      resetSession,
      startSession,
      pauseSession,
      resumeSession,
      endSession,
      getTimeElapsed,
      mode,
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

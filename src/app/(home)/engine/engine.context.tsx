"use client";

import React, {
  createContext,
  useCallback,
  useReducer,
  useEffect,
  useMemo,
  useRef,
  useState,
  use,
} from "react";
import { useSearchParams } from "next/navigation";

import { TextDoc } from "@/lib/types";
import {
  calculateWpm,
  calculateAccuracy,
  getInitialTime,
} from "./engine-logic";
import { getInitialSettings } from "./engine-utils";
import {
  TextMode,
  Keystroke,
  EngineStatus,
  EngineConfigCtxType,
  EngineMetricsCtxType,
  EngineActionsCtxType,
  EngineKeystrokeCtxType,
  SoundNames,
  CursorStyle,
} from "./types";
import { useUrlState } from "@/hooks/use-url-state";
import { engineReducer, initialState } from "./reducer";

const EngineConfigCtx = createContext<EngineConfigCtxType | undefined>(
  undefined,
);

const EngineMetricsCtx = createContext<EngineMetricsCtxType | undefined>(
  undefined,
);

const EngineKeystrokeCtx = createContext<EngineKeystrokeCtxType | undefined>(
  undefined,
);

const EngineActionsCtx = createContext<EngineActionsCtxType | undefined>(
  undefined,
);

type EngineProviderProps = {
  children: React.ReactNode;
  data: { textData: TextDoc | null; mode: TextMode };
};

export const EngineProvider = ({ children, data }: EngineProviderProps) => {
  const { textData, mode } = data;
  const { updateURL, isPending } = useUrlState();
  const searchParams = useSearchParams();

  const [state, dispatch] = useReducer(engineReducer, {
    ...initialState,
    timeLeft: getInitialTime(mode),
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const keystrokes = useRef<Keystroke[]>([]);
  const statusRef = useRef(state.status);
  const startedAtRef = useRef<number | null>(null);
  const accumulatedTimeRef = useRef(0);
  const hasUpdatedStatsRef = useRef(false);

  // Handle status changes and guard against race conditions and stale state
  useEffect(() => {
    statusRef.current = state.status;
  }, [state.status]);

  // Sync settings from localStorage on mount to avoid hydration mismatch
  useEffect(() => {
    const settings = getInitialSettings();

    dispatch({ type: "SET_SOUND", soundName: settings.soundName });
    dispatch({ type: "SET_VOLUME", volume: settings.volume });
    dispatch({ type: "SET_MUTED", isMuted: settings.isMuted });
    dispatch({ type: "SET_CURSOR_STYLE", style: settings.cursorStyle });
  }, []);

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
    updateURL({ sid: null });
  }, [mode, updateURL]);

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
    if (statusRef.current !== "typing" && statusRef.current !== "paused") {
      return;
    }
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

  const setSoundName = useCallback((soundName: SoundNames) => {
    dispatch({ type: "SET_SOUND", soundName });
  }, []);

  const setVolume = useCallback((volume: number) => {
    dispatch({ type: "SET_VOLUME", volume });
  }, []);

  const setIsMuted = useCallback((isMuted: boolean) => {
    dispatch({ type: "SET_MUTED", isMuted });
  }, []);

  const setCursorStyle = useCallback((style: CursorStyle) => {
    dispatch({ type: "SET_CURSOR_STYLE", style });
  }, []);

  /* -------------------- EFFECTS -------------------- */

  // Track previous text ID to detect text changes
  const prevTextIdRef = useRef<string | null>(null);
  // Reset session when data changes (category/difficulty change)
  useEffect(() => {
    const currentTextId = textData?._id?.toString() || null;
    // Only reset if the text actually changed (not on initial mount)
    if (prevTextIdRef.current && prevTextIdRef.current !== currentTextId) {
      resetSession();
    }
    prevTextIdRef.current = currentTextId;
  }, [textData?._id, resetSession]);

  /* -------------------- TIMER & METRICS -------------------- */

  // Track previous mode to detect mode changes
  const prevModeRef = useRef<TextMode>(mode);
  // Sync timeLeft when mode changes and reset session
  useEffect(() => {
    if (prevModeRef.current !== mode) resetSession();
    prevModeRef.current = mode;
  }, [mode, resetSession]);

  // Track previous session ID to detect when it's cleared
  const prevSidRef = useRef<string | null>(searchParams.get("sid"));
  // Reset session when session param is cleared (user clicked restart or manually cleared URL)
  useEffect(() => {
    const sessionId = searchParams.get("sid");
    if (prevSidRef.current && !sessionId) resetSession();
    prevSidRef.current = sessionId;
  }, [searchParams, resetSession]);

  // Update metrics when session ends
  useEffect(() => {
    if (state.status !== "finished" || hasUpdatedStatsRef.current) return;

    const ks = keystrokes.current;
    if (ks.length === 0) return;

    hasUpdatedStatsRef.current = true;

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

    const data = {
      textId: textData?._id,
      category: textData?.category,
      difficulty: textData?.difficulty,
      mode,
      wpm: finalWpm,
      accuracy: finalAccuracy,
      charCount: totalTyped,
      errorCount,
      durationMs: elapsed,
      startedAt: startedAtRef.current,
      finishedAt: Date.now(),
      keystrokes: ks,
    };

    if (textData?._id) {
      setIsSyncing(true);
      fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
        .then(async (res) => {
          if (res.ok) {
            const { sessionId } = await res.json();
            if (sessionId) {
              updateURL({ sid: sessionId });
            }
          }
        })
        .catch((err) => console.error("Failed to sync session:", err))
        .finally(() => setIsSyncing(false));
    }
  }, [state.status, getTimeElapsed, mode, textData, updateURL]);

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

  const configValue = useMemo(
    () => ({
      mode,
      textData,
      status: state.status,
      showOverlay: state.showOverlay,
      soundName: state.soundName,
      volume: state.volume,
      isMuted: state.isMuted,
      cursorStyle: state.cursorStyle,
    }),
    [
      mode,
      textData,
      state.status,
      state.showOverlay,
      state.soundName,
      state.volume,
      state.isMuted,
      state.cursorStyle,
    ],
  );

  const metricsValue = useMemo(
    () => ({
      wpm: state.wpm,
      accuracy: state.accuracy,
      timeLeft: state.timeLeft,
      isLoadingResults: isSyncing || isPending,
    }),
    [state.wpm, state.accuracy, state.timeLeft, isSyncing, isPending],
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
      setSoundName,
      setVolume,
      setIsMuted,
      setCursorStyle,
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
      setSoundName,
      setVolume,
      setIsMuted,
      setCursorStyle,
    ],
  );

  return (
    <EngineConfigCtx.Provider value={configValue}>
      <EngineMetricsCtx.Provider value={metricsValue}>
        <EngineActionsCtx.Provider value={actionsValue}>
          <EngineKeystrokeCtx.Provider value={keystrokeValue}>
            {children}
          </EngineKeystrokeCtx.Provider>
        </EngineActionsCtx.Provider>
      </EngineMetricsCtx.Provider>
    </EngineConfigCtx.Provider>
  );
};

export const useEngineConfig = () => {
  const context = use(EngineConfigCtx);
  if (context === undefined)
    throw new Error("useEngineConfig must be used within an EngineProvider");
  return context;
};

export const useEngineKeystroke = () => {
  const context = use(EngineKeystrokeCtx);
  if (context === undefined)
    throw new Error("useEngineKeystroke must be used within an EngineProvider");
  return context;
};

export const useEngineActions = () => {
  const context = use(EngineActionsCtx);
  if (context === undefined)
    throw new Error("useEngineActions must be used within an EngineProvider");
  return context;
};

export const useEngineMetrics = () => {
  const context = use(EngineMetricsCtx);
  if (context === undefined)
    throw new Error("useEngineMetrics must be used within an EngineProvider");
  return context;
};

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
import { TopLoader } from "@/components/top-loader";

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
  const { updateURL: updateURLInternal, isPending } = useUrlState();
  const searchParams = useSearchParams();

  const { textData, mode } = data;
  const sid = searchParams.get("sid");
  const id = textData?._id?.toString() || null;

  const [state, dispatch] = useReducer(engineReducer, {
    ...initialState,
    timeLeft: getInitialTime(mode),
  });

  const lockedCursorRef = useRef(0);
  const accumulatedTimeRef = useRef(0);
  const statusRef = useRef(state.status);
  const hasUpdatedStatsRef = useRef(false);
  const keystrokes = useRef<Keystroke[]>([]);
  const timerRef = useRef<number | null>(null);
  const sessionStartTimeRef = useRef<number | null>(null);

  const [isSyncing, setIsSyncing] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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

  // Handle pending url actions
  useEffect(() => {
    if (!isPending && state.pendingAction) {
      dispatch({ type: "SET_PENDING_ACTION", action: null });
    }
  }, [isPending, state.pendingAction]);

  /* -------------------- ACTIONS -------------------- */

  const updateURL = useCallback(
    (updates: Record<string, string | null>, actionName?: string) => {
      dispatch({ type: "SET_PENDING_ACTION", action: actionName || "global" });
      updateURLInternal(updates);
    },
    [updateURLInternal],
  );

  const getTimeElapsed = useCallback(() => {
    const currentElapsed = timerRef.current ? Date.now() - timerRef.current : 0;
    return accumulatedTimeRef.current + currentElapsed;
  }, []);

  type ResetOptions = {
    showOverlay?: boolean;
    actionName?: string;
    urlUpdates?: Record<string, string | null>;
  };

  const resetSession = useCallback(
    (opts?: ResetOptions) => {
      dispatch({
        type: "RESET",
        timeLeft: getInitialTime(mode),
        showOverlay: opts?.showOverlay,
      });
      keystrokes.current = [];
      timerRef.current = null;
      sessionStartTimeRef.current = null;
      accumulatedTimeRef.current = 0;
      lockedCursorRef.current = 0;
      updateURL({ sid: null, ...opts?.urlUpdates }, opts?.actionName);
    },
    [mode, updateURL],
  );

  const startSession = useCallback(() => {
    dispatch({ type: "START", timestamp: Date.now() });
    const now = Date.now();
    timerRef.current = now;
    sessionStartTimeRef.current = now;
    accumulatedTimeRef.current = 0;
    hasUpdatedStatsRef.current = false;
  }, []);

  const pauseSession = useCallback(() => {
    if (statusRef.current !== "typing") return;
    dispatch({ type: "PAUSE", timestamp: Date.now() });
    if (timerRef.current) {
      accumulatedTimeRef.current += Date.now() - timerRef.current;
      timerRef.current = null;
    }
  }, []);

  const resumeSession = useCallback(() => {
    if (statusRef.current !== "paused") return;
    dispatch({ type: "RESUME", timestamp: Date.now() });
    timerRef.current = Date.now();
  }, []);

  const endSession = useCallback(() => {
    if (statusRef.current !== "typing" && statusRef.current !== "paused") {
      return;
    }
    if (statusRef.current === "typing" && timerRef.current) {
      accumulatedTimeRef.current += Date.now() - timerRef.current;
    }
    dispatch({ type: "END", timestamp: Date.now() });
    timerRef.current = null;
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

  const updateLayout = useCallback(
    (opts?: { shouldReset?: boolean; newStartIndex?: number }) => {
      dispatch({ type: "UPDATE_LAYOUT", ...opts });
    },
    [],
  );

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

  const handleSetIsSettingsOpen = useCallback((open: boolean) => {
    setIsSettingsOpen(open);
  }, []);

  const handleSetIsHistoryOpen = useCallback((open: boolean) => {
    setIsHistoryOpen(open);
  }, []);

  /* -------------------- EFFECTS -------------------- */

  const isTabPressed = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      // Global shortcuts
      if (e.altKey) {
        if (key === "s" && !e.repeat) {
          setIsSettingsOpen((pv) => !pv);
          setIsHistoryOpen(false);
          pauseSession();
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return;
        }
        if (key === "h" && !e.repeat) {
          setIsHistoryOpen((pv) => !pv);
          setIsSettingsOpen(false);
          pauseSession();
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return;
        }
      }

      if (e.key === "Tab") {
        if (!e.repeat) isTabPressed.current = true;

        if (statusRef.current === "typing") {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        }
        return;
      }

      if (isTabPressed.current) {
        // Allow modifiers to pass through while Tab is held
        const isModifier = [
          "Shift",
          "Control",
          "Alt",
          "Meta",
          "CapsLock",
        ].includes(e.key);
        if (isModifier) return;

        if (key === "r" && !e.repeat) {
          resetSession({ showOverlay: false });
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        } else {
          // Block other keys from reaching elsewhere while Tab is held
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        }
        return;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        isTabPressed.current = false;
      }
    };

    const handleBlur = () => {
      isTabPressed.current = false;
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    window.addEventListener("keyup", handleKeyUp, { capture: true });
    window.addEventListener("blur", handleBlur, { capture: true });

    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      window.removeEventListener("keyup", handleKeyUp, { capture: true });
      window.removeEventListener("blur", handleBlur, { capture: true });
    };
  }, [resetSession, setShowOverlay, pauseSession]);

  const prevModeRef = useRef<TextMode>(mode);
  // Reset session when mode changes
  useEffect(() => {
    if (prevModeRef.current !== mode && !sid) {
      resetSession();
    }
    prevModeRef.current = mode;
  }, [mode, resetSession, sid]);

  const prevSidRef = useRef<string | null>(sid);
  // Reset session when sid changes
  useEffect(() => {
    if (prevSidRef.current && !sid) {
      resetSession({ showOverlay: false });
    }
    prevSidRef.current = sid;
  }, [sid, resetSession]);

  const prevIdRef = useRef<string | null>(null);
  // Only show overlay on the very first load
  useEffect(() => {
    if (prevIdRef.current !== id && !sid) {
      resetSession({ showOverlay: prevIdRef.current === null });
    }
    prevIdRef.current = id;
  }, [id, resetSession, sid]);

  /* -------------------- TIMER & METRICS -------------------- */

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
      startedAt: sessionStartTimeRef.current,
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
    if (intervalRef.current || state.status !== "typing") return;

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
        intervalRef.current = undefined;
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
      isSettingsOpen,
      isHistoryOpen,
      isPending,
      pendingAction: state.pendingAction,
      layout: state.layout,
    }),
    [
      mode,
      state.status,
      textData,
      state.showOverlay,
      state.soundName,
      state.volume,
      state.isMuted,
      state.cursorStyle,
      isSettingsOpen,
      isHistoryOpen,
      isPending,
      state.pendingAction,
      state.layout,
    ],
  );

  const metricsValue = useMemo(
    () => ({
      wpm: state.wpm,
      accuracy: state.accuracy,
      timeLeft: state.timeLeft,
      progress: state.progress,
      isLoadingResults: isSyncing,
    }),
    [state.wpm, state.accuracy, state.timeLeft, state.progress, isSyncing],
  );

  const keystrokeValue = useMemo(
    () => ({
      cursor: state.cursor,
      extraOffset: state.extraOffset,
      keystrokes,
      lockedCursorRef,
    }),
    [state.cursor, state.extraOffset],
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
      updateLayout,
      updateURL,
      setSoundName,
      setVolume,
      setIsMuted,
      setCursorStyle,
      setIsSettingsOpen: handleSetIsSettingsOpen,
      setIsHistoryOpen: handleSetIsHistoryOpen,
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
      updateLayout,
      updateURL,
      setSoundName,
      setVolume,
      setIsMuted,
      setCursorStyle,
      handleSetIsSettingsOpen,
      handleSetIsHistoryOpen,
    ],
  );

  return (
    <EngineConfigCtx.Provider value={configValue}>
      <TopLoader isPending={isPending} />
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

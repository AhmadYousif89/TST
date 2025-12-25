"use client";

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";

import {
  TextDoc,
  Keystroke,
  TextDifficulty,
  TextCategory,
  TextMode,
  EngineStatus,
} from "@/lib/types";
import { updateLocalStats } from "@/lib/utils";
import {
  calculateWpm,
  calculateAccuracy,
  getInitialTime,
} from "@/lib/engine-logic";

type EngineContextType = {
  //  Settings
  difficulty: TextDifficulty;
  category: TextCategory;
  mode: TextMode;

  //  State
  status: EngineStatus;
  cursor: number;
  textData: TextDoc | null;
  keystrokes: React.RefObject<Keystroke[]>;

  //  Metrics
  wpm: number;
  accuracy: number;
  timeLeft: number;
  progress: number;

  //  Actions
  setDifficulty: (d: TextDifficulty) => void;
  setCategory: (c: TextCategory) => void;
  setMode: (m: TextMode) => void;
  setCursor: React.Dispatch<React.SetStateAction<number>>;
  setStatus: (s: EngineStatus) => void;
  resetSession: () => void;
  startSession: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
  endSession: () => void;
  getTimeElapsed: () => number;
};

const EngineContext = createContext<EngineContextType | undefined>(undefined);

type EngineProviderProps = {
  children: React.ReactNode;
  data: { textData: TextDoc | null; mode: TextMode };
};

export const EngineProvider = ({ children, data }: EngineProviderProps) => {
  const { textData, mode: initialMode } = data;

  const [cursor, setCursor] = useState(0);
  const [difficulty, setDifficulty] = useState<TextDifficulty>(
    textData?.difficulty || "easy",
  );
  const [category, setCategory] = useState<TextCategory>(
    textData?.category || "general",
  );
  const [mode, setMode] = useState<TextMode>(initialMode || "t:60");
  const [status, setStatus] = useState<EngineStatus>("idle");

  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [timeLeft, setTimeLeft] = useState(() => getInitialTime("t:60"));
  const [progress, setProgress] = useState(0);

  const keystrokes = useRef<Keystroke[]>([]);
  const startedAtRef = useRef<number | null>(null);
  const accumulatedTimeRef = useRef(0);
  const hasUpdatedStatsRef = useRef(false);

  //  Sync progress with cursor
  useEffect(() => {
    if (textData?.charCount) {
      setProgress(Math.min((cursor / textData.charCount) * 100, 100));
    }
  }, [cursor, textData?.charCount]);

  //  Sync timeLeft when mode changes
  useEffect(() => {
    if (status === "idle") {
      setTimeLeft(getInitialTime(mode));
    }
  }, [mode, status]);

  /* -------------------- ACTIONS -------------------- */

  const resetSession = useCallback(() => {
    setWpm(0);
    setCursor(0);
    setProgress(0);
    setAccuracy(100);
    setStatus("idle");
    setTimeLeft(getInitialTime(mode));
    keystrokes.current = [];
    startedAtRef.current = null;
    accumulatedTimeRef.current = 0;
    hasUpdatedStatsRef.current = false;
  }, [mode]);

  const startSession = useCallback(() => {
    setStatus("typing");
    startedAtRef.current = Date.now();
    accumulatedTimeRef.current = 0;
    hasUpdatedStatsRef.current = false;
  }, []);

  const pauseSession = useCallback(() => {
    if (status !== "typing") return;
    setStatus("paused");
    if (startedAtRef.current) {
      accumulatedTimeRef.current += Date.now() - startedAtRef.current;
      startedAtRef.current = null;
    }
  }, [status]);

  const resumeSession = useCallback(() => {
    if (status !== "paused") return;
    setStatus("typing");
    startedAtRef.current = Date.now();
  }, [status]);

  const endSession = useCallback(() => {
    if (status !== "typing" && status !== "paused") return;
    if (status === "typing" && startedAtRef.current) {
      accumulatedTimeRef.current += Date.now() - startedAtRef.current;
    }
    setStatus("finished");
    startedAtRef.current = null;
  }, [status]);

  const getTimeElapsed = useCallback(() => {
    const currentElapsed = startedAtRef.current
      ? Date.now() - startedAtRef.current
      : 0;
    return accumulatedTimeRef.current + currentElapsed;
  }, []);

  /* -------------------- TIMER & METRICS -------------------- */

  //  Update metrics when session ends
  useEffect(() => {
    if (status !== "finished" || hasUpdatedStatsRef.current) return;
    hasUpdatedStatsRef.current = true;

    const ks = keystrokes.current;
    const totalTyped = ks.filter((k) => k.typedChar !== "Backspace").length;
    const correctKeys = ks.filter((k) => k.isCorrect).length;

    const finalWpm = calculateWpm(correctKeys, getTimeElapsed());
    const finalAccuracy = calculateAccuracy(correctKeys, totalTyped);

    updateLocalStats({ wpm: finalWpm, accuracy: finalAccuracy });
    setWpm(finalWpm);
    setAccuracy(finalAccuracy);
  }, [status, cursor, data, getTimeElapsed]);

  //  Update metrics every second
  useEffect(() => {
    if (status !== "typing") return;

    const interval = setInterval(() => {
      if (mode === "passage") {
        //  Count up
        setTimeLeft((prev) => prev + 1);
      } else {
        //  Count down
        setTimeLeft((prev) => {
          if (prev <= 1) {
            endSession();
            return 0;
          }
          return prev - 1;
        });
      }

      const currentElapsed = startedAtRef.current
        ? Date.now() - startedAtRef.current
        : 0;
      const totalElapsedMs = accumulatedTimeRef.current + currentElapsed;

      const ks = keystrokes.current;
      const correctKeys = ks.filter((k) => k.isCorrect).length;
      const calculatedWpm = calculateWpm(correctKeys, totalElapsedMs);
      setWpm(calculatedWpm);

      const totalTyped = ks.filter((k) => k.typedChar !== "Backspace").length;
      const calculatedAccuracy = calculateAccuracy(correctKeys, totalTyped);
      setAccuracy(calculatedAccuracy);
    }, 1000);

    return () => clearInterval(interval);
  }, [status, mode, endSession]);

  return (
    <EngineContext.Provider
      value={{
        difficulty,
        category,
        mode,
        status,
        cursor,
        keystrokes,
        textData,
        wpm,
        accuracy,
        timeLeft,
        progress,
        setDifficulty,
        setCategory,
        setMode,
        setCursor,
        setStatus,
        resetSession,
        startSession,
        pauseSession,
        resumeSession,
        endSession,
        getTimeElapsed,
      }}
    >
      {children}
    </EngineContext.Provider>
  );
};

export const useEngine = () => {
  const context = useContext(EngineContext);
  if (context === undefined) {
    throw new Error("useEngine must be used within an EngineProvider");
  }
  return context;
};

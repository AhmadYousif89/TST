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

const getInitialTime = (m: TextMode) => {
  if (m === "passage") return 0;
  return parseInt(m.split(":")[1]) || 60;
};

type EngineContextType = {
  // Settings
  difficulty: TextDifficulty;
  category: TextCategory;
  mode: TextMode;

  // State
  status: EngineStatus;
  cursor: number;
  textData: TextDoc | null;
  keystrokes: React.RefObject<Keystroke[]>;

  // Metrics
  wpm: number;
  accuracy: number;
  timeLeft: number;
  progress: number;

  // Actions
  setDifficulty: (d: TextDifficulty) => void;
  setCategory: (c: TextCategory) => void;
  setMode: (m: TextMode) => void;
  setCursor: React.Dispatch<React.SetStateAction<number>>;
  setStatus: (s: EngineStatus) => void;
  resetSession: () => void;
  startSession: () => void;
  endSession: () => void;
};

const EngineContext = createContext<EngineContextType | undefined>(undefined);

type EngineProviderProps = {
  children: React.ReactNode;
  data: TextDoc | null;
};

export const EngineProvider = ({ children, data }: EngineProviderProps) => {
  const [cursor, setCursor] = useState(0);
  const [difficulty, setDifficulty] = useState<TextDifficulty>(
    data?.difficulty || "easy",
  );
  const [category, setCategory] = useState<TextCategory>(
    data?.category || "general",
  );
  const [mode, setMode] = useState<TextMode>("t:60");
  const [status, setStatus] = useState<EngineStatus>("idle");

  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [timeLeft, setTimeLeft] = useState(() => getInitialTime("t:60"));
  const [progress, setProgress] = useState(0);

  const keystrokes = useRef<Keystroke[]>([]);
  const startedAtRef = useRef<number | null>(null);

  // Sync progress with cursor
  useEffect(() => {
    if (data?.charCount) {
      setProgress(Math.min((cursor / data.charCount) * 100, 100));
    }
  }, [cursor, data?.charCount]);

  const resetSession = useCallback(() => {
    setWpm(0);
    setCursor(0);
    setProgress(0);
    setAccuracy(100);
    setStatus("idle");
    setTimeLeft(getInitialTime(mode));
    keystrokes.current = [];
    startedAtRef.current = null;
  }, [mode]);

  const startSession = useCallback(() => {
    setStatus("typing");
    startedAtRef.current = Date.now();
  }, []);

  const endSession = useCallback(() => {
    if (status === "finished") return;
    setStatus("finished");

    // Word Metric Validation
    const ks = keystrokes.current;
    const totalTyped = ks.filter((k) => k.typedChar !== "Backspace").length;
    const correctKeys = ks.filter((k) => k.isCorrect).length;
    const finalAccuracy =
      totalTyped === 0 ? 100 : Math.round((correctKeys / totalTyped) * 100);

    const elapsedMs = startedAtRef.current
      ? Date.now() - startedAtRef.current
      : 0;
    const elapsedMinutes = elapsedMs / 60000;

    // Calculate final WPM based on the Actual text wordCount if session finished naturally
    // Otherwise use the standard (correctChars / 5) formula
    let finalWpm = 0;
    if (elapsedMinutes > 0) {
      if (cursor >= (data?.charCount || 0)) {
        // User finished the whole text
        finalWpm = Math.round((data?.wordCount || 0) / elapsedMinutes);
      } else {
        finalWpm = Math.round(correctKeys / 5 / elapsedMinutes);
      }
    }

    updateLocalStats({ wpm: finalWpm, accuracy: finalAccuracy });
    setWpm(finalWpm);
    setAccuracy(finalAccuracy);
  }, [data, cursor]);

  /* -------------------- TIMER & METRICS -------------------- */

  useEffect(() => {
    if (status !== "typing") return;

    const interval = setInterval(() => {
      if (!startedAtRef.current) return;

      // Update timer
      if (mode !== "passage") {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setStatus("finished");
            return 0;
          }
          return prev - 1;
        });
      }

      const elapsedMs = Date.now() - startedAtRef.current;
      const elapsedMinutes = elapsedMs / 60000;
      if (elapsedMinutes <= 0) return;

      // Calc WPM
      // Standard formula: (Correct Characters / 5) / Time (min)
      const correctTyped = keystrokes.current.filter((k) => k.isCorrect).length;
      const calculatedWpm = Math.round(correctTyped / 5 / elapsedMinutes);
      setWpm(calculatedWpm);

      // Calc Accuracy
      const totalTyped = keystrokes.current.filter(
        (k) => k.typedChar !== "Backspace",
      ).length;
      const correctKeys = keystrokes.current.filter((k) => k.isCorrect).length;
      const calculatedAccuracy =
        totalTyped === 0 ? 100 : Math.round((correctKeys / totalTyped) * 100);
      setAccuracy(calculatedAccuracy);
    }, 1000);

    return () => clearInterval(interval);
  }, [status, mode]);

  // Sync timeLeft when mode changes
  useEffect(() => {
    if (status === "idle") {
      setTimeLeft(getInitialTime(mode));
    }
  }, [mode, status]);

  return (
    <EngineContext.Provider
      value={{
        difficulty,
        category,
        mode,
        status,
        cursor,
        keystrokes,
        textData: data,
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
        endSession,
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

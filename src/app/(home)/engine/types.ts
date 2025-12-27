import { TextDoc } from "@/lib/types";

export type TextDifficulty = "easy" | "medium" | "hard";
export type TextCategory = "lyrics" | "general" | "quotes" | "code";
export type TextMode = "t:15" | "t:30" | "t:60" | "t:120" | "t:180" | "passage";

export type CharState = {
  state: "not-typed" | "correct" | "incorrect";
  typedChar: string;
};

export type Keystroke = {
  charIndex: number;
  expectedChar: string;
  typedChar: string;
  positionGroup?: number; // Math.floor(charIndex / 10)
  isCorrect: boolean;
  timestampMs: number; // offset from session start
};

export type EngineStatus = "idle" | "typing" | "paused" | "finished";

export type EngineState = {
  status: EngineStatus;
  timeLeft: number;
  wpm: number;
  cursor: number;
  progress: number;
  accuracy: number;
};

export type EngineStateCtxType = {
  difficulty: TextDifficulty;
  category: TextCategory;
  mode: TextMode;
  status: EngineStatus;
  textData: TextDoc | null;
  keystrokes: React.RefObject<Keystroke[]>;
  wpm: number;
  accuracy: number;
  timeLeft: number;
};

export type EngineKeystrokeCtxType = {
  cursor: number;
  progress: number;
};

export type EngineActionsCtxType = {
  setCursor: (cursor: number | ((prev: number) => number)) => void;
  setStatus: (s: EngineStatus) => void;
  resetSession: () => void;
  startSession: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
  endSession: () => void;
  getTimeElapsed: () => number;
  tick: () => void;
};

export type EngineAction =
  | { type: "RESET"; timeLeft: number }
  | { type: "START"; timestamp: number }
  | { type: "PAUSE"; timestamp: number }
  | { type: "RESUME"; timestamp: number }
  | { type: "END"; timestamp: number }
  | {
      type: "SET_CURSOR";
      cursor: number | ((prev: number) => number);
      charCount?: number;
    }
  | { type: "SET_STATUS"; status: EngineStatus }
  | { type: "TICK"; mode: TextMode; wpm?: number; accuracy?: number }
  | { type: "SET_METRICS"; wpm: number; accuracy: number };

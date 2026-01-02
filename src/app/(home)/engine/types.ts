import { TextDoc } from "@/lib/types";

export type TextDifficulty = "easy" | "medium" | "hard";
export type TextCategory = "lyrics" | "general" | "quotes" | "code";
export type TextMode = "t:15" | "t:30" | "t:60" | "t:120" | "t:180" | "passage";
type SoundName =
  | "beep"
  | "click"
  | "creamy"
  | "hitmarker"
  | "osu"
  | "pop"
  | "punch"
  | "rubber"
  | "typewriter";
export type SoundNames = SoundName | "none";
export type SoundFile = Record<
  SoundName,
  { folder: string; prefix: string; count: number }
>;

export type CharState = {
  state: "not-typed" | "correct" | "incorrect";
  typedChar: string;
  extras?: string[];
};

export type Keystroke = {
  charIndex: number;
  expectedChar: string;
  typedChar: string;
  positionGroup?: number; // Math.floor(charIndex / 10)
  isCorrect: boolean;
  timestampMs: number; // offset from session start
  skipOrigin?: number; // For "Skip Word" behavior: where the cursor was before the jump
};

export type EngineStatus = "idle" | "typing" | "paused" | "finished";

export type EngineState = {
  wpm: number;
  cursor: number;
  timeLeft: number;
  progress: number;
  accuracy: number;
  extraOffset: number;
  status: EngineStatus;
  showOverlay: boolean;
  soundName: SoundNames;
  volume: number;
  isMuted: boolean;
};

export type EngineStateCtxType = {
  mode: TextMode;
  status: EngineStatus;
  textData: TextDoc | null;
  wpm: number;
  accuracy: number;
  timeLeft: number;
  extraOffset: number;
  showOverlay: boolean;
  soundName: SoundNames;
  volume: number;
  isMuted: boolean;
};

export type EngineKeystrokeCtxType = {
  cursor: number;
  progress: number;
  extraOffset: number;
  keystrokes: React.RefObject<Keystroke[]>;
};

export type EngineActionsCtxType = {
  endSession: () => void;
  resetSession: () => void;
  startSession: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
  getTimeElapsed: () => number;
  setStatus: (s: EngineStatus) => void;
  setShowOverlay: (show: boolean) => void;
  setCursor: (
    cursor: number | ((prev: number) => number),
    extraOffset?: number,
  ) => void;
  setSoundName: (name: SoundNames) => void;
  setVolume: (v: number) => void;
  setIsMuted: (m: boolean) => void;
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
      extraOffset?: number;
    }
  | { type: "SET_STATUS"; status: EngineStatus }
  | { type: "TICK"; mode: TextMode; wpm?: number; accuracy?: number }
  | { type: "SET_METRICS"; wpm: number; accuracy: number }
  | { type: "SET_OVERLAY"; show: boolean }
  | { type: "SET_SOUND"; soundName: SoundNames }
  | { type: "SET_VOLUME"; volume: number }
  | { type: "SET_MUTED"; isMuted: boolean };

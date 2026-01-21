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
export type SoundSettings = {
  soundName: SoundNames;
  volume: number;
  isMuted: boolean;
};
export type UserSettings = SoundSettings & {
  cursorStyle: CursorStyle;
};
export type SoundFile = Record<
  SoundName,
  { folder: string; prefix: string; count: number }
>;

export type CursorStyle = "pip" | "box" | "underline";
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
  skipOrigin?: number; // where the cursor was before the jump
};

export type EngineStatus = "idle" | "typing" | "paused" | "finished";

export type EngineState = {
  wpm: number;
  cursor: number;
  timeLeft: number;
  accuracy: number;
  extraOffset: number;
  status: EngineStatus;
  showOverlay: boolean;
  soundName: SoundNames;
  progress: number;
  volume: number;
  isMuted: boolean;
  cursorStyle: CursorStyle;
};

export type EngineConfigCtxType = {
  mode: TextMode;
  status: EngineStatus;
  textData: TextDoc | null;
  showOverlay: boolean;
  soundName: SoundNames;
  volume: number;
  isMuted: boolean;
  cursorStyle: CursorStyle;
  isSettingsOpen: boolean;
  isHistoryOpen: boolean;
  isPending: boolean;
};

export type EngineMetricsCtxType = {
  wpm: number;
  accuracy: number;
  timeLeft: number;
  progress: number;
  isLoadingResults: boolean;
};

export type EngineKeystrokeCtxType = {
  cursor: number;
  extraOffset: number;
  keystrokes: React.RefObject<Keystroke[]>;
};

export type EngineActionsCtxType = {
  endSession: () => void;
  resetSession: (opts?: { showOverlay?: boolean }) => void;
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
  setCursorStyle: (style: CursorStyle) => void;
  setIsSettingsOpen: (open: boolean) => void;
  setIsHistoryOpen: (open: boolean) => void;
};

export type EngineAction =
  | { type: "RESET"; timeLeft: number; showOverlay?: boolean }
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
  | { type: "SET_MUTED"; isMuted: boolean }
  | { type: "SET_CURSOR_STYLE"; style: CursorStyle };

import { ObjectId } from "mongodb";

// texts collection
export type TextDoc = {
  _id: string | ObjectId;

  text: string;
  language: "en" | "ar"; // TODO: add more languages support (Arabic) later on.
  wordCount: number;
  charCount: number;
  category: TextCategory;
  difficulty: TextDifficulty;

  createdAt: Date;
};

// anonymous_users collection
export type AnonUserDoc = {
  _id: string | ObjectId;

  anonUserId: string; // UUID v4 (in localStorage)
  bestWmp: number;
  bestAccuracy: number;
  totalSessions: number;

  createdAt: Date;
  updatedAt: Date;
};

// typing_sessions collection
export type TypingSessionDoc = {
  _id: string | ObjectId;

  anonUserId: string; // references AnonUserDoc._id
  textId: string | ObjectId; // references TextDoc._id

  category: TextCategory;
  difficulty: TextDifficulty;
  mode: TextMode;

  wpm: number;
  accuracy: number;
  errorCount: number;
  durationMs: number;

  startedAt: Date;
  finishedAt: Date;
};

// keystrokes collection
export type KeystrokeDoc = {
  _id: string | ObjectId;

  textId: string | ObjectId;
  sessionId: string | ObjectId;
  anonUserId: string;
  createdAt: Date;
} & Keystroke;

export type Keystroke = {
  charIndex: number;
  expectedChar: string;
  typedChar: string;
  positionGroup?: number; // Math.floor(charIndex / 10)
  isCorrect: boolean;
  timestampMs: number; // offset from session start
};

export type TextDifficulty = "easy" | "medium" | "hard";
export type TextCategory = "lyrics" | "general" | "quotes" | "code";
export type TextMode = "t:15" | "t:30" | "t:60" | "t:120" | "t:180" | "passage";

export type CharState = {
  state: "not-typed" | "correct" | "incorrect";
  typedChar: string;
};

export type EngineStatus = "idle" | "typing" | "paused" | "finished";

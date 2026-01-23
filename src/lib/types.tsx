import { ObjectId } from "mongodb";
import {
  Keystroke,
  TextMode,
  TextCategory,
  TextDifficulty,
} from "@/app/(home)/engine/types";

// texts collection
export type TextDoc = {
  _id: string | ObjectId;

  text: string;
  language: "en" | "ar"; // TODO: add more languages support (Arabic) later on.
  wordCount: number;
  charCount: number;
  category: TextCategory;
  difficulty: TextDifficulty;
  totalCompletions?: number;
  averageWpm?: number;

  createdAt: Date;
};

// anonymous_users collection
export type AnonUserDoc = {
  _id: string | ObjectId;

  anonUserId: string; // UUID v4 (in a cookie)
  bestWpm: number;
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
  charCount: number;
  errorCount: number;
  durationMs: number;
  rawWpm: number;
  consistency: number;
  isInvalid?: boolean; // For spam or invalid sessions
  keystrokes?: KeystrokeDoc[]; // Only for populating session analytics

  startedAt: Date;
  finishedAt: Date;
  isFirst?: boolean;
  isBest?: boolean;
  validSessionsCount?: number;
};

// keystrokes collection
export type KeystrokeDoc = {
  _id: string | ObjectId;

  textId: string | ObjectId;
  sessionId: string | ObjectId;
  anonUserId: string;
  createdAt: Date;
} & Keystroke;

export type AnonUserSessions = {
  trys: number;
  bestWPM: number;
  bestAccuracy: number;
  sids: string[]; // Session IDs
};

export type AnonUserId = string;

export type RecordOfAnonUserSessions = Record<AnonUserId, AnonUserSessions>;

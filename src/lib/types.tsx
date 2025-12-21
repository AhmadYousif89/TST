import { ObjectId } from "mongodb";

export type TextDoc = {
  _id: ObjectId;

  language: "en" | "ar"; // TODO: add more languages support (Arabic) later on.
  category: "lyrics" | "general" | "quotes" | "code";
  difficulty: "easy" | "medium" | "hard";

  text: string;
  wordCount: number;
  charCount: number;

  createdAt: Date;
};

export type AnonUserDoc = {
  _id: ObjectId;

  anonUserId: string; // UUID v4
  createdAt: Date;
};

export type TypingSessionDoc = {
  _id: ObjectId;

  anonUserId: string; // UUID v4 (foreign key)
  textId: ObjectId; // references texts._id

  category: "lyrics" | "general" | "quotes" | "code";
  difficulty: "easy" | "medium" | "hard";
  mode: "timed" | "passage";

  durationMs: number;
  wpm: number;
  accuracy: number;
  errorCount: number;

  startedAt: Date;
  finishedAt: Date;
};

export type KeystrokeDoc = {
  _id: ObjectId;

  textId: ObjectId;
  sessionId: ObjectId; // references typing_sessions._id
  anonUserId: string;

  charIndex: number; // char index in the source text
  expectedChar: string;
  typedChar: string;
  positionGroup: number; // Math.floor(charIndex / 10)
  isCorrect: boolean;

  timestampMs: number; // offset from session start
  createdAt: Date;
};

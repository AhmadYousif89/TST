import { TypingSessionDoc } from "@/lib/types";

export const createMockSession = (
  keystrokes: any[],
  wpm = 50,
  rawWpm = 60,
  consistency = 90,
): TypingSessionDoc => ({
  _id: "session1",
  anonUserId: "user1",
  textId: "text1",
  category: "general",
  difficulty: "easy",
  mode: "t:15",
  wpm,
  rawWpm,
  consistency,
  accuracy: 100,
  charCount: 100,
  errorCount: 0,
  durationMs: 15000,
  keystrokes,
  startedAt: new Date(),
  finishedAt: new Date(),
});

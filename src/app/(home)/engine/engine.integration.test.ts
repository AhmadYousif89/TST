import { describe, it, expect } from "vitest";
import {
  getCharStates,
  calculateWpm,
  calculateAccuracy,
  calculateNextCursor,
} from "./engine-logic";
import { Keystroke } from "./types";

/**
 * Integration tests that simulate the full keystroke → metrics flow.
 * These tests mimic how the TypingEngine component interacts with the context
 * by simulating a sequence of keystrokes and verifying the resulting metrics.
 */

// Helper to simulate typing a sequence of characters
const simulateTyping = (
  text: string,
  typedSequence: string[],
  startTimeMs: number = 0,
  msPerKeystroke: number = 100,
): { keystrokes: Keystroke[]; cursor: number; elapsedMs: number } => {
  const characters = text.split("");
  const keystrokes: Keystroke[] = [];
  let cursor = 0;
  let currentTime = startTimeMs;

  for (const typedChar of typedSequence) {
    if (typedChar === "Backspace") {
      if (cursor > 0) {
        keystrokes.push({
          charIndex: cursor - 1,
          expectedChar: characters[cursor - 1],
          typedChar: "Backspace",
          isCorrect: false,
          timestampMs: currentTime,
        });
        cursor = calculateNextCursor(cursor, "Backspace", characters.length);
      }
    } else {
      const expectedChar = characters[cursor];
      const isCorrect = typedChar === expectedChar;

      keystrokes.push({
        charIndex: cursor,
        expectedChar,
        typedChar,
        isCorrect,
        timestampMs: currentTime,
      });
      cursor = calculateNextCursor(cursor, typedChar, characters.length);
    }
    currentTime += msPerKeystroke;
  }

  return {
    keystrokes,
    cursor,
    elapsedMs: currentTime - startTimeMs,
  };
};

// Helper to calculate metrics from keystrokes
const calculateMetrics = (
  keystrokes: Keystroke[],
  elapsedMs: number,
): { wpm: number; accuracy: number } => {
  const totalTyped = keystrokes.filter(
    (k) => k.typedChar !== "Backspace",
  ).length;
  const correctKeys = keystrokes.filter((k) => k.isCorrect).length;

  return {
    wpm: calculateWpm(correctKeys, elapsedMs),
    accuracy: calculateAccuracy(correctKeys, totalTyped),
  };
};

describe("Integration: Full Typing Session Simulation", () => {
  describe("Perfect typing session", () => {
    const text = "hello";
    const typedSequence = text.split("");

    it("correctly tracks cursor position through perfect typing", () => {
      const { cursor } = simulateTyping(text, typedSequence);
      expect(cursor).toBe(5); // At the end
    });

    it("all characters are marked as correct", () => {
      const { keystrokes } = simulateTyping(text, typedSequence);
      const states = getCharStates(text.split(""), keystrokes);

      expect(states.every((s) => s.state === "correct")).toBe(true);
    });

    it("calculates 100% accuracy", () => {
      const { keystrokes, elapsedMs } = simulateTyping(text, typedSequence);
      const { accuracy } = calculateMetrics(keystrokes, elapsedMs);

      expect(accuracy).toBe(100);
    });

    it("calculates correct WPM for 60 second session", () => {
      // 50 characters = 10 words, typed in 60 seconds = 10 WPM
      const longText = "a".repeat(50);
      const typedSequence = longText.split("");
      const { keystrokes } = simulateTyping(longText, typedSequence, 0, 1200); // 1.2s per char = 60s total

      const { wpm } = calculateMetrics(keystrokes, 60000);
      expect(wpm).toBe(10);
    });
  });

  describe("Typing session with errors", () => {
    const text = "hello";
    const wrongSequence = "hxllo".split("");

    it("tracks incorrect characters", () => {
      // Type "hxllo" instead of "hello"
      const { keystrokes } = simulateTyping(text, wrongSequence);
      const states = getCharStates(text.split(""), keystrokes);

      expect(states[0].state).toBe("correct");
      expect(states[1].state).toBe("incorrect");
      expect(states[1].typedChar).toBe("x");
      expect(states[2].state).toBe("correct");
    });

    it("calculates accuracy with errors", () => {
      // 1 error out of 5 characters = 80% accuracy
      const { keystrokes, elapsedMs } = simulateTyping(text, wrongSequence);
      const { accuracy } = calculateMetrics(keystrokes, elapsedMs);

      expect(accuracy).toBe(80);
    });

    it("WPM only counts correct characters", () => {
      // 4 correct chars out of 5, in 60 seconds
      // 4 chars = 0.8 words, 0.8 words / 1 min = 0.8 WPM (rounds to 1)
      const { keystrokes } = simulateTyping(text, wrongSequence);
      const { wpm } = calculateMetrics(keystrokes, 60000);

      expect(wpm).toBe(1); // 4 correct chars / 5 / 1 minute
    });
  });

  describe("Typing session with backspace corrections", () => {
    const text = "hello";
    const backspaceSequence = ["h", "e", "Backspace"];

    it("cursor moves back on backspace", () => {
      // Type "he", then backspace, cursor should be at 1
      const { cursor } = simulateTyping(text, backspaceSequence);
      expect(cursor).toBe(1);
    });

    it("backspace resets character state to not-typed", () => {
      const { keystrokes } = simulateTyping(text, backspaceSequence);
      const states = getCharStates(text.split(""), keystrokes);

      expect(states[0].state).toBe("correct");
      expect(states[1].state).toBe("not-typed"); // Reset after backspace
    });

    it("correcting an error and retyping correctly", () => {
      // Type "hx", backspace, type "e"
      const { keystrokes } = simulateTyping(text, [...backspaceSequence, "e"]);
      const states = getCharStates(text.split(""), keystrokes);

      expect(states[0].state).toBe("correct");
      expect(states[1].state).toBe("correct"); // Corrected!
      expect(states[1].typedChar).toBe("e");
    });

    it("backspace keystrokes are excluded from accuracy calculation", () => {
      // Type "hx", backspace, type "e" = 3 typed chars (excluding backspace), 2 correct
      // correctKeys = 2 (h, e) // accuracy = 2/3 = 67%
      const { keystrokes, elapsedMs } = simulateTyping(text, [
        "h",
        "x",
        "Backspace",
        "e",
      ]);
      const { accuracy } = calculateMetrics(keystrokes, elapsedMs);

      expect(accuracy).toBe(67); // 2 correct / 3 total
    });
  });

  describe("Complex typing scenarios", () => {
    it("handles multiple backspaces in a row", () => {
      const text = "abc";
      const { cursor, keystrokes } = simulateTyping(text, [
        "a",
        "b",
        "c",
        "Backspace",
        "Backspace",
        "Backspace",
      ]);

      expect(cursor).toBe(0);

      const states = getCharStates(text.split(""), keystrokes);
      expect(states.every((s) => s.state === "not-typed")).toBe(true);
    });

    it("handles backspace at the start (should be ignored)", () => {
      const text = "abc";
      // Note: Our simulateTyping helper already handles this by checking cursor > 0
      const { cursor, keystrokes } = simulateTyping(text, ["Backspace"]);

      expect(cursor).toBe(0);
      expect(keystrokes.length).toBe(0); // No keystroke recorded
    });

    it("handles typing beyond text length", () => {
      const text = "ab";
      const { cursor } = simulateTyping(text, ["a", "b", "c"]);

      // Cursor should stop at text length
      expect(cursor).toBe(2);
    });

    it("handles retyping after full backspace", () => {
      const text = "hi";
      const { keystrokes, cursor } = simulateTyping(text, [
        "h",
        "i",
        "Backspace",
        "Backspace",
        "h",
        "i",
      ]);

      expect(cursor).toBe(2);

      const states = getCharStates(text.split(""), keystrokes);
      expect(states[0].state).toBe("correct");
      expect(states[1].state).toBe("correct");
    });
  });

  describe("Metrics calculation edge cases", () => {
    it("handles empty keystrokes", () => {
      const { wpm, accuracy } = calculateMetrics([], 60000);

      expect(wpm).toBe(0);
      expect(accuracy).toBe(100); // No errors if nothing typed
    });

    it("handles all incorrect keystrokes", () => {
      const text = "abc";
      const { keystrokes, elapsedMs } = simulateTyping(text, ["x", "y", "z"]);
      const { wpm, accuracy } = calculateMetrics(keystrokes, elapsedMs);

      expect(accuracy).toBe(0);
      expect(wpm).toBe(0);
    });

    it("handles very fast typing (high WPM)", () => {
      // 50 chars in 6 seconds = 100 WPM
      const text = "a".repeat(50);
      const { keystrokes } = simulateTyping(text, text.split(""), 0, 120); // 120ms per char

      const { wpm } = calculateMetrics(keystrokes, 6000);
      expect(wpm).toBe(100);
    });

    it("handles very slow typing (low WPM)", () => {
      // 5 chars in 5 minutes = 1 word in 5 min = 0.2 WPM (rounds to 0)
      const text = "hello";
      const { keystrokes } = simulateTyping(text, text.split(""));

      const { wpm } = calculateMetrics(keystrokes, 300000); // 5 minutes
      expect(wpm).toBe(0); // 5 chars = 1 word, 1 word / 5 min = 0.2
    });
  });

  describe("Character state consistency", () => {
    it("maintains correct state count matching cursor position", () => {
      const text = "hello world";
      const typedPortion = "hello ";
      const { keystrokes, cursor } = simulateTyping(
        text,
        typedPortion.split(""),
      );

      const states = getCharStates(text.split(""), keystrokes);

      // Count typed characters
      const typedCount = states.filter((s) => s.state !== "not-typed").length;
      expect(typedCount).toBe(cursor);
    });

    it("untyped characters remain not-typed", () => {
      const text = "hello world";
      const typedPortion = "hello";
      const { keystrokes } = simulateTyping(text, typedPortion.split(""));

      const states = getCharStates(text.split(""), keystrokes);

      // Check remaining characters are not-typed
      for (let i = typedPortion.length; i < text.length; i++) {
        expect(states[i].state).toBe("not-typed");
      }
    });
  });
});

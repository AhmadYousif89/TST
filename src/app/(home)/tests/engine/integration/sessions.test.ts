import { describe, it, expect } from "vitest";
import { simulateTyping, calculateMetrics } from "./helpers";
import { getCharStates } from "../../../engine/engine-logic";

describe("Integration: Typing Sessions", () => {
  const text = "hello";

  describe("Perfect typing session", () => {
    it("correctly tracks cursor position through perfect typing", () => {
      const { cursor } = simulateTyping(text, text.split(""));
      expect(cursor).toBe(5);
    });

    it("all characters are marked as correct", () => {
      const { keystrokes } = simulateTyping(text, text.split(""));
      const states = getCharStates(text.split(""), keystrokes);
      expect(states.every((s) => s.state === "correct")).toBe(true);
    });

    it("calculates 100% accuracy", () => {
      const { keystrokes, elapsedMs } = simulateTyping(text, text.split(""));
      const { accuracy } = calculateMetrics(keystrokes, elapsedMs);
      expect(accuracy).toBe(100);
    });

    it("calculates correct WPM for 60 second session", () => {
      const longText = "a".repeat(50);
      const { keystrokes } = simulateTyping(
        longText,
        longText.split(""),
        0,
        1200,
      );
      const { wpm } = calculateMetrics(keystrokes, 60000);
      expect(wpm).toBe(10);
    });

    it("handles typing beyond text length (edge case)", () => {
      const { cursor } = simulateTyping("ab", ["a", "b", "c"]);
      expect(cursor).toBe(2);
    });
  });

  describe("Typing session with errors", () => {
    it("tracks incorrect characters", () => {
      const { keystrokes } = simulateTyping(text, "hxllo".split(""));
      const states = getCharStates(text.split(""), keystrokes);
      expect(states[1].state).toBe("incorrect");
    });

    it("calculates accuracy with errors", () => {
      const { keystrokes, elapsedMs } = simulateTyping(text, "hxllo".split(""));
      const { accuracy } = calculateMetrics(keystrokes, elapsedMs);
      expect(accuracy).toBe(80);
    });

    it("WPM only counts correct characters", () => {
      const { keystrokes } = simulateTyping(text, "hxllo".split(""));
      const { wpm } = calculateMetrics(keystrokes, 60000);
      expect(wpm).toBe(1);
    });
  });

  describe("Typing session with backspace corrections", () => {
    it("cursor moves back on backspace", () => {
      const { cursor } = simulateTyping(text, ["h", "e", "Backspace"]);
      expect(cursor).toBe(1);
    });

    it("backspace resets character state to not-typed", () => {
      const { keystrokes } = simulateTyping(text, ["h", "e", "Backspace"]);
      const states = getCharStates(text.split(""), keystrokes);
      expect(states[1].state).toBe("not-typed");
    });

    it("correcting an error and retyping correctly", () => {
      const { keystrokes } = simulateTyping(text, ["h", "x", "Backspace", "e"]);
      const states = getCharStates(text.split(""), keystrokes);
      expect(states[1].state).toBe("correct");
    });

    it("backspace keystrokes are excluded from accuracy calculation", () => {
      const { keystrokes, elapsedMs } = simulateTyping(text, [
        "h",
        "x",
        "Backspace",
        "e",
      ]);
      const { accuracy } = calculateMetrics(keystrokes, elapsedMs);
      expect(accuracy).toBe(67);
    });

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
      const { cursor, keystrokes } = simulateTyping(text, ["Backspace"]);
      expect(cursor).toBe(0);
      expect(keystrokes.length).toBe(0);
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
});

describe("Character state consistency", () => {
  const text = "hello world";
  const sequence = "hello ".split("");

  it("maintains correct state count matching cursor position", () => {
    const { keystrokes, cursor } = simulateTyping(text, sequence);
    const states = getCharStates(text.split(""), keystrokes);
    const typedCount = states.filter((s) => s.state !== "not-typed").length;
    expect(typedCount).toBe(cursor);
  });

  it("untyped characters remain not-typed", () => {
    const { keystrokes } = simulateTyping(text, sequence);
    const states = getCharStates(text.split(""), keystrokes);
    for (let i = sequence.length; i < text.length; i++) {
      expect(states[i].state).toBe("not-typed");
    }
  });
});

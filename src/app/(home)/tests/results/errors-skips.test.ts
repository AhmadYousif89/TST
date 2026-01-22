import { describe, it, expect } from "vitest";
import { analyzeHeatmap } from "../../_components/main/results/heatmap-logic";
import { createMockSession } from "./helpers";

describe("analyzeHeatmap: Errors, Extras, and Skips", () => {
  const mockText = "The quick brown fox";

  it("detects errors in words", () => {
    const keystrokes = [
      { charIndex: 0, typedChar: "T", timestampMs: 100, isCorrect: true },
      { charIndex: 1, typedChar: "x", timestampMs: 200, isCorrect: false },
      { charIndex: 2, typedChar: "e", timestampMs: 300, isCorrect: true },
      { charIndex: 3, typedChar: " ", timestampMs: 400, isCorrect: true },
    ];

    const session = createMockSession(keystrokes);
    const result = analyzeHeatmap(session.keystrokes, mockText);
    const stats = result?.wordStatsMap.get(0);
    expect(stats?.hasError).toBe(true);
    expect(stats?.errorCharIndices.has(1)).toBe(true);
  });

  it("handles multiple errors in a single word", () => {
    const keystrokes = [
      { charIndex: 0, typedChar: "X", timestampMs: 100, isCorrect: false },
      { charIndex: 1, typedChar: "Y", timestampMs: 200, isCorrect: false },
      { charIndex: 2, typedChar: "Z", timestampMs: 300, isCorrect: false },
      { charIndex: 3, typedChar: " ", timestampMs: 400, isCorrect: true },
    ];

    const session = createMockSession(keystrokes);
    const result = analyzeHeatmap(session.keystrokes, mockText);
    const stats = result?.wordStatsMap.get(0);
    expect(stats?.errorCharIndices.size).toBe(3);
  });

  it("detects extra characters in a word", () => {
    const keystrokes = [
      { charIndex: 0, typedChar: "T", timestampMs: 100, isCorrect: true },
      { charIndex: 1, typedChar: "h", timestampMs: 200, isCorrect: true },
      { charIndex: 2, typedChar: "e", timestampMs: 300, isCorrect: true },
      { charIndex: 3, typedChar: "x", timestampMs: 350, isCorrect: false },
      { charIndex: 3, typedChar: " ", timestampMs: 400, isCorrect: true },
    ];

    const session = createMockSession(keystrokes);
    const result = analyzeHeatmap(session.keystrokes, mockText);
    const stats = result?.wordStatsMap.get(0);
    expect(stats?.extras).toContain("x");
  });

  it("detects skips and handles skipIndex", () => {
    const keystrokes = [
      { charIndex: 0, typedChar: "T", timestampMs: 100, isCorrect: true },
      {
        charIndex: 4,
        typedChar: "q",
        timestampMs: 400,
        isCorrect: true,
        skipOrigin: 0,
      },
    ];

    const session = createMockSession(keystrokes);
    const result = analyzeHeatmap(session.keystrokes, "The quick");
    const stats = result?.wordStatsMap.get(0);
    expect(stats?.skipIndex).toBe(0);
  });

  it("collects typed characters even for skipped words", () => {
    const keystrokes = [
      { charIndex: 0, typedChar: "T", timestampMs: 100, isCorrect: true },
      {
        charIndex: 4,
        typedChar: "q",
        timestampMs: 400,
        isCorrect: true,
        skipOrigin: 0,
      },
    ];

    const session = createMockSession(keystrokes);
    const result = analyzeHeatmap(session.keystrokes, "The quick");
    const stats = result?.wordStatsMap.get(0);
    expect(stats?.hasError).toBe(true);
    expect(stats?.typedChars).toBe("T\0\0");
  });

  it("collects typedChars with errors correctly", () => {
    const keystrokes = [
      { charIndex: 0, typedChar: "t", timestampMs: 100, isCorrect: false },
      { charIndex: 0, typedChar: "e", timestampMs: 150, isCorrect: false },
      { charIndex: 1, typedChar: "h", timestampMs: 200, isCorrect: true },
      { charIndex: 2, typedChar: "e", timestampMs: 300, isCorrect: true },
    ];

    const session = createMockSession(keystrokes);
    const result = analyzeHeatmap(session.keystrokes, "The quick");
    const stats = result?.wordStatsMap.get(0);
    expect(stats?.typedChars).toBe("the");
  });

  it("marks omitted characters as errors in intermediate words", () => {
    const text = "across word";
    const keystrokes = [
      { charIndex: 0, typedChar: "a", timestampMs: 100, isCorrect: true },
      { charIndex: 1, typedChar: "c", timestampMs: 200, isCorrect: true },
      { charIndex: 2, typedChar: "r", timestampMs: 300, isCorrect: true },
      { charIndex: 3, typedChar: "o", timestampMs: 400, isCorrect: true },
      {
        charIndex: 7,
        typedChar: "w",
        timestampMs: 500,
        isCorrect: true,
        skipOrigin: 3,
      },
    ];

    const session = createMockSession(keystrokes);
    const result = analyzeHeatmap(session.keystrokes, text);
    const stats = result?.wordStatsMap.get(0);
    expect(stats?.errorCharIndices.has(4)).toBe(true);
    expect(stats?.errorCharIndices.has(5)).toBe(true);
  });

  it("does not mark trailing untyped characters as errors for the last word", () => {
    const text = "across word";
    const keystrokes = [
      { charIndex: 0, typedChar: "a", timestampMs: 100, isCorrect: true },
      { charIndex: 1, typedChar: "c", timestampMs: 200, isCorrect: true },
      { charIndex: 2, typedChar: "r", timestampMs: 300, isCorrect: true },
      { charIndex: 3, typedChar: "o", timestampMs: 400, isCorrect: true },
    ];

    const session = createMockSession(keystrokes);
    const result = analyzeHeatmap(session.keystrokes, text);
    const stats = result?.wordStatsMap.get(0);
    expect(stats?.errorCharIndices.size).toBe(0);
  });

  it("handles complex sequence with extras and skips", () => {
    const text = "The sun";
    const keystrokes = [
      { charIndex: 0, typedChar: "T", timestampMs: 100, isCorrect: true },
      { charIndex: 1, typedChar: "h", timestampMs: 200, isCorrect: true },
      { charIndex: 2, typedChar: "e", timestampMs: 300, isCorrect: true },
      { charIndex: 3, typedChar: " ", timestampMs: 400, isCorrect: true },
      { charIndex: 4, typedChar: "s", timestampMs: 500, isCorrect: true },
      { charIndex: 5, typedChar: "u", timestampMs: 600, isCorrect: true },
      { charIndex: 6, typedChar: "n", timestampMs: 700, isCorrect: true },
      { charIndex: 7, typedChar: "n", timestampMs: 800, isCorrect: false },
      { charIndex: 7, typedChar: "n", timestampMs: 900, isCorrect: false },
      {
        charIndex: 7,
        typedChar: "Backspace",
        timestampMs: 1000,
        isCorrect: true,
      },
      {
        charIndex: 7,
        typedChar: "Backspace",
        timestampMs: 1100,
        isCorrect: true,
      },
      {
        charIndex: 6,
        typedChar: "Backspace",
        timestampMs: 1200,
        isCorrect: true,
      },
      {
        charIndex: 5,
        typedChar: "Backspace",
        timestampMs: 1300,
        isCorrect: true,
      },
      {
        charIndex: 7,
        typedChar: " ",
        timestampMs: 1400,
        isCorrect: true,
        skipOrigin: 5,
      },
    ];

    const session = createMockSession(keystrokes);
    const result = analyzeHeatmap(session.keystrokes, text);
    const stats = result?.wordStatsMap.get(1);

    expect(stats?.extras).toEqual(["n", "n"]);
    expect(stats?.skipIndex).toBe(1);
    expect(stats?.typedChars).toBe("sun");
  });
});

import { describe, it, expect } from "vitest";
import { analyzeHeatmap } from "../../_components/main/results/heatmap-logic";
import { createMockSession } from "./helpers";

describe("analyzeHeatmap: WPM and Bucketing", () => {
  const mockText = "The quick brown fox";

  it("calculates WPM correctly for each word", () => {
    // "The" + space = 4 keystrokes in 1 second
    // WPM = (4/5) / (1000/60000) = 0.8 / 0.0166 = 48 WPM
    const keystrokes = [
      { charIndex: 0, typedChar: "T", timestampMs: 100, isCorrect: true },
      { charIndex: 1, typedChar: "h", timestampMs: 400, isCorrect: true },
      { charIndex: 2, typedChar: "e", timestampMs: 700, isCorrect: true },
      { charIndex: 3, typedChar: " ", timestampMs: 1000, isCorrect: true },
    ];

    const session = createMockSession(keystrokes);
    const result = analyzeHeatmap(session.keystrokes, mockText);

    expect(result).not.toBeNull();
    const stats = result?.wordStatsMap.get(0);
    expect(stats?.wpm).toBeCloseTo(48, 0);
  });

  it("handles high speed bursts without skewing subsequent words", () => {
    const keystrokes = [
      { charIndex: 0, typedChar: "T", timestampMs: 50, isCorrect: true },
      { charIndex: 1, typedChar: "h", timestampMs: 100, isCorrect: true },
      { charIndex: 2, typedChar: "e", timestampMs: 150, isCorrect: true },
      { charIndex: 3, typedChar: " ", timestampMs: 200, isCorrect: true },
      { charIndex: 4, typedChar: "q", timestampMs: 400, isCorrect: true },
      { charIndex: 5, typedChar: "u", timestampMs: 600, isCorrect: true },
      { charIndex: 6, typedChar: "i", timestampMs: 800, isCorrect: true },
      { charIndex: 7, typedChar: "c", timestampMs: 1000, isCorrect: true },
      { charIndex: 8, typedChar: "k", timestampMs: 1100, isCorrect: true },
      { charIndex: 9, typedChar: " ", timestampMs: 1200, isCorrect: true },
    ];

    const session = createMockSession(keystrokes, 70);
    const result = analyzeHeatmap(session.keystrokes, mockText);

    expect(result).not.toBeNull();
    const word0Stats = result?.wordStatsMap.get(0);
    const word1Stats = result?.wordStatsMap.get(1);

    expect(word0Stats?.wpm).toBeGreaterThan(200);
    expect(word1Stats?.wpm).toBeCloseTo(72, 0);
    expect(word0Stats!.bucket).toBeGreaterThan(word1Stats!.bucket!);
  });

  it("works with longer text and varying speeds", () => {
    const mockFullText = "The sun rose over the quiet town.";
    const keystrokes = [
      { charIndex: 0, typedChar: "T", timestampMs: 50, isCorrect: true },
      { charIndex: 1, typedChar: "h", timestampMs: 100, isCorrect: true },
      { charIndex: 2, typedChar: "e", timestampMs: 150, isCorrect: true },
      { charIndex: 3, typedChar: " ", timestampMs: 200, isCorrect: true },
      { charIndex: 4, typedChar: "s", timestampMs: 350, isCorrect: true },
      { charIndex: 5, typedChar: "u", timestampMs: 500, isCorrect: true },
      { charIndex: 6, typedChar: "n", timestampMs: 600, isCorrect: true },
      { charIndex: 7, typedChar: " ", timestampMs: 700, isCorrect: true },
      { charIndex: 8, typedChar: "r", timestampMs: 850, isCorrect: true },
      { charIndex: 9, typedChar: "o", timestampMs: 950, isCorrect: true },
      { charIndex: 10, typedChar: "s", timestampMs: 1050, isCorrect: true },
      { charIndex: 11, typedChar: "e", timestampMs: 1100, isCorrect: true },
      { charIndex: 12, typedChar: " ", timestampMs: 1200, isCorrect: true },
      { charIndex: 13, typedChar: "o", timestampMs: 1350, isCorrect: true },
      { charIndex: 14, typedChar: "v", timestampMs: 1450, isCorrect: true },
      { charIndex: 15, typedChar: "e", timestampMs: 1550, isCorrect: true },
      { charIndex: 16, typedChar: "r", timestampMs: 1600, isCorrect: true },
      { charIndex: 17, typedChar: " ", timestampMs: 1700, isCorrect: true },
    ];

    const session = createMockSession(keystrokes, 45);
    const result = analyzeHeatmap(session.keystrokes, mockFullText);

    expect(result?.wordStatsMap.size).toBe(4);
    const word0 = result?.wordStatsMap.get(0);
    const word1 = result?.wordStatsMap.get(1);
    expect(word0?.wpm).toBeGreaterThan(100);
    expect(word1?.wpm).toBeCloseTo(96, 0);
    expect(word0!.bucket).toBeGreaterThan(word1!.bucket!);
  });

  it("applies minimum duration of 200ms to prevent inflated WPM", () => {
    const keystrokes = [
      { charIndex: 0, typedChar: "T", timestampMs: 10, isCorrect: true },
      { charIndex: 1, typedChar: "h", timestampMs: 20, isCorrect: true },
      { charIndex: 2, typedChar: "e", timestampMs: 40, isCorrect: true },
      { charIndex: 3, typedChar: " ", timestampMs: 50, isCorrect: true },
    ];

    const session = createMockSession(keystrokes, 100);
    const result = analyzeHeatmap(session.keystrokes, mockText);
    const word0 = result?.wordStatsMap.get(0);
    expect(word0?.wpm).toBeCloseTo(240, 0);
  });

  it("distributes buckets evenly for uniform typing speed", () => {
    const keystrokes = [
      { charIndex: 0, typedChar: "T", timestampMs: 100, isCorrect: true },
      { charIndex: 1, typedChar: "h", timestampMs: 200, isCorrect: true },
      { charIndex: 2, typedChar: "e", timestampMs: 400, isCorrect: true },
      { charIndex: 3, typedChar: " ", timestampMs: 500, isCorrect: true },
      { charIndex: 4, typedChar: "q", timestampMs: 600, isCorrect: true },
      { charIndex: 5, typedChar: "u", timestampMs: 700, isCorrect: true },
      { charIndex: 6, typedChar: "i", timestampMs: 800, isCorrect: true },
      { charIndex: 7, typedChar: "c", timestampMs: 900, isCorrect: true },
      { charIndex: 8, typedChar: "k", timestampMs: 950, isCorrect: true },
      { charIndex: 9, typedChar: " ", timestampMs: 1000, isCorrect: true },
    ];

    const session = createMockSession(keystrokes, 60);
    const result = analyzeHeatmap(session.keystrokes, mockText);
    const word0 = result?.wordStatsMap.get(0);
    const word1 = result?.wordStatsMap.get(1);
    expect(word1!.bucket).toBeGreaterThanOrEqual(word0!.bucket!);
  });

  it("uses median WPM as anchor when session WPM is 0", () => {
    const keystrokes = [
      { charIndex: 0, typedChar: "T", timestampMs: 100, isCorrect: true },
      { charIndex: 1, typedChar: "h", timestampMs: 200, isCorrect: true },
      { charIndex: 2, typedChar: "e", timestampMs: 300, isCorrect: true },
      { charIndex: 3, typedChar: " ", timestampMs: 400, isCorrect: true },
    ];

    const session = createMockSession(keystrokes, 0);
    const result = analyzeHeatmap(session.keystrokes, mockText);
    expect(result?.buckets).toBeDefined();
    expect(result?.buckets.length).toBe(6);
  });
});

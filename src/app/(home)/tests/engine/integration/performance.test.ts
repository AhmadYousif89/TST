import { describe, it, expect } from "vitest";
import { simulateTyping, calculateMetrics } from "./helpers";
import { Keystroke } from "../../../engine/types";

describe("Performance Metrics: Raw WPM and Consistency", () => {
  it("calculates high raw WPM even with many errors", () => {
    const text = "hello world";
    const typedSequence = "hxxxxxxxxxx".split(""); // 11 keystrokes
    const { keystrokes, elapsedMs } = simulateTyping(
      text,
      typedSequence,
      0,
      100,
    );

    const { wpm, rawWpm } = calculateMetrics(keystrokes, elapsedMs);

    expect(wpm).toBeLessThanOrEqual(11);
    expect(rawWpm).toBe(120);
  });

  it("calculates high consistency for steady typing", () => {
    const text = "a".repeat(10);
    const typedSequence = text.split("");
    const { keystrokes, elapsedMs } = simulateTyping(
      text,
      typedSequence,
      0,
      500,
    );

    const { consistency } = calculateMetrics(keystrokes, elapsedMs);
    expect(consistency).toBeGreaterThan(95);
  });

  it("calculates low consistency for bursty typing", () => {
    const keystrokes: Keystroke[] = [
      {
        charIndex: 0,
        expectedChar: "a",
        typedChar: "a",
        isCorrect: true,
        timestampMs: 100,
      },
      {
        charIndex: 1,
        expectedChar: "a",
        typedChar: "a",
        isCorrect: true,
        timestampMs: 200,
      },
      {
        charIndex: 2,
        expectedChar: "a",
        typedChar: "a",
        isCorrect: true,
        timestampMs: 2000,
      },
    ];
    const { consistency } = calculateMetrics(keystrokes, 2000);
    expect(consistency).toBeLessThan(80);
  });

  it("backspaces contribute to raw WPM but not consistency (if incorrect)", () => {
    const text = "abc";
    const typedSequence = ["a", "x", "Backspace", "b", "c"];
    const { keystrokes, elapsedMs } = simulateTyping(
      text,
      typedSequence,
      0,
      200,
    );

    const { rawWpm } = calculateMetrics(keystrokes, elapsedMs);
    expect(rawWpm).toBe(60);
  });
});

describe("Metrics calculation edge cases", () => {
  it("handles empty keystrokes", () => {
    const { wpm, accuracy } = calculateMetrics([], 60000);
    expect(wpm).toBe(0);
    expect(accuracy).toBe(100);
  });

  it("handles all incorrect keystrokes", () => {
    const text = "abc";
    const { keystrokes, elapsedMs } = simulateTyping(text, ["x", "y", "z"]);
    const { wpm, accuracy } = calculateMetrics(keystrokes, elapsedMs);
    expect(accuracy).toBe(0);
    expect(wpm).toBe(0);
  });

  it("handles very fast typing (high WPM)", () => {
    const text = "a".repeat(50);
    const { keystrokes } = simulateTyping(text, text.split(""), 0, 120);
    const { wpm } = calculateMetrics(keystrokes, 6000);
    expect(wpm).toBe(100);
  });

  it("handles very slow typing (low WPM)", () => {
    const text = "hello";
    const { keystrokes } = simulateTyping(text, text.split(""));
    const { wpm } = calculateMetrics(keystrokes, 300000);
    expect(wpm).toBe(0);
  });
});

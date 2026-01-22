import { describe, it, expect } from "vitest";
import {
  calculateWpm,
  calculateAccuracy,
  calculateRawWpm,
  calculateConsistency,
} from "../../../engine/engine-logic";
import { Keystroke } from "../../../engine/types";

/* ------------------ calculateWpm ------------------ */
describe("calculateWpm", () => {
  it("calculates Wpm correctly for 1 minute", () => {
    // 50 correct chars = 10 words. 10 words / 1 min = 10 WPM
    expect(calculateWpm(50, 60000)).toBe(10);
  });

  it("calculates Wpm correctly for 30 seconds", () => {
    // 50 correct chars = 10 words. 10 words / 0.5 min = 20 WPM
    expect(calculateWpm(50, 30000)).toBe(20);
  });

  it("returns 0 when no correct keys have been typed", () => {
    expect(calculateWpm(0, 60000)).toBe(0);
  });

  it("returns 0 when no time has elapsed", () => {
    expect(calculateWpm(50, 0)).toBe(0);
  });

  it("returns 0 when no correct keys have been typed and no time has elapsed", () => {
    expect(calculateWpm(0, 0)).toBe(0);
  });

  it("rounds the result to the nearest integer", () => {
    expect(calculateWpm(52, 60000)).toBe(10);
    expect(calculateWpm(53, 60000)).toBe(11);
  });

  it("handles very short time intervals (high WPM)", () => {
    expect(calculateWpm(50, 6000)).toBe(100);
  });

  it("handles very long sessions", () => {
    expect(calculateWpm(500, 600000)).toBe(10);
  });

  it("handles negative time (edge case, should return 0)", () => {
    expect(calculateWpm(50, -1000)).toBe(0);
  });
});

/* ------------------ calculateAccuracy ------------------ */
describe("calculateAccuracy", () => {
  it("calculates accuracy correctly", () => {
    expect(calculateAccuracy(90, 100)).toBe(90);
    expect(calculateAccuracy(45, 50)).toBe(90);
  });

  it("returns 100 when no keys have been typed", () => {
    expect(calculateAccuracy(0, 0)).toBe(100);
  });

  it("returns 0 when all keys have been typed incorrectly", () => {
    expect(calculateAccuracy(0, 100)).toBe(0);
  });

  it("rounds the result to the nearest integer", () => {
    expect(calculateAccuracy(199, 200)).toBe(100);
    expect(calculateAccuracy(73, 75)).toBe(97);
  });
});

/* ------------------ calculateRawWpm ------------------ */
describe("calculateRawWpm", () => {
  it("calculates Raw WPM correctly for 1 minute", () => {
    // 100 keystrokes = 20 words. 20 words / 1 min = 20 Raw WPM
    expect(calculateRawWpm(100, 60000)).toBe(20);
  });

  it("calculates Raw WPM correctly for 30 seconds", () => {
    // 50 keystrokes = 10 words. 10 words / 0.5 min = 20 Raw WPM
    expect(calculateRawWpm(50, 30000)).toBe(20);
  });

  it("returns 0 when no time has elapsed", () => {
    expect(calculateRawWpm(100, 0)).toBe(0);
  });

  it("rounds the result correctly", () => {
    expect(calculateRawWpm(52, 60000)).toBe(10);
    expect(calculateRawWpm(53, 60000)).toBe(11);
  });
});

/* ------------------ calculateConsistency ------------------ */
describe("calculateConsistency", () => {
  it("returns 0 for no keystrokes or 0 duration", () => {
    expect(calculateConsistency([], 60000)).toBe(0);
    expect(
      calculateConsistency(
        [
          {
            charIndex: 0,
            expectedChar: "a",
            typedChar: "a",
            isCorrect: true,
            timestampMs: 100,
          },
        ],
        0,
      ),
    ).toBe(0);
  });

  it("returns higher consistency for even typing", () => {
    const keystrokes: Keystroke[] = [];
    for (let i = 0; i < 5; i++) {
      keystrokes.push({
        charIndex: i * 2,
        expectedChar: "a",
        typedChar: "a",
        isCorrect: true,
        timestampMs: i * 1000 + 100,
      });
      keystrokes.push({
        charIndex: i * 2 + 1,
        expectedChar: "a",
        typedChar: "a",
        isCorrect: true,
        timestampMs: i * 1000 + 500,
      });
    }

    const consistency = calculateConsistency(keystrokes, 5000);
    expect(consistency).toBeGreaterThan(95);
  });

  it("returns lower consistency for bursty typing", () => {
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
        timestampMs: 300,
      },
      {
        charIndex: 4,
        expectedChar: "a",
        typedChar: "a",
        isCorrect: true,
        timestampMs: 500,
      },
      {
        charIndex: 5,
        expectedChar: "a",
        typedChar: "a",
        isCorrect: true,
        timestampMs: 2100,
      },
    ];

    const consistency = calculateConsistency(keystrokes, 3000);
    expect(consistency).toBeLessThan(80);
  });

  it("returns 0 if mean speed is 0 (all errors or no typing)", () => {
    const keystrokes: Keystroke[] = [
      {
        charIndex: 0,
        expectedChar: "a",
        typedChar: "b",
        isCorrect: false,
        timestampMs: 100,
      },
    ];
    expect(calculateConsistency(keystrokes, 1000)).toBe(0);
  });
});

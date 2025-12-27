import { describe, it, expect } from "vitest";
import {
  getCharStates,
  calculateWpm,
  calculateAccuracy,
  calculateNextCursor,
  getInitialTime,
} from "./engine-logic";

import { Keystroke } from "./types";

describe("getCharStates", () => {
  const chars = "The quick brown fox".split("");

  it("returns 'not-typed' for characters without keystrokes", () => {
    const keystrokes: Keystroke[] = [];
    const states = getCharStates(chars, keystrokes);
    expect(states[0]).toEqual({
      state: "not-typed",
      typedChar: "",
    });
    expect(states[5]).toEqual({
      state: "not-typed",
      typedChar: "",
    });
  });

  it("returns 'correct' for a correctly typed character", () => {
    const keystrokes: Keystroke[] = [
      {
        charIndex: 0,
        expectedChar: "T",
        typedChar: "T",
        isCorrect: true,
        timestampMs: 100,
      },
    ];
    const states = getCharStates(chars, keystrokes);
    expect(states[0]).toEqual({
      state: "correct",
      typedChar: "T",
    });
  });

  it("returns 'incorrect' for an incorrectly typed character", () => {
    const keystrokes: Keystroke[] = [
      {
        charIndex: 0,
        expectedChar: "T",
        typedChar: "x",
        isCorrect: false,
        timestampMs: 100,
      },
    ];
    const states = getCharStates(chars, keystrokes);
    expect(states[0]).toEqual({
      state: "incorrect",
      typedChar: "x",
    });
  });

  it("neutralizes color (returns 'not-typed') after backspace", () => {
    const keystrokes: Keystroke[] = [
      {
        charIndex: 0,
        expectedChar: "T",
        typedChar: "T",
        isCorrect: true,
        timestampMs: 100,
      },
      {
        charIndex: 0,
        expectedChar: "T",
        typedChar: "Backspace",
        isCorrect: false,
        timestampMs: 200,
      },
    ];
    const states = getCharStates(chars, keystrokes);
    expect(states[0]).toEqual({
      state: "not-typed",
      typedChar: "",
    });
  });

  it("handles re-typing correctly after backspace", () => {
    const keystrokes: Keystroke[] = [
      {
        charIndex: 0,
        expectedChar: "T",
        typedChar: "x",
        isCorrect: false,
        timestampMs: 100,
      },
      {
        charIndex: 0,
        expectedChar: "T",
        typedChar: "Backspace",
        isCorrect: false,
        timestampMs: 200,
      },
      {
        charIndex: 0,
        expectedChar: "T",
        typedChar: "T",
        isCorrect: true,
        timestampMs: 300,
      },
    ];
    const states = getCharStates(chars, keystrokes);
    expect(states[0]).toEqual({
      state: "correct",
      typedChar: "T",
    });
  });

  it("handles backspacing multiple times at the same index", () => {
    const keystrokes: Keystroke[] = [
      {
        charIndex: 0,
        expectedChar: "T",
        typedChar: "a",
        isCorrect: false,
        timestampMs: 100,
      },
      {
        charIndex: 0,
        expectedChar: "T",
        typedChar: "Backspace",
        isCorrect: false,
        timestampMs: 200,
      },
      {
        charIndex: 0,
        expectedChar: "T",
        typedChar: "b",
        isCorrect: false,
        timestampMs: 300,
      },
      {
        charIndex: 0,
        expectedChar: "T",
        typedChar: "Backspace",
        isCorrect: false,
        timestampMs: 400,
      },
      {
        charIndex: 0,
        expectedChar: "T",
        typedChar: "T",
        isCorrect: true,
        timestampMs: 500,
      },
    ];
    const states = getCharStates(chars, keystrokes);
    expect(states[0]).toEqual({
      state: "correct",
      typedChar: "T",
    });
  });

  it("keystroke order determines character state not the timestamps", () => {
    const keystrokes: Keystroke[] = [
      {
        charIndex: 0,
        expectedChar: "T",
        typedChar: "x",
        isCorrect: false,
        timestampMs: 300,
      },
      {
        charIndex: 0,
        expectedChar: "T",
        typedChar: "Backspace",
        isCorrect: false,
        timestampMs: 100,
      },
    ];
    const states = getCharStates(chars, keystrokes);
    expect(states[0]).toEqual({
      state: "not-typed",
      typedChar: "",
    });
  });

  it("does not affect previous correct characters when later characters are incorrect", () => {
    const keystrokes: Keystroke[] = [
      {
        charIndex: 0,
        expectedChar: "T",
        typedChar: "T",
        isCorrect: true,
        timestampMs: 100,
      },
      {
        charIndex: 1,
        expectedChar: "h",
        typedChar: "x",
        isCorrect: false,
        timestampMs: 200,
      },
    ];
    const states = getCharStates(chars, keystrokes);
    expect(states[0]).toEqual({
      state: "correct",
      typedChar: "T",
    });
    expect(states[1]).toEqual({
      state: "incorrect",
      typedChar: "x",
    });
  });

  it("does not neutralize earlier characters when backspacing a later index", () => {
    const keystrokes: Keystroke[] = [
      {
        charIndex: 0,
        expectedChar: "T",
        typedChar: "T",
        isCorrect: true,
        timestampMs: 100,
      },
      {
        charIndex: 1,
        expectedChar: "h",
        typedChar: "h",
        isCorrect: true,
        timestampMs: 200,
      },
      {
        charIndex: 1,
        expectedChar: "h",
        typedChar: "Backspace",
        isCorrect: false,
        timestampMs: 300,
      },
    ];
    const states = getCharStates(chars, keystrokes);
    expect(states[0]).toEqual({
      state: "correct",
      typedChar: "T",
    });
    expect(states[1]).toEqual({
      state: "not-typed",
      typedChar: "",
    });
  });
});

describe("getCharStates - additional edge cases", () => {
  it("returns empty array for empty characters", () => {
    const states = getCharStates([], []);
    expect(states).toEqual([]);
  });

  it("handles special characters correctly", () => {
    const chars = "Hello, World!".split("");
    const keystrokes: Keystroke[] = [
      {
        charIndex: 5,
        expectedChar: ",",
        typedChar: ",",
        isCorrect: true,
        timestampMs: 100,
      },
      {
        charIndex: 6,
        expectedChar: " ",
        typedChar: " ",
        isCorrect: true,
        timestampMs: 200,
      },
      {
        charIndex: 12,
        expectedChar: "!",
        typedChar: "!",
        isCorrect: true,
        timestampMs: 300,
      },
    ];
    const states = getCharStates(chars, keystrokes);

    expect(states[5]).toEqual({ state: "correct", typedChar: "," });
    expect(states[6]).toEqual({ state: "correct", typedChar: " " });
    expect(states[12]).toEqual({ state: "correct", typedChar: "!" });
  });

  it("handles all characters typed correctly", () => {
    const chars = "abc".split("");
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
        expectedChar: "b",
        typedChar: "b",
        isCorrect: true,
        timestampMs: 200,
      },
      {
        charIndex: 2,
        expectedChar: "c",
        typedChar: "c",
        isCorrect: true,
        timestampMs: 300,
      },
    ];
    const states = getCharStates(chars, keystrokes);

    expect(states.every((s) => s.state === "correct")).toBe(true);
  });

  it("handles all characters typed incorrectly", () => {
    const chars = "abc".split("");
    const keystrokes: Keystroke[] = [
      {
        charIndex: 0,
        expectedChar: "a",
        typedChar: "x",
        isCorrect: false,
        timestampMs: 100,
      },
      {
        charIndex: 1,
        expectedChar: "b",
        typedChar: "y",
        isCorrect: false,
        timestampMs: 200,
      },
      {
        charIndex: 2,
        expectedChar: "c",
        typedChar: "z",
        isCorrect: false,
        timestampMs: 300,
      },
    ];
    const states = getCharStates(chars, keystrokes);

    expect(states.every((s) => s.state === "incorrect")).toBe(true);
  });
});

describe("getInitialTime", () => {
  it("returns 0 for passage mode", () => {
    expect(getInitialTime("passage")).toBe(0);
  });

  it("parses time correctly from mode string", () => {
    expect(getInitialTime("t:15")).toBe(15);
    expect(getInitialTime("t:30")).toBe(30);
    expect(getInitialTime("t:60")).toBe(60);
    expect(getInitialTime("t:120")).toBe(120);
    expect(getInitialTime("t:180")).toBe(180);
  });
});

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
    // 52 correct chars = 10.4 words. 10.4 words / 1 min = 10 WPM
    expect(calculateWpm(52, 60000)).toBe(10);
    // 53 correct chars = 10.6 words. 10.6 words / 1 min = 11 WPM
    expect(calculateWpm(53, 60000)).toBe(11);
  });

  it("handles very short time intervals (high WPM)", () => {
    // 50 correct chars = 10 words. 10 words / 0.1 min (6 seconds) = 100 WPM
    expect(calculateWpm(50, 6000)).toBe(100);
  });

  it("handles very long sessions", () => {
    // 500 correct chars = 100 words. 100 words / 10 min = 10 WPM
    expect(calculateWpm(500, 600000)).toBe(10);
  });

  it("handles negative time (edge case, should return 0)", () => {
    expect(calculateWpm(50, -1000)).toBe(0);
  });
});

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
    // 99.5% -> 100%
    expect(calculateAccuracy(199, 200)).toBe(100);
    // 97.4% -> 97%
    expect(calculateAccuracy(73, 75)).toBe(97);
  });
});

describe("calculateNextCursor", () => {
  const textLength = 20;

  it("increments cursor for normal characters", () => {
    expect(calculateNextCursor(0, "a", textLength)).toBe(1);
    expect(calculateNextCursor(10, "x", textLength)).toBe(11);
  });

  it("decrements cursor for Backspace", () => {
    expect(calculateNextCursor(5, "Backspace", textLength)).toBe(4);
  });

  it("does not decrement cursor below 0", () => {
    expect(calculateNextCursor(0, "Backspace", textLength)).toBe(0);
  });

  it("does not increment cursor beyond text length", () => {
    expect(calculateNextCursor(textLength, "", textLength)).toBe(textLength);
  });

  it("does not decrement cursor beyond text length", () => {
    expect(calculateNextCursor(textLength + 1, "Backspace", textLength)).toBe(
      textLength,
    );
  });
});

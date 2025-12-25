import { describe, it, expect } from "vitest";
import { getCharStates } from "./engine";
import { Keystroke } from "@/lib/types";

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

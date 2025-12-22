import { describe, it, expect } from "vitest";
import { getCharState, type Keystroke } from "./engine";

describe("getCharState", () => {
  it("returns 'not-typed' for characters ahead of the cursor", () => {
    const keystrokes: Keystroke[] = [];
    expect(getCharState(keystrokes, 5, 0)).toBe("not-typed");
    expect(getCharState(keystrokes, 1, 0)).toBe("not-typed");
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
    expect(getCharState(keystrokes, 0, 1)).toBe("correct");
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
    // Mismatched chars don't move the cursor forward automatically
    // getCharState should still report 'incorrect' if we are at that index
    expect(getCharState(keystrokes, 0, 0)).toBe("incorrect");
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
    // After backspacing index 0, cursor would be back at 0
    expect(getCharState(keystrokes, 0, 0)).toBe("not-typed");
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
    expect(getCharState(keystrokes, 0, 1)).toBe("correct");
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
    expect(getCharState(keystrokes, 0, 1)).toBe("correct");
  });

  it("neutralizes color when the LAST action at an index was a backspace, even if there were multiple", () => {
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
    ];
    // Cursor would be at 0 Color should be neutralized.
    expect(getCharState(keystrokes, 0, 0)).toBe("not-typed");
  });

  it("treats untyped characters beyond cursor as 'not-typed'", () => {
    const keystrokes: Keystroke[] = [
      {
        charIndex: 0,
        expectedChar: "T",
        typedChar: "T",
        isCorrect: true,
        timestampMs: 100,
      },
    ];
    expect(getCharState(keystrokes, 1, 1)).toBe("not-typed");
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

    expect(getCharState(keystrokes, 0, 0)).toBe("not-typed");
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

    expect(getCharState(keystrokes, 0, 1)).toBe("correct");
    expect(getCharState(keystrokes, 1, 1)).toBe("incorrect");
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

    expect(getCharState(keystrokes, 0, 1)).toBe("correct");
    expect(getCharState(keystrokes, 1, 1)).toBe("not-typed");
  });

  it("returns not-typed when index is greater than cursor even with keystrokes present", () => {
    const keystrokes: Keystroke[] = [
      {
        charIndex: 2,
        expectedChar: "x",
        typedChar: "x",
        isCorrect: true,
        timestampMs: 100,
      },
    ];

    expect(getCharState(keystrokes, 2, 1)).toBe("not-typed");
  });
});

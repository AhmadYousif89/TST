import { describe, it, expect } from "vitest";
import {
  calculateNextCursor,
  getWordStart,
  getInitialTime,
} from "../../../engine/engine-logic";

/* ------------------ getInitialTime ------------------ */
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

/* ------------------ calculateNextCursor ------------------ */
describe("calculateNextCursor", () => {
  const chars = "hello world".split("");

  it("increments cursor for normal characters", () => {
    expect(calculateNextCursor(0, "a", chars)).toBe(1);
    expect(calculateNextCursor(5, "x", chars)).toBe(6);
  });

  it("decrements cursor for Backspace", () => {
    expect(calculateNextCursor(5, "Backspace", chars)).toBe(4);
  });

  it("stops at lockedCursor during Backspace", () => {
    expect(calculateNextCursor(6, "Backspace", chars, false, 6)).toBe(6);
    expect(calculateNextCursor(7, "Backspace", chars, false, 6)).toBe(6);
  });

  it("Ctrl+Backspace stops at lockedCursor", () => {
    expect(calculateNextCursor(11, "Backspace", chars, true, 6)).toBe(6);
  });

  it("does not decrement cursor below 0", () => {
    expect(calculateNextCursor(0, "Backspace", chars)).toBe(0);
  });

  it("does not increment cursor beyond text length", () => {
    expect(calculateNextCursor(chars.length, "a", chars)).toBe(chars.length);
  });

  it("cursor corrects to max length if out of bounds on backspace", () => {
    expect(calculateNextCursor(chars.length + 1, "Backspace", chars)).toBe(
      chars.length,
    );
  });

  it("Ctrl+Backspace jumps to start of current word", () => {
    // Current word "world" (indices 6-10)
    expect(calculateNextCursor(8, "Backspace", chars, true)).toBe(6);
  });

  it("Ctrl+Backspace from end of word jumps to start of word", () => {
    expect(calculateNextCursor(5, "Backspace", chars, true)).toBe(0);
  });

  it("Ctrl+Backspace from space jumps to start of PREVIOUS word", () => {
    // hello (0-4), space (5), world (6-10)
    // From index 6 (start of world) -> jump to 0
    expect(calculateNextCursor(6, "Backspace", chars, true)).toBe(0);
  });
});

/* ------------------ getWordStart ------------------ */
describe("getWordStart", () => {
  const chars = "the quick brown".split("");

  it("returns 0 for the first word", () => {
    expect(getWordStart(0, chars)).toBe(0);
    expect(getWordStart(1, chars)).toBe(0);
    expect(getWordStart(2, chars)).toBe(0);
  });

  it("returns start of middle words", () => {
    expect(getWordStart(4, chars)).toBe(4);
    expect(getWordStart(6, chars)).toBe(4);
  });

  it("handles cursor on a space (treats as end of prev word)", () => {
    expect(getWordStart(3, chars)).toBe(0);
  });

  it("handles end of string", () => {
    expect(getWordStart(chars.length, chars)).toBe(10);
  });
});

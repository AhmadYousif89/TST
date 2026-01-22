import { describe, it, expect } from "vitest";
import { simulateTyping } from "./helpers";
import {
  getCharStates,
  getWordStart,
  isWordPerfect,
  calculateNextCursor,
} from "../../../engine/engine-logic";

describe("Integration: Engine Mechanics", () => {
  const text = "the sun rose";

  describe("Word Locking Mechanism", () => {
    const text = "the sun rose".split("");

    it("locks the cursor after a correct word + space", () => {
      let lockedCursor = 0;
      const sequence = "the ".split("");
      const { keystrokes, cursor } = simulateTyping(text.join(""), sequence);

      const states = getCharStates(text, keystrokes);
      const wordHeader = getWordStart(3, text);
      const perfect = isWordPerfect(wordHeader, 3, states);

      expect(perfect).toBe(true);
      if (perfect) lockedCursor = 3 + 1;

      expect(lockedCursor).toBe(4);
      expect(cursor).toBe(4);

      const next = calculateNextCursor(
        cursor,
        "Backspace",
        text,
        false,
        lockedCursor,
      );
      expect(next).toBe(4);
    });

    it("does NOT lock the cursor after an incorrect word + space", () => {
      let lockedCursor = 0;
      const sequence = "thx ".split("");
      const { keystrokes, cursor } = simulateTyping(text.join(""), sequence);

      const states = getCharStates(text, keystrokes);
      const wordHeader = getWordStart(3, text);
      const perfect = isWordPerfect(wordHeader, 3, states);

      expect(perfect).toBe(false);
      if (perfect) lockedCursor = 3 + 1;

      expect(lockedCursor).toBe(0);
      expect(cursor).toBe(4);

      const next = calculateNextCursor(
        cursor,
        "Backspace",
        text,
        false,
        lockedCursor,
      );
      expect(next).toBe(3);
    });

    it("allows backspacing within the current word up to the lock", () => {
      const lockedCursor = 4;
      const characters = "the sun".split("");
      const currentCursor = 5;
      expect(
        calculateNextCursor(
          currentCursor,
          "Backspace",
          characters,
          false,
          lockedCursor,
        ),
      ).toBe(4);
      expect(
        calculateNextCursor(4, "Backspace", characters, false, lockedCursor),
      ).toBe(4);
    });
  });

  describe("Extra Character Handling", () => {
    const text = "the sun rose";

    it("accumulates extra characters at a space without moving the cursor", () => {
      const { cursor, extraOffset } = simulateTyping(text, [
        "t",
        "h",
        "e",
        "x",
        "y",
        "z",
      ]);
      expect(cursor).toBe(3);
      expect(extraOffset).toBe(3);
    });

    it("respects the extra character limit (20)", () => {
      const sequence = ["t", "h", "e", ..."x".repeat(30).split("")];
      const { extraOffset } = simulateTyping(text, sequence);
      expect(extraOffset).toBe(20);
    });

    it("keeps extra characters when space is hit", () => {
      const sequence = ["t", "h", "e", "a", "b", "c", " "];
      const { keystrokes, cursor, extraOffset } = simulateTyping(
        text,
        sequence,
      );
      expect(cursor).toBe(4);
      expect(extraOffset).toBe(0);
      const states = getCharStates(text.split(""), keystrokes);
      expect(states[3].extras).toEqual(["a", "b", "c"]);
    });

    it("allows backspacing extra characters one by one", () => {
      const { extraOffset, keystrokes } = simulateTyping(text, [
        "t",
        "h",
        "e",
        "x",
        "y",
        "Backspace",
      ]);
      expect(extraOffset).toBe(1);
      const states = getCharStates(text.split(""), keystrokes);
      expect(states[3].extras).toEqual(["x"]);
    });

    it("moves back to preceding space and keeps extras when backspacing from a word start", () => {
      const sequence = ["t", "h", "e", "x", "y", "z", " ", "Backspace"];
      const { cursor, extraOffset, keystrokes } = simulateTyping(
        text,
        sequence,
      );
      expect(cursor).toBe(3);
      expect(extraOffset).toBe(3);
      const states = getCharStates(text.split(""), keystrokes);
      expect(states[3].extras).toEqual(["x", "y", "z"]);
    });
  });

  describe("Word Wrap Prevention Behavior", () => {
    const text = "the sun";

    it("blocks extra characters typing when near the edge", () => {
      const isNearEdge = (cursor: number, extraOffset: number) =>
        cursor === 3 && extraOffset === 1;
      const { keystrokes, extraOffset } = simulateTyping(
        text,
        ["t", "h", "e", "x", "y"],
        0,
        100,
        isNearEdge,
      );
      expect(extraOffset).toBe(1);
      const states = getCharStates(text.split(""), keystrokes);
      expect(states[3].extras).toEqual(["x"]);
    });

    it("still allows space characters even when near the edge", () => {
      const { cursor, extraOffset } = simulateTyping(
        text,
        ["t", "h", "e", "x", " "],
        0,
        100,
        () => true,
      );
      expect(cursor).toBe(4);
      expect(extraOffset).toBe(0);
    });

    it("should ONLY prevent typing extra characters when near the edge", () => {
      const sequence = ["t", "h", "e", "x", "x", "x", " ", "s", "u", "n"];
      const { cursor, extraOffset, keystrokes } = simulateTyping(
        text,
        sequence,
        0,
        100,
        () => true,
      );
      expect(cursor).toBe(7);
      expect(extraOffset).toBe(0);
      const states = getCharStates(text.split(""), keystrokes);
      expect(states[3].extras).toEqual([]);
    });
  });

  describe("Skip Word Behavior", () => {
    it("teleports the cursor to the next word when space is pressed mid-word", () => {
      const text = "the sun rose";
      const { cursor, keystrokes } = simulateTyping(text, ["t", "h", " "]);
      expect(cursor).toBe(4);
      const states = getCharStates(text.split(""), keystrokes);
      expect(states[3].state).toBe("incorrect");
    });

    it("should NOT allow multiple cursor teleportations back to back", () => {
      const text = "the sun rose";
      const { cursor } = simulateTyping(text, ["t", "h", " ", " "]);
      expect(cursor).toBe(4);
    });

    it("should jump back to pre-teleport position on Backspace after skipping", () => {
      const text = "the sun rose";
      const { cursor } = simulateTyping(text, ["t", "h", " ", "Backspace"]);
      expect(cursor).toBe(2);
    });
  });

  it("handles bulk deletion (simulating Ctrl+Backspace behavior)", () => {
    const text = "hello world";
    const sequence = "hello ".split("");
    let { keystrokes, cursor, elapsedMs } = simulateTyping(text, sequence);
    expect(cursor).toBe(6);
    const nextCursor = calculateNextCursor(
      cursor,
      "Backspace",
      text.split(""),
      true,
    );
    expect(nextCursor).toBe(0);

    let currentTime = elapsedMs;
    for (let i = cursor - 1; i >= nextCursor; i--) {
      keystrokes.push({
        charIndex: i,
        expectedChar: text[i],
        typedChar: "Backspace",
        isCorrect: false,
        timestampMs: currentTime,
      });
      currentTime += 50;
    }

    const states = getCharStates(text.split(""), keystrokes);
    for (let i = 0; i < 6; i++) {
      expect(states[i].state).toBe("not-typed");
    }
  });
});

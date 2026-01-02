import { describe, it, expect } from "vitest";
import {
  calculateAccuracy,
  calculateNextCursor,
  calculateWpm,
  getCharStates,
  getWordStart,
  isWordPerfect,
} from "./engine-logic";
import { Keystroke } from "./types";

/**
 * Integration tests that simulate the full keystroke → metrics flow.
 * These tests mimic how the Engine components interact with the context
 * by simulating a sequence of keystrokes and verifying the resulting metrics.
 */

/**
 * Simulates typing a sequence of characters and returns the resulting keystrokes,
 * cursor position, extra offset, and elapsed time.
 */
const simulateTyping = (
  text: string,
  typedSequence: string[],
  startTimeMs: number = 0,
  msPerKeystroke: number = 100,
  isNearEdge?: (cursor: number, extraOffset: number) => boolean,
) => {
  const characters = text.split("");
  let keystrokes: Keystroke[] = [];
  let cursor = 0;
  let extraOffset = 0;
  let currentTime = startTimeMs;

  for (const typedChar of typedSequence) {
    const expectedChar = characters[cursor];
    // Word wrap prevention logic: Only block if it's an 'extra' character (letter typed at a space)
    if (
      typedChar !== " " &&
      expectedChar === " " &&
      isNearEdge?.(cursor, extraOffset)
    ) {
      currentTime += msPerKeystroke;
      continue;
    }
    // Backspace logic
    if (typedChar === "Backspace") {
      if (extraOffset > 0) {
        keystrokes.push({
          charIndex: cursor,
          expectedChar,
          typedChar: "Backspace",
          isCorrect: false,
          timestampMs: currentTime,
        });
        extraOffset--;
      } else if (cursor > 0) {
        const targetIndex = cursor - 1;
        const currentStates = getCharStates(characters, keystrokes);
        const numExtras = currentStates[targetIndex].extras?.length || 0;

        // Teleport-aware backspacing
        const lastStroke = keystrokes
          .slice()
          .reverse()
          .find(
            (k) => k.charIndex === targetIndex && k.typedChar !== "Backspace",
          );

        keystrokes.push({
          charIndex: targetIndex,
          expectedChar: characters[targetIndex],
          typedChar: "Backspace",
          isCorrect: false,
          timestampMs: currentTime,
        });

        if (lastStroke?.skipOrigin !== undefined) {
          cursor = lastStroke.skipOrigin;
        } else {
          cursor = calculateNextCursor(cursor, "Backspace", characters);
        }

        if (numExtras > 0) {
          extraOffset = numExtras;
        } else {
          extraOffset = 0;
        }
      }
    } else if (typedChar === " " && expectedChar !== " ") {
      // Skip word logic
      const isWordStart = cursor === getWordStart(cursor, characters);
      const currentStates = getCharStates(characters, keystrokes);
      const currentState = currentStates[cursor];
      const isDirty =
        currentState &&
        (currentState.typedChar !== "" ||
          (currentState.extras && currentState.extras.length > 0));

      // Prevent skipping if we are at the beginning of a word and haven't typed anything
      if (!(isWordStart && !isDirty)) {
        let spaceIndex = cursor;
        while (
          spaceIndex < characters.length &&
          characters[spaceIndex] !== " "
        ) {
          spaceIndex++;
        }
        const targetIndex = Math.min(characters.length - 1, spaceIndex);
        keystrokes.push({
          charIndex: targetIndex,
          expectedChar: characters[targetIndex],
          typedChar: " ",
          isCorrect: false,
          timestampMs: currentTime,
          skipOrigin: cursor, // Record where we jumped from
        });
        cursor = Math.min(characters.length, spaceIndex + 1);
        extraOffset = 0;
      }
    } else {
      // Extra characters logic
      if (expectedChar === " " && typedChar !== " ") {
        if (extraOffset < 20) {
          keystrokes.push({
            charIndex: cursor,
            expectedChar,
            typedChar,
            isCorrect: false,
            timestampMs: currentTime,
          });
          extraOffset++;
        }
      } else {
        const isCorrect = typedChar === expectedChar;
        keystrokes.push({
          charIndex: cursor,
          expectedChar,
          typedChar,
          isCorrect,
          timestampMs: currentTime,
        });
        cursor = calculateNextCursor(cursor, typedChar, characters);
        extraOffset = 0;
      }
    }
    currentTime += msPerKeystroke;
  }

  return {
    keystrokes,
    cursor,
    extraOffset,
    elapsedMs: currentTime - startTimeMs,
  };
};

/**
 * Calculates metrics from keystrokes
 */
const calculateMetrics = (keystrokes: Keystroke[], elapsedMs: number) => {
  const totalTyped = keystrokes.filter(
    (k) => k.typedChar !== "Backspace",
  ).length;
  const correctKeys = keystrokes.filter((k) => k.isCorrect).length;

  return {
    wpm: calculateWpm(correctKeys, elapsedMs),
    accuracy: calculateAccuracy(correctKeys, totalTyped),
  };
};

describe("Integration: Full Typing Session Simulation", () => {
  /* ------------------ Perfect typing session ------------------ */
  describe("Perfect typing session", () => {
    const text = "hello";
    const typedSequence = text.split("");

    it("correctly tracks cursor position through perfect typing", () => {
      const { cursor } = simulateTyping(text, typedSequence);
      expect(cursor).toBe(5); // At the end
    });

    it("all characters are marked as correct", () => {
      const { keystrokes } = simulateTyping(text, typedSequence);
      const states = getCharStates(text.split(""), keystrokes);

      expect(states.every((s) => s.state === "correct")).toBe(true);
    });

    it("calculates 100% accuracy", () => {
      const { keystrokes, elapsedMs } = simulateTyping(text, typedSequence);
      const { accuracy } = calculateMetrics(keystrokes, elapsedMs);

      expect(accuracy).toBe(100);
    });

    it("calculates correct WPM for 60 second session", () => {
      // 50 characters = 10 words, typed in 60 seconds = 10 WPM
      const longText = "a".repeat(50);
      const typedSequence = longText.split("");
      const { keystrokes } = simulateTyping(longText, typedSequence, 0, 1200); // 1.2s per char = 60s total

      const { wpm } = calculateMetrics(keystrokes, 60000);
      expect(wpm).toBe(10);
    });

    it("handles typing beyond text length (edge case)", () => {
      const text = "ab";
      const { cursor } = simulateTyping(text, ["a", "b", "c"]);
      // Cursor should stop at text length
      expect(cursor).toBe(2);
    });
  });

  /* ------------------ Typing session with errors ------------------ */
  describe("Typing session with errors", () => {
    const text = "hello";
    const wrongSequence = "hxllo".split("");

    it("tracks incorrect characters", () => {
      // Type "hxllo" instead of "hello"
      const { keystrokes } = simulateTyping(text, wrongSequence);
      const states = getCharStates(text.split(""), keystrokes);

      expect(states[0].state).toBe("correct");
      expect(states[1].state).toBe("incorrect");
      expect(states[1].typedChar).toBe("x");
      expect(states[2].state).toBe("correct");
    });

    it("calculates accuracy with errors", () => {
      // 1 error out of 5 characters = 80% accuracy
      const { keystrokes, elapsedMs } = simulateTyping(text, wrongSequence);
      const { accuracy } = calculateMetrics(keystrokes, elapsedMs);

      expect(accuracy).toBe(80);
    });

    it("WPM only counts correct characters", () => {
      // 4 correct chars out of 5, in 60 seconds
      // 4 chars = 0.8 words, 0.8 words / 1 min = 0.8 WPM (rounds to 1)
      const { keystrokes } = simulateTyping(text, wrongSequence);
      const { wpm } = calculateMetrics(keystrokes, 60000);

      expect(wpm).toBe(1); // 4 correct chars / 5 / 1 minute
    });
  });

  /* ------------------ Typing session with backspace corrections ------------------ */
  describe("Typing session with backspace corrections", () => {
    const text = "hello";
    const backspaceSequence = ["h", "e", "Backspace"];

    it("cursor moves back on backspace", () => {
      // Type "he", then backspace, cursor should be at 1
      const { cursor } = simulateTyping(text, backspaceSequence);
      expect(cursor).toBe(1);
    });

    it("backspace resets character state to not-typed", () => {
      const { keystrokes } = simulateTyping(text, backspaceSequence);
      const states = getCharStates(text.split(""), keystrokes);

      expect(states[0].state).toBe("correct");
      expect(states[1].state).toBe("not-typed"); // Reset after backspace
    });

    it("correcting an error and retyping correctly", () => {
      // Type "hx", backspace, type "e"
      const { keystrokes } = simulateTyping(text, [...backspaceSequence, "e"]);
      const states = getCharStates(text.split(""), keystrokes);

      expect(states[0].state).toBe("correct");
      expect(states[1].state).toBe("correct"); // Corrected!
      expect(states[1].typedChar).toBe("e");
    });

    it("backspace keystrokes are excluded from accuracy calculation", () => {
      // Type "hx", backspace, type "e" = 3 typed chars (excluding backspace), 2 correct
      // correctKeys = 2 (h, e) // accuracy = 2/3 = 67%
      const { keystrokes, elapsedMs } = simulateTyping(text, [
        "h",
        "x",
        "Backspace",
        "e",
      ]);
      const { accuracy } = calculateMetrics(keystrokes, elapsedMs);

      expect(accuracy).toBe(67); // 2 correct / 3 total
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
      // We already handling this case inside the simulateTyping function with cursor > 0 check
      const text = "abc";
      const { cursor, keystrokes } = simulateTyping(text, ["Backspace"]);

      expect(cursor).toBe(0);
      expect(keystrokes.length).toBe(0); // No keystroke recorded
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

  /* ------------------ Metrics calculation edge cases ------------------ */
  describe("Metrics calculation edge cases", () => {
    it("handles empty keystrokes", () => {
      const { wpm, accuracy } = calculateMetrics([], 60000);

      expect(wpm).toBe(0);
      expect(accuracy).toBe(100); // No errors if nothing typed
    });

    it("handles all incorrect keystrokes", () => {
      const text = "abc";
      const { keystrokes, elapsedMs } = simulateTyping(text, ["x", "y", "z"]);
      const { wpm, accuracy } = calculateMetrics(keystrokes, elapsedMs);

      expect(accuracy).toBe(0);
      expect(wpm).toBe(0);
    });

    it("handles very fast typing (high WPM)", () => {
      // 50 chars in 6 seconds = 100 WPM
      const text = "a".repeat(50);
      const { keystrokes } = simulateTyping(text, text.split(""), 0, 120); // 120ms per char

      const { wpm } = calculateMetrics(keystrokes, 6000);
      expect(wpm).toBe(100);
    });

    it("handles very slow typing (low WPM)", () => {
      // 5 chars in 5 minutes = 1 word in 5 min = 0.2 WPM (rounds to 0)
      const text = "hello";
      const { keystrokes } = simulateTyping(text, text.split(""));

      const { wpm } = calculateMetrics(keystrokes, 300000); // 5 minutes
      expect(wpm).toBe(0); // 5 chars = 1 word, 1 word / 5 min = 0.2
    });
  });

  /* ------------------ Character state consistency ------------------ */
  describe("Character state consistency", () => {
    const text = "hello world";
    const sequence = "hello ".split("");

    it("maintains correct state count matching cursor position", () => {
      const { keystrokes, cursor } = simulateTyping(text, sequence);
      const states = getCharStates(text.split(""), keystrokes);
      // Count typed characters
      const typedCount = states.filter((s) => s.state !== "not-typed").length;
      expect(typedCount).toBe(cursor);
    });

    it("untyped characters remain not-typed", () => {
      const { keystrokes } = simulateTyping(text, sequence);
      const states = getCharStates(text.split(""), keystrokes);
      // Check remaining characters are not-typed
      for (let i = sequence.length; i < text.length; i++) {
        expect(states[i].state).toBe("not-typed");
      }
    });
  });

  /* ------------------ Ctrl+Backspace Simulation ------------------ */
  describe("Ctrl+Backspace Simulation", () => {
    it("handles bulk deletion (simulating Ctrl+Backspace behavior)", () => {
      const text = "hello world";
      const sequence = "hello ".split("");
      let { keystrokes, cursor, elapsedMs } = simulateTyping(text, sequence);

      // Verify initial state
      let states = getCharStates(text.split(""), keystrokes);
      expect(states[5].typedChar).toBe(" ");
      expect(cursor).toBe(6);

      // Simulate Ctrl+Backspace: Moves cursor from 6 to 0 (skips space and word)
      // We calculate next cursor first, then loop through the skipped characters
      // Next cursor for "hello " with Ctrl+Backspace should be 0.
      const startCursor = cursor;
      const nextCursor = calculateNextCursor(
        startCursor,
        "Backspace",
        text.split(""),
        true, // isCtrlKey
      );

      expect(nextCursor).toBe(0);

      // Push backspaces for every skipped character
      let currentTime = elapsedMs;
      for (let i = startCursor - 1; i >= nextCursor; i--) {
        keystrokes.push({
          charIndex: i,
          expectedChar: text[i],
          typedChar: "Backspace",
          isCorrect: false,
          timestampMs: currentTime,
        });
        currentTime += 50; // Simulate 50ms delay between keystrokes
      }

      // Verify all characters are now "not-typed"
      states = getCharStates(text.split(""), keystrokes);
      for (let i = 0; i < 6; i++) {
        expect(states[i].state).toBe("not-typed");
      }
    });
  });

  /* ------------------ Word Locking Mechanism ------------------ */
  describe("Word Locking Mechanism", () => {
    const text = "the sun rose".split("");

    it("locks the cursor after a correct word + space", () => {
      let lockedCursor = 0;
      const sequence = "the ".split("");
      const { keystrokes, cursor } = simulateTyping(text.join(""), sequence);

      const states = getCharStates(text, keystrokes);
      const wordStart = getWordStart(3, text); // 3 is index of space
      const perfect = isWordPerfect(wordStart, 3, states);

      expect(perfect).toBe(true);
      if (perfect) lockedCursor = 3 + 1; // logical next word start

      expect(lockedCursor).toBe(4);
      expect(cursor).toBe(4);

      // Verify backspace at the lock (index 4) returns original cursor
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
      const wordStart = getWordStart(3, text);
      const perfect = isWordPerfect(wordStart, 3, states);

      expect(perfect).toBe(false);
      // Logic would NOT update lock if not perfect
      if (perfect) lockedCursor = 3 + 1;

      expect(lockedCursor).toBe(0);
      expect(cursor).toBe(4);

      // Verify backspace IS allowed (target 3)
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
      // Start with lock at 4 ("the " is locked)
      const lockedCursor = 4;
      const characters = "the sun".split("");
      // Type "s" (at index 4) -> cursor 5
      const currentCursor = 5;
      // Backspace at 5 should go to 4
      expect(
        calculateNextCursor(
          currentCursor,
          "Backspace",
          characters,
          false,
          lockedCursor,
        ),
      ).toBe(4);

      // Backspace at 4 should STAY at 4
      expect(
        calculateNextCursor(4, "Backspace", characters, false, lockedCursor),
      ).toBe(4);
    });
  });

  /* ------------------ Extra Character Handling ------------------ */
  describe("Extra Character Handling", () => {
    const text = "the sun rose";

    it("accumulates extra characters at a space without moving the cursor", () => {
      // Type "the" followed by "xyz" at the space (index 3)
      const sequence = ["t", "h", "e", "x", "y", "z"];
      const { cursor, extraOffset } = simulateTyping(text, sequence);

      expect(cursor).toBe(3);
      expect(extraOffset).toBe(3);
    });

    it("respects the extra character limit (20)", () => {
      const sequence = ["t", "h", "e", ..."x".repeat(30).split("")];
      const { extraOffset } = simulateTyping(text, sequence);

      expect(extraOffset).toBe(20);
    });

    it("keeps extra characters when space is hit", () => {
      // Type "the", then "abc", then hit space
      const sequence = ["t", "h", "e", "a", "b", "c", " "];
      const { keystrokes, cursor, extraOffset } = simulateTyping(
        text,
        sequence,
      );

      expect(cursor).toBe(4);
      expect(extraOffset).toBe(0);

      const states = getCharStates(text.split(""), keystrokes);
      // Index 3 (the space) should still have extras
      expect(states[3].extras).toEqual(["a", "b", "c"]);
      expect(states[3].state).toBe("correct");
    });

    it("allows backspacing extra characters one by one", () => {
      const sequence = ["t", "h", "e", "x", "y", "Backspace"];
      const { extraOffset, keystrokes } = simulateTyping(text, sequence);

      expect(extraOffset).toBe(1); // "x" remains, "y" deleted
      const states = getCharStates(text.split(""), keystrokes);
      expect(states[3].extras).toEqual(["x"]);
    });

    it("moves back to preceding space and keeps extras when backspacing from a word start", () => {
      // text: "the sun rose"
      // sequence: "the" (3) "xyz" (3 extras at space) " " (move to 4) "Backspace" (back to 3)
      const sequence = ["t", "h", "e", "x", "y", "z", " ", "Backspace"];
      const { cursor, extraOffset, keystrokes } = simulateTyping(
        text,
        sequence,
      );

      expect(cursor).toBe(3);
      expect(extraOffset).toBe(3); // Had 3, backspace from 's' start moves back and stops at space with all extras visible.
      const states = getCharStates(text.split(""), keystrokes);
      expect(states[3].extras).toEqual(["x", "y", "z"]);
    });
  });

  /* ------------------ Word Wrap Prevention Behavior ------------------ */
  describe("Word Wrap Prevention Behavior", () => {
    /**
     * Note: The actual word-wrap prevention is a DOM-based feature that relies
     * on getBoundingClientRect() to detect when cursor is near the container edge.
     * These tests document the expected behavior of the feature:
     *
     * 1. When cursor is near the right edge of the container:
     *    - Extra characters should be BLOCKED (early return, no keystroke recorded)
     *    - Main characters should be ALLOWED at the edge with no extras
     *    - Space should be ALLOWED (proceed to next line)
     *
     * 2. This prevents the extra characters from causing word wrap issues for the current word being typed
     * 3. The check uses a 40px buffer from the right edge
     */
    const text = "the sun";

    it("blocks extra characters typing when near the edge", () => {
      // Sequence: "the" (cursor at 3), then try to type extra 'x', 'y'
      // But we simulate that for 'y', we are near the edge.
      const sequence = ["t", "h", "e", "x", "y"];
      // Mock: at cursor 3 and 1 extra, we are near the edge
      const isNearEdge = (cursor: number, extraOffset: number) => {
        return cursor === 3 && extraOffset === 1;
      };

      const { keystrokes, extraOffset } = simulateTyping(
        text,
        sequence,
        0,
        100,
        isNearEdge,
      );

      // 'x' should be recorded (offset becomes 1),
      // but 'y' should be blocked because isNearEdge(3, 1) returns true.
      expect(extraOffset).toBe(1);
      const states = getCharStates(text.split(""), keystrokes);
      expect(states[3].extras).toEqual(["x"]);
    });

    it("still allows space characters even when near the edge", () => {
      const sequence = ["t", "h", "e", "x", " "];
      const { cursor, extraOffset } = simulateTyping(
        text,
        sequence,
        0,
        100,
        (c: number, o: number) => true, // Always near edge
      );

      // 'x' is blocked because it's an extra character at the edge.
      // 't', 'h', 'e' are main characters, so they are allowed even near the edge.
      // " " is also allowed. Final cursor should be 4 ("the ").
      expect(cursor).toBe(4);
      expect(extraOffset).toBe(0);
    });

    it("should ONLY prevent typing extra characters when near the edge", () => {
      // sequence: "the" (0-2), then "xxx" (extras at 3), then " " (move to 4), then "s", "u", "n" (main chars)
      // prettier-ignore
      const sequence = [
        "t", "h", "e", "x", "x", "x", " ", // First line (3 extras at the edge)
        "s", "u", "n" // Second line (main chars)
      ];

      const { cursor, extraOffset, keystrokes } = simulateTyping(
        text,
        sequence,
        0,
        100,
        (c: number, o: number) => true, // Always near edge
      );

      // 't','h','e' should be ALLOWED because they are main characters (expectedChar !== " ")
      // 'x','x','x' at index 3 should be BLOCKED because they are extras (expectedChar === " ") and isNearEdge is true
      // ' ' at index 3 should be ALLOWED because it's a space (typedChar === " ")
      // 's','u','n' at index 4,5,6 should be ALLOWED because they are main characters (expectedChar !== " ")

      expect(cursor).toBe(7); // "the sun" is 7 chars. All main chars + space typed.
      expect(extraOffset).toBe(0); // All extras were blocked
      const states = getCharStates(text.split(""), keystrokes);
      expect(states[3].extras).toEqual([]); // No extras recorded
      expect(states[4].state).toBe("correct"); // 's' typed correctly
      expect(states[6].state).toBe("correct"); // 'n' typed correctly
    });
  });

  /* ------------------ Skip Word Behavior ------------------ */
  describe("Skip Word Behavior", () => {
    it("teleports the cursor to the next word when space is pressed mid-word", () => {
      const text = "the sun rose";
      const sequence = ["t", "h", " "];
      const { cursor, keystrokes } = simulateTyping(text, sequence);

      // Next word "sun" starts at index 4
      expect(cursor).toBe(4);

      const states = getCharStates(text.split(""), keystrokes);
      // 't', 'h' are correct
      expect(states[0].state).toBe("correct");
      expect(states[1].state).toBe("correct");
      // 'e' was skipped, so it's "not-typed" (which is displayed as error-underline because it's incomplete)
      expect(states[2].state).toBe("not-typed");
      // Index 3 (the space) should be "incorrect" because it was pressed when 'e' was expected
      expect(states[3].state).toBe("incorrect");
    });

    it("should NOT allow multiple cursor teleportations back to back", () => {
      const text = "the sun rose";
      // Sequence: "t", "h", " ", " "
      // First space at 'e' (index 2) -> jump to 4 (start of "sun")
      // Second space at 's' (index 4) -> should be IGNORED because it's a clean word skip
      const sequence = ["t", "h", " ", " "];
      const { cursor, keystrokes } = simulateTyping(text, sequence);

      // Next word "sun" starts at index 4. It should still be at 4.
      expect(cursor).toBe(4);

      const states = getCharStates(text.split(""), keystrokes);
      // 't', 'h' are correct
      expect(states[0].state).toBe("correct");
      expect(states[1].state).toBe("correct");
      // 'e' was skipped during the first jump
      expect(states[2].state).toBe("not-typed");
      // The first jump space was recorded at index 3 (the next space)
      expect(states[3].state).toBe("incorrect");
      // The second space was ignored, so no keystroke recorded for index 4 or beyond
      expect(states[4].state).toBe("not-typed");
      expect(states[4].typedChar).toBe("");
    });

    it("should jump back to pre-teleport position on Backspace after skipping", () => {
      const text = "the sun rose";
      // Sequence: "t", "h", " ", "Backspace"
      // 1. "t", "h" -> cursor 2
      // 2. " " -> jumps to index 4 (start of "sun")
      // 3. "Backspace" -> should jump back to index 2 (after "h")
      const sequence = ["t", "h", " ", "Backspace"];
      const { cursor, keystrokes } = simulateTyping(text, sequence);

      expect(cursor).toBe(2);

      const states = getCharStates(text.split(""), keystrokes);
      // 't', 'h' remains correct
      expect(states[0].state).toBe("correct");
      expect(states[1].state).toBe("correct");
      // 'e' (index 2) should be not-typed
      expect(states[2].state).toBe("not-typed");
      // Space (index 3) should be not-typed because it was backspaced
      expect(states[3].state).toBe("not-typed");
    });
  });
});

import {
  calculateAccuracy,
  calculateConsistency,
  calculateNextCursor,
  calculateRawWpm,
  calculateWpm,
  getCharStates,
  getWordStart,
} from "../../../engine/engine-logic";
import { Keystroke } from "../../../engine/types";

/**
 * Simulates typing a sequence of characters and returns the resulting keystrokes,
 * cursor position, extra offset, and elapsed time.
 */
export const simulateTyping = (
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
export const calculateMetrics = (
  keystrokes: Keystroke[],
  elapsedMs: number,
) => {
  const totalTyped = keystrokes.filter(
    (k) => k.typedChar !== "Backspace",
  ).length;
  const correctKeys = keystrokes.filter((k) => k.isCorrect).length;

  return {
    wpm: calculateWpm(correctKeys, elapsedMs),
    accuracy: calculateAccuracy(correctKeys, totalTyped),
    rawWpm: calculateRawWpm(keystrokes.length, elapsedMs),
    consistency: calculateConsistency(keystrokes, elapsedMs),
  };
};

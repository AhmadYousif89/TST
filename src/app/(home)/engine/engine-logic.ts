import { CharState, TextMode, Keystroke } from "./types";

/**
 * Gets the initial time in seconds for a given mode.
 * Returns 0 for "passage" mode, otherwise parses the time from the mode string.
 */
export const getInitialTime = (mode: TextMode): number => {
  if (mode === "passage") return 0;
  return parseInt(mode.split(":")[1]) || 60;
};

/**
 * Calculates words per minute (WPM).
 * Standard formula: (Correct Characters / 5) / Time (min)
 */
export const calculateWpm = (
  correctChars: number,
  timeElapsedMs: number,
): number => {
  const elapsedMinutes = timeElapsedMs / 60000;
  if (elapsedMinutes <= 0) return 0;
  return Math.round(correctChars / 5 / elapsedMinutes);
};

/**
 * Calculates typing accuracy percentage.
 * Formula: (Correct Keystrokes / Total Keystrokes (excluding Backspace)) * 100
 */
export const calculateAccuracy = (
  correctKeys: number,
  totalTyped: number,
): number => {
  if (totalTyped === 0) return 100;
  return Math.round((correctKeys / totalTyped) * 100);
};

/**
 * Calculates the next cursor position based on the current cursor and typed character.
 */
export const calculateNextCursor = (
  currentCursor: number,
  typedChar: string,
  textLength: number,
): number => {
  if (typedChar === "Backspace") {
    return Math.max(0, currentCursor - 1);
  }
  return Math.min(textLength, currentCursor + 1);
};

/**
 * Computes all character states based on the original characters and the list of keystrokes.
 * Returns an array of CharState objects corresponding to each character in the text.
 */
export const getCharStates = (
  characters: string[],
  keystrokes: Keystroke[],
): CharState[] => {
  const states: CharState[] = new Array(characters.length)
    .fill(null)
    .map(() => ({
      state: "not-typed",
      typedChar: "",
    }));

  for (const k of keystrokes || []) {
    if (k.typedChar === "Backspace") {
      states[k.charIndex] = { state: "not-typed", typedChar: "" };
    } else {
      states[k.charIndex] = {
        state: k.isCorrect ? "correct" : "incorrect",
        typedChar: k.typedChar,
      };
    }
  }
  return states;
};

import { CharState, TextMode, Keystroke } from "./types";

/**
 * Formats a time in seconds to a string in the format "MM:SS".
 */
export const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Gets the label for a given mode.
 * Returns "Passage" for "passage" mode, otherwise returns the mode string.
 */
export const getModeLabel = (m: string) => {
  if (m === "passage") return "Passage";
  if (m.startsWith("t:")) return `Timed (${m.split(":")[1]}s)`;
  return m;
};

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
 * Enforces a minimum cursor position if a lockedCursor is provided.
 */
export const calculateNextCursor = (
  currentCursor: number,
  typedChar: string,
  characters: string[],
  isCtrlKey: boolean = false,
  lockedCursor: number = 0,
): number => {
  if (typedChar === "Backspace") {
    if (currentCursor <= lockedCursor) return currentCursor;

    if (isCtrlKey) {
      let newCursor = currentCursor - 1;
      // Skip trailing spaces if any
      while (newCursor > lockedCursor && characters[newCursor] === " ") {
        newCursor--;
      }
      // Skip back to the beginning of the word
      while (newCursor > lockedCursor && characters[newCursor - 1] !== " ") {
        newCursor--;
      }
      return Math.max(lockedCursor, newCursor);
    }
    return Math.max(lockedCursor, currentCursor - 1);
  }
  return Math.min(characters.length, currentCursor + 1);
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

/**
 * Finds the starting index of the word containing the character at the given index.
 */
export const getWordStart = (index: number, characters: string[]): number => {
  let wordStart = index;
  while (wordStart > 0 && characters[wordStart - 1] !== " ") {
    wordStart--;
  }
  return wordStart;
};

/**
 * Checks if a range of characters has been typed perfectly correctly.
 */
export const isWordPerfect = (
  startIndex: number,
  endIndex: number,
  charStates: CharState[],
): boolean => {
  if (startIndex < 0 || endIndex < startIndex) return false;
  return charStates
    .slice(startIndex, endIndex)
    .every((s) => s.state === "correct");
};

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
  // Logic for skipping words when typing a space mid-word
  if (typedChar === " " && characters[currentCursor] !== " ") {
    let nextSpace = currentCursor;
    while (nextSpace < characters.length && characters[nextSpace] !== " ") {
      nextSpace++; // advance cursor to the index before the next space
    }
    // return the index at the start of the next word
    return Math.min(characters.length, nextSpace + 1);
  }

  return Math.min(characters.length, currentCursor + 1);
};

const EMPTY_EXTRAS: string[] = [];

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
      extras: EMPTY_EXTRAS,
    }));

  for (const k of keystrokes || []) {
    const char = characters[k.charIndex];
    const isBackspace = k.typedChar === "Backspace";

    if (isBackspace) {
      const state = states[k.charIndex];
      // Prioritize clearing the main character first
      if (state.typedChar !== "") {
        state.state = "not-typed";
        state.typedChar = "";
      } else if (state.extras && state.extras.length > 0) {
        if (state.extras.length === 1) {
          state.extras = EMPTY_EXTRAS;
        } else {
          state.extras = state.extras.slice(0, -1);
        }
      }
      continue;
    }

    const state = states[k.charIndex];

    // If it's a space but we typed a letter, it's an extra
    if (char === " " && k.typedChar !== " ") {
      state.extras =
        state.extras === EMPTY_EXTRAS
          ? [k.typedChar]
          : [...(state.extras || []), k.typedChar];
      continue;
    }

    // If we already have a typed char for this index, subsequent ones are extras
    if (state.typedChar !== "") {
      state.extras =
        state.extras === EMPTY_EXTRAS
          ? [k.typedChar]
          : [...(state.extras || []), k.typedChar];
    } else {
      state.state = k.isCorrect ? "correct" : "incorrect";
      state.typedChar = k.typedChar;
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
  // Check letters: must be correct and have no extras
  for (let i = startIndex; i < endIndex; i++) {
    const s = charStates[i];
    if (s.state !== "correct" || (s.extras && s.extras.length > 0)) {
      return false;
    }
  }

  // Check the space (or final char): must have no extras
  const lastCharExtras = charStates[endIndex]?.extras?.length || 0;
  return lastCharExtras === 0;
};

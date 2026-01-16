import { getWordRanges } from "@/app/(home)/engine/engine-logic";
import { Keystroke } from "@/app/(home)/engine/types";
import { TypingSessionDoc } from "@/lib/types";

export type WordStats = {
  wpm: number;
  word: string;
  hasError: boolean;
  errorCharIndices: Set<number>;
  extras?: string[];
  skipIndex?: number;
  bucket?: number;
  typedChars?: string;
};

export type HeatmapAnalysis = {
  wordStatsMap: Map<number, WordStats>;
  buckets: number[];
  words: string[];
};

export const analyzeHeatmap = (
  keystrokes: TypingSessionDoc["keystrokes"],
  text: string,
) => {
  if (!keystrokes || keystrokes.length === 0 || !text) return null;

  const sortedKeystrokes = [...keystrokes].sort(
    (a, b) => a.timestampMs - b.timestampMs,
  );

  // Map word index to stats
  const wordStatsMap = new Map<number, WordStats>();

  const words = text.split(" ");
  const wordRanges = getWordRanges(text);
  const wordWPMsList: number[] = [];

  const wordData = words.map((word) => ({
    keystrokes: [] as Keystroke[],
    errors: new Set<number>(),
    extras: [] as string[],
    skipIndex: undefined as number | undefined,
    typedChars: new Array(word.length).fill(null),
    maxRelIdx: -1,
    hasTypingError: false,
  }));

  /* ------------------- Keystroke Processing ------------------- */

  sortedKeystrokes.forEach((k) => {
    const isBackspace = k.typedChar === "Backspace";

    const wordIdx = wordRanges.findIndex(
      (r) => k.charIndex >= r.start && k.charIndex <= r.end,
    );

    if (wordIdx !== -1) {
      const data = wordData[wordIdx];
      const range = wordRanges[wordIdx];
      const relIdx = k.charIndex - range.start;

      if (isBackspace) {
        if (data.extras.length > 0) data.extras.pop();
        return;
      }

      data.keystrokes.push(k);

      if (relIdx < words[wordIdx].length) {
        data.maxRelIdx = Math.max(data.maxRelIdx, relIdx);
        const currentEntry = data.typedChars[relIdx];
        const currentIsError = data.errors.has(relIdx);

        if (currentEntry === null || (!currentIsError && !k.isCorrect)) {
          data.typedChars[relIdx] = k.typedChar;
          if (!k.isCorrect) {
            data.errors.add(relIdx);
            data.hasTypingError = true;
          }
        }
      } else {
        const isSpace = relIdx === words[wordIdx].length && k.typedChar === " ";
        if (!isSpace) {
          data.extras.push(k.typedChar);
          data.hasTypingError = true;
        }
      }

      if (k.skipOrigin !== undefined) {
        const skipWordIdx = wordRanges.findIndex(
          (r) => k.skipOrigin! >= r.start && k.skipOrigin! <= r.end,
        );
        if (skipWordIdx !== -1) {
          wordData[skipWordIdx].skipIndex =
            k.skipOrigin - wordRanges[skipWordIdx].start;
        }
      }
    }
  });

  // Determine the last word that received any keystroke
  let absoluteLastTypedWordIdx = -1;
  sortedKeystrokes.forEach((k) => {
    const wordIdx = wordRanges.findIndex(
      (r) =>
        k.charIndex >= r.start &&
        (k.charIndex < r.end || (k.charIndex === r.end && k.typedChar !== " ")),
    );
    if (wordIdx !== -1 && wordIdx > absoluteLastTypedWordIdx) {
      absoluteLastTypedWordIdx = wordIdx;
    }
  });

  /* ----------------- Word Stats ----------------- */

  let prevWordEndTime = 0;
  let lastTypedWordIdx = -1;

  words.forEach((word, wordIdx) => {
    let wpm = 0;
    const data = wordData[wordIdx];
    const {
      errors,
      keystrokes: wordKeystrokes,
      extras,
      skipIndex,
      typedChars,
      maxRelIdx,
      hasTypingError,
    } = data;

    // A word is included in the map if it was interacted with
    const shouldInclude =
      wordKeystrokes.length > 0 ||
      hasTypingError ||
      skipIndex !== undefined ||
      extras.length > 0;

    if (shouldInclude) {
      // Mark remaining untyped characters (skipped) as errors
      for (let i = 0; i < word.length; i++) {
        if (typedChars[i] === null) {
          const isLastWord = wordIdx === absoluteLastTypedWordIdx;
          const isBeforeEnd = i < maxRelIdx;
          const wasSkipped = skipIndex !== undefined && i >= skipIndex;

          if (!isLastWord || isBeforeEnd || wasSkipped) {
            errors.add(i);
          }
        }
      }

      const lastKeystroke = wordKeystrokes[wordKeystrokes.length - 1];
      if (lastKeystroke) {
        const currentWordEndTime = lastKeystroke.timestampMs;
        const durationMs = currentWordEndTime - prevWordEndTime;
        prevWordEndTime = currentWordEndTime;
        const safeDuration = Math.max(durationMs, 200);
        const typedCharCount = wordKeystrokes.length;
        wpm = typedCharCount / 5 / (safeDuration / 60000);
        wordWPMsList.push(wpm);
        lastTypedWordIdx = wordIdx;
      }

      wordStatsMap.set(wordIdx, {
        wpm,
        hasError: hasTypingError || errors.size > 0,
        word,
        errorCharIndices: errors,
        extras: extras.length > 0 ? extras : undefined,
        skipIndex,
        typedChars: typedChars.map((c) => c || "\0").join(""),
      });
    }
  });

  const buckets = getBuckets(wordWPMsList, wordStatsMap) || [];
  // Limit displayed words to typed words + a few context words
  const displayWords = words.slice(0, lastTypedWordIdx + 3);

  return { wordStatsMap, buckets, words: displayWords };
};

function getBuckets(
  wordWPMsList: number[],
  wordStatsMap: Map<number, WordStats>,
) {
  if (wordWPMsList.length === 0) return null;

  const sortedWpms = [...wordWPMsList].sort((a, b) => a - b);
  const medianWpm = sortedWpms[Math.floor(sortedWpms.length / 2)];

  const b1 = Math.round(medianWpm * 0.75);
  const b2 = Math.round(medianWpm * 0.9);
  const b3 = Math.round(medianWpm * 1.1);
  const b4 = Math.round(medianWpm * 1.25);

  const getBucket = (wpm: number) => {
    if (wpm < b1) return 0;
    if (wpm < b2) return 1;
    if (wpm < b3) return 2;
    if (wpm < b4) return 3;
    return 4;
  };

  wordStatsMap.forEach((stats) => {
    if (stats.wpm > 0) stats.bucket = getBucket(stats.wpm);
  });

  const buckets = [
    Math.round(Math.min(...wordWPMsList)), // min WPM
    b1, // 75% of median
    b2, // 90% of median
    b3, // 110% of median
    b4, // 125% of median
    Math.round(Math.max(...wordWPMsList)), // max WPM
  ];

  return buckets;
}

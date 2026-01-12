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
  session: TypingSessionDoc,
  text: string,
): HeatmapAnalysis | null => {
  if (!session.keystrokes || session.keystrokes.length === 0 || !text) {
    return null;
  }

  const { keystrokes } = session;
  const sortedKeystrokes = [...keystrokes].sort(
    (a, b) => a.timestampMs - b.timestampMs,
  );

  // Map word index to stats
  const wordStatsMap = new Map<number, WordStats>();

  const words = text.split(" ");
  const wordWPMsList: number[] = [];

  let charIndexPointer = 0;
  let lastTypedWordIndex = -1;
  let previousWordEndTime = 0;

  // Pre-calculate word boundaries
  const wordRanges = words.map((word) => {
    const start = charIndexPointer;
    const end = start + word.length;
    charIndexPointer = end + 1;
    return { start, end };
  });

  // Group keystrokes by word index for O(N) access
  const keystrokesPerWord = new Array(words.length)
    .fill(null)
    .map(() => [] as any[]);
  const errorsPerWord = new Array(words.length)
    .fill(null)
    .map(() => new Set<number>());
  const hasErrorPerWord = new Array(words.length).fill(false);
  const extrasPerWord = new Array(words.length)
    .fill(null)
    .map(() => [] as string[]);
  const skipIndexPerWord = new Array(words.length).fill(undefined);
  const typedCharsPerWord = new Array(words.length)
    .fill(null)
    .map((_, i) => new Array(words[i].length).fill(null));

  sortedKeystrokes.forEach((k) => {
    const isBackspace = k.typedChar === "Backspace";

    const wordIdx = wordRanges.findIndex(
      (r) => k.charIndex >= r.start && k.charIndex <= r.end,
    );

    if (wordIdx !== -1) {
      const range = wordRanges[wordIdx];
      const relIdx = k.charIndex - range.start; // Relative index within the word

      if (isBackspace) {
        // Backspacing only removes extras. Valid slots are not cleared to preserve first-typed data.
        if (extrasPerWord[wordIdx].length > 0) {
          extrasPerWord[wordIdx].pop();
        }
        return;
      }
      // Track keystrokes associated with this word for WPM calculation
      keystrokesPerWord[wordIdx].push(k);

      const isSpaceIndex = relIdx === words[wordIdx].length;

      if (relIdx < words[wordIdx].length) {
        // Record the first incorrect character typed, or the first correct one
        // if no error has occurred at this position yet.
        const currentEntry = typedCharsPerWord[wordIdx][relIdx];
        const currentIsError = errorsPerWord[wordIdx].has(relIdx);

        if (currentEntry === null || (!currentIsError && !k.isCorrect)) {
          typedCharsPerWord[wordIdx][relIdx] = k.typedChar;
          if (!k.isCorrect) {
            errorsPerWord[wordIdx].add(relIdx);
            hasErrorPerWord[wordIdx] = true;
          }
        }
        // Note: subsequent keystrokes at the same valid index (word range)
        // are ignored for the static word view to prevent "mangled" strings
        // like "crosssacro" for "across". They are still counted in WPM.
      } else {
        // Extras: any typed char at or beyond the word's expected length (including the space index)
        const isSpace = isSpaceIndex && k.typedChar === " ";
        if (!isSpace) {
          extrasPerWord[wordIdx].push(k.typedChar);
          hasErrorPerWord[wordIdx] = true;
        }
      }

      // Detect Skips: record where the cursor jumped from
      if (k.skipOrigin !== undefined) {
        const skipWordIdx = wordRanges.findIndex(
          (r) => k.skipOrigin! >= r.start && k.skipOrigin! <= r.end,
        );
        if (skipWordIdx !== -1) {
          skipIndexPerWord[skipWordIdx] =
            k.skipOrigin - wordRanges[skipWordIdx].start;
        }
      }
    }
  });

  words.forEach((word, wordIdx) => {
    let wpm = 0;
    const hasError = hasErrorPerWord[wordIdx];
    const errorCharIndices = errorsPerWord[wordIdx];
    const wordKeystrokes = keystrokesPerWord[wordIdx];
    const extras = extrasPerWord[wordIdx];
    const skipIndex = skipIndexPerWord[wordIdx];
    const typedChars = typedCharsPerWord[wordIdx];

    // Mark remaining untyped characters (skipped) as errors if any
    for (let i = 0; i < word.length; i++) {
      if (typedChars[i] === null) {
        errorsPerWord[wordIdx].add(i);
      }
    }

    if (
      wordKeystrokes.length > 0 ||
      hasError ||
      skipIndex !== undefined ||
      extras.length > 0
    ) {
      const lastKeystroke = wordKeystrokes[wordKeystrokes.length - 1];
      if (lastKeystroke) {
        const currentWordEndTime = lastKeystroke.timestampMs;
        const durationMs = currentWordEndTime - previousWordEndTime;

        previousWordEndTime = currentWordEndTime;
        const safeDuration = Math.max(durationMs, 200);

        // Use actual typed character count, not full word length
        // This prevents incomplete words from having inflated WPM
        const typedCharCount = wordKeystrokes.length;
        wpm = typedCharCount / 5 / (safeDuration / 60000);

        wordWPMsList.push(wpm);
        lastTypedWordIndex = wordIdx;
      }

      wordStatsMap.set(wordIdx, {
        wpm,
        hasError,
        word,
        errorCharIndices,
        extras: extras.length > 0 ? extras : undefined,
        skipIndex,
        typedChars: typedChars.map((c) => c || "").join(""),
      });
    }
  });

  if (wordWPMsList.length === 0) return null;

  const sortedWpms = [...wordWPMsList].sort((a, b) => a - b);
  const medianWpm = sortedWpms[Math.floor(sortedWpms.length / 2)];

  // Use the MEDIAN word WPM as baseline anchor instead of session WPM.
  // Session WPM includes overhead (pauses, corrections, backspaces) that doesn't reflect per-word speed accurately.
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

  // Assign buckets to words
  wordStatsMap.forEach((stats) => {
    if (stats.wpm > 0) stats.bucket = getBucket(stats.wpm);
  });

  const buckets = [
    Math.round(Math.min(...wordWPMsList)),
    b1,
    b2,
    b3,
    b4,
    Math.round(Math.max(...wordWPMsList)),
  ];

  // Limit displayed words to typed words + a few context words
  const displayWords = words.slice(0, lastTypedWordIndex + 3);

  return { wordStatsMap, buckets, words: displayWords };
};

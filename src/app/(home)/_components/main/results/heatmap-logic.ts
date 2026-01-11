import { TypingSessionDoc } from "@/lib/types";

export type WordStats = {
  wpm: number;
  word: string;
  hasError: boolean;
  errorCharIndices: Set<number>;
};

export type HeatmapAnalysis = {
  wordStatsMap: Map<number, WordStats>;
  getBucket: (wpm: number) => number;
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

  sortedKeystrokes.forEach((k) => {
    const wordIdx = wordRanges.findIndex(
      (r) => k.charIndex >= r.start && k.charIndex <= r.end,
    );

    if (wordIdx !== -1) {
      if (k.typedChar !== "Backspace") {
        // Include the space (at wordRanges[wordIdx].end) in the current word's stats
        if (k.charIndex <= wordRanges[wordIdx].end) {
          keystrokesPerWord[wordIdx].push(k);
        }
      }
      if (!k.isCorrect) {
        hasErrorPerWord[wordIdx] = true;
        if (k.charIndex < wordRanges[wordIdx].end) {
          errorsPerWord[wordIdx].add(k.charIndex - wordRanges[wordIdx].start);
        }
      }
    }
  });

  words.forEach((word, wordIdx) => {
    let wpm = 0;
    const hasError = hasErrorPerWord[wordIdx];
    const errorCharIndices = errorsPerWord[wordIdx];
    const wordKeystrokes = keystrokesPerWord[wordIdx];

    if (wordKeystrokes.length > 0) {
      const lastKeystroke = wordKeystrokes[wordKeystrokes.length - 1];
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

    if (wpm > 0 || hasError)
      wordStatsMap.set(wordIdx, { wpm, hasError, word, errorCharIndices });
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

  return { wordStatsMap, getBucket, buckets, words: displayWords };
};

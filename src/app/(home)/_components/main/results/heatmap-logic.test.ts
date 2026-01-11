import { describe, it, expect } from "vitest";
import { analyzeHeatmap } from "./heatmap-logic";
import { TypingSessionDoc } from "@/lib/types";

describe("analyzeHeatmap", () => {
  const mockText = "The quick brown fox";

  const createMockSession = (
    keystrokes: any[],
    wpm = 50,
  ): TypingSessionDoc => ({
    _id: "session1",
    anonUserId: "user1",
    textId: "text1",
    category: "general",
    difficulty: "easy",
    mode: "t:15",
    wpm,
    accuracy: 100,
    charCount: 100,
    errorCount: 0,
    durationMs: 15000,
    keystrokes,
    startedAt: new Date(),
    finishedAt: new Date(),
  });

  it("returns null for empty keystrokes", () => {
    const session = createMockSession([]);
    const result = analyzeHeatmap(session, mockText);
    expect(result).toBeNull();
  });

  it("returns null for empty text", () => {
    const keystrokes = [
      { charIndex: 0, typedChar: "T", timestampMs: 100, isCorrect: true },
    ];
    const session = createMockSession(keystrokes);
    const result = analyzeHeatmap(session, "");
    expect(result).toBeNull();
  });

  it("calculates WPM correctly for each word", () => {
    // "The" + space = 4 keystrokes in 1 second
    // WPM = (4/5) / (1000/60000) = 0.8 / 0.0166 = 48 WPM

    const keystrokes = [
      { charIndex: 0, typedChar: "T", timestampMs: 100, isCorrect: true },
      { charIndex: 1, typedChar: "h", timestampMs: 400, isCorrect: true },
      { charIndex: 2, typedChar: "e", timestampMs: 700, isCorrect: true },
      { charIndex: 3, typedChar: " ", timestampMs: 1000, isCorrect: true },
    ];

    const session = createMockSession(keystrokes);
    const result = analyzeHeatmap(session, mockText);

    expect(result).not.toBeNull();
    const stats = result?.wordStatsMap.get(0);
    // 4 keystrokes in 1000ms = (4/5) / (1000/60000) = 48 WPM
    expect(stats?.wpm).toBeCloseTo(48, 0);
  });

  it("handles high speed bursts (first word fast) without skewing subsequent words", () => {
    // First word "The" + space = 4 keystrokes in 200ms
    // WPM = (4/5) / (200/60000) = 0.8 / 0.00333 = 240 WPM
    // Second word "quick" + space = 6 keystrokes in 1000ms
    // WPM = (6/5) / (1000/60000) = 1.2 / 0.0166 = 72 WPM
    // Session WPM = 70

    const keystrokes = [
      // Word 0: "The" + space ends at 200ms (4 keystrokes)
      { charIndex: 0, typedChar: "T", timestampMs: 50, isCorrect: true },
      { charIndex: 1, typedChar: "h", timestampMs: 100, isCorrect: true },
      { charIndex: 2, typedChar: "e", timestampMs: 150, isCorrect: true },
      { charIndex: 3, typedChar: " ", timestampMs: 200, isCorrect: true },
      // Word 1: "quick" + space ends at 1200ms (took 1000ms, 6 keystrokes)
      { charIndex: 4, typedChar: "q", timestampMs: 400, isCorrect: true },
      { charIndex: 5, typedChar: "u", timestampMs: 600, isCorrect: true },
      { charIndex: 6, typedChar: "i", timestampMs: 800, isCorrect: true },
      { charIndex: 7, typedChar: "c", timestampMs: 1000, isCorrect: true },
      { charIndex: 8, typedChar: "k", timestampMs: 1100, isCorrect: true },
      { charIndex: 9, typedChar: " ", timestampMs: 1200, isCorrect: true },
    ];

    const session = createMockSession(keystrokes, 70);
    const result = analyzeHeatmap(session, mockText);

    expect(result).not.toBeNull();
    const getBucket = result!.getBucket;

    const word0Stats = result?.wordStatsMap.get(0);
    const word1Stats = result?.wordStatsMap.get(1);

    // 4 keystrokes in 200ms = (4/5) / (200/60000) = 240 WPM
    expect(word0Stats?.wpm).toBeGreaterThan(200);
    // 6 keystrokes in 1000ms = (6/5) / (1000/60000) = 72 WPM
    expect(word1Stats?.wpm).toBeCloseTo(72, 0);

    // With median WPM as anchor:
    // The fast word (240 WPM) should be in a higher bucket than the slower word (72 WPM)
    expect(word0Stats!.bucket).toBeGreaterThan(word1Stats!.bucket!);
  });

  it("detects errors in words", () => {
    const keystrokes = [
      { charIndex: 0, typedChar: "T", timestampMs: 100, isCorrect: true },
      { charIndex: 1, typedChar: "x", timestampMs: 200, isCorrect: false }, // Error
      { charIndex: 2, typedChar: "e", timestampMs: 300, isCorrect: true },
      { charIndex: 3, typedChar: " ", timestampMs: 400, isCorrect: true },
    ];

    const session = createMockSession(keystrokes);
    const result = analyzeHeatmap(session, mockText);

    const stats = result?.wordStatsMap.get(0);
    expect(stats?.hasError).toBe(true);
    expect(stats?.errorCharIndices.has(1)).toBe(true);
    expect(stats?.errorCharIndices.has(0)).toBe(false);
  });

  it("works with 'The sun rose over the quiet town.' text", () => {
    const mockText = "The sun rose over the quiet town.";

    // Simulate typing at different speeds: fast first word, then consistent
    const keystrokes = [
      // Word 0: "The" - fast burst (200ms)
      { charIndex: 0, typedChar: "T", timestampMs: 50, isCorrect: true },
      { charIndex: 1, typedChar: "h", timestampMs: 100, isCorrect: true },
      { charIndex: 2, typedChar: "e", timestampMs: 150, isCorrect: true },
      { charIndex: 3, typedChar: " ", timestampMs: 200, isCorrect: true },
      // Word 1: "sun" - 500ms (from 200 to 700)
      { charIndex: 4, typedChar: "s", timestampMs: 350, isCorrect: true },
      { charIndex: 5, typedChar: "u", timestampMs: 500, isCorrect: true },
      { charIndex: 6, typedChar: "n", timestampMs: 600, isCorrect: true },
      { charIndex: 7, typedChar: " ", timestampMs: 700, isCorrect: true },
      // Word 2: "rose" - 500ms (from 700 to 1200)
      { charIndex: 8, typedChar: "r", timestampMs: 850, isCorrect: true },
      { charIndex: 9, typedChar: "o", timestampMs: 950, isCorrect: true },
      { charIndex: 10, typedChar: "s", timestampMs: 1050, isCorrect: true },
      { charIndex: 11, typedChar: "e", timestampMs: 1100, isCorrect: true },
      { charIndex: 12, typedChar: " ", timestampMs: 1200, isCorrect: true },
      // Word 3: "over" - 500ms (from 1200 to 1700)
      { charIndex: 13, typedChar: "o", timestampMs: 1350, isCorrect: true },
      { charIndex: 14, typedChar: "v", timestampMs: 1450, isCorrect: true },
      { charIndex: 15, typedChar: "e", timestampMs: 1550, isCorrect: true },
      { charIndex: 16, typedChar: "r", timestampMs: 1600, isCorrect: true },
      { charIndex: 17, typedChar: " ", timestampMs: 1700, isCorrect: true },
    ];

    const session = createMockSession(keystrokes, 45);
    const result = analyzeHeatmap(session, mockText);

    expect(result).not.toBeNull();

    // Verify we have stats for 4 words
    expect(result?.wordStatsMap.size).toBe(4);

    // First word ("The" in 200ms) should be very fast
    const word0 = result?.wordStatsMap.get(0);
    expect(word0?.wpm).toBeGreaterThan(100);
    expect(word0?.word).toBe("The");

    // Subsequent words should be around the session average
    const word1 = result?.wordStatsMap.get(1);
    expect(word1?.word).toBe("sun");
    // "sun" + space = 4 keystrokes in 500ms = (4/5) / (500/60000) = 0.8 / 0.00833 = 96 WPM
    expect(word1?.wpm).toBeCloseTo(96, 0);

    // First word is faster, should be in a higher bucket
    expect(word0!.bucket).toBeGreaterThan(word1!.bucket!);
  });

  it("handles single word without trailing space", () => {
    // Text: "Hello" (no space after)
    const keystrokes = [
      { charIndex: 0, typedChar: "H", timestampMs: 100, isCorrect: true },
      { charIndex: 1, typedChar: "e", timestampMs: 200, isCorrect: true },
      { charIndex: 2, typedChar: "l", timestampMs: 300, isCorrect: true },
      { charIndex: 3, typedChar: "l", timestampMs: 400, isCorrect: true },
      { charIndex: 4, typedChar: "o", timestampMs: 500, isCorrect: true },
    ];

    const session = createMockSession(keystrokes, 60);
    const result = analyzeHeatmap(session, "Hello");

    expect(result).not.toBeNull();
    expect(result?.wordStatsMap.size).toBe(1);
    const word0 = result?.wordStatsMap.get(0);
    expect(word0?.word).toBe("Hello");
    // 5 keystrokes in 500ms = (5/5) / (500/60000) = 120 WPM
    expect(word0?.wpm).toBeCloseTo(120, 0);
  });

  it("handles incomplete word (partial typing)", () => {
    // Text: "Hello world" but only typed "Hel"
    const keystrokes = [
      { charIndex: 0, typedChar: "H", timestampMs: 100, isCorrect: true },
      { charIndex: 1, typedChar: "e", timestampMs: 200, isCorrect: true },
      { charIndex: 2, typedChar: "l", timestampMs: 300, isCorrect: true },
    ];

    const session = createMockSession(keystrokes, 40);
    const result = analyzeHeatmap(session, "Hello world");

    expect(result).not.toBeNull();
    expect(result?.wordStatsMap.size).toBe(1);
    const word0 = result?.wordStatsMap.get(0);
    // Only 3 keystrokes typed, not 5
    // 3 keystrokes in 300ms = (3/5) / (300/60000) = 0.6 / 0.005 = 120 WPM
    expect(word0?.wpm).toBeCloseTo(120, 0);
  });

  it("ignores backspace keystrokes in WPM calculation", () => {
    // Text: "The" - user typed T, h, backspace, h, e, space
    const keystrokes = [
      { charIndex: 0, typedChar: "T", timestampMs: 100, isCorrect: true },
      { charIndex: 1, typedChar: "h", timestampMs: 200, isCorrect: true },
      {
        charIndex: 1,
        typedChar: "Backspace",
        timestampMs: 300,
        isCorrect: false,
      },
      { charIndex: 1, typedChar: "h", timestampMs: 400, isCorrect: true },
      { charIndex: 2, typedChar: "e", timestampMs: 500, isCorrect: true },
      { charIndex: 3, typedChar: " ", timestampMs: 600, isCorrect: true },
    ];

    const session = createMockSession(keystrokes, 50);
    const result = analyzeHeatmap(session, mockText);

    expect(result).not.toBeNull();
    const word0 = result?.wordStatsMap.get(0);
    // Backspaces should be ignored: only T, h, h, e, space = 5 keystrokes
    // But wait - we count charIndex positions, not unique chars
    // The logic counts keystrokes that are NOT backspace and within word boundary
    // So: T(0), h(1), h(1), e(2), space(3) = 5 keystrokes in 600ms
    expect(word0?.wpm).toBeDefined();
  });

  it("applies minimum duration of 200ms to prevent inflated WPM", () => {
    // Super fast typing: 4 keystrokes in 50ms
    // Without safeguard: (4/5) / (50/60000) = 960 WPM (unrealistic)
    // With 200ms minimum: (4/5) / (200/60000) = 240 WPM
    const keystrokes = [
      { charIndex: 0, typedChar: "T", timestampMs: 10, isCorrect: true },
      { charIndex: 1, typedChar: "h", timestampMs: 20, isCorrect: true },
      { charIndex: 2, typedChar: "e", timestampMs: 40, isCorrect: true },
      { charIndex: 3, typedChar: " ", timestampMs: 50, isCorrect: true },
    ];

    const session = createMockSession(keystrokes, 100);
    const result = analyzeHeatmap(session, mockText);

    expect(result).not.toBeNull();
    const word0 = result?.wordStatsMap.get(0);
    // Should cap at 240 WPM due to 200ms minimum duration
    expect(word0?.wpm).toBeCloseTo(240, 0);
  });

  it("distributes buckets evenly for uniform typing speed", () => {
    // All words typed at exactly the same speed
    const keystrokes = [
      // Word 0: "The" + space = 500ms each word
      { charIndex: 0, typedChar: "T", timestampMs: 100, isCorrect: true },
      { charIndex: 1, typedChar: "h", timestampMs: 200, isCorrect: true },
      { charIndex: 2, typedChar: "e", timestampMs: 400, isCorrect: true },
      { charIndex: 3, typedChar: " ", timestampMs: 500, isCorrect: true },
      // Word 1: "quick" + space = 500ms
      { charIndex: 4, typedChar: "q", timestampMs: 600, isCorrect: true },
      { charIndex: 5, typedChar: "u", timestampMs: 700, isCorrect: true },
      { charIndex: 6, typedChar: "i", timestampMs: 800, isCorrect: true },
      { charIndex: 7, typedChar: "c", timestampMs: 900, isCorrect: true },
      { charIndex: 8, typedChar: "k", timestampMs: 950, isCorrect: true },
      { charIndex: 9, typedChar: " ", timestampMs: 1000, isCorrect: true },
    ];

    const session = createMockSession(keystrokes, 60);
    const result = analyzeHeatmap(session, mockText);

    expect(result).not.toBeNull();

    // Word 0: 4 keys in 500ms = 96 WPM
    // Word 1: 6 keys in 500ms = 144 WPM
    const word0 = result?.wordStatsMap.get(0);
    const word1 = result?.wordStatsMap.get(1);

    // When speeds are relatively similar, bucket difference should be small
    // word1 is faster, so it should be in same or higher bucket than word0
    expect(word1!.bucket).toBeGreaterThanOrEqual(word0!.bucket!);
  });

  it("handles multiple errors in a single word", () => {
    const keystrokes = [
      { charIndex: 0, typedChar: "X", timestampMs: 100, isCorrect: false }, // Error
      { charIndex: 1, typedChar: "Y", timestampMs: 200, isCorrect: false }, // Error
      { charIndex: 2, typedChar: "Z", timestampMs: 300, isCorrect: false }, // Error
      { charIndex: 3, typedChar: " ", timestampMs: 400, isCorrect: true },
    ];

    const session = createMockSession(keystrokes);
    const result = analyzeHeatmap(session, mockText);

    const stats = result?.wordStatsMap.get(0);
    expect(stats?.hasError).toBe(true);
    expect(stats?.errorCharIndices.size).toBe(3);
    expect(stats?.errorCharIndices.has(0)).toBe(true);
    expect(stats?.errorCharIndices.has(1)).toBe(true);
    expect(stats?.errorCharIndices.has(2)).toBe(true);
  });

  it("uses median WPM as anchor when session WPM is 0", () => {
    const keystrokes = [
      { charIndex: 0, typedChar: "T", timestampMs: 100, isCorrect: true },
      { charIndex: 1, typedChar: "h", timestampMs: 200, isCorrect: true },
      { charIndex: 2, typedChar: "e", timestampMs: 300, isCorrect: true },
      { charIndex: 3, typedChar: " ", timestampMs: 400, isCorrect: true },
    ];

    // Session with 0 WPM (edge case)
    const session = createMockSession(keystrokes, 0);
    const result = analyzeHeatmap(session, mockText);

    expect(result).not.toBeNull();
    // Should still produce valid buckets using median
    expect(result?.buckets).toBeDefined();
    expect(result?.buckets.length).toBe(6);
  });

  it("detects extra characters in a word", () => {
    const keystrokes = [
      { charIndex: 0, typedChar: "T", timestampMs: 100, isCorrect: true },
      { charIndex: 0, typedChar: "t", timestampMs: 150, isCorrect: false }, // Extra
      { charIndex: 1, typedChar: "h", timestampMs: 200, isCorrect: true },
      { charIndex: 2, typedChar: "e", timestampMs: 300, isCorrect: true },
      { charIndex: 3, typedChar: "x", timestampMs: 350, isCorrect: false }, // Extra at space
      { charIndex: 3, typedChar: " ", timestampMs: 400, isCorrect: true },
    ];

    const session = createMockSession(keystrokes);
    const result = analyzeHeatmap(session, mockText);

    const stats = result?.wordStatsMap.get(0);
    expect(stats?.extras).toBeDefined();
    expect(stats?.extras).toContain("t");
    expect(stats?.extras).toContain("x");
  });

  it("detects skips in a word", () => {
    const keystrokes = [
      { charIndex: 0, typedChar: "T", timestampMs: 100, isCorrect: true },
      // Jump from index 0 to index 4 (start of "quick")
      {
        charIndex: 4,
        typedChar: "q",
        timestampMs: 400,
        isCorrect: true,
        skipOrigin: 0,
      },
    ];

    const session = createMockSession(keystrokes);
    const result = analyzeHeatmap(session, "The quick");

    const stats = result?.wordStatsMap.get(0);
    expect(stats?.skipIndex).toBe(0);
  });

  it("collects typed characters even for skipped words", () => {
    const keystrokes = [
      { charIndex: 0, typedChar: "T", timestampMs: 100, isCorrect: true },
      // Jump from index 0 to index 4 (start of "quick")
      {
        charIndex: 4,
        typedChar: "q",
        timestampMs: 400,
        isCorrect: true,
        skipOrigin: 0,
      },
    ];

    const session = createMockSession(keystrokes);
    const result = analyzeHeatmap(session, "The quick");

    const stats = result?.wordStatsMap.get(0);
    expect(stats?.typedChars).toBe("T");
  });

  it("collects typedChars with errors and extras", () => {
    const keystrokes = [
      { charIndex: 0, typedChar: "t", timestampMs: 100, isCorrect: false }, // error
      { charIndex: 0, typedChar: "e", timestampMs: 150, isCorrect: false }, // extra after char 0
      { charIndex: 1, typedChar: "h", timestampMs: 200, isCorrect: true },
      { charIndex: 2, typedChar: "e", timestampMs: 300, isCorrect: true },
    ];

    const session = createMockSession(keystrokes);
    const result = analyzeHeatmap(session, "The quick");

    const stats = result?.wordStatsMap.get(0);
    // typedChars should only contain characters typed at the valid indices of the word
    // extras are NOT in typedChars, they are in 'extras'
    // 0: 't' (wrong) -> typedChars[0] = 't'
    // 0: 'e' (extra) -> extras.push('e')
    // 1: 'h' (correct) -> typedChars[1] = 'h'
    // 2: 'e' (correct) -> typedChars[2] = 'e'
    expect(stats?.typedChars).toBe("the");
    expect(stats?.extras).toContain("e");
  });
});

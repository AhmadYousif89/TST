"use client";

import { useMemo, useState } from "react";
import { TypingSessionDoc } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { HeatmapIcon } from "@/components/heatmap.icon";

type HeatmapProps = {
  session: TypingSessionDoc;
  text?: string;
};

const HEATMAP_COLORS = [
  "var(--red-500)", // Very Slow
  "var(--orange-500)", // Slow
  "var(--neutral-200)", // Below Avg
  "var(--blue-200)", // Fast
  "var(--blue-600)", // Very Fast
];

export const HeatmapHistory = ({ session, text }: HeatmapProps) => {
  const [isEnabled, setIsEnabled] = useState(false);

  const analysis = useMemo(() => {
    if (!session.keystrokes || session.keystrokes.length === 0 || !text) {
      return null;
    }

    const { keystrokes } = session;
    const sortedKeystrokes = [...keystrokes].sort(
      (a, b) => a.timestampMs - b.timestampMs,
    );

    // Map word index to stats
    const wordStatsMap = new Map<
      number,
      {
        wpm: number;
        word: string;
        hasError: boolean;
        errorCharIndices: Set<number>;
      }
    >();

    const words = text.split(" ");
    let charIndexPointer = 0;

    const wordWPMsList: number[] = [];

    let previousWordEndTime = 0; // Timestamp of the last word that was typed
    let lastTypedWordIndex = -1; // Index of the last word that was typed

    words.forEach((word, wordIdx) => {
      const startIndex = charIndexPointer;
      const endIndex = startIndex + word.length; // without the space

      // Find keystrokes relevant to this word (including potential errors)
      const wordKeystrokes = sortedKeystrokes.filter(
        (k) =>
          k.charIndex >= startIndex &&
          k.charIndex < endIndex &&
          k.typedChar !== "Backspace",
      );

      // Check for errors in this range
      const hasError = sortedKeystrokes.some(
        (k) =>
          ((k.charIndex >= startIndex && k.charIndex < endIndex) || // match char in word
            (k.charIndex === endIndex && k.expectedChar === " ")) && // OR match the space after (if error on space)
          !k.isCorrect,
      );

      // Identify specific char errors
      const errorCharIndices = new Set<number>();
      for (let i = 0; i < word.length; i++) {
        const globalIndex = startIndex + i;
        const charHasError = sortedKeystrokes.some(
          (k) => k.charIndex === globalIndex && !k.isCorrect,
        );
        if (charHasError) {
          errorCharIndices.add(i);
        }
      }

      let wpm = 0;

      if (wordKeystrokes.length > 0) {
        const lastKeystroke = wordKeystrokes[wordKeystrokes.length - 1];
        const currentWordEndTime = lastKeystroke.timestampMs;

        // duration = (time when we finished this word) - (time when we finished previous word)
        const durationMs = currentWordEndTime - previousWordEndTime;

        // Update for next loop
        previousWordEndTime = currentWordEndTime;

        const safeDuration = Math.max(durationMs, 200);
        wpm = word.length / 5 / (safeDuration / 60000);

        wordWPMsList.push(wpm);
        lastTypedWordIndex = wordIdx;
      }

      if (wpm > 0)
        wordStatsMap.set(wordIdx, { wpm, hasError, word, errorCharIndices });

      // Advance pointer (word + space)
      charIndexPointer += word.length + 1;
    });

    if (wordWPMsList.length === 0) return null;

    const minWpm = Math.min(...wordWPMsList);
    const maxWpm = Math.max(...wordWPMsList);

    // Create buckets
    const spread = maxWpm - minWpm;
    const step = spread / (HEATMAP_COLORS.length - 1); // 5 colors means 4 steps

    const getBucket = (wpm: number) => {
      if (wpm <= minWpm + step) return 0;
      if (wpm <= minWpm + step * 2) return 1;
      if (wpm <= minWpm + step * 3) return 2;
      if (wpm <= minWpm + step * 4) return 3;
      return 4; // Max bucket
    };

    const buckets = [
      Math.round(minWpm),
      Math.round(minWpm + step),
      Math.round(minWpm + step * 2),
      Math.round(minWpm + step * 3),
      Math.round(minWpm + step * 4),
      Math.round(maxWpm),
    ];

    // Limit displayed words to typed words + a few context words
    const displayWords = words.slice(0, lastTypedWordIndex + 3);

    return { wordStatsMap, getBucket, buckets, words: displayWords };
  }, [session, text]);

  if (!text || !analysis) return null;

  const { wordStatsMap, getBucket, buckets, words } = analysis;

  return (
    <div className="space-y-2 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <h3 className="text-muted-foreground/60 text-6 md:text-5 flex items-center gap-2">
            input history
          </h3>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className={cn(
                  "size-6 rounded-full",
                  isEnabled ? "text-foreground" : "text-muted-foreground",
                )}
                onClick={() => setIsEnabled(!isEnabled)}
              >
                <HeatmapIcon className="size-5 md:size-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <span>Toggle Heatmap</span>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Legend / Heat Map */}
        {isEnabled && (
          <div className="text-6 flex items-center overflow-hidden rounded-full font-mono">
            {HEATMAP_COLORS.map((color, i) => (
              <div
                key={i}
                className="text-background cursor-default px-1 pb-0.5 font-mono sm:px-2"
                style={{ backgroundColor: color }}
              >
                {i === 0
                  ? `<${buckets[1]}`
                  : i === 4
                    ? `${buckets[4]}+`
                    : `${buckets[i]}-${buckets[i + 1]}`}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Words History */}
      <div className="text-5 flex flex-wrap gap-x-3.25 gap-y-1 select-none">
        {words.map((word, i) => {
          const stats = wordStatsMap.get(i);
          const wpm = stats?.wpm || 0;
          const hasError = stats?.hasError;
          const errorIndices = stats?.errorCharIndices;

          // If disabled, don't color. If enabled, use bucket color.
          const colorVariable =
            isEnabled && stats && stats.wpm > 0
              ? HEATMAP_COLORS[getBucket(wpm)]
              : undefined;

          const content = isEnabled ? (
            word
          ) : (
            <span
              className={cn(
                hasError &&
                  "decoration-red underline decoration-2 underline-offset-4",
              )}
            >
              {word.split("").map((char, charIdx) => (
                <span
                  key={charIdx}
                  className={cn(errorIndices?.has(charIdx) && "text-red")}
                >
                  {char}
                </span>
              ))}
            </span>
          );

          return (
            <Tooltip key={i} delayDuration={0}>
              <TooltipTrigger asChild>
                <div
                  style={{ color: colorVariable }}
                  className={cn(
                    "cursor-default font-mono transition-colors duration-200",
                    !colorVariable && "text-muted-foreground",
                    hasError &&
                      "decoration-red underline decoration-2 underline-offset-4",
                  )}
                >
                  {content}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{Math.round(wpm)} wpm</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
};

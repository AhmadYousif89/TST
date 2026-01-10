"use client";

import { useMemo, useState, memo } from "react";
import { TypingSessionDoc } from "@/lib/types";
import { analyzeHeatmap } from "./heatmap-logic";
import { cn } from "@/lib/utils";
import {
  ResponsiveTooltip,
  ResponsiveTooltipContent,
  ResponsiveTooltipTrigger,
} from "@/components/responsive-tooltip";
import { Button } from "@/components/ui/button";
import { HeatmapIcon } from "@/components/heatmap.icon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMediaQuery } from "@/hooks/use-media-query";

type HeatmapProps = {
  session: TypingSessionDoc;
  text?: string;
};

type WordItemProps = {
  word: string;
  stats: any;
  getBucket: (wpm: number) => number;
  isEnabled: boolean;
};

const WordItem = memo(
  ({ word, stats, getBucket, isEnabled }: WordItemProps) => {
    const wpm = stats?.wpm || 0;
    const hasError = stats?.hasError;
    const errorIndices = stats?.errorCharIndices;

    const colorVariable =
      isEnabled && stats && stats.wpm > 0
        ? HEATMAP_COLORS[getBucket(wpm)]
        : undefined;

    const content = isEnabled ? (
      word
    ) : (
      <span className={cn(hasError && "decoration-red underline decoration-2")}>
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
      <ResponsiveTooltip delayDuration={0}>
        <ResponsiveTooltipTrigger asChild>
          <div
            style={{ color: colorVariable }}
            className={cn(
              "cursor-default font-mono",
              !colorVariable && "text-muted-foreground",
            )}
          >
            {content}
          </div>
        </ResponsiveTooltipTrigger>
        <ResponsiveTooltipContent side="top">
          <p>{Math.round(wpm)} wpm</p>
        </ResponsiveTooltipContent>
      </ResponsiveTooltip>
    );
  },
);

const HEATMAP_COLORS = [
  "var(--red-500)", // Very Slow
  "var(--orange-400)", // Slow
  "var(--neutral-200)", // Avg
  "var(--blue-200)", // Fast
  "var(--blue-600)", // Very Fast
];

export const HeatmapHistory = ({ session, text }: HeatmapProps) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const isMobile = useMediaQuery("(max-width: 1024px)");

  const analysis = useMemo(() => {
    return analyzeHeatmap(session, text || "");
  }, [session, text]);

  if (!text || !analysis) return null;

  const { wordStatsMap, getBucket, buckets, words } = analysis;

  return (
    <div className="space-y-2 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 pt-2">
        <div className="flex items-center gap-2">
          <h3 className="text-muted-foreground/60 text-6 md:text-5 flex items-center gap-2">
            input history
          </h3>
          <Tooltip open={isMobile ? false : undefined}>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                aria-pressed={isEnabled}
                aria-label="Toggle Heatmap"
                className={cn(
                  "group size-6 rounded-full hover:bg-transparent!",
                  isEnabled ? "text-foreground" : "text-muted-foreground",
                )}
                onClick={() => setIsEnabled(!isEnabled)}
              >
                <HeatmapIcon className="group-hover:text-red group-aria-pressed:text-red size-5 md:size-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
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
                className="text-background cursor-default px-1 py-0.5 font-mono sm:px-2"
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
      <div className="text-5 flex flex-wrap gap-x-3.25 gap-y-1 pb-2 select-none">
        {words.map((word, i) => (
          <WordItem
            key={`${session._id}-${i}`}
            word={word}
            stats={wordStatsMap.get(i)}
            getBucket={getBucket}
            isEnabled={isEnabled}
          />
        ))}
      </div>
    </div>
  );
};

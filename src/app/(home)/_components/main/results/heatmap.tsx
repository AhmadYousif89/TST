"use client";

import { useMemo, useState, memo } from "react";

import { cn } from "@/lib/utils";
import { useResult } from "./result.context";
import { analyzeHeatmap, WordStats } from "./heatmap-logic";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ResponsiveTooltip,
  ResponsiveTooltipContent,
  ResponsiveTooltipTrigger,
} from "@/components/responsive-tooltip";
import { Button } from "@/components/ui/button";
import { HeatmapIcon } from "@/components/heatmap.icon";

const HEATMAP_COLORS = [
  "var(--red-500)", // Very Slow
  "var(--orange-400)", // Slow
  "var(--heatmap-neutral)", // Avg
  "var(--blue-200)", // Fast
  "var(--blue-600)", // Very Fast
];

type WordItemProps = {
  word: string;
  stats: WordStats | undefined;
  isHeatmapVisible: boolean;
};

const WordItem = memo(({ word, stats, isHeatmapVisible }: WordItemProps) => {
  const wpm = stats?.wpm || 0;
  const hasError = stats?.hasError;
  const errorIndices = stats?.errorCharIndices;
  const extras = stats?.extras;
  const skipIndex = stats?.skipIndex;
  const bucket = stats?.bucket;

  const colorVariable =
    isHeatmapVisible && bucket !== undefined
      ? HEATMAP_COLORS[bucket]
      : undefined;

  const hasExtras = extras && extras.length > 0;

  const renderedWord = useMemo(() => {
    const chars = word.split("");
    const result = [];

    chars.forEach((char, idx) => {
      if (skipIndex === idx)
        result.push(<ErrorIndicator key={`skip-${idx}`} className="mx-px" />);

      const isError = !isHeatmapVisible && errorIndices?.has(idx);
      result.push(
        <span key={idx} className={cn(isError && "text-red")}>
          {char}
        </span>,
      );
    });

    if (hasExtras)
      result.push(<ErrorIndicator key="extras-indicator" className="ml-px" />);

    return result;
  }, [word, isHeatmapVisible, errorIndices, skipIndex, hasExtras]);

  const content = (
    <span
      className={cn(
        !isHeatmapVisible &&
          hasError &&
          "decoration-red underline decoration-2",
      )}
    >
      {renderedWord}
    </span>
  );

  return (
    <ResponsiveTooltip delayDuration={0}>
      <ResponsiveTooltipTrigger asChild>
        <div
          style={{ color: colorVariable }}
          className={cn(
            "cursor-default font-mono",
            isHeatmapVisible ? "text-muted" : "text-muted-foreground",
          )}
        >
          {content}
        </div>
      </ResponsiveTooltipTrigger>
      <ResponsiveTooltipContent side="top">
        <div className="flex flex-col items-center gap-1">
          <p className="font-medium">{Math.round(wpm)} wpm</p>
          {/* {(skipIndex !== undefined || hasExtras) && ( */}
          <div className="text-muted-foreground text-5 font-mono font-medium">
            {word.split("").map((char, i) => {
              if (skipIndex !== undefined && i >= skipIndex) return null; // Don't show skipped chars
              const isError = errorIndices?.has(i);
              return (
                <span key={i} className={cn(isError && "text-red")}>
                  {stats?.typedChars?.[i] || char}
                </span>
              );
            })}
            {hasExtras && <span className="text-red">{extras.join("")}</span>}
          </div>
          {/* // )} */}
        </div>
      </ResponsiveTooltipContent>
    </ResponsiveTooltip>
  );
});

export const HeatmapHistory = () => {
  const { session, text, isScreenshotting } = useResult();
  const [isHeatmapVisible, setHeatmapVisibility] = useState(false);
  const isMobile = useMediaQuery("(max-width: 1024px)");

  const effectiveIsEnabled = isScreenshotting || isHeatmapVisible;

  const analysis = useMemo(() => {
    return analyzeHeatmap(session, text || "");
  }, [session, text]);

  if (!text || !analysis) return null;

  const { wordStatsMap, buckets, words } = analysis;

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
                aria-pressed={isHeatmapVisible || isScreenshotting}
                aria-label="Toggle Heatmap"
                className="text-muted-foreground group dark:hover:text-muted-foreground size-6 rounded-full hover:bg-transparent!"
                onClick={() => setHeatmapVisibility(!isHeatmapVisible)}
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
        {effectiveIsEnabled && (
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
            isHeatmapVisible={effectiveIsEnabled}
          />
        ))}
      </div>
    </div>
  );
};

const ErrorIndicator = ({ className }: { className?: string }) => {
  return (
    <span
      className={cn("inline-flex flex-col justify-center gap-0.5", className)}
    >
      <span className="bg-red size-0.5 rounded-full" />
      <span className="bg-red size-0.5 rounded-full" />
      <span className="bg-red size-0.5 rounded-full" />
    </span>
  );
};

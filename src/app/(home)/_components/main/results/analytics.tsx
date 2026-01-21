import { Activity } from "react";

import { cn } from "@/lib/utils";
import { useResult } from "./result.context";

import { SessionChart } from "./chart";
import { ReplaySection } from "./replay";
import { HeatmapHistory } from "./heatmap";
import { SessionStatistics } from "./statistics";

type AnalyticSectionProps = {
  isAnimatingReplay: boolean;
  isAnimatingHistory: boolean;
  showReplay: boolean;
  showHistory: boolean;
  setIsAnimatingReplay: (value: boolean) => void;
  setIsAnimatingHistory: (value: boolean) => void;
};

export const AnalyticSection = ({
  isAnimatingReplay,
  isAnimatingHistory,
  showReplay,
  showHistory,
  setIsAnimatingReplay,
  setIsAnimatingHistory,
}: AnalyticSectionProps) => {
  const { isScreenshotting } = useResult();

  const effectiveShowHistory = isScreenshotting || showHistory;
  const effectiveShowReplay = !isScreenshotting && showReplay;
  const shouldShowHistory = effectiveShowHistory || isAnimatingHistory;
  const shouldShowReplay = effectiveShowReplay || isAnimatingReplay;

  return (
    <div className="flex w-full flex-col">
      <div className="h-50 w-full">
        <SessionChart />
      </div>
      <div className="mx-auto grid w-full max-w-5xl">
        <SessionStatistics />
        <div
          className={cn(
            isScreenshotting
              ? "block w-full"
              : "grid w-full transition-[grid-template-rows] duration-300 ease-in-out",
            effectiveShowHistory ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          )}
          onTransitionEnd={() => setIsAnimatingHistory(false)}
        >
          <Activity mode={shouldShowHistory ? "visible" : "hidden"}>
            <HeatmapHistory />
          </Activity>
        </div>

        <div
          className={cn(
            isScreenshotting
              ? "grid-rows-[0fr]"
              : "grid w-full transition-[grid-template-rows] duration-300 ease-in-out",
            effectiveShowReplay ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          )}
          onTransitionEnd={() => setIsAnimatingReplay(false)}
        >
          <Activity mode={shouldShowReplay ? "visible" : "hidden"}>
            <ReplaySection />
          </Activity>
        </div>
      </div>
    </div>
  );
};

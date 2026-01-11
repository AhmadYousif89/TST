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

  return (
    <div className="flex w-full flex-col">
      <div className="h-50 w-full">
        <SessionChart />
      </div>
      <div className="mx-auto grid w-full max-w-5xl gap-4">
        <SessionStatistics />
        <div
          className={cn(
            isScreenshotting
              ? "block w-full"
              : "grid w-full transition-[grid-template-rows] duration-300 ease-in-out",
            !isScreenshotting && effectiveShowHistory
              ? "grid-rows-[1fr]"
              : "grid-rows-[0fr]",
          )}
          onTransitionEnd={() => setIsAnimatingHistory(false)}
        >
          <Activity
            mode={
              effectiveShowHistory || isAnimatingHistory ? "visible" : "hidden"
            }
          >
            <HeatmapHistory />
          </Activity>
        </div>

        <div
          className={cn(
            isScreenshotting
              ? "block w-full"
              : "grid w-full transition-[grid-template-rows] duration-300 ease-in-out",
            !isScreenshotting && effectiveShowReplay
              ? "grid-rows-[1fr]"
              : "grid-rows-[0fr]",
          )}
          onTransitionEnd={() => setIsAnimatingReplay(false)}
        >
          <Activity
            mode={
              effectiveShowReplay || isAnimatingReplay ? "visible" : "hidden"
            }
          >
            <ReplaySection />
          </Activity>
        </div>
      </div>
    </div>
  );
};

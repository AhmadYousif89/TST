import { Activity } from "react";

import { cn } from "@/lib/utils";
import { TypingSessionDoc } from "@/lib/types";

import { SessionChart } from "./chart";
import { ReplaySection } from "./replay";
import { HeatmapHistory } from "./heatmap";
import { SessionStatistics } from "./statistics";

type AnalyticSectionProps = {
  text?: string;
  session: TypingSessionDoc;
  isAnimatingReplay: boolean;
  isAnimatingHistory: boolean;
  showReplay: boolean;
  showHistory: boolean;
  setIsAnimatingReplay: (value: boolean) => void;
  setIsAnimatingHistory: (value: boolean) => void;
};

export const AnalyticSection = ({
  text,
  session,
  isAnimatingReplay,
  isAnimatingHistory,
  showReplay,
  showHistory,
  setIsAnimatingReplay,
  setIsAnimatingHistory,
}: AnalyticSectionProps) => {
  return (
    <div className="flex w-full flex-col">
      <div className="h-50">
        <SessionChart session={session} />
      </div>
      <div className="mx-auto grid w-full max-w-5xl gap-4">
        <SessionStatistics session={session} />
        <div
          className={cn(
            "grid w-full transition-[grid-template-rows] duration-300 ease-in-out",
            showHistory ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          )}
          onTransitionEnd={() => setIsAnimatingHistory(false)}
        >
          <Activity
            mode={showHistory || isAnimatingHistory ? "visible" : "hidden"}
          >
            <HeatmapHistory session={session} text={text} />
          </Activity>
        </div>

        <div
          className={cn(
            "grid w-full transition-[grid-template-rows] duration-300 ease-in-out",
            showReplay ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          )}
          onTransitionEnd={() => setIsAnimatingReplay(false)}
        >
          <Activity
            mode={showReplay || isAnimatingReplay ? "visible" : "hidden"}
          >
            <ReplaySection session={session} text={text} />
          </Activity>
        </div>
      </div>
    </div>
  );
};

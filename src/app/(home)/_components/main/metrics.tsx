"use client";

import { formatTime } from "../../engine/engine-logic";
import { useEngineConfig, useEngineMetrics } from "../../engine/engine.context";

export const Metrics = () => {
  const { wpm, accuracy, timeLeft } = useEngineMetrics();
  const { mode, status } = useEngineConfig();

  let timeLeftStyle = "";
  if (status === "typing" || status === "paused")
    timeLeftStyle = "dark:text-yellow text-orange";
  if (mode !== "passage" && timeLeft < 10) timeLeftStyle = "text-red";
  if (mode === "passage" && status === "finished") timeLeftStyle = "text-green";

  return (
    <div className="grid grid-flow-col justify-center gap-5 pb-4 text-center md:gap-4">
      <div className="flex flex-col gap-2 max-md:grow md:flex-row md:gap-3">
        <span className="text-muted-foreground text-3-mobile md:text-3">
          WPM:
        </span>
        <span className="text-2">{Math.round(wpm)}</span>
      </div>
      <div className="bg-border mx-5 h-full w-px" />
      <div className="flex flex-col gap-2 max-md:grow md:flex-row md:gap-3">
        <span className="text-muted-foreground text-3-mobile md:text-3">
          Accuracy:
        </span>
        <span
          className={`text-2 ${status !== "idle" && accuracy === 100 ? "text-green" : accuracy < 100 ? "text-red" : ""}`}
        >
          {Math.round(accuracy)}%
        </span>
      </div>
      <div className="bg-border mx-5 h-full w-px" />
      <div className="flex flex-col gap-2 max-md:grow md:flex-row md:gap-3">
        <span className="text-muted-foreground text-3-mobile md:text-3">
          Time:
        </span>
        <span className={`text-2 ${timeLeftStyle}`}>
          {formatTime(timeLeft)}
        </span>
      </div>
    </div>
  );
};

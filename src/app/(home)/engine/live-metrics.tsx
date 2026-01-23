import { cn } from "@/lib/utils";
import { useEngineConfig, useEngineMetrics } from "./engine.context";
import { Activity } from "react";

export const LiveMetrics = () => {
  const { status } = useEngineConfig();
  const { wpm, timeLeft } = useEngineMetrics();

  return (
    <Activity mode={status === "typing" ? "visible" : "hidden"}>
      <div
        className={cn(
          "text-1 absolute top-1/2 left-4 hidden -translate-y-52 grid-flow-col items-center gap-4 font-mono duration-500 ease-in-out md:grid",
          status === "typing" && "animate-in fade-in",
        )}
      >
        <div className="grid">
          <span className="text-5 text-muted-foreground">WPM</span>
          <span className="text-blue-400">{wpm}</span>
        </div>
        <span className="bg-border h-full w-px rounded" />
        <div className="grid">
          <span className="text-5 text-muted-foreground">Timer</span>
          <span className="text-blue-400">{timeLeft}</span>
        </div>
      </div>
    </Activity>
  );
};

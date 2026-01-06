"use client";

import { Metrics } from "./metrics";
import { ResetButton } from "./reset.button";
import { RandomButton } from "./random.button";
import { EngineContainer } from "../../engine/engine";
import { useEngineConfig, useEngineMetrics } from "../../engine/engine.context";
import { getModeLabel } from "../../engine/engine-logic";
import { LoadingResults } from "./loading-results";
import { Badge } from "@/components/ui/badge";

export const MainContent = () => {
  const { isLoadingResults } = useEngineMetrics();

  return (
    <>
      <main className="flex grow flex-col">
        {isLoadingResults && <LoadingResults />}
        <Metrics />
        <section className="relative flex grow flex-col justify-between">
          <EngineContainer />
          <TextInfo />
          <div className="flex items-center justify-center gap-8 py-4 md:py-8">
            <RandomButton />
            <ResetButton />
          </div>
        </section>
      </main>
    </>
  );
};

const TextInfo = () => {
  const { textData, mode } = useEngineConfig();

  return (
    <div className="text-muted-foreground flex items-center justify-center">
      <div className="flex items-center gap-1.5">
        <Badge className="text-6 bg-muted/25 font-medium capitalize">
          {textData?.category}
        </Badge>
      </div>
      <div className="bg-border mx-4 h-full w-px" />
      <div className="flex items-center gap-1.5">
        <Badge className="text-6 bg-muted/25 font-medium capitalize">
          {textData?.difficulty}
        </Badge>
      </div>
      <div className="bg-border mx-4 h-full w-px" />
      <div className="flex items-center gap-1.5">
        <Badge className="text-6 bg-muted/25 font-medium">
          {getModeLabel(mode)}
        </Badge>
      </div>
    </div>
  );
};

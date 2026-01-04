"use client";

import { Metrics } from "./metrics";
import { EngineContainer } from "../../engine/engine";
import { ResetButton } from "./reset.button";
import { RandomTextButton } from "./random-text.button";
import { useEngineMetrics } from "../../engine/engine.context";
import { LoadingResults } from "./loading-results";

export const MainContent = () => {
  const { isLoadingResults } = useEngineMetrics();

  return (
    <>
      <main className="relative flex grow flex-col">
        {isLoadingResults && <LoadingResults />}
        <Metrics />
        <section className="flex grow flex-col justify-between">
          <EngineContainer />
          <div
            data-engine-offset
            className="flex items-center justify-center gap-4 border-y py-4 md:py-8"
          >
            <RandomTextButton />
            <ResetButton />
          </div>
        </section>
      </main>
    </>
  );
};

import { Metrics } from "./metrics";
import { EngineContainer } from "../../engine/engine";
import { ResetButton } from "./reset.button";
import { RandomTextButton } from "./random-text.button";

export const MainContent = () => {
  return (
    <>
      <main className="flex grow flex-col">
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

import { Metrics } from "./metrics";
import { TextInfo } from "./text-info";
import { ResetButton } from "./reset.button";
import { RandomButton } from "./random.button";
import { EngineContainer } from "../../engine/engine";

import { NextTextButton } from "./results/next-text.button";

type Props = {
  nextTextId: string | null;
  randomId: string | null;
};

export const MainContent = ({ nextTextId, randomId }: Props) => {
  return (
    <>
      <main className="flex grow flex-col">
        <Metrics />
        <section className="relative flex grow flex-col justify-between">
          <EngineContainer />
          <TextInfo />
          <div className="flex items-center justify-center gap-8 py-4 md:py-8">
            <RandomButton randomId={randomId} />
            {nextTextId && (
              <NextTextButton
                nextTextId={nextTextId}
                className="text-muted-foreground"
              />
            )}
            <ResetButton />
          </div>
        </section>
      </main>
    </>
  );
};

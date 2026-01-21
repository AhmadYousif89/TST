import { Metrics } from "./metrics";
import { TextInfo } from "./text-info";
import { ResetButton } from "./reset.button";
import { RandomButton } from "./random.button";
import { EngineContainer } from "../../engine/engine";

import { NextTextButton } from "./results/next-text.button";
import { TextDoc } from "@/lib/types";

type Props = {
  nextText: TextDoc | null;
  randomText: TextDoc | null;
};

export const MainContent = ({ nextText, randomText }: Props) => {
  return (
    <>
      <main className="flex grow flex-col">
        <Metrics />
        <section className="flex grow flex-col justify-between">
          <EngineContainer />
          <TextInfo />
          <div className="flex items-center justify-center gap-8 py-4 md:pt-8 md:pb-0">
            <RandomButton randomText={randomText} />
            {nextText && (
              <NextTextButton
                nextTextId={nextText._id.toString()}
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

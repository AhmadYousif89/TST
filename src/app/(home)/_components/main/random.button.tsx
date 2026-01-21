"use client";

import { useEngineActions } from "@/app/(home)/engine/engine.context";
import { useUrlState } from "@/hooks/use-url-state";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RandomIcon } from "@/components/random.icon";
import { useMediaQuery } from "@/hooks/use-media-query";
import { TopLoader } from "@/components/top-loader";
import { TextDoc } from "@/lib/types";

type Props = {
  randomText: TextDoc | null;
};

export const RandomButton = ({ randomText }: Props) => {
  const { resetSession } = useEngineActions();
  const { updateURL, isPending } = useUrlState();
  const isMobile = useMediaQuery("(max-width: 1024px)");

  const handleRandomize = () => {
    if (!randomText) return;

    const id = randomText._id.toString();
    const category = randomText.category;
    const difficulty = randomText.difficulty;

    updateURL({ id, category, difficulty });
    resetSession({ showOverlay: false });
  };

  return (
    <>
      <TopLoader isPending={isPending} />
      <Tooltip open={isMobile ? false : undefined}>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="text-muted-foreground"
            onClick={handleRandomize}
            disabled={isPending}
          >
            <RandomIcon className={isPending ? "animate-spin" : ""} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <span>Randomize</span>
        </TooltipContent>
      </Tooltip>
    </>
  );
};

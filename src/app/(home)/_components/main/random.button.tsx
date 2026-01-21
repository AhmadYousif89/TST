"use client";

import {
  useEngineActions,
  useEngineConfig,
} from "@/app/(home)/engine/engine.context";
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
  const { updateURL } = useEngineActions();
  const { isPending, pendingAction } = useEngineConfig();
  const isMobile = useMediaQuery("(max-width: 1024px)");

  const isRandomPending = isPending && pendingAction === "random";

  const handleRandomize = () => {
    if (!randomText) return;

    const id = randomText._id.toString();
    const category = randomText.category;
    const difficulty = randomText.difficulty;

    updateURL({ id, category, difficulty }, "random");
  };

  return (
    <>
      <Tooltip open={isMobile ? false : undefined}>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="text-muted-foreground"
            onClick={handleRandomize}
            disabled={isRandomPending}
          >
            <RandomIcon className={isRandomPending ? "opacity-60" : ""} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <span>Randomize</span>
        </TooltipContent>
      </Tooltip>
    </>
  );
};

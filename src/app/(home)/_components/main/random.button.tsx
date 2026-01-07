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

type Props = {
  randomId: string | null;
};

export const RandomButton = ({ randomId }: Props) => {
  const { resetSession } = useEngineActions();
  const { updateURL, isPending } = useUrlState();
  const isMobile = useMediaQuery("(max-width: 1024px)");

  const handleRandomize = () => {
    if (!randomId) return;

    resetSession();
    updateURL({ id: randomId });
  };

  return (
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
  );
};

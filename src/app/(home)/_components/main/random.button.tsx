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

type Props = {
  randomId: string | null;
};

export const RandomButton = ({ randomId }: Props) => {
  const { resetSession } = useEngineActions();
  const { updateURL, isPending } = useUrlState();

  const handleRandomize = () => {
    if (!randomId) return;

    resetSession();
    updateURL({ id: randomId });
  };

  return (
    <Tooltip>
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

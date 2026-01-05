"use client";

import { useTransition } from "react";

import {
  useEngineActions,
  useEngineConfig,
} from "@/app/(home)/engine/engine.context";
import { getRandomTextAction } from "@/app/dal/actions";
import { useUrlState } from "@/hooks/use-url-state";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RandomIcon } from "@/components/random.icon";

export const RandomButton = () => {
  const [isPending, startTransition] = useTransition();
  const { resetSession } = useEngineActions();
  const { textData } = useEngineConfig();
  const { updateURL } = useUrlState();

  const handleRandomize = () => {
    if (!textData) return;

    resetSession();

    startTransition(async () => {
      const nextId = await getRandomTextAction({
        textId: textData._id.toString(),
        category: textData.category,
        difficulty: textData.difficulty,
      });

      if (nextId) updateURL({ id: nextId });
    });
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

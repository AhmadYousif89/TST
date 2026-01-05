"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { RestartIcon } from "@/components/restart.icon";
import { useEngineActions } from "@/app/(home)/engine/engine.context";

export const ResetButton = () => {
  const { resetSession } = useEngineActions();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          onClick={resetSession}
          className="text-muted-foreground"
        >
          <RestartIcon />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <span>Restart</span>
      </TooltipContent>
    </Tooltip>
  );
};

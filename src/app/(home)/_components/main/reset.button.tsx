"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { RestartIcon } from "@/components/restart.icon";
import {
  useEngineActions,
  useEngineConfig,
} from "@/app/(home)/engine/engine.context";
import { useOptionalResult } from "./results/result.context";
import { getSessionUrlParams } from "@/app/(home)/engine/engine-utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  tooltip?: string;
  actionName?: string;
  tooltipSide?: "top" | "bottom" | "left" | "right";
};

export const ResetButton = ({
  className,
  tooltip = "Restart",
  actionName = "restart",
  tooltipSide = "top",
}: Props) => {
  const result = useOptionalResult();
  const { resetSession } = useEngineActions();
  const { isPending, pendingAction } = useEngineConfig();
  const isMobile = useMediaQuery("(max-width: 1024px)");

  const isResetPending = isPending && pendingAction === actionName;

  const handleReset = () => {
    const urlUpdates = getSessionUrlParams(result?.session ?? null);
    resetSession({ showOverlay: false, actionName, urlUpdates });
  };

  return (
    <Tooltip open={isMobile ? false : undefined}>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleReset}
          className={cn("text-muted-foreground", className)}
          disabled={isResetPending}
        >
          <RestartIcon className={isResetPending ? "opacity-60" : ""} />
        </Button>
      </TooltipTrigger>
      <TooltipContent side={tooltipSide}>
        <span>{tooltip}</span>
      </TooltipContent>
    </Tooltip>
  );
};

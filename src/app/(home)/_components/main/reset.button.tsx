"use client";

import {
  ResponsiveTooltip,
  ResponsiveTooltipContent,
  ResponsiveTooltipTrigger,
} from "@/components/responsive-tooltip";
import { Button } from "@/components/ui/button";
import { RestartIcon } from "@/components/restart.icon";
import { useEngineActions } from "@/app/(home)/engine/engine.context";
import { useMediaQuery } from "@/hooks/use-media-query";

export const ResetButton = () => {
  const { resetSession } = useEngineActions();
  const isMobile = useMediaQuery("(max-width: 1024px)");

  return (
    <ResponsiveTooltip>
      <ResponsiveTooltipTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => resetSession({ showOverlay: false })}
          className="text-muted-foreground"
        >
          <RestartIcon />
        </Button>
      </ResponsiveTooltipTrigger>
      <ResponsiveTooltipContent side={isMobile ? "right" : "top"}>
        <span>Restart</span>
      </ResponsiveTooltipContent>
    </ResponsiveTooltip>
  );
};

"use client";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { ChevronIcon } from "@/components/chevron.icon";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useOptionalResult } from "./result.context";
import { TopLoader } from "@/components/top-loader";
import {
  useEngineActions,
  useEngineConfig,
} from "@/app/(home)/engine/engine.context";

type Props = {
  className?: string;
  inResults?: boolean;
  nextTextId?: string | null;
};

export const NextTextButton = ({
  className,
  inResults,
  nextTextId: nextTextIdProp,
}: Props) => {
  const result = useOptionalResult();
  const { updateURL } = useEngineActions();
  const { isPending, pendingAction } = useEngineConfig();
  const isMobile = useMediaQuery("(max-width: 1024px)");

  const isNextPending = isPending && pendingAction === "next";
  const nextTextId = nextTextIdProp ?? result?.nextText?._id.toString() ?? null;

  if (!nextTextId) return null;

  return (
    <>
      <Tooltip open={isMobile ? false : undefined}>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            disabled={isNextPending}
            className={cn("text-foreground", className)}
            onClick={() => updateURL({ id: nextTextId, sid: null }, "next")}
          >
            <ChevronIcon className={isNextPending ? "opacity-60" : ""} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side={inResults ? "bottom" : "top"}>
          <span>Next Text</span>
        </TooltipContent>
      </Tooltip>
    </>
  );
};
